/**
 * Financial Guidance Prompt Templates & Serializers (Section 35, 36 & 37).
 * Encapsulates privacy-preserving prompt formatting and strict safety guidelines.
 */

import type { LLMAnalysisInput } from "./types";

/**
 * System prompt strictly enforcing safety, groundedness, and JSON contract structure.
 */
export const FINANCIAL_GUIDANCE_SYSTEM_PROMPT = `You are an expert personal financial analysis and guidance assistant.
Your task is to convert structured machine learning evidence and deterministic financial metrics into clear, helpful, evidence-backed explanations.

STRICT SAFETY AND COMPLIANCE RULES:
1. You are NOT a calculation engine. Do NOT recalculate or invent financial totals. Use ONLY the provided numbers.
2. Ground all explanations in the supplied evidence. NEVER invent transactions, merchants, accounts, numbers, or fabricated trends.
3. If data is marked insufficient or cold start, explicitly acknowledge it and refrain from behavioral over-interpretation.
4. You are an AI assistant providing informational budgeting guidance, not a licensed financial advisor. Do not offer speculative investment advice.
5. You must output ONLY a valid, parseable JSON object adhering to the schema below without markdown formatting or code blocks.

REQUIRED JSON OUTPUT FORMAT:
{
  "summary": "1-2 sentence executive overview summarizing financial health and key takeaways based on evidence.",
  "findings": [
    {
      "title": "Clear, concise finding title (e.g., 'Discretionary Shopping Surge')",
      "evidence": "Exact numeric metrics and facts provided (e.g., 'Shopping spending increased by 31.4% exceeding the ₹12,000 monthly baseline.')",
      "explanation": "Why this matters to the user's budget, cash flow stability, and savings trajectory.",
      "recommendation": "A constructive, realistic action the user can take.",
      "priority": "low" | "medium" | "high"
    }
  ]
}`;

/**
 * Serializes structured ML evidence into a minimal, privacy-preserving user prompt (Section 35).
 */
export function buildFinancialGuidanceUserPrompt(input: LLMAnalysisInput): string {
  const currency = input.currencySymbol ?? "₹";
  const period = input.period ?? "Current Period";

  const payload: Record<string, unknown> = {
    period,
    deterministic_summary: {
      total_income: `${currency}${input.summary.totalIncome.toLocaleString()}`,
      total_expense: `${currency}${input.summary.totalExpense.toLocaleString()}`,
      net_savings: `${currency}${input.summary.netSavings.toLocaleString()}`,
      savings_rate:
        input.summary.savingsRate !== null ? `${input.summary.savingsRate.toFixed(1)}%` : "N/A",
      spending_volatility_rating: input.summary.volatilityRating,
      top_spending_category: input.summary.topSpendingCategory ?? "None",
      spending_trend_direction: input.summary.spendingTrendDirection ?? "Stable",
    },
  };

  if (input.savingsGoalAmount !== undefined && input.savingsGoalAmount > 0) {
    payload["savings_goal_target"] = `${currency}${input.savingsGoalAmount.toLocaleString()}`;
  }

  if (input.persona) {
    payload["behavioral_persona"] = {
      archetype: input.persona.archetype,
      description: input.persona.description,
      confidence: `${(input.persona.confidence * 100).toFixed(0)}%`,
    };
  }

  if (input.anomaly && input.anomaly.isAnomalous) {
    payload["anomaly_detection"] = {
      is_anomalous: true,
      severity: input.anomaly.severity,
      anomaly_score: Number(input.anomaly.anomalyScore.toFixed(2)),
      top_contributing_feature: input.anomaly.topFeature ?? "unusual_spending_velocity",
    };
  }

  if (input.insights && input.insights.length > 0) {
    payload["structured_evidence_insights"] = input.insights.map((insight) => ({
      type: insight.type,
      category: insight.category,
      severity: insight.severity,
      title: insight.title,
      metric_name: insight.evidence.metricName,
      observed_value: insight.evidence.observedValue,
      baseline_value: insight.evidence.baselineValue,
      delta_percentage:
        insight.evidence.deltaPercentage !== undefined
          ? `${insight.evidence.deltaPercentage > 0 ? "+" : ""}${insight.evidence.deltaPercentage.toFixed(1)}%`
          : undefined,
      z_score: insight.evidence.zScore,
    }));
  }

  return JSON.stringify(payload, null, 2);
}
