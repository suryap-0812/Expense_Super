/**
 * Bank Balance State Store (Zustand)
 * Manages the authoritative manual current bank balance and balance history.
 * Adheres strictly to Section 8.5 & 79: Bank balance is manual and authoritative,
 * never automatically calculated from transaction history.
 */

import { create } from "zustand";
import type { BalanceRecord } from "@expense-tracker/domain";

export interface BalanceStoreState {
  currentBalance: number;
  balanceHistory: BalanceRecord[];

  // Actions
  setBalanceHistory: (records: BalanceRecord[]) => void;
  addBalanceRecord: (record: BalanceRecord) => void;
  updateBalanceRecord: (id: string, updates: Partial<BalanceRecord>) => void;
  deleteBalanceRecord: (id: string) => void;
  setCurrentBalance: (balance: number) => void;
  clearBalanceHistory: () => void;

  // Selectors
  getLatestBalanceRecord: () => BalanceRecord | null;
  getUnallocatedCash: (totalGoalAllocations: number) => number;
}

function sortRecords(records: BalanceRecord[]): BalanceRecord[] {
  return [...records].sort((a, b) => {
    const dateComp = b.recordedAt.localeCompare(a.recordedAt);
    if (dateComp !== 0) return dateComp;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export const useBalanceStore = create<BalanceStoreState>((set, get) => ({
  currentBalance: 0,
  balanceHistory: [],

  setBalanceHistory: (records) => {
    const sorted = sortRecords(records);
    const latest = sorted[0];
    set({
      balanceHistory: sorted,
      currentBalance: latest ? latest.balance : 0,
    });
  },

  addBalanceRecord: (record) =>
    set((state) => {
      const updated = sortRecords([record, ...state.balanceHistory]);
      const latest = updated[0];
      return {
        balanceHistory: updated,
        currentBalance: latest ? latest.balance : record.balance,
      };
    }),

  updateBalanceRecord: (id, updates) =>
    set((state) => {
      const updated = sortRecords(
        state.balanceHistory.map((rec) => (rec.id === id ? { ...rec, ...updates } : rec)),
      );
      const latest = updated[0];
      return {
        balanceHistory: updated,
        currentBalance: latest ? latest.balance : 0,
      };
    }),

  deleteBalanceRecord: (id) =>
    set((state) => {
      const updated = state.balanceHistory.filter((rec) => rec.id !== id);
      const latest = updated[0];
      return {
        balanceHistory: updated,
        currentBalance: latest ? latest.balance : 0,
      };
    }),

  setCurrentBalance: (balance) => set({ currentBalance: Math.max(0, balance) }),

  clearBalanceHistory: () => set({ balanceHistory: [], currentBalance: 0 }),

  getLatestBalanceRecord: () => {
    const { balanceHistory } = get();
    return balanceHistory[0] ?? null;
  },

  getUnallocatedCash: (totalGoalAllocations: number) => {
    const { currentBalance } = get();
    return Math.max(0, currentBalance - Math.max(0, totalGoalAllocations));
  },
}));
