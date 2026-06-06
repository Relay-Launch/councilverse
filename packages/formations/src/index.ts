export interface AgentRole {
  title: string;
  perspective: string;
}

export interface Formation {
  id: FormationId;
  name: string;
  methodology: string;
  description: string;
  agents: number;
  defaultRounds: number;
  roles: AgentRole[];
}

export const FORMATION_IDS = [
  "strategy-room",
  "tribunal",
  "innovation-lab",
  "risk-council",
  "due-diligence",
  "ethics-board",
  "growth-council",
  "technical-review",
  "market-intelligence",
  "crisis-response",
  "investment-committee",
  "quality-assurance",
  "research-council",
  "competitive-analysis",
  "policy-council",
] as const;

export type FormationId = (typeof FORMATION_IDS)[number];

export const FORMATIONS: Record<FormationId, Formation> = {
  "strategy-room": {
    id: "strategy-room",
    name: "Strategy Room",
    methodology: "OODA Loop",
    description:
      "Observe-Orient-Decide-Act cycle for strategic decisions. Agents run parallel OODA loops, surface conflicting orientations, and converge on actionable strategy.",
    agents: 5,
    defaultRounds: 2,
    roles: [
      { title: "Observer", perspective: "Raw situation assessment — what is actually happening, stripped of narrative" },
      { title: "Orienter", perspective: "Pattern matching against historical precedents and mental models" },
      { title: "Strategist", perspective: "Decision architecture — which moves create optionality" },
      { title: "Executor", perspective: "Implementation feasibility — resources, timeline, dependencies" },
      { title: "Red Cell", perspective: "Adversarial challenge — what breaks this plan, what are we not seeing" },
    ],
  },

  tribunal: {
    id: "tribunal",
    name: "The Tribunal",
    methodology: "Legal Framework",
    description:
      "Adversarial prosecution and defense of a proposition. Structured like a trial with prosecution, defense, expert witness, judge, and jury.",
    agents: 5,
    defaultRounds: 2,
    roles: [
      { title: "Prosecutor", perspective: "Build the strongest case against — every weakness, risk, and failure mode" },
      { title: "Defense Counsel", perspective: "Defend the proposition — rebut attacks, present mitigating evidence" },
      { title: "Expert Witness", perspective: "Domain expertise — technical and market reality checks" },
      { title: "Judge", perspective: "Weigh evidence impartially — apply precedent and legal reasoning" },
      { title: "Jury Foreman", perspective: "Synthesize arguments into a clear verdict with confidence level" },
    ],
  },

  "innovation-lab": {
    id: "innovation-lab",
    name: "Innovation Lab",
    methodology: "Design Thinking",
    description:
      "Empathize-Define-Ideate-Prototype-Test cycle for creative problem-solving. Agents explore the problem space before converging on solutions.",
    agents: 5,
    defaultRounds: 2,
    roles: [
      { title: "Empathist", perspective: "User pain points — what does the human experience feel like" },
      { title: "Problem Framer", perspective: "Reframe the challenge — are we solving the right problem" },
      { title: "Ideator", perspective: "Divergent solutions — quantity over quality, wild ideas welcome" },
      { title: "Prototyper", perspective: "Minimum viable test — what is the fastest way to learn" },
      { title: "Critic", perspective: "Reality check — does this solve the actual problem we defined" },
    ],
  },

  "risk-council": {
    id: "risk-council",
    name: "Risk Council",
    methodology: "Monte Carlo",
    description:
      "Probabilistic risk assessment using scenario modeling. Agents assign probability distributions to outcomes and identify tail risks.",
    agents: 5,
    defaultRounds: 1,
    roles: [
      { title: "Scenario Modeler", perspective: "Define outcome distributions — best case, base case, worst case with probabilities" },
      { title: "Tail Risk Hunter", perspective: "Black swan identification — low-probability, high-impact events" },
      { title: "Correlation Analyst", perspective: "Hidden dependencies — what risks are secretly linked" },
      { title: "Mitigation Architect", perspective: "Risk reduction strategies — hedges, insurance, circuit breakers" },
      { title: "Expected Value Calculator", perspective: "Probability-weighted outcome across all scenarios" },
    ],
  },

  "due-diligence": {
    id: "due-diligence",
    name: "Due Diligence Council",
    methodology: "M&A Framework",
    description:
      "Structured due diligence across financial, operational, legal, market, and technology dimensions. Built for M&A, investment, and audit workflows.",
    agents: 5,
    defaultRounds: 2,
    roles: [
      { title: "Financial Analyst", perspective: "Revenue quality, margins, cash flow, debt structure, working capital" },
      { title: "Operations Auditor", perspective: "Operational efficiency, scalability, key person risk, supply chain" },
      { title: "Legal Reviewer", perspective: "Regulatory compliance, IP ownership, litigation risk, contract obligations" },
      { title: "Market Analyst", perspective: "Market size, competitive position, customer concentration, growth vectors" },
      { title: "Technology Assessor", perspective: "Tech stack quality, technical debt, security posture, scalability architecture" },
    ],
  },

  "ethics-board": {
    id: "ethics-board",
    name: "Ethics Board",
    methodology: "Multi-Framework Ethics",
    description:
      "Evaluate decisions through Kantian, Utilitarian, Virtue Ethics, Care Ethics, and Rights-based frameworks simultaneously.",
    agents: 5,
    defaultRounds: 2,
    roles: [
      { title: "Kantian Analyst", perspective: "Universal law test — could this be a rule everyone follows?" },
      { title: "Utilitarian Calculator", perspective: "Greatest good for greatest number — aggregate welfare analysis" },
      { title: "Virtue Ethicist", perspective: "Character and excellence — what would a virtuous organization do?" },
      { title: "Care Ethicist", perspective: "Relationships and responsibilities — who is vulnerable, who bears the burden?" },
      { title: "Rights Advocate", perspective: "Fundamental rights — whose rights are at stake, are any being violated?" },
    ],
  },

  "growth-council": {
    id: "growth-council",
    name: "Growth Council",
    methodology: "AARRR Pirate Metrics",
    description:
      "Analyze growth through Acquisition, Activation, Retention, Referral, and Revenue lenses. Built for product-led and sales-led growth strategy.",
    agents: 5,
    defaultRounds: 2,
    roles: [
      { title: "Acquisition Strategist", perspective: "Channel efficiency, CAC optimization, top-of-funnel volume" },
      { title: "Activation Designer", perspective: "Time-to-value, onboarding friction, aha moment engineering" },
      { title: "Retention Analyst", perspective: "Churn drivers, engagement loops, habit formation, cohort analysis" },
      { title: "Referral Architect", perspective: "Viral mechanics, NPS drivers, word-of-mouth catalysts" },
      { title: "Revenue Optimizer", perspective: "Monetization, pricing elasticity, LTV/CAC ratio, expansion revenue" },
    ],
  },

  "technical-review": {
    id: "technical-review",
    name: "Technical Review Board",
    methodology: "Architecture Decision Records",
    description:
      "Evaluate technical proposals through structured ADR methodology. Agents assess trade-offs, alternatives, and long-term consequences.",
    agents: 5,
    defaultRounds: 2,
    roles: [
      { title: "System Architect", perspective: "Overall system design, scalability, maintainability, evolution" },
      { title: "Security Engineer", perspective: "Threat modeling, attack surface, data protection, compliance" },
      { title: "Performance Engineer", perspective: "Latency, throughput, resource efficiency, capacity planning" },
      { title: "Developer Experience Lead", perspective: "API ergonomics, documentation, migration path, learning curve" },
      { title: "Operations Lead", perspective: "Deployability, observability, incident response, operational burden" },
    ],
  },

  "market-intelligence": {
    id: "market-intelligence",
    name: "Market Intelligence Council",
    methodology: "Porter's Five Forces",
    description:
      "Analyze competitive dynamics across all five forces: rivalry, new entrants, substitutes, buyer power, and supplier power.",
    agents: 5,
    defaultRounds: 1,
    roles: [
      { title: "Rivalry Analyst", perspective: "Competitive intensity, differentiation, price competition, market share dynamics" },
      { title: "Entry Barrier Assessor", perspective: "New entrant threats, capital requirements, regulatory moats, network effects" },
      { title: "Substitute Scanner", perspective: "Alternative solutions, technology disruption, adjacent market threats" },
      { title: "Buyer Power Analyst", perspective: "Customer concentration, switching costs, price sensitivity, information asymmetry" },
      { title: "Supplier Power Analyst", perspective: "Supply chain dependencies, input scarcity, integration threats" },
    ],
  },

  "crisis-response": {
    id: "crisis-response",
    name: "Crisis Response Team",
    methodology: "Incident Command System",
    description:
      "Rapid assessment, triage, and recovery coordination. Built for incident response, PR crises, and operational emergencies.",
    agents: 5,
    defaultRounds: 1,
    roles: [
      { title: "Incident Commander", perspective: "Situation assessment, priority triage, resource allocation" },
      { title: "Communications Lead", perspective: "Stakeholder messaging, media response, internal communications" },
      { title: "Technical Lead", perspective: "Root cause analysis, containment, remediation plan" },
      { title: "Impact Assessor", perspective: "Blast radius, affected parties, financial and reputational damage" },
      { title: "Recovery Planner", perspective: "Restoration timeline, lessons learned, prevention measures" },
    ],
  },

  "investment-committee": {
    id: "investment-committee",
    name: "Investment Committee",
    methodology: "DCF + Comparables",
    description:
      "Evaluate investments through multiple valuation methodologies. Combines quantitative analysis with qualitative judgment.",
    agents: 5,
    defaultRounds: 2,
    roles: [
      { title: "DCF Analyst", perspective: "Discounted cash flow modeling, growth assumptions, terminal value, WACC" },
      { title: "Comparables Analyst", perspective: "Public and private comps, multiple analysis, relative valuation" },
      { title: "Qualitative Assessor", perspective: "Management quality, competitive moat, market timing, strategic fit" },
      { title: "Risk Manager", perspective: "Downside scenarios, portfolio correlation, concentration risk, liquidity" },
      { title: "Portfolio Strategist", perspective: "Portfolio construction, position sizing, entry/exit timing, thesis integrity" },
    ],
  },

  "quality-assurance": {
    id: "quality-assurance",
    name: "Quality Assurance Council",
    methodology: "Six Sigma DMAIC",
    description:
      "Apply Define-Measure-Analyze-Improve-Control methodology to quality issues. Data-driven process improvement.",
    agents: 5,
    defaultRounds: 2,
    roles: [
      { title: "Problem Definer", perspective: "Scope the issue — what is the defect, who is affected, what is the impact" },
      { title: "Measurement Lead", perspective: "Current state metrics — baseline data, measurement system validity" },
      { title: "Root Cause Analyst", perspective: "Statistical analysis — what variables drive the defect, correlation vs causation" },
      { title: "Improvement Designer", perspective: "Solution design — what changes eliminate root causes with minimal side effects" },
      { title: "Control Planner", perspective: "Sustain improvements — monitoring, standard work, escalation triggers" },
    ],
  },

  "research-council": {
    id: "research-council",
    name: "Research Council",
    methodology: "Scientific Method",
    description:
      "Follow hypothesis-experiment-analysis-conclusion cycles. Evidence-based reasoning with explicit uncertainty quantification.",
    agents: 5,
    defaultRounds: 2,
    roles: [
      { title: "Hypothesis Generator", perspective: "Formulate testable hypotheses — what do we believe and why" },
      { title: "Experimental Designer", perspective: "Design experiments to test hypotheses — controls, variables, sample size" },
      { title: "Data Analyst", perspective: "Analyze results — statistical significance, effect size, confounding variables" },
      { title: "Literature Reviewer", perspective: "Prior art — what does existing research say, where are the gaps" },
      { title: "Peer Reviewer", perspective: "Methodological critique — what could invalidate these conclusions" },
    ],
  },

  "competitive-analysis": {
    id: "competitive-analysis",
    name: "Competitive Analysis Council",
    methodology: "Game Theory",
    description:
      "Model competitive dynamics through Nash equilibria and payoff matrices. Predict competitor responses and identify dominant strategies.",
    agents: 5,
    defaultRounds: 2,
    roles: [
      { title: "Game Theorist", perspective: "Payoff matrices, Nash equilibria, dominant and dominated strategies" },
      { title: "Competitor Modeler", perspective: "Competitor capabilities, incentives, constraints, likely moves" },
      { title: "Signaling Analyst", perspective: "Market signals, commitment devices, reputation effects, bluffing detection" },
      { title: "Coalition Builder", perspective: "Alliance opportunities, partner incentives, collective action problems" },
      { title: "Asymmetry Exploiter", perspective: "Information advantages, timing advantages, resource asymmetries to exploit" },
    ],
  },

  "policy-council": {
    id: "policy-council",
    name: "Policy Council",
    methodology: "Regulatory Impact Assessment",
    description:
      "Evaluate policy through regulatory burden, stakeholder impact, and feasibility lenses. Built for governance and compliance decisions.",
    agents: 5,
    defaultRounds: 2,
    roles: [
      { title: "Regulatory Analyst", perspective: "Compliance requirements, regulatory burden, enforcement mechanisms" },
      { title: "Stakeholder Advocate", perspective: "Who benefits, who bears costs, distributional equity, political feasibility" },
      { title: "Implementation Assessor", perspective: "Practical feasibility, resource requirements, transition costs, timeline" },
      { title: "Precedent Researcher", perspective: "Historical parallels, what worked elsewhere, unintended consequences" },
      { title: "Sunset Reviewer", perspective: "Exit criteria, review triggers, adaptation mechanisms, obsolescence risk" },
    ],
  },
};

