/**
 * Basic CouncilVerse debate example.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx examples/basic-debate.ts
 */

import { getFormation, buildSystemPrompt, buildSynthesisPrompt } from '@relaylaunch/councilverse-formations';
import { buildAgentVote, tallyVotes } from '@relaylaunch/councilverse-voting';

const QUESTION = "Should we acquire this competitor or build the capability in-house?";
const FORMATION_ID = "strategy-room";

async function callClaude(system: string, user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const data = await res.json();
  return data.content[0].text;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Set ANTHROPIC_API_KEY environment variable");
    process.exit(1);
  }

  const formation = getFormation(FORMATION_ID);
  const systemPrompt = buildSystemPrompt(FORMATION_ID);

  console.log(`\nFormation: ${formation.name}`);
  console.log(`Question: ${QUESTION}\n`);
  console.log("--- Agent Responses ---\n");

  const responses: { agentName: string; response: string }[] = [];

  for (const agent of formation.agents) {
    const agentSystem = `${systemPrompt}\n\nYou are: ${agent.name}. ${agent.role}`;
    const response = await callClaude(agentSystem, QUESTION);
    responses.push({ agentName: agent.name, response });
    console.log(`[${agent.name}]: ${response.slice(0, 200)}...\n`);
  }

  // Vote
  const votes = responses.map((r, i) =>
    buildAgentVote(`agent-${i}`, r.agentName, "council-1", r.response)
  );
  const result = tallyVotes(votes);

  console.log("--- Voting Result ---\n");
  console.log(`Outcome: ${result.outcome}`);
  console.log(`Method: ${result.method}`);
  console.log(`Margin: ${(result.margin * 100).toFixed(1)}%`);
  console.log(`Votes: ${result.total_voters} (${result.abstain_count} abstained)\n`);

  // Synthesize
  const synthesisPrompt = buildSynthesisPrompt(FORMATION_ID, responses);
  const verdict = await callClaude(synthesisPrompt, QUESTION);

  console.log("--- Verdict ---\n");
  console.log(verdict);
}

main().catch(console.error);
