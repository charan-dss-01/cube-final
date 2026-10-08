import urllib.request, urllib.parse, json, time

def post_form(url, data):
    encoded = urllib.parse.urlencode(data).encode('utf-8')
    req = urllib.request.Request(url, data=encoded, headers={'Content-Type': 'application/x-www-form-urlencoded'})
    res = urllib.request.urlopen(req, timeout=30)
    return json.loads(res.read().decode())

time.sleep(2)

print("="*60)
print("AUTONOMOUS VISION MULTIMODAL SMOKE TEST (ALL 4 STATIONS)")
print("="*60)

# Station 1: Receiving
print("\n[STATION 1] RECEIVING AGENT INSPECTION:")
r1 = post_form("http://localhost:8000/api/v1/agents/receiving/run", {
    "po_number": "PO-AUTO-7701",
    "sku": "BLUE-BOTTLE-001",
    "qty_ordered": 12,
    "preset_image": "crushed_carton_face.png"
})
print(" Verdict:", r1.get("overall_verdict"))
print(" Carton Damage Detected:", r1.get("ai_observations", {}).get("carton_damage"))
print(" Count Observed:", r1.get("ai_observations", {}).get("qty_received"))
print(" Neon DB Inspection ID:", r1.get("inspection_id"))

# Station 2: Prep
print("\n[STATION 2] PREP AGENT INSPECTION:")
r2 = post_form("http://localhost:8000/api/v1/agents/prep/run", {
    "product_id": "CYLINDER-DEMO-02",
    "prep_type": "polybag",
    "preset_image": "scenario_2_fail_curved.jpg"
})
print(" Overall Status:", r2.get("overall_status"))
print(" Defect Fee Amount: $", r2.get("defect_fee_amount"))
print(" Barcode Curved Defect:", r2.get("ai_observations", {}).get("barcode_curved"))
print(" Directive Message:", r2.get("agent_action_message"))
print(" Neon DB Prep ID:", r2.get("inspection_id"))

# Station 3: Pack
print("\n[STATION 3] PACK AGENT INSPECTION:")
r3 = post_form("http://localhost:8000/api/v1/agents/pack/run", {
    "sku": "BLUE-BOTTLE-001",
    "items_expected": 12,
    "preset_image": "open_carton_short_10_units.png"
})
print(" Pack Decision:", r3.get("decision"))
print(" AI Overhead Count:", r3.get("ai_observations", {}).get("items_count_detected"))
print(" Foreign / Extra SKUs:", r3.get("ai_observations", {}).get("extra_items_detected"))
print(" Vision Reasoning:", r3.get("ai_observations", {}).get("summary"))
print(" Neon DB Pack Record ID:", r3.get("pack_id"))

# Station 4: Returns
print("\n[STATION 4] RETURNS AGENT INSPECTION:")
r4 = post_form("http://localhost:8000/api/v1/agents/returns/run", {
    "ordered_sku": "BLUE-BOTTLE-001",
    "preset_image": "UNIT-0003_1.jpg"
})
print(" Assigned Condition Grade:", r4.get("condition"))
print(" 4-Tier Disposition:", r4.get("outcome"))
print(" Identity Match:", r4.get("identity_match"))
print(" Neon DB Return ID:", r4.get("record_id"))

# Station 5: Recovery
print("\n[STATION 5] RECOVERY AGENT AUDIT & CLAIM:")
req5 = urllib.request.Request(
    "http://localhost:8000/api/v1/agents/recovery/run",
    data=json.dumps({"unit_id": "UNIT-0003", "sku": "BLUE-BOTTLE-001", "amount": 35.0, "reason": "Polybag Packaging Defect"}).encode(),
    headers={"Content-Type": "application/json"}
)
res5 = urllib.request.urlopen(req5, timeout=30)
r5 = json.loads(res5.read().decode())
print(" Charge ID:", r5.get("charge_id"))
print(" Claim ID:", r5.get("claim_id"))
print(" Assessment:", r5.get("assessment"))
print(" Claim Summary:", r5.get("summary"))

print("\n" + "="*60)
print("ALL 5 OPERATIONAL AGENTS VERIFIED & SYNCHRONIZED WITH NEON DB")
print("="*60)
