import { assertEvaluativeSeatInvariant, evaluateD4CircuitBreaker } from '../packages/voting/dist/index.mjs';

console.log('=== CouncilVerse v2: D4 Fail-Closed Router Invariants ===\n');

// 1. Inspect a production-ready LiteLLM routing architecture
const modelConfigs = [
  { model_name: 'judge', num_retries: 0, seat_class: 'evaluative' },
  { model_name: 'adversarial', num_retries: 0, seat_class: 'evaluative' },
  { model_name: 'council', num_retries: 0, seat_class: 'evaluative' },
  { model_name: 'qwen-coder-local', num_retries: 2, fallbacks: ['cloud-backup'], seat_class: 'generative' },
];

const aliases = {
  fast: 'relay-slm-triage',
  coder: 'qwen-coder-local',
};

console.log('Checking compliant configuration:');
const checkValid = assertEvaluativeSeatInvariant(modelConfigs, aliases);
console.log(`Valid: ${checkValid.valid} (Violations: ${checkValid.violations.length})\n`);

// 2. Introduce architectural defects (silent fallback on judge, retries on adversarial)
const defectiveConfigs = [
  { model_name: 'judge', num_retries: 0, fallbacks: ['cheaper-gpt-3.5'], seat_class: 'evaluative' },
  { model_name: 'adversarial', num_retries: 3, seat_class: 'evaluative' },
];

const defectiveAliases = {
  judge: 'nous-deepseek-r1', // Alias key matches verdict seat!
};

console.log('Checking defective configuration (anti-downgrade violation):');
const checkDefective = assertEvaluativeSeatInvariant(defectiveConfigs, defectiveAliases);
console.log(`Valid: ${checkDefective.valid}`);
checkDefective.violations.forEach((v, idx) => console.log(`  [VIOLATION ${idx + 1}] ${v}`));

// 3. Test D4.6 Circuit Breaker mechanics
console.log('\n--- Evaluating Circuit Breaker State ---');
const breakerState = evaluateD4CircuitBreaker(2, 120);
console.log(`Consecutive Abstains:   ${breakerState.consecutive_abstains}`);
console.log(`Circuit Tripped:        ${breakerState.circuit_tripped}`);
console.log(`Notification Severity:  ${breakerState.notification_severity} (Quiet Digest)`);
console.log(`Cooldown Remaining:     ${breakerState.cooldown_remaining_secs}s`);
