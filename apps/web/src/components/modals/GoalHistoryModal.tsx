import React from "react";
import { Modal, Button } from "@expense-tracker/ui";
import { useGoalStore } from "@expense-tracker/state";
import { History, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { GoalWithProgress } from "@expense-tracker/domain";

export interface GoalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: GoalWithProgress | null;
}

export const GoalHistoryModal: React.FC<GoalHistoryModalProps> = ({ isOpen, onClose, goal }) => {
  const { getGoalAllocations, deleteAllocation } = useGoalStore();

  if (!goal) return null;

  const allocations = getGoalAllocations(goal.id);

  const handleDelete = (id: string, amount: number, date: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete allocation record of ₹${Math.abs(amount).toLocaleString("en-IN")} on ${date}?`,
      )
    ) {
      deleteAllocation(id);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Allocation History: ${goal.name}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ fontSize: "0.8125rem", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
          Chronological record of all funds allocated to or reduced from this savings target.
        </p>

        {allocations.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--text-muted)",
              background: "rgba(0,0,0,0.2)",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
            }}
          >
            <History size={24} style={{ marginBottom: "0.5rem", opacity: 0.5 }} />
            <div>No allocation transactions recorded for this goal yet.</div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              maxHeight: "360px",
              overflowY: "auto",
            }}
          >
            {allocations.map((alloc) => {
              const isPositive = alloc.amount > 0;

              return (
                <div
                  key={alloc.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                      style={{
                        padding: "0.4rem",
                        borderRadius: "0.375rem",
                        background: isPositive
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(245, 158, 11, 0.15)",
                        color: isPositive ? "#10b981" : "#f59e0b",
                      }}
                    >
                      {isPositive ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          className="num-mono"
                          style={{
                            fontWeight: 600,
                            color: isPositive ? "#34d399" : "#fbbf24",
                            fontSize: "0.9375rem",
                          }}
                        >
                          {isPositive ? "+" : "-"}₹{Math.abs(alloc.amount).toLocaleString("en-IN")}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {isPositive ? "Allocation" : "Reduction"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        {alloc.allocationDate}
                        {alloc.note ? ` • ${alloc.note}` : ""}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(alloc.id, alloc.amount, alloc.allocationDate)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      padding: "0.3rem",
                      borderRadius: "0.25rem",
                    }}
                    title="Delete record"
                    aria-label="Delete record"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
          <Button type="button" variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
