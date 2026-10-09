/**
 * Tamper-Evident Ledger Chaining Protocol
 * 
 * Cryptographic append-only chain ensuring all agent deliberations,
 * votes, and verdicts form an unbroken, verifiable audit trail.
 */

import { createHash } from 'crypto';

export const GENESIS_HASH = '0'.repeat(64);

export interface ChainedLedgerRow {
  id: string;
  ts: string;
  prev_hash: string;
  [key: string]: any;
}

export interface LedgerVerificationResult {
  valid: boolean;
  total_rows: number;
  chained_rows: number;
  breaks: Array<{
    row_index: number;
    row_id: string;
    expected_prev_hash: string;
    actual_prev_hash: string;
  }>;
}

/**
 * Computes the SHA-256 hash of a normalized NDJSON line (without trailing newline).
 */
export function computeLineHash(line: string): string {
  return createHash('sha256').update(line.trim(), 'utf8').digest('hex');
}

/**
 * Creates a new chained ledger row stamped with prev_hash matching the previous row.
 */
export function createChainedRow<T extends Record<string, any>>(
  payload: T,
  previousLineOrRow: string | ChainedLedgerRow | null
): T & { prev_hash: string } {
  let prevHash: string;

  if (!previousLineOrRow) {
    prevHash = computeLineHash(GENESIS_HASH);
  } else if (typeof previousLineOrRow === 'string') {
    prevHash = computeLineHash(previousLineOrRow);
  } else {
    // Stringify row to canonical form
    const rawLine = JSON.stringify(previousLineOrRow);
    prevHash = computeLineHash(rawLine);
  }

  return {
    ...payload,
    prev_hash: prevHash,
  };
}

/**
 * Verifies the cryptographic integrity of an array of ledger lines (NDJSON).
 */
export function verifyLedgerChain(lines: string[]): LedgerVerificationResult {
  const cleanLines = lines.map(l => l.trim()).filter(l => l.length > 0);
  const breaks: LedgerVerificationResult['breaks'] = [];

  let previousLine: string | null = null;
  let chainedCount = 0;

  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];
    let parsed: any;
    try {
      parsed = JSON.parse(line);
    } catch {
      breaks.push({
        row_index: i,
        row_id: `malformed-line-${i}`,
        expected_prev_hash: '',
        actual_prev_hash: 'SYNTAX_ERROR',
      });
      continue;
    }

    const actualPrevHash = parsed.prev_hash || '';
    const expectedPrevHash =
      previousLine === null
        ? computeLineHash(GENESIS_HASH)
        : computeLineHash(previousLine);

    if (actualPrevHash !== expectedPrevHash) {
      breaks.push({
        row_index: i,
        row_id: parsed.id || `row-${i}`,
        expected_prev_hash: expectedPrevHash,
        actual_prev_hash: actualPrevHash,
      });
    } else {
      chainedCount++;
    }

    previousLine = line;
  }

  return {
    valid: breaks.length === 0,
    total_rows: cleanLines.length,
    chained_rows: chainedCount,
    breaks,
  };
}
