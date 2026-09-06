/**
 * Phase 26: Financial Explanation Service Tests
 * Master Prompt Section 85 & Sections 35, 36, 37.
 */

import { describe, expect, it, vi } from "vitest";
import type { FinancialAnalysisResult } from "@expense-tracker/ml-contract";
import { FinancialExplanationService, OpenRouterClient } from "../src";

function createMockFinancialAnalysisResult(
  overrides: Partial<FinancialAnalysisResult> = {},
): FinancialAnalysisResult {
  return {
    schemaVersion: "1.0",
    period: "2026-05",
    generatedAt: "2026-05-31T23:59:59Z",
    dataQuality: {
      transactionCount: 28,
      activeDays: 22,
      coverageMonths: 3,
      sufficientData: true,
      dataQualityScore: 92,
      coldStart: false,
    },
    summary: {
      totalIncome: 120000,
      totalExpense: 75000,
      netSavings: 45000,
      savingsRate: 37.5,
      volatilityRating: "low",
      topSpendingCategory: "Food",
      spendingTrendDirection: "Decreasing",
    },
    persona: {
      archetype: "Disciplined High Saver",
      clusterId: 2,
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
        type: "savings_rate",
        category: "General",
        severity: "info",
        score: 0.92,
        title: "Solid Savings Margin",
        explanation: "Savings rate of 37.5% reflects disciplined cash accumulation.",
        evidence: {
          metricName: "savings_rate",
          observedValue: 37.5,
          baselineValue: 20.0,
          deltaPercentage: 87.5,
        },
      },
    ],
    structuredPayload: {
      schema_version: "1.0",
      period: "2026-05",
      generated_at: "2026-05-31T23:59:59Z",
      data_quality: {
        transaction_count: 28,
        active_days: 22,
        coverage_months: 3,
        sufficient_data: true,
        data_quality_score: 92,
      },
      summary: {
        total_income: 120000,
        total_expense: 75000,
        net_savings: 45000,
        savings_rate: 37.5,
        volatility_rating: "low",
        top_spending_category: "Food",
        spending_trend_direction: "Decreasing",
      },
      insights: [],
    },
    executionMetadata: {
      engineType: "onnx",
      durationMs: 12,
    },
    ...overrides,
  };
}

describe("Phase 26: Financial Explanation Service (Section 85)", () => {
  it("converts structured ML results into human-readable 4-facet findings", async () => {
    const service = new FinancialExplanationService();
    const analysis = createMockFinancialAnalysisResult();

    const result = await service.explain(analysis, {
      savingsGoalAmount: 40000,
      currencySymbol: "₹",
    });

    expect(result.summary).toContain("45,000");
    expect(result.summary).toContain("37.5%");
    expect(result.findings.length).toBeGreaterThan(0);

    for (const finding of result.findings) {
      // 1. What happened (Title)
      expect(finding.title).toBeDefined();
      expect(finding.title.length).toBeGreaterThan(3);

      // 2. Evidence (Numeric proof)
      expect(finding.evidence).toBeDefined();
      expect(finding.evidence.length).toBeGreaterThan(5);

      // 3. Why it matters (Explanation)
      expect(finding.explanation).toBeDefined();
      expect(finding.explanation.length).toBeGreaterThan(10);

      // 4. Possible action (Recommendation)
      expect(finding.recommendation).toBeDefined();
      expect(finding.recommendation.length).toBeGreaterThan(10);

      // Priority
      expect(["low", "medium", "high"]).toContain(finding.priority);
    }
  });

  it("handles cold-start datasets (<10 transactions) by acknowledging insufficient data without hallucinations", async () => {
    const service = new FinancialExplanationService();
    const coldStartAnalysis = createMockFinancialAnalysisResult({
      dataQuality: {
        transactionCount: 5,
        activeDays: 4,
        coverageMonths: 1,
        sufficientData: false,
        dataQualityScore: 25,
        coldStart: true,
        message: "Insufficient transaction history (5 < 10)",
      },
      persona: undefined,
      anomaly: undefined,
    });

    const result = await service.explain(coldStartAnalysis);

    expect(result.modelUsed).toBe("deterministic/cold-start-engine");
    expect(result.summary).toContain("initial setup period");
    expect(result.summary).toContain("5 transactions recorded");
    expect(result.findings[0]?.title).toBe("Initial Budget Tracking Phase");
    expect(result.findings[0]?.recommendation).toContain("Continue recording daily transactions");
  });

  it("transparently falls back to offline mock client when remote client throws", async () => {
    const failingClient = new OpenRouterClient({
      apiKey: "sk-or-test-key",
      fetchFn: vi.fn().mockRejectedValue(new Error("Network connection dropped")),
    });

    const service = new FinancialExplanationService(failingClient);
    const analysis = createMockFinancialAnalysisResult();

    const result = await service.explain(analysis, {
      fallbackToMockOnFailure: true,
    });

    expect(result.summary).toContain("offline fallback");
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings[0]?.recommendation).toBeDefined();
  });
});
