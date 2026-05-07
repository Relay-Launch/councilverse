import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { existsSync, readFileSync, rmSync } from "fs";
import { resolve, join } from "path";

const FIXTURES_DIR = resolve(import.meta.dirname, "..", "..", "..", "tmp-test-project");
const CLI_PATH = resolve(import.meta.dirname, "..", "src", "index.ts");

describe("create-councilverse CLI", () => {
  afterAll(() => {
    if (existsSync(FIXTURES_DIR)) {
      rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }
  });

  it("generates project directory with correct name", () => {
    if (existsSync(FIXTURES_DIR)) rmSync(FIXTURES_DIR, { recursive: true, force: true });
    execSync(`npx tsx "${CLI_PATH}" tmp-test-project`, {
      cwd: resolve(FIXTURES_DIR, ".."),
      stdio: "pipe",
    });
    expect(existsSync(FIXTURES_DIR)).toBe(true);
  });

  it("creates package.json with correct dependencies", () => {
    const pkg = JSON.parse(readFileSync(join(FIXTURES_DIR, "package.json"), "utf-8"));
    expect(pkg.name).toBe("tmp-test-project");
    expect(pkg.dependencies).toHaveProperty("@relaylaunch/councilverse-formations");
    expect(pkg.dependencies).toHaveProperty("@anthropic-ai/sdk");
    expect(pkg.type).toBe("module");
  });

  it("creates tsconfig.json with ESNext module", () => {
    const tsconfig = JSON.parse(readFileSync(join(FIXTURES_DIR, "tsconfig.json"), "utf-8"));
    expect(tsconfig.compilerOptions.module).toBe("ESNext");
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it("creates src/council.ts entry point", () => {
    expect(existsSync(join(FIXTURES_DIR, "src", "council.ts"))).toBe(true);
    const content = readFileSync(join(FIXTURES_DIR, "src", "council.ts"), "utf-8");
    expect(content).toContain("import");
    expect(content).toContain("getFormation");
    expect(content).toContain("buildSystemPrompt");
  });

  it("creates .env.example with ANTHROPIC_API_KEY", () => {
    const env = readFileSync(join(FIXTURES_DIR, ".env.example"), "utf-8");
    expect(env).toContain("ANTHROPIC_API_KEY");
  });

  it("creates README.md with formations list", () => {
    const readme = readFileSync(join(FIXTURES_DIR, "README.md"), "utf-8");
    expect(readme).toContain("strategy-room");
    expect(readme).toContain("tribunal");
    expect(readme).toContain("CouncilVerse");
  });

  it("fails gracefully if directory already exists", () => {
    expect(() => {
      execSync(`npx tsx "${CLI_PATH}" tmp-test-project`, {
        cwd: resolve(FIXTURES_DIR, ".."),
        stdio: "pipe",
      });
    }).toThrow();
  });
});
