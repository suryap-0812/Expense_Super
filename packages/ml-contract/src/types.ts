/**
 * Structured ML Contract Types
 * Defines versioned data structures for ML inference inputs, data quality checks,
 * evidence-backed structured insights, behavioral personas, final output payloads,
 * and the application-facing FinancialAnalysisEngine contract (Section 29, 32, 69 & 73).
 */

import type { Transaction } from "@expense-tracker/domain";
import type { InsightSeverity } from "@expense-tracker/schemas";

export interface MLDataQualityMetrics {
  transactionCount: number;
  activeDays: number;
  coverageMonths: number;
  sufficientData: boolean;
  dataQualityScore: number; // 0 to 100
}

export interface MLInsightEvidence {
  metricName: string;
  observedValue: number | string;
  baselineValue?: number | string;
  unit?: string;
  deltaPercentage?: number;
  zScore?: number;
  sampleSize?: number;
}

export interface StructuredMLInsight {
  type: string;
  category?: string;
  value?: number;
  amount?: number;
  unit?: string;
  severity: InsightSeverity;
  score?: number; // Normalized continuous score [0, 1]
  title: string;
  explanation: string;
  evidence: MLInsightEvidence;
}

export interface MLBehavioralPersona {
  archetype: string;
  clusterId?: number;
  description: string;
  confidence: number;
}

export interface MLDeterministicSummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number | null;
  volatilityRating: string;
  topSpendingCategory: string | null;
  spendingTrendDirection: string | null;
}

export interface StructuredMLOutputPayload {
  schema_version: string;
  period: string;
  generated_at: string;
  data_quality: {
    transaction_count: number;
    active_days: number;
    coverage_months: number;
    sufficient_data: boolean;
    data_quality_score: number;
  };
  summary: {
    total_income: number;
    total_expense: number;
    net_savings: number;
    savings_rate: number | null;
    volatility_rating: string;
    top_spending_category: string | null;
    spending_trend_direction: string | null;
  };
  persona?: {
    archetype: string;
    cluster_id?: number;
    description: string;
    confidence: number;
  };
  insights: Array<{
    type: string;
    category?: string;
    value?: number;
    amount?: number;
    unit?: string;
    severity: InsightSeverity;
    score?: number;
    title: string;
    explanation: string;
    evidence: {
      metric_name: string;
      observed_value: number | string;
      baseline_value?: number | string;
      unit?: string;
      delta_percentage?: number;
      z_score?: number;
      sample_size?: number;
    };
  }>;
}

/**
 * Application-Facing Analysis Engine Contract (Section 73)
 */
export interface FinancialAnalysisInput {
  transactions: ReadonlyArray<Transaction>;
  period?: string;
  savingsGoalAmount?: number;
  monthlyIncomes?: Record<string, number>;
  options?: {
    disableML?: boolean;
    anomalyThreshold?: number;
  };
}

export interface FinancialAnalysisResult {
  schemaVersion: string;
  period: string;
  generatedAt: string;
  dataQuality: MLDataQualityMetrics & {
    coldStart: boolean;
    message?: string;
  };
  summary: MLDeterministicSummary;
  persona?: MLBehavioralPersona;
  anomaly?: {
    isAnomalous: boolean;
    anomalyScore: number;
    severity: InsightSeverity;
    topFeature?: string;
  };
  insights: StructuredMLInsight[];
  structuredPayload: StructuredMLOutputPayload;
  executionMetadata: {
    engineType: "onnx" | "rule_based" | "hybrid";
    durationMs: number;
  };
}

export interface ONNXInferenceSessionProvider {
  runAnomalyInference(featureVector: Float32Array): Promise<{ label: number; score: number }>;
  runClusteringInference(
    featureVector: Float32Array,
  ): Promise<{ label: number; distances: Float32Array }>;
}

export interface FinancialAnalysisEngine {
  analyze(input: FinancialAnalysisInput): Promise<FinancialAnalysisResult>;
}
