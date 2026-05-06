# CouncilVerse Architecture

## Package Structure

```
councilverse/
├── packages/
│   ├── formations/          # @relaylaunch/councilverse-formations
│   │   └── src/index.ts     # 17 formation definitions + prompt builders
│   ├── voting/              # @relaylaunch/councilverse-voting
│   │   └── src/index.ts     # Three-valued voting + quality scoring
│   └── create-councilverse/ # create-councilverse CLI
│       └── src/index.ts     # Project scaffolding
├── examples/
│   └── basic-debate.ts
└── docs/
```

Each package publishes CJS + ESM via tsup. Zero runtime dependencies in `formations` and `voting`.

## How Formations Work

A **formation** defines a structured debate topology:

| Field | Purpose |
|-------|---------|
| `id` | Unique identifier (e.g. `"strategy-room"`) |
| `methodology` | Framework the debate follows (e.g. OODA Loop, Game Theory) |
| `roles[]` | Array of `{ title, perspective }` — each role is one agent |
| `defaultRounds` | How many debate rounds before synthesis |

**Debate flow:**
1. `getFormation(id)` — retrieve the formation definition.
2. `buildSystemPrompt(formation, roleIndex)` — generate a system prompt for one agent. Includes anti-sycophancy rules that penalize hollow agreement.
3. Send each agent's prompt to your LLM provider (any provider — the package is LLM-agnostic).
4. Optionally run multiple rounds. Use `detectFlips()` to track agents who change positions between rounds, and `calculateFlipRate()` to flag unjustified position changes.
5. `buildSynthesisPrompt(formation, question, responses)` — generate the final synthesis prompt that produces THE CALL, consensus, disagreements, minority report, and actions.

## How Voting Works

Voting uses three values instead of binary:

| Vote | Meaning |
|------|---------|
| `keep` | Agent supports the proposal |
| `refuse` | Agent opposes |
| `abstain` | Outside the agent's expertise — prevents noise |

**Pipeline:**
1. `buildAgentVote(agentId, name, councilId, responseText)` — auto-detects vote, confidence, and argument quality from the agent's raw text output using keyword signal matching.
2. `tallyVotes(votes)` — produces a `VotingResult` with weighted scoring.

**Verdict methods (in priority order):**
1. **Strong consensus** — all active voters agree (unanimous KEEP or REFUSE).
2. **Quality weighted** — `argument_quality × confidence` per vote; requires ≥15% margin.
3. **Lead fallback** — deadlock triggers formation lead arbitration.

**Anonymized review:** `anonymizeResponses()` shuffles and relabels responses so a separate reviewer LLM evaluates argument quality without knowing which role produced it.

## How create-councilverse Works

`npx create-councilverse my-project` scaffolds:
- `package.json` with `formations` dependency and `debate` script
- `tsconfig.json` (ES2022, strict, bundler resolution)
- `src/council.ts` — runnable council that accepts a formation ID and question as CLI args
- `.env.example` and `README.md`

The CLI is zero-dependency at runtime. It writes files directly using `node:fs`.

## Extension Points

**Custom formations:** Add a new entry to `FORMATIONS` in `formations/src/index.ts`. Your formation must define `id`, `name`, `methodology`, `description`, `agents`, `defaultRounds`, and at least 3 `roles`.

**Custom vote signals:** Extend `KEEP_SIGNALS`, `REFUSE_SIGNALS`, or `ABSTAIN_SIGNALS` arrays in `voting/src/index.ts`. Keep phrases mutually exclusive across categories.

**Custom scoring:** Override `scoreArgumentQuality()` by wrapping it — the function accepts raw text and returns 0–1. You can replace the heuristic with an LLM-based evaluator.

**Protocol adapters:** Formations expose pure data — map `Formation` objects to A2A Agent Cards, MCP tool definitions, or webhook payloads in your own integration layer.
