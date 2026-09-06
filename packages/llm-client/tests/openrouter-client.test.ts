/**
 * Phase 25: OpenRouter LLM Client Abstraction & Interface Tests
 * Master Prompt Section 84 & Sections 34, 35, 36, 37.
 */

import { describe, expect, it, vi } from "vitest";
import type { LLMAnalysisInput } from "../src";
import { createLLMClient, MockLLMClient, OpenRouterClient } from "../src";

function createMockAnalysisInput(): LLMAnalysisInput {
  return {
    period: "2026-05",
    currencySymbol: "₹",
    summary: {
      totalIncome: 100000,
      totalExpense: 65000,
      netSavings: 35000,
      savingsRate: 35.0,
      volatilityRating: "moderate",
      topSpendingCategory: "Food",
      spendingTrendDirection: "Decreasing",
    },
    persona: {
      archetype: "Disciplined High Saver",
      description: "Consistent savings with disciplined discretionary expenditures.",
      confidence: 0.95,
    },
    anomaly: {
      isAnomalous: false,
      anomalyScore: 0.12,
      severity: "low",
    },
    insights: [
      {
        type: "savings_rate",
        category: "General",
        severity: "info",
        score: 0.95,
        title: "Above Average Savings Rate",
        explanation: "Your savings rate of 35.0% exceeds the recommended 20% baseline.",
        evidence: {
          metricName: "savings_rate",
          observedValue: 35.0,
          baselineValue: 20.0,
          deltaPercentage: 75.0,
        },
      },
      {
        type: "category_dominance",
        category: "Food",
        severity: "medium",
        score: 0.45,
        title: "Food & Dining Concentration",
        explanation: "Food represents 42.0% of all monthly outlays.",
        evidence: {
          metricName: "food_ratio",
          observedValue: 42.0,
          baselineValue: 25.0,
          deltaPercentage: 68.0,
        },
      },
    ],
    savingsGoalAmount: 30000,
  };
}

