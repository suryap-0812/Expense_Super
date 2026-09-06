/**
 * Mock / Deterministic LLM Client Implementation.
 * Provides offline, zero-network, evidence-grounded financial guidance
 * for tests, development, and fallback operation without API keys.
 */

import type { LLMFinding, LLMPriority } from "@expense-tracker/schemas";
import type { LLMAnalysisInput, LLMAnalysisResult, LLMClient } from "./types";

export interface MockLLMClientOptions {
  simulatedDelayMs?: number;
  simulatedError?: string;
  customFindings?: LLMFinding[];
}

export class MockLLMClient implements LLMClient {
  constructor(private readonly options: MockLLMClientOptions = {}) {}

  public async generateExplanation(input: LLMAnalysisInput): Promise<LLMAnalysisResult> {
    const startTime = performance.now();

    if (this.options.simulatedDelayMs && this.options.simulatedDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.options.simulatedDelayMs));
    }

    if (this.options.simulatedError) {
      throw new Error(this.options.simulatedError);
    }

    if (this.options.customFindings) {
      return {
        summary: "Custom mock financial guidance summary.",
        findings: this.options.customFindings,
        modelUsed: "mock/custom-preset",
        latencyMs: Math.round(performance.now() - startTime),
      };
    }

    const currency = input.currencySymbol ?? "₹";
    const savingsRate = input.summary.savingsRate ?? 0;
    const netSavings = input.summary.netSavings;
    const totalIncome = input.summary.totalIncome;
    const totalExpense = input.summary.totalExpense;
    const persona = input.persona;
    const anomaly = input.anomaly;

    const findings: LLMFinding[] = [];

    // 1. Overall Savings & Cashflow Finding
    if (savingsRate >= 20) {
      findings.push({
        title: "Healthy Savings Discipline",
        evidence: `Net savings reached ${currency}${netSavings.toLocaleString()} with a ${savingsRate.toFixed(1)}% savings rate from ${currency}${totalIncome.toLocaleString()} total income.`,
        explanation:
          "Your strong cash flow surplus allows consistent wealth accumulation while maintaining a reliable safety buffer against unexpected expenses.",
        recommendation:
          input.savingsGoalAmount && netSavings < input.savingsGoalAmount
            ? `Allocate a portion of the ${currency}${netSavings.toLocaleString()} surplus directly towards your active goals.`
            : "Continue maintaining current spending controls and consider automating recurring savings transfers.",
        priority: "low",
      });
    } else if (savingsRate >= 0) {
      findings.push({
        title: "Moderate Savings Margin",
        evidence: `Net savings at ${currency}${netSavings.toLocaleString()} (${savingsRate.toFixed(1)}% of income) against total expenses of ${currency}${totalExpense.toLocaleString()}.`,
        explanation:
          "Your current budget is balanced, but the low savings margin leaves limited room for accelerated goal progress or emergency contingencies.",
        recommendation:
          "Review top discretionary categories to identify moderate cutbacks and boost your savings rate towards 20%.",
        priority: "medium",
      });
    } else {
      findings.push({
        title: "Cashflow Deficit Warning",
        evidence: `Total expenses (${currency}${totalExpense.toLocaleString()}) exceeded total income (${currency}${totalIncome.toLocaleString()}) resulting in a negative net balance of ${currency}${netSavings.toLocaleString()}.`,
        explanation:
          "Outflows exceeded inflows for this period, which if sustained will deplete cash reserves or increase debt obligations.",
        recommendation:
          "Immediately curb non-essential discretionary purchases and review major recurring fixed commitments.",
        priority: "high",
      });
    }

    // 2. Anomaly Finding (if present)
    if (anomaly && anomaly.isAnomalous) {
      const priority: LLMPriority =
        anomaly.severity === "critical" || anomaly.severity === "high" ? "high" : "medium";
      findings.push({
        title: "Unusual Expenditure Pattern Detected",
        evidence: `Behavioral anomaly flagged with severity '${anomaly.severity}' and anomaly score ${anomaly.anomalyScore.toFixed(2)}.`,
        explanation:
          "Our local machine learning model identified an irregular spending burst that deviates significantly from your established baseline velocity.",
        recommendation:
          "Review recent large transactions to ensure all debits were authorized and adjust the upcoming month's discretionary budget.",
        priority,
      });
    }

    // 3. Structured Insights Mappings
    if (input.insights && input.insights.length > 0) {
      for (const ins of input.insights.slice(0, 3)) {
        // Avoid duplicate anomaly insight
        if (ins.type === "spending_anomaly" && anomaly?.isAnomalous) continue;

        const priority: LLMPriority =
          ins.severity === "critical" || ins.severity === "high"
            ? "high"
            : ins.severity === "medium"
              ? "medium"
              : "low";

        findings.push({
          title: ins.title,
          evidence: `${ins.evidence.metricName}: ${ins.evidence.observedValue} ${ins.evidence.unit ?? ""}${
            ins.evidence.deltaPercentage !== undefined
              ? ` (${ins.evidence.deltaPercentage > 0 ? "+" : ""}${ins.evidence.deltaPercentage.toFixed(1)}% vs baseline)`
              : ""
          }`,
          explanation: ins.explanation,
          recommendation:
            ins.severity === "high" || ins.severity === "critical"
              ? `Closely monitor expenditures in '${ins.category ?? "this category"}' over the next 14 days.`
              : "Keep tracking this category to maintain steady budgetary equilibrium.",
          priority,
        });
      }
    }

    // Generate Executive Summary
    const personaText = persona
      ? ` You are currently exhibiting '${persona.archetype}' behavioral characteristics.`
      : "";
    const summary = `Financial overview for ${input.period ?? "the current period"}: Net savings of ${currency}${netSavings.toLocaleString()} (${savingsRate.toFixed(1)}% savings rate) across ${currency}${totalExpense.toLocaleString()} total expenditures.${personaText}`;

    const latencyMs = Math.round(performance.now() - startTime);

    return {
      summary,
      findings,
      modelUsed: "mock/deterministic-guidance-engine",
      latencyMs,
    };
  }
}
