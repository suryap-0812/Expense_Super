import React from "react";
import { Bot, Lightbulb } from "lucide-react";
import { Card, Badge } from "@expense-tracker/ui";

export const AIAdvisorSection: React.FC = () => {
  return (
    <Card
      variant="glass"
      padding="md"
      style={{
        background:
          "linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(30, 27, 75, 0.4) 100%)",
        border: "1px solid rgba(99, 102, 241, 0.2)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Bot size={18} color="#818cf8" />
          <h2 style={{ fontSize: "1.05rem", margin: 0 }}>AI Financial Guidance</h2>
        </div>
        <Badge variant="brand" size="sm">
          Phase 25/26 Ready
        </Badge>
      </div>

      <p
        style={{
          fontSize: "0.8125rem",
          color: "var(--text-secondary)",
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        The LLM explanation architecture consumes structured evidence from the local ONNX and
        deterministic analytics pipeline. Natural language explanations, proactive budget coaching,
        and conversational financial queries are routed through OpenRouter without sending raw
        financial transactions.
      </p>

      <div
        style={{
          marginTop: "0.85rem",
          padding: "0.75rem 1rem",
          background: "rgba(0, 0, 0, 0.3)",
          borderRadius: "0.5rem",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <Lightbulb size={16} color="#fbbf24" />
        <span style={{ fontSize: "0.75rem", color: "#f8fafc" }}>
          Current recommendation: Maintain discretionary spending below ₹12,000/mo to sustain your
          6-month emergency fund trajectory.
        </span>
      </div>
    </Card>
  );
};
