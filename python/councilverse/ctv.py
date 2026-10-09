"""
Conformal Triadic Voting (CTV v2) Protocol - Python Implementation
"""

import hashlib
import json
from dataclasses import dataclass, asdict
from typing import List, Optional, Dict, Any

@dataclass
class CtvVote:
    voter_id: str
    lane: str
    topic: str
    decision_class: str
    vote: str  # "AFFIRMATIVE", "NEGATIVE", "ABSTAIN"
    confidence_bps: int  # 0 to 10000 bps
    nonconformity_bps: int  # 0 to 10000 bps
    parent_vote_hashes: List[str]
    critical_dissent: bool
    justification: str
    subject: Optional[str] = None
    signature: Optional[str] = None

def canonical_json_dumps(obj: Any) -> str:
    """Deterministic JCS (RFC 8785) formatting."""
    return json.dumps(obj, sort_keys=True, separators=(',', ':'), ensure_ascii=False)

def canonical_vote_hash(vote: CtvVote) -> str:
    """Computes deterministic SHA-256 hash excluding signature."""
    d = asdict(vote)
    d.pop('signature', None)
    if d.get('subject') is None:
        d.pop('subject', None)
    raw = canonical_json_dumps(d)
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

def tally_ctv_votes(
    votes: List[CtvVote],
    required_quorum: int = 2,
    max_allowed_nonconformity_bps: int = 4000,
    min_confidence_bps: int = 5000,
) -> Dict[str, Any]:
    affirmative = 0
    negative = 0
    abstain = 0
    total_conf = 0
    max_nonconf = 0
    critical_dissent = False
    hashes = []

    for v in votes:
        if not (0 <= v.confidence_bps <= 10000):
            raise ValueError(f"Invalid confidence_bps {v.confidence_bps}")
        if not (0 <= v.nonconformity_bps <= 10000):
            raise ValueError(f"Invalid nonconformity_bps {v.nonconformity_bps}")

        hashes.append(canonical_vote_hash(v))
        total_conf += v.confidence_bps
        if v.nonconformity_bps > max_nonconf:
            max_nonconf = v.nonconformity_bps

        if v.critical_dissent and v.vote in ("NEGATIVE", "ABSTAIN"):
            critical_dissent = True

        if v.vote == "AFFIRMATIVE":
            affirmative += 1
        elif v.vote == "NEGATIVE":
            negative += 1
        elif v.vote == "ABSTAIN":
            abstain += 1

    total = len(votes)
    avg_conf = round(total_conf / total) if total > 0 else 0
    quorum_met = affirmative >= required_quorum

    if critical_dissent:
        outcome = "CRITICAL_DISSENT_VETO"
    elif max_nonconf > max_allowed_nonconformity_bps:
        outcome = "REJECTED"
    elif avg_conf < min_confidence_bps:
        outcome = "ABSTAIN"
    elif affirmative >= required_quorum and negative < 2:
        outcome = "CERTIFIED"
    elif negative >= 2:
        outcome = "REJECTED"
    else:
        outcome = "ABSTAIN"

    return {
        "outcome": outcome,
        "affirmative_count": affirmative,
        "negative_count": negative,
        "abstain_count": abstain,
        "total_votes": total,
        "quorum_met": quorum_met,
        "average_confidence_bps": avg_conf,
        "max_nonconformity_bps": max_nonconf,
        "critical_dissent_active": critical_dissent,
        "vote_hashes": hashes,
    }
