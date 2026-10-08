import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from app.database.session import SessionLocal
from app.models.models import Charge, EvidenceRecord
from app.services.investigation_service import InvestigationService
from app.services.llm_reasoner import LLMRecoveryReasoner
from app.services.claim_service import ClaimService

def run_recovery_live_test():
    print("=" * 70)
    print(" CUBE RECOVERY MANAGER — REAL GEMINI REASONER & CROSS-AGENT AUDIT ")
    print("=" * 70)
    
    db = SessionLocal()
    try:
        # 1. Check charges and evidence in DB
        total_charges = db.query(Charge).count()
        total_evidence = db.query(EvidenceRecord).count()
        print(f"Neon DB Status: {total_charges} charges, {total_evidence} evidence records")
        
        # Pick a charge with evidence or test charge with UNIT-0001
        charge = db.query(Charge).filter(Charge.unit_id == "UNIT-0001").first()
        if not charge:
            # Pick any charge from original dataset
            charge = db.query(Charge).filter(Charge.charge_id.like("CH-%")).first()
            
        print(f"\n[Test Case 1] Investigating Charge: {charge.charge_id}")
        print(f"-> Reason:        {charge.reason}")
        print(f"-> Amount:        ${charge.amount} {charge.currency}")
        print(f"-> Unit / Ref:    {charge.unit_id or charge.reference_id}")
        
        # Run Investigation with cross-agent evidence
        inv_result = InvestigationService.run_investigation(db=db, charge=charge, commit=True)
        print(f"\n-> Investigation Assessment: {inv_result.assessment}")
        print(f"-> Claim Supported:          {inv_result.claim_supported}")
        print(f"-> Claim Amount:             ${inv_result.claim_amount}")
        print(f"-> Evidence Items Linked:    {len(inv_result.evidence_items)}")
        for ev in inv_result.evidence_items[:3]:
            print(f"   * [{ev.source_type}] {ev.relevance}: {ev.finding[:60]}...")
        print(f"-> Reasoning:                {inv_result.reasoning[:120]}...")
        
        if inv_result.claim_supported:
            claim = ClaimService.generate_claim_package(db=db, company_id=charge.company_id, charge_id=charge.charge_id)
            print(f"-> Generated Claim ID:       {claim.claim_id} (Status: {claim.status})")
        
        # 3. Test Live Gemini LLM Reasoner for open-ended unmodeled dispute
        print("\n[Test Case 2] Testing Live Gemini Forensic Reasoner on unmodeled fee...")
        sample_evidence = [
            {
                "evidence_id": "EV-RCV-0001",
                "source_type": "receiving_inspection",
                "finding": "Carrier delivery bill of lading and receiving dock photos confirm carton delivered with zero tears or crushing. Units received in pristine factory-sealed condition.",
                "relevance": "Direct inbound dock proof",
                "establishes": "Defect occurred post-dock intake in Amazon fulfillment center"
            },
            {
                "evidence_id": "EV-PRP-0001",
                "source_type": "prep_audit",
                "finding": "Polybag sealed, suffocation warning fully legible, FNSKU verified flat and scannable.",
                "relevance": "Outbound prep proof",
                "establishes": "Prep compliance certified"
            }
        ]
        
        llm_analysis = LLMRecoveryReasoner.analyze_unmodeled_charge(
            charge_reason="Amazon Unplanned Prep & Inbound Damage Penalty",
            charge_amount=75.50,
            currency="USD",
            charge_metadata={"marketplace": "Amazon US", "asin": "B0DUMMY001", "fc_code": "PHX6"},
            evidence_items=sample_evidence
        )
        
        print("-> Live Gemini Forensic Analysis Result:")
        print(f"   * Assessment:     {llm_analysis.get('assessment')}")
        print(f"   * Disputable:     {llm_analysis.get('disputable')}")
        print(f"   * Claim Amount:   ${llm_analysis.get('claim_amount')}")
        print(f"   * Justification:  {llm_analysis.get('justification')}")
        
        print("\n" + "=" * 70)
        print(" RECOVERY AGENT GEMINI LIVE TEST COMPLETED SUCCESSFULLY! ")
        print("=" * 70)
    finally:
        db.close()

if __name__ == "__main__":
    run_recovery_live_test()
