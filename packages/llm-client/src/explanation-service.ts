/**
 * Financial Explanation Service (Section 85 - Phase 26).
 * Converts structured ML results and deterministic evidence into rich, grounded, human-readable explanations.
 *
 * Specifically explains for every finding:
 * 1. What happened (Title & Finding Headline)
 * 2. Why it matters (Explanation & Impact Context)
 * 3. Evidence (Observed Metrics, Baselines, & Delta Percentages)
 * 4. Possible action (Concrete, Actionable Recommendations)
 *
 * Strictly prohibits recalculating financial totals (Section 33 & 37).
 */

import type { FinancialAnalysisResult } from "@expense-tracker/ml-contract";
import { MockLLMClient } from "./mock-client";
import type { LLMAnalysisInput, LLMAnalysisResult, LLMClient } from "./types";

export interface ExplanationServiceOptions {
  /** Active LLM Client instance (OpenRouter, Mock, Custom) */
  client?: LLMClient;
  /** Active savings goal target amount */
  savingsGoalAmount?: number;
  /** Active currency symbol (default: '₹') */
  currencySymbol?: string;
  /** Automatically fall back to deterministic mock if remote client fails (default: true) */
  fallbackToMockOnFailure?: boolean;
}

/**
 * Service orchestrating structured ML results to human-readable LLM guidance.
 */
export class FinancialExplanationService {
  private readonly defaultClient: LLMClient;

  constructor(defaultClient?: LLMClient) {
    this.defaultClient = defaultClient ?? new MockLLMClient();
  }

  /**
   * Converts a FinancialAnalysisResult into grounded explanations.
   */
  public async explain(
    analysisResult: FinancialAnalysisResult,
    options: ExplanationServiceOptions = {},
  ): Promise<LLMAnalysisResult> {
    const client = options.client ?? this.defaultClient;
    const currency = options.currencySymbol ?? "₹";
    const fallbackToMock = options.fallbackToMockOnFailure ?? true;

    // 1. Handle Cold-Start / Insufficient History gracefully (Section 32 & 37)
    if (analysisResult.dataQuality.coldStart) {
      const netSavings = analysisResult.summary.netSavings;
      const totalExpense = analysisResult.summary.totalExpense;
      const totalIncome = analysisResult.summary.totalIncome;

      return {
        summary: `Your account is currently in the initial setup period (${analysisResult.dataQuality.transactionCount} transactions recorded). Basic cash flow metrics are available below, but behavioral patterns and machine learning insights require at least 10 transactions.`,
        findings: [
          {
            title: "Initial Budget Tracking Phase",
            evidence: `${analysisResult.dataQuality.transactionCount} transactions recorded across ${analysisResult.dataQuality.coverageMonths} month(s). Total income: ${currency}${totalIncome.toLocaleString()}, total expense: ${currency}${totalExpense.toLocaleString()}, net balance: ${currency}${netSavings.toLocaleString()}.`,
            explanation:
              "Machine learning algorithms need sufficient transaction frequency to accurately identify seasonal habits, recurring bills, and anomaly thresholds without false positives.",
            recommendation:
              "Continue recording daily transactions and recurring income to unlock personalized persona profiling and anomaly detection.",
            priority: "low",
          },
        ],
        modelUsed: "deterministic/cold-start-engine",
        latencyMs: 1,
      };
    }

    // 2. Format Structured ML Input for LLM Client (Section 35)
    const input: LLMAnalysisInput = {
      period: analysisResult.period,
      currencySymbol: currency,
      summary: analysisResult.summary,
      persona: analysisResult.persona,
      anomaly: analysisResult.anomaly
        ? {
            isAnomalous: analysisResult.anomaly.isAnomalous,
            anomalyScore: analysisResult.anomaly.anomalyScore,
            severity: analysisResult.anomaly.severity,
            topFeature: analysisResult.anomaly.topFeature,
          }
        : undefined,
      insights: analysisResult.insights,
      savingsGoalAmount: options.savingsGoalAmount,
    };

    // 3. Generate Explanation via LLM Client (with fallback resilience)
    try {
      return await client.generateExplanation(input);
    } catch (err) {
      if (fallbackToMock && !(client instanceof MockLLMClient)) {
        const fallbackClient = new MockLLMClient();
        const fallbackResult = await fallbackClient.generateExplanation(input);
        return {
          ...fallbackResult,
          summary: `${fallbackResult.summary} (Generated via offline fallback due to provider unavailability).`,
        };
      }
      throw err;
    }
  }
}

/**
 * Singleton instance of FinancialExplanationService
 */
export const financialExplanationService = new FinancialExplanationService();
