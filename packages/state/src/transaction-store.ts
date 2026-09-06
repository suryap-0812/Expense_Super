/**
 * Transaction State Store (Zustand)
 * Manages reactive transaction collections, filtering, sorting, and period partitioning.
 */

import { create } from "zustand";
import type { Transaction } from "@expense-tracker/domain";

export type TransactionFilterType = "all" | "income" | "expense";
export type TransactionSortField = "date" | "amount" | "category";
export type TransactionSortOrder = "asc" | "desc";

export interface TransactionFilterState {
  period: string; // "YYYY-MM" or "all-time"
  category: string | null;
  searchQuery: string;
  type: TransactionFilterType;
  sortField: TransactionSortField;
  sortOrder: TransactionSortOrder;
}

export interface TransactionStoreState {
  transactions: Transaction[];
  filters: TransactionFilterState;

  // Actions
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  clearTransactions: () => void;

  setPeriod: (period: string) => void;
  setCategoryFilter: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  setTypeFilter: (type: TransactionFilterType) => void;
  setSorting: (field: TransactionSortField, order: TransactionSortOrder) => void;
  resetFilters: () => void;
}

const initialFilters: TransactionFilterState = {
  period: "all-time",
  category: null,
  searchQuery: "",
  type: "all",
  sortField: "date",
  sortOrder: "desc",
};

export const useTransactionStore = create<TransactionStoreState>((set) => ({
  transactions: [],
  filters: initialFilters,

  setTransactions: (transactions) => set({ transactions }),

  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),

  updateTransaction: (id, updates) =>
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  deleteTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    })),

  clearTransactions: () => set({ transactions: [] }),

  setPeriod: (period) =>
    set((state) => ({
      filters: { ...state.filters, period },
    })),

  setCategoryFilter: (category) =>
    set((state) => ({
      filters: { ...state.filters, category },
    })),

  setSearchQuery: (searchQuery) =>
    set((state) => ({
      filters: { ...state.filters, searchQuery },
    })),

  setTypeFilter: (type) =>
    set((state) => ({
      filters: { ...state.filters, type },
    })),

  setSorting: (sortField, sortOrder) =>
    set((state) => ({
      filters: { ...state.filters, sortField, sortOrder },
    })),

  resetFilters: () => set({ filters: initialFilters }),
}));

/**
 * Selector helper deriving filtered and sorted transactions from store.
 */
export function selectFilteredTransactions(
  transactions: ReadonlyArray<Transaction>,
  filters: TransactionFilterState,
): Transaction[] {
  return transactions
    .filter((tx) => {
      // 1. Period filter
      if (filters.period !== "all-time") {
        if (!tx.transactionDate.startsWith(filters.period)) {
          return false;
        }
      }

      // 2. Type filter
      if (filters.type !== "all" && tx.type !== filters.type) {
        return false;
      }

      // 3. Category filter
      if (filters.category && tx.categoryId.toLowerCase() !== filters.category.toLowerCase()) {
        return false;
      }

      // 4. Search query
      if (filters.searchQuery.trim().length > 0) {
        const query = filters.searchQuery.toLowerCase();
        const descMatch = tx.description.toLowerCase().includes(query);
        const catMatch = tx.categoryId.toLowerCase().includes(query);
        const methodMatch = tx.paymentMethod.toLowerCase().includes(query);
        const amountMatch = String(tx.amount).includes(query);
        if (!descMatch && !catMatch && !methodMatch && !amountMatch) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (filters.sortField === "date") {
        comparison = a.transactionDate.localeCompare(b.transactionDate);
      } else if (filters.sortField === "amount") {
        comparison = a.amount - b.amount;
      } else if (filters.sortField === "category") {
        comparison = a.categoryId.localeCompare(b.categoryId);
      }

      return filters.sortOrder === "asc" ? comparison : -comparison;
    });
}
