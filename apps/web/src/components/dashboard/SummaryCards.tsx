import React from "react";
import { ArrowDownRight, ArrowUpRight, PiggyBank, Percent } from "lucide-react";
import { Card } from "@expense-tracker/ui";
import type { FinancialAnalysisResult } from "@expense-tracker/ml-contract";

export interface SummaryCardsProps {
  analysis: FinancialAnalysisResult | null;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ analysis }) => {
  const summary = analysis?.summary ?? {
    totalIncome: 0,
    totalExpense: 0,
    netSavings: 0,
    savingsRate: 0,
    volatilityRating: "low",
  };

  const savingsRateVal = summary.savingsRate ?? 0;
  const isHealthySavings = savingsRateVal >= 20;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1rem",
      }}
    >
      {/* 1. Total Income */}
      <Card variant="glass" padding="md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              Total Income
            </span>
            <div
              style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem" }}
              className="num-mono"
            >
              ₹{summary.totalIncome.toLocaleString("en-IN")}
            </div>
          </div>
          <div
            style={{
              padding: "0.5rem",
              borderRadius: "0.5rem",
              background: "rgba(16, 185, 129, 0.12)",
              color: "#10b981",
            }}
          >
            <ArrowDownRight size={18} />
          </div>
        </div>
        <div style={{ fontSize: "0.6875rem", color: "#10b981", marginTop: "0.5rem" }}>
          Inflow verified from active period
        </div>
      </Card>

      {/* 2. Total Expense */}
      <Card variant="glass" padding="md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              Total Expenses
            </span>
            <div
              style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem" }}
              className="num-mono"
            >
              ₹{summary.totalExpense.toLocaleString("en-IN")}
            </div>
          </div>
          <div
            style={{
              padding: "0.5rem",
              borderRadius: "0.5rem",
              background: "rgba(244, 63, 94, 0.12)",
              color: "#f43f5e",
            }}
          >
            <ArrowUpRight size={18} />
          </div>
        </div>
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
          Volatility:{" "}
          <span style={{ textTransform: "capitalize", color: "var(--text-secondary)" }}>
            {summary.volatilityRating}
          </span>
        </div>
      </Card>

      {/* 3. Net Savings */}
      <Card variant="glass" padding="md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              Net Savings
            </span>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                marginTop: "0.25rem",
                color: summary.netSavings >= 0 ? "#10b981" : "#f43f5e",
              }}
              className="num-mono"
            >
              ₹{summary.netSavings.toLocaleString("en-IN")}
            </div>
          </div>
          <div
            style={{
              padding: "0.5rem",
              borderRadius: "0.5rem",
              background:
                summary.netSavings >= 0 ? "rgba(16, 185, 129, 0.12)" : "rgba(244, 63, 94, 0.12)",
              color: summary.netSavings >= 0 ? "#10b981" : "#f43f5e",
            }}
          >
            <PiggyBank size={18} />
          </div>
        </div>
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
          {summary.netSavings >= 0 ? "Positive cash surplus" : "Deficit budget warning"}
        </div>
      </Card>

      {/* 4. Savings Rate */}
      <Card variant="glass" padding="md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              Savings Rate
            </span>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                marginTop: "0.25rem",
                color: isHealthySavings ? "#10b981" : "#f59e0b",
              }}
              className="num-mono"
            >
              {savingsRateVal.toFixed(1)}%
            </div>
          </div>
          <div
            style={{
              padding: "0.5rem",
              borderRadius: "0.5rem",
              background: isHealthySavings
                ? "rgba(16, 185, 129, 0.12)"
                : "rgba(245, 158, 11, 0.12)",
              color: isHealthySavings ? "#10b981" : "#f59e0b",
            }}
          >
            <Percent size={18} />
          </div>
        </div>
        <div
          style={{
            fontSize: "0.6875rem",
            color: isHealthySavings ? "#10b981" : "#f59e0b",
            marginTop: "0.5rem",
          }}
        >
          {isHealthySavings ? "Target threshold achieved (≥20%)" : "Below recommended 20% target"}
        </div>
      </Card>
    </div>
  );
};
