/**
 * LLM Client Abstraction & OpenRouter Interface Types (Section 34, 35, 36, 37 & 84).
 */

import type { LLMFinding, InsightSeverity } from "@expense-tracker/schemas";
import type {
  MLDeterministicSummary,
  MLBehavioralPersona,
  StructuredMLInsight,
} from "@expense-tracker/ml-contract";

/**
 * Structured ML Evidence Input passed to the LLM Client for explanation.
 * Strictly decoupled from raw transactions (Section 35).
 */
export interface LLMAnalysisInput {
  period?: string;
  summary: MLDeterministicSummary;
  persona?: MLBehavioralPersona;
  anomaly?: {
    isAnomalous: boolean;
    anomalyScore: number;
    severity: InsightSeverity;
    topFeature?: string;
  };
  insights: StructuredMLInsight[];
  savingsGoalAmount?: number;
  currencySymbol?: string;
}

/**
 * Validated Structured LLM Explanation Output (Section 36).
 */
export interface LLMAnalysisResult {
  summary: string;
  findings: LLMFinding[];
  modelUsed: string;
  latencyMs: number;
  rawResponse?: unknown;
}

/**
 * Universal, replaceable LLM Client interface (Section 84).
 */
export interface LLMClient {
  generateExplanation(input: LLMAnalysisInput): Promise<LLMAnalysisResult>;
}

/**
 * Configuration options for OpenRouter LLM Client.
 */
export interface OpenRouterClientConfig {
  /**
   * User-supplied OpenRouter API Key (never hardcoded or committed, Section 34).
   */
  apiKey: string;

  /**
   * Model identifier (e.g. 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o-mini', 'meta-llama/llama-3.3-70b-instruct').
   * Default: 'anthropic/claude-3.5-sonnet'
   */
  model?: string;

  /**
   * OpenRouter API Base URL. Default: 'https://openrouter.ai/api/v1'
   */
  baseUrl?: string;

  /**
   * Application referer header for OpenRouter analytics ranking.
   */
  siteUrl?: string;

  /**
   * Application title header for OpenRouter analytics ranking.
   */
  siteName?: string;

  /**
   * Network request timeout in milliseconds. Default: 30000ms.
   */
  timeoutMs?: number;

  /**
   * Custom fetch function injection for testing or custom runtime transports.
   */
  fetchFn?: typeof fetch;
}

/**
 * Factory configuration for creating appropriate LLM Client instances.
 */
export interface LLMClientFactoryOptions {
  provider?: "openrouter" | "mock" | "custom";
  openRouterConfig?: Partial<OpenRouterClientConfig>;
  customClient?: LLMClient;
}
