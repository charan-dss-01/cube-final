"""
CUBE Logistics — Gemini Multi-Key Round-Robin & Resilient Fallback Manager

Centralized, thread-safe manager that distributes requests across multiple
configured Gemini API keys using round-robin rotation, with automatic fallback
for rate limits (HTTP 429 / RESOURCE_EXHAUSTED) and quota exhaustion.

Security guarantees:
  - API keys are read server-side only from environment variables.
  - Keys are never logged in full, exposed to the frontend, or saved in artifacts.
  - Non-secret slot identifiers (e.g. key_slot_1) are used for telemetry and logging.
"""

import os
import re
import time
import logging
import threading
from typing import List, Dict, Tuple, Optional, Any, Callable, TypeVar

logger = logging.getLogger("gemini.key_manager")

T = TypeVar("T")


class GeminiKeyError(Exception):
    """Base exception for Gemini key manager issues."""
    pass


class GeminiQuotaExhaustedError(GeminiKeyError):
    """Raised when all configured Gemini keys have exceeded quota or are in rate-limit cooldown."""
    pass


class GeminiInvalidKeyError(GeminiKeyError):
    """Raised when a specific key is rejected as invalid/unauthenticated."""
    pass


class KeySlot:
    """Represents a single Gemini API key slot and its live health telemetry."""

    def __init__(self, slot_id: str, api_key: str):
        self.slot_id: str = slot_id
        self._api_key: str = api_key
        self.is_valid: bool = True
        self.cooldown_until: float = 0.0
        self.failure_count: int = 0
        self.success_count: int = 0
        self.last_used: float = 0.0

    @property
    def api_key(self) -> str:
        return self._api_key

    @property
    def is_available(self) -> bool:
        if not self.is_valid:
            return False
        return time.time() >= self.cooldown_until

    def mark_success(self) -> None:
        self.success_count += 1
        self.last_used = time.time()
        # On success, clear failure counter and cooldown
        self.cooldown_until = 0.0

    def mark_rate_limited(self, cooldown_seconds: float = 60.0) -> None:
        self.failure_count += 1
        self.cooldown_until = time.time() + cooldown_seconds
        logger.warning(
            f"[GeminiKeyManager] {self.slot_id} marked temporarily UNAVAILABLE "
            f"(rate-limited / quota exhausted). Cooldown set for {cooldown_seconds:.1f}s."
        )

    def mark_invalid(self) -> None:
        self.is_valid = False
        logger.error(
            f"[GeminiKeyManager] {self.slot_id} marked permanently INVALID "
            f"(authentication failure / rejected credential)."
        )

    def __repr__(self) -> str:
        status = "VALID" if self.is_valid else "INVALID"
        if not self.is_available and self.is_valid:
            status = f"COOLDOWN({max(0, int(self.cooldown_until - time.time()))}s)"
        return f"<KeySlot {self.slot_id}: {status}, ok={self.success_count}, fail={self.failure_count}>"


