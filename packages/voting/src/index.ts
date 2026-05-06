export type Vote = "keep" | "refuse" | "abstain";

export interface AgentVote {
  agent_id: string;
  agent_name: string;
  council_id: string;
  vote: Vote;
  confidence: number;
  reasoning: string;
  argument_quality: number;
}

export interface VotingResult {
  outcome: "keep" | "refuse" | "deadlock";
  method: "strong_consensus" | "quality_weighted" | "lead_fallback";
  keep_weight: number;
  refuse_weight: number;
  abstain_count: number;
  total_voters: number;
  margin: number;
  votes: AgentVote[];
}

const KEEP_SIGNALS = [
  "approve", "proceed", "recommend", "support", "endorse",
  "green light", "in favor", "should proceed", "compelling case",
  "outweighs the risk", "net positive", "strategically sound",
];

const REFUSE_SIGNALS = [
  "reject", "decline", "oppose", "against", "do not proceed",
  "red flag", "unacceptable risk", "deal-breaker", "halt",
  "fundamentally flawed", "insufficient evidence", "cannot support",
];

const ABSTAIN_SIGNALS = [
  "outside my expertise", "cannot assess", "insufficient knowledge",
  "defer to", "not qualified", "beyond my scope", "no opinion",
  "unable to evaluate", "need more information", "inconclusive",
];

export function detectVote(text: string): Vote {
  const lower = text.toLowerCase();

  const abstainHits = ABSTAIN_SIGNALS.filter(s => lower.includes(s)).length;
  if (abstainHits >= 2) return "abstain";

  const keepHits = KEEP_SIGNALS.filter(s => lower.includes(s)).length;
  const refuseHits = REFUSE_SIGNALS.filter(s => lower.includes(s)).length;

  if (abstainHits > 0 && keepHits === 0 && refuseHits === 0) return "abstain";
  if (keepHits > refuseHits) return "keep";
  if (refuseHits > keepHits) return "refuse";
  return "abstain";
}

export function detectConfidence(text: string): number {
  const lower = text.toLowerCase();

  const highConfidence = [
    "strongly", "clearly", "without doubt", "overwhelming",
    "decisive", "unambiguous", "certain", "definitive",
  ];
  const lowConfidence = [
    "uncertain", "unclear", "mixed signals", "on balance",
    "marginal", "borderline", "close call", "difficult to assess",
  ];

  const highHits = highConfidence.filter(s => lower.includes(s)).length;
  const lowHits = lowConfidence.filter(s => lower.includes(s)).length;

  const base = 0.5;
  const adjustment = (highHits * 0.12) - (lowHits * 0.12);
  return Math.max(0.1, Math.min(1.0, base + adjustment));
}

export function scoreArgumentQuality(text: string): number {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  let score = 0;

  const evidenceMarkers = [
    "data shows", "according to", "based on", "evidence suggests",
    "research from", "study by", "per the", "as noted in",
  ];
  const structureMarkers = [
    "first", "second", "third", "therefore", "consequently",
    "in contrast", "on the other hand", "specifically",
  ];
  const specificityMarkers = [
    /\d+(\.\d+)?%/, /\$[\d,.]+/, /\d{4}/, /\bq[1-4]\b/i,
  ];

  score += Math.min(evidenceMarkers.filter(m => lower.includes(m)).length / 4, 0.35);
  score += Math.min(structureMarkers.filter(m => lower.includes(m)).length / 4, 0.30);
  score += Math.min(specificityMarkers.filter(p => p.test(text)).length / 3, 0.20);

  if (words.length >= 150) score += 0.05;
  if (words.length >= 300) score += 0.05;
  if (/^\s*[-*]\s/m.test(text) || /^\s*\d+[.)]\s/m.test(text)) score += 0.05;

  return Math.max(0.05, Math.min(1.0, score));
}

