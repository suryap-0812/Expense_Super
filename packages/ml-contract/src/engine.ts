/**
 * Application-Facing Financial Analysis Engine & Inference Orchestrator
 * Implements Section 73 (Phase 14) and Section 32 (Cold Start) of the Master Specification.
 * Provides unified, decoupled analysis hiding internal ML, ONNX, and statistical heuristics.
 */

import type { Transaction } from "@expense-tracker/domain";
import {
  generateFinancialAnalytics,
  generatePatternAnalysisReport,
} from "@expense-tracker/analytics";
import {
  generateStructuredMLOutput,
  type AnomalyInferenceContext,
  type ClusterInferenceContext,
} from "./generator";
import type {
  FinancialAnalysisEngine,
  FinancialAnalysisInput,
  FinancialAnalysisResult,
  ONNXInferenceSessionProvider,
  StructuredMLInsight,
} from "./types";

/**
 * Manifest Normalization Constants for K-Means Clustering
 * (Certified in Phase 12 & 13)
 */
export const CLUSTERING_SCALER = {
  mean: [16.051, 0.1986, 32.0461, 0.2404, 0.1682, 0.3741, 53334.006, 43955.1574] as const,
  scale: [20.3425, 0.1319, 6.0541, 0.0746, 0.0883, 0.1028, 8192.4138, 9288.9094] as const,
};

/**
 * Persona Cluster Archetypes (Certified in Phase 9 & 12)
 */
export const PERSONA_ARCHETYPES: Record<number, { archetype: string; description: string }> = {
  0: {
    archetype: "Disciplined High Saver",
    description:
      "Maintains strong savings discipline, high savings rate, and low discretionary leakage.",
  },
  1: {
    archetype: "Food & Dining Heavy",
    description: "High food and dining expenditure proportion with frequent culinary transactions.",
  },
  2: {
    archetype: "Discretionary Overspender",
    description:
      "Substantial discretionary spend in shopping and entertainment exceeding savings targets.",
  },
  3: {
    archetype: "Weekend Lifestyle Spender",
    description:
      "Significant spending concentration occurring on Friday, Saturday, and Sunday outings.",
  },
  4: {
    archetype: "Irregular Volatile Budgeter",
    description: "High month-over-month expenditure volatility with unpredictable cash outflows.",
  },
  5: {
    archetype: "Balanced Everyday Consumer",
    description:
      "Predictable, moderate spending distributed evenly across essential living categories.",
  },
};

/**
 * Extracts 14-dimensional behavioral feature vector for IsolationForest ONNX model.
 */
