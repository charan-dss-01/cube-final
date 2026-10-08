const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const catalogue = require('./data/catalogue.json');
const returnImagesPath = path.join(__dirname, './data/return-images.json');

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_RQy5Uu0hlMmL@ep-fancy-union-b5a91lxa-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function getReturnImages() {
  try { return JSON.parse(fs.readFileSync(returnImagesPath, 'utf8')); }
  catch (e) { return {}; }
}

const returnsDb = new Map(); // In-memory synchronous store for unit tests
const overridesDb = new Map();

// Synchronous CSV seed for instant in-memory accessibility
function loadSeedDataSync() {
  const seedPath = path.join(__dirname, '../../../../data/returns_sample.csv');
  if (fs.existsSync(seedPath)) {
    const csv = fs.readFileSync(seedPath, 'utf8');
    const lines = csv.split('\n').filter(l => l.trim().length > 0);
    const headers = lines[0].split(',');
    const returnImages = getReturnImages();

    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',');
      if (vals.length < headers.length) continue;

      const record = {};
      headers.forEach((h, idx) => {
        record[h.trim()] = vals[idx].trim();
      });

      if (Object.prototype.hasOwnProperty.call(returnImages, record.record_id)) {
        const imageUrls = returnImages[record.record_id];
        const validUrls = imageUrls.filter(u => u && !u.includes('PASTE_IMAGE_URL'));
        record.photo_refs = validUrls.join(';');
      }

      returnsDb.set(record.record_id, {
        ...record,
        org_id: record.org_id
      });
    }
  }
}

// Initial synchronous load
loadSeedDataSync();

// Async background PostgreSQL syncer
async function syncToPostgres() {
  try {
    for (const record of returnsDb.values()) {
      await pool.query(`
        INSERT INTO rtn_records (
          record_id, unit_id, org_id, order_id, ordered_sku, ordered_asin,
          identity_match, parts_list, parts_missing, observed_state,
          amazon_condition, operator_disposition, photo_refs, operator_id, captured_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (record_id) DO UPDATE SET
          photo_refs = EXCLUDED.photo_refs,
          updated_at = NOW();
      `, [
        record.record_id,
        record.unit_id,
        record.org_id,
        record.order_id,
        record.ordered_sku,
        record.ordered_asin,
        record.identity_match,
        record.parts_list,
        record.parts_missing,
        record.observed_state,
        record.amazon_condition,
        record.operator_disposition,
        record.photo_refs,
        record.operator_id,
        record.captured_at
      ]);
    }
  } catch (e) {
    // Non-blocking
  }
}

syncToPostgres();

module.exports = {
  pool,

  reloadSeedData: () => {
    returnsDb.clear();
    loadSeedDataSync();
    syncToPostgres();
    return { reloaded: returnsDb.size };
  },

  // Synchronous signature matching exact test suite contract
  getReturns: (tenantId) => {
    const results = [];
    for (const record of returnsDb.values()) {
      if (record.org_id === tenantId) {
        results.push(record);
      }
    }
    return results;
  },

  getReturn: (tenantId, recordId) => {
    const record = returnsDb.get(recordId);
    if (record && record.org_id === tenantId) return record;
    return null;
  },

  getCatalogueItem: (sku) => {
    return catalogue.find(c => c.sku === sku) || null;
  },

  saveEvidenceRecord: (tenantId, evidenceRecord) => {
    const hash = crypto.createHash('sha256').update(JSON.stringify(evidenceRecord)).digest('hex');
    evidenceRecord.content_hash = hash;

    const existing = returnsDb.get(evidenceRecord.record_id) || {};
    if (existing.org_id && existing.org_id !== tenantId) {
      throw new Error("Unauthorized tenant access during save");
    }

    const merged = {
      ...existing,
      ...evidenceRecord,
      org_id: tenantId
    };
    returnsDb.set(evidenceRecord.record_id, merged);

    // Asynchronously update PostgreSQL in background
    pool.query(`
      UPDATE rtn_records SET
        images = $1,
        checks = $2,
        outcome = $3,
        overrides = $4,
        status = $5,
        content_hash = $6,
        updated_at = NOW()
      WHERE record_id = $7 AND org_id = $8
    `, [
      JSON.stringify(evidenceRecord.images || []),
      JSON.stringify(evidenceRecord.checks || []),
      evidenceRecord.outcome,
      JSON.stringify(evidenceRecord.overrides || []),
      evidenceRecord.status,
      hash,
      evidenceRecord.record_id,
      tenantId
    ]).catch(() => {});

    return evidenceRecord;
  },

  saveOverride: (tenantId, recordId, overrideData) => {
    const record = returnsDb.get(recordId);
    if (!record || record.org_id !== tenantId) {
      throw new Error("Record not found or unauthorized");
    }

    if (!record.overrides) record.overrides = [];
    record.overrides.push(overrideData);

    const hash = crypto.createHash('sha256').update(JSON.stringify(record)).digest('hex');
    record.content_hash = hash;

    returnsDb.set(recordId, record);

    // Asynchronously persist override in PostgreSQL
    pool.query(`
      UPDATE rtn_records SET
        overrides = $1,
        content_hash = $2,
        updated_at = NOW()
      WHERE record_id = $3 AND org_id = $4
    `, [
      JSON.stringify(record.overrides),
      hash,
      recordId,
      tenantId
    ]).catch(() => {});

    return record;
  },

  // Cross-agent historical query from central PostgreSQL tables
  getUpstreamEvidenceForUnit: async (unitId) => {
    const upstream = {
      unit_id: unitId,
      receiving: null,
      prep: null,
      pack: null
    };

    try {
      const rcvRes = await pool.query(`
        SELECT r.*, u.po_number, u.carton_damage, u.unit_damage, u.qty_received, u.qty_ordered
        FROM rcv_inspections r
        JOIN rcv_units u ON r.unit_id = u.unit_id
        WHERE r.unit_id = $1
        ORDER BY r.created_at DESC LIMIT 1
      `, [unitId]);
      if (rcvRes.rows.length > 0) upstream.receiving = rcvRes.rows[0];

      const prpRes = await pool.query(`
        SELECT p.*, (
          SELECT json_agg(c.*) FROM prp_checks c WHERE c.inspection_id = p.id
        ) as checks
        FROM prp_inspections p
        WHERE p.unit_id = $1
        ORDER BY p.created_at DESC LIMIT 1
      `, [unitId]);
      if (prpRes.rows.length > 0) upstream.prep = prpRes.rows[0];

      const pckRes = await pool.query(`
        SELECT * FROM pck_records
        WHERE data->>'unit_id' = $1 OR data->>'unit' = $1
        ORDER BY created_at DESC LIMIT 1
      `, [unitId]);
      if (pckRes.rows.length > 0) upstream.pack = pckRes.rows[0];
    } catch (e) {
      console.error("Error querying upstream evidence:", e.message);
    }

    return upstream;
  }
};
