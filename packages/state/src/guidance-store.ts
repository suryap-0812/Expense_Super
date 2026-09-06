/**
 * AI Guidance & LLM Explanation State Store (Zustand)
 * Manages reactive state for AI-generated financial explanations, findings, and generation workflows (Section 74 & 85).
 */

import { create } from "zustand";
import type { FinancialAnalysisResult } from "@expense-tracker/ml-contract";
import type { LLMFinding } from "@expense-tracker/schemas";
import {
  financialExplanationService,
  type LLMAnalysisResult,
  type LLMClient,
} from "@expense-tracker/llm-client";

export interface GuidanceStoreState {
  guidanceResult: LLMAnalysisResult | null;
  isGenerating: boolean;
  error: string | null;
  lastGeneratedAt: string | null;
  activeModel: string | null;

  // Actions
  generateGuidance: (
    analysisResult: FinancialAnalysisResult,
    client?: LLMClient,
    options?: {
      savingsGoalAmount?: number;
      currencySymbol?: string;
    },
  ) => Promise<LLMAnalysisResult | null>;

  setGuidanceResult: (result: LLMAnalysisResult) => void;
  clearGuidance: () => void;

  // Selectors
  getFindings: () => LLMFinding[];
  getSummary: () => string | null;
}

export const useGuidanceStore = create<GuidanceStoreState>((set, get) => ({
  guidanceResult: null,
  isGenerating: false,
  error: null,
  lastGeneratedAt: null,
  activeModel: null,

  generateGuidance: async (analysisResult, client, options = {}) => {
    set({ isGenerating: true, error: null });
    try {
      const result = await financialExplanationService.explain(analysisResult, {
        client,
        savingsGoalAmount: options.savingsGoalAmount,
        currencySymbol: options.currencySymbol,
        fallbackToMockOnFailure: true,
      });

      set({
        guidanceResult: result,
        isGenerating: false,
        error: null,
        lastGeneratedAt: new Date().toISOString(),
        activeModel: result.modelUsed,
      });

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate AI financial explanations";
      set({
        isGenerating: false,
        error: errorMessage,
      });
      return null;
    }
  },

  setGuidanceResult: (guidanceResult) =>
    set({
      guidanceResult,
      lastGeneratedAt: new Date().toISOString(),
      activeModel: guidanceResult.modelUsed,
      error: null,
    }),

  clearGuidance: () =>
    set({
      guidanceResult: null,
      isGenerating: false,
      error: null,
      lastGeneratedAt: null,
      activeModel: null,
    }),

  getFindings: () => get().guidanceResult?.findings ?? [],
  getSummary: () => get().guidanceResult?.summary ?? null,
}));
