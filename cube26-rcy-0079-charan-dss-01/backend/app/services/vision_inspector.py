import os
import re
import json
import base64
import requests
from pathlib import Path
from typing import Optional, Dict, Any

from app.config.settings import settings

CANDIDATE_MODELS = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-flash-latest"]

def _clean_json_text(text: str) -> str:
    """Strip markdown fencing if present."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text

from app.services.gemini_key_manager import gemini_key_manager

def _call_gemini_vision(prompt: str, image_path: str, timeout: float = 25.0) -> Optional[Dict[str, Any]]:
    p = Path(image_path)
    if not p.exists() or not p.is_file():
        return None

    if gemini_key_manager.total_keys == 0:
        print("[Gemini Vision Warning]: No Gemini API keys configured, skipping live vision analysis.")
        return None

    mime = "image/png" if p.suffix.lower() == ".png" else "image/jpeg"
    encoded = base64.b64encode(p.read_bytes()).decode("utf-8")

    body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": mime, "data": encoded}}
                ]
            }
        ],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.0
        }
    }

    def _perform_vision_request(api_key: str, slot_id: str) -> Optional[Dict[str, Any]]:
        for model in CANDIDATE_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            try:
                resp = requests.post(url, json=body, timeout=timeout)
                if resp.status_code == 200:
                    res_data = resp.json()
                    parts = res_data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        cleaned = _clean_json_text(parts[0]["text"])
                        return json.loads(cleaned)
                elif resp.status_code in (429, 503):
                    # Raise exception to trigger key rotation
                    raise RuntimeError(f"HTTP {resp.status_code} quota/rate limit on {model}: {resp.text[:150]}")
                elif resp.status_code == 404:
                    continue
                elif resp.status_code in (400, 403) and ("API_KEY_INVALID" in resp.text or "key not valid" in resp.text.lower()):
                    raise RuntimeError(f"API_KEY_INVALID HTTP {resp.status_code}: {resp.text[:150]}")
                else:
                    print(f"[Gemini Vision API Error {resp.status_code} on {model} with {slot_id}]: {resp.text[:150]}")
                    break
            except requests.exceptions.RequestException as err:
                err_str = str(err)
                if "Read timed out" in err_str or "ConnectTimeout" in err_str:
                    print(f"[Gemini Vision Timeout on {model} with {slot_id}]: {err_str[:100]}")
                    continue
                raise err
        return None

    try:
        return gemini_key_manager.execute_with_retry(_perform_vision_request)
    except Exception as e:
        print(f"[Gemini Vision Execution Notice]: {e}")
        return None


def inspect_prep_photo(image_path: str, product_id: str, prep_type: str = "polybag") -> Dict[str, Any]:
    prompt = f"""You are an autonomous AI Prep Compliance Inspector for Amazon FBA and enterprise fulfillment.
Inspect this prepped product image carefully for any defects.
Target Product: '{product_id}', Intended Prep: '{prep_type}'.

Evaluate compliance rigorously:
1. Polybag Sealing: Is the polybag securely heat-sealed or taped with opening < 3 inches? (true/false)
2. Suffocation Warning: Is a clear suffocation warning label (text or warning icon) visible on the polybag? (true/false)
3. Barcode Viability: Is the scannable barcode label mounted on a FLAT plane, or is it curved around a cylinder/bottle making it unscannable? (barcode_curved: true/false, barcode_scannable: true/false)
4. Overall Status:
   - If barcode is curved around a cylinder or bottle: compliance_status must be "CORRECT_AND_RESCAN" or "FAIL", defect_fee 25.0
   - If suffocation warning is missing or polybag is unsealed: compliance_status must be "FAIL", defect_fee 35.0
   - Only if ALL prep requirements are completely satisfied: compliance_status must be "PASS", defect_fee 0.0

