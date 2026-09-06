/**
 * Application Settings State Store (Zustand)
 * Manages currency preferences, visual themes, budget thresholds, and local flags.
 */

import { create } from "zustand";

export interface SettingsStoreState {
  currency: string;
  theme: "dark" | "light";
  monthlyIncomeTarget: number;
  savingsRateTarget: number;

  setCurrency: (currency: string) => void;
  setTheme: (theme: "dark" | "light") => void;
  setMonthlyIncomeTarget: (target: number) => void;
  setSavingsRateTarget: (target: number) => void;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  currency: "INR",
  theme: "dark",
  monthlyIncomeTarget: 60000,
  savingsRateTarget: 25,

  setCurrency: (currency) => set({ currency }),
  setTheme: (theme) => set({ theme }),
  setMonthlyIncomeTarget: (monthlyIncomeTarget) => set({ monthlyIncomeTarget }),
  setSavingsRateTarget: (savingsRateTarget) => set({ savingsRateTarget }),
}));