export function getFormation(id: FormationId): Formation {
  return FORMATIONS[id];
}

export function listFormations(): Formation[] {
  return Object.values(FORMATIONS);
}

export function isValidFormation(id: string): id is FormationId {
  return id in FORMATIONS;
}

export function getFormationsByMethodology(methodology: string): Formation[] {
  return Object.values(FORMATIONS).filter(
    (f) => f.methodology.toLowerCase().includes(methodology.toLowerCase())
  );
}

export interface CouncilEmbedAgent {
  id: string;
  title: string;
  perspective: string;
  systemPrompt: string;
}

export interface CouncilEmbedPayload {
  schemaVersion: "councilverse.embed.v1";
  formationId: FormationId;
  formationName: string;
  methodology: string;
  question: string;
  defaultRounds: number;
  summary: CouncilEmbedSummary;
  agents: CouncilEmbedAgent[];
  synthesisPrompt: string;
}

export interface CouncilEmbedSummary {
  schemaVersion: "councilverse.embed-summary.v1";
  formationId: FormationId;
  formationName: string;
  methodology: string;
  question: string;
  defaultRounds: number;
  agentTitles: string[];
  summaryHint: string;
}

const ANTI_SYCOPHANCY_RULES = [
  "6. NEVER use hollow agreement phrases: 'I agree', 'exactly right', 'great point', 'well said', 'as you mentioned'",
  "7. If you change your position between rounds, you MUST state what new evidence caused the change",
  "8. Agreeing with the majority without adding new evidence is a failure — find what they missed",
];

