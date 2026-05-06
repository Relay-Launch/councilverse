# CouncilVerse API Reference

## @relaylaunch/councilverse-formations

### Types

```typescript
interface AgentRole {
  title: string;        // e.g. "Observer", "Prosecutor"
  perspective: string;  // What this agent argues from
}

interface Formation {
  id: FormationId;
  name: string;         // e.g. "Strategy Room"
  methodology: string;  // e.g. "OODA Loop"
  description: string;
  agents: number;       // Number of agents (always matches roles.length)
  defaultRounds: number;
  roles: AgentRole[];
}

type FormationId =
  | "strategy-room" | "tribunal" | "innovation-lab" | "risk-council"
  | "due-diligence" | "ethics-board" | "growth-council" | "technical-review"
  | "market-intelligence" | "crisis-response" | "investment-committee"
  | "quality-assurance" | "research-council" | "competitive-analysis"
  | "policy-council";

interface FlipRateEntry {
  agentId: string;
  round: number;
  previousPosition: string;
  newPosition: string;
  evidenceCited: boolean;
}
```

### Functions

#### `getFormation(id: FormationId): Formation`

Returns a single formation by ID.

```typescript
const f = getFormation("tribunal");
console.log(f.name);        // "The Tribunal"
console.log(f.roles.length); // 5
```

#### `listFormations(): Formation[]`

Returns all 17 formations.

#### `isValidFormation(id: string): id is FormationId`

Type guard — returns `true` if the string is a valid formation ID.

```typescript
const userInput = "strategy-room";
if (isValidFormation(userInput)) {
  const f = getFormation(userInput); // type-safe
}
```

#### `getFormationsByMethodology(methodology: string): Formation[]`

Case-insensitive substring search across formation methodologies.

```typescript
getFormationsByMethodology("game theory");
// → [{ id: "competitive-analysis", ... }]
```

#### `buildSystemPrompt(formation: Formation, roleIndex: number): string`

Generates a system prompt for one agent role. Includes anti-sycophancy rules. Throws if `roleIndex` is out of range.

```typescript
const formation = getFormation("strategy-room");
const prompt = buildSystemPrompt(formation, 0); // Observer prompt
```

#### `buildSynthesisPrompt(formation: Formation, question: string, responses: { role: string; response: string }[]): string`

Generates the final synthesis prompt that asks the LLM to produce THE CALL, consensus, disagreements, minority report, and actions.

```typescript
const prompt = buildSynthesisPrompt(formation, "Expand to EU?", [
  { role: "Observer", response: "..." },
  { role: "Strategist", response: "..." },
]);
```

#### `detectFlips(rounds): FlipRateEntry[]`

Tracks agents who changed positions between debate rounds. Input: array of `{ agentId, round, position, reasoning }`.

#### `calculateFlipRate(flips: FlipRateEntry[]): { totalFlips, unjustifiedFlips, flipRate }`

Returns the ratio of unjustified position changes (no evidence cited).

---

## @relaylaunch/councilverse-voting

### Types

```typescript
type Vote = "keep" | "refuse" | "abstain";

interface AgentVote {
  agent_id: string;
  agent_name: string;
  council_id: string;
  vote: Vote;
  confidence: number;        // 0.0–1.0
  reasoning: string;
  argument_quality: number;  // 0.0–1.0
}

interface VotingResult {
  outcome: "keep" | "refuse" | "deadlock";
  method: "strong_consensus" | "quality_weighted" | "lead_fallback";
  keep_weight: number;
  refuse_weight: number;
  abstain_count: number;
  total_voters: number;
  margin: number;            // 0.0–1.0
  votes: AgentVote[];
}
```

### Functions

#### `buildAgentVote(agentId: string, agentName: string, councilId: string, text: string): AgentVote`

Parses raw LLM response text into a structured vote. Auto-detects vote direction, confidence, and argument quality via keyword signal matching.

```typescript
const vote = buildAgentVote("agent-0", "Observer", "council-1", responseText);
console.log(vote.vote);             // "keep" | "refuse" | "abstain"
console.log(vote.argument_quality); // 0.0–1.0
```

#### `tallyVotes(votes: AgentVote[]): VotingResult`

Produces a weighted verdict from an array of votes. Uses quality × confidence weighting. Returns outcome, method used, and margin.

```typescript
const result = tallyVotes(votes);
if (result.outcome === "deadlock") {
  // trigger lead fallback arbitration
}
```

#### `detectVote(text: string): Vote`

Detects vote direction from raw text using keyword signals. Used internally by `buildAgentVote`.

#### `detectConfidence(text: string): number`

Estimates confidence (0.1–1.0) from language signals like "strongly", "uncertain".

#### `scoreArgumentQuality(text: string): number`

Scores argument quality (0.05–1.0) based on evidence markers, logical structure, and data specificity.

#### `anonymizeResponses(responses: { role: string; response: string }[]): AnonymizedSet`

Shuffles and relabels responses as "Response A", "Response B", etc. Returns the anonymized set and a key map to de-anonymize later.

```typescript
const { responses, keyMap } = anonymizeResponses(agentResponses);
// responses[0].label === "Response B" (randomized)
```

#### `buildAnonymizedReviewPrompt(question: string, anonymizedSet: AnonymizedSet): string`

Generates a peer review prompt for an impartial LLM to evaluate anonymized responses on evidence quality, coherence, novelty, and bias.

---

## create-councilverse

CLI tool — no programmatic API. Run via npx:

```bash
npx create-councilverse <project-name>
```

Scaffolds a ready-to-run council project with `package.json`, `tsconfig.json`, `src/council.ts`, `.env.example`, and `README.md`. The generated `council.ts` accepts a formation ID and question as CLI arguments:

```bash
cd my-council && npm install
npm run debate -- strategy-room "Should we enter the EU market?"
```
