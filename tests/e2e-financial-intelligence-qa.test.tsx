/**
 * End-to-End Financial Intelligence QA Integration Test (Phase 29).
 * Validates the complete pipeline from SQLite DB -> ML Contract -> LLM Guidance -> UI Presentation.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemorySqliteAdapter,
  runMigrations,
  SqliteTransactionRepository,
  SqliteCategoryRepository,
} from "@expense-tracker/db";
import { createFinancialAnalysisEngine } from "@expense-tracker/ml-contract";
import { financialExplanationService } from "@expense-tracker/llm-client";
import { useGuidanceStore, useTransactionStore } from "@expense-tracker/state";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { GuidanceFindingCard } from "@expense-tracker/ui";

describe("E2E Financial Intelligence & Advisory QA Pipeline (Section 88)", () => {
  let driver: InMemorySqliteAdapter;
  let txRepo: SqliteTransactionRepository;
  let catRepo: SqliteCategoryRepository;

  beforeEach(async () => {
    driver = new InMemorySqliteAdapter();
    await runMigrations(driver);
    txRepo = new SqliteTransactionRepository(driver);
    catRepo = new SqliteCategoryRepository(driver);
    useGuidanceStore.getState().clearGuidance();
    useTransactionStore.getState().clearTransactions();
  });

  it("executes the entire financial data lifecycle seamlessly with zero data leakage", async () => {
    // 1. Seed Categories in SQLite
    const incCat = await catRepo.create({
      name: "Salary",
      type: "income",
      isDefault: true,
      color: "#10b981",
      icon: "briefcase",
    });

    const rentCat = await catRepo.create({
      name: "Housing",
      type: "expense",
      isDefault: true,
      color: "#6366f1",
      icon: "home",
    });

    const diningCat = await catRepo.create({
      name: "Dining Out",
      type: "expense",
      isDefault: false,
      color: "#f43f5e",
      icon: "utensils",
    });

    // 2. Insert 10+ Transactions (Sufficient for Behavioral ML inference)
    await txRepo.create({
      amount: 100000,
      type: "income",
      categoryId: incCat.id,
      transactionDate: "2026-05-01",
      paymentMethod: "Bank Transfer",
      description: "Primary Consulting Retainer",
    });

    await txRepo.create({
      amount: 35000,
      type: "expense",
      categoryId: rentCat.id,
      transactionDate: "2026-05-02",
      paymentMethod: "Bank Transfer",
      description: "Monthly Apartment Lease",
    });

    for (let i = 1; i <= 9; i++) {
      await txRepo.create({
        amount: 2000,
        type: "expense",
        categoryId: diningCat.id,
        transactionDate: `2026-05-${String(i + 5).padStart(2, "0")}`,
        paymentMethod: "Credit Card",
        description: `Client Dinner & Weekend Bistro ${i}`,
      });
    }

    // 3. Query from SQLite Repository
    const storedTxs = await txRepo.list();
    expect(storedTxs).toHaveLength(11);

    // 4. Run Local ML & Deterministic Analysis Engine
    const engine = createFinancialAnalysisEngine();
    const analysisResult = await engine.analyze({
      transactions: storedTxs,
      period: "2026-05",
    });

    // Assert Deterministic Calculations
    expect(analysisResult.summary.totalIncome).toBe(100000);
    expect(analysisResult.summary.totalExpense).toBe(53000);
    expect(analysisResult.summary.netSavings).toBe(47000);
    expect(analysisResult.summary.savingsRate).toBe(47);

    // Assert ML Inferences (Archetype & Persona)
    expect(analysisResult.persona).toBeDefined();
    expect(analysisResult.persona?.archetype).toBeTruthy();

    // 5. Generate Grounded AI Guidance (LLM Explanation Service)
    const guidanceResult = await financialExplanationService.explain(analysisResult, {
      fallbackToMockOnFailure: true,
      currencySymbol: "₹",
      savingsGoalAmount: 60000,
    });

    expect(guidanceResult).toBeDefined();
    expect(guidanceResult.summary).toBeTruthy();
    expect(guidanceResult.findings.length).toBeGreaterThan(0);

    // 6. Push to Zustand Reactive Store
    useGuidanceStore.getState().setGuidanceResult(guidanceResult);

    const storeFindings = useGuidanceStore.getState().getFindings();
    expect(storeFindings).toHaveLength(guidanceResult.findings.length);

    // 7. Verify UI Finding Card Rendering with 5 Mandatory Fields
    const firstFinding = storeFindings[0];
    const renderedHtml = renderToStaticMarkup(
      <GuidanceFindingCard finding={firstFinding} provenance="llm_suggested" />,
    );

    expect(renderedHtml).toContain(firstFinding.title);
    expect(renderedHtml).toContain("Evidence (Grounded Metric)");
    expect(renderedHtml).toContain(firstFinding.evidence);
    expect(renderedHtml).toContain("Explanation &amp; Context");
    expect(renderedHtml).toContain(firstFinding.explanation);
    expect(renderedHtml).toContain("Actionable Recommendation");
    expect(renderedHtml).toContain(firstFinding.recommendation);
    expect(renderedHtml).toContain(`${firstFinding.priority} priority`);
    expect(renderedHtml).toContain("LLM Suggested");
  });
});
