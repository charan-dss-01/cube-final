"""
Central Database Initializer for CUBE 5-Agent Architecture
Connects to Neon PostgreSQL and creates dedicated tables for each agent:
- RCV: Receiving Manager (rcv_units, rcv_inspections, rcv_checks, rcv_overrides)
- PRP: Prep Manager (prp_products, prp_rules, prp_inspections, prp_images, prp_checks, prp_evidence, prp_events, prp_feedbacks)
- PCK: Pack Manager (pck_records, pck_jobs, pck_events, pck_checkpoints, cw_units, cw_workflows, cw_runs, cw_events, cw_requests, cw_calls)
- RTN: Returns Manager (rtn_records, rtn_checks, rtn_overrides)
- RCY: Recovery Manager (rcy_companies, rcy_users, rcy_charges, rcy_shipments, rcy_orders, rcy_source_files, rcy_evidence_records, rcy_evidence_chunks, rcy_investigations, rcy_investigation_evidence, rcy_claims, rcy_claim_ledger)
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable must be set to run init_central_db.py")

SCHEMA_SQL = """
-- =========================================================================
-- 1. RECEIVING MANAGER (RCV)
-- =========================================================================
CREATE TABLE IF NOT EXISTS rcv_units (
    unit_id VARCHAR(64) PRIMARY KEY,
    record_id VARCHAR(64) NOT NULL UNIQUE,
    tenant_id VARCHAR(64) NOT NULL,
    po_number VARCHAR(64) NOT NULL,
    po_line VARCHAR(32),
    supplier VARCHAR(255),
    sku VARCHAR(64) NOT NULL,
    asin VARCHAR(64),
    product_title VARCHAR(255),
    spec_colour VARCHAR(64),
    spec_variant VARCHAR(64),
    spec_components JSONB,
    cartons_ordered INTEGER,
    units_per_carton_ordered INTEGER,
    qty_ordered INTEGER,
    cartons_received INTEGER,
    units_per_carton_counted INTEGER,
    qty_received INTEGER,
    identity_match VARCHAR(32),
    carton_damage VARCHAR(32),
    unit_damage VARCHAR(32),
    quality_flags TEXT,
    photo_refs JSONB,
    operator_id VARCHAR(64),
    captured_at VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rcv_inspections (
    inspection_id VARCHAR(64) PRIMARY KEY,
    record_id VARCHAR(64) REFERENCES rcv_units(record_id),
    unit_id VARCHAR(64) REFERENCES rcv_units(unit_id),
    tenant_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'complete',
    overall_verdict VARCHAR(32) NOT NULL,
    engine_verdict VARCHAR(32),
    contradictions JSONB,
    findings JSONB,
    decision_trace JSONB,
    model_observations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rcv_checks (
    check_id VARCHAR(64) PRIMARY KEY,
    inspection_id VARCHAR(64) REFERENCES rcv_inspections(inspection_id) ON DELETE CASCADE,
    check_name VARCHAR(64) NOT NULL,
    verdict VARCHAR(32) NOT NULL,
    expected_value JSONB,
    observed_value JSONB,
    evidence JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rcv_overrides (
    override_id VARCHAR(64) PRIMARY KEY,
    unit_id VARCHAR(64) REFERENCES rcv_units(unit_id),
    record_id VARCHAR(64) REFERENCES rcv_units(record_id),
    tenant_id VARCHAR(64) NOT NULL,
    original_verdict VARCHAR(32) NOT NULL,
    disposition VARCHAR(32) NOT NULL,
    reason TEXT NOT NULL,
    operator_id VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- 2. PREP MANAGER (PRP)
-- =========================================================================
CREATE TABLE IF NOT EXISTS prp_products (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    asin VARCHAR(64) NOT NULL,
    sku VARCHAR(64) NOT NULL,
    category VARCHAR(128) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prp_rules (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES prp_products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    visually_verifiable BOOLEAN DEFAULT TRUE,
    evaluation_type VARCHAR(64) NOT NULL,
    description TEXT,
    required_views VARCHAR(64) DEFAULT 'front'
);

CREATE TABLE IF NOT EXISTS prp_inspections (
    id VARCHAR(64) PRIMARY KEY,
    unit_id VARCHAR(64) NOT NULL,
    work_order_id VARCHAR(64),
    product_id VARCHAR(64) REFERENCES prp_products(id),
    overall_status VARCHAR(32) NOT NULL,
    operator_name VARCHAR(128) DEFAULT 'Operator #104',
    mode VARCHAR(128) DEFAULT 'Prep Manager Engine v2.0',
    engine_provider VARCHAR(64) DEFAULT 'local',
    cost_per_check FLOAT DEFAULT 0.0025,
    defect_fee_amount FLOAT DEFAULT 25.00,
    recovery_disputable BOOLEAN DEFAULT FALSE,
    agent_action_type VARCHAR(64),
    agent_action_message TEXT,
    requires_rescan BOOLEAN DEFAULT FALSE,
    requires_human_review BOOLEAN DEFAULT FALSE,
    is_overridden BOOLEAN DEFAULT FALSE,
    corrected_by_operator BOOLEAN DEFAULT FALSE,
    operator_feedback_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prp_images (
    id VARCHAR(64) PRIMARY KEY,
    inspection_id VARCHAR(64) REFERENCES prp_inspections(id) ON DELETE CASCADE,
    file_path VARCHAR(1024) NOT NULL,
    view_angle VARCHAR(32) DEFAULT 'front',
    width INTEGER DEFAULT 800,
    height INTEGER DEFAULT 600,
    quality_score FLOAT DEFAULT 1.0,
    is_blurry BOOLEAN DEFAULT FALSE,
    has_glare BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prp_checks (
    id VARCHAR(64) PRIMARY KEY,
    inspection_id VARCHAR(64) REFERENCES prp_inspections(id) ON DELETE CASCADE,
    rule_id VARCHAR(64) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    confidence FLOAT DEFAULT 0.95,
    reason TEXT NOT NULL,
    recommended_action TEXT,
    visually_verifiable BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS prp_evidence (
    id VARCHAR(64) PRIMARY KEY,
    check_id VARCHAR(64) REFERENCES prp_checks(id) ON DELETE CASCADE,
    image_id VARCHAR(64) REFERENCES prp_images(id) ON DELETE SET NULL,
    bounding_boxes_json TEXT DEFAULT '[]',
    detected_features_json TEXT DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prp_events (
    id VARCHAR(64) PRIMARY KEY,
    inspection_id VARCHAR(64) REFERENCES prp_inspections(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    agent_name VARCHAR(128) NOT NULL,
    stage VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'INFO',
    details_json TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS prp_feedbacks (
    id VARCHAR(64) PRIMARY KEY,
    inspection_id VARCHAR(64) REFERENCES prp_inspections(id) ON DELETE CASCADE,
    check_id VARCHAR(64),
    check_name VARCHAR(255),
    original_status VARCHAR(32),
    corrected_status VARCHAR(32),
    feedback_category VARCHAR(64),
    operator_notes TEXT,
    operator_name VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- 3. PACK MANAGER (PCK)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pck_records (
    id VARCHAR(128) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL,
    kind VARCHAR(64) NOT NULL,
    data JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pck_jobs (
    id VARCHAR(128) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL,
    attempt_id VARCHAR(128) NOT NULL UNIQUE,
    key VARCHAR(255) NOT NULL,
    body_hash VARCHAR(128) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'queued',
    lease_owner VARCHAR(128),
    lease_until TIMESTAMP WITH TIME ZONE,
    retries INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_pck_jobs_org_key UNIQUE (organization_id, key)
);

CREATE TABLE IF NOT EXISTS pck_events (
    id VARCHAR(128) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL,
    attempt_id VARCHAR(128) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pck_checkpoints (
    id VARCHAR(128) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL,
    thread_id VARCHAR(128) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pack Integrated Workflows
CREATE TABLE IF NOT EXISTS cw_units (
    organization_id VARCHAR(64) NOT NULL,
    id VARCHAR(128) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (organization_id, id)
);

CREATE TABLE IF NOT EXISTS cw_workflows (
    organization_id VARCHAR(64) NOT NULL,
    id VARCHAR(128) NOT NULL,
    unit_id VARCHAR(128) NOT NULL,
    data JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (organization_id, id),
    CONSTRAINT uq_cw_wf_org_unit UNIQUE (organization_id, unit_id)
);

CREATE TABLE IF NOT EXISTS cw_runs (
    organization_id VARCHAR(64) NOT NULL,
    id VARCHAR(128) NOT NULL,
    workflow_id VARCHAR(128) NOT NULL,
    manager VARCHAR(64) NOT NULL,
    trigger_id VARCHAR(128) NOT NULL,
    state VARCHAR(64) NOT NULL,
    data JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    lease_owner VARCHAR(128),
    lease_until TIMESTAMP WITH TIME ZONE,
    retry_at TIMESTAMP WITH TIME ZONE,
    retries INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (organization_id, id),
    CONSTRAINT uq_cw_runs_org_wf_mgr_trigger UNIQUE (organization_id, workflow_id, manager, trigger_id)
);

CREATE TABLE IF NOT EXISTS cw_events (
    organization_id VARCHAR(64) NOT NULL,
    id VARCHAR(128) NOT NULL,
    workflow_id VARCHAR(128) NOT NULL,
    run_id VARCHAR(128),
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (organization_id, id)
);

-- =========================================================================
-- 4. RETURNS MANAGER (RTN)
-- =========================================================================
CREATE TABLE IF NOT EXISTS rtn_records (
    record_id VARCHAR(64) PRIMARY KEY,
    unit_id VARCHAR(64) NOT NULL,
    org_id VARCHAR(64) NOT NULL,
    order_id VARCHAR(64),
    ordered_sku VARCHAR(64),
    ordered_asin VARCHAR(64),
    identity_match VARCHAR(32),
    parts_list TEXT,
    parts_missing TEXT,
    observed_state VARCHAR(64),
    amazon_condition VARCHAR(64),
    operator_disposition VARCHAR(64),
    photo_refs TEXT,
    operator_id VARCHAR(64),
    captured_at VARCHAR(64),
    images JSONB DEFAULT '[]',
    checks JSONB DEFAULT '[]',
    outcome VARCHAR(64),
    overrides JSONB DEFAULT '[]',
    status VARCHAR(32) DEFAULT 'pending_review',
    content_hash VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- 5. RECOVERY MANAGER (RCY)
-- =========================================================================
CREATE TABLE IF NOT EXISTS rcy_companies (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rcy_users (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) REFERENCES rcy_companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(64) DEFAULT 'Analyst',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rcy_source_files (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) REFERENCES rcy_companies(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    cloudinary_url VARCHAR(1024),
    local_path VARCHAR(1024),
    file_type VARCHAR(64) NOT NULL,
    upload_status VARCHAR(64) DEFAULT 'processed',
    row_count INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rcy_charges (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) REFERENCES rcy_companies(id) ON DELETE CASCADE,
    charge_id VARCHAR(128) NOT NULL UNIQUE,
    unit_id VARCHAR(128),
    shipment_id VARCHAR(128),
    order_id VARCHAR(128),
    sku VARCHAR(128),
    fnsku VARCHAR(128),
    reason VARCHAR(255) NOT NULL,
    amount FLOAT NOT NULL DEFAULT 0.0,
    currency VARCHAR(16) DEFAULT 'USD',
    charge_date VARCHAR(64),
    status VARCHAR(64) DEFAULT 'UNINVESTIGATED',
    source_file_id VARCHAR(64) REFERENCES rcy_source_files(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rcy_shipments (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) REFERENCES rcy_companies(id) ON DELETE CASCADE,
    shipment_id VARCHAR(128) NOT NULL,
    order_id VARCHAR(128),
    status VARCHAR(64) DEFAULT 'delivered',
    shipped_at VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rcy_orders (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) REFERENCES rcy_companies(id) ON DELETE CASCADE,
    order_id VARCHAR(128) NOT NULL,
    customer_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rcy_evidence_records (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) REFERENCES rcy_companies(id) ON DELETE CASCADE,
    evidence_id VARCHAR(128) NOT NULL UNIQUE,
    source_type VARCHAR(64) NOT NULL, -- receiving, prep, pack, returns
    unit_id VARCHAR(128),
    shipment_id VARCHAR(128),
    order_id VARCHAR(128),
    sku VARCHAR(128),
    event_type VARCHAR(128) NOT NULL,
    finding VARCHAR(128) NOT NULL,
    description TEXT,
    raw_payload JSONB,
    photo_refs TEXT,
    operator_id VARCHAR(64),
    timestamp VARCHAR(64),
    source_file_id VARCHAR(64) REFERENCES rcy_source_files(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rcy_evidence_chunks (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) REFERENCES rcy_companies(id) ON DELETE CASCADE,
    evidence_id VARCHAR(128) NOT NULL,
    content TEXT NOT NULL,
    embedding JSONB,
    meta JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rcy_investigations (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) REFERENCES rcy_companies(id) ON DELETE CASCADE,
    charge_id VARCHAR(128) REFERENCES rcy_charges(charge_id) ON DELETE CASCADE UNIQUE,
    assessment VARCHAR(64) NOT NULL, -- CONTRADICTED, SUPPORTED, SILENT, UNCERTAIN
    claim_supported BOOLEAN DEFAULT FALSE,
    claim_amount FLOAT DEFAULT 0.0,
    currency VARCHAR(16) DEFAULT 'USD',
    reasoning TEXT NOT NULL,
    unsupported_reason TEXT,
    coverage_summary JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rcy_investigation_evidence (
    id VARCHAR(64) PRIMARY KEY,
    investigation_id VARCHAR(64) REFERENCES rcy_investigations(id) ON DELETE CASCADE,
    evidence_id VARCHAR(128) NOT NULL,
    source_type VARCHAR(64) NOT NULL,
    relevance VARCHAR(64) DEFAULT 'RELEVANT',
    finding VARCHAR(128) NOT NULL,
    establishes TEXT,
    does_not_establish TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rcy_claims (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) REFERENCES rcy_companies(id) ON DELETE CASCADE,
    claim_id VARCHAR(128) NOT NULL UNIQUE,
    investigation_id VARCHAR(64) REFERENCES rcy_investigations(id) ON DELETE CASCADE,
    charge_id VARCHAR(128) NOT NULL,
    amount FLOAT NOT NULL,
    currency VARCHAR(16) DEFAULT 'USD',
    status VARCHAR(64) DEFAULT 'DRAFT',
    explanation TEXT NOT NULL,
    audit_packet JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rcy_claim_ledger (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) REFERENCES rcy_companies(id) ON DELETE CASCADE,
    claim_id VARCHAR(128) REFERENCES rcy_claims(claim_id) ON DELETE CASCADE,
    charge_id VARCHAR(128) NOT NULL,
    shipment_id VARCHAR(128),
    unit_id VARCHAR(128),
    order_id VARCHAR(128),
    sku VARCHAR(128),
    claimed_quantity INTEGER DEFAULT 1,
    claimed_amount FLOAT NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- INDEXES FOR FAST CROSS-AGENT QUERYING BY unit_id & order_id
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_rcv_units_unit_id ON rcv_units(unit_id);
CREATE INDEX IF NOT EXISTS idx_rcv_inspections_unit_id ON rcv_inspections(unit_id);
CREATE INDEX IF NOT EXISTS idx_prp_inspections_unit_id ON prp_inspections(unit_id);
CREATE INDEX IF NOT EXISTS idx_rtn_records_unit_id ON rtn_records(unit_id);
CREATE INDEX IF NOT EXISTS idx_rtn_records_order_id ON rtn_records(order_id);
CREATE INDEX IF NOT EXISTS idx_rcy_charges_unit_id ON rcy_charges(unit_id);
CREATE INDEX IF NOT EXISTS idx_rcy_evidence_unit_id ON rcy_evidence_records(unit_id);
"""

def main():
    print("Connecting to Neon PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()
    print("Running DDL migration script...")
    cur.execute(SCHEMA_SQL)
    print("DDL executed successfully!")
    
    # Verify tables
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
    tables = [t[0] for t in cur.fetchall()]
    print(f"Total tables created in PostgreSQL: {len(tables)}")
    print("Tables list:", tables)
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
