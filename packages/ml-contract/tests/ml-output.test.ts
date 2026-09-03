import { describe, expect, it } from "vitest";
import type { Transaction } from "@expense-tracker/domain";
import { MLOutputContractSchema } from "@expense-tracker/schemas";
import { generateStructuredMLOutput } from "../src/generator";

describe("Phase 10: Structured ML Output Generator", () => {
  it("handles empty transaction history safely", () => {
    const output = generateStructuredMLOutput([]);

    expect(output.schema_version).toBe("1.0");
    expect(output.period).toBe("all-time");
    expect(output.data_quality.transaction_count).toBe(0);
    expect(output.data_quality.sufficient_data).toBe(false);
    expect(output.summary.total_income).toBe(0);
    expect(output.summary.total_expense).toBe(0);
    expect(output.insights).toEqual([]);

    // Validate Zod contract
    const parsed = MLOutputContractSchema.safeParse(output);
    expect(parsed.success).toBe(true);
  });

  it("generates evidence-backed category increase and decline insights", () => {
    const transactions: Transaction[] = [
      // Month 1
      {
        id: "m1_1",
        type: "income",
        amount: 60000,
        categoryId: "Salary",
        paymentMethod: "Bank Transfer",
        transactionDate: "2026-01-01",
        description: "Jan Salary",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "m1_2",
        type: "expense",
        amount: 5000,
        categoryId: "Food",
        paymentMethod: "UPI",
        transactionDate: "2026-01-10",
        description: "Groceries",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "m1_3",
        type: "expense",
        amount: 10000,
        categoryId: "Shopping",
        paymentMethod: "Credit Card",
        transactionDate: "2026-01-15",
        description: "Clothes",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Month 2
      {
        id: "m2_1",
        type: "income",
        amount: 60000,
        categoryId: "Salary",
        paymentMethod: "Bank Transfer",
        transactionDate: "2026-02-01",
        description: "Feb Salary",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "m2_2",
        type: "expense",
        amount: 12000,
        categoryId: "Food", // +140% growth (+₹7000)
        paymentMethod: "UPI",
        transactionDate: "2026-02-10",
        description: "Dining & Groceries",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "m2_3",
        type: "expense",
        amount: 2000,
        categoryId: "Shopping", // -80% decline (-₹8000)
        paymentMethod: "Credit Card",
        transactionDate: "2026-02-15",
        description: "Small accessories",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Extra transactions to reach sufficient data count
      ...Array.from({ length: 6 }, (_, i) => ({
        id: `m2_extra_${i}`,
        type: "expense" as const,
        amount: 500,
        categoryId: "Transport",
        paymentMethod: "UPI" as const,
        transactionDate: "2026-02-20",
        description: `Fuel ${i}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    ];

    const output = generateStructuredMLOutput(transactions, { period: "2026-02" });

    expect(output.period).toBe("2026-02");
    expect(output.data_quality.transaction_count).toBe(12);
    expect(output.data_quality.sufficient_data).toBe(true);

    const growthInsight = output.insights.find((i) => i.type === "category_increase");
    expect(growthInsight).toBeDefined();
    expect(growthInsight?.category).toBe("Food");
    expect(growthInsight?.evidence.observed_value).toBe(12000);
    expect(growthInsight?.evidence.baseline_value).toBe(5000);
    expect(growthInsight?.evidence.delta_percentage).toBe(140);

    const declineInsight = output.insights.find((i) => i.type === "category_decline");
    expect(declineInsight).toBeDefined();
    expect(declineInsight?.category).toBe("Shopping");
    expect(declineInsight?.evidence.observed_value).toBe(2000);
    expect(declineInsight?.evidence.baseline_value).toBe(10000);

    // Assert schema validity
    const parsed = MLOutputContractSchema.safeParse(output);
    expect(parsed.success).toBe(true);
  });

  it("integrates anomaly inference and behavioral persona context", () => {
    const transactions: Transaction[] = Array.from({ length: 15 }, (_, i) => ({
      id: `tx_${i}`,
      type: "expense" as const,
      amount: 2000,
      categoryId: "Shopping",
      paymentMethod: "UPI" as const,
      transactionDate: "2026-05-10",
      description: `Purchase ${i}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const output = generateStructuredMLOutput(transactions, {
      period: "2026-05",
      anomalyInference: {
        is_anomaly: true,
        anomaly_score: 0.88,
        severity: "critical",
        contributing_features: [
          { feature: "shopping_ratio", value: 0.75, baseline_mean: 0.168, z_score: 3.45 },
        ],
      },
      clusterInference: {
        cluster_id: 3,
        archetype: "Discretionary Overspender",
        description: "High discretionary expenditure exceeding savings targets.",
        confidence: 0.95,
      },
    });

    expect(output.persona).toBeDefined();
    expect(output.persona?.archetype).toBe("Discretionary Overspender");
    expect(output.persona?.cluster_id).toBe(3);

    const anomalyInsight = output.insights.find((i) => i.type === "spending_anomaly");
    expect(anomalyInsight).toBeDefined();
    expect(anomalyInsight?.severity).toBe("critical");
    expect(anomalyInsight?.score).toBe(0.88);
    expect(anomalyInsight?.evidence.metric_name).toBe("shopping_ratio");
    expect(anomalyInsight?.evidence.z_score).toBe(3.45);

    // Validate Zod contract
    const parsed = MLOutputContractSchema.safeParse(output);
    expect(parsed.success).toBe(true);
  });

  it("detects high weekend concentration and flurry bursts", () => {
    // 2026-05-02 is Saturday (weekend)
    // 2026-05-03 is Sunday (weekend)
    const transactions: Transaction[] = [
      // Weekday
      {
        id: "w1",
        type: "expense",
        amount: 1000,
        categoryId: "Transport",
        paymentMethod: "Cash",
        transactionDate: "2026-05-01", // Friday
        description: "Commute",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Weekend burst: 6 transactions on Saturday totaling ₹15,000
      ...Array.from({ length: 6 }, (_, i) => ({
        id: `sat_${i}`,
        type: "expense" as const,
        amount: 2500,
        categoryId: "Dining",
        paymentMethod: "Credit Card" as const,
        transactionDate: "2026-05-02", // Saturday
        description: `Weekend Event ${i}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      // Sunday
      {
        id: "sun_1",
        type: "expense",
        amount: 4000,
        categoryId: "Entertainment",
        paymentMethod: "Credit Card",
        transactionDate: "2026-05-03", // Sunday
        description: "Concert",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Remaining transactions to fulfill threshold
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `w_extra_${i}`,
        type: "expense" as const,
        amount: 500,
        categoryId: "Food",
        paymentMethod: "UPI" as const,
        transactionDate: "2026-05-04", // Monday
        description: "Snack",
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    ];

    const output = generateStructuredMLOutput(transactions);

    const weekendInsight = output.insights.find((i) => i.type === "weekend_concentration");
    expect(weekendInsight).toBeDefined();
    expect(weekendInsight?.evidence.metric_name).toBe("weekend_spending_ratio");

    const burstInsight = output.insights.find((i) => i.type === "transaction_burst");
    expect(burstInsight).toBeDefined();
    expect(burstInsight?.evidence.metric_name).toBe("daily_burst_count");
    expect(burstInsight?.value).toBe(6);

    // Validate Zod contract
    const parsed = MLOutputContractSchema.safeParse(output);
    expect(parsed.success).toBe(true);
  });
});
