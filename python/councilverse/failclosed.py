"""
D4 Fail-Closed Evaluative Routing & Circuit Breakers - Python Implementation
"""

from typing import List, Dict, Any, Optional

def assert_evaluative_seat_invariant(
    seats: List[Dict[str, Any]],
    aliases: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    violations = []
    reserved_verdict_seats = set()

    for seat in seats:
        name = seat.get("model_name", "unnamed")
        seat_class = seat.get("seat_class")
        num_retries = seat.get("num_retries")
        fallbacks = seat.get("fallbacks") or []

        if seat_class == "evaluative":
            reserved_verdict_seats.add(name)
            if num_retries != 0:
                violations.append(
                    f"Seat '{name}' has num_retries = {num_retries}. Evaluative seats MUST have num_retries: 0."
                )
            if len(fallbacks) > 0:
                violations.append(
                    f"Seat '{name}' has fallback cascade {fallbacks}. Evaluative seats must fail-closed without fallbacks."
                )

    if aliases:
        for alias_key, target in aliases.items():
            if alias_key in reserved_verdict_seats:
                violations.append(
                    f"Verdict seat '{alias_key}' is defined in model_group_alias pointing to '{target}'. Aliases resolve through fallback chains and undermine fail-closed isolation."
                )

    return {
        "valid": len(violations) == 0,
        "violations": violations,
    }

def evaluate_d4_circuit_breaker(
    consecutive_abstains: int,
    elapsed_outage_seconds: int
) -> Dict[str, Any]:
    circuit_tripped = consecutive_abstains >= 2
    severity = "none"

    if elapsed_outage_seconds >= 300:
        severity = "alarm"
    elif circuit_tripped:
        severity = "digest"

    cooldown = 900 if circuit_tripped else 0

    return {
        "consecutive_abstains": consecutive_abstains,
        "circuit_tripped": circuit_tripped,
        "cooldown_remaining_secs": cooldown,
        "notification_severity": severity,
    }
