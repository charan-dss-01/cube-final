"""
Runs headless inspection on all 100 receiving units and stores results
into rcv_inspections and rcv_checks in central Neon PostgreSQL.
"""
import sys
from pathlib import Path
import pandas as pd

THIS_DIR = Path(__file__).resolve().parent
AGENT_DIR = THIS_DIR / "submissions" / "sharonmedithi0304" / "agent"
sys.path.insert(0, str(AGENT_DIR))

from inspection_agent import inspect_unit
from db_adapter import save_rcv_inspection

csv_path = r"c:\cube\cube26-rcv-0286-sharonmedithi0304\data\receiving_sample.csv"
df = pd.read_csv(csv_path)

print(f"Running headless inspection engine on {len(df)} units...")
count = 0
for _, row in df.iterrows():
    unit = row.to_dict()
    # clean NaNs
    clean_unit = {k: (None if pd.isna(v) else v) for k, v in unit.items()}
    res = inspect_unit(clean_unit)
    save_rcv_inspection(clean_unit, res, tenant_id=clean_unit.get("org_id") or "org_demo_alpha")
    count += 1

print(f"Completed and persisted {count} inspections to Neon PostgreSQL (rcv_inspections & rcv_checks)!")
