import React from "react";
import type { FinancialAnalysisResult } from "@expense-tracker/ml-contract";
import {
  useTransactionStore,
  useGoalStore,
  useBalanceStore,
  useGuidanceStore,
} from "@expense-tracker/state";
import { GuidanceFindingCard, ProvenanceBadge, Button, Badge } from "@expense-tracker/ui";
import type { Transaction, Goal } from "@expense-tracker/domain";
import {
  DollarSign,
  TrendingUp,
  Sparkles,
  PieChart as PieIcon,
  Tag,
  Wallet,
  Coins,
  PiggyBank,
  Bot,
  RefreshCw,
  Clock,
  ShieldCheck,
} from "lucide-react";

interface DesktopDashboardViewProps {
  analysis: FinancialAnalysisResult | null;
}

export const DesktopDashboardView: React.FC<DesktopDashboardViewProps> = ({ analysis }) => {
  const { transactions } = useTransactionStore();
  const { goals, allocations, getTotalAllocations } = useGoalStore();
  const { currentBalance, getUnallocatedCash } = useBalanceStore();
  const { guidanceResult, isGenerating, lastGeneratedAt, activeModel, generateGuidance } =
    useGuidanceStore();

  const totalGoalAllocations = getTotalAllocations();
  const displayBalance = currentBalance > 0 ? currentBalance : 450000;
  const unallocatedCash = getUnallocatedCash(totalGoalAllocations);

  const totalIncome = analysis?.summary.totalIncome ?? 75000;
  const totalExpense = analysis?.summary.totalExpense ?? 41800;
  const netSavings = analysis?.summary.netSavings ?? totalIncome - totalExpense;
  const savingsRate = analysis?.summary.savingsRate ?? 44.3;
  const archetype = analysis?.persona?.archetype ?? "Balanced Optimizer";
  const archetypeDesc =
    analysis?.persona?.description ??
    "Stable income baseline with balanced discretionary savings allocations.";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 5 Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "1rem",
        }}
      >
        <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "0.75rem",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#818cf8",
            }}
          >
            <Wallet style={{ width: "1.5rem", height: "1.5rem" }} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Bank Balance (Manual)
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)" }}>
              ₹{displayBalance.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "0.75rem",
              background: "rgba(52, 211, 153, 0.15)",
              color: "#34d399",
            }}
          >
            <Coins style={{ width: "1.5rem", height: "1.5rem" }} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Available to Spend
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)" }}>
              ₹{unallocatedCash.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "0.75rem",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
            }}
          >
            <TrendingUp style={{ width: "1.5rem", height: "1.5rem" }} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Received (Inflow)
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 700, color: "#10b981" }}>
              ₹{totalIncome.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "0.75rem",
              background: "rgba(244, 63, 94, 0.15)",
              color: "#f43f5e",
            }}
          >
            <DollarSign style={{ width: "1.5rem", height: "1.5rem" }} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Spent (Outflow)
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 700, color: "#f43f5e" }}>
              ₹{totalExpense.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "0.75rem",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#818cf8",
            }}
          >
            <PiggyBank style={{ width: "1.5rem", height: "1.5rem" }} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Net Savings ({savingsRate !== null ? `${savingsRate.toFixed(0)}%` : ""})
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 700, color: "#818cf8" }}>
              ₹{netSavings.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: ML Insights & Goals */}
      <div className="dashboard-grid">
        <div className="col-7" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* AI Financial Guidance Section */}
          <div
            className="glass-card"
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Bot style={{ width: "1.25rem", height: "1.25rem", color: "#818cf8" }} />
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  AI Financial Guidance
                </h3>
                <Badge variant="brand" size="sm">
                  {activeModel || "anthropic/claude-3.5-sonnet"}
                </Badge>
                {lastGeneratedAt && (
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <Clock size={11} />
                    {new Date(lastGeneratedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => analysis && generateGuidance(analysis)}
                disabled={isGenerating || !analysis}
                style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
              >
                <RefreshCw
                  size={13}
                  style={{ animation: isGenerating ? "spin 1s linear infinite" : "none" }}
                />
                <span>{isGenerating ? "Analyzing..." : "Refresh Guidance"}</span>
              </Button>
            </div>

            {/* Provenance Tiers */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.4rem 0.65rem",
                background: "rgba(0, 0, 0, 0.25)",
                borderRadius: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 600 }}>
                TIERS:
              </span>
              <ProvenanceBadge tier="calculated" size="sm" />
              <ProvenanceBadge tier="ml_detected" size="sm" />
              <ProvenanceBadge tier="llm_suggested" size="sm" />
            </div>

            {/* Executive Summary */}
            {guidanceResult?.summary ? (
              <div
                style={{
                  background: "rgba(99, 102, 241, 0.1)",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                  borderRadius: "0.5rem",
                  padding: "0.75rem 0.9rem",
                  fontSize: "0.8125rem",
                  color: "#f8fafc",
                  lineHeight: 1.5,
                }}
              >
                <strong>Summary:</strong> {guidanceResult.summary}
              </div>
            ) : (
              <div
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--text-secondary)",
                  background: "rgba(0, 0, 0, 0.2)",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                }}
              >
                Click <strong>Refresh Guidance</strong> to generate 4-facet grounded natural
                language recommendations and actionable steps.
              </div>
            )}

            {/* Findings */}
            {guidanceResult?.findings && guidanceResult.findings.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {guidanceResult.findings.map((f, i) => (
                  <GuidanceFindingCard key={i} finding={f} provenance="llm_suggested" />
                ))}
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.6875rem",
                color: "var(--text-muted)",
                borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                paddingTop: "0.5rem",
              }}
            >
              <ShieldCheck size={13} color="#10b981" />
              <span>Grounded ML &amp; Deterministic Advisory</span>
            </div>
          </div>

          {/* ML Archetype Card */}
          <div className="glass-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles
                  style={{ width: "1.25rem", height: "1.25rem", color: "var(--accent-indigo)" }}
                />
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  Behavioral Persona & Clustering
                </h3>
              </div>
              <span
                className="badge-native"
                style={{
                  background: "rgba(99, 102, 241, 0.2)",
                  color: "#c7d2fe",
                  borderColor: "rgba(99, 102, 241, 0.4)",
                }}
              >
                K-Means Archetype
              </span>
            </div>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                marginBottom: "0.75rem",
              }}
            >
              Identified Archetype:{" "}
              <strong style={{ color: "var(--text-primary)" }}>{archetype}</strong>
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              {archetypeDesc}
            </p>
          </div>

          {/* Transactions List */}
          <div className="glass-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Tag
                  style={{ width: "1.25rem", height: "1.25rem", color: "var(--accent-emerald)" }}
                />
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  Recent Transactions ({transactions.length})
                </h3>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                maxHeight: "360px",
                overflowY: "auto",
              }}
            >
              {transactions.map((tx: Transaction) => (
                <div
                  key={tx.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          fontSize: "0.875rem",
                        }}
                      >
                        {tx.description || tx.categoryId}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {tx.categoryId} • {tx.paymentMethod} • {tx.transactionDate}
                    </div>
                    {tx.notes && (
                      <div style={{ fontSize: "0.6875rem", color: "#818cf8", marginTop: 2 }}>
                        Note: {tx.notes}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: tx.type === "income" ? "#34d399" : "#f87171",
                      fontSize: "0.9375rem",
                    }}
                  >
                    {tx.type === "income" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Goals & Allocations */}
        <div className="col-5" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="glass-card">
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}
            >
              <PieIcon
                style={{ width: "1.25rem", height: "1.25rem", color: "var(--accent-cyan)" }}
              />
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)" }}>
                Active Goals ({goals.length})
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {goals.map((g: Goal) => {
                const currentSaved = allocations[g.id] ?? 0;
                const pct = Math.min(100, (currentSaved / g.targetAmount) * 100);
                return (
                  <div
                    key={g.id}
                    style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.8125rem",
                      }}
                    >
                      <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                        {g.name}
                      </span>
                      <span style={{ color: "var(--text-secondary)" }}>{pct.toFixed(0)}%</span>
                    </div>
                    <div
                      style={{
                        height: "6px",
                        width: "100%",
                        background: "rgba(255, 255, 255, 0.08)",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background:
                            "linear-gradient(90deg, var(--accent-indigo), var(--accent-cyan))",
                          borderRadius: "3px",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <span>₹{currentSaved.toLocaleString("en-IN")} saved</span>
                      <span>Target: ₹{g.targetAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
