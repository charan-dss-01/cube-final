import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load backend .env
load_dotenv(Path(__file__).parent / ".env")

from app.db.database import SessionLocal
from app.agents.prep_manager import PrepManagerAgent
from app.db.models import Product, Inspection

def run_prep_live_gemini_test():
    print("=" * 70)
    print(" AGENTPREP (PREP MANAGER) — REAL GEMINI VISION TEST ")
    print("=" * 70)
    
    agent = PrepManagerAgent()
    print(f"Vision Mode: {agent.vision_adapter.get_mode_description()}")
    
    db = SessionLocal()
    try:
        # Check product in DB
        prod = db.query(Product).first()
        if not prod:
            print("[!] No product found in Neon DB, please check seed.")
            return
        
        print(f"Inspecting Product: {prod.name} (ID: {prod.id}, SKU: {prod.sku})")
        
        # Scenario 1: Pass image
        img_pass = os.path.abspath("sample_data/scenario_1_pass.jpg")
        print(f"\n[Test Case 1] Inspecting Pass Sample: {os.path.basename(img_pass)}")
        insp_pass = agent.run_inspection(
            db=db,
            product_id=prod.id,
            image_paths=[img_pass],
            unit_id="UNIT-0001",
            work_order_id="WO-LIVE-001",
            operator_name="Operator Charan",
            view_angles=["front", "back"]
        )
        print(f"-> Inspection ID: {insp_pass.id}")
        print(f"-> Overall Status: {insp_pass.overall_status}")
        print(f"-> Action Type:    {insp_pass.agent_action_type}")
        print(f"-> Action Msg:     {insp_pass.agent_action_message}")
        print(f"-> Checks Run:     {len(insp_pass.checks)}")
        for c in insp_pass.checks:
            print(f"   * {c.rule_name:<30}: {c.status:<8} (Confidence: {c.confidence:.2f}) | {c.reason[:60]}")
            
        # Scenario 2: Fail Curved Barcode image
        img_fail = os.path.abspath("sample_data/scenario_2_fail_curved.jpg")
        print(f"\n[Test Case 2] Inspecting Curved Barcode Sample: {os.path.basename(img_fail)}")
        insp_fail = agent.run_inspection(
            db=db,
            product_id=prod.id,
            image_paths=[img_fail],
            unit_id="UNIT-0002",
            work_order_id="WO-LIVE-002",
            operator_name="Operator Charan",
            view_angles=["front", "back"]
        )
        print(f"-> Inspection ID: {insp_fail.id}")
        print(f"-> Overall Status: {insp_fail.overall_status}")
        print(f"-> Action Type:    {insp_fail.agent_action_type}")
        print(f"-> Action Msg:     {insp_fail.agent_action_message}")
        print(f"-> Checks Run:     {len(insp_fail.checks)}")
        for c in insp_fail.checks:
            print(f"   * {c.rule_name:<30}: {c.status:<8} (Confidence: {c.confidence:.2f}) | {c.reason[:60]}")

        print("\n" + "=" * 70)
        print(" PREP AGENT GEMINI LIVE TEST COMPLETED SUCCESSFULLY! ")
        print("=" * 70)
    finally:
        db.close()

if __name__ == "__main__":
    run_prep_live_gemini_test()
