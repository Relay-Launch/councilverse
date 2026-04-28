# @relaylaunch/councilverse-voting

Three-valued voting for AI council debates. Agents cast KEEP, REFUSE, or ABSTAIN instead of forced binary positions. Verdicts determined by argument quality, not headcount.

Based on the CAMP paper (arXiv:2604.00085).

## Install

```bash
npm install @relaylaunch/councilverse-voting
```

## Usage

```typescript
import { buildAgentVote, tallyVotes } from '@relaylaunch/councilverse-voting';

// Build votes from agent response text
const votes = [
  buildAgentVote('agent-1', 'Strategist', 'council-1', agentResponse1),
  buildAgentVote('agent-2', 'Risk Analyst', 'council-1', agentResponse2),
  buildAgentVote('agent-3', 'Devil\'s Advocate', 'council-1', agentResponse3),
];

// Tally using quality-weighted scoring
const result = tallyVotes(votes);

console.log(result.outcome);  // "keep" | "refuse" | "deadlock"
console.log(result.method);   // "strong_consensus" | "quality_weighted" | "lead_fallback"
console.log(result.margin);   // 0.0 - 1.0
```

## How It Works

### Three-Valued Votes
- **KEEP** -- agent supports the proposal
- **REFUSE** -- agent opposes the proposal
- **ABSTAIN** -- agent signals "outside my expertise"

ABSTAIN prevents noise from agents opining on domains they don't understand.

### Quality-Weighted Scoring

Verdicts are determined by argument quality, not simple headcount:
1. **Strong consensus** -- all active voters agree (2+ agents)
2. **Quality weighted** -- weight = `argument_quality * confidence`, margin >= 15%
3. **Lead fallback** -- deadlock when margin < 15%

### Argument Quality Scoring

Arguments scored on evidence, structure, and specificity:
- Evidence markers ("data shows", "according to", "based on")
- Structure markers ("first", "second", "therefore", "in contrast")
- Specificity markers (percentages, dollar amounts, dates)

## API

| Function | Description |
|----------|-------------|
| `buildAgentVote(agentId, agentName, councilId, text)` | Build vote from raw agent text |
| `tallyVotes(votes)` | Quality-weighted vote tally |
| `detectVote(text)` | Extract KEEP/REFUSE/ABSTAIN from text |
| `detectConfidence(text)` | Score confidence level (0.1-1.0) |
| `scoreArgumentQuality(text)` | Score argument quality (0.05-1.0) |

## License

MIT -- RelayLaunch LLC
