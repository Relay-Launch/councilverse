<p align="center">
  <strong>CouncilVerse</strong><br>
  AI agents that disagree on purpose
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@relaylaunch/councilverse-formations"><img src="https://img.shields.io/npm/v/@relaylaunch/councilverse-formations?label=formations&color=007AFF" alt="npm formations"></a>
  <a href="https://www.npmjs.com/package/@relaylaunch/councilverse-voting"><img src="https://img.shields.io/npm/v/@relaylaunch/councilverse-voting?label=voting&color=007AFF" alt="npm voting"></a>
  <a href="https://www.npmjs.com/package/create-councilverse"><img src="https://img.shields.io/npm/v/create-councilverse?label=create&color=007AFF" alt="npm create"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-0F172A" alt="MIT License"></a>
</p>

---

Use CouncilVerse when one AI answer is too smooth.

It gives each AI agent a different job, forces them to argue from that job, then scores the verdict by reasoning quality instead of a simple headcount.

**In plain English:** you ask one question, several agents disagree, then you get a verdict you can audit.

## Run the local example

No API key needed:

```bash
npm install
npm run build
npm run example:local
```

Expected shape:

```text
Council: Strategy Room
Question: Should a repair shop follow up on stale estimates every morning?
Verdict: keep
Method: strong_consensus
Agents: Observer, Orienter, Strategist
```

The example uses canned responses so you can prove the package works before connecting any model provider.

## Start a real council project

```bash
npx create-councilverse my-council
cd my-council
npm install
```

Add your model key:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Run a council:

```bash
npm run debate -- strategy-room "Should we expand into Europe?"
```

## Packages

| Package | What it does | Install |
|---------|--------------|---------|
| [`@relaylaunch/councilverse-formations`](packages/formations) | 15 ready-made council presets with roles and prompts | `npm i @relaylaunch/councilverse-formations` |
| [`@relaylaunch/councilverse-voting`](packages/voting) | Turns agent responses into keep, refuse, or abstain verdicts | `npm i @relaylaunch/councilverse-voting` |
| [`create-councilverse`](packages/create-councilverse) | Creates a working starter project | `npx create-councilverse` |

## What the presets are for

| ID | Use it when you need |
|----|----------------------|
| strategy-room | A practical business strategy call |
| tribunal | A hard yes/no challenge with a case for and against |
| innovation-lab | New ideas without skipping reality checks |
| risk-council | Risk, downside, and mitigation planning |
| due-diligence | Investment, acquisition, or vendor review |
| ethics-board | Human impact and rights review |
| growth-council | Acquisition, activation, retention, referral, and revenue |
| technical-review | Architecture and implementation tradeoffs |
| market-intelligence | Competitive pressure and market structure |
| crisis-response | Incident response and fast triage |
| investment-committee | Investment quality and downside review |
| quality-assurance | Process defects and improvement plans |
| research-council | Evidence review and hypothesis testing |
| competitive-analysis | Competitor moves and game theory |
| policy-council | Regulatory or policy impact review |

## Use the libraries directly

```typescript
import { buildCouncilEmbedPayload } from '@relaylaunch/councilverse-formations';
import { buildAgentVote, tallyVotes } from '@relaylaunch/councilverse-voting';

const payload = buildCouncilEmbedPayload(
  'strategy-room',
  'Should a repair shop follow up on stale estimates every morning?'
);

const responses = [
  'I recommend approve. The evidence shows stale estimates decay quickly, and a daily review is a low-risk habit.',
  'I support proceed. First, the owner still approves every send. Second, the action is specific and measurable.',
  'I endorse a small pilot. It is strategically sound if the team tracks replies and recovered bookings.',
];

const votes = responses.map((text, index) =>
  buildAgentVote(
    payload.agents[index].id,
    payload.agents[index].title,
    'example-council',
    text
  )
);

console.log(tallyVotes(votes));
```

## How voting works

Each agent returns one of three outcomes:

- **KEEP**: supports the proposal
- **REFUSE**: opposes the proposal
- **ABSTAIN**: says "not my area" or lacks enough evidence

The final verdict is based on reasoning quality and confidence. A strong minority can beat a weak majority.

## Embeds

`buildCouncilEmbedPayload()` returns a provider-neutral payload with:

- the council preset
- the public question
- a prompt-free `summary` for product previews
- one system prompt per role
- a synthesis prompt

Use `buildCouncilEmbedSummary()` when a product surface only needs the council name, methodology, role titles, default rounds, and display hint.

Use it for iframe widgets, MCP tools, Agent Card skills, or your own app surface.

## Full platform

These packages power [Relay Deck](https://deck.relaylaunch.com), which adds:

- saved verdicts and precedent search
- reasoning traces
- embeddable verdict widgets
- durable debate state
- owner approval checkpoints
- model assignment per agent
- compliance manifests
- bring-your-own model keys

[Try the playground](https://deck.relaylaunch.com/playground) | [Sign up for Relay Deck](https://deck.relaylaunch.com/signup)

## Contributing

PRs welcome. Please open an issue first for major changes.

## License

MIT -- [RelayLaunch LLC](https://relaylaunch.com)
