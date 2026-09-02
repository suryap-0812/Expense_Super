import { describe, it, expect } from "vitest";
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  CreateCategorySchema,
  CreateGoalSchema,
  CreateGoalAllocationSchema,
  CreateBalanceRecordSchema,
  MLInputContractSchema,
  MLOutputContractSchema,
  LLMGuidanceResponseSchema,
  parseLLMResponseSafe,
  UserSettingsSchema,
  DataExportSchema,
} from "../src/index.js";

describe("Zod Runtime Validation Schemas", () => {
  describe("Transaction Schemas", () => {
    it("validates valid transaction input", () => {
      const valid = {
        type: "expense",
        amount: 850.5,
        categoryId: "cat_exp_food",
        description: "Lunch with colleagues",
        paymentMethod: "UPI",
        transactionDate: "2026-05-14",
        notes: "Optional note",
      };
      const result = CreateTransactionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects non-positive amounts (amount <= 0)", () => {
      const zeroAmount = {
        type: "expense",
        amount: 0,
        categoryId: "cat_exp_food",
        description: "Test",
        paymentMethod: "UPI",
        transactionDate: "2026-05-14",
      };
      expect(CreateTransactionSchema.safeParse(zeroAmount).success).toBe(false);

      const negativeAmount = { ...zeroAmount, amount: -100 };
      expect(CreateTransactionSchema.safeParse(negativeAmount).success).toBe(false);
    });

    it("rejects amounts with more than 2 decimal places", () => {
      const invalidDecimal = {
        type: "income",
        amount: 100.123,
        categoryId: "cat_inc_salary",
        description: "Salary",
        paymentMethod: "Bank Transfer",
        transactionDate: "2026-05-01",
      };
      const result = CreateTransactionSchema.safeParse(invalidDecimal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("2 decimal places");
      }
    });

    it("rejects invalid date formats or impossible calendar dates", () => {
      const base = {
        type: "expense",
        amount: 50,
        categoryId: "cat_exp_food",
        description: "Snack",
        paymentMethod: "Cash",
      };

      expect(
        CreateTransactionSchema.safeParse({ ...base, transactionDate: "14-05-2026" }).success,
      ).toBe(false);
      expect(
        CreateTransactionSchema.safeParse({ ...base, transactionDate: "2026-02-31" }).success,
      ).toBe(false);
      expect(
        CreateTransactionSchema.safeParse({ ...base, transactionDate: "invalid" }).success,
      ).toBe(false);
    });

    it("rejects empty update transaction inputs", () => {
      const emptyUpdate = {};
      const result = UpdateTransactionSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("Category Schemas", () => {
    it("validates valid category input with optional color and icon", () => {
      const valid = {
        name: "Groceries",
        type: "expense",
        icon: "shopping-cart",
        color: "#10B981",
      };
      expect(CreateCategorySchema.safeParse(valid).success).toBe(true);
    });

    it("rejects invalid hex color strings", () => {
      const invalid = {
        name: "Groceries",
        type: "expense",
        color: "red", // not hex
      };
      expect(CreateCategorySchema.safeParse(invalid).success).toBe(false);
    });

    it("rejects empty category name", () => {
      const invalid = {
        name: "   ",
        type: "income",
      };
      expect(CreateCategorySchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("Goal & Allocation Schemas", () => {
    it("validates valid goal creation", () => {
      const valid = {
        name: "Emergency Fund",
        targetAmount: 100000,
        deadline: "2026-12-31",
        description: "6 months of living expenses",
      };
      const result = CreateGoalSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("active"); // default
      }
    });

    it("rejects target amount <= 0", () => {
      const invalid = {
        name: "Emergency Fund",
        targetAmount: 0,
      };
      expect(CreateGoalSchema.safeParse(invalid).success).toBe(false);
    });

    it("validates valid allocation (positive and negative delta)", () => {
      const positive = {
        goalId: "goal_emergency",
        amount: 15000,
        allocationDate: "2026-05-15",
        note: "May allocation",
      };
      expect(CreateGoalAllocationSchema.safeParse(positive).success).toBe(true);

      const negative = {
        goalId: "goal_emergency",
        amount: -5000,
        allocationDate: "2026-05-20",
        note: "Emergency withdrawal",
      };
      expect(CreateGoalAllocationSchema.safeParse(negative).success).toBe(true);
    });

    it("rejects allocation amount of exactly 0", () => {
      const zero = {
        goalId: "goal_emergency",
        amount: 0,
        allocationDate: "2026-05-15",
      };
      expect(CreateGoalAllocationSchema.safeParse(zero).success).toBe(false);
    });
  });

  describe("Balance Record Schemas", () => {
    it("validates non-negative bank balance updates", () => {
      const valid = {
        balance: 50000.75,
        recordedAt: "2026-05-15",
        note: "Verified via banking app",
      };
      expect(CreateBalanceRecordSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects negative bank balances", () => {
      const negative = {
        balance: -50,
        recordedAt: "2026-05-15",
      };
      expect(CreateBalanceRecordSchema.safeParse(negative).success).toBe(false);
    });
  });

  describe("ML Contract Schemas (Section 29)", () => {
    it("validates standard ML input contract", () => {
      const mlInput = {
        schema_version: "1.0",
        period: "2026-05",
        features: {
          average_monthly_income: 30000,
          average_monthly_expense: 22000,
          savings_rate: 26.67,
          shopping_ratio: 0.22,
          weekend_spending_ratio: 0.41,
        },
      };
      const result = MLInputContractSchema.safeParse(mlInput);
      expect(result.success).toBe(true);
    });

    it("validates standard ML output contract", () => {
      const mlOutput = {
        schema_version: "1.0",
        period: "2026-05",
        data_quality: {
          transaction_count: 87,
          sufficient_data: true,
        },
        insights: [
          {
            type: "category_increase",
            category: "Shopping",
            value: 31.4,
            unit: "percent",
            severity: "medium",
          },
          {
            type: "spending_anomaly",
            category: "Shopping",
            amount: 8500,
            severity: "high",
          },
          {
            type: "savings_decline",
            value: -8.7,
            unit: "percent",
            severity: "medium",
          },
        ],
      };
      const result = MLOutputContractSchema.safeParse(mlOutput);
      expect(result.success).toBe(true);
    });

    it("rejects invalid severity levels in ML output", () => {
      const invalid = {
        schema_version: "1.0",
        period: "2026-05",
        data_quality: { transaction_count: 10, sufficient_data: true },
        insights: [
          {
            type: "anomaly",
            severity: "super-extreme", // invalid
          },
        ],
      };
      expect(MLOutputContractSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("LLM Contract Schemas & Safe Parser (Sections 36 & 37)", () => {
    const validLLMResponse = {
      summary: "Your spending increased by 31.4% in Shopping this month.",
      findings: [
        {
          title: "Shopping Anomaly",
          evidence: "High expense of ₹8,500 on May 12.",
          explanation: "This single transaction was 4x your typical shopping expense.",
          recommendation: "Review whether this was a planned one-off purchase.",
          priority: "medium",
        },
      ],
    };

    it("validates direct structured LLM response object", () => {
      expect(LLMGuidanceResponseSchema.safeParse(validLLMResponse).success).toBe(true);
    });

    it("parseLLMResponseSafe correctly parses markdown code-fenced JSON strings", () => {
      const fencedString = `\`\`\`json
${JSON.stringify(validLLMResponse, null, 2)}
\`\`\``;

      const result = parseLLMResponseSafe(fencedString);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.findings.length).toBe(1);
        expect(result.data.findings[0]?.priority).toBe("medium");
      }
    });

    it("parseLLMResponseSafe safely catches non-JSON text without throwing", () => {
      const nonJson = "Hello! I am Claude and here is some unstructured advice for you.";
      const result = parseLLMResponseSafe(nonJson);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not valid JSON");
      }
    });

    it("parseLLMResponseSafe safely catches malformed payload schema without throwing", () => {
      const malformed = {
        summary: "Incomplete object",
        findings: [
          {
            title: "Missing fields",
          },
        ],
      };
      const result = parseLLMResponseSafe(malformed);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("failed schema validation");
      }
    });
  });

  describe("User Settings Schemas", () => {
    it("applies defaults when empty object provided", () => {
      const result = UserSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe("INR");
        expect(result.data.currencySymbol).toBe("₹");
        expect(result.data.theme).toBe("system");
        expect(result.data.anomaliesThreshold).toBe(0.05);
      }
    });

    it("rejects anomaly threshold <= 0 or > 1", () => {
      expect(UserSettingsSchema.safeParse({ anomaliesThreshold: 0 }).success).toBe(false);
      expect(UserSettingsSchema.safeParse({ anomaliesThreshold: -0.1 }).success).toBe(false);
      expect(UserSettingsSchema.safeParse({ anomaliesThreshold: 1.5 }).success).toBe(false);
      expect(UserSettingsSchema.safeParse({ anomaliesThreshold: 0.1 }).success).toBe(true);
    });
  });

  describe("Data Export / Import Schema", () => {
    it("validates complete backup archive", () => {
      const backup = {
        version: "1.0",
        exportedAt: "2026-05-15T12:00:00.000Z",
        transactions: [
          {
            id: "tx_1",
            type: "income",
            amount: 50000,
            categoryId: "cat_inc_salary",
            description: "Salary",
            paymentMethod: "Bank Transfer",
            transactionDate: "2026-05-01",
            createdAt: "2026-05-01T10:00:00.000Z",
            updatedAt: "2026-05-01T10:00:00.000Z",
          },
        ],
        categories: [
          {
            id: "cat_inc_salary",
            name: "Salary",
            type: "income",
            isPredefined: true,
          },
        ],
        goals: [
          {
            id: "goal_1",
            name: "Emergency Fund",
            targetAmount: 50000,
            status: "active",
            createdAt: "2026-05-01T10:00:00.000Z",
            updatedAt: "2026-05-01T10:00:00.000Z",
          },
        ],
        goalAllocations: [
          {
            id: "alloc_1",
            goalId: "goal_1",
            amount: 10000,
            allocationDate: "2026-05-02",
            createdAt: "2026-05-02T10:00:00.000Z",
          },
        ],
        balanceHistory: [
          {
            id: "bal_1",
            balance: 50000,
            recordedAt: "2026-05-01",
            createdAt: "2026-05-01T10:00:00.000Z",
          },
        ],
        settings: {
          currency: "INR",
          currencySymbol: "₹",
          theme: "system",
          terminology: "default",
          llmProvider: "openrouter",
          llmModel: "anthropic/claude-3.5-sonnet",
          notificationsEnabled: true,
          anomaliesThreshold: 0.05,
        },
      };

      const result = DataExportSchema.safeParse(backup);
      expect(result.success).toBe(true);
    });
  });
});
