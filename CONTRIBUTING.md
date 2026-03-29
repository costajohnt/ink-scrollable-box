# Contributing

Thanks for your interest in contributing to ink-scrollable-box!

## Development Setup

```bash
git clone https://github.com/costajohnt/ink-scrollable-box.git
cd ink-scrollable-box
npm install
```

## Scripts

- `npm run build` — Build ESM + CJS output
- `npm run dev` — Watch mode build
- `npm test` — Run tests
- `npm run test:watch` — Watch mode tests
- `npm run test:coverage` — Run with coverage
- `npm run lint` — Lint with xo
- `npm run lint:fix` — Auto-fix lint issues
- `npm run typecheck` — TypeScript type checking

## Running Examples

```bash
npx tsx examples/basic.tsx
npx tsx examples/log-follower.tsx
```

## Tests

All PRs must maintain the coverage thresholds:
- Statements: 95%
- Branches: 90%
- Functions: 95%
- Lines: 95%

## Code Style

This project uses [xo](https://github.com/xojs/xo) for linting. Run `npm run lint:fix` before committing.

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass and coverage thresholds are met
5. Submit a pull request

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` — New feature
- `fix:` — Bug fix
- `test:` — Test changes
- `docs:` — Documentation
- `chore:` — Maintenance
