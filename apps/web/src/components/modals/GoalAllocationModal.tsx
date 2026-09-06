import React, { useState } from "react";
import { Modal, Input, Button } from "@expense-tracker/ui";
import { CreateGoalAllocationSchema } from "@expense-tracker/schemas";
import { useGoalStore, useBalanceStore } from "@expense-tracker/state";
import type { GoalWithProgress, GoalAllocation } from "@expense-tracker/domain";

export interface GoalAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: GoalWithProgress | null;
  onAllocationUpdated?: () => void;
}

export const GoalAllocationModal: React.FC<GoalAllocationModalProps> = ({
  isOpen,
  onClose,
  goal,
  onAllocationUpdated,
}) => {
  const { allocateToGoal } = useGoalStore();
  const { currentBalance, getUnallocatedCash } = useBalanceStore();
  const { getTotalAllocated } = useGoalStore();

  const totalAllocated = getTotalAllocated();
  const unallocatedCash = getUnallocatedCash(totalAllocated);

  const [mode, setMode] = useState<"allocate" | "reduce">("allocate");
  const [amount, setAmount] = useState<string>("");
  const [allocationDate, setAllocationDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!goal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Please enter a positive amount");
      return;
    }

    const deltaAmount = mode === "allocate" ? parsedAmount : -parsedAmount;

    // Schema validation
    const rawPayload = {
      goalId: goal.id,
      amount: deltaAmount,
      allocationDate,
      note: note.trim().length > 0 ? note.trim() : undefined,
    };

    const validation = CreateGoalAllocationSchema.safeParse(rawPayload);
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || "Invalid allocation payload");
      return;
    }

    try {
      const allocation: GoalAllocation = {
        id: `alloc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        goalId: validation.data.goalId,
        amount: validation.data.amount,
        allocationDate: validation.data.allocationDate,
        note: validation.data.note,
        createdAt: new Date().toISOString(),
      };

      allocateToGoal(allocation, currentBalance);
      onClose();
      if (onAllocationUpdated) onAllocationUpdated();

      // Reset
      setAmount("");
      setNote("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An error occurred during allocation");
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "allocate" ? `Allocate Funds: ${goal.name}` : `Reduce Funds: ${goal.name}`}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        {/* Mode Toggle */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => {
              setMode("allocate");
              setErrorMessage(null);
            }}
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "0.5rem",
              border:
                mode === "allocate" ? "1px solid #10b981" : "1px solid rgba(255, 255, 255, 0.1)",
              background: mode === "allocate" ? "rgba(16, 185, 129, 0.15)" : "transparent",
              color: mode === "allocate" ? "#34d399" : "#94a3b8",
              fontWeight: 600,
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
          >
            Allocate Funds (+)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("reduce");
              setErrorMessage(null);
            }}
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "0.5rem",
              border:
                mode === "reduce" ? "1px solid #f59e0b" : "1px solid rgba(255, 255, 255, 0.1)",
              background: mode === "reduce" ? "rgba(245, 158, 11, 0.15)" : "transparent",
              color: mode === "reduce" ? "#fbbf24" : "#94a3b8",
              fontWeight: 600,
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
          >
            Reduce / Withdraw (-)
          </button>
        </div>

        {/* Real-time Liquidity & Invariant Banner */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "0.5rem",
            padding: "0.75rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
            fontSize: "0.75rem",
          }}
        >
          <div>
            <span style={{ color: "#94a3b8" }}>Current Goal Saved:</span>
            <div style={{ fontWeight: 600, color: "#f8fafc", marginTop: "0.15rem" }}>
              ₹{goal.allocatedAmount.toLocaleString("en-IN")} of ₹
              {goal.targetAmount.toLocaleString("en-IN")}
            </div>
          </div>
          <div>
            <span style={{ color: "#94a3b8" }}>Available Unallocated:</span>
            <div
              style={{
                fontWeight: 600,
                color: unallocatedCash > 0 ? "#34d399" : "#f43f5e",
                marginTop: "0.15rem",
              }}
            >
              ₹{unallocatedCash.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "0.375rem",
              background: "rgba(244, 63, 94, 0.15)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              color: "#fb7185",
              fontSize: "0.75rem",
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Amount */}
        <Input
          label={mode === "allocate" ? "Allocation Amount (INR)" : "Reduction Amount (INR)"}
          type="number"
          step="0.01"
          placeholder="e.g. 15000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        {/* Allocation Date */}
        <Input
          label="Date"
          type="date"
          value={allocationDate}
          onChange={(e) => setAllocationDate(e.target.value)}
          required
        />

        {/* Note */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#94a3b8" }}>
            Allocation Note (Optional)
          </label>
          <textarea
            rows={2}
            placeholder={
              mode === "allocate"
                ? "e.g. Monthly salary savings contribution..."
                : "e.g. Emergency expense withdrawal..."
            }
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "0.5rem",
              padding: "0.5rem 0.75rem",
              fontSize: "0.875rem",
              color: "#f8fafc",
              outline: "none",
              resize: "vertical",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            marginTop: "0.5rem",
          }}
        >
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant={mode === "allocate" ? "primary" : "secondary"}>
            {mode === "allocate" ? "Confirm Allocation" : "Confirm Reduction"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
