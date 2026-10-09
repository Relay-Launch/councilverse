/**
 * D4 Fail-Closed Evaluative Routing & Circuit Breaker Invariants
 * 
 * Implements the operational principles established in RelayLaunch D4 v2.2:
 * 1. Zero Retries: Evaluative seats must fail immediately (num_retries = 0) so hangs do not exceed timeout windows.
 * 2. Anti-Downgrade Invariant: Judicial verdicts must never cascade to cheaper or different models.
 * 3. D4.6 Circuit Breaker: Two consecutive ABSTAIN verdicts trip a 15-minute circuit breaker, logged as a quiet digest row.
 * 4. D4.10 Outage Window: Failures spanning >= 300 seconds trigger formal escalation.
 */

export interface EvaluativeSeatConfig {
  model_name: string;
  num_retries: number;
  fallbacks?: string[];
  seat_class?: 'evaluative' | 'generative' | 'triage';
}

export interface InvariantValidationResult {
  valid: boolean;
  violations: string[];
}

/**
 * Asserts that evaluative and judicial seats comply with the fail-closed anti-downgrade rule.
 */
export function assertEvaluativeSeatInvariant(
  seats: EvaluativeSeatConfig[],
  aliases?: Record<string, string>
): InvariantValidationResult {
  const violations: string[] = [];

  for (const seat of seats) {
    if (seat.seat_class === 'evaluative') {
      // Rule 1: Zero retries on evaluative seats
      if (seat.num_retries !== 0) {
        violations.push(
          `Seat '${seat.model_name}' has num_retries = ${seat.num_retries}. Evaluative seats MUST have num_retries: 0.`
        );
      }

      // Rule 2: Evaluative seats must never have fallback routes (anti-downgrade)
      if (seat.fallbacks && seat.fallbacks.length > 0) {
        violations.push(
          `Seat '${seat.model_name}' has fallback cascade [${seat.fallbacks.join(', ')}]. Evaluative seats must fail-closed without fallbacks.`
        );
      }
    }
  }

  // Rule 3: Strict alias check — verdict seats cannot be keys in model_group_alias
  if (aliases) {
    const reservedVerdictSeats = new Set(
      seats.filter(s => s.seat_class === 'evaluative').map(s => s.model_name)
    );
    for (const [aliasKey, target] of Object.entries(aliases)) {
      if (reservedVerdictSeats.has(aliasKey)) {
        violations.push(
          `Verdict seat '${aliasKey}' is defined in model_group_alias pointing to '${target}'. Aliases resolve through fallback chains and undermine fail-closed isolation.`
        );
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

export interface CircuitBreakerState {
  consecutive_abstains: number;
  circuit_tripped: boolean;
  cooldown_remaining_secs: number;
  notification_severity: 'digest' | 'alarm' | 'none';
}

/**
 * Evaluates the D4.6 and D4.10 circuit breakers on council deliberation sequences.
 */
export function evaluateD4CircuitBreaker(
  consecutiveAbstains: number,
  elapsedOutageSeconds: number
): CircuitBreakerState {
  // D4.6 Rule: Two consecutive ABSTAINs trip the 15-minute breaker
  const circuitTripped = consecutiveAbstains >= 2;

  // D4.6 emits quiet digest rows; D4.10 emits alarm only if outage >= 300s
  let severity: CircuitBreakerState['notification_severity'] = 'none';
  if (elapsedOutageSeconds >= 300) {
    severity = 'alarm';
  } else if (circuitTripped) {
    severity = 'digest';
  }

  const cooldownRemaining = circuitTripped ? 900 : 0; // 15-minute cooldown (900s)

  return {
    consecutive_abstains: consecutiveAbstains,
    circuit_tripped: circuitTripped,
    cooldown_remaining_secs: cooldownRemaining,
    notification_severity: severity,
  };
}
