import { describe, it, expect } from "vitest";
import {
  FORMATION_IDS,
  FORMATIONS,
  getFormation,
  listFormations,
  isValidFormation,
  getFormationsByMethodology,
  buildSystemPrompt,
  detectFlips,
  calculateFlipRate,
  buildSynthesisPrompt,
  type Formation,
  type FormationId,
} from "../src/index";

describe("FORMATIONS data integrity", () => {
  it("has exactly 15 formations", () => {
    expect(FORMATION_IDS.length).toBe(15);
    expect(Object.keys(FORMATIONS).length).toBe(15);
  });

  it("every FORMATION_IDS entry has a corresponding record", () => {
    for (const id of FORMATION_IDS) {
      expect(FORMATIONS[id]).toBeDefined();
      expect(FORMATIONS[id].id).toBe(id);
    }
  });

  it("every formation has exactly 5 roles", () => {
    for (const formation of Object.values(FORMATIONS)) {
      expect(formation.roles).toHaveLength(5);
    }
  });

  it("every formation has required fields", () => {
    for (const f of Object.values(FORMATIONS)) {
      expect(f.id).toBeTruthy();
      expect(f.name).toBeTruthy();
      expect(f.methodology).toBeTruthy();
      expect(f.description).toBeTruthy();
      expect(f.agents).toBe(5);
      expect(f.defaultRounds).toBeGreaterThanOrEqual(1);
    }
  });

  it("every role has title and perspective", () => {
    for (const f of Object.values(FORMATIONS)) {
      for (const role of f.roles) {
        expect(role.title).toBeTruthy();
        expect(role.perspective).toBeTruthy();
        expect(role.perspective.length).toBeGreaterThan(10);
      }
    }
  });

  it("formation IDs use kebab-case", () => {
    for (const id of FORMATION_IDS) {
      expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it("no duplicate role titles within a formation", () => {
    for (const f of Object.values(FORMATIONS)) {
      const titles = f.roles.map(r => r.title);
      expect(new Set(titles).size).toBe(titles.length);
    }
  });
});

describe("getFormation", () => {
  it("returns correct formation by id", () => {
    const f = getFormation("strategy-room");
    expect(f.name).toBe("Strategy Room");
    expect(f.methodology).toBe("OODA Loop");
  });

  it("returns correct formation for all IDs", () => {
    for (const id of FORMATION_IDS) {
      const f = getFormation(id);
      expect(f.id).toBe(id);
    }
  });
});

describe("listFormations", () => {
  it("returns all 15 formations as array", () => {
    const list = listFormations();
    expect(list).toHaveLength(15);
  });

  it("each item has required properties", () => {
    for (const f of listFormations()) {
      expect(f).toHaveProperty("id");
      expect(f).toHaveProperty("name");
      expect(f).toHaveProperty("methodology");
    }
  });
});

describe("isValidFormation", () => {
  it("returns true for valid formation IDs", () => {
    expect(isValidFormation("strategy-room")).toBe(true);
    expect(isValidFormation("tribunal")).toBe(true);
    expect(isValidFormation("policy-council")).toBe(true);
  });

  it("returns false for invalid formation IDs", () => {
    expect(isValidFormation("nonexistent")).toBe(false);
    expect(isValidFormation("")).toBe(false);
    expect(isValidFormation("Strategy-Room")).toBe(false); // case-sensitive
  });
});

describe("getFormationsByMethodology", () => {
  it("finds OODA Loop formation", () => {
    const results = getFormationsByMethodology("OODA");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].id).toBe("strategy-room");
  });

  it("is case-insensitive", () => {
    const results = getFormationsByMethodology("ooda loop");
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty for nonexistent methodology", () => {
    expect(getFormationsByMethodology("Quantum Computing")).toHaveLength(0);
  });

  it("finds multiple if methodology word is shared", () => {
    // All methodologies are unique, so specific queries should return 1
    const results = getFormationsByMethodology("Legal");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some(r => r.id === "tribunal")).toBe(true);
  });
});

describe("buildSystemPrompt", () => {
  it("includes role title and perspective", () => {
    const prompt = buildSystemPrompt(FORMATIONS["strategy-room"], 0);
    expect(prompt).toContain("Observer");
    expect(prompt).toContain("Raw situation assessment");
  });

  it("includes formation name and methodology", () => {
    const prompt = buildSystemPrompt(FORMATIONS["tribunal"], 1);
    expect(prompt).toContain("The Tribunal");
    expect(prompt).toContain("Legal Framework");
  });

  it("includes anti-sycophancy rules", () => {
    const prompt = buildSystemPrompt(FORMATIONS["innovation-lab"], 2);
    expect(prompt).toContain("NEVER use hollow agreement phrases");
    expect(prompt).toContain("new evidence caused the change");
    expect(prompt).toContain("find what they missed");
  });

  it("throws for out-of-range role index", () => {
    expect(() => buildSystemPrompt(FORMATIONS["strategy-room"], 10)).toThrow();
    expect(() => buildSystemPrompt(FORMATIONS["strategy-room"], -1)).toThrow();
  });

  it("works for all roles in all formations", () => {
    for (const f of Object.values(FORMATIONS)) {
      for (let i = 0; i < f.roles.length; i++) {
        const prompt = buildSystemPrompt(f, i);
        expect(prompt).toContain(f.roles[i].title);
      }
    }
  });
});

