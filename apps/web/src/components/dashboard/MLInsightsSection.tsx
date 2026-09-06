import React from "react";
import { AlertTriangle, ShieldAlert, Sparkles, UserCheck } from "lucide-react";
import { Card, Badge } from "@expense-tracker/ui";
import type { FinancialAnalysisResult } from "@expense-tracker/ml-contract";

export interface MLInsightsSectionProps {
  analysis: FinancialAnalysisResult | null;
}

export const MLInsightsSection: React.FC<MLInsightsSectionProps> = ({ analysis }) => {
  const persona = analysis?.persona;
  const anomaly = analysis?.anomaly;
  const insights = analysis?.insights ?? [];
  const dataQuality = analysis?.dataQuality;

  return (
    <Card
      variant="glass"
      padding="md"
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Sparkles size={18} color="#818cf8" />
          <h2 style={{ fontSize: "1.05rem", margin: 0 }}>Behavioral Persona & ML Evidence</h2>
        </div>
        {dataQuality && (
          <Badge variant={dataQuality.sufficientData ? "success" : "warning"} size="sm">
            Data Quality: {dataQuality.dataQualityScore}/100
          </Badge>
        )}
      </div>

      {/* Cold Start Notice */}
      {dataQuality?.coldStart && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            borderRadius: "0.5rem",
            padding: "0.75rem 1rem",
            fontSize: "0.8125rem",
            color: "#fbbf24",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <AlertTriangle size={16} />
          <span>{dataQuality.message}</span>
        </div>
      )}

      {/* Persona Archetype Banner */}
      {persona && (
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            borderRadius: "0.625rem",
            padding: "1rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.85rem",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "#ffffff",
              padding: "0.5rem",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserCheck size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#f8fafc" }}>
                {persona.archetype}
              </span>
              <Badge variant="brand" size="sm">
                Cluster #{persona.clusterId ?? 0}
              </Badge>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                Confidence: {(persona.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-secondary)",
                margin: "0.35rem 0 0 0",
              }}
            >
              {persona.description}
            </p>
          </div>
        </div>
      )}

      {/* Anomaly Detection Status */}
      {anomaly && anomaly.isAnomalous && (
        <div
          style={{
            background: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            borderRadius: "0.5rem",
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <ShieldAlert size={18} color="#f43f5e" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#fb7185" }}>
              Spending Anomaly Detected (Isolation Forest)
            </div>
            <div style={{ fontSize: "0.75rem", color: "#f43f5e" }}>
              Severity: {anomaly.severity.toUpperCase()} • Anomaly Score:{" "}
              {(anomaly.anomalyScore * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Structured Evidence Insights List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {insights.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "1.5rem",
              color: "var(--text-muted)",
              fontSize: "0.8125rem",
            }}
          >
            No behavioral alerts or unusual variance identified. Spending pattern is steady.
          </div>
        ) : (
          insights.map((insight, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(15, 23, 42, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "0.5rem",
                padding: "0.75rem 0.85rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
              }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#f8fafc" }}>
                  {insight.title}
                </span>
                <Badge
                  variant={
                    insight.severity === "critical" || insight.severity === "high"
                      ? "danger"
                      : insight.severity === "medium"
                        ? "warning"
                        : "info"
                  }
                  size="sm"
                >
                  {insight.severity}
                </Badge>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>
                {insight.explanation}
              </p>
              {insight.evidence && (
                <div
                  style={{
                    fontSize: "0.6875rem",
                    color: "var(--text-muted)",
                    display: "flex",
                    gap: "1rem",
                    marginTop: "0.2rem",
                  }}
                  className="num-mono"
                >
                  <span>Metric: {insight.evidence.metricName}</span>
                  {insight.evidence.observedValue !== undefined && (
                    <span>
                      Observed:{" "}
                      {typeof insight.evidence.observedValue === "number"
                        ? insight.evidence.observedValue.toLocaleString()
                        : insight.evidence.observedValue}
                    </span>
                  )}
                  {insight.evidence.baselineValue !== undefined && (
                    <span>
                      Baseline:{" "}
                      {typeof insight.evidence.baselineValue === "number"
                        ? insight.evidence.baselineValue.toLocaleString()
                        : insight.evidence.baselineValue}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
