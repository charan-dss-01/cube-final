import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from backend.config import settings
from backend.gemini_provider import inspect_gemini
from backend.policy import reconcile

def run_pack_live_gemini_test():
    print("=" * 70)
    print(" CUBE PACK MANAGER — REAL GEMINI VISION & POLICY TEST ")
    print("=" * 70)
    
    cfg = settings()
    print(f"Model Provider: {cfg.model_provider}")
    print(f"Target Model:   {cfg.gemini_model}")
    print(f"Provider Valid: {cfg.provider_configured}")
    
    # Primary image (e.g. blue bottle receiving fixture)
    primary_img_path = Path("cube26-rcv-0286-sharonmedithi0304-main/submissions/sharonmedithi0304/agent/fixtures/correct_blue_bottle.png")
    if not primary_img_path.exists():
        primary_img_path = Path(r"c:\cube\cube26-rcv-0286-sharonmedithi0304\submissions\sharonmedithi0304\agent\fixtures\correct_blue_bottle.png")
        
    print(f"Primary Pack Image: {primary_img_path.name} (exists: {primary_img_path.exists()})")
    primary_bytes = primary_img_path.read_bytes()
    
    # Catalogue definition
    catalogue = [
        {"sku": "BLUE-BOTTLE-001", "name": "Blue Water Bottle 1L", "category": "bottles"},
        {"sku": "RED-BOTTLE-001", "name": "Red Water Bottle 1L", "category": "bottles"}
    ]
    
    # Reference image for BLUE-BOTTLE-001
    references = [("BLUE-BOTTLE-001", primary_bytes), ("RED-BOTTLE-001", primary_bytes)]
    
    print("\nExecuting live multimodal inspect_gemini call...")
    try:
        observation, metadata = inspect_gemini(primary_bytes, catalogue, references)
        print(f"-> Gemini call SUCCESS! Latency: {metadata.get('latency_ms')} ms")
        print(f"-> Model Version: {metadata.get('model_version')}")
        print(f"-> View Sufficient:     {observation.view_sufficient}")
        print(f"-> Exact Count Known:   {observation.exact_count_known}")
        print(f"-> Quality Notes:       {observation.quality_notes}")
        print(f"-> Unresolved Notes:    {observation.unresolved}")
        print(f"-> Instances Counted:   {len(observation.instances)}")
        for idx, inst in enumerate(observation.instances, 1):
            print(f"   [{idx}] Candidates: {inst.candidates} | Verified: {inst.identity_verified} | Evidence: {inst.evidence}")
            
        lines = [{"sku": "BLUE-BOTTLE-001", "quantity": 1}]
        catalogue_skus = {"BLUE-BOTTLE-001", "RED-BOTTLE-001"}
        
        # Policy evaluation
        adjudication = reconcile(
            lines=lines,
            observation=observation,
            catalogue_skus=catalogue_skus,
            image_id="img-live-001"
        )
        print(f"-> Pack Decision Verdict: {adjudication.get('decision')}")
        print(f"-> Checks Evaluated:     {len(adjudication.get('checks', []))}")
        for chk in adjudication.get("checks", []):
            print(f"   * {chk['check_key']:<24}: {chk['verdict']:<8} | {chk['detail']}")
        print(f"-> Observed Quantities:   {adjudication.get('observed')}")
        
        # Persist to Neon DB pck_records table
        try:
            import psycopg2
            db_url = os.environ.get("DATABASE_URL", "postgresql://neondb_owner:npg_RQy5Uu0hlMmL@ep-fancy-union-b5a91lxa-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require")
            conn = psycopg2.connect(db_url)
            conn.autocommit = True
            cur = conn.cursor()
            record_id = "PCK-ATTEMPT-LIVE-001"
            record_data = {
                "unit_id": "UNIT-0001",
                "order_id": "ORD-LIVE-PACK-001",
                "decision": adjudication.get("decision"),
                "checks": adjudication.get("checks", []),
                "observed": adjudication.get("observed", []),
                "model_version": metadata.get("model_version"),
                "latency_ms": metadata.get("latency_ms")
            }
            cur.execute("""
                INSERT INTO pck_records (id, organization_id, kind, data, version)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    data = EXCLUDED.data,
                    version = pck_records.version + 1;
            """, (record_id, "org_demo_alpha", "attempt", json.dumps(record_data), 1))
            cur.close()
            conn.close()
            print("[DB] Pack attempt successfully saved to Neon PostgreSQL (pck_records)!")
        except Exception as dbe:
            print(f"[DB Warning] Could not persist to pck_records: {dbe}")
        
        print("\n" + "=" * 70)
        print(" PACK AGENT GEMINI LIVE TEST COMPLETED SUCCESSFULLY! ")
        print("=" * 70)
    except Exception as e:
        print(f"\n[!] Live Gemini call failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_pack_live_gemini_test()
