/**
 * Security & Privacy Payload Guard (Master Spec Section 87, 34 & 35).
 * Strictly guarantees that raw transactions are NEVER transmitted in external network requests
 * or LLM payloads, and strips sensitive filesystem paths / credentials from errors.
 */

import { redactSensitiveData } from "./sanitizer";

// Transaction-specific keys that must NEVER appear in outbound LLM payloads
const FORBIDDEN_TRANSACTION_KEYS = new Set([
  "rawtransactions",
  "transactions",
  "transactionid",
  "txid",
  "merchant",
  "notes",
  "paymentmethod",
  "accountnumber",
  "cardnumber",
]);

export interface PayloadInspectionResult {
  isClean: boolean;
  violations: string[];
}

/**
 * Inspects a payload to assert that NO individual raw transaction objects or sensitive
 * transaction identifiers are present.
 */
export function assertNoRawTransactions(
  payload: unknown,
  path: string = "root",
): PayloadInspectionResult {
  const violations: string[] = [];

  function inspect(node: unknown, currentPath: string) {
    if (node === null || node === undefined || typeof node !== "object") {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item, idx) => inspect(item, `${currentPath}[${idx}]`));
      return;
    }

    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();

      // Check if forbidden key exists with non-empty contents
      if (FORBIDDEN_TRANSACTION_KEYS.has(lowerKey)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value) && value.length > 0) {
            violations.push(
              `Forbidden raw transaction array '${key}' with ${value.length} items found at ${currentPath}`,
            );
          } else if (!Array.isArray(value)) {
            violations.push(
              `Forbidden transaction-level property '${key}' found at ${currentPath}`,
            );
          }
        }
      }

      inspect(value, `${currentPath}.${key}`);
    }
  }

  inspect(payload, path);

  return {
    isClean: violations.length === 0,
    violations,
  };
}

/**
 * Sanitizes an error message by stripping filesystem paths, SQL database paths, and API keys.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!error) return "An unknown error occurred.";

  let message = error instanceof Error ? error.message : String(error);

  // Redact API keys / tokens
  message = redactSensitiveData(message);

  // Redact local absolute file paths (e.g. /home/user/... or C:\Users\...)
  message = message.replace(/(?:\/[a-zA-Z0-9_.-]+){3,}/g, "[FILE_PATH]");
  message = message.replace(/(?:[a-zA-Z]:\\[a-zA-Z0-9_.-]+){2,}/g, "[FILE_PATH]");

  return message;
}
