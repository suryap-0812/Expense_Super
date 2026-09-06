import React from "react";
import { PieChart } from "lucide-react";
import { Card, Badge } from "@expense-tracker/ui";
import {
  generateFinancialAnalytics,
  generatePatternAnalysisReport,
} from "@expense-tracker/analytics";
import type { Transaction } from "@expense-tracker/domain";

import type { CategorySpendingItem } from "@expense-tracker/analytics";
import type { FinancialAnalysisResult } from "@expense-tracker/ml-contract";

export interface AnalyticsSectionProps {
  transactions?: Transaction[];
  analysis?: FinancialAnalysisResult | null;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ transactions = [] }) => {
  const analytics = React.useMemo(() => generateFinancialAnalytics(transactions), [transactions]);

  const patterns = React.useMemo(() => generatePatternAnalysisReport(transactions), [transactions]);

  const topCategories: CategorySpendingItem[] = analytics.categorySpending.slice(0, 5);
  const weekendPct = Math.round(patterns.weekendBehavior.weekendSpendingRatio * 100);

  return (
    <Card
      variant="glass"
      padding="md"
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <PieChart size={18} color="#06b6d4" />
          <h2 style={{ fontSize: "1.05rem", margin: 0 }}>Spending Distribution & Patterns</h2>
        </div>
        <Badge variant="neutral" size="sm">
          {analytics.categorySpending.length} Categories
        </Badge>
      </div>

      {/* Category Spending Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {topCategories.map((cat, idx) => (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}
            >
              <span style={{ fontWeight: 500, color: "#f8fafc" }}>{cat.category}</span>
              <span className="num-mono" style={{ color: "var(--text-secondary)" }}>
                ₹{cat.amount.toLocaleString("en-IN")} ({cat.percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, cat.percentage))}%`,
                  background:
                    idx === 0
                      ? "linear-gradient(90deg, #6366f1, #8b5cf6)"
                      : idx === 1
                        ? "linear-gradient(90deg, #06b6d4, #3b82f6)"
                        : "linear-gradient(90deg, #10b981, #059669)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Behavioral Diagnostics Mini Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
          marginTop: "0.5rem",
        }}
      >
        <div
          style={{
            background: "rgba(0, 0, 0, 0.25)",
            borderRadius: "0.5rem",
            padding: "0.75rem",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>Weekend Spend</div>
          <div
            style={{ fontSize: "1.125rem", fontWeight: 700, marginTop: "0.15rem" }}
            className="num-mono"
          >
            {weekendPct}%
          </div>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
            {weekendPct >= 40 ? "High weekend skew" : "Balanced schedule"}
          </div>
        </div>

        <div
          style={{
            background: "rgba(0, 0, 0, 0.25)",
            borderRadius: "0.5rem",
            padding: "0.75rem",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>Txn Frequency</div>
          <div
            style={{ fontSize: "1.125rem", fontWeight: 700, marginTop: "0.15rem" }}
            className="num-mono"
          >
            {patterns.transactionFrequency.dailyVelocity.toFixed(1)} / day
          </div>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
            {patterns.transactionFrequency.activeDaysCount} active days
          </div>
        </div>
      </div>
    </Card>
  );
};
