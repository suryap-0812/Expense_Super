import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { ProvenanceBadge, type ProvenanceTier } from "./ProvenanceBadge";

export type FindingPriority = "low" | "medium" | "high";

export interface FindingItem {
  title: string;
  evidence: string;
  explanation: string;
  recommendation: string;
  priority: FindingPriority;
}

export interface GuidanceFindingCardProps {
  finding: FindingItem;
  provenance?: ProvenanceTier;
  className?: string;
  style?: React.CSSProperties;
}

export const GuidanceFindingCard: React.FC<GuidanceFindingCardProps> = ({
  finding,
  provenance = "llm_suggested",
  className = "",
  style = {},
}) => {
  const priorityConfig: Record<
    FindingPriority,
    {
      badgeVariant: "danger" | "warning" | "info";
      icon: React.ReactNode;
      borderColor: string;
      accentBg: string;
    }
  > = {
    high: {
      badgeVariant: "danger",
      icon: <AlertCircle size={15} color="#f43f5e" />,
      borderColor: "rgba(244, 63, 94, 0.3)",
      accentBg: "rgba(244, 63, 94, 0.08)",
    },
    medium: {
      badgeVariant: "warning",
      icon: <AlertTriangle size={15} color="#fbbf24" />,
      borderColor: "rgba(245, 158, 11, 0.3)",
      accentBg: "rgba(245, 158, 11, 0.08)",
    },
    low: {
      badgeVariant: "info",
      icon: <CheckCircle2 size={15} color="#38bdf8" />,
      borderColor: "rgba(14, 165, 233, 0.3)",
      accentBg: "rgba(14, 165, 233, 0.08)",
    },
  };

  const pConfig = priorityConfig[finding.priority] ?? priorityConfig.medium;

  return (
    <Card
      variant="glass"
      padding="md"
      className={`guidance-finding-card priority-${finding.priority} ${className}`}
      style={{
        border: `1px solid ${pConfig.borderColor}`,
        borderRadius: "0.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(12px)",
        ...style,
      }}
    >
      {/* 1. Header: Finding Title + Priority Badge + Provenance Tier */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
          {pConfig.icon}
          <h3
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "#f8fafc",
              margin: 0,
              lineHeight: 1.35,
            }}
          >
            {finding.title}
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Badge variant={pConfig.badgeVariant} size="sm">
            {finding.priority} priority
          </Badge>
          <ProvenanceBadge tier={provenance} size="sm" />
        </div>
      </div>

      {/* 2. Field: Grounded Evidence */}
      <div
        style={{
          background: "rgba(0, 0, 0, 0.35)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "0.5rem",
          padding: "0.6rem 0.8rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "0.6rem",
        }}
      >
        <ShieldCheck size={15} color="#94a3b8" style={{ marginTop: "2px", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.2rem",
            }}
          >
            Evidence (Grounded Metric)
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "#cbd5e1",
              lineHeight: 1.4,
              fontFamily: "var(--font-mono, monospace)",
            }}
            className="finding-evidence num-mono"
          >
            {finding.evidence}
          </div>
        </div>
      </div>

      {/* 3. Field: Financial Explanation */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
        <div
          style={{
            fontSize: "0.6875rem",
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Explanation & Context
        </div>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            margin: 0,
          }}
          className="finding-explanation"
        >
          {finding.explanation}
        </p>
      </div>

      {/* 4. Field: Actionable Recommendation */}
      <div
        style={{
          background: pConfig.accentBg,
          border: `1px solid ${pConfig.borderColor}`,
          borderRadius: "0.5rem",
          padding: "0.65rem 0.85rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "0.5rem",
        }}
        className="finding-recommendation"
      >
        <ArrowRight
          size={15}
          color={finding.priority === "high" ? "#fb7185" : "#38bdf8"}
          style={{ marginTop: "2px", flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: finding.priority === "high" ? "#fb7185" : "#38bdf8",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.15rem",
            }}
          >
            Actionable Recommendation
          </div>
          <span
            style={{
              fontSize: "0.8125rem",
              color: "#f8fafc",
              fontWeight: 500,
              lineHeight: 1.45,
            }}
          >
            {finding.recommendation}
          </span>
        </div>
      </div>
    </Card>
  );
};