export function tallyVotes(votes: AgentVote[]): VotingResult {
  const activeVotes = votes.filter(v => v.vote !== "abstain");
  const abstainCount = votes.length - activeVotes.length;

  if (activeVotes.length === 0) {
    return {
      outcome: "deadlock",
      method: "lead_fallback",
      keep_weight: 0,
      refuse_weight: 0,
      abstain_count: abstainCount,
      total_voters: votes.length,
      margin: 0,
      votes,
    };
  }

  let keepWeight = 0;
  let refuseWeight = 0;

  for (const v of activeVotes) {
    const weight = v.argument_quality * v.confidence;
    if (v.vote === "keep") keepWeight += weight;
    else if (v.vote === "refuse") refuseWeight += weight;
  }

  const totalWeight = keepWeight + refuseWeight;
  const margin = totalWeight > 0
    ? Math.abs(keepWeight - refuseWeight) / totalWeight
    : 0;

  const keepCount = activeVotes.filter(v => v.vote === "keep").length;
  const refuseCount = activeVotes.filter(v => v.vote === "refuse").length;

  const unanimousKeep = refuseCount === 0 && keepCount >= 2;
  const unanimousRefuse = keepCount === 0 && refuseCount >= 2;

  let method: VotingResult["method"];
  let outcome: VotingResult["outcome"];

  if (unanimousKeep || unanimousRefuse) {
    method = "strong_consensus";
    outcome = unanimousKeep ? "keep" : "refuse";
  } else if (margin >= 0.15) {
    method = "quality_weighted";
    outcome = keepWeight > refuseWeight ? "keep" : "refuse";
  } else {
    method = "lead_fallback";
    outcome = "deadlock";
  }

  return {
    outcome,
    method,
    keep_weight: Math.round(keepWeight * 1000) / 1000,
    refuse_weight: Math.round(refuseWeight * 1000) / 1000,
    abstain_count: abstainCount,
    total_voters: votes.length,
    margin: Math.round(margin * 1000) / 1000,
    votes,
  };
}

export function buildAgentVote(
  agentId: string,
  agentName: string,
  councilId: string,
  text: string,
): AgentVote {
  return {
    agent_id: agentId,
    agent_name: agentName,
    council_id: councilId,
    vote: detectVote(text),
    confidence: detectConfidence(text),
    reasoning: text,
    argument_quality: scoreArgumentQuality(text),
  };
}

export interface AnonymizedResponse {
  label: string;
  response: string;
  originalIndex: number;
}

export interface AnonymizedSet {
  responses: AnonymizedResponse[];
  keyMap: Map<string, number>;
}

const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function anonymizeResponses(
  responses: { role: string; response: string }[],
): AnonymizedSet {
  const shuffled = responses.map((r, i) => ({ ...r, originalIndex: i }));
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const keyMap = new Map<string, number>();
  const anonymized = shuffled.map((r, i) => {
    const label = `Response ${LABELS[i] || String(i + 1)}`;
    keyMap.set(label, r.originalIndex);
    return { label, response: r.response, originalIndex: r.originalIndex };
  });

  return { responses: anonymized, keyMap };
}

export function buildAnonymizedReviewPrompt(
  question: string,
  anonymizedSet: AnonymizedSet,
): string {
  const block = anonymizedSet.responses
    .map((r) => `--- ${r.label} ---\n${r.response}`)
    .join("\n\n");

  return [
    "You are an impartial peer reviewer. The following responses were submitted anonymously to a council debate.",
    "You do NOT know which model or role produced each response.",
    "",
    `Question: "${question}"`,
    "",
    block,
    "",
    "For each response, evaluate:",
    "1. EVIDENCE QUALITY — does it cite specific data, examples, or reasoning?",
    "2. LOGICAL COHERENCE — is the argument internally consistent?",
    "3. NOVELTY — does it surface insights the others miss?",
    "4. BIAS INDICATORS — does it defer excessively or hedge without substance?",
    "",
    "Then rank them best-to-worst with a 1-sentence justification per ranking.",
  ].join("\n");
}
