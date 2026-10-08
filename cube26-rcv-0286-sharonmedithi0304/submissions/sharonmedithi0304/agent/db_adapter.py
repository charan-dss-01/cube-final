"""
Receiving Database Adapter for Neon PostgreSQL.
Persists units, inspections, and checks using the core inspect_unit logic.
"""

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from pathlib import Path
import pandas as pd

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_RQy5Uu0hlMmL@ep-fancy-union-b5a91lxa-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require"
)

def get_connection():
    return psycopg2.connect(DATABASE_URL)

def seed_rcv_units_from_csv(csv_path: str):
    """Seed receiving_sample.csv into rcv_units table."""
    df = pd.read_csv(csv_path)
    conn = get_connection()
    conn.autocommit = True
    cur = conn.cursor()

    for _, row in df.iterrows():
        unit_id = str(row.get("unit_id"))
        record_id = str(row.get("record_id"))
        tenant_id = str(row.get("org_id") or "org_demo_alpha")

        # spec components parse
        spec_comp = row.get("spec_components")
        if pd.isna(spec_comp):
            spec_comp_json = "[]"
        elif isinstance(spec_comp, str):
            spec_comp_json = json.dumps([c.strip() for c in spec_comp.split(";") if c.strip()])
        else:
            spec_comp_json = json.dumps(spec_comp)

        # photo refs parse
        photos = row.get("photo_refs")
        if pd.isna(photos):
            photos_json = "[]"
        elif isinstance(photos, str):
            photos_json = json.dumps([p.strip() for p in photos.split(";") if p.strip()])
        else:
            photos_json = json.dumps(photos)

        cur.execute("""
            INSERT INTO rcv_units (
                unit_id, record_id, tenant_id, po_number, po_line, supplier,
                sku, asin, product_title, spec_colour, spec_variant, spec_components,
                cartons_ordered, units_per_carton_ordered, qty_ordered,
                cartons_received, units_per_carton_counted, qty_received,
                identity_match, carton_damage, unit_damage, quality_flags,
                photo_refs, operator_id, captured_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s
            ) ON CONFLICT (unit_id) DO UPDATE SET
                cartons_received = EXCLUDED.cartons_received,
                qty_received = EXCLUDED.qty_received,
                unit_damage = EXCLUDED.unit_damage,
                carton_damage = EXCLUDED.carton_damage;
        """, (
            unit_id, record_id, tenant_id, str(row.get("po_number") or ""), str(row.get("po_line") or ""),
            str(row.get("supplier") or ""), str(row.get("sku") or ""), str(row.get("asin") or ""),
            str(row.get("product_title") or ""), str(row.get("spec_colour") or "") if not pd.isna(row.get("spec_colour")) else None,
            str(row.get("spec_variant") or "") if not pd.isna(row.get("spec_variant")) else None,
            spec_comp_json,
            int(row.get("cartons_ordered")) if not pd.isna(row.get("cartons_ordered")) else None,
            int(row.get("units_per_carton_ordered")) if not pd.isna(row.get("units_per_carton_ordered")) else None,
            int(row.get("qty_ordered")) if not pd.isna(row.get("qty_ordered")) else None,
            int(row.get("cartons_received")) if not pd.isna(row.get("cartons_received")) else None,
            int(row.get("units_per_carton_counted")) if not pd.isna(row.get("units_per_carton_counted")) else None,
            int(row.get("qty_received")) if not pd.isna(row.get("qty_received")) else None,
            str(row.get("identity_match") or "") if not pd.isna(row.get("identity_match")) else None,
            str(row.get("carton_damage") or "") if not pd.isna(row.get("carton_damage")) else None,
            str(row.get("unit_damage") or "") if not pd.isna(row.get("unit_damage")) else None,
            str(row.get("quality_flags") or "") if not pd.isna(row.get("quality_flags")) else None,
            photos_json,
            str(row.get("operator_id") or "") if not pd.isna(row.get("operator_id")) else None,
            str(row.get("captured_at") or "") if not pd.isna(row.get("captured_at")) else None
        ))

    cur.close()
    conn.close()
    print(f"Successfully seeded {len(df)} units into rcv_units in PostgreSQL!")

def save_rcv_inspection(unit_record: dict, inspection_res: dict, tenant_id: str = "org_demo_alpha"):
    """Saves inspection outcome and individual check results into rcv_inspections & rcv_checks."""
    conn = get_connection()
    conn.autocommit = True
    cur = conn.cursor()

    record_id = unit_record.get("record_id")
    unit_id = unit_record.get("unit_id")
    inspection_id = f"INSP-{record_id}"

    overall_verdict = inspection_res.get("overall_verdict", "UNCERTAIN")
    checks = inspection_res.get("checks", {})
    decision_trace = json.dumps(inspection_res.get("decision_trace", {}))

    cur.execute("""
        INSERT INTO rcv_inspections (
            inspection_id, record_id, unit_id, tenant_id, status,
            overall_verdict, decision_trace
        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (inspection_id) DO UPDATE SET
            overall_verdict = EXCLUDED.overall_verdict,
            decision_trace = EXCLUDED.decision_trace;
    """, (
        inspection_id, record_id, unit_id, tenant_id, 'complete',
        overall_verdict, decision_trace
    ))

    # Save individual checks
    for chk_name, chk_val in checks.items():
        chk_id = f"{inspection_id}-{chk_name}"
        verdict = chk_val.get("verdict", "UNCERTAIN")
        exp = json.dumps(chk_val.get("expected")) if chk_val.get("expected") is not None else None
        obs = json.dumps(chk_val.get("observed")) if chk_val.get("observed") is not None else None
        ev = json.dumps(chk_val.get("evidence", []))

        cur.execute("""
            INSERT INTO rcv_checks (
                check_id, inspection_id, check_name, verdict,
                expected_value, observed_value, evidence
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (check_id) DO UPDATE SET
                verdict = EXCLUDED.verdict,
                evidence = EXCLUDED.evidence;
        """, (
            chk_id, inspection_id, chk_name, verdict, exp, obs, ev
        ))

    cur.close()
    conn.close()
    return inspection_id

if __name__ == "__main__":
    csv_file = r"c:\cube\cube26-rcv-0286-sharonmedithi0304\data\receiving_sample.csv"
    if os.path.exists(csv_file):
        seed_rcv_units_from_csv(csv_file)
