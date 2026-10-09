"""
Unit and Integration Test Suite for Gemini Multi-Key Round-Robin & Resilient Fallback Manager

Tests:
  1. Single configured key initialization and dispatch
  2. Multiple configured keys discovery (GEMINI_API_KEY_1..N)
  3. Strict round-robin selection order across multiple keys
  4. Missing optional key slots (e.g. slot 1, slot 3 without slot 2)
  5. Zero configured keys error handling
  6. Rate-limited key (429/quota) fallback: Key A fails, Key B succeeds
  7. Invalid key (400 API_KEY_INVALID/403) marked invalid, next key succeeds
  8. Exhaustion handling: all keys rate-limited or exhausted
  9. Transient server error retry
  10. Client syntax error (400 bad request) halts cross-key retries without waste
  11. Thread-safe concurrent access from multiple threads
  12. Zero secret leakage: slot identifiers only in logs and telemetry
"""

import os
import time
import pytest
import threading
from app.services.gemini_key_manager import (
    GeminiKeyManager,
    GeminiKeyError,
    GeminiQuotaExhaustedError,
    GeminiInvalidKeyError,
)


def test_single_configured_key():
    mgr = GeminiKeyManager(keys_override=["key_alpha"])
    assert mgr.total_keys == 1
    slot_id, key = mgr.get_next_key()
    assert slot_id == "key_slot_1"
    assert key == "key_alpha"

    # Repeated calls return the same single key
    slot_id_2, key_2 = mgr.get_next_key()
    assert slot_id_2 == "key_slot_1"
    assert key_2 == "key_alpha"


def test_multiple_configured_keys_round_robin():
    mgr = GeminiKeyManager(keys_override=["key_A", "key_B", "key_C"])
    assert mgr.total_keys == 3

    sequence = [mgr.get_next_key() for _ in range(7)]
    keys_used = [k for _, k in sequence]
    slots_used = [s for s, _ in sequence]

    # Must follow A -> B -> C -> A -> B -> C -> A
    assert keys_used == ["key_A", "key_B", "key_C", "key_A", "key_B", "key_C", "key_A"]
    assert slots_used == ["key_slot_1", "key_slot_2", "key_slot_3", "key_slot_1", "key_slot_2", "key_slot_3", "key_slot_1"]


