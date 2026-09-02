/**
 * AI Insight Domain Entity
 * Represents local statistical/ML detections and LLM explanations.
 */

export type InsightType =
  "anomaly" | "trend" | "saving_opportunity" | "budget_alert" | "behavioral_pattern";

export type InsightSeverity = "info" | "low" | "medium" | "high" | "critical";

export interface AIInsight {
  id: string;
  generatedAt: string;
  /** Period identifier e.g. "2026-05", "30d", or ISO range */
  period: string;
  insightType: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  /** Structured, non-sensitive mathematical evidence produced by local ML/analytics */
  mlResult?: Record<string, unknown>;
  /** Human-readable explanation and guidance from LLM */
  llmExplanation?: string;
  /** Concrete, actionable steps recommended */
  actionableSteps?: string[];
  dismissed: boolean;
  createdAt: string;
}

export interface CreateAIInsightInput {
  period: string;
  insightType: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  mlResult?: Record<string, unknown>;
  llmExplanation?: string;
  actionableSteps?: string[];
}
