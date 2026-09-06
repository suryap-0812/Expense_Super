/**
 * Financial Goals State Store (Zustand)
 * Manages user savings targets, allocated contributions, and goal completion trajectories.
 */

import { create } from "zustand";
import type { Goal, GoalWithProgress } from "@expense-tracker/domain";

export interface GoalStoreState {
  goals: Goal[];
  allocations: Record<string, number>; // goalId -> total allocated amount

  setGoals: (goals: Goal[], allocations?: Record<string, number>) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  allocateToGoal: (id: string, amount: number) => void;
  getGoalsWithProgress: () => GoalWithProgress[];
}

export const useGoalStore = create<GoalStoreState>((set, get) => ({
  goals: [],
  allocations: {},

  setGoals: (goals, allocations = {}) => set({ goals, allocations }),

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
      };
    }),

  allocateToGoal: (id, amount) =>
    set((state) => ({
      allocations: {
        ...state.allocations,
        [id]: (state.allocations[id] ?? 0) + amount,
      },
    })),

  getGoalsWithProgress: () => {
    const { goals, allocations } = get();
    return goals.map((g) => {
      const allocatedAmount = allocations[g.id] ?? 0;
      const progressPercentage = Math.min(
        100,
        Math.round((allocatedAmount / Math.max(g.targetAmount, 1)) * 100),
      );
      const remainingAmount = Math.max(0, g.targetAmount - allocatedAmount);
      const isCompleted = allocatedAmount >= g.targetAmount;
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