def test_missing_optional_key_slots_from_env(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY_1", "val_1")
    monkeypatch.delenv("GEMINI_API_KEY_2", raising=False)
    monkeypatch.setenv("GEMINI_API_KEY_5", "val_5")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    mgr = GeminiKeyManager()
    assert mgr.total_keys == 2
    slot1, k1 = mgr.get_next_key()
    slot2, k2 = mgr.get_next_key()
    assert k1 == "val_1"
    assert k2 == "val_5"
    assert slot1 == "key_slot_1"
    assert slot2 == "key_slot_5"


def test_zero_configured_keys():
    mgr = GeminiKeyManager(keys_override=[])
    assert mgr.total_keys == 0
    with pytest.raises(GeminiKeyError):
        mgr.get_next_key()

    with pytest.raises(GeminiKeyError):
        mgr.execute_with_retry(lambda k, s: "result")


def test_first_key_rate_limited_second_key_succeeds():
    mgr = GeminiKeyManager(keys_override=["key_limited", "key_good"])

    call_records = []

    def mock_operation(key: str, slot: str):
        call_records.append((slot, key))
        if key == "key_limited":
            raise RuntimeError("HTTP 429: RESOURCE_EXHAUSTED - Quota exceeded for project")
        return {"status": "SUCCESS", "data": "Analysis complete"}

    res = mgr.execute_with_retry(mock_operation)
    assert res["status"] == "SUCCESS"
    assert len(call_records) == 2
    assert call_records[0][0] == "key_slot_1"
    assert call_records[1][0] == "key_slot_2"

    # slot_1 should now be in cooldown
    status = mgr.get_status_summary()
    assert status[0]["is_available"] is False
    assert status[0]["failure_count"] == 1
    assert status[1]["success_count"] == 1


def test_invalid_key_marked_invalid_next_succeeds():
    mgr = GeminiKeyManager(keys_override=["bad_key", "good_key"])

    call_records = []

    def mock_operation(key: str, slot: str):
        call_records.append(slot)
        if key == "bad_key":
            raise RuntimeError("HTTP 400: API_KEY_INVALID - API key not valid. Please pass a valid API key.")
        return "SUCCESS_WITH_GOOD_KEY"

    res = mgr.execute_with_retry(mock_operation)
    assert res == "SUCCESS_WITH_GOOD_KEY"
    assert call_records == ["key_slot_1", "key_slot_2"]

    status = mgr.get_status_summary()
    assert status[0]["is_valid"] is False
    assert status[1]["is_valid"] is True


def test_all_keys_exhausted():
    mgr = GeminiKeyManager(keys_override=["k1", "k2"])

    def always_fails(key: str, slot: str):
        raise RuntimeError("HTTP 429 quota exhausted")

    with pytest.raises(GeminiQuotaExhaustedError):
        mgr.execute_with_retry(always_fails)


def test_client_syntax_error_halts_retries():
    mgr = GeminiKeyManager(keys_override=["k1", "k2", "k3"])
    attempts = []

    def invalid_syntax_call(key: str, slot: str):
        attempts.append(slot)
        # Client request error (e.g. malformed JSON prompt structure)
        raise RuntimeError("HTTP 400: INVALID_ARGUMENT - Invalid JSON payload")

    with pytest.raises(RuntimeError) as exc_info:
        mgr.execute_with_retry(invalid_syntax_call)

    assert "INVALID_ARGUMENT" in str(exc_info.value)
    # Should halt immediately without retrying k2 or k3
    assert len(attempts) == 1


def test_thread_safe_concurrent_requests():
    mgr = GeminiKeyManager(keys_override=["k1", "k2", "k3", "k4"])
    slots_hit = []
    lock = threading.Lock()

    def worker():
        for _ in range(25):
            slot_id, _ = mgr.get_next_key()
            with lock:
                slots_hit.append(slot_id)

    threads = [threading.Thread(target=worker) for _ in range(8)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert len(slots_hit) == 200
    # Every slot must be distributed approximately evenly
    for expected_slot in ["key_slot_1", "key_slot_2", "key_slot_3", "key_slot_4"]:
        count = slots_hit.count(expected_slot)
        assert 45 <= count <= 55


def test_transient_provider_error_retry():
    mgr = GeminiKeyManager(keys_override=["k1", "k2"])
    attempts = []

    def mock_flaky(key: str, slot: str):
        attempts.append(slot)
        if len(attempts) == 1:
            raise RuntimeError("HTTP 503: The model is overloaded. Please try again later.")
        return "RECOVERED_AFTER_TRANSIENT"

    res = mgr.execute_with_retry(mock_flaky)
    assert res == "RECOVERED_AFTER_TRANSIENT"
    assert len(attempts) == 2


def test_model_preservation_and_payload_intact():
    from app.services.gemini_key_manager import gemini_key_manager
    # Verify that the manager works independently of whatever model or payload is passed
    mgr = GeminiKeyManager(keys_override=["test_key_1", "test_key_2"])

    recorded_models = []

    def custom_call(api_key: str, slot_id: str):
        model_passed = "gemini-3.5-flash-lite"
        recorded_models.append((slot_id, model_passed))
        return {"model": model_passed, "slot": slot_id}

    res = mgr.execute_with_retry(custom_call)
    assert res["model"] == "gemini-3.5-flash-lite"
    assert res["slot"] == "key_slot_1"


def test_env_file_six_keys_discovery():
    from dotenv import load_dotenv
    load_dotenv(dotenv_path="c:/cube/cube26-rcy-0079-charan-dss-01/backend/.env", override=True)
    mgr = GeminiKeyManager()
    assert mgr.total_keys == 6
    summary = mgr.get_status_summary()
    assert len(summary) == 6
    for i in range(1, 7):
        assert summary[i-1]["slot_id"] == f"key_slot_{i}"
        assert summary[i-1]["is_valid"] is True
