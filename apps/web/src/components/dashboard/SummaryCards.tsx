import React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Coins,
  History,
  Edit2,
  PiggyBank,
} from "lucide-react";
import { Card, Badge } from "@expense-tracker/ui";
import type { FinancialAnalysisResult } from "@expense-tracker/ml-contract";
import { useBalanceStore, useGoalStore } from "@expense-tracker/state";

export interface SummaryCardsProps {
  analysis: FinancialAnalysisResult | null;
  onOpenUpdateBalance?: () => void;
  onOpenBalanceHistory?: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  analysis,
  onOpenUpdateBalance,
  onOpenBalanceHistory,
}) => {
  const { currentBalance, getUnallocatedCash } = useBalanceStore();
  const { getTotalAllocations } = useGoalStore();

  const totalGoalAllocations = getTotalAllocations();
  const unallocatedCash = getUnallocatedCash(totalGoalAllocations);

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
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
      }}
    >
      {/* 1. Authoritative Bank Balance */}
      <Card variant="glass" padding="md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span
                style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}
              >
                Bank Balance
              </span>
              <Badge variant="info" size="sm">
                Manual
              </Badge>
            </div>
            <div
              style={{
                fontSize: "1.45rem",
                fontWeight: 700,
                marginTop: "0.25rem",
                color: "#f8fafc",
              }}
              className="num-mono"
            >
              ₹{currentBalance.toLocaleString("en-IN")}
            </div>
          </div>
          <div
            style={{
              padding: "0.5rem",
              borderRadius: "0.5rem",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#818cf8",
            }}
          >
            <Wallet size={18} />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "0.6rem",
            paddingTop: "0.4rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Verified ledger</span>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {onOpenUpdateBalance && (
              <button
                onClick={onOpenUpdateBalance}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#818cf8",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.2rem",
                  padding: "0.1rem 0.3rem",
                }}
                title="Update bank balance"
              >
                <Edit2 size={11} /> Edit
              </button>
            )}
            {onOpenBalanceHistory && (
              <button
                onClick={onOpenBalanceHistory}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "0.6875rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.2rem",
                  padding: "0.1rem 0.3rem",
                }}
                title="View balance history"
              >
                <History size={11} /> History
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* 2. Available to Spend (Unallocated Cash) */}
      <Card variant="glass" padding="md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              Available to Spend
            </span>
            <div
              style={{
                fontSize: "1.45rem",
                fontWeight: 700,
                marginTop: "0.25rem",
                color: unallocatedCash >= 0 ? "#34d399" : "#f43f5e",
              }}
              className="num-mono"
            >
              ₹{unallocatedCash.toLocaleString("en-IN")}
            </div>
          </div>
          <div
            style={{
              padding: "0.5rem",
              borderRadius: "0.5rem",
              background: "rgba(52, 211, 153, 0.12)",
              color: "#34d399",
            }}
          >
            <Coins size={18} />
          </div>
        </div>
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
          ₹{totalGoalAllocations.toLocaleString("en-IN")} reserved in goals
        </div>
      </Card>

      {/* 3. Received (Income) */}
      <Card variant="glass" padding="md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              Received (Inflow)
            </span>
            <div
              style={{
                fontSize: "1.45rem",
                fontWeight: 700,
                marginTop: "0.25rem",
                color: "#10b981",
              }}
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
          Total verified income
        </div>
      </Card>

      {/* 4. Spent (Expenses) */}
      <Card variant="glass" padding="md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              Spent (Outflow)
            </span>
            <div
              style={{
                fontSize: "1.45rem",
                fontWeight: 700,
                marginTop: "0.25rem",
                color: "#f43f5e",
              }}
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
          Total period expenditure
        </div>
      </Card>

      {/* 5. Net Savings & Savings Rate */}
      <Card variant="glass" padding="md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              Net Savings
            </span>
            <div
              style={{
                fontSize: "1.45rem",
                fontWeight: 700,
                marginTop: "0.25rem",
                color: summary.netSavings >= 0 ? "#6366f1" : "#f43f5e",
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
              background: "rgba(99, 102, 241, 0.12)",
              color: "#818cf8",
            }}
          >
            <PiggyBank size={18} />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "0.5rem",
          }}
        >
          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Rate:</span>
          <Badge variant={isHealthySavings ? "success" : "warning"} size="sm">
            {savingsRateVal.toFixed(1)}% Saved
          </Badge>
        </div>
      </Card>
    </div>
  );
};
