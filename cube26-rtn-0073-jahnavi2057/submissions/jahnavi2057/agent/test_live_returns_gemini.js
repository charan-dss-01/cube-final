require('dotenv').config();
const path = require('path');
const { runVisionInspection } = require('./server/services/vision');
const determineDisposition = require('./server/services/disposition');
const db = require('./server/db');

async function testLiveReturns() {
  console.log('='.repeat(70));
  console.log(' CUBE RETURNS MANAGER — REAL GEMINI VISION & UPSTREAM CROSS-CHECK ');
  console.log('='.repeat(70));

  const imagePath = path.resolve(__dirname, 'server/data/fixtures/returns/UNIT-0003_1.jpg');
  console.log(`Input Image: ${imagePath}`);
  
  const catalogueItem = {
    sku: 'BLUE-BOTTLE-001',
    product_name: 'Blue Water Bottle 1L',
    expected_parts: ['bottle', 'cap'],
    description: '1L blue reusable water bottle with leak-proof cap'
  };

  console.log('\n[1] Calling Gemini Live Vision Inspection...');
  const checks = await runVisionInspection([imagePath], catalogueItem);
  console.log('-> Gemini Inspection Results:');
  checks.forEach(c => {
    console.log(`   * ${c.check_key.padEnd(16)}: ${c.verdict.padEnd(8)} (Conf: ${c.confidence}) | ${c.detail}`);
  });

  const disposition = determineDisposition(checks);
  console.log(`\n[2] Disposition Engine Verdict: ${disposition.toUpperCase()}`);

  console.log('\n[3] Querying Cross-Agent Upstream Evidence (Receiving, Prep, Pack) for UNIT-0001...');
  const upstream = await db.getUpstreamEvidenceForUnit('UNIT-0001');
  console.log('-> Upstream Evidence Found:');
  console.log(`   * Inbound Receiving: ${upstream.receiving ? 'FOUND (PO: ' + upstream.receiving.po_number + ', Verdict: ' + upstream.receiving.overall_verdict + ')' : 'None'}`);
  console.log(`   * Warehouse Prep:    ${upstream.prep ? 'FOUND (Status: ' + upstream.prep.overall_status + ', Checks: ' + (upstream.prep.checks ? upstream.prep.checks.length : 0) + ')' : 'None'}`);
  console.log(`   * Outbound Pack:     ${upstream.pack ? 'FOUND (Attempt: ' + upstream.pack.id + ', Kind: ' + upstream.pack.kind + ')' : 'None'}`);

  console.log('\n[4] Querying Upstream Evidence for UNIT-0003...');
  const upstream3 = await db.getUpstreamEvidenceForUnit('UNIT-0003');
  console.log('-> Upstream Evidence for UNIT-0003:');
  console.log(`   * Inbound Receiving: ${upstream3.receiving ? 'FOUND (PO: ' + upstream3.receiving.po_number + ', Verdict: ' + upstream3.receiving.overall_verdict + ')' : 'None'}`);

  console.log('\n' + '='.repeat(70));
  console.log(' RETURNS AGENT GEMINI LIVE TEST COMPLETED SUCCESSFULLY! ');
  console.log('='.repeat(70));
  process.exit(0);
}

testLiveReturns().catch(err => {
  console.error('[!] Returns Test Error:', err);
  process.exit(1);
});
