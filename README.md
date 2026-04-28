<p align="center">
  <strong>CouncilVerse</strong><br>
  Open-source AI council formations for multi-agent debate
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@relaylaunch/councilverse-formations"><img src="https://img.shields.io/npm/v/@relaylaunch/councilverse-formations?label=formations&color=007AFF" alt="npm formations"></a>
  <a href="https://www.npmjs.com/package/@relaylaunch/councilverse-voting"><img src="https://img.shields.io/npm/v/@relaylaunch/councilverse-voting?label=voting&color=007AFF" alt="npm voting"></a>
  <a href="https://www.npmjs.com/package/create-councilverse"><img src="https://img.shields.io/npm/v/create-councilverse?label=create&color=007AFF" alt="npm create"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-0F172A" alt="MIT License"></a>
</p>

---

Most multi-agent systems treat AI like a panel of yes-men. CouncilVerse structures debates so agents argue from different methodologies, vote with three-valued positions (KEEP / REFUSE / ABSTAIN), and produce auditable verdicts scored by argument quality -- not headcount.

**15 formations. 3 npm packages. Works with any LLM provider.**

## Quick Start

```bash
npx create-councilverse my-council
cd my-council
npm install
```

Add your API key to `.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Run a debate:

```bash
npx tsx src/council.ts
```

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| [`@relaylaunch/councilverse-formations`](packages/formations) | 15 structured debate methodologies | `npm i @relaylaunch/councilverse-formations` |
| [`@relaylaunch/councilverse-voting`](packages/voting) | Three-valued voting with quality scoring | `npm i @relaylaunch/councilverse-voting` |
| [`create-councilverse`](packages/create-councilverse) | Project scaffolding CLI | `npx create-councilverse` |

## Formations

| ID | Name | Methodology |
|----|------|-------------|
| strategy-room | Strategy Room | OODA Loop |
| tribunal | The Tribunal | Legal Framework |
| innovation-lab | Innovation Lab | Design Thinking |
| risk-council | Risk Council | Monte Carlo |
| due-diligence | Due Diligence Council | M&A Framework |
| ethics-board | Ethics Board | Kantian + Utilitarian |
| growth-council | Growth Council | AARRR Pirate Metrics |
| technical-review | Technical Review Board | ADR |
| market-intelligence | Market Intelligence | Porter's Five Forces |
| crisis-response | Crisis Response Team | Incident Command |
| investment-committee | Investment Committee | DCF + Comparables |
| quality-assurance | Quality Assurance | Six Sigma DMAIC |
| research-council | Research Council | Scientific Method |
| competitive-analysis | Competitive Analysis | Game Theory |
| policy-council | Policy Council | Regulatory Impact |

## Usage

```typescript
import { getFormation, buildSystemPrompt, buildSynthesisPrompt } from '@relaylaunch/councilverse-formations';
import { buildAgentVote, tallyVotes } from '@relaylaunch/councilverse-voting';

// 1. Get a formation
const formation = getFormation('strategy-room');

// 2. Build system prompts for each agent
const systemPrompt = buildSystemPrompt('strategy-room');

// 3. Send to your LLM provider (any provider works)
const agentResponses = await Promise.all(
  formation.agents.map(agent =>
    yourLLMCall({ system: systemPrompt, user: question })
  )
);

// 4. Vote on the responses
const votes = agentResponses.map((response, i) =>
  buildAgentVote(
    `agent-${i}`,
    formation.agents[i].name,
    'council-1',
    response
  )
);

const result = tallyVotes(votes);
// result.outcome: "keep" | "refuse" | "deadlock"
// result.method: "strong_consensus" | "quality_weighted" | "lead_fallback"

// 5. Synthesize the verdict
const synthesisPrompt = buildSynthesisPrompt('strategy-room', agentResponses);
const verdict = await yourLLMCall({ system: synthesisPrompt });
```

## How Voting Works

Traditional multi-agent systems use majority vote. CouncilVerse uses **three-valued voting with quality-weighted scoring**:

- **KEEP** -- agent supports the proposal
- **REFUSE** -- agent opposes
- **ABSTAIN** -- agent signals "outside my expertise" (prevents noise)

Verdicts are determined by argument quality, not headcount:
1. **Strong consensus** -- all active voters agree
2. **Quality weighted** -- `argument_quality * confidence`, margin >= 15%
3. **Lead fallback** -- deadlock triggers formation lead arbitration

Based on the CAMP paper (arXiv:2604.00085).

## Protocol Support

CouncilVerse formations are designed for interoperability:

- **Google A2A** -- formations map to Agent Card skills
- **MCP** -- usable as MCP tool definitions
- **Webhooks** -- HMAC-SHA256 signed verdict events
- **Embed** -- iframe-friendly verdict widgets

## Full Platform

These open-source packages power [Relay Deck](https://deck.relaylaunch.com), which adds:

- Persistent verdict library with precedent search
- Reasoning trace audit trail (Langfuse)
- Embeddable verdict widgets
- Sprint contracts and durable debate state
- Heterogeneous model assignment (different LLMs per agent)
- EU AI Act compliance manifests
- BYOK (Bring Your Own Key) model

[Try the playground](https://deck.relaylaunch.com/playground) | [Sign up for Relay Deck](https://deck.relaylaunch.com/signup)

## Contributing

PRs welcome. Please open an issue first for major changes.

## License

MIT -- [RelayLaunch LLC](https://relaylaunch.com)
