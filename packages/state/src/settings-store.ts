/**
 * Application Settings State Store (Zustand)
 * Manages currency preferences, visual themes, budget thresholds, and local API keys (Section 34, 74 & 87).
 */

import { create } from "zustand";
import { maskApiKey } from "@expense-tracker/utils";

export interface SettingsStoreState {
  currency: string;
  theme: "dark" | "light";
  monthlyIncomeTarget: number;
  savingsRateTarget: number;
  openRouterApiKey: string | null;

  setCurrency: (currency: string) => void;
  setTheme: (theme: "dark" | "light") => void;
  setMonthlyIncomeTarget: (target: number) => void;
  setSavingsRateTarget: (target: number) => void;
  setOpenRouterApiKey: (key: string | null) => void;
  getMaskedApiKey: () => string;
  clearApiKey: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  currency: "INR",
  theme: "dark",
  monthlyIncomeTarget: 60000,
  savingsRateTarget: 25,
  openRouterApiKey: null,

  setCurrency: (currency) => set({ currency }),
  setTheme: (theme) => set({ theme }),
  setMonthlyIncomeTarget: (monthlyIncomeTarget) => set({ monthlyIncomeTarget }),
  setSavingsRateTarget: (savingsRateTarget) => set({ savingsRateTarget }),
  setOpenRouterApiKey: (openRouterApiKey) =>
    set({ openRouterApiKey: openRouterApiKey?.trim() || null }),
  getMaskedApiKey: () => maskApiKey(get().openRouterApiKey),
  clearApiKey: () => set({ openRouterApiKey: null }),
}));
