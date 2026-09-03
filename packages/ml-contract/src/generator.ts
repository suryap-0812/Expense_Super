/**
 * Structured ML Output Payload Generator
 * Transforms transactions, deterministic analytics, pattern analysis, and model inference results
 * into a versioned, evidence-backed ML output payload conforming to Section 29 & 69.
 */

import type { Transaction } from "@expense-tracker/domain";
import {
  generateFinancialAnalytics,
  generatePatternAnalysisReport,
} from "@expense-tracker/analytics";
import { MLOutputContractSchema } from "@expense-tracker/schemas";
import type { InsightSeverity } from "@expense-tracker/schemas";
import type { StructuredMLOutputPayload } from "./types";

export interface AnomalyInferenceContext {
  is_anomaly: boolean;
  anomaly_score: number;
  severity: InsightSeverity;
  contributing_features?: Array<{
    feature: string;
    value: number;
    baseline_mean: number;
    z_score: number;
  }>;
}

export interface ClusterInferenceContext {
  cluster_id: number;
  archetype: string;
  description: string;
  confidence?: number;
}

export interface GenerateMLOutputOptions {
  period?: string;
  anomalyInference?: AnomalyInferenceContext;
  clusterInference?: ClusterInferenceContext;
}

/**
 * Builds the authoritative, versioned Structured ML Output payload with deterministic evidence.
 */
