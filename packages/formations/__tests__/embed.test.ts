import { describe, expect, it } from "vitest";
import { buildCouncilEmbedPayload } from "../src";

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
});
