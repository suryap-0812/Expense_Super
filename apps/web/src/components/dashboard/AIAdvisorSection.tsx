import React, { useState } from "react";
import { Bot, Sparkles, RefreshCw, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { Card, Badge, Button, GuidanceFindingCard, ProvenanceBadge } from "@expense-tracker/ui";
import { useGuidanceStore } from "@expense-tracker/state";
import type { FinancialAnalysisResult } from "@expense-tracker/ml-contract";

export interface AIAdvisorSectionProps {
  analysis?: FinancialAnalysisResult | null;
  guidanceResult?: import("@expense-tracker/llm-client").LLMAnalysisResult | null;
  currencySymbol?: string;
  savingsGoalAmount?: number;
}

export const AIAdvisorSection: React.FC<AIAdvisorSectionProps> = ({
  analysis,
  guidanceResult: propGuidanceResult,
  currencySymbol = "₹",
  savingsGoalAmount = 50000,
}) => {
  const storeGuidanceResult = useGuidanceStore((s) => s.guidanceResult);
  const isGenerating = useGuidanceStore((s) => s.isGenerating);
  const error = useGuidanceStore((s) => s.error);
  const lastGeneratedAt = useGuidanceStore((s) => s.lastGeneratedAt);
  const activeModel = useGuidanceStore((s) => s.activeModel);
  const generateGuidance = useGuidanceStore((s) => s.generateGuidance);

  const guidanceResult =
    propGuidanceResult !== undefined ? propGuidanceResult : storeGuidanceResult;

  const [activeFilter, setActiveFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const handleGenerate = async () => {
    if (!analysis) return;
    await generateGuidance(analysis, undefined, {
      currencySymbol,
      savingsGoalAmount,
    });
  };

  const findings = guidanceResult?.findings ?? [];
  const filteredFindings =
    activeFilter === "all" ? findings : findings.filter((f) => f.priority === activeFilter);

  const formattedTime = lastGeneratedAt
    ? new Date(lastGeneratedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <Card
      variant="glass"
      padding="md"
      style={{
        background:
          "linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 27, 75, 0.45) 100%)",
        border: "1px solid rgba(99, 102, 241, 0.25)",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      {/* Header: Title + Active Model + Action Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              padding: "0.45rem",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bot size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
                AI Financial Guidance
              </h2>
              <Badge variant="brand" size="sm">
                Grounded ML + LLM
              </Badge>
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                marginTop: "0.15rem",
              }}
            >
              <span>Model: {activeModel || "anthropic/claude-3.5-sonnet"}</span>
              {formattedTime && (
                <>
                  <span>•</span>
                  <Clock size={12} />
                  <span>Updated {formattedTime}</span>
                </>
              )}
              {guidanceResult?.latencyMs ? <span>({guidanceResult.latencyMs}ms)</span> : null}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating || !analysis}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: isGenerating ? "spin 1s linear infinite" : "none",
              }}
            />
            <span>{isGenerating ? "Analyzing..." : "Refresh Guidance"}</span>
          </Button>
        </div>
      </div>

      {/* Provenance Tier Architecture Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.5rem 0.75rem",
          background: "rgba(0, 0, 0, 0.25)",
          borderRadius: "0.5rem",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "0.6875rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Provenance Tiers:
        </span>
        <ProvenanceBadge tier="calculated" size="sm" />
        <ProvenanceBadge tier="ml_detected" size="sm" />
        <ProvenanceBadge tier="llm_suggested" size="sm" />
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            background: "rgba(244, 63, 94, 0.12)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            borderRadius: "0.5rem",
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            color: "#fda4af",
            fontSize: "0.8125rem",
          }}
        >
          <AlertCircle size={16} color="#f43f5e" />
          <span>{error}</span>
        </div>
      )}

      {/* High-level Executive Summary Banner */}
      {guidanceResult?.summary ? (
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            borderRadius: "0.625rem",
            padding: "0.85rem 1rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
          }}
        >
          <Sparkles size={18} color="#22d3ee" style={{ marginTop: "2px", flexShrink: 0 }} />
          <div>
            <div
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                color: "#22d3ee",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.2rem",
              }}
            >
              Executive Summary
            </div>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#f8fafc",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {guidanceResult.summary}
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "rgba(0, 0, 0, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.04)",
            borderRadius: "0.5rem",
            padding: "1rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Bot size={28} color="#818cf8" style={{ opacity: 0.8 }} />
          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#f8fafc" }}>
            Ready to Generate Grounded Financial Guidance
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              maxWidth: "480px",
              margin: 0,
            }}
          >
            Click &quot;Refresh Guidance&quot; to formulate natural language explanations and
            proactive coaching directly from your local deterministic analytics and ML behavioral
            persona.
          </p>
        </div>
      )}

      {/* Findings Section */}
      {findings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Priority filter pills */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#cbd5e1" }}>
              Actionable Findings ({filteredFindings.length})
            </div>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              {(["all", "high", "medium", "low"] as const).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setActiveFilter(priority)}
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    padding: "0.2rem 0.55rem",
                    borderRadius: "9999px",
                    border:
                      activeFilter === priority
                        ? "1px solid #6366f1"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    background:
                      activeFilter === priority ? "rgba(99, 102, 241, 0.25)" : "rgba(0, 0, 0, 0.2)",
                    color: activeFilter === priority ? "#c7d2fe" : "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "0.85rem",
            }}
          >
            {filteredFindings.map((finding, idx) => (
              <GuidanceFindingCard key={idx} finding={finding} provenance="llm_suggested" />
            ))}
          </div>
        </div>
      )}

      {/* Strict Non-Recalculation & Grounding Guarantee Notice */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.6875rem",
          color: "var(--text-muted)",
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          paddingTop: "0.75rem",
        }}
      >
        <ShieldCheck size={14} color="#10b981" />
        <span>
          <strong>Grounding Guarantee:</strong> Explanations are derived exclusively from local
          deterministic computations and ML inferences. LLMs cannot recalculate or alter
          deterministic values.
        </span>
      </div>
    </Card>
  );
};
