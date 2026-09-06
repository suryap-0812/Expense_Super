import React from "react";
import { TrendingUp, Activity, BarChart2 } from "lucide-react";
import { Card, Badge } from "@expense-tracker/ui";
import {
  generateFinancialAnalytics,
  type MonthlySpendingPoint,
  type MonthlySavingsPoint,
} from "@expense-tracker/analytics";
import type { Transaction } from "@expense-tracker/domain";

export interface SpendingTrendsSectionProps {
  transactions: Transaction[];
}

export const SpendingTrendsSection: React.FC<SpendingTrendsSectionProps> = ({ transactions }) => {
  const analytics = React.useMemo(() => generateFinancialAnalytics(transactions), [transactions]);

  const monthlySpending: MonthlySpendingPoint[] = analytics.monthlySpending;
  const monthlySavings: MonthlySavingsPoint[] = analytics.monthlySavings;

  // Max value for visual bar scaling
  const maxMonthlyAmount = React.useMemo(() => {
    let max = 1000;
    for (const s of monthlySavings) {
      if (s.income > max) max = s.income;
      if (s.expense > max) max = s.expense;
    }
    return max;
  }, [monthlySavings]);

  const spendingChange = analytics.spendingChange;
  const expenseVolatility = analytics.expenseVolatility;

  return (
    <Card
      variant="glass"
      padding="md"
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <TrendingUp size={18} color="#818cf8" />
          <h2 style={{ fontSize: "1.05rem", margin: 0 }}>Income vs Expense & Monthly Trends</h2>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {spendingChange && (
            <Badge
              variant={
                spendingChange.direction === "decrease"
                  ? "success"
                  : spendingChange.direction === "increase"
                    ? "warning"
                    : "neutral"
              }
              size="sm"
            >
              Spend{" "}
              {spendingChange.direction === "decrease"
                ? "↓"
                : spendingChange.direction === "increase"
                  ? "↑"
                  : "="}{" "}
              {spendingChange.percentageChange !== null
                ? `${Math.abs(spendingChange.percentageChange).toFixed(1)}%`
                : ""}{" "}
              MoM
            </Badge>
          )}
          <Badge variant="brand" size="sm">
            {monthlySpending.length} Months Tracked
          </Badge>
        </div>
      </div>

      {/* Monthly Timeline Comparison Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {monthlySavings.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "1.5rem",
              color: "var(--text-muted)",
              fontSize: "0.8125rem",
            }}
          >
            No monthly timeline data recorded yet.
          </div>
        ) : (
          monthlySavings.map((item, idx) => {
            const incomePct = Math.min(100, Math.round((item.income / maxMonthlyAmount) * 100));
            const expensePct = Math.min(100, Math.round((item.expense / maxMonthlyAmount) * 100));
            const netSaving = item.savings;

            return (
              <div
                key={idx}
                style={{
                  background: "rgba(15, 23, 42, 0.4)",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#f8fafc" }}>
                    {item.month}
                  </span>
                  <div
                    style={{ display: "flex", gap: "1rem", fontSize: "0.75rem" }}
                    className="num-mono"
                  >
                    <span style={{ color: "#10b981" }}>
                      In: ₹{item.income.toLocaleString("en-IN")}
                    </span>
                    <span style={{ color: "#f43f5e" }}>
                      Out: ₹{item.expense.toLocaleString("en-IN")}
                    </span>
                    <span
                      style={{ color: netSaving >= 0 ? "#818cf8" : "#f43f5e", fontWeight: 700 }}
                    >
                      Net: {netSaving >= 0 ? "+" : ""}₹{netSaving.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Comparative Double Bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {/* Income bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.6875rem", color: "#10b981", width: "45px" }}>
                      Income
                    </span>
                    <div className="progress-bar-bg" style={{ flex: 1, height: 6 }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${incomePct}%`,
                          background: "linear-gradient(90deg, #10b981, #059669)",
                        }}
                      />
                    </div>
                  </div>
                  {/* Expense bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.6875rem", color: "#f43f5e", width: "45px" }}>
                      Expense
                    </span>
                    <div className="progress-bar-bg" style={{ flex: 1, height: 6 }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${expensePct}%`,
                          background: "linear-gradient(90deg, #f43f5e, #e11d48)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Volatility & Trend Diagnostics Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
          marginTop: "0.25rem",
        }}
      >
        <div
          style={{
            background: "rgba(0, 0, 0, 0.25)",
            borderRadius: "0.5rem",
            padding: "0.75rem",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.6875rem",
              color: "var(--text-secondary)",
            }}
          >
            <Activity size={13} color="#06b6d4" /> Expense Volatility
          </div>
          <div style={{ fontSize: "1.125rem", fontWeight: 700 }} className="num-mono">
            {(expenseVolatility.coefficientOfVariation * 100).toFixed(1)}% CV
          </div>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
            Monthly mean: ₹{expenseVolatility.mean.toLocaleString("en-IN")}
          </div>
        </div>

        <div
          style={{
            background: "rgba(0, 0, 0, 0.25)",
            borderRadius: "0.5rem",
            padding: "0.75rem",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.6875rem",
              color: "var(--text-secondary)",
            }}
          >
            <BarChart2 size={13} color="#818cf8" /> Spending Trend
          </div>
          <div
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color:
                spendingChange?.direction === "decrease"
                  ? "#34d399"
                  : spendingChange?.direction === "increase"
                    ? "#fbbf24"
                    : "#f8fafc",
            }}
          >
            {spendingChange ? `${spendingChange.direction.toUpperCase()}` : "STABLE"}
          </div>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
            {spendingChange
              ? `Δ ₹${Math.abs(spendingChange.absoluteChange).toLocaleString("en-IN")}`
              : "Baseline establishing"}
          </div>
        </div>
      </div>
    </Card>
  );
};
