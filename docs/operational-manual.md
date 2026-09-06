# Operational Manual & Runbook — Expense Tracker V1

## 1. System Administration & Operations

### 1.1 Package Management & Build Automation

Expense Tracker uses `pnpm` workspaces for monorepo package orchestration and Bash automation scripts for builds, packaging, and validation.

```bash
# Install all monorepo dependencies
pnpm install

# Run full repository validation (Typecheck, Lint, Formatting, Tests)
./scripts/validate.sh

# Run performance benchmarking suite
pnpm run benchmark

# Build production artifacts for all platforms
bash scripts/build-all.sh

# Generate release bundle directory (dist-release/) with checksums
bash scripts/package-release.sh
```

---

## 2. Backup, Export & Disaster Recovery Procedures

### 2.1 Complete Local Backup (JSON Format)

Users can generate an unencrypted or encrypted JSON snapshot of their full financial state:

1. Export payload includes:
   - Metadata (`version: "1.0.0"`, `exported_at: ISO8601`)
   - All transactions (`Transaction[]`)
   - Bank balance history (`BalanceRecord[]`)
   - Goals & allocations (`Goal[]`, `GoalAllocation[]`)
   - User preferences & category configs
2. Zod Schema Verification: On import, `packages/schemas/src/backup.ts` validates 100% of records. If any transaction contains a negative amount, missing date, or malformed ID, the import fails transactionally with a comprehensive error log.

### 2.2 CSV Export / Import

- **Transactions Export**: RFC 4180 compliant CSV export format (`id,amount,type,category,payment_method,date,description`).
- **CSV Ingestion**: Handles standard banking statements with auto-detection of column delimiters, date formats (ISO, DD/MM/YYYY, MM/DD/YYYY), and category mapping.

---

## 3. Database Maintenance & Schema Migrations

### 3.1 SQLite File Integrity

To perform an integrity check or vacuum on the local database file:

```bash
# Check database file integrity
sqlite3 ~/.config/expense-tracker/expense_tracker.db "PRAGMA integrity_check;"

# Optimize and reclaim disk space
sqlite3 ~/.config/expense-tracker/expense_tracker.db "VACUUM;"
```

### 3.2 Schema Migrations

Database versioning is tracked via the `user_version` PRAGMA in SQLite. When starting the application, `SQLiteMigrationRunner` compares the embedded migration files with `PRAGMA user_version` and applies pending migrations sequentially inside a transaction.

---

## 4. OpenRouter API & LLM Operations

### 4.1 Key Configuration

1. User provides OpenRouter API key in Settings -> AI Configuration.
2. Key is validated via a lightweight test request (`GET https://openrouter.ai/api/v1/auth/key`).
3. Model selection defaults to:
   - Primary: `anthropic/claude-3.5-sonnet` (high-accuracy financial reasoning)
   - Fast / Economical: `meta-llama/llama-3.3-70b-instruct` or `google/gemini-2.0-flash`
4. Fallback Mode: If OpenRouter is unreachable, the API key is missing, or the device is offline, the UI automatically falls back to deterministic rule-based advice cards with zero interruption to core tracking features.

---

## 5. Performance Monitoring & SLA Baselines

Run automated latency benchmarks via `pnpm run benchmark`. The system enforces the following performance limits:

- **Deterministic Analytics Engine**: < 25ms per 1,000 transactions
- **Pattern & Trend Analysis**: < 35ms per 1,000 transactions
- **ML Feature Extraction & Tensor Generation**: < 60ms per 1,000 transactions
- **End-to-End Analytics Pipeline**: < 100ms per 1,000 transactions
- **SQLite Batch Insert / Query Operations**: < 80ms for 200 items
- **Zustand State Store Mutations**: < 10ms
- **UI Component Rendering**: < 100ms for 10 cards