export function extractAnomalyFeatures(transactions: ReadonlyArray<Transaction>): Float32Array {
  const analytics = generateFinancialAnalytics(transactions);
  const patterns = generatePatternAnalysisReport(transactions);

  const totalExpense = Math.max(analytics.totalExpense, 1);
  const getCatRatio = (cat: string) => {
    const item = analytics.categorySpending.find(
      (c) => c.category.toLowerCase() === cat.toLowerCase(),
    );
    return item ? item.amount / totalExpense : 0;
  };

  const foodRatio = getCatRatio("food");
  const shoppingRatio = getCatRatio("shopping");
  const transportRatio = getCatRatio("transport");
  const billsRatio = getCatRatio("bills") + getCatRatio("utilities");
  const discretionaryRatio =
    getCatRatio("shopping") +
    getCatRatio("entertainment") +
    getCatRatio("dining") +
    getCatRatio("travel");

  const incomeVolatility = analytics.incomeVolatility.coefficientOfVariation;
  const avgMonthlyExpense = analytics.expenseVolatility.mean;
  const avgMonthlyIncome = analytics.incomeVolatility.mean;

  const maxTxnAmount = transactions.reduce(
    (max, tx) => (tx.type === "expense" ? Math.max(max, tx.amount) : max),
    0,
  );
  const largestTxnRatio = totalExpense > 0 ? maxTxnAmount / totalExpense : 0;

  // Shannon entropy of category spending
  let entropy = 0;
  for (const cat of analytics.categorySpending) {
    if (cat.percentage > 0) {
      const p = cat.percentage / 100;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
  }

  const numMonths = Math.max(analytics.monthlySpending.length, 1);
  const monthlyTxnCount = patterns.transactionFrequency.totalTransactions / numMonths;

  const safeVal = (v: number | undefined | null): number =>
    v !== undefined && v !== null && Number.isFinite(v) ? v : 0;

  const features = new Float32Array(14);
  features[0] = safeVal(analytics.savingsRate); // savings_rate
  features[1] = safeVal(patterns.spendingVolatility.coefficientOfVariation); // expense_volatility
  features[2] = safeVal(incomeVolatility); // income_volatility
  features[3] = safeVal(avgMonthlyExpense); // average_monthly_expense
  features[4] = safeVal(avgMonthlyIncome); // average_monthly_income
  features[5] = safeVal(foodRatio); // food_ratio
  features[6] = safeVal(shoppingRatio); // shopping_ratio
  features[7] = safeVal(transportRatio); // transport_ratio
  features[8] = safeVal(billsRatio); // bills_ratio
  features[9] = safeVal(discretionaryRatio); // discretionary_ratio
  features[10] = safeVal(patterns.weekendBehavior.weekendSpendingRatio); // weekend_spending_ratio
  features[11] = safeVal(largestTxnRatio); // largest_transaction_ratio
  features[12] = safeVal(monthlyTxnCount); // transaction_frequency
  features[13] = safeVal(entropy); // category_spending_entropy

  return features;
}

/**
 * Extracts and standardizes 8-dimensional feature vector for KMeans Clustering ONNX model.
 */
export function extractClusteringFeatures(transactions: ReadonlyArray<Transaction>): Float32Array {
  const analytics = generateFinancialAnalytics(transactions);
  const patterns = generatePatternAnalysisReport(transactions);

  const totalExpense = Math.max(analytics.totalExpense, 1);
  const getCatRatio = (cat: string) => {
    const item = analytics.categorySpending.find(
      (c) => c.category.toLowerCase() === cat.toLowerCase(),
    );
    return item ? item.amount / totalExpense : 0;
  };

  const numMonths = Math.max(analytics.monthlySpending.length, 1);
  const monthlyTxnCount = patterns.transactionFrequency.totalTransactions / numMonths;

  const safeVal = (v: number | undefined | null): number =>
    v !== undefined && v !== null && Number.isFinite(v) ? v : 0;

  const raw = [
    safeVal(analytics.savingsRate), // savings_rate
    safeVal(patterns.spendingVolatility.coefficientOfVariation), // expense_volatility
    safeVal(monthlyTxnCount), // transaction_frequency
    safeVal(getCatRatio("food")), // food_ratio
    safeVal(getCatRatio("shopping")), // shopping_ratio
    safeVal(patterns.weekendBehavior.weekendSpendingRatio), // weekend_spending_ratio
    safeVal(analytics.incomeVolatility.mean), // average_monthly_income
    safeVal(analytics.expenseVolatility.mean), // average_monthly_expense
  ];

  // Apply StandardScaler normalization: (x - mean) / scale
  const scaled = new Float32Array(8);
  for (let i = 0; i < 8; i++) {
    const mean = CLUSTERING_SCALER.mean[i] ?? 0;
    const scale = CLUSTERING_SCALER.scale[i] ?? 1;
    const val = (raw[i]! - mean) / scale;
    scaled[i] = Number.isFinite(val) ? val : 0;
  }

  return scaled;
}

/**
 * Rule-based fallback persona classifier (when ONNX runtime is unavailable or cold-start)
 */
export function deriveRuleBasedPersona(
  transactions: ReadonlyArray<Transaction>,
): ClusterInferenceContext {
  const analytics = generateFinancialAnalytics(transactions);
  const patterns = generatePatternAnalysisReport(transactions);
  const savingsRate = analytics.savingsRate ?? 0;
  const weekendRatio = patterns.weekendBehavior.weekendSpendingRatio;

  if (savingsRate >= 30) {
    return { cluster_id: 0, ...PERSONA_ARCHETYPES[0]!, confidence: 0.85 };
  }
  if (weekendRatio >= 0.5) {
    return { cluster_id: 3, ...PERSONA_ARCHETYPES[3]!, confidence: 0.8 };
  }
  if (patterns.spendingVolatility.rating === "volatile") {
    return { cluster_id: 4, ...PERSONA_ARCHETYPES[4]!, confidence: 0.75 };
  }

  const topCategory = analytics.categorySpending[0]?.category.toLowerCase();
  if (topCategory === "food" || topCategory === "dining") {
    return { cluster_id: 1, ...PERSONA_ARCHETYPES[1]!, confidence: 0.8 };
  }
  if (topCategory === "shopping" || topCategory === "entertainment") {
    return { cluster_id: 2, ...PERSONA_ARCHETYPES[2]!, confidence: 0.75 };
  }

  return { cluster_id: 5, ...PERSONA_ARCHETYPES[5]!, confidence: 0.8 };
}

/**
 * Hybrid Financial Analysis Engine implementation.
 * Decouples client applications from internal ML, ONNX, and statistical heuristics.
 */
export class HybridFinancialAnalysisEngine implements FinancialAnalysisEngine {
  constructor(private readonly sessionProvider?: ONNXInferenceSessionProvider) {}

  async analyze(input: FinancialAnalysisInput): Promise<FinancialAnalysisResult> {
    const startTime = performance.now();
    const transactions = input.transactions;
    const period = input.period ?? "all-time";
    const disableML = input.options?.disableML ?? false;

    // 1. Evaluate Data Sufficiency & Cold Start (Section 32)
    const txCount = transactions.length;
    const isColdStart = txCount < 10;
    const coldStartReason = isColdStart
      ? `Insufficient transaction history (${txCount} transactions < 10 required). Basic statistics provided without behavioral ML conclusions.`
      : undefined;

    let anomalyInference: AnomalyInferenceContext | undefined;
    let clusterInference: ClusterInferenceContext | undefined;
    let engineType: "onnx" | "rule_based" | "hybrid" = "rule_based";

    // 2. Perform ML Inference if sufficient data and ML enabled
    if (!isColdStart && !disableML) {
      if (this.sessionProvider) {
        try {
          // A. Anomaly Detection ONNX Inference
          const anomFeatures = extractAnomalyFeatures(transactions);
          const anomOut = await this.sessionProvider.runAnomalyInference(anomFeatures);

          // Calibrate probability: P(anomaly) = 1 / (1 + exp(12 * score))
          const calibratedProb = 1 / (1 + Math.exp(12 * anomOut.score));
          const isAnomaly = anomOut.label === -1 || calibratedProb >= 0.65;
          const severity =
            calibratedProb >= 0.85
              ? "critical"
              : calibratedProb >= 0.7
                ? "high"
                : calibratedProb >= 0.5
                  ? "medium"
                  : "low";

          anomalyInference = {
            is_anomaly: isAnomaly,
            anomaly_score: calibratedProb,
            severity,
          };

          // B. Clustering ONNX Inference
          const clusterFeatures = extractClusteringFeatures(transactions);
          const clusterOut = await this.sessionProvider.runClusteringInference(clusterFeatures);
          const clusterId = Math.min(Math.max(clusterOut.label, 0), 5);
          const meta = PERSONA_ARCHETYPES[clusterId] ?? PERSONA_ARCHETYPES[5]!;

          clusterInference = {
            cluster_id: clusterId,
            archetype: meta.archetype,
            description: meta.description,
            confidence: 0.95,
          };

          engineType = "onnx";
        } catch {
          // Graceful fallback to rule-based heuristics
          clusterInference = deriveRuleBasedPersona(transactions);
          engineType = "hybrid";
        }
      } else {
        // Pure Rule-based persona heuristic
        clusterInference = deriveRuleBasedPersona(transactions);
        engineType = "rule_based";
      }
    }

    // 3. Generate Structured ML Output Payload (Conforming to Zod contract)
    const structuredPayload = generateStructuredMLOutput(transactions, {
      period,
      anomalyInference,
      clusterInference,
    });

    // 4. Map structured insights
    const insights: StructuredMLInsight[] = structuredPayload.insights.map((item) => ({
      type: item.type,
      category: item.category,
      value: item.value,
      amount: item.amount,
      unit: item.unit,
      severity: item.severity,
      score: item.score,
      title: item.title,
      explanation: item.explanation,
      evidence: {
        metricName: item.evidence.metric_name,
        observedValue: item.evidence.observed_value,
        baselineValue: item.evidence.baseline_value,
        unit: item.evidence.unit,
        deltaPercentage: item.evidence.delta_percentage,
        zScore: item.evidence.z_score,
        sampleSize: item.evidence.sample_size,
      },
    }));

    const durationMs = performance.now() - startTime;

    return {
      schemaVersion: structuredPayload.schema_version,
      period: structuredPayload.period,
      generatedAt: structuredPayload.generated_at,
      dataQuality: {
        transactionCount: structuredPayload.data_quality.transaction_count,
        activeDays: structuredPayload.data_quality.active_days,
        coverageMonths: structuredPayload.data_quality.coverage_months,
        sufficientData: structuredPayload.data_quality.sufficient_data,
        dataQualityScore: structuredPayload.data_quality.data_quality_score,
        coldStart: isColdStart,
        message: coldStartReason,
      },
      summary: {
        totalIncome: structuredPayload.summary.total_income,
        totalExpense: structuredPayload.summary.total_expense,
        netSavings: structuredPayload.summary.net_savings,
        savingsRate: structuredPayload.summary.savings_rate,
        volatilityRating: structuredPayload.summary.volatility_rating,
        topSpendingCategory: structuredPayload.summary.top_spending_category,
        spendingTrendDirection: structuredPayload.summary.spending_trend_direction,
      },
      persona: structuredPayload.persona
        ? {
            archetype: structuredPayload.persona.archetype,
            clusterId: structuredPayload.persona.cluster_id,
            description: structuredPayload.persona.description,
            confidence: structuredPayload.persona.confidence,
          }
        : undefined,
      anomaly: anomalyInference
        ? {
            isAnomalous: anomalyInference.is_anomaly,
            anomalyScore: anomalyInference.anomaly_score,
            severity: anomalyInference.severity,
          }
        : undefined,
      insights,
      structuredPayload,
      executionMetadata: {
        engineType,
        durationMs,
      },
    };
  }
}

/**
 * Factory creating the default FinancialAnalysisEngine instance.
 */
export function createFinancialAnalysisEngine(
  sessionProvider?: ONNXInferenceSessionProvider,
): FinancialAnalysisEngine {
  return new HybridFinancialAnalysisEngine(sessionProvider);
}
