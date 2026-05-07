import { describe, it, expect } from "vitest";
import { FORMATIONS, FORMATION_IDS, type FormationId, type Formation } from "../src/index";

describe("FORMATION_IDS", () => {
  it("exports 15 formation IDs", () => {
    expect(FORMATION_IDS).toHaveLength(15);
  });

  it("all IDs are kebab-case strings", () => {
    for (const id of FORMATION_IDS) {
      expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it("has no duplicates", () => {
    const unique = new Set(FORMATION_IDS);
    expect(unique.size).toBe(FORMATION_IDS.length);
  });
});

describe("FORMATIONS", () => {
  it("has an entry for every FORMATION_ID", () => {
    for (const id of FORMATION_IDS) {
      expect(FORMATIONS[id]).toBeDefined();
      expect(FORMATIONS[id].id).toBe(id);
    }
  });

  it("every formation has required fields", () => {
    for (const id of FORMATION_IDS) {
      const f = FORMATIONS[id];
      expect(f.name).toBeTruthy();
      expect(f.methodology).toBeTruthy();
      expect(f.description).toBeTruthy();
      expect(f.agents).toBeGreaterThanOrEqual(3);
      expect(f.agents).toBeLessThanOrEqual(8);
      expect(f.defaultRounds).toBeGreaterThanOrEqual(1);
      expect(f.defaultRounds).toBeLessThanOrEqual(5);
    }
  });

  it("every formation has roles matching agent count", () => {
    for (const id of FORMATION_IDS) {
      const f = FORMATIONS[id];
      expect(f.roles).toHaveLength(f.agents);
    }
  });

  it("every role has title and perspective", () => {
    for (const id of FORMATION_IDS) {
      for (const role of FORMATIONS[id].roles) {
        expect(role.title).toBeTruthy();
        expect(role.perspective).toBeTruthy();
        expect(role.title.length).toBeGreaterThan(2);
        expect(role.perspective.length).toBeGreaterThan(10);
      }
    }
  });

  it("role titles are unique within each formation", () => {
    for (const id of FORMATION_IDS) {
      const titles = FORMATIONS[id].roles.map((r) => r.title);
      const unique = new Set(titles);
      expect(unique.size).toBe(titles.length);
    }
  });

  it("descriptions are informative (min 50 chars)", () => {
    for (const id of FORMATION_IDS) {
      expect(FORMATIONS[id].description.length).toBeGreaterThanOrEqual(50);
    }
  });
});

describe("specific formations", () => {
  it("strategy-room uses OODA Loop methodology", () => {
    expect(FORMATIONS["strategy-room"].methodology).toBe("OODA Loop");
  });

  it("tribunal uses Legal Framework methodology", () => {
    expect(FORMATIONS["tribunal"].methodology).toBe("Legal Framework");
  });

  it("risk-council uses Monte Carlo methodology", () => {
    expect(FORMATIONS["risk-council"].methodology).toBe("Monte Carlo");
  });

  it("due-diligence uses M&A Framework methodology", () => {
    expect(FORMATIONS["due-diligence"].methodology).toBe("M&A Framework");
  });

  it("ethics-board has 5 ethical frameworks", () => {
    const roles = FORMATIONS["ethics-board"].roles.map((r) => r.title);
    expect(roles).toContain("Kantian Analyst");
    expect(roles).toContain("Utilitarian Calculator");
    expect(roles).toContain("Virtue Ethicist");
  });

  it("growth-council uses AARRR Pirate Metrics", () => {
    expect(FORMATIONS["growth-council"].methodology).toBe("AARRR Pirate Metrics");
  });

  it("market-intelligence uses Porter's Five Forces", () => {
    expect(FORMATIONS["market-intelligence"].methodology).toBe("Porter's Five Forces");
  });

  it("crisis-response has only 1 default round (urgency)", () => {
    expect(FORMATIONS["crisis-response"].defaultRounds).toBe(1);
  });
});

describe("TypeScript types", () => {
  it("FormationId type restricts to valid IDs", () => {
    const validId: FormationId = "strategy-room";
    expect(FORMATIONS[validId]).toBeDefined();
  });

  it("Formation interface shape is correct", () => {
    const f: Formation = FORMATIONS["tribunal"];
    expect(typeof f.id).toBe("string");
    expect(typeof f.name).toBe("string");
    expect(typeof f.methodology).toBe("string");
    expect(typeof f.description).toBe("string");
    expect(typeof f.agents).toBe("number");
    expect(typeof f.defaultRounds).toBe("number");
    expect(Array.isArray(f.roles)).toBe(true);
  });
});
