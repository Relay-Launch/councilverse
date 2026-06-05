import { buildCouncilEmbedPayload } from "../packages/formations/dist/index.mjs";
import { buildAgentVote, tallyVotes } from "../packages/voting/dist/index.mjs";

const question = "Should a repair shop follow up on stale estimates every morning?";
const payload = buildCouncilEmbedPayload("strategy-room", question);

const responses = [
  {
    agent: payload.agents[0],
    text: "I recommend approve. The evidence shows stale estimates decay quickly, and a daily review is a low-risk habit.",
  },
  {
    agent: payload.agents[1],
    text: "I support proceed. First, the owner still approves every send. Second, the action is specific and measurable.",
  },
  {
    agent: payload.agents[2],
    text: "I endorse a small pilot. It is strategically sound if the team tracks replies and recovered bookings.",
  },
];

const votes = responses.map(({ agent, text }) =>
  buildAgentVote(agent.id, agent.title, "example-council", text),
);
const result = tallyVotes(votes);

console.log(`Council: ${payload.formationName}`);
console.log(`Question: ${payload.question}`);
console.log(`Verdict: ${result.outcome}`);
console.log(`Method: ${result.method}`);
console.log(`Agents: ${responses.map(({ agent }) => agent.title).join(", ")}`);
