/**
 * Category State Store (Zustand)
 * Manages category state, custom user categories, and category filtering helpers.
 */

import { create } from "zustand";
import { type Category, type CategoryType, DEFAULT_CATEGORIES } from "@expense-tracker/domain";

export interface CategoryStoreState {
  categories: Category[];

  // Actions
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  resetToDefault: () => void;

  // Selectors
  getCategoriesByType: (type: CategoryType | "all") => Category[];
  getCategoryById: (id: string) => Category | undefined;
}

export const useCategoryStore = create<CategoryStoreState>((set, get) => ({
  categories: [...DEFAULT_CATEGORIES],

  setCategories: (categories) => set({ categories }),

  addCategory: (category) =>
    set((state) => ({
      categories: [...state.categories, category],
    })),

  updateCategory: (id, updates) =>
    set((state) => ({
      categories: state.categories.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)),
    })),

  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((cat) => cat.id !== id),
    })),

  resetToDefault: () => set({ categories: [...DEFAULT_CATEGORIES] }),

  getCategoriesByType: (type) => {
    const { categories } = get();
    if (type === "all") return categories;
    return categories.filter((cat) => cat.type === type || cat.type === "both");
  },

  getCategoryById: (id) => {
    const { categories } = get();
    return categories.find((cat) => cat.id === id || cat.name.toLowerCase() === id.toLowerCase());
  },
}));
