#!/usr/bin/env python3
"""
CouncilVerse v2 - Python SDK Demonstration
Conformal Triadic Voting, Fail-Closed Routing, and Ledger Integrity.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'python')))

from councilverse import (
    CtvVote,
    tally_ctv_votes,
    canonical_vote_hash,
    assert_evaluative_seat_invariant,
    create_chained_row,
    verify_ledger_chain,
)
import json

def main():
    print("=== CouncilVerse v2: Python Demonstration ===\n")

    # 1. Conformal Triadic Voting
    v1 = CtvVote(
        voter_id="agent-claude",
        lane="claude",
        topic="d4-governance",
        decision_class="GOVERNANCE",
        vote="AFFIRMATIVE",
        confidence_bps=9800,
        nonconformity_bps=800,
        parent_vote_hashes=[],
        critical_dissent=False,
        justification="Verified zero retries removes hang vulnerability."
    )
    v2 = CtvVote(
        voter_id="agent-gemini",
        lane="gemini",
        topic="d4-governance",
        decision_class="GOVERNANCE",
        vote="AFFIRMATIVE",
        confidence_bps=9500,
        nonconformity_bps=1100,
        parent_vote_hashes=[canonical_vote_hash(v1)],
        critical_dissent=False,
        justification="Concur with mathematical proof."
    )
    v3 = CtvVote(
        voter_id="agent-hermes",
        lane="hermes",
        topic="d4-governance",
        decision_class="GOVERNANCE",
        vote="ABSTAIN",
        confidence_bps=6000,
        nonconformity_bps=2100,
        parent_vote_hashes=[canonical_vote_hash(v1)],
        critical_dissent=False,
        justification="Abstaining due to upstream API latency."
    )

    result = tally_ctv_votes([v1, v2, v3])
    print(f"CTV Consensus Outcome: {result['outcome']}")
    print(f"Quorum Met:            {result['quorum_met']} ({result['affirmative_count']}/3 affirmative)")
    print(f"Average Confidence:    {result['average_confidence_bps'] / 100:.2f}%\n")

    # 2. Tamper-Evident Ledger
    r1 = create_chained_row({"id": "row-1", "action": "INIT"})
    l1 = json.dumps(r1, separators=(',', ':'))
    r2 = create_chained_row({"id": "row-2", "action": "VOTE_CERTIFIED"}, l1)
    l2 = json.dumps(r2, separators=(',', ':'))

    chain_status = verify_ledger_chain([l1, l2])
    print(f"Ledger Chain Status:   {'VERIFIED' if chain_status['valid'] else 'BROKEN'}")
    print(f"Chained Rows Count:    {chain_status['chained_rows']} / {chain_status['total_rows']}")

if __name__ == "__main__":
    main()
