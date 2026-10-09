import { describe, it, expect } from 'vitest';
import {
  canonicalVoteHash,
  tallyCtvVotes,
  assertEvaluativeSeatInvariant,
  evaluateD4CircuitBreaker,
  createChainedRow,
  verifyLedgerChain,
  GENESIS_HASH,
  type CtvVote,
} from '../src/index';

describe('Councilverse v2 Protocol Suite', () => {
  describe('Conformal Triadic Voting (CTV v2)', () => {
    it('computes deterministic JCS hashes regardless of key insertion order', () => {
      const voteA: any = {
        voter_id: 'agent-1',
        lane: 'claude',
        topic: 'd4-governance',
        decision_class: 'INFRA_ROUTING',
        vote: 'AFFIRMATIVE',
        confidence_bps: 9500,
        nonconformity_bps: 1200,
        parent_vote_hashes: ['0000000000000000000000000000000000000000000000000000000000000000'],
        critical_dissent: false,
        justification: 'Zero retries prevents router timeout stalls.',
      };

      // Create voteB with inverted keys
      const voteB: any = {
        justification: 'Zero retries prevents router timeout stalls.',
        critical_dissent: false,
        parent_vote_hashes: ['0000000000000000000000000000000000000000000000000000000000000000'],
        nonconformity_bps: 1200,
        confidence_bps: 9500,
        vote: 'AFFIRMATIVE',
        decision_class: 'INFRA_ROUTING',
        topic: 'd4-governance',
        lane: 'claude',
        voter_id: 'agent-1',
      };

      const hashA = canonicalVoteHash(voteA);
      const hashB = canonicalVoteHash(voteB);
      expect(hashA).toBe(hashB);
      expect(hashA.length).toBe(64);
    });

    it('certifies when 2-of-3 quorum is reached with healthy basis points', () => {
      const votes: CtvVote[] = [
        {
          voter_id: 'agent-1',
          lane: 'claude',
          topic: 'd4-governance',
          decision_class: 'INFRA_ROUTING',
          vote: 'AFFIRMATIVE',
          confidence_bps: 9500,
          nonconformity_bps: 1000,
          parent_vote_hashes: [],
          critical_dissent: false,
          justification: 'Approved',
        },
        {
          voter_id: 'agent-2',
          lane: 'gemini',
          topic: 'd4-governance',
          decision_class: 'INFRA_ROUTING',
          vote: 'AFFIRMATIVE',
          confidence_bps: 9200,
          nonconformity_bps: 1500,
          parent_vote_hashes: [],
          critical_dissent: false,
          justification: 'Concur',
        },
        {
          voter_id: 'agent-3',
          lane: 'hermes',
          topic: 'd4-governance',
          decision_class: 'INFRA_ROUTING',
          vote: 'ABSTAIN',
          confidence_bps: 6000,
          nonconformity_bps: 2000,
          parent_vote_hashes: [],
          critical_dissent: false,
          justification: 'Neutral',
        },
      ];

      const result = tallyCtvVotes(votes);
      expect(result.outcome).toBe('CERTIFIED');
      expect(result.quorum_met).toBe(true);
      expect(result.affirmative_count).toBe(2);
      expect(result.abstain_count).toBe(1);
      expect(result.critical_dissent_active).toBe(false);
    });

    it('triggers CRITICAL_DISSENT_VETO immediately if an objection flags critical dissent', () => {
      const votes: CtvVote[] = [
        {
          voter_id: 'agent-1',
          lane: 'claude',
          topic: 'd4-governance',
          decision_class: 'GOVERNANCE',
          vote: 'AFFIRMATIVE',
          confidence_bps: 9900,
          nonconformity_bps: 500,
          parent_vote_hashes: [],
          critical_dissent: false,
          justification: 'Approved by majority',
        },
        {
          voter_id: 'agent-2',
          lane: 'hermes',
          topic: 'd4-governance',
          decision_class: 'GOVERNANCE',
          vote: 'AFFIRMATIVE',
          confidence_bps: 9800,
          nonconformity_bps: 600,
          parent_vote_hashes: [],
          critical_dissent: false,
          justification: 'Approved by majority',
        },
        {
          voter_id: 'agent-3',
          lane: 'gemini',
          topic: 'd4-governance',
          decision_class: 'GOVERNANCE',
          vote: 'NEGATIVE',
          confidence_bps: 9500,
          nonconformity_bps: 3500,
          parent_vote_hashes: [],
          critical_dissent: true, // Fail-closed veto!
          justification: 'Found security loophole in token extraction',
        },
      ];

      const result = tallyCtvVotes(votes);
      expect(result.outcome).toBe('CRITICAL_DISSENT_VETO');
      expect(result.critical_dissent_active).toBe(true);
    });
  });

  describe('D4 Fail-Closed Evaluative Router Invariants', () => {
    it('passes clean when all evaluative seats have num_retries = 0 and no fallbacks', () => {
      const seats = [
        { model_name: 'judge', num_retries: 0, seat_class: 'evaluative' as const },
        { model_name: 'adversarial', num_retries: 0, seat_class: 'evaluative' as const },
        { model_name: 'council', num_retries: 0, seat_class: 'evaluative' as const },
        { model_name: 'worker-slm', num_retries: 3, fallbacks: ['cloud-backup'], seat_class: 'generative' as const },
      ];

      const res = assertEvaluativeSeatInvariant(seats);
      expect(res.valid).toBe(true);
      expect(res.violations.length).toBe(0);
    });

    it('catches violations when an evaluative seat has retries or fallback cascade', () => {
      const seats = [
        { model_name: 'judge', num_retries: 2, seat_class: 'evaluative' as const },
        { model_name: 'adversarial', num_retries: 0, fallbacks: ['cheaper-model'], seat_class: 'evaluative' as const },
      ];

      const res = assertEvaluativeSeatInvariant(seats);
      expect(res.valid).toBe(false);
      expect(res.violations.length).toBe(2);
      expect(res.violations[0]).toContain('num_retries: 0');
      expect(res.violations[1]).toContain('must fail-closed without fallbacks');
    });

    it('evaluates D4.6 2-abstain breaker and D4.10 300s window', () => {
      // 1 abstain -> no trip
      const s1 = evaluateD4CircuitBreaker(1, 45);
      expect(s1.circuit_tripped).toBe(false);
      expect(s1.notification_severity).toBe('none');

      // 2 abstains under 300s -> trips quiet digest
      const s2 = evaluateD4CircuitBreaker(2, 120);
      expect(s2.circuit_tripped).toBe(true);
      expect(s2.notification_severity).toBe('digest');
      expect(s2.cooldown_remaining_secs).toBe(900);

      // Outage >= 300s -> alarm
      const s3 = evaluateD4CircuitBreaker(2, 310);
      expect(s3.circuit_tripped).toBe(true);
      expect(s3.notification_severity).toBe('alarm');
    });
  });

  describe('Tamper-Evident Ledger Chaining', () => {
    it('builds a verified ledger chain from genesis and detects breaks', () => {
      const row1 = createChainedRow({ id: 'row-1', text: 'Genesis block' }, null);
      const line1 = JSON.stringify(row1);

      const row2 = createChainedRow({ id: 'row-2', text: 'Second block' }, line1);
      const line2 = JSON.stringify(row2);

      const row3 = createChainedRow({ id: 'row-3', text: 'Third block' }, line2);
      const line3 = JSON.stringify(row3);

      const validChain = [line1, line2, line3];
      const check = verifyLedgerChain(validChain);
      expect(check.valid).toBe(true);
      expect(check.chained_rows).toBe(3);
      expect(check.breaks.length).toBe(0);

      // Tamper with row2 content
      const tamperedRow2 = { ...row2, text: 'Tampered content!' };
      const tamperedLine2 = JSON.stringify(tamperedRow2);
      const brokenChain = [line1, tamperedLine2, line3];

      const brokenCheck = verifyLedgerChain(brokenChain);
      expect(brokenCheck.valid).toBe(false);
      expect(brokenCheck.breaks.length).toBe(1);
      expect(brokenCheck.breaks[0].row_index).toBe(2); // row 3 expects hash of line 2, which changed
    });
  });
});
