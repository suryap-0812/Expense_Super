import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AIAdvisorSection } from "../src/components/dashboard/AIAdvisorSection";
import { useGuidanceStore } from "@expense-tracker/state";
import type { FinancialAnalysisResult } from "@expense-tracker/ml-contract";

describe("AIAdvisorSection (Phase 27 Web UX)", () => {
  const mockAnalysis: FinancialAnalysisResult = {
    period: "2026-03",
    summary: {
      totalIncome: 100000,
      totalExpense: 60000,
      netSavings: 40000,
      savingsRate: 40,
      discretionaryRatio: 35,
      essentialRatio: 65,
    },
    persona: {
      archetype: "Balanced Optimizer",
      clusterId: 2,
      confidence: 0.92,
      description: "Disciplined budgeter with low discretionary volatility.",
    },
    anomaly: {
      isAnomalous: false,
      anomalyScore: 0.12,
      severity: "low",
    },
    insights: [],
    dataQuality: {
      sufficientData: true,
      dataQualityScore: 90,
      coldStart: false,
    },
  };

  beforeEach(() => {
    useGuidanceStore.getState().clearGuidance();
  });

  it("renders ready state when no guidance has been generated yet", () => {
    const html = renderToStaticMarkup(<AIAdvisorSection analysis={mockAnalysis} />);
    expect(html).toContain("AI Financial Guidance");
    expect(html).toContain("Ready to Generate Grounded Financial Guidance");
    expect(html).toContain("Refresh Guidance");
    expect(html).toContain("Provenance Tiers:");
    expect(html).toContain("Calculated");
    expect(html).toContain("ML Detected");
    expect(html).toContain("LLM Suggested");
    expect(html).toContain("Grounding Guarantee:");
  });

  it("renders executive summary and 5-field findings when guidanceResult is present in store", () => {
    const guidanceData = {
      summary: "Your financial health is strong with 40% net savings rate.",
      modelUsed: "mock/financial-expert-v1",
      latencyMs: 120,
      findings: [
        {
          title: "Optimize Discretionary Subscriptions",
          evidence: "Observed: ₹4,500/mo | Baseline: ₹2,000/mo",
          explanation: "Recurring digital service fees have increased by 125%.",
          recommendation: "Audit streaming and cloud memberships to save ₹2,500/mo.",
          priority: "medium" as const,
        },
      ],
    };

    const html = renderToStaticMarkup(
      <AIAdvisorSection analysis={mockAnalysis} guidanceResult={guidanceData} />,
    );

    expect(html).toContain("Executive Summary");
    expect(html).toContain("Your financial health is strong with 40% net savings rate.");
    expect(html).toContain("Actionable Findings (1)");
    expect(html).toContain("Optimize Discretionary Subscriptions");
    expect(html).toContain("Observed: ₹4,500/mo | Baseline: ₹2,000/mo");
    expect(html).toContain("Recurring digital service fees have increased by 125%.");
    expect(html).toContain("Audit streaming and cloud memberships to save ₹2,500/mo.");
    expect(html).toContain("medium priority");
    expect(html).toContain("LLM Suggested");
  });
});