describe("Phase 25: OpenRouter LLM Client & Abstraction", () => {
  describe("OpenRouterClient Construction & Validation", () => {
    it("throws an error if no API key is provided", () => {
      expect(() => new OpenRouterClient({ apiKey: "" })).toThrow("OpenRouter API key is required");
      expect(() => new OpenRouterClient({ apiKey: "   " })).toThrow(
        "OpenRouter API key is required",
      );
    });

    it("initializes cleanly with valid API key and custom parameters", () => {
      const client = new OpenRouterClient({
        apiKey: "sk-or-v1-mock-key-12345",
        model: "openai/gpt-4o-mini",
        siteUrl: "https://my-expense-app.com",
        siteName: "My Custom Tracker",
      });
      expect(client).toBeInstanceOf(OpenRouterClient);
    });
  });

  describe("OpenRouterClient.generateExplanation", () => {
    it("successfully sends formatted structured prompt and parses validated JSON response", async () => {
      const mockResponseBody = {
        id: "gen-12345",
        model: "anthropic/claude-3.5-sonnet",
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary:
                  "Strong financial performance for May 2026 with a healthy 35.0% savings rate (₹35,000 saved).",
                findings: [
                  {
                    title: "Excellent Savings Discipline",
                    evidence: "Observed savings rate of 35.0% exceeds the 20% baseline by 75.0%.",
                    explanation:
                      "Maintaining this surplus ensures your active ₹30,000 monthly target is comfortably met.",
                    recommendation: "Allocate the ₹35,000 surplus to your high-priority goals.",
                    priority: "low",
                  },
                  {
                    title: "High Food & Dining Outlay",
                    evidence:
                      "Food expenditures account for 42.0% of total expenses (68.0% above baseline).",
                    explanation:
                      "While your overall budget is in surplus, food spending is your largest single expense driver.",
                    recommendation:
                      "Monitor dining out expenses over the next 2 weeks to prevent discretionary creep.",
                    priority: "medium",
                  },
                ],
              }),
            },
          },
        ],
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponseBody,
      });

      const client = new OpenRouterClient({
        apiKey: "sk-or-v1-test-key",
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const input = createMockAnalysisInput();
      const result = await client.generateExplanation(input);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, requestInit] = mockFetch.mock.calls[0] as [string, RequestInit];

      expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
      expect(requestInit.method).toBe("POST");

      const headers = requestInit.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer sk-or-v1-test-key");
      expect(headers["Content-Type"]).toBe("application/json");

      const body = JSON.parse(requestInit.body as string);
      expect(body.model).toBe("anthropic/claude-3.5-sonnet");
      expect(body.temperature).toBe(0.2);
      expect(body.messages.length).toBe(2);

      // Verify privacy: no raw transaction notes or IDs passed
      expect(requestInit.body).not.toContain("raw_transactions");
      expect(requestInit.body).not.toContain("credit_card_number");

      // Verify validated output result
      expect(result.summary).toContain("Strong financial performance");
      expect(result.findings.length).toBe(2);
      expect(result.findings[0]?.priority).toBe("low");
      expect(result.findings[1]?.priority).toBe("medium");
      expect(result.modelUsed).toBe("anthropic/claude-3.5-sonnet");
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("handles markdown code-fenced JSON responses seamlessly", async () => {
      const fencedContent = `\`\`\`json
{
  "summary": "Solid month with steady surplus.",
  "findings": [
    {
      "title": "Healthy Cash Flow",
      "evidence": "Net savings of ₹35,000.",
      "explanation": "Outflows remain lower than inflows.",
      "recommendation": "Keep up the consistent habits.",
      "priority": "low"
    }
  ]
}
\`\`\``;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: fencedContent } }],
        }),
      });

      const client = new OpenRouterClient({
        apiKey: "sk-or-v1-test-key",
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const result = await client.generateExplanation(createMockAnalysisInput());
      expect(result.summary).toBe("Solid month with steady surplus.");
      expect(result.findings.length).toBe(1);
    });

    it("handles 401 Unauthorized API error with descriptive guidance", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => JSON.stringify({ error: { message: "Invalid API key" } }),
      });

      const client = new OpenRouterClient({
        apiKey: "sk-or-v1-invalid-key",
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(client.generateExplanation(createMockAnalysisInput())).rejects.toThrow(
        "OpenRouter authentication failed: Invalid API key",
      );
    });

    it("handles 402 Depleted Balance error with clear message", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 402,
        statusText: "Payment Required",
        text: async () => JSON.stringify({ error: { message: "Insufficient credits" } }),
      });

      const client = new OpenRouterClient({
        apiKey: "sk-or-v1-key",
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(client.generateExplanation(createMockAnalysisInput())).rejects.toThrow(
        "OpenRouter credit balance depleted",
      );
    });

    it("handles 429 Rate Limit error gracefully", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: async () => JSON.stringify({ error: { message: "Rate limit exceeded" } }),
      });

      const client = new OpenRouterClient({
        apiKey: "sk-or-v1-key",
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(client.generateExplanation(createMockAnalysisInput())).rejects.toThrow(
        "OpenRouter rate limit reached",
      );
    });

    it("rejects malformed LLM outputs that fail Zod schema validation (Section 36)", async () => {
      const invalidJsonContent = JSON.stringify({
        summary: "Missing findings array",
        // 'findings' field is omitted
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: invalidJsonContent } }],
        }),
      });

      const client = new OpenRouterClient({
        apiKey: "sk-or-v1-key",
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(client.generateExplanation(createMockAnalysisInput())).rejects.toThrow(
        "Invalid LLM response format",
      );
    });
  });

  describe("Replaceable LLMClient Abstraction & Mock Implementation (Section 84)", () => {
    it("operates seamlessly with MockLLMClient offline without network access", async () => {
      const mockClient = new MockLLMClient();
      const input = createMockAnalysisInput();

      const result = await mockClient.generateExplanation(input);

      expect(result.summary).toBeDefined();
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.modelUsed).toBe("mock/deterministic-guidance-engine");
      expect(result.findings[0]?.priority).toBeDefined();
      expect(result.findings[0]?.recommendation).toBeDefined();
    });

    it("creates appropriate client through createLLMClient factory", () => {
      const openRouterInstance = createLLMClient({
        provider: "openrouter",
        openRouterConfig: { apiKey: "sk-or-v1-valid" },
      });
      expect(openRouterInstance).toBeInstanceOf(OpenRouterClient);

      const mockInstance = createLLMClient({ provider: "mock" });
      expect(mockInstance).toBeInstanceOf(MockLLMClient);

      const fallbackMock = createLLMClient({ provider: "openrouter", openRouterConfig: {} });
      expect(fallbackMock).toBeInstanceOf(MockLLMClient);
    });
  });
});
