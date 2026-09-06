/**
 * Financial Analysis State Store (Zustand)
 * Manages active ML/analytics inferences, async execution state, and engine interactions.
 */

import { create } from "zustand";
import type { Transaction } from "@expense-tracker/domain";
import {
  generateFinancialAnalytics,
  generatePatternAnalysisReport,
  type FinancialAnalyticsReport,
  type FinancialPatternReport,
} from "@expense-tracker/analytics";
import type {
  FinancialAnalysisEngine,
  FinancialAnalysisInput,
  FinancialAnalysisResult,
  MLDeterministicSummary,
} from "@expense-tracker/ml-contract";

export interface AnalysisStoreState {
  analysisResult: FinancialAnalysisResult | null;
  isAnalyzing: boolean;
  error: string | null;
  lastAnalyzedAt: string | null;

  // Actions
  runAnalysis: (
    engine: FinancialAnalysisEngine,
    input: FinancialAnalysisInput,
  ) => Promise<FinancialAnalysisResult | null>;
  setAnalysisResult: (result: FinancialAnalysisResult) => void;
  clearAnalysis: () => void;

  // Authoritative Deterministic Selectors
  getSummary: (fallbackTransactions?: ReadonlyArray<Transaction>) => MLDeterministicSummary;
  getDeterministicReport: (transactions: ReadonlyArray<Transaction>) => FinancialAnalyticsReport;
  getPatternReport: (transactions: ReadonlyArray<Transaction>) => FinancialPatternReport;
}

export const useAnalysisStore = create<AnalysisStoreState>((set, get) => ({
  analysisResult: null,
  isAnalyzing: false,
  error: null,
  lastAnalyzedAt: null,

  runAnalysis: async (engine, input) => {
    set({ isAnalyzing: true, error: null });
    try {
      const result = await engine.analyze(input);
      set({
        analysisResult: result,
        isAnalyzing: false,
        error: null,
        lastAnalyzedAt: new Date().toISOString(),
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Financial analysis failed";
      set({
        isAnalyzing: false,
        error: errorMessage,
      });
      return null;
    }
  },

  setAnalysisResult: (analysisResult) =>
    set({
      analysisResult,
      lastAnalyzedAt: new Date().toISOString(),
      error: null,
    }),

  clearAnalysis: () =>
    set({
      analysisResult: null,
      isAnalyzing: false,
      error: null,
      lastAnalyzedAt: null,
    }),

  getSummary: (fallbackTransactions) => {
    const active = get().analysisResult;
    if (active) {
      return active.summary;
    }
    if (fallbackTransactions && fallbackTransactions.length > 0) {
      const report = generateFinancialAnalytics(fallbackTransactions);
      const cv = report.expenseVolatility.coefficientOfVariation;
      const volatilityRating: "low" | "moderate" | "high" =
        cv < 0.25 ? "low" : cv < 0.6 ? "moderate" : "high";

      return {
        totalIncome: report.totalIncome,
        totalExpense: report.totalExpense,
        netSavings: report.netSavings,
        savingsRate: report.savingsRate,
        volatilityRating,
        topSpendingCategory: report.categorySpending[0]?.category ?? null,
        spendingTrendDirection: report.spendingChange?.direction ?? null,
      };
    }
    return {
      totalIncome: 0,
      totalExpense: 0,
      netSavings: 0,
      savingsRate: 0,
      volatilityRating: "low",
      topSpendingCategory: null,
      spendingTrendDirection: null,
    };
  },

  getDeterministicReport: (transactions) => generateFinancialAnalytics(transactions),

  getPatternReport: (transactions) => generatePatternAnalysisReport(transactions),
}));
