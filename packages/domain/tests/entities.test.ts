import { describe, it, expect } from "vitest";
import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_CATEGORIES,
  DEFAULT_USER_SETTINGS,
  DOMAIN_PACKAGE_VERSION,
} from "../src/index.js";

describe("Domain Entities and Default Seeds", () => {
  it("exports valid version", () => {
    expect(DOMAIN_PACKAGE_VERSION).toBe("0.1.0");
  });

  it("contains all specified default income categories", () => {
    const names = DEFAULT_INCOME_CATEGORIES.map((c) => c.name);
    expect(names).toContain("Salary");
    expect(names).toContain("Freelance");
    expect(names).toContain("Allowance");
    expect(names).toContain("Refund");
    expect(names).toContain("Gift");
    expect(names).toContain("Other Income");
    expect(DEFAULT_INCOME_CATEGORIES.every((c) => c.type === "income")).toBe(true);
  });

  it("contains all specified default expense categories", () => {
    const names = DEFAULT_EXPENSE_CATEGORIES.map((c) => c.name);
    expect(names).toContain("Food");
    expect(names).toContain("Transport");
    expect(names).toContain("Shopping");
    expect(names).toContain("Bills");
    expect(names).toContain("Education");
    expect(names).toContain("Entertainment");
    expect(names).toContain("Healthcare");
    expect(names).toContain("Travel");
    expect(names).toContain("Subscriptions");
    expect(names).toContain("Other Expenses");
    expect(DEFAULT_EXPENSE_CATEGORIES.every((c) => c.type === "expense")).toBe(true);
  });

  it("aggregates all default categories without duplicate IDs", () => {
    expect(DEFAULT_CATEGORIES.length).toBe(
      DEFAULT_INCOME_CATEGORIES.length + DEFAULT_EXPENSE_CATEGORIES.length,
    );
    const idSet = new Set(DEFAULT_CATEGORIES.map((c) => c.id));
    expect(idSet.size).toBe(DEFAULT_CATEGORIES.length);
  });

  it("exports valid default user settings", () => {
    expect(DEFAULT_USER_SETTINGS.currency).toBe("INR");
    expect(DEFAULT_USER_SETTINGS.currencySymbol).toBe("₹");
    expect(DEFAULT_USER_SETTINGS.terminology).toBe("default");
    expect(DEFAULT_USER_SETTINGS.theme).toBe("system");
    expect(DEFAULT_USER_SETTINGS.llmProvider).toBe("openrouter");
    expect(DEFAULT_USER_SETTINGS.anomaliesThreshold).toBeGreaterThan(0);
  });
});
