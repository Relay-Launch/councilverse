# @relaylaunch/councilverse-formations

15 structured AI council formations for multi-agent debate. Each formation defines a distinct decision methodology with agent roles, system prompts, and synthesis instructions.

## Install

```bash
npm install @relaylaunch/councilverse-formations
```

## Usage

```typescript
import { getFormation, listFormations, buildSystemPrompt, buildSynthesisPrompt } from '@relaylaunch/councilverse-formations';

// List all 15 council presets
const formations = listFormations();

// Get a specific formation
const strategyRoom = getFormation('strategy-room');

// Build system prompt for the first agent role
const systemPrompt = buildSystemPrompt(strategyRoom, 0);

// Build synthesis prompt after agents respond
const synthesisPrompt = buildSynthesisPrompt(strategyRoom, 'What should we do next?', [
  { role: 'Observer', response: '...' },
  { role: 'Strategist', response: '...' },
]);
```

## Embeddable Payload

Use the minimal embed API when you want a website, docs page, or product surface to render a CouncilVerse debate shell without binding to any specific LLM provider.

```bash
node --input-type=module -e "import { buildCouncilEmbedPayload } from '@relaylaunch/councilverse-formations'; console.log(JSON.stringify(buildCouncilEmbedPayload('technical-review', 'Should we ship the embeddable verdict widget?'), null, 2));"
```

The payload includes:

- `schemaVersion: "councilverse.embed.v1"`
- formation metadata and default round count
- one provider-agnostic system prompt per role
- a synthesis prompt ready for your own model gateway

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

## Protocol Support

- **Google A2A** - council presets map to Agent Card skills
- **MCP** - usable as MCP tool definitions
- **Webhooks** - HMAC-SHA256 signed verdict events
- **Embed** - iframe-friendly verdict widgets

## License

MIT -- RelayLaunch LLC
