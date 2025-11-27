# Ticket: 01 Setup Project Structure and Configuration

Spec version: v1.0 / initial

## User Problem
- No project foundation exists to begin implementing the gimmestar GitHub Star Exchange application.
- Need a standardized TypeScript environment with testing capabilities to ensure code quality from the start.

## Outcome / Success Signals
- Project initializes successfully with `npm install`.
- TypeScript compiles without errors.
- Test runner executes and passes baseline tests.
- Directory structure follows standard conventions for maintainability.

## Post-Release Observations
- N/A (initial setup ticket)

## Context
- This is the foundational ticket for the gimmestar project.
- Must comply with GitHub ToS: no direct star-for-star pairing, use randomized matching, authorized OAuth scopes only.
- GDPR compliance required: encrypt GitHub tokens.
- Reference: `.sdd/architect.md` (Hard Constraints section)

## Objective & Definition of Done
Initialize a TypeScript-based Node.js project with proper configuration, testing infrastructure (Vitest), and organized directory structure. Done when the project builds successfully, tests run, and the structure supports future backend and frontend development.

**Definition of Done:**
- `package.json` created with necessary dependencies (TypeScript, Vitest, dotenv).
- `tsconfig.json` configured for Node.js environment.
- Vitest configured and a sample test passes.
- Base directory structure created (`src/`, `tests/`, `config/`).
- `.gitignore` includes `node_modules/`, `.env`, `dist/`.
- README.md with setup instructions.

## Steps
1. Initialize npm project: `npm init -y`.
2. Install core dependencies: `npm install typescript @types/node dotenv`.
3. Install dev dependencies: `npm install -D vitest @vitest/ui tsx`.
4. Create `tsconfig.json` with Node.js target (ES2022, CommonJS or ESM).
5. Configure Vitest in `vitest.config.ts`.
6. Create directory structure:
   - `src/` (application code)
   - `src/config/` (configuration)
   - `src/utils/` (utilities)
   - `tests/` (test files)
7. Add npm scripts to `package.json`: `build`, `test`, `dev`.
8. Create `.gitignore` with standard Node.js exclusions.
9. Create `tests/setup.test.ts` with a basic passing test.
10. Run tests to verify setup: `npm test`.
11. Create `README.md` with project description and setup instructions.
12. Commit changes to git with message: "chore: initialize project structure with TypeScript and Vitest".

## Affected files/modules
- `package.json`
- `tsconfig.json`
- `vitest.config.ts`
- `.gitignore`
- `README.md`
- `src/` (directory)
- `tests/setup.test.ts`

## Tests
- Create `tests/setup.test.ts` with a simple assertion:
  ```typescript
  import { describe, it, expect } from 'vitest';
  
  describe('Setup', () => {
    it('should pass basic test', () => {
      expect(true).toBe(true);
    });
  });
  ```
- Run: `npm test`
- Verify test passes and Vitest runs successfully.

## Risks & Edge Cases
- Dependency version conflicts: Pin major versions in `package.json`.
- TypeScript configuration mismatch: Ensure `tsconfig.json` module resolution matches project needs (Node16/NodeNext recommended).
- Missing `.gitignore`: Ensure sensitive files (`.env`, tokens) are excluded before any commits.

## Dependencies
- Upstream tickets: None (first ticket)
- Downstream tickets: All subsequent tickets depend on this foundation.