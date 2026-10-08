const express = require('express');
const db = require('./db');
const { runVisionInspection } = require('./services/vision');
const determineDisposition = require('./services/disposition');
const tenantMiddleware = require('./middleware/tenant');

const router = express.Router();

// Reload endpoint — no tenant required
router.post('/reload', async (req, res) => {
  const result = await db.reloadSeedData();
  res.json({ message: 'Data reloaded', ...result });
});

// Status endpoint — reports whether AI mode is active
router.get('/status', (req, res) => {
  res.json({ 
    aiMode: !!process.env.GEMINI_API_KEY,
    database: "central-neon-postgresql",
    connected: true
  });
});

// Cross-Agent Query Endpoint: Look up upstream proof from Receiving, Prep, and Pack
router.get('/upstream-evidence/:unitId', async (req, res) => {
  const { unitId } = req.params;
  const upstream = await db.getUpstreamEvidenceForUnit(unitId);
  res.json(upstream);
});

// All routes below are strictly tenant-isolated
router.use(tenantMiddleware);

router.get('/returns', async (req, res) => {
  const returns = await db.getReturns(req.tenant);
  res.json(returns);
});

router.get('/returns/:id', async (req, res) => {
  const ret = await db.getReturn(req.tenant, req.params.id);
  if (!ret) return res.status(404).json({ error: "Return not found" });
  res.json(ret);
});

router.post('/returns/inspect', async (req, res) => {
  const { record_id, subject, sku, images = [] } = req.body;
  
  if (!record_id || !subject) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Look up upstream receiving, prep, pack context for this unit
  const upstream = await db.getUpstreamEvidenceForUnit(subject);

  // Get catalogue context
  const catalogueItem = db.getCatalogueItem(sku);

  // Run AI Inspection
  const checks = await runVisionInspection(images, catalogueItem);
  
  // Deterministic engine
  const outcome = determineDisposition(checks);
  
  // Construct evidence record exactly mapping to schema
  const evidenceRecord = {
    record_id,
    schema_version: "1.0",
    organization_id: req.tenant,
    client_id: "returns-manager-agent-01",
    agent: "Returns Manager",
    subject,
    captured_at: new Date().toISOString(),
    operator_label: "auto-agent",
    images,
    checks,
    outcome,
    overrides: [],
    status: outcome === 'pending_review' ? 'pending_review' : 'completed',
    content_hash: "",
    upstream_context: upstream // Enriched with upstream baseline
  };

  try {
    const saved = await db.saveEvidenceRecord(req.tenant, evidenceRecord);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/returns/:id/override', async (req, res) => {
  const { revised_verdict, reason, operator_id } = req.body;
  
  if (!revised_verdict || !reason || !operator_id) {
    return res.status(400).json({ error: "Missing override details" });
  }
  
  const record = await db.getReturn(req.tenant, req.params.id);
  if (!record) {
    return res.status(404).json({ error: "Record not found" });
  }

  const overrideData = {
    original_verdict: record.outcome,
    revised_verdict,
    reason,
    operator_id,
    timestamp: new Date().toISOString()
  };

  try {
    const updated = await db.saveOverride(req.tenant, req.params.id, overrideData);
    updated.outcome = revised_verdict;
    await db.saveEvidenceRecord(req.tenant, updated);
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
