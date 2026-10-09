import { tallyCtvVotes, canonicalVoteHash } from '../packages/voting/dist/index.mjs';

console.log('=== CouncilVerse v2: Conformal Triadic Voting (CTV) Demo ===\n');

// 1. Define three agent votes in a high-stakes infrastructure decision
const vote1 = {
  voter_id: 'agent-claude',
  lane: 'claude',
  topic: 'infra-security-lockdown',
  decision_class: 'INFRA_ROUTING',
  vote: 'AFFIRMATIVE',
  confidence_bps: 9800, // 98.00% confidence
  nonconformity_bps: 850, // 8.50% anomaly distance
  parent_vote_hashes: ['0000000000000000000000000000000000000000000000000000000000000000'],
  critical_dissent: false,
  justification: 'Enforcing zero retries on evaluative seats eliminates 660s hang cascades.',
};

const hash1 = canonicalVoteHash(vote1);
console.log(`[Vote 1 - Claude] Hash: ${hash1}`);
console.log(`Vote: ${vote1.vote} (${vote1.confidence_bps / 100}% conf) | "${vote1.justification}"\n`);

const vote2 = {
  voter_id: 'agent-gemini',
  lane: 'gemini',
  topic: 'infra-security-lockdown',
  decision_class: 'INFRA_ROUTING',
  vote: 'AFFIRMATIVE',
  confidence_bps: 9400, // 94.00% confidence
  nonconformity_bps: 1100, // 11.00% anomaly distance
  parent_vote_hashes: [hash1], // DAG link to Claude's vote
  critical_dissent: false,
  justification: 'Concur. A failed judicial seat is recoverable; a downgraded fake verdict is not.',
};

const hash2 = canonicalVoteHash(vote2);
console.log(`[Vote 2 - Gemini] Hash: ${hash2}`);
console.log(`Vote: ${vote2.vote} (${vote2.confidence_bps / 100}% conf) | "${vote2.justification}"\n`);

const vote3 = {
  voter_id: 'agent-hermes',
  lane: 'hermes',
  topic: 'infra-security-lockdown',
  decision_class: 'INFRA_ROUTING',
  vote: 'ABSTAIN',
  confidence_bps: 6500,
  nonconformity_bps: 1950,
  parent_vote_hashes: [hash1, hash2], // DAG link to preceding votes
  critical_dissent: false,
  justification: 'Telemetry indicates upstream gateway latency spikes; abstaining per fail-closed protocol.',
};

const hash3 = canonicalVoteHash(vote3);
console.log(`[Vote 3 - Hermes] Hash: ${hash3}`);
console.log(`Vote: ${vote3.vote} (${vote3.confidence_bps / 100}% conf) | "${vote3.justification}"\n`);

// 2. Execute Conformal Triadic Tally
const result = tallyCtvVotes([vote1, vote2, vote3], {
  requiredQuorum: 2,
  maxAllowedNonconformityBps: 4000,
  minConfidenceBps: 5000,
});

console.log('--- CTV Consensus Verdict ---');
console.log(`Outcome:                 ${result.outcome}`);
console.log(`Quorum Met:              ${result.quorum_met} (${result.affirmative_count}/3 Affirmative)`);
console.log(`Average Confidence:      ${(result.average_confidence_bps / 100).toFixed(2)}%`);
console.log(`Max Nonconformity:       ${(result.max_nonconformity_bps / 100).toFixed(2)}%`);
console.log(`Critical Dissent Active: ${result.critical_dissent_active}`);
console.log(`Parent DAG Linkage:      ${result.parent_dag_valid ? 'VERIFIED' : 'BROKEN'}`);
