import { describe, it, expect, vi } from "vitest";
import { OpenRouterClient, buildFinancialGuidanceUserPrompt, type LLMAnalysisInput } from "../src";

describe("LLM Security & Privacy Audit (Master Spec Section 87 & Sections 34-37)", () => {
  const sampleCleanInput: LLMAnalysisInput = {
    period: "2026-06",
    currencySymbol: "₹",
    summary: {
      totalIncome: 120000,
      totalExpense: 70000,
      netSavings: 50000,
      savingsRate: 41.7,
      volatilityRating: "low",
      topSpendingCategory: "Rent",
      spendingTrendDirection: "Decreasing",
    },
    persona: {
      archetype: "Balanced Optimizer",
      description: "Consistent savings with disciplined discretionary expenditures.",
      confidence: 0.94,
    },
    anomaly: {
      isAnomalous: false,
      anomalyScore: 0.08,
      severity: "low",
    },
    insights: [
      {
        id: "insight-1",
        title: "Strong Savings Momentum",
        severity: "low",
        category: "budget",
        explanation: "Savings rate exceeds baseline target by 16.7%.",
        evidence: {
          metricName: "savingsRate",
          observedValue: 41.7,
          baselineValue: 25.0,
          unit: "%",
        },
      },
    ],
  };

  it("verifies user prompt contains exclusively aggregated evidence and zero raw transaction lists", () => {
    const prompt = buildFinancialGuidanceUserPrompt(sampleCleanInput);

    // Assert aggregated metrics exist
    expect(prompt).toContain('"period": "2026-06"');
    expect(prompt).toContain('"total_income": "₹120,000"');
    expect(prompt).toContain('"total_expense": "₹70,000"');
    expect(prompt).toContain('"net_savings": "₹50,000"');
    expect(prompt).toContain('"savings_rate": "41.7%"');
    expect(prompt).toContain('"archetype": "Balanced Optimizer"');

    // Assert raw transaction artifacts do NOT exist in the prompt
    expect(prompt).not.toContain("rawTransactions");
    expect(prompt).not.toContain("transactionDate");
    expect(prompt).not.toContain("paymentMethod");
    expect(prompt).not.toContain("merchant");
    expect(prompt).not.toContain("Starbucks");
  });

  it("blocks and rejects outbound requests if raw transaction records are present", async () => {
    const mockFetch = vi.fn();
    const client = new OpenRouterClient({
      apiKey: "sk-or-v1-0123456789abcdef0123456789abcdef",
      fetchFn: mockFetch,
    });

    const taintedInput = {
      ...sampleCleanInput,
      rawTransactions: [
        {
          id: "tx-sensitive-99",
          amount: 2500,
          description: "Private Medical Clinic",
        },
      ],
    } as unknown as LLMAnalysisInput;

    await expect(client.generateExplanation(taintedInput)).rejects.toThrow(
      /Security assertion failed: Raw transaction records cannot be transmitted/i,
    );

    // Assert fetch was never called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("redacts API keys and sensitive tokens in error responses", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () =>
        "Server failed while verifying key sk-or-v1-secret12345678901234567890123456 with Bearer token_xyz",
    });

    const client = new OpenRouterClient({
      apiKey: "sk-or-v1-0123456789abcdef0123456789abcdef",
      fetchFn: mockFetch,
    });

    try {
      await client.generateExplanation(sampleCleanInput);
      expect.fail("Should have thrown error");
    } catch (err: unknown) {
      const errorMsg = (err as Error).message;
      expect(errorMsg).not.toContain("sk-or-v1-secret12345678901234567890123456");
      expect(errorMsg).not.toContain("token_xyz");
      expect(errorMsg).toContain("[REDACTED");
    }
  });
});
