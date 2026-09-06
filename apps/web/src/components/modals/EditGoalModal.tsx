import React, { useState, useEffect } from "react";
import { Modal, Input, Button } from "@expense-tracker/ui";
import { UpdateGoalSchema } from "@expense-tracker/schemas";
import { useGoalStore } from "@expense-tracker/state";
import type { Goal, GoalStatus } from "@expense-tracker/domain";

export interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onGoalUpdated?: () => void;
}

export const EditGoalModal: React.FC<EditGoalModalProps> = ({
  isOpen,
  onClose,
  goal,
  onGoalUpdated,
}) => {
  const { updateGoal } = useGoalStore();

  const [name, setName] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [deadline, setDeadline] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [status, setStatus] = useState<GoalStatus>("active");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(String(goal.targetAmount));
      setDeadline(goal.deadline || "");
      setDescription(goal.description || "");
      setStatus(goal.status);
      setErrors({});
    }
  }, [goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal) return;
    setErrors({});

    const rawPayload = {
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      deadline: deadline.trim().length > 0 ? deadline : undefined,
      description: description.trim().length > 0 ? description.trim() : undefined,
      status,
    };

    const validation = UpdateGoalSchema.safeParse(rawPayload);

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

    updateGoal(goal.id, {
      name: validation.data.name,
      targetAmount: validation.data.targetAmount,
      deadline: validation.data.deadline,
      description: validation.data.description,
      status: validation.data.status,
    });

    onClose();
    if (onGoalUpdated) onGoalUpdated();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Savings Goal">
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        {/* Goal Name */}
        <Input
          label="Goal Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />

        {/* Target Amount */}
        <Input
          label="Target Amount (INR)"
          type="number"
          step="0.01"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          error={errors.targetAmount}
          required
        />

        {/* Status */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#94a3b8" }}>
            Goal Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as GoalStatus)}
            style={{
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "0.5rem",
              padding: "0.5rem 0.75rem",
              fontSize: "0.875rem",
              color: "#f8fafc",
              outline: "none",
            }}
          >
            <option value="active" style={{ background: "#0f172a" }}>
              Active
            </option>
            <option value="completed" style={{ background: "#0f172a" }}>
              Completed
            </option>
            <option value="archived" style={{ background: "#0f172a" }}>
              Archived
            </option>
            <option value="cancelled" style={{ background: "#0f172a" }}>
              Cancelled
            </option>
          </select>
        </div>

        {/* Deadline */}
        <Input
          label="Target Deadline (Optional)"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          error={errors.deadline}
        />

        {/* Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#94a3b8" }}>
            Description / Memo (Optional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            Update Goal
          </Button>
        </div>
      </form>
    </Modal>
  );
};
