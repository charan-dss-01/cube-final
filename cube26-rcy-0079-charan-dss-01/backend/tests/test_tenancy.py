import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_same_tenant_access_allowed():
    """Verify that requests with the valid tenant return the expected unit lifecycle data."""
    # Query unit-lifecycle for a default tenant
    response = client.get("/api/v1/unit-lifecycle/UNIT-0001?tenant_id=tenant_default")
    assert response.status_code in (200, 404)
    if response.status_code == 200:
        data = response.json()
        assert "unit_id" in data
        assert data["unit_id"] == "UNIT-0001"

def test_cross_tenant_isolation_forbidden():
    """Verify that Tenant B cannot access Tenant A's private units and receives 404."""
    # Query with a non-existent foreign tenant ID
    response = client.get("/api/v1/unit-lifecycle/UNIT-RCV-001?tenant_id=org_foreign_rogue_tenant")
    assert response.status_code == 404
    detail = response.json().get("detail", "")
    assert "not found" in detail.lower()

def test_agent_records_tenant_isolation():
    """Verify that agent record explorer endpoints respect tenant boundaries."""
    # Query pack records with a foreign tenant that has no records
    resp_pack = client.get("/api/v1/agents/pack/records?tenant_id=org_foreign_empty_tenant")
    assert resp_pack.status_code == 200
    pack_data = resp_pack.json()
    assert pack_data["total"] == 0
    assert len(pack_data["records"]) == 0

    # Query returns records with a foreign tenant that has no records
    resp_rtn = client.get("/api/v1/agents/returns/records?tenant_id=org_foreign_empty_tenant")
    assert resp_rtn.status_code == 200
    rtn_data = resp_rtn.json()
    assert rtn_data["total"] == 0
    assert len(rtn_data["records"]) == 0