export function generateStructuredMLOutput(
  transactions: ReadonlyArray<Transaction>,
  options: GenerateMLOutputOptions = {},
): StructuredMLOutputPayload {
  const period = options.period ?? "all-time";
  const analytics = generateFinancialAnalytics(transactions);
  const patterns = generatePatternAnalysisReport(transactions);

  // 1. Data Quality Evaluation
  const txCount = transactions.length;
  const activeDays = patterns.transactionFrequency.activeDaysCount;
  const coverageMonths = analytics.monthlySpending.length;
  const sufficientData = txCount >= 10;
  const dataQualityScore = Math.min(
    100,
    Math.round((Math.min(txCount, 50) / 50) * 60 + (Math.min(coverageMonths, 3) / 3) * 40),
  );

  const dataQuality = {
    transaction_count: txCount,
    active_days: activeDays,
    coverage_months: coverageMonths,
    sufficient_data: sufficientData,
    data_quality_score: dataQualityScore,
  };

  // 2. Deterministic Summary
  const topCategory = analytics.categorySpending[0]?.category ?? null;
  const trendDir = patterns.spendingTrend?.direction ?? null;

  const summary = {
    total_income: analytics.totalIncome,
    total_expense: analytics.totalExpense,
    net_savings: analytics.netSavings,
    savings_rate: analytics.savingsRate,
    volatility_rating: patterns.spendingVolatility.rating,
    top_spending_category: topCategory,
    spending_trend_direction: trendDir,
  };

  // 3. Evidence-Backed Insights Assembly
  const insights: StructuredMLOutputPayload["insights"] = [];

  // A. Anomaly Detection Insight
  if (options.anomalyInference?.is_anomaly) {
    const topFeature = options.anomalyInference.contributing_features?.[0];
    const driverName = topFeature?.feature ?? "spending_volatility";
    const zScore = topFeature?.z_score ?? 2.5;

    insights.push({
      type: "spending_anomaly",
      category: driverName.includes("ratio") ? driverName.replace("_ratio", "") : undefined,
      severity: options.anomalyInference.severity,
      score: options.anomalyInference.anomaly_score,
      title: "Unusual Financial Activity Detected",
      explanation: `Machine learning detected an unusual behavioral pattern (severity: ${options.anomalyInference.severity}, score: ${options.anomalyInference.anomaly_score.toFixed(2)}) primarily driven by '${driverName}'.`,
      evidence: {
        metric_name: driverName,
        observed_value: topFeature ? topFeature.value : options.anomalyInference.anomaly_score,
        baseline_value: topFeature?.baseline_mean,
        z_score: zScore,
        sample_size: txCount,
      },
    });
  }

  // B. Category Dynamics Insights
  const topGrowing = patterns.categoryDynamics.growingCategories[0];
  if (
    topGrowing &&
    (topGrowing.percentageChange === null || topGrowing.percentageChange >= 15) &&
    topGrowing.absoluteChange >= 1000
  ) {
    const pctStr =
      topGrowing.percentageChange !== null ? `+${topGrowing.percentageChange}%` : "new spend";
    insights.push({
      type: "category_increase",
      category: topGrowing.category,
      value: topGrowing.percentageChange ?? undefined,
      amount: topGrowing.absoluteChange,
      unit: "INR",
      severity:
        topGrowing.percentageChange && topGrowing.percentageChange >= 50 ? "high" : "medium",
      score: topGrowing.percentageChange ? Math.min(1, topGrowing.percentageChange / 100) : 0.8,
      title: `Significant Spending Surge in ${topGrowing.category}`,
      explanation: `Expenditure in ${topGrowing.category} increased by ₹${topGrowing.absoluteChange.toLocaleString("en-IN")} (${pctStr}) compared to previous period.`,
      evidence: {
        metric_name: "category_expenditure_growth",
        observed_value: topGrowing.currentAmount,
        baseline_value: topGrowing.previousAmount,
        delta_percentage: topGrowing.percentageChange ?? undefined,
        unit: "INR",
      },
    });
  }

  const topDeclining = patterns.categoryDynamics.decliningCategories[0];
  if (
    topDeclining &&
    topDeclining.percentageChange !== null &&
    topDeclining.percentageChange <= -15 &&
    topDeclining.absoluteChange <= -1000
  ) {
    insights.push({
      type: "category_decline",
      category: topDeclining.category,
      value: topDeclining.percentageChange,
      amount: Math.abs(topDeclining.absoluteChange),
      unit: "INR",
      severity: "low",
      score: Math.min(1, Math.abs(topDeclining.percentageChange) / 100),
      title: `Spending Reduction in ${topDeclining.category}`,
      explanation: `Expenditure in ${topDeclining.category} reduced by ₹${Math.abs(topDeclining.absoluteChange).toLocaleString("en-IN")} (${topDeclining.percentageChange}%) compared to previous period.`,
      evidence: {
        metric_name: "category_expenditure_decline",
        observed_value: topDeclining.currentAmount,
        baseline_value: topDeclining.previousAmount,
        delta_percentage: topDeclining.percentageChange,
        unit: "INR",
      },
    });
  }

  // C. Savings Trend Insight
  if (patterns.savingsTrend) {
    if (patterns.savingsTrend.direction === "decreasing" && patterns.savingsTrend.slope <= -1000) {
      insights.push({
        type: "savings_decline",
        value: patterns.savingsTrend.percentageGrowth ?? undefined,
        amount: Math.abs(patterns.savingsTrend.slope),
        unit: "INR/month",
        severity: "high",
        score: Math.min(1, Math.abs(patterns.savingsTrend.slope) / 10000),
        title: "Downtrend in Net Monthly Savings",
        explanation: `Net monthly savings is decreasing at an average rate of ₹${Math.abs(patterns.savingsTrend.slope).toLocaleString("en-IN")} per month (R²=${patterns.savingsTrend.rSquared.toFixed(2)}).`,
        evidence: {
          metric_name: "savings_ols_slope",
          observed_value: patterns.savingsTrend.slope,
          delta_percentage: patterns.savingsTrend.percentageGrowth ?? undefined,
          sample_size: coverageMonths,
        },
      });
    } else if (
      patterns.savingsTrend.direction === "increasing" &&
      patterns.savingsTrend.slope >= 1000
    ) {
      insights.push({
        type: "savings_growth",
        value: patterns.savingsTrend.percentageGrowth ?? undefined,
        amount: patterns.savingsTrend.slope,
        unit: "INR/month",
        severity: "info",
        score: Math.min(1, patterns.savingsTrend.slope / 10000),
        title: "Healthy Upward Trend in Savings",
        explanation: `Net monthly savings is accelerating at an average pace of ₹${patterns.savingsTrend.slope.toLocaleString("en-IN")} per month.`,
        evidence: {
          metric_name: "savings_ols_slope",
          observed_value: patterns.savingsTrend.slope,
          delta_percentage: patterns.savingsTrend.percentageGrowth ?? undefined,
          sample_size: coverageMonths,
        },
      });
    }
  }

  // D. Weekend Concentration Insight
  if (
    patterns.weekendBehavior.weekendSpendingRatio >= 0.45 &&
    patterns.weekendBehavior.totalExpense >= 2000
  ) {
    const weekendPct = Math.round(patterns.weekendBehavior.weekendSpendingRatio * 100);
    insights.push({
      type: "weekend_concentration",
      value: weekendPct,
      unit: "percent",
      severity: patterns.weekendBehavior.weekendSpendingRatio >= 0.55 ? "medium" : "low",
      score: patterns.weekendBehavior.weekendSpendingRatio,
      title: "High Weekend Spending Concentration",
      explanation: `${weekendPct}% of total expenditures occur on weekends, with average weekend transaction size of ₹${patterns.weekendBehavior.averageWeekendTransaction.toLocaleString("en-IN")} (${patterns.weekendBehavior.weekendSpendingPremium}x weekday average).`,
      evidence: {
        metric_name: "weekend_spending_ratio",
        observed_value: patterns.weekendBehavior.weekendSpendingRatio,
        baseline_value: 0.2857, // Expected 2/7th random baseline (~28.6%)
        delta_percentage: Math.round(
          ((patterns.weekendBehavior.weekendSpendingRatio - 0.2857) / 0.2857) * 100,
        ),
        unit: "ratio",
      },
    });
  }

  // E. Volatility Insight
  if (
    patterns.spendingVolatility.rating === "volatile" ||
    patterns.spendingVolatility.rating === "high"
  ) {
    insights.push({
      type: "high_volatility",
      value: patterns.spendingVolatility.coefficientOfVariation,
      severity: patterns.spendingVolatility.rating === "volatile" ? "high" : "medium",
      score: Math.min(1, patterns.spendingVolatility.coefficientOfVariation),
      title: "High Month-over-Month Spending Volatility",
      explanation: `Monthly expenditure exhibits significant fluctuations with a coefficient of variation of ${patterns.spendingVolatility.coefficientOfVariation.toFixed(2)} (std dev ₹${patterns.spendingVolatility.standardDeviation.toLocaleString("en-IN")}).`,
      evidence: {
        metric_name: "coefficient_of_variation",
        observed_value: patterns.spendingVolatility.coefficientOfVariation,
        baseline_value: 0.15, // Threshold for stable spending
        unit: "CV",
      },
    });
  }

  // F. Transaction Flurry / Burst Insight
  if (patterns.transactionFrequency.burstDays.length > 0) {
    const topBurst = patterns.transactionFrequency.burstDays[0];
    if (topBurst) {
      insights.push({
        type: "transaction_burst",
        amount: topBurst.totalAmount,
        value: topBurst.transactionCount,
        unit: "count",
        severity: topBurst.transactionCount >= 6 ? "medium" : "low",
        score: Math.min(1, topBurst.transactionCount / 10),
        title: "High-Frequency Transaction Flurry Detected",
        explanation: `Recorded a flurry of ${topBurst.transactionCount} transactions totaling ₹${topBurst.totalAmount.toLocaleString("en-IN")} on ${topBurst.date}.`,
        evidence: {
          metric_name: "daily_burst_count",
          observed_value: topBurst.transactionCount,
          baseline_value: patterns.transactionFrequency.dailyVelocity,
          unit: "transactions",
        },
      });
    }
  }

  // 4. Behavioral Persona (from K-Means clustering if provided)
  const persona = options.clusterInference
    ? {
        archetype: options.clusterInference.archetype,
        cluster_id: options.clusterInference.cluster_id,
        description: options.clusterInference.description,
        confidence: options.clusterInference.confidence ?? 0.9,
      }
    : undefined;

  const payload: StructuredMLOutputPayload = {
    schema_version: "1.0",
    period,
    generated_at: new Date().toISOString(),
    data_quality: dataQuality,
    summary,
    persona,
    insights,
  };

  // 5. Strict Schema Validation
  // Validate against Zod MLOutputContractSchema to ensure absolute runtime compliance
  const validatedZod = MLOutputContractSchema.safeParse(payload);
  if (!validatedZod.success) {
    throw new Error(`Generated ML Output failed Zod validation: ${validatedZod.error.message}`);
  }

  return payload;
}
