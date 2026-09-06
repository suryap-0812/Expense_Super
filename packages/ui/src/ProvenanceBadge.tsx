import React from "react";
import { Calculator, Cpu, Sparkles } from "lucide-react";

export type ProvenanceTier = "calculated" | "ml_detected" | "llm_suggested";

export interface ProvenanceBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tier: ProvenanceTier;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  tier,
  size = "md",
  showIcon = true,
  className = "",
  style = {},
  ...props
}) => {
  const configs: Record<
    ProvenanceTier,
    { label: string; icon: React.ReactNode; bg: string; color: string; border: string }
  > = {
    calculated: {
      label: "Calculated",
      icon: <Calculator size={size === "sm" ? 11 : 13} />,
      bg: "rgba(16, 185, 129, 0.12)",
      color: "#34d399",
      border: "1px solid rgba(16, 185, 129, 0.3)",
    },
    ml_detected: {
      label: "ML Detected",
      icon: <Cpu size={size === "sm" ? 11 : 13} />,
      bg: "rgba(139, 92, 246, 0.14)",
      color: "#a78bfa",
      border: "1px solid rgba(139, 92, 246, 0.35)",
    },
    llm_suggested: {
      label: "LLM Suggested",
      icon: <Sparkles size={size === "sm" ? 11 : 13} />,
      bg: "rgba(6, 182, 212, 0.14)",
      color: "#22d3ee",
      border: "1px solid rgba(6, 182, 212, 0.35)",
    },
  };

  const config = configs[tier];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size === "sm" ? "0.25rem" : "0.35rem",
        fontWeight: 600,
        borderRadius: "9999px",
        letterSpacing: "0.025em",
        textTransform: "uppercase",
        fontSize: size === "sm" ? "0.6875rem" : "0.75rem",
        padding: size === "sm" ? "0.15rem 0.5rem" : "0.25rem 0.65rem",
        background: config.bg,
        color: config.color,
        border: config.border,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
        ...style,
      }}
      className={`ui-provenance-badge ${tier} ${size} ${className}`}
      {...props}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
