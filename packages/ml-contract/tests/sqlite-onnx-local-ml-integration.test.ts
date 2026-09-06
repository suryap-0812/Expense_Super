/**
 * Phase 24: SQLite -> Feature Engineering -> ONNX Runtime -> Structured ML Result Pipeline
 * Master Prompt Section 83 & Section 28/32/73 Integration Verification.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  InMemorySqliteAdapter,
  runMigrations,
  SqliteTransactionRepository,
} from "@expense-tracker/db";
import { MLOutputContractSchema } from "@expense-tracker/schemas";
import {
  extractAnomalyFeatures,
  extractClusteringFeatures,
  HybridFinancialAnalysisEngine,
  LocalONNXSessionProvider,
} from "../src";

describe("Phase 24: SQLite -> Feature Engineering -> ONNX Runtime -> Structured ML Result", () => {
  let driver: InMemorySqliteAdapter;
  let txRepo: SqliteTransactionRepository;
  let onnxProvider: LocalONNXSessionProvider;
  let engine: HybridFinancialAnalysisEngine;

  beforeEach(async () => {
    driver = new InMemorySqliteAdapter();
    await runMigrations(driver);
    txRepo = new SqliteTransactionRepository(driver);
    onnxProvider = new LocalONNXSessionProvider();
    engine = new HybridFinancialAnalysisEngine(onnxProvider);
  });

  it("executes the full SQLite -> Features -> ONNX -> Structured Result pipeline for a Disciplined Saver", async () => {
    // 1. Seed SQLite Database with 3 months of realistic transactions (Disciplined Saver profile)
    const seedDates = [
      // Month 1 (2026-03)
      {
        date: "2026-03-01",
        type: "income" as const,
        amount: 60000,
        category: "Salary",
        desc: "Monthly Salary",
      },
      {
        date: "2026-03-03",
        type: "expense" as const,
        amount: 8000,
        category: "Bills",
        desc: "Rent & Utilities",
      },
      {
        date: "2026-03-05",
        type: "expense" as const,
        amount: 1500,
        category: "Food",
        desc: "Groceries",
      },
      {
        date: "2026-03-10",
        type: "expense" as const,
        amount: 1200,
        category: "Food",
        desc: "Supermarket",
      },
      {
        date: "2026-03-15",
        type: "expense" as const,
        amount: 600,
        category: "Transport",
        desc: "Metro Card",
      },
      {
        date: "2026-03-20",
        type: "expense" as const,
        amount: 1800,
        category: "Shopping",
        desc: "Apparel",
      },
      {
        date: "2026-03-25",
        type: "expense" as const,
        amount: 900,
        category: "Food",
        desc: "Weekend Dining",
      },
      // Month 2 (2026-04)
      {
        date: "2026-04-01",
        type: "income" as const,
        amount: 60000,
        category: "Salary",
        desc: "Monthly Salary",
      },
      {
        date: "2026-04-03",
        type: "expense" as const,
        amount: 8000,
        category: "Bills",
        desc: "Rent & Utilities",
      },
      {
        date: "2026-04-06",
        type: "expense" as const,
        amount: 1600,
        category: "Food",
        desc: "Groceries",
      },
      {
        date: "2026-04-12",
        type: "expense" as const,
        amount: 1100,
        category: "Food",
        desc: "Supermarket",
      },
      {
        date: "2026-04-16",
        type: "expense" as const,
        amount: 700,
        category: "Transport",
        desc: "Metro Card",
      },
      {
        date: "2026-04-22",
        type: "expense" as const,
        amount: 2000,
        category: "Shopping",
        desc: "Household items",
      },
      {
        date: "2026-04-27",
        type: "expense" as const,
        amount: 850,
        category: "Food",
        desc: "Dining",
      },
      // Month 3 (2026-05)
      {
        date: "2026-05-01",
        type: "income" as const,
        amount: 60000,
        category: "Salary",
        desc: "Monthly Salary",
      },
      {
        date: "2026-05-03",
        type: "expense" as const,
        amount: 8000,
        category: "Bills",
        desc: "Rent & Utilities",
      },
      {
        date: "2026-05-08",
        type: "expense" as const,
        amount: 1400,
        category: "Food",
        desc: "Groceries",
      },
      {
        date: "2026-05-14",
        type: "expense" as const,
        amount: 1300,
        category: "Food",
        desc: "Supermarket",
      },
      {
        date: "2026-05-18",
        type: "expense" as const,
        amount: 650,
        category: "Transport",
        desc: "Metro Card",
      },
      {
        date: "2026-05-24",
        type: "expense" as const,
        amount: 1500,
        category: "Shopping",
        desc: "Books",
      },
      {
        date: "2026-05-29",
        type: "expense" as const,
        amount: 950,
        category: "Food",
        desc: "Dining",
      },
    ];

    for (const [idx, item] of seedDates.entries()) {
      await txRepo.create({
        id: `tx_seed_${idx + 1}`,
        type: item.type,
        amount: item.amount,
        categoryId: item.category,
        paymentMethod: "UPI",
        transactionDate: item.date,
        description: item.desc,
      });
    }

    // 2. Query transactions from SQLite Repository
    const transactions = await txRepo.list();
    expect(transactions.length).toBe(seedDates.length);

    // 3. Extract Feature Engineering Vectors
    const anomalyFeatures = extractAnomalyFeatures(transactions);
    expect(anomalyFeatures).toBeInstanceOf(Float32Array);
    expect(anomalyFeatures.length).toBe(14);
    // Savings rate is > 65%
    expect(anomalyFeatures[0]).toBeGreaterThan(60);

    const clusteringFeatures = extractClusteringFeatures(transactions);
    expect(clusteringFeatures).toBeInstanceOf(Float32Array);
    expect(clusteringFeatures.length).toBe(8);
    // Standardized clustering features must be finite numbers
    for (let i = 0; i < 8; i++) {
      expect(Number.isFinite(clusteringFeatures[i])).toBe(true);
    }

    // 4. Run ONNX Inference Session Provider directly to test runtime equivalence
    const onnxAnomalyOut = await onnxProvider.runAnomalyInference(anomalyFeatures);
    expect(onnxAnomalyOut.label).toBe(1); // Normal inlier
    expect(onnxAnomalyOut.score).toBeGreaterThan(0);

    const onnxClusterOut = await onnxProvider.runClusteringInference(clusteringFeatures);
    expect(onnxClusterOut.distances.length).toBe(6);
    expect(onnxClusterOut.label).toBeGreaterThanOrEqual(0);
    expect(onnxClusterOut.label).toBeLessThanOrEqual(5);

    // 5. Run full HybridFinancialAnalysisEngine (SQLite -> Feature Extraction -> ONNX -> Structured Result)
    const result = await engine.analyze({
      transactions,
      period: "2026-03 to 2026-05",
    });

    // 6. Verify Structured ML Output Contract
    expect(result.schemaVersion).toBe("1.0");
    expect(result.period).toBe("2026-03 to 2026-05");
    expect(result.dataQuality.coldStart).toBe(false);
    expect(result.dataQuality.sufficientData).toBe(true);
    expect(result.dataQuality.transactionCount).toBe(seedDates.length);
    expect(result.dataQuality.coverageMonths).toBe(3);

    expect(result.executionMetadata.engineType).toBe("onnx");
    expect(result.executionMetadata.durationMs).toBeLessThan(100);

    expect(result.summary.totalIncome).toBe(180000);
    expect(result.summary.totalExpense).toBeGreaterThan(40000);
    expect(result.summary.netSavings).toBeGreaterThan(130000);
    expect(result.summary.savingsRate).toBeGreaterThan(65);

    // Persona assigned via ONNX clustering
    expect(result.persona).toBeDefined();
    expect(result.persona?.confidence).toBeGreaterThan(0.8);
    expect(result.persona?.archetype).toBeDefined();

    // Validates against Zod contract
    const parsed = MLOutputContractSchema.safeParse(result.structuredPayload);
    expect(parsed.success).toBe(true);
  });

  it("detects spending anomaly and generates structured evidence from SQLite dataset", async () => {
    // Seed 15 normal transactions + 1 massive anomalous outlay
    const normalTransactions = Array.from({ length: 14 }, (_, i) => ({
      id: `norm_${i + 1}`,
      type: "expense" as const,
      amount: 1000,
      categoryId: "Food",
      paymentMethod: "UPI" as const,
      transactionDate: `2026-05-${String(i + 1).padStart(2, "0")}`,
      description: `Daily meal ${i + 1}`,
    }));

    for (const tx of normalTransactions) {
      await txRepo.create(tx);
    }

    // Add normal income
    await txRepo.create({
      id: "inc_salary",
      type: "income",
      amount: 50000,
      categoryId: "Salary",
      paymentMethod: "Bank Transfer",
      transactionDate: "2026-05-01",
      description: "Salary deposit",
    });

    // Add anomalous massive expenditure: ₹85,000 discretionary spend
    await txRepo.create({
      id: "anom_outlay",
      type: "expense",
      amount: 85000,
      categoryId: "Shopping",
      paymentMethod: "Credit Card",
      transactionDate: "2026-05-20",
      description: "Luxury watch purchase",
    });

    const txs = await txRepo.list();
    const result = await engine.analyze({
      transactions: txs,
      period: "2026-05",
    });

    expect(result.dataQuality.coldStart).toBe(false);
    expect(result.dataQuality.sufficientData).toBe(true);
    expect(result.summary.savingsRate).toBeLessThan(0); // Negative savings rate

    // Anomaly should be triggered
    expect(result.anomaly).toBeDefined();
    expect(result.anomaly?.isAnomalous).toBe(true);
    expect(result.anomaly?.anomalyScore).toBeGreaterThan(0.6);

    // Insights must contain structured anomaly evidence
    const anomalyInsight = result.insights.find((ins) => ins.type === "spending_anomaly");
    expect(anomalyInsight).toBeDefined();
    expect(anomalyInsight?.evidence).toBeDefined();
    expect(anomalyInsight?.evidence.metricName).toBeDefined();

    const parsed = MLOutputContractSchema.safeParse(result.structuredPayload);
    expect(parsed.success).toBe(true);
  });

  it("handles cold-start datasets (<10 SQLite transactions) gracefully without failure", async () => {
    // Seed only 4 transactions
    for (let i = 1; i <= 4; i++) {
      await txRepo.create({
        id: `tx_${i}`,
        type: "expense",
        amount: 800 * i,
        categoryId: "Food",
        paymentMethod: "Cash",
        transactionDate: `2026-05-0${i}`,
        description: `Snack ${i}`,
      });
    }

    const txs = await txRepo.list();
    const result = await engine.analyze({
      transactions: txs,
      period: "2026-05",
    });

    expect(result.dataQuality.coldStart).toBe(true);
    expect(result.dataQuality.sufficientData).toBe(false);
    expect(result.dataQuality.transactionCount).toBe(4);
    expect(result.dataQuality.message).toContain("Insufficient transaction history");
    expect(result.persona).toBeUndefined();
    expect(result.anomaly).toBeUndefined();

    // Summary calculation remains accurate
    expect(result.summary.totalExpense).toBe(800 + 1600 + 2400 + 3200);

    const parsed = MLOutputContractSchema.safeParse(result.structuredPayload);
    expect(parsed.success).toBe(true);
  });

  it("guarantees zero leakage of raw transaction descriptions/PII into structured ML result", async () => {
    // Seed transactions with private PII strings
    const sensitiveDescriptions = [
      "CONFIDENTIAL_TRANSFER_TO_SECRET_ACCOUNT_9981",
      "PERSONAL_MEDICAL_EXPENSE_DR_SMITH",
      "OFFICIAL_GOVT_TAX_FILING_AADHAAR_9921",
    ];

    for (const [idx, desc] of sensitiveDescriptions.entries()) {
      await txRepo.create({
        id: `priv_tx_${idx + 1}`,
        type: "expense",
        amount: 5000 * (idx + 1),
        categoryId: "Bills",
        paymentMethod: "UPI",
        transactionDate: `2026-05-${String(idx + 1).padStart(2, "0")}`,
        description: desc,
      });
    }

    // Add remaining dummy transactions to exceed cold start
    for (let i = 4; i <= 15; i++) {
      await txRepo.create({
        id: `priv_tx_${i}`,
        type: "expense",
        amount: 500,
        categoryId: "Food",
        paymentMethod: "UPI",
        transactionDate: `2026-05-${String(i).padStart(2, "0")}`,
        description: `Routine food item ${i}`,
      });
    }

    const txs = await txRepo.list();
    const result = await engine.analyze({
      transactions: txs,
      period: "2026-05",
    });

    const serializedPayload = JSON.stringify(result.structuredPayload);

    // Ensure NONE of the sensitive descriptions appear anywhere in the structured ML output
    for (const sensitiveStr of sensitiveDescriptions) {
      expect(serializedPayload).not.toContain(sensitiveStr);
    }

    // Ensure raw transaction IDs do not appear
    expect(serializedPayload).not.toContain("priv_tx_1");
    expect(serializedPayload).not.toContain("priv_tx_2");
  });
});
