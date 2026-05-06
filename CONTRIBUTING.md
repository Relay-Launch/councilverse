# Contributing to CouncilVerse

Thanks for your interest in contributing! CouncilVerse is MIT-licensed and welcomes PRs.

## Dev Environment

```bash
git clone https://github.com/Relay-Launch/councilverse.git
cd councilverse
```

Each package is independent (no workspace root). Install and build per-package:

```bash
cd packages/formations && npm install && npm run build
cd packages/voting && npm install && npm run build
cd packages/create-councilverse && npm install && npm run build
```

**Stack:** TypeScript 5, tsup (build), Node 18+.

## Adding a New Formation

1. Open `packages/formations/src/index.ts`.
2. Add your formation ID to the `FORMATION_IDS` array.
3. Add the entry to `FORMATIONS` with `id`, `name`, `methodology`, `description`, `agents` (count), `defaultRounds`, and `roles` (array of `{ title, perspective }`).
4. Update `packages/create-councilverse/src/index.ts` — add the ID to its `FORMATIONS` array.
5. Update the root `README.md` formations table.

Every formation must have at least 3 roles. Each role needs a unique `perspective` that defines how that agent argues.

## Adding a New Vote Type

The voting package uses three-valued logic: `keep`, `refuse`, `abstain`. To add signal detection keywords:

1. Edit `packages/voting/src/index.ts`.
2. Add phrases to `KEEP_SIGNALS`, `REFUSE_SIGNALS`, or `ABSTAIN_SIGNALS`.
3. Ensure `detectVote()` still produces correct results — check that new phrases don't collide across categories.

## PR Process

1. **Open an issue first** for major changes (new formations, API changes).
2. Fork the repo, create a branch from `main`.
3. Follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`.
4. Keep PRs focused — one formation or one feature per PR.
5. Ensure `npm run build` passes in every package you changed.

## Code Style

- TypeScript strict mode (`"strict": true`).
- Prefer explicit return types on exported functions.
- No runtime dependencies in `formations` or `voting` — they must stay zero-dep.
- Use `const` assertions where applicable (`as const`).

## Testing

There is no test runner configured yet. If you add tests, use [Vitest](https://vitest.dev/) and place test files adjacent to source as `*.test.ts`. We will merge a test harness soon.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
