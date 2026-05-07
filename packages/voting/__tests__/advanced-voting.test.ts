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

describe("detectVote — edge cases", () => {
  it("returns 'keep' when approve signals dominate", () => {
    expect(detectVote("I approve and recommend this strongly. We should proceed.")).toBe("keep");
  });

  it("returns 'refuse' when reject signals dominate", () => {
    expect(detectVote("I reject this proposal. The risk is unacceptable. Red flag detected.")).toBe("refuse");
  });

  it("returns 'abstain' when two abstain signals present", () => {
    expect(detectVote("This is outside my expertise. I cannot assess this matter.")).toBe("abstain");
  });

  it("handles mixed signals — picks strongest", () => {
    expect(detectVote("I approve and support this, though there is one red flag")).toBe("keep");
  });

  it("returns 'abstain' for completely neutral text", () => {
    expect(detectVote("The sky is blue today.")).toBe("abstain");
  });

  it("returns 'keep' for single approve signal vs zero refuse", () => {
    expect(detectVote("I endorse the proposal presented here")).toBe("keep");
  });

  it("returns 'refuse' for strong rejection language", () => {
    expect(detectVote("This is fundamentally flawed. I oppose this. Do not proceed.")).toBe("refuse");
  });

  it("handles case-insensitive matching", () => {
    expect(detectVote("I APPROVE AND RECOMMEND PROCEEDING")).toBe("keep");
  });
});

describe("detectConfidence — edge cases", () => {
  it("returns high confidence for strong language", () => {
    const c = detectConfidence("I am strongly certain this is correct. Without doubt this is the answer. Clearly the best path.");
    expect(c).toBeGreaterThan(0.7);
  });

  it("returns low confidence for hedging language", () => {
    const c = detectConfidence("This is uncertain and unclear. Mixed signals make it a close call.");
    expect(c).toBeLessThan(0.4);
  });

  it("returns base confidence for neutral text", () => {
    const c = detectConfidence("The proposal has merits.");
    expect(c).toBe(0.5);
  });

  it("clamps to minimum 0.1", () => {
    const c = detectConfidence("uncertain unclear mixed signals on balance marginal borderline close call difficult to assess");
    expect(c).toBeGreaterThanOrEqual(0.1);
  });

  it("clamps to maximum 1.0", () => {
    const c = detectConfidence("strongly clearly without doubt overwhelming decisive unambiguous certain definitive");
    expect(c).toBeLessThanOrEqual(1.0);
  });
});

describe("scoreArgumentQuality — diverse inputs", () => {
  it("scores high for evidence-rich structured argument", () => {
    const text = `First, data shows that revenue grew 45% in Q3 2024. 
    According to McKinsey research, the market opportunity is $2.3B.
    Second, evidence suggests this is a net positive. 
    Therefore, we should proceed.
    Specifically, the ROI is $500K over 12 months.`;
    expect(scoreArgumentQuality(text)).toBeGreaterThan(0.5);
  });

  it("scores low for vague assertion", () => {
    const score = scoreArgumentQuality("I think this is good.");
    expect(score).toBeLessThan(0.2);
  });

  it("rewards bullet-point structure", () => {
    const withBullets = "First, data shows growth. Second, the strategy is sound.\n- Point one is clear\n- Point two demonstrates value\n- Point three confirms alignment";
    const withoutBullets = "First, data shows growth. Second, the strategy is sound. Point one is clear. Point two demonstrates value. Point three confirms alignment.";
    expect(scoreArgumentQuality(withBullets)).toBeGreaterThan(scoreArgumentQuality(withoutBullets));
  });

  it("rewards specificity markers (percentages, dollars, dates)", () => {
    const specific = "Growth was 23.5% in Q4, worth $1.2M in 2024.";
    const vague = "Growth was significant recently, worth a lot.";
    expect(scoreArgumentQuality(specific)).toBeGreaterThan(scoreArgumentQuality(vague));
  });

  it("never exceeds 1.0", () => {
    const maximal = `First, data shows 95% success. According to research from Harvard,
    based on evidence suggests 2024 $100M Q3 specifically therefore consequently 
    in contrast on the other hand. Second, per the study by MIT.
    - bullet 1
    - bullet 2
    ` + " word".repeat(300);
    expect(scoreArgumentQuality(maximal)).toBeLessThanOrEqual(1.0);
  });

  it("never goes below 0.05", () => {
    expect(scoreArgumentQuality("")).toBeGreaterThanOrEqual(0.05);
  });
});

