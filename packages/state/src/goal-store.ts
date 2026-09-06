/**
 * Financial Goals State Store (Zustand)
 * Manages user savings targets, allocated contributions, reductions, allocation history,
 * and enforces the domain invariant: Total allocations <= Current bank balance (Section 8.6 & 80).
 */

import { create } from "zustand";
import type { Goal, GoalAllocation, GoalWithProgress } from "@expense-tracker/domain";

export interface GoalStoreState {
  goals: Goal[];
  allocations: Record<string, number>; // goalId -> total allocated amount
  allocationsHistory: GoalAllocation[];

  // Actions
  setGoals: (
    goals: Goal[],
    allocations?: Record<string, number>,
    history?: GoalAllocation[],
  ) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  allocateToGoal: (allocation: GoalAllocation, bankBalance?: number) => void;
  reduceFromGoal: (
    goalId: string,
    amount: number,
    note?: string,
    allocationDate?: string,
  ) => GoalAllocation;
  deleteAllocation: (allocationId: string) => void;

  // Selectors & Calculations
  getGoalAllocations: (goalId: string) => GoalAllocation[];
  getTotalAllocated: () => number;
  getTotalAllocations: () => number;
  getGoalsWithProgress: () => GoalWithProgress[];
}

export const useGoalStore = create<GoalStoreState>((set, get) => ({
  goals: [],
  allocations: {},
  allocationsHistory: [],

  setGoals: (goals, allocations = {}, history = []) => {
    // If allocations map is empty but history is provided, derive allocations from history
    const computedAllocations = { ...allocations };
    if (Object.keys(computedAllocations).length === 0 && history.length > 0) {
      for (const item of history) {
        computedAllocations[item.goalId] = (computedAllocations[item.goalId] ?? 0) + item.amount;
      }
    }
    set({ goals, allocations: computedAllocations, allocationsHistory: history });
  },

  addGoal: (goal) =>
    set((state) => ({
      goals: [goal, ...state.goals],
    })),

  updateGoal: (id, updates) =>
    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g,
      ),
    })),

  deleteGoal: (id) =>
    set((state) => {
      const newAllocations = { ...state.allocations };
      delete newAllocations[id];
      return {
        goals: state.goals.filter((g) => g.id !== id),
        allocations: newAllocations,
        allocationsHistory: state.allocationsHistory.filter((a) => a.goalId !== id),
      };
    }),

  allocateToGoal: (allocation, bankBalance) => {
    const { allocations, allocationsHistory, getTotalAllocated } = get();
    const currentGoalAllocation = allocations[allocation.goalId] ?? 0;
    const newGoalAllocation = currentGoalAllocation + allocation.amount;

    if (newGoalAllocation < 0) {
      throw new Error(
        `Cannot reduce allocation by ₹${Math.abs(allocation.amount).toLocaleString("en-IN")}. Current goal allocation is only ₹${currentGoalAllocation.toLocaleString("en-IN")}.`,
      );
    }

    if (bankBalance !== undefined && allocation.amount > 0) {
      const totalAllocated = getTotalAllocated();
      const newTotal = totalAllocated + allocation.amount;
      if (newTotal > bankBalance) {
        throw new Error(
          `Cannot allocate ₹${allocation.amount.toLocaleString("en-IN")}. Total allocations (₹${newTotal.toLocaleString("en-IN")}) would exceed bank balance of ₹${bankBalance.toLocaleString("en-IN")}.`,
        );
      }
    }

    set({
      allocations: {
        ...allocations,
        [allocation.goalId]: newGoalAllocation,
      },
      allocationsHistory: [allocation, ...allocationsHistory],
    });
  },

  reduceFromGoal: (goalId, amount, note, allocationDate) => {
    const reductionAmount = -Math.abs(amount);
    const date = allocationDate || new Date().toISOString().slice(0, 10);
    const allocation: GoalAllocation = {
      id: `alloc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      goalId,
      amount: reductionAmount,
      allocationDate: date,
      note: note || "Manual fund reduction",
      createdAt: new Date().toISOString(),
    };

    get().allocateToGoal(allocation);
    return allocation;
  },

  deleteAllocation: (allocationId) => {
    const { allocationsHistory } = get();
    const itemToDelete = allocationsHistory.find((a) => a.id === allocationId);
    if (!itemToDelete) return;

    const remainingHistory = allocationsHistory.filter((a) => a.id !== allocationId);
    const newAllocations: Record<string, number> = {};
    for (const item of remainingHistory) {
      newAllocations[item.goalId] = (newAllocations[item.goalId] ?? 0) + item.amount;
    }

    set({
      allocationsHistory: remainingHistory,
      allocations: newAllocations,
    });
  },

  getGoalAllocations: (goalId) => {
    const { allocationsHistory } = get();
    return allocationsHistory
      .filter((a) => a.goalId === goalId)
      .sort((a, b) => b.allocationDate.localeCompare(a.allocationDate));
  },

  getTotalAllocated: () => {
    const { allocations } = get();
    return Object.values(allocations).reduce((sum, val) => sum + Math.max(0, val), 0);
  },

  getTotalAllocations: () => {
    return get().getTotalAllocated();
  },

  getGoalsWithProgress: () => {
    const { goals, allocations } = get();
    return goals.map((g) => {
      const allocatedAmount = Math.max(0, allocations[g.id] ?? 0);
      const progressPercentage = Math.min(
        100,
        Math.round((allocatedAmount / Math.max(g.targetAmount, 1)) * 100),
      );
      const remainingAmount = Math.max(0, g.targetAmount - allocatedAmount);
      const isCompleted = allocatedAmount >= g.targetAmount || g.status === "completed";
      return {
        ...g,
        allocatedAmount,
        progressPercentage,
        remainingAmount,
        isCompleted,
      };
    });
  },
}));
