import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GuidanceFindingCard } from "../src/GuidanceFindingCard";
import { ProvenanceBadge } from "../src/ProvenanceBadge";
import type { LLMFinding } from "@expense-tracker/schemas";

describe("GuidanceFindingCard & ProvenanceBadge (Phase 27 UX)", () => {
  const sampleFinding: LLMFinding = {
    title: "High Dining Discretionary Volatility",
    evidence: "Observed: ₹14,200 | Baseline: ₹8,000 | Delta: +77.5%",
    explanation:
      "Dining spending escalated sharply compared to your 3-month historical baseline, eroding net monthly savings capacity.",
    recommendation:
      "Cap weekend social dining at ₹2,500/week to protect your emergency buffer trajectory.",
    priority: "high",
  };

  it("renders all 5 mandatory fields (Finding, Evidence, Explanation, Recommendation, Priority)", () => {
    const html = renderToStaticMarkup(
      <GuidanceFindingCard finding={sampleFinding} provenance="llm_suggested" />,
    );

    // 1. Finding Title
    expect(html).toContain("High Dining Discretionary Volatility");

    // 2. Evidence
    expect(html).toContain("Evidence (Grounded Metric)");
    expect(html).toContain("Observed: ₹14,200 | Baseline: ₹8,000 | Delta: +77.5%");

    // 3. Explanation
    expect(html).toContain("Explanation &amp; Context");
    expect(html).toContain(
      "Dining spending escalated sharply compared to your 3-month historical baseline",
    );

    // 4. Recommendation
    expect(html).toContain("Actionable Recommendation");
    expect(html).toContain("Cap weekend social dining at ₹2,500/week");

    // 5. Priority
    expect(html).toContain("high priority");
  });

  it("renders correct visual styling for all 3 provenance tiers", () => {
    const calculatedHtml = renderToStaticMarkup(<ProvenanceBadge tier="calculated" />);
    expect(calculatedHtml).toContain("Calculated");
    expect(calculatedHtml).toContain("ui-provenance-badge");
    expect(calculatedHtml).toContain("calculated");

    const mlDetectedHtml = renderToStaticMarkup(<ProvenanceBadge tier="ml_detected" />);
    expect(mlDetectedHtml).toContain("ML Detected");
    expect(mlDetectedHtml).toContain("ml_detected");

    const llmSuggestedHtml = renderToStaticMarkup(<ProvenanceBadge tier="llm_suggested" />);
    expect(llmSuggestedHtml).toContain("LLM Suggested");
    expect(llmSuggestedHtml).toContain("llm_suggested");
  });

  it("renders appropriate priority badges for medium and low priorities", () => {
    const medFinding: LLMFinding = {
      ...sampleFinding,
      priority: "medium",
      title: "Subscription Recurring Overhead",
    };
    const medHtml = renderToStaticMarkup(
      <GuidanceFindingCard finding={medFinding} provenance="calculated" />,
    );
    expect(medHtml).toContain("medium priority");
    expect(medHtml).toContain("Calculated");

    const lowFinding: LLMFinding = {
      ...sampleFinding,
      priority: "low",
      title: "Steady Savings Rate",
    };
    const lowHtml = renderToStaticMarkup(
      <GuidanceFindingCard finding={lowFinding} provenance="ml_detected" />,
    );
    expect(lowHtml).toContain("low priority");
    expect(lowHtml).toContain("ML Detected");
  });
});
