import unittest
import json
from councilverse import (
    CtvVote,
    tally_ctv_votes,
    canonical_vote_hash,
    assert_evaluative_seat_invariant,
    evaluate_d4_circuit_breaker,
    create_chained_row,
    verify_ledger_chain,
)

class TestCouncilversePython(unittest.TestCase):
    def test_ctv_canonical_hash_and_tally(self):
        v1 = CtvVote(
            voter_id="voter-1",
            lane="claude",
            topic="test-topic",
            decision_class="GOVERNANCE",
            vote="AFFIRMATIVE",
            confidence_bps=9500,
            nonconformity_bps=1200,
            parent_vote_hashes=[],
            critical_dissent=False,
            justification="Looks solid",
        )
        v2 = CtvVote(
            voter_id="voter-2",
            lane="gemini",
            topic="test-topic",
            decision_class="GOVERNANCE",
            vote="AFFIRMATIVE",
            confidence_bps=9200,
            nonconformity_bps=1400,
            parent_vote_hashes=[],
            critical_dissent=False,
            justification="Approved",
        )
        h1 = canonical_vote_hash(v1)
        self.assertEqual(len(h1), 64)

        res = tally_ctv_votes([v1, v2], required_quorum=2)
        self.assertEqual(res["outcome"], "CERTIFIED")
        self.assertEqual(res["affirmative_count"], 2)

    def test_failclosed_invariants(self):
        seats = [
            {"model_name": "judge", "seat_class": "evaluative", "num_retries": 0},
            {"model_name": "worker", "seat_class": "generative", "num_retries": 3, "fallbacks": ["backup"]},
        ]
        res = assert_evaluative_seat_invariant(seats)
        self.assertTrue(res["valid"])

        bad_seats = [
            {"model_name": "judge", "seat_class": "evaluative", "num_retries": 2},
        ]
        bad_res = assert_evaluative_seat_invariant(bad_seats)
        self.assertFalse(bad_res["valid"])

    def test_ledger_chaining(self):
        r1 = create_chained_row({"id": "1", "msg": "Genesis"})
        l1 = json.dumps(r1)
        r2 = create_chained_row({"id": "2", "msg": "Followup"}, l1)
        l2 = json.dumps(r2)

        ver = verify_ledger_chain([l1, l2])
        self.assertTrue(ver["valid"])
        self.assertEqual(ver["chained_rows"], 2)

        # Tamper
        tampered_l1 = json.dumps({"id": "1", "msg": "Hacked", "prev_hash": r1["prev_hash"]})
        bad_ver = verify_ledger_chain([tampered_l1, l2])
        self.assertFalse(bad_ver["valid"])

if __name__ == "__main__":
    unittest.main()
