#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve } from "path";

const FORMATIONS = [
  "strategy-room", "tribunal", "innovation-lab", "risk-council",
  "due-diligence", "ethics-board", "growth-council", "technical-review",
  "market-intelligence", "crisis-response", "investment-committee",
  "quality-assurance", "research-council", "competitive-analysis",
  "policy-council",
] as const;

const BANNER = `
╔══════════════════════════════════════════════════════╗
║            create-councilverse v1.0.0                ║
║     Multi-agent AI council in 60 seconds             ║
║     https://relaylaunch.com/councilverse             ║
╚══════════════════════════════════════════════════════╝
`;

function main() {
  console.log(BANNER);

  const projectName = process.argv[2] || "my-council";
  const projectDir = resolve(process.cwd(), projectName);

  if (existsSync(projectDir)) {
    console.error(`Directory "${projectName}" already exists.`);
    process.exit(1);
  }

  console.log(`Creating CouncilVerse project in ${projectDir}...\n`);

  mkdirSync(join(projectDir, "src"), { recursive: true });

  writeFileSync(
    join(projectDir, "package.json"),
    JSON.stringify(
      {
        name: projectName,
        version: "1.0.0",
        private: true,
        type: "module",
        scripts: {
          start: "npx tsx src/council.ts",
          debate: "npx tsx src/council.ts",
        },
        dependencies: {
          "@relaylaunch/councilverse-formations": "^1.0.0",
          "@anthropic-ai/sdk": "^0.40.0",
        },
        devDependencies: {
          tsx: "^4.0.0",
          typescript: "^5.0.0",
        },
      },
      null,
      2
    )
  );

  writeFileSync(
    join(projectDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          esModuleInterop: true,
          outDir: "dist",
          rootDir: "src",
        },
        include: ["src"],
      },
      null,
      2
    )
  );

  const formationList = FORMATIONS.map((f) => `  "${f}"`).join(",\n");

  writeFileSync(
    join(projectDir, "src", "council.ts"),
    `import {
  getFormation,
  buildSystemPrompt,
  buildSynthesisPrompt,
  listFormations,
  type Formation,
} from "@relaylaunch/councilverse-formations";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const FORMATION_ID = process.argv[2] || "strategy-room";
const QUESTION = process.argv[3] || "Should we expand into the European market in Q3?";

async function runCouncil(formationId: string, question: string) {
  const formation = getFormation(formationId);
  if (!formation) {
    console.error(\`Unknown formation: \${formationId}\`);
    console.log("Available formations:");
    listFormations().forEach((f) => console.log(\`  - \${f.id}: \${f.name} (\${f.methodology})\`));
    process.exit(1);
  }

  console.log(\`\\n=== \${formation.name} ===\`);
  console.log(\`Methodology: \${formation.methodology}\`);
  console.log(\`Question: \${question}\\n\`);

  const responses: { role: string; perspective: string; response: string }[] = [];

  for (let i = 0; i < formation.roles.length; i++) {
    const role = formation.roles[i];
    console.log(\`[\${role.name}] thinking...\`);

    const systemPrompt = buildSystemPrompt(formation, i);
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: question }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    responses.push({ role: role.name, perspective: role.perspective, response: text });
    console.log(\`[\${role.name}] \${text.slice(0, 120)}...\\n\`);
  }

  console.log("\\n=== Synthesis ===\\n");

  const synthesisPrompt = buildSynthesisPrompt(formation, question, responses);
  const verdict = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: synthesisPrompt }],
  });

  const verdictText = verdict.content[0].type === "text" ? verdict.content[0].text : "";
  console.log(verdictText);
  console.log("\\n=== Council Complete ===");
}

runCouncil(FORMATION_ID, QUESTION).catch(console.error);
`
  );

  writeFileSync(
    join(projectDir, ".env.example"),
    `# Get your API key at https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-...
`
  );

  writeFileSync(
    join(projectDir, "README.md"),
    `# ${projectName}

A CouncilVerse multi-agent AI council project.

## Quick Start

\`\`\`bash
npm install
export ANTHROPIC_API_KEY=sk-ant-...
npm run debate -- strategy-room "Should we expand into Europe?"
\`\`\`

## Available Formations

${FORMATIONS.map((f) => `- \`${f}\``).join("\n")}

## Learn More

- [CouncilVerse](https://relaylaunch.com/councilverse)
- [Formations Package](https://www.npmjs.com/package/@relaylaunch/councilverse-formations)
- [Relay Deck Console](https://deck.relaylaunch.com)

Powered by [CouncilVerse](https://relaylaunch.com/councilverse) by RelayLaunch LLC.
`
  );

  console.log("Project created! Next steps:\n");
  console.log(`  cd ${projectName}`);
  console.log("  npm install");
  console.log('  export ANTHROPIC_API_KEY=sk-ant-...');
  console.log('  npm run debate -- strategy-room "Your question here"');
  console.log("\nAvailable formations:");
  FORMATIONS.forEach((f) => console.log(`  - ${f}`));
  console.log("\nPowered by CouncilVerse — https://relaylaunch.com/councilverse\n");
}

main();
