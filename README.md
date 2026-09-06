# Expense Tracker (V1)

[![Build & Tests](https://img.shields.io/badge/tests-198%20Vitest%20%7C%2050%20Pytest%20passing-brightgreen.svg)](#testing--verification)
[![TypeScript](https://img.shields.io/badge/typescript-5.x%20strict-blue.svg)](#architecture)
[![Local-First](https://img.shields.io/badge/privacy-100%25%20local--first-green.svg)](#privacy--security-model)
[![License](https://img.shields.io/badge/license-MIT-purple.svg)](#license)

**Expense Tracker V1** is an enterprise-grade, local-first personal finance and behavioral analysis application. Built with modern TypeScript, SQLite, on-device ONNX machine learning, and privacy-preserving LLM financial guidance via OpenRouter.

---

## 🌟 Key Features

1. **Deterministic Financial Source of Truth**
   - Manual transaction recording (Income vs Expenses) with category, payment method, date, and description.
   - Authoritative manual Bank Balance tracking (no inaccurate drift from unrecorded external transactions).
   - Dynamic **Available to Spend** calculations (`Bank Balance - Total Goal Allocations`).
   - Pure, deterministic calculation of Income, Expenses, Savings, and Savings Rate.

2. **Smart Goal Allocations**
   - Multi-goal tracking with target dates, colors, and progress indicators.
   - Solvency enforcement: Total allocations cannot exceed the authoritative bank balance.

3. **On-Device Machine Learning (ONNX Runtime)**
   - Multi-dimensional anomaly detection using **Isolation Forest** (detects unusual spending amounts and frequency bursts).
   - Behavioral clustering using **K-Means** (identifies user profiles: _Good Saver_, _Weekend Spender_, _Impulse Spender_, etc.).
   - Statistical pattern and volatility analysis computed locally in milliseconds.

4. **Privacy-Preserving AI Financial Guidance (OpenRouter)**
   - Translates local statistical and ML evidence into actionable, contextual financial advice.
   - **Zero PII Leakage**: Raw transaction descriptions and personal vendor names are stripped before context generation; only sanitized, aggregated numbers are sent.
   - Operates with the user's own OpenRouter API key.
   - Seamless offline fallback to deterministic rule-based advice cards.

5. **Cross-Platform Multi-Target Support**
   - **Web**: React 18 + Vite with glassmorphism dark/light design system.
   - **Desktop**: Tauri 2.0 (Rust) + React with local SQLite database file.
   - **Mobile**: React Native + Expo (SDK 52) with mobile SQLite persistence.

---

## 🏗️ Monorepo Architecture

```text
Expense_super/
├── apps/
│   ├── web/                    # React 18 + Vite Web Dashboard
│   ├── desktop/                # Tauri 2.0 (Rust) + React Desktop Client
│   └── mobile/                 # React Native + Expo Mobile Client
├── packages/
│   ├── domain/                 # Pure domain entities, value objects, and business rules
│   ├── schemas/                # Zod schemas & runtime validation contracts
│   ├── state/                  # Zustand state stores (Transactions, Goals, Balance, LLM, ML)
│   ├── analytics/              # Deterministic financial analytics & trend analysis
│   ├── ml-contract/            # TypeScript contracts for ML features & anomaly schemas
│   ├── ml-inference/           # ONNX Runtime local inference wrapper
│   ├── llm-client/             # OpenRouter client & privacy-preserving prompt generators
│   ├── ui/                     # Shared UI components, glassmorphism cards & design tokens
│   └── utils/                  # PII sanitizers, formatters, and mathematical helpers
├── ml/
│   ├── data/                   # 10,000 synthetic users across 10 behavioral archetypes
│   ├── src/                    # Python generator, feature engineering, clustering & models
│   ├── models/                 # Serialized scikit-learn & exported ONNX binaries
│   └── tests/                  # Pytest test suites (50 unit & integration tests)
├── docs/                       # Comprehensive specifications, architecture, and phase runbooks
├── scripts/                    # Automation scripts (validate, benchmark, build-all, package)
└── tests/                      # Monorepo cross-package Vitest integration & benchmark suites
```

---

## 🚀 Quick Start & Installation

### Prerequisites

- **Node.js**: `>= 18.18.0` (tested with v18.19.1 / v20.x)
- **pnpm**: `>= 9.x` (`corepack enable && corepack use pnpm@latest`)
- **Python**: `>= 3.10` (for ML module and model training)

### Setup

```bash
# 1. Clone repository
git clone https://github.com/suryap-0812/Expense_Super.git
cd Expense_Super

# 2. Install monorepo dependencies
pnpm install

# 3. (Optional) Set up Python virtual environment for ML development
python3 -m venv .venv
source .venv/bin/activate
pip install -r ml/requirements.txt
```

---

## 🛠️ Development & Execution

```bash
# Start Web Dashboard (Vite dev server)
pnpm --filter @expense-tracker/web run dev

# Start Desktop App (Tauri dev environment)
pnpm --filter @expense-tracker/desktop run tauri dev

# Start Mobile App (Expo development server)
pnpm --filter @expense-tracker/mobile run start
```

---

## 🧪 Testing & Verification

The codebase maintains a 100% test pass rate across all layers.

```bash
# Run full repository validation (Typecheck, ESLint, Prettier, Vitest)
./scripts/validate.sh

# Run TypeScript Vitest suites (198 tests across 29 test suites)
pnpm run test

# Run Python ML test suite (50 Pytest tests)
pnpm run ml:test

# Run Performance Benchmark Suite (SLA validation)
pnpm run benchmark

# Build production distribution packages for Web, Desktop, and Mobile
bash scripts/package-release.sh
```

---

## 🔒 Privacy & Security Model

- **100% Local Persistence**: User data never leaves the local device. SQLite database files reside solely in the user's OS application data directory.
- **Zero Telemetry**: No third-party tracking, crash analytics, or telemetry endpoints.
- **PII Stripping & Regex Sanitization**: All prompts sent to OpenRouter are sanitized using `packages/utils/src/security/sanitizer.ts`. Raw transaction text, dates, credit card numbers, and emails are stripped.
- **API Key Security**: The OpenRouter API key is stored only on the client device and sent directly to OpenRouter via TLS 1.3.

---

## 📊 Performance Benchmark SLAs

The system enforces strict latency limits validated via `pnpm run benchmark`:

| Operation                                     | SLA Target | Measured Performance |
| :-------------------------------------------- | :--------- | :------------------- |
| **Deterministic Analytics (1,000 txs)**       | < 25 ms    | ~0.8 - 1.2 ms        |
| **Pattern & Volatility Analysis (1,000 txs)** | < 35 ms    | ~1.5 - 2.5 ms        |
| **ML Feature Extraction (1,000 txs)**         | < 60 ms    | ~4.0 - 6.5 ms        |
| **End-to-End Analytics Pipeline (1,000 txs)** | < 100 ms   | ~7.0 - 12.0 ms       |
| **SQLite Batch Queries (200 records)**        | < 80 ms    | ~8.0 - 15.0 ms       |
| **Zustand State Store Mutations**             | < 10 ms    | ~0.1 - 0.5 ms        |
| **UI Component SSR Rendering (10 cards)**     | < 100 ms   | ~3.0 - 8.0 ms        |

---

## 📖 Documentation Index

- [System Architecture](docs/architecture/system-architecture.md)
- [Database Persistence & SQLite Schema](docs/architecture/database.md)
- [Machine Learning & ONNX Pipeline](docs/architecture/ml-pipeline.md)
- [Security, Privacy & Data Protection](docs/architecture/security-privacy.md)
- [Operational Manual & Runbook](docs/operational-manual.md)
- [Phase 0 - 32 Implementation Archive](docs/phases/)

---

## 📄 License

MIT © Surya P. All rights reserved.
