# Development Workflow

## Phase-Gated Lifecycle

The project proceeds strictly phase-by-phase across 32 defined phases:

1. No phase may be bypassed.
2. No forward feature leaks (e.g. building UI in domain phases or writing ML code in foundation phases).
3. Every phase concludes with full validation: type checking, linting, tests, and phase report documentation.

## Standards and Tooling

- **Package Manager:** `pnpm` workspace (`pnpm@9.15.9`)
- **TypeScript:** Strict configuration (`noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`).
- **Linter:** ESLint 9 using flat config (`eslint.config.js`) and `typescript-eslint`.
- **Formatter:** Prettier (`.prettierrc.json`).
- **Test Runner:** Vitest with coverage reporter (`v8`).
- **Python / ML:** Python 3.10+ virtual environments with pinned dependencies.
