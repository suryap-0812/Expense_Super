import { describe, expect, it } from "vitest";
import type { Transaction } from "@expense-tracker/domain";
import { MLOutputContractSchema } from "@expense-tracker/schemas";
import {
  createFinancialAnalysisEngine,
  extractAnomalyFeatures,
  extractClusteringFeatures,
  HybridFinancialAnalysisEngine,
  type ONNXInferenceSessionProvider,
} from "../src";

function createMockTransactions(count: number, amount: number = 2000): Transaction[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `tx_${i}`,
    type: "expense" as const,
    amount,
    categoryId: i % 2 === 0 ? "Food" : "Shopping",
    paymentMethod: "UPI" as const,
    transactionDate: `2026-05-${String((i % 28) + 1).padStart(2, "0")}`,
    description: `Sample purchase ${i}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

describe("Phase 14: FinancialAnalysisEngine & ML Interface", () => {
  it("handles cold-start datasets (<10 transactions) safely with degraded conclusions", async () => {
    const engine = createFinancialAnalysisEngine();
    const transactions = createMockTransactions(4, 1500);

    const result = await engine.analyze({
      transactions,
      period: "2026-05",
    });

    expect(result.dataQuality.coldStart).toBe(true);
    expect(result.dataQuality.sufficientData).toBe(false);
    expect(result.dataQuality.transactionCount).toBe(4);
    expect(result.dataQuality.message).toContain("Insufficient transaction history");
    expect(result.persona).toBeUndefined();
    expect(result.anomaly).toBeUndefined();
    expect(result.summary.totalExpense).toBe(6000);

    // Assert Zod schema passes
    const parsed = MLOutputContractSchema.safeParse(result.structuredPayload);
    expect(parsed.success).toBe(true);
  });

  it("extracts valid 14-dim anomaly and 8-dim clustering feature vectors", () => {
    const transactions = [
      {
        id: "inc_1",
        type: "income" as const,
        amount: 80000,
        categoryId: "Salary",
        paymentMethod: "Bank Transfer" as const,
        transactionDate: "2026-05-01",
        description: "Salary",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      ...createMockTransactions(15, 2500),
    ];

    const anomFeatures = extractAnomalyFeatures(transactions);
    expect(anomFeatures.length).toBe(14);
    for (let i = 0; i < anomFeatures.length; i++) {
      expect(Number.isFinite(anomFeatures[i])).toBe(true);
    }

    const clustFeatures = extractClusteringFeatures(transactions);
    expect(clustFeatures.length).toBe(8);
    for (let i = 0; i < clustFeatures.length; i++) {
      expect(Number.isFinite(clustFeatures[i])).toBe(true);
    }
  });

  it("executes rule-based analysis without ONNX provider when sufficient data exists", async () => {
    const engine = createFinancialAnalysisEngine();
    const transactions = [
      {
        id: "inc_1",
        type: "income" as const,
        amount: 100000,
        categoryId: "Salary",
        paymentMethod: "Bank Transfer" as const,
        transactionDate: "2026-05-01",
        description: "Salary",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      ...createMockTransactions(20, 1500), // ₹30,000 expense -> 70% savings rate
    ];

    const result = await engine.analyze({
      transactions,
      period: "2026-05",
    });

    expect(result.dataQuality.coldStart).toBe(false);
    expect(result.dataQuality.sufficientData).toBe(true);
    expect(result.executionMetadata.engineType).toBe("rule_based");
    expect(result.persona).toBeDefined();
    expect(result.persona?.archetype).toBe("Disciplined High Saver");
    expect(result.summary.savingsRate).toBe(70);

    const parsed = MLOutputContractSchema.safeParse(result.structuredPayload);
    expect(parsed.success).toBe(true);
  });

  it("integrates mock ONNX session provider seamlessly", async () => {
    const mockProvider: ONNXInferenceSessionProvider = {
      runAnomalyInference: async () => ({
        label: -1,
        score: -0.25, // Calibrates to high probability anomaly
      }),
      runClusteringInference: async () => ({
        label: 3, // Weekend Lifestyle Spender
        distances: new Float32Array([12.5, 8.4, 6.2, 1.1, 9.7, 5.3]),
      }),
    };

    const engine = new HybridFinancialAnalysisEngine(mockProvider);
    const transactions = createMockTransactions(15, 3000);

    const result = await engine.analyze({
      transactions,
      period: "2026-05",
    });

    expect(result.executionMetadata.engineType).toBe("onnx");
    expect(result.anomaly).toBeDefined();
    expect(result.anomaly?.isAnomalous).toBe(true);
    expect(result.anomaly?.anomalyScore).toBeGreaterThan(0.9);
    expect(result.persona?.archetype).toBe("Weekend Lifestyle Spender");
    expect(result.persona?.clusterId).toBe(3);

    const parsed = MLOutputContractSchema.safeParse(result.structuredPayload);
    expect(parsed.success).toBe(true);
  });

  it("gracefully falls back to hybrid rule-based execution when ONNX provider throws", async () => {
    const failingProvider: ONNXInferenceSessionProvider = {
      runAnomalyInference: async () => {
        throw new Error("WASM memory out of bounds");
      },
      runClusteringInference: async () => {
        throw new Error("Session disposed");
      },
    };

    const engine = new HybridFinancialAnalysisEngine(failingProvider);
    const transactions = createMockTransactions(15, 2000);

    const result = await engine.analyze({
      transactions,
      period: "2026-05",
    });

    expect(result.executionMetadata.engineType).toBe("hybrid");
    expect(result.persona).toBeDefined();
    expect(result.structuredPayload).toBeDefined();

    const parsed = MLOutputContractSchema.safeParse(result.structuredPayload);
    expect(parsed.success).toBe(true);
  });
});
