import React from "react";
import { Target } from "lucide-react";
import { Card, Badge } from "@expense-tracker/ui";
import { useGoalStore } from "@expense-tracker/state";

export const GoalsSection: React.FC = () => {
  const { getGoalsWithProgress } = useGoalStore();
  const goalsWithProgress = getGoalsWithProgress();

  return (
    <Card
      variant="glass"
      padding="md"
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Target size={18} color="#10b981" />
          <h2 style={{ fontSize: "1.05rem", margin: 0 }}>Savings Goals & Targets</h2>
        </div>
        <Badge variant="success" size="sm">
          {goalsWithProgress.length} Active Goals
        </Badge>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {goalsWithProgress.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "1.5rem",
              color: "var(--text-muted)",
              fontSize: "0.8125rem",
            }}
          >
            No savings goals set. Create one to track long-term targets.
          </div>
        ) : (
          goalsWithProgress.map((goal) => {
            return (
              <div
                key={goal.id}
                style={{
                  background: "rgba(15, 23, 42, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "0.5rem",
                  padding: "0.75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.8125rem",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#f8fafc" }}>{goal.name}</span>
                  <span className="num-mono" style={{ color: "#10b981", fontWeight: 600 }}>
                    {goal.progressPercentage}%
                  </span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${goal.progressPercentage}%`,
                      background: "linear-gradient(90deg, #10b981, #059669)",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.6875rem",
                    color: "var(--text-muted)",
                  }}
                  className="num-mono"
                >
                  <span>
                    ₹{goal.allocatedAmount.toLocaleString("en-IN")} of ₹
                    {goal.targetAmount.toLocaleString("en-IN")}
                  </span>
                  {goal.deadline && <span>Target: {goal.deadline}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
