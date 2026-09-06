import React from "react";
import { Modal, Button, Badge } from "@expense-tracker/ui";
import { useBalanceStore } from "@expense-tracker/state";
import { Trash2, History } from "lucide-react";

export interface BalanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BalanceHistoryModal: React.FC<BalanceHistoryModalProps> = ({ isOpen, onClose }) => {
  const { balanceHistory, deleteBalanceRecord } = useBalanceStore();

  const handleDelete = (id: string, date: string, amount: number) => {
    if (
      window.confirm(
        `Are you sure you want to delete balance record of ₹${amount.toLocaleString("en-IN")} on ${date}?`,
      )
    ) {
      deleteBalanceRecord(id);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bank Balance History">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ fontSize: "0.8125rem", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
          Historical record of all manually verified bank balances. The latest record serves as your
          current authoritative bank balance.
        </p>

        {balanceHistory.length === 0 ? (
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
            <div>No balance history recorded yet.</div>
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
            {balanceHistory.map((rec, index) => {
              const prevRec = balanceHistory[index + 1];
              const delta = prevRec ? rec.balance - prevRec.balance : 0;
              const isFirst = index === 0;

              return (
                <div
                  key={rec.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    background: isFirst ? "rgba(99, 102, 241, 0.1)" : "rgba(255, 255, 255, 0.03)",
                    border: isFirst
                      ? "1px solid rgba(99, 102, 241, 0.3)"
                      : "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="num-mono" style={{ fontWeight: 600, color: "#f8fafc" }}>
                        ₹{rec.balance.toLocaleString("en-IN")}
                      </span>
                      {isFirst && (
                        <Badge variant="info" size="sm">
                          Current Active
                        </Badge>
                      )}
                      {prevRec && delta !== 0 && (
                        <span
                          className="num-mono"
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color: delta > 0 ? "#10b981" : "#f43f5e",
                          }}
                        >
                          {delta > 0
                            ? `+₹${delta.toLocaleString("en-IN")}`
                            : `-₹${Math.abs(delta).toLocaleString("en-IN")}`}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      Recorded on {rec.recordedAt}
                      {rec.note ? ` • ${rec.note}` : ""}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(rec.id, rec.recordedAt, rec.balance)}
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
