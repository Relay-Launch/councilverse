import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, normalize } from "node:path";

const ignoredFiles = new Set([normalize("scripts/check-pii-scan.mjs")]);
const scannedExtensions = new Set([".js", ".json", ".md", ".mjs", ".ts", ".tsx"]);
const bannedPatterns = [
  { label: "pilot first name", pattern: /\bBlake\b/i },
  { label: "pilot first name", pattern: /\bElaine\b/i },
  { label: "client name", pattern: /Holistic Rejuvenation Center/i },
  { label: "client name", pattern: /AutoFix Plus/i },
  { label: "sample identity marker", pattern: /sample client/i },
  { label: "sample identity marker", pattern: /fake customer/i },
];

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function changedFiles() {
  let base = "";
  try {
    base = git(["merge-base", "HEAD", "origin/main"]);
  } catch {
    base = "";
  }

  const ranges = [
    base ? ["diff", "--name-only", "--diff-filter=ACMRT", `${base}...HEAD`] : null,
    ["diff", "--name-only", "--diff-filter=ACMRT"],
    ["diff", "--cached", "--name-only", "--diff-filter=ACMRT"],
    ["ls-files", "--others", "--exclude-standard"],
  ].filter(Boolean);

  return [
    ...new Set(
      ranges
        .flatMap((args) => {
          const output = git(args);
          return output ? output.split(/\r?\n/) : [];
        })
        .map((file) => normalize(file))
        .filter(Boolean),
    ),
  ];
}

const hits = [];
for (const file of changedFiles()) {
  if (ignoredFiles.has(file)) continue;
  if (!scannedExtensions.has(extname(file))) continue;
  if (!existsSync(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const { label, pattern } of bannedPatterns) {
    if (pattern.test(text)) hits.push({ file, label, pattern: pattern.source });
  }
}

if (hits.length) {
  console.error(JSON.stringify({ status: "failed", hits }, null, 2));
  process.exit(1);
}

console.log("CouncilVerse changed-file PII scan passed.");
