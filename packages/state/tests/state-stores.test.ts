import { describe, expect, it, beforeEach } from "vitest";
import type { Transaction, Goal } from "@expense-tracker/domain";
import {
  useTransactionStore,
  useAnalysisStore,
  useGoalStore,
  useSettingsStore,
  selectFilteredTransactions,
} from "../src";

describe("Phase 15: Zustand State Stores", () => {
  beforeEach(() => {
    useTransactionStore.getState().clearTransactions();
    useTransactionStore.getState().resetFilters();
    useAnalysisStore.getState().clearAnalysis();
    useGoalStore.setState({ goals: [], allocations: {} });
  });

  it("adds, updates, deletes, and filters transactions correctly", () => {
    const store = useTransactionStore.getState();

    const t1: Transaction = {
      id: "tx_1",
      type: "income",
      amount: 50000,
      categoryId: "Salary",
      paymentMethod: "Bank Transfer",
      transactionDate: "2026-05-01",
      description: "Monthly Salary",
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const t3: Transaction = {
      id: "tx_3",
      type: "expense",
      amount: 1500,
      categoryId: "Transport",
      paymentMethod: "UPI",
      transactionDate: "2026-06-02",
      description: "Cab Ride",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.setTransactions([t1, t2, t3]);
    expect(useTransactionStore.getState().transactions.length).toBe(3);

    // Period filter "2026-05"
    let filtered = selectFilteredTransactions(useTransactionStore.getState().transactions, {
      ...useTransactionStore.getState().filters,
      period: "2026-05",
    });
    expect(filtered.length).toBe(2);

    // Type filter "expense"
    filtered = selectFilteredTransactions(useTransactionStore.getState().transactions, {
      ...useTransactionStore.getState().filters,
      type: "expense",
    });
    expect(filtered.length).toBe(2);

    // Search query "Cab"
    filtered = selectFilteredTransactions(useTransactionStore.getState().transactions, {
      ...useTransactionStore.getState().filters,
      searchQuery: "Cab",
    });
    expect(filtered.length).toBe(1);
    expect(filtered[0]?.id).toBe("tx_3");

    // Update t2
    useTransactionStore.getState().updateTransaction("tx_2", { amount: 3500 });
    expect(useTransactionStore.getState().transactions.find((t) => t.id === "tx_2")?.amount).toBe(
      3500,
    );

    // Delete t1
    useTransactionStore.getState().deleteTransaction("tx_1");
    expect(useTransactionStore.getState().transactions.length).toBe(2);
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
