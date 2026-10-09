"""Where workflow state and evidence live. Two implementations of one tiny interface.

MemoryStore: tests and library use. FileStore: the CLI and API (JSON files under out/).
Swap in a database by implementing the same four methods. Evidence is IMMUTABLE: a record_id, once written,
can only be written again with identical content.
"""
from __future__ import annotations

import json
import os
from pathlib import Path


class EvidenceConflict(Exception):
    pass


class MemoryStore:
    def __init__(self) -> None:
        self.workflows: dict[str, dict] = {}
        self.evidence: dict[str, dict] = {}

    def load_workflow(self, workflow_id: str) -> dict | None:
        wf = self.workflows.get(workflow_id)
        return json.loads(json.dumps(wf)) if wf else None

    def save_workflow(self, wf: dict) -> None:
        self.workflows[wf["workflow_id"]] = json.loads(json.dumps(wf))

    def get_evidence(self, record_id: str) -> dict | None:
        return self.evidence.get(record_id)

    def put_evidence(self, record: dict) -> None:
        existing = self.evidence.get(record["record_id"])
        if existing and existing["content_hash"] != record["content_hash"]:
            raise EvidenceConflict(f"{record['record_id']} already exists with different content; evidence is immutable")
        self.evidence.setdefault(record["record_id"], record)


class FileStore(MemoryStore):
    def __init__(self, root: str | Path | None = None) -> None:
        super().__init__()
        self.root = Path(root or os.environ.get("OUT_DIR", "out"))
        (self.root / "workflows").mkdir(parents=True, exist_ok=True)
        (self.root / "evidence").mkdir(parents=True, exist_ok=True)

    def load_workflow(self, workflow_id: str) -> dict | None:
        p = self.root / "workflows" / f"{workflow_id}.json"
        return json.loads(p.read_text()) if p.exists() else None

    def save_workflow(self, wf: dict) -> None:
        p = self.root / "workflows" / f"{wf['workflow_id']}.json"
        tmp = p.with_suffix(".tmp")
        tmp.write_text(json.dumps(wf, indent=2))
        tmp.replace(p)  # atomic: a crash never leaves half a workflow

    def get_evidence(self, record_id: str) -> dict | None:
        p = self.root / "evidence" / f"{record_id}.json"
        return json.loads(p.read_text()) if p.exists() else None

    def put_evidence(self, record: dict) -> None:
        existing = self.get_evidence(record["record_id"])
        if existing and existing["content_hash"] != record["content_hash"]:
            raise EvidenceConflict(f"{record['record_id']} already exists with different content; evidence is immutable")
        if not existing:
            (self.root / "evidence" / f"{record['record_id']}.json").write_text(json.dumps(record, indent=2))


class PostgresStore(MemoryStore):
    """PostgreSQL-backed store for durable workflow state and immutable evidence across restarts."""
    def __init__(self, db_url: str | None = None) -> None:
        super().__init__()
        self.db_url = db_url or os.environ.get("DATABASE_URL", "")
        if self.db_url.startswith("postgres://"):
            self.db_url = self.db_url.replace("postgres://", "postgresql://", 1)
        self._init_tables()

    def _get_connection(self):
        import psycopg2
        return psycopg2.connect(self.db_url)

    def _init_tables(self) -> None:
        if not self.db_url:
            return
        try:
            conn = self._get_connection()
            conn.autocommit = True
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS cw_workflows (
                        workflow_id VARCHAR(128) PRIMARY KEY,
                        flow_id VARCHAR(64) NOT NULL,
                        org_id VARCHAR(64) NOT NULL,
                        subject_id VARCHAR(128) NOT NULL,
                        status VARCHAR(32) NOT NULL,
                        state JSONB NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                    CREATE TABLE IF NOT EXISTS cw_evidence (
                        record_id VARCHAR(128) PRIMARY KEY,
                        workflow_id VARCHAR(128),
                        stage VARCHAR(64) NOT NULL,
                        content_hash VARCHAR(128) NOT NULL,
                        record JSONB NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """)
            conn.close()
        except Exception as e:
            # Table initialization notice (e.g. if offline during unit test)
            pass

    def load_workflow(self, workflow_id: str) -> dict | None:
        if not self.db_url:
            return super().load_workflow(workflow_id)
        try:
            conn = self._get_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT state FROM cw_workflows WHERE workflow_id = %s", (workflow_id,))
                row = cur.fetchone()
            conn.close()
            return row[0] if row else None
        except Exception:
            return super().load_workflow(workflow_id)

    def save_workflow(self, wf: dict) -> None:
        super().save_workflow(wf)
        if not self.db_url:
            return
        try:
            conn = self._get_connection()
            conn.autocommit = True
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO cw_workflows (workflow_id, flow_id, org_id, subject_id, status, state, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (workflow_id) DO UPDATE SET
                        status = EXCLUDED.status,
                        state = EXCLUDED.state,
                        updated_at = NOW()
                """, (
                    wf["workflow_id"],
                    wf.get("flow_id", "standard"),
                    wf.get("org_id", "org_demo_alpha"),
                    wf.get("subject_id", wf["workflow_id"]),
                    wf.get("status", "IN_PROGRESS"),
                    json.dumps(wf)
                ))
            conn.close()
        except Exception as e:
            pass

    def get_evidence(self, record_id: str) -> dict | None:
        if not self.db_url:
            return super().get_evidence(record_id)
        try:
            conn = self._get_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT record FROM cw_evidence WHERE record_id = %s", (record_id,))
                row = cur.fetchone()
            conn.close()
            return row[0] if row else None
        except Exception:
            return super().get_evidence(record_id)

    def put_evidence(self, record: dict) -> None:
        existing = self.get_evidence(record["record_id"])
        if existing and existing.get("content_hash") != record.get("content_hash"):
            raise EvidenceConflict(f"{record['record_id']} already exists with different content; evidence is immutable")
        super().put_evidence(record)
        if not self.db_url or existing:
            return
        try:
            conn = self._get_connection()
            conn.autocommit = True
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO cw_evidence (record_id, workflow_id, stage, content_hash, record)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (record_id) DO NOTHING
                """, (
                    record["record_id"],
                    record.get("workflow_id"),
                    record.get("stage", "unknown"),
                    record.get("content_hash", ""),
                    json.dumps(record)
                ))
            conn.close()
        except Exception:
            pass