describe("tallyVotes — complex scenarios", () => {
  const makeVote = (vote: "keep" | "refuse" | "abstain", confidence: number, quality: number): AgentVote => ({
    agent_id: `agent-${Math.random().toString(36).slice(2)}`,
    agent_name: "Test Agent",
    council_id: "test-council",
    vote,
    confidence,
    reasoning: "test",
    argument_quality: quality,
  });

  it("returns deadlock when all votes are abstain", () => {
    const result = tallyVotes([makeVote("abstain", 0.5, 0.5), makeVote("abstain", 0.6, 0.4)]);
    expect(result.outcome).toBe("deadlock");
    expect(result.method).toBe("lead_fallback");
    expect(result.abstain_count).toBe(2);
  });

  it("returns strong_consensus when all active votes are keep", () => {
    const result = tallyVotes([
      makeVote("keep", 0.8, 0.7),
      makeVote("keep", 0.9, 0.6),
      makeVote("abstain", 0.5, 0.5),
    ]);
    expect(result.outcome).toBe("keep");
    expect(result.method).toBe("strong_consensus");
  });

  it("returns strong_consensus refuse when all active votes are refuse", () => {
    const result = tallyVotes([
      makeVote("refuse", 0.9, 0.8),
      makeVote("refuse", 0.7, 0.6),
    ]);
    expect(result.outcome).toBe("refuse");
    expect(result.method).toBe("strong_consensus");
  });

  it("uses quality_weighted when margin >= 0.15", () => {
    const result = tallyVotes([
      makeVote("keep", 0.9, 0.9), // weight = 0.81
      makeVote("refuse", 0.3, 0.2), // weight = 0.06
    ]);
    expect(result.outcome).toBe("keep");
    expect(result.method).toBe("quality_weighted");
  });

  it("returns deadlock when margin < 0.15", () => {
    const result = tallyVotes([
      makeVote("keep", 0.5, 0.5), // weight = 0.25
      makeVote("refuse", 0.5, 0.5), // weight = 0.25
    ]);
    expect(result.outcome).toBe("deadlock");
    expect(result.method).toBe("lead_fallback");
    expect(result.margin).toBe(0);
  });

  it("correctly counts total voters including abstentions", () => {
    const result = tallyVotes([
      makeVote("keep", 0.8, 0.7),
      makeVote("refuse", 0.6, 0.5),
      makeVote("abstain", 0.4, 0.3),
    ]);
    expect(result.total_voters).toBe(3);
    expect(result.abstain_count).toBe(1);
  });

  it("handles single voter (not strong_consensus — needs >= 2)", () => {
    const result = tallyVotes([makeVote("keep", 0.9, 0.9)]);
    // 1 keep vote, 0 refuse — but strong_consensus requires >= 2 active
    expect(result.outcome).toBe("keep");
    // margin should be 1.0 (all weight on keep side) → quality_weighted
    expect(result.method).toBe("quality_weighted");
  });
});

describe("buildAgentVote — integration", () => {
  it("constructs complete vote from reasoning text", () => {
    const vote = buildAgentVote(
      "analyst-1",
      "Market Analyst",
      "council-abc",
      "I strongly approve this proposal. Data shows 40% growth potential. Based on evidence from our Q4 report, I recommend proceeding.",
    );
    expect(vote.agent_id).toBe("analyst-1");
    expect(vote.agent_name).toBe("Market Analyst");
    expect(vote.council_id).toBe("council-abc");
    expect(vote.vote).toBe("keep");
    expect(vote.confidence).toBeGreaterThan(0.5);
    expect(vote.argument_quality).toBeGreaterThan(0.1);
    expect(vote.reasoning).toContain("approve");
  });
});

describe("anonymizeResponses", () => {
  it("assigns unique labels A, B, C to responses", () => {
    const result = anonymizeResponses([
      { role: "Analyst", response: "First response" },
      { role: "Strategist", response: "Second response" },
      { role: "Red Cell", response: "Third response" },
    ]);
    const labels = result.responses.map(r => r.label);
    expect(labels).toHaveLength(3);
    expect(new Set(labels).size).toBe(3); // all unique
    expect(labels.every(l => l.startsWith("Response "))).toBe(true);
  });

  it("preserves originalIndex for de-anonymization", () => {
    const result = anonymizeResponses([
      { role: "A", response: "aaa" },
      { role: "B", response: "bbb" },
    ]);
    const indices = result.responses.map(r => r.originalIndex);
    expect(indices.sort()).toEqual([0, 1]);
  });

  it("keyMap correctly maps labels to original indices", () => {
    const result = anonymizeResponses([
      { role: "First", response: "x" },
      { role: "Second", response: "y" },
    ]);
    for (const resp of result.responses) {
      expect(result.keyMap.get(resp.label)).toBe(resp.originalIndex);
    }
  });

  it("handles single response", () => {
    const result = anonymizeResponses([{ role: "Solo", response: "only one" }]);
    expect(result.responses).toHaveLength(1);
    expect(result.responses[0].label).toBe("Response A");
  });

  it("handles empty array", () => {
    const result = anonymizeResponses([]);
    expect(result.responses).toHaveLength(0);
    expect(result.keyMap.size).toBe(0);
  });
});

describe("buildAnonymizedReviewPrompt", () => {
  it("includes question in output", () => {
    const set = anonymizeResponses([{ role: "A", response: "test" }]);
    const prompt = buildAnonymizedReviewPrompt("Should we expand?", set);
    expect(prompt).toContain("Should we expand?");
  });

  it("includes all response labels", () => {
    const set = anonymizeResponses([
      { role: "A", response: "first" },
      { role: "B", response: "second" },
    ]);
    const prompt = buildAnonymizedReviewPrompt("Test?", set);
    for (const r of set.responses) {
      expect(prompt).toContain(r.label);
    }
  });

  it("includes evaluation criteria", () => {
    const set = anonymizeResponses([{ role: "X", response: "y" }]);
    const prompt = buildAnonymizedReviewPrompt("Q", set);
    expect(prompt).toContain("EVIDENCE QUALITY");
    expect(prompt).toContain("LOGICAL COHERENCE");
    expect(prompt).toContain("NOVELTY");
    expect(prompt).toContain("BIAS INDICATORS");
  });
});
