import React from "react";
import { Plus, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { Button, Badge } from "@expense-tracker/ui";
import { useTransactionStore, useAnalysisStore } from "@expense-tracker/state";

export interface HeaderProps {
  onOpenAddModal: () => void;
  onRefreshAnalysis: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddModal, onRefreshAnalysis }) => {
  const { filters, setPeriod } = useTransactionStore();
  const { isAnalyzing } = useAnalysisStore();

  const periods = [
    { label: "All Time", value: "all-time" },
    { label: "May 2026", value: "2026-05" },
    { label: "Apr 2026", value: "2026-04" },
    { label: "Mar 2026", value: "2026-03" },
  ];

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        padding: "1rem 1.25rem",
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(12px)",
        borderRadius: "0.875rem",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div
          style={{
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "0.625rem",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.35)",
          }}
        >
          <TrendingUp size={20} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h1 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 700 }}>Expense Super</h1>
            <Badge variant="brand" size="sm">
              <Sparkles size={11} style={{ marginRight: 2 }} />
              Local ML
            </Badge>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>
            Unified Financial Analytics & Behavioral Intelligence
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        {/* Period Selector Pills */}
        <div
          style={{
            display: "flex",
            background: "rgba(0, 0, 0, 0.4)",
            borderRadius: "0.5rem",
            padding: "0.2rem",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                background: filters.period === p.value ? "rgba(99, 102, 241, 0.25)" : "transparent",
                color: filters.period === p.value ? "#f8fafc" : "#94a3b8",
                border:
                  filters.period === p.value
                    ? "1px solid rgba(99, 102, 241, 0.4)"
                    : "1px solid transparent",
                padding: "0.25rem 0.65rem",
                borderRadius: "0.375rem",
                fontSize: "0.75rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Refresh Analysis Button */}
        <Button
          variant="glass"
          size="sm"
          onClick={onRefreshAnalysis}
          disabled={isAnalyzing}
          icon={<RefreshCw size={14} className={isAnalyzing ? "spin" : ""} />}
        >
          {isAnalyzing ? "Analyzing..." : "Recompute ML"}
        </Button>

        {/* Add Transaction Button */}
        <Button variant="primary" size="sm" onClick={onOpenAddModal} icon={<Plus size={15} />}>
          Add Record
        </Button>
      </div>
    </header>
  );
};
