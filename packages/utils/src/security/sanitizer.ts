/**
 * Security & Data Sanitization Utilities (Master Spec Section 87).
 * Provides robust redaction for API keys, bearer tokens, PII, CSV formula injection defense,
 * and safe serialization for logs and error messages.
 */

// Regex patterns for sensitive credentials & tokens
const API_KEY_PATTERNS = [
  /sk-or-v1-[a-zA-Z0-9]{32,}/g, // OpenRouter API keys
  /sk-[a-zA-Z0-9]{32,}/g, // Generic OpenAI / API keys
  /Bearer\s+([a-zA-Z0-9_\-.]+)/gi, // Authorization Bearer tokens
  /ghp_[a-zA-Z0-9]{36}/g, // GitHub PATs
  /eyJ[a-zA-Z0-9_\-.]+\.[a-zA-Z0-9_\-.]+\.[a-zA-Z0-9_\-.]+/g, // JWTs
];

// Sensitive object key names that must be scrubbed during log serialization
const SENSITIVE_KEY_NAMES = new Set([
  "apikey",
  "api_key",
  "apiKey",
  "secret",
  "token",
  "password",
  "authorization",
  "auth",
  "cardnumber",
  "cvv",
  "accountnumber",
]);

/**
 * Redacts known API keys, tokens, and authorization headers in a text string.
 */
export function redactSensitiveData(text: string): string {
  if (!text || typeof text !== "string") return "";

  let result = text;

  // Redact Bearer tokens specifically preserving "Bearer [REDACTED]"
  result = result.replace(/Bearer\s+([a-zA-Z0-9_\-.]+)/gi, "Bearer [REDACTED]");

  // Redact other token patterns
  for (const pattern of API_KEY_PATTERNS) {
    result = result.replace(pattern, "[REDACTED_API_KEY]");
  }

  return result;
}

/**
 * Safely masks an API key for UI display (e.g. "sk-or-v1-••••••••3829").
 */
export function maskApiKey(apiKey: string | null | undefined): string {
  if (!apiKey || typeof apiKey !== "string") return "";
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) return "••••••••";

  const prefix = trimmed.slice(0, Math.min(8, Math.floor(trimmed.length / 3)));
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

/**
 * Sanitizes a cell value for CSV export, guarding against CSV Formula Injection (CWE-1236).
 * Prepends a single quote if the value starts with '=', '+', '-', '@', '\t', '\r', or '%'.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);

  // If starts with dangerous spreadsheet formula characters, neutralize
  if (/^[=+\-@\t\r%]/.test(str)) {
    return `'${str}`;
  }

  return str;
}

/**
 * Deeply scrubs sensitive keys and values from an object before logging or serialization.
 */
export function sanitizeForLogging<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return redactSensitiveData(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForLogging(item)) as unknown as T;
  }

  if (typeof obj === "object") {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEY_NAMES.has(key.toLowerCase())) {
        sanitizedObj[key] = "[REDACTED]";
      } else {
        sanitizedObj[key] = sanitizeForLogging(value);
      }
    }
    return sanitizedObj as T;
  }

  return obj;
}
