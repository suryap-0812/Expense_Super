# Security, Privacy & Data Protection Reference — Expense Tracker V1

## 1. Zero-Telemetry & Local-First Privacy Mandate

Expense Tracker V1 operates under a strict privacy-first model:

1. **Zero External Databases**: The core application has no backend cloud database, no tracking cookies, no Google Analytics, and zero third-party telemetry beacons.
2. **Local Cryptographic Isolation**: Data at rest is contained within the user's sandboxed filesystem under standard OS permissions (`~/.config/expense-tracker/` or `%APPDATA%/expense-tracker`).
3. **Local Encryption Capability**: SQLite database files support AES-256 SQLCipher encryption when configured for enhanced local security.

---

## 2. LLM Privacy & Sanitization Firewall

When the user requests AI financial guidance via OpenRouter:

1. **Raw Data Isolation**: Raw transaction descriptions (e.g. "Payment to Dr. Smith at City Hospital", "Coffee with Alice at Starbucks", "Salary Transfer #48291") are **never** included in LLM prompts.
2. **Deterministic Aggregation**: Only sanitized, aggregated metrics (monthly income, total expenses, savings rate, category percentages, anomaly score, and cluster archetype) are packaged into the context.
3. **Regex PII Stripping**: The `packages/utils/src/security/sanitizer.ts` module runs regex filters to remove any stray credit card numbers, email addresses, phone numbers, and names from user goal descriptions before prompt serialization.
4. **User API Key Custody**: OpenRouter API keys are stored solely in encrypted local storage (`localStorage` or OS keychain) and transmitted directly to OpenRouter's API endpoint over TLS 1.3. Keys never pass through any intermediate proxy.

---

## 3. Data Integrity & Validation Boundaries

All system boundaries (UI inputs, SQLite read/write, ML tensor extraction, LLM prompt assembly, JSON backup import/export) are strictly gated by Zod schemas (`packages/schemas/`). Malformed payloads or untrusted inputs are rejected at runtime with zero side-effects.
