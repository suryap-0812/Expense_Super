/**
 * Financial Analysis State Store (Zustand)
 * Manages active ML/analytics inferences, async execution state, and engine interactions.
 */

import { create } from "zustand";
import type {
  FinancialAnalysisEngine,
  FinancialAnalysisInput,
  FinancialAnalysisResult,
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
}

export const useAnalysisStore = create<AnalysisStoreState>((set) => ({
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
}));
