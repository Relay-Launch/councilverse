import { describe, it, expect } from "vitest";
import {
  detectVote,
  detectConfidence,
  scoreArgumentQuality,
  tallyVotes,
  buildAgentVote,
  anonymizeResponses,
  buildAnonymizedReviewPrompt,
  type AgentVote,
} from "../src/index";

// ── detectVote ──────────────────────────────────────────────────────────────

describe("detectVote", () => {
  it("returns 'keep' for positive signals", () => {
    expect(detectVote("I approve this approach. We should proceed.")).toBe("keep");
    expect(detectVote("I strongly recommend and endorse this plan.")).toBe("keep");
  });

  it("returns 'refuse' for negative signals", () => {
    expect(detectVote("I must reject this. Unacceptable risk.")).toBe("refuse");
    expect(detectVote("I oppose this move. It is fundamentally flawed.")).toBe("refuse");
  });

  it("returns 'abstain' for neutral/deferral signals", () => {
    expect(detectVote("This is outside my expertise. I cannot assess the validity.")).toBe("abstain");
    expect(detectVote("I defer to the team. Need more information to evaluate.")).toBe("abstain");
  });

  it("returns 'abstain' when 2+ abstain signals match", () => {
    expect(detectVote("Outside my expertise, I cannot assess this. Need more information.")).toBe("abstain");
  });

  it("returns 'keep' when keep signals outnumber refuse", () => {
    expect(detectVote("I approve and recommend it, despite one red flag.")).toBe("keep");
  });

  it("returns 'refuse' when refuse signals outnumber keep", () => {
    expect(detectVote("I reject and oppose this, even though I support the team.")).toBe("refuse");
  });

  it("returns 'abstain' for text with no signals", () => {
    expect(detectVote("The weather is nice today.")).toBe("abstain");
  });

  it("returns 'abstain' on tie between keep and refuse", () => {
    expect(detectVote("I approve but also reject this.")).toBe("abstain");
  });
});

// ── detectConfidence ──────────────────────────────────────────────────────────

describe("detectConfidence", () => {
  it("returns base (0.5) for neutral text", () => {
    expect(detectConfidence("This is a regular analysis.")).toBe(0.5);
  });

  it("increases for high-confidence markers", () => {
    const conf = detectConfidence("I am strongly and clearly in favor. This is decisive.");
    expect(conf).toBeGreaterThan(0.5);
    expect(conf).toBeLessThanOrEqual(1.0);
  });

  it("decreases for low-confidence markers", () => {
    const conf = detectConfidence("This is uncertain and borderline. Mixed signals throughout.");
    expect(conf).toBeLessThan(0.5);
  });

  it("clamps to minimum 0.1", () => {
    const conf = detectConfidence(
      "uncertain unclear mixed signals on balance marginal borderline close call difficult to assess"
    );
    expect(conf).toBeGreaterThanOrEqual(0.1);
  });

  it("clamps to maximum 1.0", () => {
    const conf = detectConfidence(
      "strongly clearly without doubt overwhelming decisive unambiguous certain definitive"
    );
    expect(conf).toBeLessThanOrEqual(1.0);
  });
});

// ── scoreArgumentQuality ─────────────────────────────────────────────────────

describe("scoreArgumentQuality", () => {
  it("returns low score for vague text", () => {
    expect(scoreArgumentQuality("I think this is fine.")).toBeLessThan(0.2);
  });

  it("scores evidence markers", () => {
    const score = scoreArgumentQuality(
      "According to recent data shows that research from MIT indicates evidence suggests strong outcomes."
    );
    expect(score).toBeGreaterThan(0.2);
  });

  it("scores structure markers", () => {
    const score = scoreArgumentQuality(
      "First, we observe the trend. Second, we analyze. Therefore, consequently, the outcome is clear."
    );
    expect(score).toBeGreaterThan(0.2);
  });

  it("scores specificity (numbers, percentages, dollar amounts)", () => {
    const score = scoreArgumentQuality(
      "Revenue grew 15.2% in Q3 2024, reaching $4.5M."
    );
    expect(score).toBeGreaterThan(0.15);
  });

  it("rewards longer arguments", () => {
    const short = scoreArgumentQuality("Simple point.");
    const long = scoreArgumentQuality("A ".repeat(160) + "First, therefore, consequently.");
    expect(long).toBeGreaterThan(short);
  });

  it("rewards structured formatting (bullets/numbered lists)", () => {
    const withBullets = scoreArgumentQuality("First, we see growth.\n- Point one\n- Point two\n- Point three\nTherefore the conclusion is clear.");
    const withoutBullets = scoreArgumentQuality("First, we see growth. Point one Point two Point three. Therefore the conclusion is clear.");
    expect(withBullets).toBeGreaterThanOrEqual(withoutBullets);
  });

  it("clamps between 0.05 and 1.0", () => {
    expect(scoreArgumentQuality("")).toBeGreaterThanOrEqual(0.05);
    expect(scoreArgumentQuality("")).toBeLessThanOrEqual(1.0);
  });
});

// ── tallyVotes ──────────────────────────────────────────────────────────────