Return ONLY JSON:
{{
  "polybag_sealed": <bool>,
  "suffocation_warning_present": <bool>,
  "barcode_curved": <bool>,
  "barcode_scannable": <bool>,
  "compliance_status": "<PASS or FAIL or CORRECT_AND_RESCAN>",
  "defect_fee": <float>,
  "action_message": "<precise summary of what was detected in the photo>"
}}
"""
    result = _call_gemini_vision(prompt, image_path)
    if result:
        return result
    return {
        "polybag_sealed": False,
        "suffocation_warning_present": False,
        "barcode_curved": True,
        "barcode_scannable": False,
        "compliance_status": "CORRECT_AND_RESCAN",
        "defect_fee": 25.0,
        "action_message": "Automated vision inspection inconclusive or server unavailable. Operator physical inspection required."
    }


def inspect_pack_photo(image_path: str, expected_sku: str, expected_count: int, channel: str = "FBA") -> Dict[str, Any]:
    prompt = f"""You are an autonomous AI Pack Verification Inspector for an enterprise packing station.
Inspect this overhead camera photograph of an open outbound shipping carton.
Manifest Line: SKU '{expected_sku}', Expected Units: {expected_count}, Channel: {channel}.

Carefully analyze the image:
1. Count the visible physical units corresponding to the ordered item.
2. Check for extraneous, unmanifested items or rogue foreign SKUs.
3. Check for protective void fill / dunnage (air pillows, kraft paper, bubble wrap).
4. Check packaging integrity.
5. If observed_item_count != {expected_count} or extra items found or missing required packing: decision must be "stop_and_fix". Only if exactly {expected_count} units are present without defects: decision must be "seal".

Return ONLY JSON:
{{
  "observed_item_count": <int>,
  "has_extra_items": <bool>,
  "dunnage_present": <bool>,
  "packaging_intact": <bool>,
  "decision": "<seal or stop_and_fix>",
  "summary": "<precise sentence detailing what is visible in the packing container>"
}}
"""
    result = _call_gemini_vision(prompt, image_path)
    if result:
        return result
    return {
        "observed_item_count": 0,
        "has_extra_items": False,
        "dunnage_present": False,
        "packaging_intact": False,
        "decision": "stop_and_fix",
        "summary": "Vision inspection inconclusive or server unavailable. Operator manual count check required before sealing."
    }


def inspect_return_photo(image_path: str, ordered_sku: str, return_reason: str) -> Dict[str, Any]:
    prompt = f"""You are an autonomous AI Returns Assessment Inspector for an enterprise reverse logistics facility.
Inspect this customer-returned unit photograph.
Original Order SKU: '{ordered_sku}'. Customer Return Reason: '{return_reason}'.

Perform physical intake inspection:
1. Identity: Does the physical item shown match catalog SKU '{ordered_sku}'?
2. Cosmetic State: Is there noticeable damage, scratches, dents, crushed parts, torn packaging, or missing parts?
3. Grade Condition: Classify into one of: 'Sellable - Like New', 'Sellable - Open Box', 'Customer Damaged', 'Defective', or 'Unacceptable / Fraud'.
4. Disposition: Recommend one of: 'restock', 'refurbish', 'liquidate', or 'dispose'.
   - If crushed, broken, or heavily damaged: damage_present must be true, disposition must be 'dispose' or 'liquidate'.
   - Only if completely undamaged and like-new: disposition can be 'restock'.

Return ONLY JSON:
{{
  "item_matches_sku": <bool>,
  "condition_grade": "<string>",
  "damage_present": <bool>,
  "completeness": <bool>,
  "recommended_disposition": "<restock or refurbish or liquidate or dispose>",
  "reasoning": "<concise description of physical observations supporting the grade>"
}}
"""
    result = _call_gemini_vision(prompt, image_path)
    if result:
        return result
    return {
        "item_matches_sku": False,
        "condition_grade": "Manual Review Required",
        "damage_present": True,
        "completeness": False,
        "recommended_disposition": "quarantine",
        "reasoning": "Automated vision inspection inconclusive or server unavailable. Routed to QA specialist."
    }
