# Phase 28: Security + Privacy Audit & Hardening

## 1. Executive Summary

Phase 28 executes the comprehensive **Security + Privacy Audit & Hardening** for the Expense Super Monorepo strictly conforming to **Master Specification Section 87** and Sections 34-37.

The central architecture of Expense Super is built on a **local-first privacy guarantee**:

- Financial analytics, metric aggregations, feature extraction, and ML inferences (Isolation Forest, K-Means) run **100% on-device** (local SQLite & ONNX Runtime).
- No raw transactions, merchant strings, note texts, transaction timestamps, or banking identifiers ever leave the client machine.
- All external LLM requests transmit **only high-level, sanitized, aggregated statistical evidence** to OpenRouter.

---

## 2. Comprehensive Security & Privacy Audit (Section 87)

| Audit Vector            | Audit Finding / Requirement                                                     | Enforcement & Safeguards Implemented                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **1. API Keys**         | OpenRouter API keys must never be hardcoded, logged, or committed to git.       | Stored in local settings state; masked via `maskApiKey()` (e.g. `sk-or-v1-••••••••3829`); excluded from git repos.     |
| **2. Local Data**       | Financial balances, categories, transactions, and goals remain on-device.       | Persisted locally in SQLite / SQLite OPFS with zero external analytics telemetry or cloud data sync required.          |
| **3. Logs**             | Logs must never expose credentials, bearer tokens, or PII.                      | Deep sanitization via `sanitizeForLogging()` scrubs keys named `apiKey`, `token`, `password`, `authorization`, etc.    |
| **4. Network Requests** | Outbound requests must be minimized and strictly isolated.                      | Only LLM requests to OpenRouter exist; network payloads run through `assertNoRawTransactions()` pre-flight assertions. |
| **5. SQLite**           | SQLite queries must be resilient against SQL Injection (CWE-89).                | Parameterized SQL queries used across all repository interfaces (`db.prepare(sql).run(...params)`).                    |
| **6. Exports**          | Data exports (CSV / JSON) must defend against CSV Formula Injection (CWE-1236). | `sanitizeCsvCell()` neutralizes formula characters (`=`, `+`, `-`, `@`, `\t`, `\r`, `%`) with prepended single quotes. |
| **7. LLM Payloads**     | Payloads must NEVER contain raw transaction items or merchant details.          | `assertNoRawTransactions()` strictly validates that payloads contain only aggregated statistical metrics.              |
| **8. Error Messages**   | Errors must never expose local file paths, DB paths, or API secrets.            | `sanitizeErrorMessage()` and `redactSensitiveData()` strip absolute OS file paths and token patterns.                  |

---

## 3. Implemented Security Modules & Architecture

### 3.1 Data Sanitization & Redaction (`packages/utils/src/security/sanitizer.ts`)

- `redactSensitiveData(text: string): string`: Redacts OpenRouter keys (`sk-or-v1-...`), OpenAI keys (`sk-...`), Bearer tokens (`Bearer [REDACTED]`), GitHub tokens, and JWTs.
- `maskApiKey(apiKey: string): string`: Masks credentials for secure UI presentation.
- `sanitizeCsvCell(value: unknown): string`: Neutralizes spreadsheet formula injection.
- `sanitizeForLogging(obj: unknown): unknown`: Deeply traverses object graphs to scrub sensitive keys.

### 3.2 Outbound Privacy Guard (`packages/utils/src/security/payload-guard.ts`)

- `assertNoRawTransactions(payload: unknown)`: Deeply inspects payload objects, throwing security violations if raw transaction lists, notes, merchant strings, or account details are detected.
- `sanitizeErrorMessage(error: unknown)`: Redacts local OS file paths and secrets from runtime exceptions.

### 3.3 Production LLM Client Privacy Hardening (`packages/llm-client/src/openrouter-client.ts`)

- Integrated pre-flight `assertNoRawTransactions(input)` assertion prior to network request dispatch.
- Error payloads sanitized with `redactSensitiveData` and `sanitizeErrorMessage`.

### 3.4 Secure Local Settings Store (`packages/state/src/settings-store.ts`)

- API key local storage management with `setOpenRouterApiKey`, `getMaskedApiKey`, and `clearApiKey`.

---

## 4. Test Verification & Code Quality

1. **Security Unit Tests** (`packages/utils/tests/security.test.ts`):
   - Redaction of API keys, JWTs, and Bearer tokens.
   - API key masking preserving safe prefix and suffix.
   - CSV formula injection neutralization across all injection vectors.
   - Deep logging object scrub.
   - File path and credential redaction from error strings.
2. **LLM Privacy Audit Tests** (`packages/llm-client/tests/security-privacy-audit.test.ts`):
   - Assert prompt contains only aggregated metrics and zero raw transaction listings.
   - Assert client blocks requests if tainted with raw transaction objects.
   - Assert HTTP error responses redact API keys and bearer tokens.
3. **Full Validation**:
   - `bash scripts/validate.sh` confirms 100% pass rate across all workspace packages, unit tests, and Python ML tests.
