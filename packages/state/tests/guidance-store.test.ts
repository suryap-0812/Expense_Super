/**
 * Guidance Store State Management Tests (Section 74 & 85).
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { FinancialAnalysisResult } from "@expense-tracker/ml-contract";
import { MockLLMClient } from "@expense-tracker/llm-client";
import { useGuidanceStore } from "../src";

function createMockAnalysisResult(): FinancialAnalysisResult {
  return {
    schemaVersion: "1.0",
    period: "2026-05",
    generatedAt: "2026-05-31T23:59:59Z",
    dataQuality: {
      transactionCount: 30,
      activeDays: 25,
      coverageMonths: 3,
      sufficientData: true,
      dataQualityScore: 95,
      coldStart: false,
    },
    summary: {
      totalIncome: 100000,
      totalExpense: 60000,
      netSavings: 40000,
      savingsRate: 40.0,
      volatilityRating: "low",
      topSpendingCategory: "Food",
      spendingTrendDirection: "Decreasing",
    },
    persona: {
      archetype: "Disciplined High Saver",
      clusterId: 2,
      description: "Consistent savings with disciplined discretionary expenditures.",
      confidence: 0.95,
    },
    insights: [],
    structuredPayload: {
      schema_version: "1.0",
      period: "2026-05",
      generated_at: "2026-05-31T23:59:59Z",
      data_quality: {
        transaction_count: 30,
        active_days: 25,
        coverage_months: 3,
        sufficient_data: true,
        data_quality_score: 95,
      },
      summary: {
        total_income: 100000,
        total_expense: 60000,
        net_savings: 40000,
        savings_rate: 40.0,
        volatility_rating: "low",
        top_spending_category: "Food",
        spending_trend_direction: "Decreasing",
      },
      insights: [],
    },
    executionMetadata: {
      engineType: "onnx",
      durationMs: 15,
    },
  };
}

describe("Phase 26: GuidanceStore State Management", () => {
  beforeEach(() => {
    useGuidanceStore.getState().clearGuidance();
  });

  it("initializes with clean default state", () => {
    const state = useGuidanceStore.getState();
    expect(state.guidanceResult).toBeNull();
    expect(state.isGenerating).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastGeneratedAt).toBeNull();
    expect(state.getFindings()).toEqual([]);
    expect(state.getSummary()).toBeNull();
  });

  it("generates AI financial guidance and updates reactive store state", async () => {
    const analysis = createMockAnalysisResult();
    const client = new MockLLMClient();

    const promise = useGuidanceStore.getState().generateGuidance(analysis, client, {
      savingsGoalAmount: 30000,
      currencySymbol: "₹",
    });

    const result = await promise;

    expect(result).not.toBeNull();
    const state = useGuidanceStore.getState();
    expect(state.isGenerating).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastGeneratedAt).not.toBeNull();
    expect(state.guidanceResult).not.toBeNull();
    expect(state.activeModel).toBe("mock/deterministic-guidance-engine");
    expect(state.getFindings().length).toBeGreaterThan(0);
    expect(state.getSummary()).toContain("40,000");
  });

  it("resets state when clearGuidance() is called", async () => {
    const analysis = createMockAnalysisResult();
    await useGuidanceStore.getState().generateGuidance(analysis);

    expect(useGuidanceStore.getState().guidanceResult).not.toBeNull();

    useGuidanceStore.getState().clearGuidance();
    const state = useGuidanceStore.getState();
    expect(state.guidanceResult).toBeNull();
    expect(state.isGenerating).toBe(false);
    expect(state.error).toBeNull();
  });
});
