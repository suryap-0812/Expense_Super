import React, { useState } from "react";
import { Modal, Input, Button } from "@expense-tracker/ui";
import { CreateBalanceRecordSchema } from "@expense-tracker/schemas";
import { useBalanceStore } from "@expense-tracker/state";
import type { BalanceRecord } from "@expense-tracker/domain";

export interface UpdateBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBalanceUpdated?: () => void;
}

export const UpdateBalanceModal: React.FC<UpdateBalanceModalProps> = ({
  isOpen,
  onClose,
  onBalanceUpdated,
}) => {
  const { currentBalance, addBalanceRecord } = useBalanceStore();

  const [balance, setBalance] = useState<string>(currentBalance > 0 ? String(currentBalance) : "");
  const [recordedAt, setRecordedAt] = useState<string>(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const rawPayload = {
      balance: parseFloat(balance),
      recordedAt,
      note: note.trim().length > 0 ? note.trim() : undefined,
    };

    const validation = CreateBalanceRecordSchema.safeParse(rawPayload);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string") {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    const newRecord: BalanceRecord = {
      id: `bal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      balance: validation.data.balance,
      recordedAt: validation.data.recordedAt,
      note: validation.data.note,
      createdAt: new Date().toISOString(),
    };

    addBalanceRecord(newRecord);
    onClose();
    if (onBalanceUpdated) onBalanceUpdated();

    // Reset form
    setNote("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Bank Balance">
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <p style={{ fontSize: "0.8125rem", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
          Enter your current verified bank balance from your banking app. This serves as your
          authoritative financial baseline.
        </p>

        {/* Balance Amount */}
        <Input
          label="Current Bank Balance (INR)"
          type="number"
          step="0.01"
          placeholder="e.g. 75000"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          error={errors.balance}
          required
        />

        {/* Recorded Date */}
        <Input
          label="Verification Date"
          type="date"
          value={recordedAt}
          onChange={(e) => setRecordedAt(e.target.value)}
          error={errors.recordedAt}
          required
        />

        {/* Context Note */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#94a3b8" }}>
            Reconciliation Note (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Verified via HDFC NetBanking post-salary credit..."
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
          <Button type="submit" variant="primary">
            Record Balance
          </Button>
        </div>
      </form>
    </Modal>
  );
};
