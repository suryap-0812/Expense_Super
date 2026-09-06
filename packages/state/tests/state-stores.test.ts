import { describe, expect, it, beforeEach } from "vitest";
import type { Transaction, Goal, Category } from "@expense-tracker/domain";
import {
  useTransactionStore,
  useCategoryStore,
  useAnalysisStore,
  useGoalStore,
  useSettingsStore,
  selectFilteredTransactions,
} from "../src";

describe("Phase 19: Transaction & Category State Management", () => {
  beforeEach(() => {
    useTransactionStore.getState().clearTransactions();
    useTransactionStore.getState().resetFilters();
    useCategoryStore.getState().resetToDefault();
    useAnalysisStore.getState().clearAnalysis();
    useGoalStore.setState({ goals: [], allocations: {} });
  });

  it("handles complete transaction CRUD workflow", () => {
    const store = useTransactionStore.getState();

    const t1: Transaction = {
      id: "tx_1",
      type: "income",
      amount: 50000,
      categoryId: "Salary",
      paymentMethod: "Bank Transfer",
      transactionDate: "2026-05-01",
      description: "Monthly Salary",
      notes: "Direct deposit from company",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const t2: Transaction = {
      id: "tx_2",
      type: "expense",
      amount: 3000,
      categoryId: "Food",
      paymentMethod: "UPI",
      transactionDate: "2026-05-05",
      description: "Organic Groceries",
      notes: "Supermarket weekly run",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const t3: Transaction = {
      id: "tx_3",
      type: "expense",
      amount: 1500,
      categoryId: "Transport",
      paymentMethod: "Credit Card",
      transactionDate: "2026-06-02",
      description: "Cab Ride",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.setTransactions([t1, t2, t3]);
    expect(useTransactionStore.getState().transactions.length).toBe(3);

    // Update t2
    useTransactionStore.getState().updateTransaction("tx_2", {
      amount: 3500,
      notes: "Updated groceries total",
    });
    const updated = useTransactionStore.getState().transactions.find((t) => t.id === "tx_2");
    expect(updated?.amount).toBe(3500);
    expect(updated?.notes).toBe("Updated groceries total");

    // Delete t1
    useTransactionStore.getState().deleteTransaction("tx_1");
    expect(useTransactionStore.getState().transactions.length).toBe(2);
    expect(
      useTransactionStore.getState().transactions.find((t) => t.id === "tx_1"),
    ).toBeUndefined();
  });

  it("filters transactions by payment method, category, and date range", () => {
    const transactions: Transaction[] = [
      {
        id: "tx_1",
        type: "income",
        amount: 60000,
        categoryId: "Salary",
        paymentMethod: "Bank Transfer",
        transactionDate: "2026-04-01",
        description: "April Salary",
        createdAt: "2026-04-01T00:00:00Z",
        updatedAt: "2026-04-01T00:00:00Z",
      },
      {
        id: "tx_2",
        type: "expense",
        amount: 2500,
        categoryId: "Dining",
        paymentMethod: "Credit Card",
        transactionDate: "2026-04-10",
        description: "Dinner with friends",
        createdAt: "2026-04-10T00:00:00Z",
        updatedAt: "2026-04-10T00:00:00Z",
      },
      {
        id: "tx_3",
        type: "expense",
        amount: 800,
        categoryId: "Transport",
        paymentMethod: "UPI",
        transactionDate: "2026-04-20",
        description: "Metro card recharge",
        notes: "Card auto-topup",
        createdAt: "2026-04-20T00:00:00Z",
        updatedAt: "2026-04-20T00:00:00Z",
      },
    ];

    // Payment method filter
    const upiOnly = selectFilteredTransactions(transactions, {
      ...useTransactionStore.getState().filters,
      paymentMethod: "UPI",
    });
    expect(upiOnly.length).toBe(1);
    expect(upiOnly[0]?.id).toBe("tx_3");

    // Category filter
    const diningOnly = selectFilteredTransactions(transactions, {
      ...useTransactionStore.getState().filters,
      category: "Dining",
    });
    expect(diningOnly.length).toBe(1);
    expect(diningOnly[0]?.id).toBe("tx_2");

    // Date range filter
    const rangeFiltered = selectFilteredTransactions(transactions, {
      ...useTransactionStore.getState().filters,
      startDate: "2026-04-05",
      endDate: "2026-04-15",
    });
    expect(rangeFiltered.length).toBe(1);
    expect(rangeFiltered[0]?.id).toBe("tx_2");

    // Search query matching notes
    const notesSearch = selectFilteredTransactions(transactions, {
      ...useTransactionStore.getState().filters,
      searchQuery: "auto-topup",
    });
    expect(notesSearch.length).toBe(1);
    expect(notesSearch[0]?.id).toBe("tx_3");
  });

  it("sorts transactions by amount, date, and description", () => {
    const transactions: Transaction[] = [
      {
        id: "tx_1",
        type: "expense",
        amount: 100,
        categoryId: "Food",
        paymentMethod: "Cash",
        transactionDate: "2026-05-10",
        description: "Apple",
        createdAt: "2026-05-10T00:00:00Z",
        updatedAt: "2026-05-10T00:00:00Z",
      },
      {
        id: "tx_2",
        type: "expense",
        amount: 500,
        categoryId: "Food",
        paymentMethod: "Cash",
        transactionDate: "2026-05-01",
        description: "Banana",
        createdAt: "2026-05-01T00:00:00Z",
        updatedAt: "2026-05-01T00:00:00Z",
      },
    ];

    // Amount ascending
    const sortedAmountAsc = selectFilteredTransactions(transactions, {
      ...useTransactionStore.getState().filters,
      sortField: "amount",
      sortOrder: "asc",
    });
    expect(sortedAmountAsc[0]?.amount).toBe(100);

    // Amount descending
    const sortedAmountDesc = selectFilteredTransactions(transactions, {
      ...useTransactionStore.getState().filters,
      sortField: "amount",
      sortOrder: "desc",
    });
    expect(sortedAmountDesc[0]?.amount).toBe(500);

    // Description ascending
    const sortedDescAsc = selectFilteredTransactions(transactions, {
      ...useTransactionStore.getState().filters,
      sortField: "description",
      sortOrder: "asc",
    });
    expect(sortedDescAsc[0]?.description).toBe("Apple");
  });

  it("manages categories correctly in CategoryStore", () => {
    const catStore = useCategoryStore.getState();
    expect(catStore.categories.length).toBeGreaterThan(5);

    const customCategory: Category = {
      id: "cat_custom_crypto",
      name: "Crypto Trading",
      type: "income",
      icon: "bitcoin",
      color: "#f59e0b",
      isPredefined: false,
    };

    catStore.addCategory(customCategory);
    expect(
      useCategoryStore.getState().categories.find((c) => c.id === "cat_custom_crypto"),
    ).toBeDefined();

    const incomeCategories = useCategoryStore.getState().getCategoriesByType("income");
    expect(incomeCategories.some((c) => c.name === "Crypto Trading")).toBe(true);

    useCategoryStore.getState().deleteCategory("cat_custom_crypto");
    expect(
      useCategoryStore.getState().categories.find((c) => c.id === "cat_custom_crypto"),
    ).toBeUndefined();
  });

  it("manages goals and allocations in GoalStore", () => {
    const goal: Goal = {
      id: "goal_1",
      name: "Emergency Fund",
      targetAmount: 100000,
      status: "active",
      deadline: "2026-12-31",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useGoalStore.getState().addGoal(goal);
    expect(useGoalStore.getState().goals.length).toBe(1);

    useGoalStore.getState().allocateToGoal("goal_1", 25000);
    const goalsWithProgress = useGoalStore.getState().getGoalsWithProgress();
    expect(goalsWithProgress[0]?.allocatedAmount).toBe(25000);
    expect(goalsWithProgress[0]?.progressPercentage).toBe(25);
    expect(goalsWithProgress[0]?.isCompleted).toBe(false);
  });

  it("updates settings in SettingsStore", () => {
    expect(useSettingsStore.getState().currency).toBe("INR");
    useSettingsStore.getState().setCurrency("USD");
    expect(useSettingsStore.getState().currency).toBe("USD");
  });
});
