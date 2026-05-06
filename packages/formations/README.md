# @relaylaunch/councilverse-formations

15 structured AI council formations for multi-agent debate. Each formation defines a distinct decision methodology with agent roles, system prompts, and synthesis instructions.

## Install

```bash
npm install @relaylaunch/councilverse-formations
```

## Usage

```typescript
import { getFormation, listFormations, buildSystemPrompt, buildSynthesisPrompt } from '@relaylaunch/councilverse-formations';

// List all 17 formations
const formations = listFormations();

// Get a specific formation
const strategyRoom = getFormation('strategy-room');

// Build system prompt for an agent
const systemPrompt = buildSystemPrompt('strategy-room');

// Build synthesis prompt after agents respond
const synthesisPrompt = buildSynthesisPrompt('strategy-room', [
  { agentName: 'Intelligence Officer', response: '...' },
  { agentName: 'Strategist', response: '...' },
]);
```

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

- **Google A2A** — formations map to Agent Card skills
- **MCP** — usable as MCP tool definitions
- **Webhooks** — HMAC-SHA256 signed verdict events
- **Embed** — iframe-friendly verdict widgets

## License

MIT — RelayLaunch LLC