export function buildSystemPrompt(formation: Formation, roleIndex: number): string {
  const role = formation.roles[roleIndex];
  if (!role) throw new Error(`Role index ${roleIndex} out of range for ${formation.id}`);

  return [
    `You are the ${role.title} in a ${formation.name} council debate.`,
    `Methodology: ${formation.methodology}.`,
    `Your perspective: ${role.perspective}`,
    "",
    "Rules:",
    "1. Stay in character — argue from your assigned perspective",
    "2. Cite specific evidence and reasoning, not vague assertions",
    "3. Acknowledge strong counterarguments from other roles",
    "4. If you disagree with the emerging consensus, say so explicitly",
    "5. End with a clear position statement and confidence level (0.0-1.0)",
    ...ANTI_SYCOPHANCY_RULES,
  ].join("\n");
}

function normalizeEmbedQuestion(question: string): string {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    throw new Error("Embed question is required.");
  }
  return trimmedQuestion;
}

export function buildCouncilEmbedSummary(
  formationId: FormationId,
  question: string,
): CouncilEmbedSummary {
  const trimmedQuestion = normalizeEmbedQuestion(question);
  const formation = getFormation(formationId);
  const agentTitles = formation.roles.map((role) => role.title);

  return {
    schemaVersion: "councilverse.embed-summary.v1",
    formationId: formation.id,
    formationName: formation.name,
    methodology: formation.methodology,
    question: trimmedQuestion,
    defaultRounds: formation.defaultRounds,
    agentTitles,
    summaryHint: `${formation.name} uses ${formation.methodology} with ${agentTitles.length} roles: ${agentTitles.join(", ")}.`,
  };
}

