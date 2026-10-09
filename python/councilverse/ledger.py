"""
Tamper-Evident Ledger Chaining Protocol - Python Implementation
"""

import hashlib
import json
from typing import List, Dict, Any, Optional

GENESIS_HASH = "0" * 64

def compute_line_hash(line: str) -> str:
    """Computes SHA-256 hash of a stripped UTF-8 line."""
    return hashlib.sha256(line.strip().encode("utf-8")).hexdigest()

def create_chained_row(
    payload: Dict[str, Any],
    prev_line_or_row: Optional[Any] = None
) -> Dict[str, Any]:
    if prev_line_or_row is None:
        prev_hash = compute_line_hash(GENESIS_HASH)
    elif isinstance(prev_line_or_row, str):
        prev_hash = compute_line_hash(prev_line_or_row)
    else:
        raw = json.dumps(prev_line_or_row, separators=(',', ':'))
        prev_hash = compute_line_hash(raw)

    out = dict(payload)
    out["prev_hash"] = prev_hash
    return out

def verify_ledger_chain(lines: List[str]) -> Dict[str, Any]:
    clean_lines = [l.strip() for l in lines if l.strip()]
    breaks = []
    prev_line = None
    chained_count = 0

    for i, line in enumerate(clean_lines):
        try:
            parsed = json.loads(line)
        except Exception:
            breaks.append({
                "row_index": i,
                "row_id": f"malformed-line-{i}",
                "expected_prev_hash": "",
                "actual_prev_hash": "SYNTAX_ERROR",
            })
            continue

        actual_prev_hash = parsed.get("prev_hash", "")
        if prev_line is None:
            expected_prev_hash = compute_line_hash(GENESIS_HASH)
        else:
            expected_prev_hash = compute_line_hash(prev_line)

        if actual_prev_hash != expected_prev_hash:
            breaks.append({
                "row_index": i,
                "row_id": parsed.get("id", f"row-{i}"),
                "expected_prev_hash": expected_prev_hash,
                "actual_prev_hash": actual_prev_hash,
            })
        else:
            chained_count += 1

        prev_line = line

    return {
        "valid": len(breaks) == 0,
        "total_rows": len(clean_lines),
        "chained_rows": chained_count,
        "breaks": breaks,
    }
