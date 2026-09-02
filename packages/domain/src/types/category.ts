/**
 * Category Domain Entity and Default Categories
 */

export type CategoryType = "income" | "expense" | "both";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  isPredefined: boolean;
}

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
}

/**
 * Standard default categories as specified in Section 10 of Project Specifications.
 */
export const DEFAULT_INCOME_CATEGORIES: ReadonlyArray<Category> = [
  {
    id: "cat_inc_salary",
    name: "Salary",
    type: "income",
    icon: "briefcase",
    color: "#10B981",
    isPredefined: true,
  },
  {
    id: "cat_inc_freelance",
    name: "Freelance",
    type: "income",
    icon: "laptop",
    color: "#059669",
    isPredefined: true,
  },
  {
    id: "cat_inc_allowance",
    name: "Allowance",
    type: "income",
    icon: "gift",
    color: "#34D399",
    isPredefined: true,
  },
  {
    id: "cat_inc_refund",
    name: "Refund",
    type: "income",
    icon: "arrow-down-left",
    color: "#6EE7B7",
    isPredefined: true,
  },
  {
    id: "cat_inc_gift",
    name: "Gift",
    type: "income",
    icon: "heart",
    color: "#A7F3D0",
    isPredefined: true,
  },
  {
    id: "cat_inc_other",
    name: "Other Income",
    type: "income",
    icon: "plus-circle",
    color: "#64748B",
    isPredefined: true,
  },
];

export const DEFAULT_EXPENSE_CATEGORIES: ReadonlyArray<Category> = [
  {
    id: "cat_exp_food",
    name: "Food",
    type: "expense",
    icon: "utensils",
    color: "#F59E0B",
    isPredefined: true,
  },
  {
    id: "cat_exp_transport",
    name: "Transport",
    type: "expense",
    icon: "car",
    color: "#3B82F6",
    isPredefined: true,
  },
  {
    id: "cat_exp_shopping",
    name: "Shopping",
    type: "expense",
    icon: "shopping-bag",
    color: "#EC4899",
    isPredefined: true,
  },
  {
    id: "cat_exp_bills",
    name: "Bills",
    type: "expense",
    icon: "file-text",
    color: "#EF4444",
    isPredefined: true,
  },
  {
    id: "cat_exp_education",
    name: "Education",
    type: "expense",
    icon: "book-open",
    color: "#8B5CF6",
    isPredefined: true,
  },
  {
    id: "cat_exp_entertainment",
    name: "Entertainment",
    type: "expense",
    icon: "film",
    color: "#6366F1",
    isPredefined: true,
  },
  {
    id: "cat_exp_healthcare",
    name: "Healthcare",
    type: "expense",
    icon: "activity",
    color: "#14B8A6",
    isPredefined: true,
  },
  {
    id: "cat_exp_travel",
    name: "Travel",
    type: "expense",
    icon: "map-pin",
    color: "#06B6D4",
    isPredefined: true,
  },
  {
    id: "cat_exp_subscriptions",
    name: "Subscriptions",
    type: "expense",
    icon: "repeat",
    color: "#F97316",
    isPredefined: true,
  },
  {
    id: "cat_exp_other",
    name: "Other Expenses",
    type: "expense",
    icon: "tag",
    color: "#94A3B8",
    isPredefined: true,
  },
];

export const DEFAULT_CATEGORIES: ReadonlyArray<Category> = [
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
];