class GeminiKeyManager:
    """
    Thread-safe Round-Robin Gemini Key Pool with automated failover.
    """

    def __init__(self, keys_override: Optional[List[str]] = None):
        self._lock = threading.Lock()
        self._index: int = 0
        self._slots: List[KeySlot] = []
        self._load_keys(keys_override)

    def _load_keys(self, keys_override: Optional[List[str]] = None) -> None:
        """Discover and load keys from environment variables or explicit override."""
        self._slots = []
        raw_keys: List[Tuple[int, str]] = []

        if keys_override is not None:
            for idx, k in enumerate(keys_override, 1):
                clean = k.strip() if isinstance(k, str) else ""
                if clean:
                    raw_keys.append((idx, clean))
        else:
            # Ensure .env file is loaded into os.environ if not already present
            try:
                from dotenv import load_dotenv
                from pathlib import Path
                base_dir = Path(__file__).resolve().parent.parent.parent
                for env_file in [base_dir / ".env", base_dir.parent / ".env", Path(".env")]:
                    if env_file.exists():
                        load_dotenv(dotenv_path=env_file, override=False)
            except Exception:
                pass

            # 1. Scan for indexed environment variables GEMINI_API_KEY_1, _2, etc.
            indexed_pattern = re.compile(r"^GEMINI_API_KEY_(\d+)$")
            found_indices = []

            for env_name, env_val in os.environ.items():
                m = indexed_pattern.match(env_name)
                if m and env_val and env_val.strip():
                    idx = int(m.group(1))
                    raw_keys.append((idx, env_val.strip()))
                    found_indices.append(idx)

            # Sort indexed keys naturally (1, 2, 3...)
            raw_keys.sort(key=lambda item: item[0])

            # 2. Backward compatibility fallback: check GEMINI_API_KEY if no indexed keys or as additional slot
            legacy_key = os.environ.get("GEMINI_API_KEY", "").strip()
            if legacy_key:
                # Add legacy key if not already present
                existing_vals = {k for _, k in raw_keys}
                if legacy_key not in existing_vals:
                    next_idx = (max(found_indices) + 1) if found_indices else 1
                    raw_keys.append((next_idx, legacy_key))

        for idx, k in raw_keys:
            slot_id = f"key_slot_{idx}"
            self._slots.append(KeySlot(slot_id, k))

        count = len(self._slots)
        if count > 0:
            logger.info(f"[GeminiKeyManager] Initialized pool with {count} configured API key slot(s).")
        else:
            logger.warning("[GeminiKeyManager] No valid Gemini API keys discovered in environment.")

    def reload(self, keys_override: Optional[List[str]] = None) -> None:
        """Reload keys (useful for tests and dynamic environment updates)."""
        with self._lock:
            self._load_keys(keys_override)
            self._index = 0

    @property
    def total_keys(self) -> int:
        return len(self._slots)

    @property
    def available_keys_count(self) -> int:
        return sum(1 for s in self._slots if s.is_available)

    def get_next_key(self) -> Tuple[str, str]:
        """
        Selects the next eligible API key in round-robin sequence.
        Returns: (slot_id, api_key)
        Raises: GeminiQuotaExhaustedError if no keys are available.
        """
        with self._lock:
            if not self._slots:
                raise GeminiKeyError("No Gemini API keys are configured in backend environment variables.")

            # Filter for keys that are valid and not currently cooling down
            valid_slots = [s for s in self._slots if s.is_valid]
            if not valid_slots:
                raise GeminiInvalidKeyError("All configured Gemini API keys have been marked invalid.")

            available_slots = [s for s in valid_slots if s.is_available]

            if not available_slots:
                # All valid keys are currently in cooldown. Find the one with earliest cooldown expiry.
                earliest = min(valid_slots, key=lambda s: s.cooldown_until)
                wait_seconds = max(0.1, earliest.cooldown_until - time.time())
                raise GeminiQuotaExhaustedError(
                    f"All {len(self._slots)} Gemini API keys are temporarily rate-limited or quota exhausted. "
                    f"Earliest slot ({earliest.slot_id}) will recover in {wait_seconds:.1f}s."
                )

            # Round-robin selection among available slots
            slot_to_use = self._slots[self._index % len(self._slots)]
            self._index = (self._index + 1) % len(self._slots)

            # If the selected slot is in cooldown, pick the next available slot
            if not slot_to_use.is_available:
                slot_to_use = available_slots[0]

            slot_to_use.last_used = time.time()
            return slot_to_use.slot_id, slot_to_use.api_key

    def mark_rate_limited(self, slot_id: str, cooldown_seconds: float = 60.0) -> None:
        """Mark a slot temporarily unavailable due to 429 or quota limit."""
        with self._lock:
            for s in self._slots:
                if s.slot_id == slot_id:
                    s.mark_rate_limited(cooldown_seconds)
                    break

    def mark_invalid(self, slot_id: str) -> None:
        """Mark a slot permanently invalid due to authentication rejection."""
        with self._lock:
            for s in self._slots:
                if s.slot_id == slot_id:
                    s.mark_invalid()
                    break

    def mark_success(self, slot_id: str) -> None:
        """Record a successful operation for a slot."""
        with self._lock:
            for s in self._slots:
                if s.slot_id == slot_id:
                    s.mark_success()
                    break

    def get_status_summary(self) -> List[Dict[str, Any]]:
        """Return non-sensitive telemetry about all key slots."""
        with self._lock:
            return [
                {
                    "slot_id": s.slot_id,
                    "is_valid": s.is_valid,
                    "is_available": s.is_available,
                    "success_count": s.success_count,
                    "failure_count": s.failure_count,
                    "cooldown_remaining_sec": max(0.0, s.cooldown_until - time.time()),
                }
                for s in self._slots
            ]

    def execute_with_retry(
        self,
        operation: Callable[[str, str], T],
        max_rotations: Optional[int] = None,
        timeout_policy: Optional[Callable[[Exception], bool]] = None
    ) -> T:
        """
        Executes a callable with automatic round-robin key rotation on rate-limits/quotas.

        Callable signature: operation(api_key: str, slot_id: str) -> T

        Error handling rules:
          - HTTP 429 / RESOURCE_EXHAUSTED / Quota exceeded:
            Marks slot as cooled down, rotates to next eligible key and retries immediately.
          - HTTP 400 with API_KEY_INVALID / 403 Forbidden:
            Marks slot permanently invalid, rotates to next key.
          - HTTP 400 Bad Request (malformed schema / prompt error):
            Raises immediately without wasteful cross-key retries.
          - Transient HTTP 503 / 500:
            Brief backoff and retries bounded by rotation limit.
        """
        if not self._slots:
            raise GeminiKeyError("No Gemini API keys are configured.")

        limit = max_rotations if max_rotations is not None else max(1, len(self._slots))
        attempts = 0
        tried_slots = set()
        last_error = None

        while attempts < limit:
            attempts += 1
            try:
                slot_id, api_key = self.get_next_key()
            except GeminiQuotaExhaustedError as eq:
                logger.error(f"[GeminiKeyManager] Cannot proceed: {eq}")
                raise eq

            tried_slots.add(slot_id)
            logger.info(f"[GeminiKeyManager] Dispatching Gemini request using {slot_id} (attempt {attempts}/{limit})")

            try:
                result = operation(api_key, slot_id)
                self.mark_success(slot_id)
                return result

            except Exception as e:
                last_error = e
                err_str = str(e)

                # 1. Detect Rate Limit / Quota Exhaustion (HTTP 429 / RESOURCE_EXHAUSTED)
                is_quota = (
                    "429" in err_str
                    or "RESOURCE_EXHAUSTED" in err_str
                    or "quota" in err_str.lower()
                    or "rate limit" in err_str.lower()
                )
                if is_quota:
                    logger.warning(
                        f"[GeminiKeyManager] Rate-limit/quota encountered on {slot_id}. Rotating to next key..."
                    )
                    self.mark_rate_limited(slot_id, cooldown_seconds=60.0)
                    continue

                # 2. Detect Authentication Rejection / Invalid API Key
                is_invalid = (
                    "API_KEY_INVALID" in err_str
                    or "api key not valid" in err_str.lower()
                    or "forbidden" in err_str.lower()
                    or "403" in err_str
                )
                if is_invalid:
                    logger.error(
                        f"[GeminiKeyManager] Authentication failed on {slot_id}. Marking key invalid."
                    )
                    self.mark_invalid(slot_id)
                    continue

                # 3. Detect Non-Retryable Client Errors (e.g. malformed prompt or syntax)
                is_client_syntax_error = (
                    "400" in err_str
                    and not is_invalid
                    and not is_quota
                    and ("invalid_argument" in err_str.lower() or "bad request" in err_str.lower())
                )
                if is_client_syntax_error:
                    logger.error(
                        f"[GeminiKeyManager] Request rejected due to client syntax error: {err_str[:200]}. "
                        "Halting retries across other keys."
                    )
                    raise e

                # 4. Detect Transient Server Errors (HTTP 500, 503, gateway)
                is_transient = "503" in err_str or "500" in err_str or "overloaded" in err_str.lower()
                if is_transient:
                    logger.warning(
                        f"[GeminiKeyManager] Transient server error on {slot_id}: {err_str[:150]}. Backing off and retrying..."
                    )
                    time.sleep(1.0)
                    continue

                # 5. Check optional custom timeout policy
                if timeout_policy and timeout_policy(e):
                    logger.warning(f"[GeminiKeyManager] Custom policy matched retry on {slot_id}: {err_str[:150]}")
                    time.sleep(1.0)
                    continue

                # For unknown exceptions, raise directly
                raise e

        # If rotation loop exhausts all allowed attempts
        raise GeminiQuotaExhaustedError(
            f"All {len(tried_slots)} attempted Gemini API key slot(s) were exhausted or rate-limited. "
            f"Last error: {last_error}"
        )


# Global singleton instance for the backend process
gemini_key_manager = GeminiKeyManager()
