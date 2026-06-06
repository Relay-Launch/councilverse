import { describe, expect, it } from "vitest";
import { buildCouncilEmbedPayload, buildCouncilEmbedSummary } from "../src";

describe("CouncilVerse embeddable payload", () => {
  it("builds a provider-agnostic embed payload for a formation", () => {
    const payload = buildCouncilEmbedPayload(
      "technical-review",
      "Should we expose CouncilVerse as an embeddable verdict widget?",
    );

    expect(payload.schemaVersion).toBe("councilverse.embed.v1");
    expect(payload.formationId).toBe("technical-review");
    expect(payload.agents).toHaveLength(5);
    expect(payload.defaultRounds).toBe(2);
    expect(payload.summary.schemaVersion).toBe("councilverse.embed-summary.v1");
    expect(payload.summary.agentTitles).toEqual(payload.agents.map((agent) => agent.title));
    expect(payload.synthesisPrompt).toContain("Should we expose CouncilVerse");
  });

  it("includes one system prompt per role without requiring an LLM provider key", () => {
    const payload = buildCouncilEmbedPayload("strategy-room", "Pick the next release wedge.");

    expect(payload.agents.map((agent) => agent.title)).toEqual([
      "Observer",
      "Orienter",
      "Strategist",
      "Executor",
      "Red Cell",
    ]);
    expect(payload.agents[0].systemPrompt).toContain("You are the Observer");
    expect(JSON.stringify(payload)).not.toContain("API_KEY");
  });

  it("trims the public question and rejects empty embed requests", () => {
    expect(buildCouncilEmbedPayload("risk-council", "  What can break launch?  ").question)
      .toBe("What can break launch?");
    expect(() => buildCouncilEmbedPayload("risk-council", "   ")).toThrow("question is required");
  });

  it("builds a prompt-free summary for product previews", () => {
    const summary = buildCouncilEmbedSummary("innovation-lab", "Design a calmer team preview.");

    expect(summary).toEqual({
      schemaVersion: "councilverse.embed-summary.v1",
      formationId: "innovation-lab",
      formationName: "Innovation Lab",
      methodology: "Design Thinking",
      question: "Design a calmer team preview.",
      defaultRounds: 2,
      agentTitles: ["Empathist", "Problem Framer", "Ideator", "Prototyper", "Critic"],
      summaryHint:
        "Innovation Lab uses Design Thinking with 5 roles: Empathist, Problem Framer, Ideator, Prototyper, Critic.",
    });
    expect(JSON.stringify(summary)).not.toContain("systemPrompt");
    expect(JSON.stringify(summary)).not.toContain("API_KEY");
  });
});
