import React from "react";
import { Target, Plus, Coins, History, Edit3, Trash2, CheckCircle2 } from "lucide-react";
import { Card, Badge, Button } from "@expense-tracker/ui";
import { useGoalStore } from "@expense-tracker/state";
import type { GoalWithProgress } from "@expense-tracker/domain";

export interface GoalsSectionProps {
  onOpenCreateGoal?: () => void;
  onOpenEditGoal?: (goal: GoalWithProgress) => void;
  onOpenAllocation?: (goal: GoalWithProgress) => void;
  onOpenHistory?: (goal: GoalWithProgress) => void;
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({
  onOpenCreateGoal,
  onOpenEditGoal,
  onOpenAllocation,
  onOpenHistory,
}) => {
  const { getGoalsWithProgress, deleteGoal } = useGoalStore();
  const goalsWithProgress = getGoalsWithProgress();

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete goal "${name}" and all its allocations?`)) {
      deleteGoal(id);
    }
  };

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
          <Badge variant="success" size="sm">
            {goalsWithProgress.length} Goals
          </Badge>
        </div>

        {onOpenCreateGoal && (
          <Button variant="primary" size="sm" onClick={onOpenCreateGoal} icon={<Plus size={14} />}>
            New Goal
          </Button>
        )}
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
            No savings goals set. Create a goal to reserve funds toward specific targets.
          </div>
        ) : (
          goalsWithProgress.map((goal) => {
            const isCompleted = goal.isCompleted;

            return (
              <div
                key={goal.id}
                style={{
                  background: isCompleted ? "rgba(16, 185, 129, 0.08)" : "rgba(15, 23, 42, 0.4)",
                  border: isCompleted
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "0.5rem",
                  padding: "0.85rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {/* Header Row: Title, Badge, and Progress */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontWeight: 600, color: "#f8fafc", fontSize: "0.875rem" }}>
                      {goal.name}
                    </span>
                    {isCompleted ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.2rem",
                          fontSize: "0.6875rem",
                          color: "#10b981",
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle2 size={13} /> Completed
                      </span>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        {goal.status}
                      </Badge>
                    )}
                  </div>

                  <span
                    className="num-mono"
                    style={{
                      color: isCompleted ? "#10b981" : "#818cf8",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                    }}
                  >
                    {goal.progressPercentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${goal.progressPercentage}%`,
                      background: isCompleted
                        ? "linear-gradient(90deg, #10b981, #059669)"
                        : "linear-gradient(90deg, #6366f1, #06b6d4)",
                    }}
                  />
                </div>

                {/* Amount Details */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                  }}
                  className="num-mono"
                >
                  <span>
                    <strong style={{ color: "#f8fafc" }}>
                      ₹{goal.allocatedAmount.toLocaleString("en-IN")}
                    </strong>{" "}
                    saved of ₹{goal.targetAmount.toLocaleString("en-IN")}
                  </span>
                  {goal.remainingAmount > 0 && (
                    <span style={{ color: "#94a3b8" }}>
                      ₹{goal.remainingAmount.toLocaleString("en-IN")} remaining
                    </span>
                  )}
                </div>

                {goal.deadline && (
                  <div style={{ fontSize: "0.6875rem", color: "#64748b" }}>
                    Target Deadline: {goal.deadline}
                  </div>
                )}

                {/* Action Bar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "0.25rem",
                    paddingTop: "0.4rem",
                    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    {onOpenAllocation && (
                      <button
                        onClick={() => onOpenAllocation(goal)}
                        style={{
                          background: "rgba(99, 102, 241, 0.15)",
                          border: "1px solid rgba(99, 102, 241, 0.3)",
                          borderRadius: "0.25rem",
                          color: "#c7d2fe",
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: "0.2rem 0.5rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <Coins size={11} /> Allocate / Reduce
                      </button>
                    )}
                    {onOpenHistory && (
                      <button
                        onClick={() => onOpenHistory(goal)}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "0.25rem",
                          color: "#94a3b8",
                          fontSize: "0.6875rem",
                          cursor: "pointer",
                          padding: "0.2rem 0.5rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <History size={11} /> History
                      </button>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    {onOpenEditGoal && (
                      <button
                        onClick={() => onOpenEditGoal(goal)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#64748b",
                          cursor: "pointer",
                          padding: "0.2rem",
                          borderRadius: "0.25rem",
                        }}
                        title="Edit goal"
                        aria-label="Edit goal"
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(goal.id, goal.name)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#64748b",
                        cursor: "pointer",
                        padding: "0.2rem",
                        borderRadius: "0.25rem",
                      }}
                      title="Delete goal"
                      aria-label="Delete goal"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
