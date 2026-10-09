import { createChainedRow, verifyLedgerChain } from '../packages/voting/dist/index.mjs';

console.log('=== CouncilVerse v2: Tamper-Evident Ledger Chaining Demo ===\n');

// 1. Create a sequential chained audit log
const row1 = createChainedRow({
  id: 'event-001',
  ts: new Date().toISOString(),
  lane: 'claude',
  action: 'PROPOSE_PRUNE_ROUTER',
  details: 'Proposing num_retries: 0 on evaluative seats',
}, null);
const line1 = JSON.stringify(row1);
console.log(`[Row 1] ID: ${row1.id} | prev_hash: ${row1.prev_hash}`);

const row2 = createChainedRow({
  id: 'event-002',
  ts: new Date().toISOString(),
  lane: 'gemini',
  action: 'CTV_VOTE_RECORDED',
  details: 'AFFIRMATIVE vote recorded with 9400 bps confidence',
}, line1);
const line2 = JSON.stringify(row2);
console.log(`[Row 2] ID: ${row2.id} | prev_hash: ${row2.prev_hash}`);

const row3 = createChainedRow({
  id: 'event-003',
  ts: new Date().toISOString(),
  lane: 'hermes',
  action: 'VERIFY_AND_MERGE',
  details: 'Automated test suite passed clean, PR merged',
}, line2);
const line3 = JSON.stringify(row3);
console.log(`[Row 3] ID: ${row3.id} | prev_hash: ${row3.prev_hash}\n`);

// 2. Verify legitimate chain
const validVerification = verifyLedgerChain([line1, line2, line3]);
console.log('--- Verifying Unmodified Ledger ---');
console.log(`Chain Valid:  ${validVerification.valid}`);
console.log(`Chained Rows: ${validVerification.chained_rows} / ${validVerification.total_rows}\n`);

// 3. Simulate an adversary editing Row 2 in git history
console.log('--- Simulating Adversarial Row Tampering ---');
const tamperedRow2 = { ...row2, details: 'ADVERSARY INJECTED MALICIOUS OVERRIDE' };
const tamperedLine2 = JSON.stringify(tamperedRow2);

const tamperedVerification = verifyLedgerChain([line1, tamperedLine2, line3]);
console.log(`Chain Valid:  ${tamperedVerification.valid}`);
console.log(`Breaks Found: ${tamperedVerification.breaks.length}`);
tamperedVerification.breaks.forEach(b => {
  console.log(`  [CHAIN BREAK at Row Index ${b.row_index}] ID: ${b.row_id}`);
  console.log(`  Expected prev_hash: ${b.expected_prev_hash}`);
  console.log(`  Actual prev_hash:   ${b.actual_prev_hash}`);
});
