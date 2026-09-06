# System Architecture Reference — Expense Tracker V1

## 1. Architectural Philosophy & Principles

Expense Tracker V1 is architected around three foundational pillars:

1. **Local-First Financial Source of Truth**: All persistent user data (transactions, authoritative bank balances, financial goals, category allocations, local settings) is stored exclusively on the user's local machine via SQLite. No telemetry, user profiling, or remote database synchronization is used.
2. **Deterministic Calculations for Authoritative Figures**: Calculations of bank balances, available to spend, savings, savings rates, and goal allocation progress are strictly governed by pure, deterministic TypeScript financial functions. Neither machine learning nor large language models are ever permitted to calculate or alter these numbers.
3. **Local Machine Learning & Structured Privacy-Preserving LLM Guidance**:
   - **Anomaly & Pattern Detection**: Executed on-device using local statistical algorithms and ONNX Runtime inference (Isolation Forest, K-Means clustering, trend volatility models).
   - **LLM Guidance (OpenRouter)**: Only high-level, sanitized, aggregated statistical evidence and metrics are transmitted to LLM models via the user's personal API key. Raw transaction descriptions, individual dates, and identifiable vendor details are stripped completely.

---

## 2. Monorepo Topology

The codebase is organized as a unified `pnpm` monorepo:

```text
Expense_super/
├── apps/
│   ├── web/                    # React 18 + Vite + Tailwind/Glassmorphism Web Dashboard
│   ├── desktop/                # Tauri 2.0 (Rust) + React 18 Desktop Client
│   └── mobile/                 # React Native + Expo (SDK 52) Mobile Client
├── packages/
│   ├── domain/                 # Pure domain entities, value objects, and business rules
│   ├── schemas/                # Zod runtime schemas & type derivations
│   ├── state/                  # Zustand state stores (Transactions, Goals, Balance, LLM, ML)
│   ├── analytics/              # Deterministic financial calculation engine & pattern analysis
│   ├── ml-contract/            # TypeScript interfaces for ML features, anomalies & inference
│   ├── ml-inference/           # ONNX Runtime local inference wrapper
│   ├── llm-client/             # OpenRouter API client, prompt generators & response parsers
│   ├── ui/                     # Shared UI components, theme tokens, and badges
│   └── utils/                  # Privacy sanitizers, formatters, and mathematical utilities
├── ml/
│   ├── data/                   # Raw, processed, and feature datasets (10k synthetic users)
│   ├── src/                    # Python generator, feature engineering, clustering & models
│   ├── models/                 # Serialized scikit-learn models & exported ONNX binaries
│   └── tests/                  # Pytest test suites (50 unit & integration tests)
├── docs/                       # Architecture, phases (0-32), operational manual, and specs
├── scripts/                    # Automation scripts (validate, benchmark, build-all, package)
└── tests/                      # Monorepo cross-package Vitest integration & benchmark suites
```

---

## 3. End-to-End Data Flow

```text
                          USER INTERACTION
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │   Single Dashboard    │
                     │  (Web/Desktop/Mobile) │
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │     Zustand State     │
                     │ (Reactive Store Layer)│
                     └───────────┬───────────┘
                                 │
                ┌────────────────┴────────────────┐
                ▼                                 ▼
     ┌─────────────────────┐           ┌─────────────────────┐
     │ Deterministic Engine│           │ SQLite Repository   │
     │ - Bank Balance      │           │ - Transactions Table│
     │ - Available to Spend│           │ - Balances Table    │
     │ - Savings & Rate    │           │ - Goals Table       │
     │ - Category Totals   │           │ - Allocations Table │
     └──────────┬──────────┘           └──────────┬──────────┘
                │                                 │
                └────────────────┬────────────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Feature Engineering   │
                     │ (Local Preprocessing) │
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │  ONNX Runtime Local   │
                     │ - Isolation Forest    │
                     │ - K-Means Clustering  │
                     │ - Trend Volatility    │
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Structured Evidence   │
                     │ (Anomalies, Clusters) │
                     └───────────┬───────────┘
                                 │
                                 ▼ (Privacy Sanitization)
                     ┌───────────────────────┐
                     │  OpenRouter Client    │
                     │ (User's own API Key)  │
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Contextual AI Guidance│
                     │  (Natural Language)   │
                     └───────────────────────┘
```

---

## 4. Key Subsystem Boundaries

| Subsystem                   | Technology                        | Responsibility                                                | Persistence / Transport                      |
| :-------------------------- | :-------------------------------- | :------------------------------------------------------------ | :------------------------------------------- |
| **Domain Layer**            | TypeScript                        | Pure domain contracts, entities, validation rules             | In-memory                                    |
| **State Layer**             | Zustand                           | Single source of truth for active UI state & reactive sync    | LocalStorage / SQLite sync                   |
| **Database**                | SQLite3 / Tauri SQL / Expo SQLite | ACID relational persistence for transactions, balances, goals | Local disk file (`expense_tracker.db`)       |
| **Deterministic Analytics** | Pure TS                           | Income, expense, savings rate, available to spend             | In-memory computed                           |
| **ML Inference**            | ONNX Runtime Node / Web / Py      | On-device anomaly classification & behavioral clustering      | Local `.onnx` binary files                   |
| **LLM Advisor**             | TypeScript Fetch + OpenRouter     | Strategic explanation & saving guidance generation            | HTTPS to OpenRouter (Sanitized payload only) |
| **Presentation**            | React 18 / React Native           | Information-dense, responsive dashboard UI                    | DOM / Native UI                              |