describe("tallyVotes", () => {
  const makeVote = (vote: "keep" | "refuse" | "abstain", quality = 0.7, confidence = 0.8): AgentVote => ({
    agent_id: `agent-${Math.random().toString(36).slice(2)}`,
    agent_name: "Test Agent",
    council_id: "test-council",
    vote,
    confidence,
    reasoning: "Test reasoning",
    argument_quality: quality,
  });

  it("returns deadlock when all votes are abstain", () => {
    const result = tallyVotes([makeVote("abstain"), makeVote("abstain"), makeVote("abstain")]);
    expect(result.outcome).toBe("deadlock");
    expect(result.method).toBe("lead_fallback");
    expect(result.abstain_count).toBe(3);
  });

  it("returns strong_consensus for unanimous keep", () => {
    const result = tallyVotes([makeVote("keep"), makeVote("keep"), makeVote("keep")]);
    expect(result.outcome).toBe("keep");
    expect(result.method).toBe("strong_consensus");
  });

  it("returns strong_consensus for unanimous refuse", () => {
    const result = tallyVotes([makeVote("refuse"), makeVote("refuse"), makeVote("refuse")]);
    expect(result.outcome).toBe("refuse");
    expect(result.method).toBe("strong_consensus");
  });

  it("uses quality_weighted when margin >= 0.15", () => {
    const votes = [
      makeVote("keep", 0.9, 0.9),    // weight = 0.81
      makeVote("refuse", 0.3, 0.3),  // weight = 0.09
    ];
    const result = tallyVotes(votes);
    expect(result.outcome).toBe("keep");
    expect(result.method).toBe("quality_weighted");
    expect(result.margin).toBeGreaterThanOrEqual(0.15);
  });

  it("returns deadlock when margin < 0.15", () => {
    const votes = [
      makeVote("keep", 0.5, 0.5),    // weight = 0.25
      makeVote("refuse", 0.5, 0.5),  // weight = 0.25
    ];
    const result = tallyVotes(votes);
    expect(result.outcome).toBe("deadlock");
    expect(result.method).toBe("lead_fallback");
    expect(result.margin).toBeLessThan(0.15);
  });

  it("ignores abstain votes in weight calculation", () => {
    const votes = [
      makeVote("keep", 0.9, 0.9),
      makeVote("abstain"),
      makeVote("abstain"),
    ];
    const result = tallyVotes(votes);
    expect(result.outcome).toBe("keep");
    expect(result.abstain_count).toBe(2);
    expect(result.total_voters).toBe(3);
  });

  it("requires 2+ votes for strong_consensus", () => {
    const result = tallyVotes([makeVote("keep")]);
    // Only 1 keep vote — not enough for "strong_consensus"
    // with 0 refuse, unanimousKeep check requires keepCount >= 2
    expect(result.method).not.toBe("strong_consensus");
  });
});

// ── buildAgentVote ──────────────────────────────────────────────────────────

describe("buildAgentVote", () => {
  it("auto-detects vote, confidence, and quality from text", () => {
    const vote = buildAgentVote(
      "agent-1",
      "Strategy Analyst",
      "strategy-room",
      "I strongly recommend proceeding. Data shows 15% revenue growth in Q3 2024. First, the market is favorable. Second, our position is strong."
    );
    expect(vote.agent_id).toBe("agent-1");
    expect(vote.agent_name).toBe("Strategy Analyst");
    expect(vote.council_id).toBe("strategy-room");
    expect(vote.vote).toBe("keep");
    expect(vote.confidence).toBeGreaterThan(0.5);
    expect(vote.argument_quality).toBeGreaterThan(0.1);
  });

  it("preserves reasoning text", () => {
    const text = "I oppose this. Red flag detected.";
    const vote = buildAgentVote("a", "B", "c", text);
    expect(vote.reasoning).toBe(text);
  });
});

// ── anonymizeResponses ──────────────────────────────────────────────────────

describe("anonymizeResponses", () => {
  it("produces labeled responses", () => {
    const responses = [
      { role: "Analyst", response: "Good point" },
      { role: "Engineer", response: "Bad point" },
    ];
    const { responses: anon } = anonymizeResponses(responses);
    expect(anon).toHaveLength(2);
    expect(anon[0].label).toMatch(/^Response [A-Z]$/);
    expect(anon[1].label).toMatch(/^Response [A-Z]$/);
  });

  it("preserves all response content", () => {
    const responses = [
      { role: "A", response: "Alpha" },
      { role: "B", response: "Beta" },
      { role: "C", response: "Gamma" },
    ];
    const { responses: anon } = anonymizeResponses(responses);
    const texts = anon.map((r) => r.response).sort();
    expect(texts).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("keyMap links labels back to original indices", () => {
    const responses = [{ role: "X", response: "One" }];
    const { responses: anon, keyMap } = anonymizeResponses(responses);
    const label = anon[0].label;
    expect(keyMap.get(label)).toBe(0);
  });
});

// ── buildAnonymizedReviewPrompt ──────────────────────────────────────────────

describe("buildAnonymizedReviewPrompt", () => {
  it("includes the question and response labels", () => {
    const anonymized = anonymizeResponses([
      { role: "A", response: "My analysis shows..." },
      { role: "B", response: "I believe..." },
    ]);
    const prompt = buildAnonymizedReviewPrompt("Should we proceed?", anonymized);
    expect(prompt).toContain("Should we proceed?");
    expect(prompt).toContain("Response A");
    expect(prompt).toContain("Response B");
    expect(prompt).toContain("EVIDENCE QUALITY");
    expect(prompt).toContain("LOGICAL COHERENCE");
    expect(prompt).toContain("NOVELTY");
    expect(prompt).toContain("BIAS INDICATORS");
  });

  it("does not expose role names", () => {
    const anonymized = anonymizeResponses([
      { role: "Secret Agent", response: "Classified info" },
    ]);
    const prompt = buildAnonymizedReviewPrompt("Question", anonymized);
    expect(prompt).not.toContain("Secret Agent");
  });
});
