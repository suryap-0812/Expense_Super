# Expense Tracker (V1)

A production-range cross-platform personal finance and financial-behavior analysis application built with local-first principles.

## Overview

Expense Tracker V1 is designed for a single user to manage, track, and understand their finances with high precision. It provides:

- Manual transaction recording (Income and Expenses)
- Authoritative manual bank balance tracking
- Goal creation and goal fund allocations
- "Available to Spend" calculations
- Deterministic financial analytics
- Machine learning anomaly detection & behavioral clustering
- Contextual LLM explanations and saving guidance
- Strict local-first privacy: no external database or backend server

## Architecture

The project is structured as a pnpm monorepo:

```text
expense-tracker/
├── apps/
│   ├── web/           # React + Vite web dashboard (planned)
│   ├── desktop/       # Tauri + React desktop application (planned)
│   └── mobile/        # React Native + Expo mobile application (planned)
├── packages/
│   ├── domain/        # Core financial domain entities and rules
│   ├── schemas/       # Zod schemas and validation contracts
│   ├── state/         # Client state management stores
│   ├── analytics/     # Deterministic analytics engine
│   ├── ml-contract/   # Machine learning input/output contracts
│   ├── ui/            # Shared UI components and tokens
│   └── utils/         # Cross-cutting utility helpers
├── ml/
│   ├── data/          # Raw, processed, and feature datasets
│   ├── notebooks/     # Research and model exploration
│   ├── src/           # Python synthetic generation & ML pipeline
│   ├── models/        # Trained and ONNX exported models
│   ├── tests/         # Python ML test suite
│   └── requirements.txt
├── docs/              # Comprehensive project specifications & documentation
├── scripts/           # CI/CD and developer automation scripts
└── tests/             # Cross-package test suites
```

## Getting Started

### Prerequisites

- Node.js >= 18.18 (v18.19.1 tested)
- pnpm >= 9.x
- Python >= 3.10 (for ML module)

### Installation

```bash
pnpm install
```

### Validation Commands

```bash
# Type check all packages
pnpm run typecheck

# Lint codebase
pnpm run lint

# Check code formatting
pnpm run format:check

# Run test suite
pnpm run test

# Run all validation steps in sequence
./scripts/validate.sh
```

## Development Lifecycle & Phase-Gated Process

Development strictly follows a 32-phase gated implementation process. Each phase requires design, implementation, testing, validation, documentation, and explicit sign-off before proceeding to the next.
