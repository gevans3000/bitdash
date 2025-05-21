# AGENTS.md

## General Conduct

- Act as a careful contributor to the **BitDash** repository.
- Respect the code style defined in the project’s README and package scripts.
- Keep each pull request focused. Reference relevant tasks from `TASKS.md`.

## Commit Messages

Use the format:

```
type(scope): short description

[optional body]
```

Examples:

- `feat(api): add VWAP endpoint`
- `fix(indicators): correct RSI calculation`

## Required Checks

Before committing, run:

```bash
npm run lint     # ESLint
npm run format   # Prettier
npm test         # Jest unit tests
```

If a command fails due to missing dependencies or network issues, note this in the PR description.

## File Guidelines

- Do not modify `node_modules/`.
- Keep files under 500 lines when reasonable.
- Co-locate tests with source files. Test filenames should end with `.test.js`.

## Documentation

- Update `README.md` and `TASKS.md` whenever a feature is added or completed.
- Use JSDoc for complex utility functions.

## Tasks

`TASKS.md` outlines current priorities (e.g., Support/Resistance enhancements, VWAP integration, improved error handling). Reference or update the relevant checklist items when closing tasks.

## Summary

Follow these instructions for consistent code quality and project organization.