describe("detectFlips", () => {
  it("detects position change between rounds", () => {
    const flips = detectFlips([
      { agentId: "a1", round: 1, position: "keep", reasoning: "Good idea" },
      { agentId: "a1", round: 2, position: "refuse", reasoning: "However, new evidence shows 30% failure rate" },
    ]);
    expect(flips).toHaveLength(1);
    expect(flips[0].previousPosition).toBe("keep");
    expect(flips[0].newPosition).toBe("refuse");
    expect(flips[0].evidenceCited).toBe(true);
  });

  it("marks flip as unjustified if no evidence", () => {
    const flips = detectFlips([
      { agentId: "a1", round: 1, position: "keep", reasoning: "Looks good" },
      { agentId: "a1", round: 2, position: "refuse", reasoning: "Actually I changed my mind" },
    ]);
    expect(flips[0].evidenceCited).toBe(false);
  });

  it("handles multiple agents independently", () => {
    const flips = detectFlips([
      { agentId: "a1", round: 1, position: "keep", reasoning: "yes" },
      { agentId: "a2", round: 1, position: "refuse", reasoning: "no" },
      { agentId: "a1", round: 2, position: "refuse", reasoning: "however this changed" },
      { agentId: "a2", round: 2, position: "keep", reasoning: "because data shows improvement" },
    ]);
    expect(flips).toHaveLength(2);
  });

  it("no flips when positions stay same", () => {
    const flips = detectFlips([
      { agentId: "a1", round: 1, position: "keep", reasoning: "yes" },
      { agentId: "a1", round: 2, position: "keep", reasoning: "still yes" },
    ]);
    expect(flips).toHaveLength(0);
  });

  it("detects evidence via percentage pattern", () => {
    const flips = detectFlips([
      { agentId: "a1", round: 1, position: "keep", reasoning: "sure" },
      { agentId: "a1", round: 2, position: "refuse", reasoning: "Only 12% success rate" },
    ]);
    expect(flips[0].evidenceCited).toBe(true);
  });
});

describe("calculateFlipRate", () => {
  it("returns 0 flip rate with no flips", () => {
    const result = calculateFlipRate([]);
    expect(result.totalFlips).toBe(0);
    expect(result.unjustifiedFlips).toBe(0);
    expect(result.flipRate).toBe(0);
  });

  it("calculates rate correctly", () => {
    const result = calculateFlipRate([
      { agentId: "a1", round: 2, previousPosition: "keep", newPosition: "refuse", evidenceCited: true },
      { agentId: "a2", round: 2, previousPosition: "keep", newPosition: "refuse", evidenceCited: false },
    ]);
    expect(result.totalFlips).toBe(2);
    expect(result.unjustifiedFlips).toBe(1);
    expect(result.flipRate).toBe(0.5);
  });

  it("100% unjustified when no evidence cited", () => {
    const result = calculateFlipRate([
      { agentId: "a1", round: 2, previousPosition: "keep", newPosition: "refuse", evidenceCited: false },
    ]);
    expect(result.flipRate).toBe(1);
  });
});

describe("buildSynthesisPrompt", () => {
  it("includes formation name and methodology", () => {
    const prompt = buildSynthesisPrompt(
      FORMATIONS["strategy-room"],
      "What next?",
      [{ role: "Observer", response: "We see opportunity" }],
    );
    expect(prompt).toContain("Strategy Room");
    expect(prompt).toContain("OODA Loop");
  });

  it("includes the question", () => {
    const prompt = buildSynthesisPrompt(
      FORMATIONS["tribunal"],
      "Should we acquire them?",
      [{ role: "Judge", response: "Yes" }],
    );
    expect(prompt).toContain("Should we acquire them?");
  });

  it("includes all response blocks", () => {
    const prompt = buildSynthesisPrompt(
      FORMATIONS["growth-council"],
      "How to grow?",
      [
        { role: "Acquisition Strategist", response: "Channel optimization" },
        { role: "Retention Analyst", response: "Reduce churn first" },
      ],
    );
    expect(prompt).toContain("Acquisition Strategist");
    expect(prompt).toContain("Retention Analyst");
    expect(prompt).toContain("Channel optimization");
    expect(prompt).toContain("Reduce churn first");
  });

  it("includes synthesis instructions", () => {
    const prompt = buildSynthesisPrompt(
      FORMATIONS["risk-council"],
      "Risk?",
      [{ role: "Tail Risk Hunter", response: "Black swan detected" }],
    );
    expect(prompt).toContain("THE CALL");
    expect(prompt).toContain("KEY CONSENSUS");
    expect(prompt).toContain("KEY DISAGREEMENTS");
    expect(prompt).toContain("MINORITY REPORT");
    expect(prompt).toContain("RECOMMENDED ACTIONS");
    expect(prompt).toContain("CONFIDENCE");
  });
});