export function buildCouncilEmbedPayload(
  formationId: FormationId,
  question: string,
): CouncilEmbedPayload {
  const summary = buildCouncilEmbedSummary(formationId, question);
  const trimmedQuestion = summary.question;
  const formation = getFormation(formationId);
  return {
    schemaVersion: "councilverse.embed.v1",
    formationId: formation.id,
    formationName: formation.name,
    methodology: formation.methodology,
    question: trimmedQuestion,
    defaultRounds: formation.defaultRounds,
    summary,
    agents: formation.roles.map((role, index) => ({
      id: `${formation.id}-agent-${index + 1}`,
      title: role.title,
      perspective: role.perspective,
      systemPrompt: buildSystemPrompt(formation, index),
    })),
    synthesisPrompt: buildSynthesisPrompt(formation, trimmedQuestion, []),
  };
}

export interface FlipRateEntry {
  agentId: string;
  round: number;
  previousPosition: string;
  newPosition: string;
  evidenceCited: boolean;
}

export function detectFlips(
  rounds: { agentId: string; round: number; position: string; reasoning: string }[],
): FlipRateEntry[] {
  const flips: FlipRateEntry[] = [];
  const byAgent = new Map<string, typeof rounds>();

  for (const entry of rounds) {
    const existing = byAgent.get(entry.agentId) || [];
    existing.push(entry);
    byAgent.set(entry.agentId, existing);
  }

  for (const [agentId, entries] of byAgent) {
    const sorted = entries.sort((a, b) => a.round - b.round);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (prev.position !== curr.position) {
        const lower = curr.reasoning.toLowerCase();
        const evidenceCited =
          lower.includes("because") ||
          lower.includes("evidence") ||
          lower.includes("data shows") ||
          lower.includes("however") ||
          /\d+%/.test(curr.reasoning);

        flips.push({
          agentId,
          round: curr.round,
          previousPosition: prev.position,
          newPosition: curr.position,
          evidenceCited,
        });
      }
    }
  }

  return flips;
}

