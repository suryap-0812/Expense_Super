import { describe, it, expect } from "vitest";
import {
  redactSensitiveData,
  maskApiKey,
  sanitizeCsvCell,
  sanitizeForLogging,
  assertNoRawTransactions,
  sanitizeErrorMessage,
} from "../src";

describe("Security & Privacy Utilities (Master Spec Section 87)", () => {
  describe("redactSensitiveData", () => {
    it("redacts OpenRouter API keys", () => {
      const text = "Error making request with key sk-or-v1-abcdef0123456789abcdef0123456789 to API";
      const redacted = redactSensitiveData(text);
      expect(redacted).not.toContain("sk-or-v1-abcdef0123456789abcdef0123456789");
      expect(redacted).toContain("[REDACTED_API_KEY]");
    });

    it("redacts Authorization Bearer tokens", () => {
      const header = "Authorization: Bearer secret_jwt_token_12345.xyz.789";
      const redacted = redactSensitiveData(header);
      expect(redacted).not.toContain("secret_jwt_token_12345.xyz.789");
      expect(redacted).toBe("Authorization: Bearer [REDACTED]");
    });

    it("handles empty or non-string inputs safely", () => {
      expect(redactSensitiveData("")).toBe("");
      expect(redactSensitiveData(null as unknown as string)).toBe("");
    });
  });

  describe("maskApiKey", () => {
    it("masks OpenRouter API key preserving safe prefix and suffix", () => {
      const key = "sk-or-v1-0123456789abcdef0123456789abcdef";
      const masked = maskApiKey(key);
      expect(masked).toBe("sk-or-v1••••••••cdef");
      expect(masked).not.toContain("0123456789abcdef0123456789ab");
    });

    it("returns placeholders for short or empty keys", () => {
      expect(maskApiKey("short")).toBe("••••••••");
      expect(maskApiKey(null)).toBe("");
    });
  });

  describe("sanitizeCsvCell (CSV Formula Injection Defense)", () => {
    it("neutralizes dangerous formula characters by prepending single quote", () => {
      expect(sanitizeCsvCell("=CMD|' /C calc'!A0")).toBe("'=CMD|' /C calc'!A0");
      expect(sanitizeCsvCell("+1+2")).toBe("'+1+2");
      expect(sanitizeCsvCell("-500")).toBe("'-500");
      expect(sanitizeCsvCell("@SUM(A1:A10)")).toBe("'@SUM(A1:A10)");
      expect(sanitizeCsvCell("\tmalicious")).toBe("'\tmalicious");
      expect(sanitizeCsvCell("\rmalicious")).toBe("'\rmalicious");
      expect(sanitizeCsvCell("%malicious")).toBe("'%malicious");
    });

    it("leaves safe text and numbers intact", () => {
      expect(sanitizeCsvCell("Groceries")).toBe("Groceries");
      expect(sanitizeCsvCell(12500)).toBe("12500");
      expect(sanitizeCsvCell(null)).toBe("");
    });
  });

  describe("sanitizeForLogging", () => {
    it("deeply scrubs sensitive property keys from logging objects", () => {
      const payload = {
        userId: "user-123",
        apiKey: "sk-or-v1-supersecretkey12345678901234567890",
        nested: {
          token: "bearer-token-123",
          category: "Dining",
          auth: {
            password: "superpassword",
          },
        },
      };

      const sanitized = sanitizeForLogging(payload);
      expect(sanitized.apiKey).toBe("[REDACTED]");
      expect(sanitized.nested.token).toBe("[REDACTED]");
      expect(sanitized.nested.auth).toBe("[REDACTED]");
      expect(sanitized.nested.category).toBe("Dining");
      expect(sanitized.userId).toBe("user-123");
    });
  });

  describe("assertNoRawTransactions", () => {
    it("passes for aggregated structured evidence metrics", () => {
      const validEvidence = {
        summary: {
          totalIncome: 100000,
          totalExpense: 60000,
          netSavings: 40000,
          savingsRate: 40,
        },
        persona: {
          archetype: "Balanced Optimizer",
        },
        insights: [
          {
            title: "Elevated Dining Outflow",
            evidence: "Observed: ₹14,000 | Baseline: ₹8,000",
          },
        ],
      };

      const result = assertNoRawTransactions(validEvidence);
      expect(result.isClean).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("catches and flags raw transaction records or sensitive identifiers", () => {
      const taintedPayload = {
        summary: { totalIncome: 100000 },
        rawTransactions: [
          {
            id: "tx-1",
            amount: 500,
            merchant: "Starbucks Coffee",
            notes: "Meeting with client",
          },
        ],
      };

      const result = assertNoRawTransactions(taintedPayload);
      expect(result.isClean).toBe(false);
      expect(result.violations.some((v) => v.includes("rawTransactions"))).toBe(true);
    });
  });

  describe("sanitizeErrorMessage", () => {
    it("redacts file paths and API keys from error messages", () => {
      const error = new Error(
        "Failed to read file at /home/surya/Project_dir/Expense_super/data.sqlite with key sk-or-v1-secret12345678901234567890123456",
      );
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).not.toContain("/home/surya/Project_dir/Expense_super/data.sqlite");
      expect(sanitized).not.toContain("sk-or-v1-secret12345678901234567890123456");
      expect(sanitized).toContain("[FILE_PATH]");
      expect(sanitized).toContain("[REDACTED_API_KEY]");
    });
  });
});
