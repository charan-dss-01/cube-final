import json
from backend.config import settings
from backend.gemini_provider import inspect_gemini
from backend.provider import local_reference_inputs, local_image, SYSTEM
from backend.schemas import VisionObservation
from pathlib import Path
import requests

catalogue = [
    {"sku": "BLUE-BOTTLE-001", "name": "Blue Water Bottle 1L", "category": "bottles"},
    {"sku": "RED-BOTTLE-001", "name": "Red Water Bottle 1L", "category": "bottles"}
]
base_dir = Path(__file__).resolve().parent.parent
primary_img_path = base_dir / "cube26-rcv-0286-sharonmedithi0304" / "submissions" / "sharonmedithi0304" / "agent" / "fixtures" / "correct_blue_bottle.png"
primary_bytes = primary_img_path.read_bytes()
references = [("BLUE-BOTTLE-001", primary_bytes), ("RED-BOTTLE-001", primary_bytes)]

refs = local_reference_inputs(catalogue, references)
schema = VisionObservation.model_json_schema()
schema["$defs"]["Instance"]["required"] += ["source_image", "occlusion"]
schema["$defs"]["Instance"]["properties"]["candidates"]["items"] = {
    "type": "string",
    "enum": sorted(p["sku"] for p in catalogue),
}

def supported(value):
    if isinstance(value, list):
        return [supported(v) for v in value]
    if not isinstance(value, dict):
        return value
    result = {k: supported(v) for k, v in value.items() if k not in {"default", "minLength", "maxLength"}}
    if "const" in result:
        result["enum"] = [result.pop("const")]
    return result

parts = []
for sku, raw in refs:
    parts.extend([
        {"text": f"IDENTITY REFERENCE ONLY: {sku}."},
        {"inlineData": {"mimeType": "image/jpeg", "data": local_image(raw, 768)}}
    ])
parts.extend([
    {"text": "PRIMARY COUNTING VIEW: " + json.dumps(catalogue)},
    {"inlineData": {"mimeType": "image/jpeg", "data": local_image(primary_bytes, 1600)}}
])

api_key = os.environ.get('GEMINI_API_KEY', '')
url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={api_key}'

# Test A: Test payload without responseJsonSchema
pa = {
    "systemInstruction": {"parts": [{"text": SYSTEM}]},
    "contents": [{"role": "user", "parts": parts}],
    "generationConfig": {
        "responseMimeType": "application/json"
    }
}
ra = requests.post(url, json=pa)
print("Without schema:", ra.status_code, ra.text[:100])

# Test B: Test with schema
pb = {
    "systemInstruction": {"parts": [{"text": SYSTEM}]},
    "contents": [{"role": "user", "parts": parts}],
    "generationConfig": {
        "responseMimeType": "application/json",
        "responseJsonSchema": supported(schema)
    }
}
rb = requests.post(url, json=pb)
print("With schema:", rb.status_code, rb.text[:200])