export function calculateFlipRate(
  flips: FlipRateEntry[],
): { totalFlips: number; unjustifiedFlips: number; flipRate: number } {
  const unjustified = flips.filter((f) => !f.evidenceCited);
  return {
    totalFlips: flips.length,
    unjustifiedFlips: unjustified.length,
    flipRate: flips.length > 0 ? unjustified.length / flips.length : 0,
  };
}

export function buildSynthesisPrompt(
  formation: Formation,
  question: string,
  responses: { role: string; response: string }[]
): string {
  const header = `You are the synthesis engine for a ${formation.name} council debate using ${formation.methodology} methodology.`;
  const responseBlock = responses
    .map((r) => `--- ${r.role} ---\n${r.response}`)
    .join("\n\n");

  return [
    header,
    "",
    `Question: "${question}"`,
    "",
    responseBlock,
    "",
    "Synthesize into:",
    "1. THE CALL — decisive verdict in 2-3 sentences",
    "2. KEY CONSENSUS — where agents agree",
    "3. KEY DISAGREEMENTS — where they diverge",
    "4. MINORITY REPORT — strongest dissenting view that the majority should not ignore",
    "5. RECOMMENDED ACTIONS — 3-5 concrete next steps",
    "6. CONFIDENCE — 0.0 to 1.0",
  ].join("\n");
}
