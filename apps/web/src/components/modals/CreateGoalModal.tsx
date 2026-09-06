import React, { useState } from "react";
import { Modal, Input, Button } from "@expense-tracker/ui";
import { CreateGoalSchema } from "@expense-tracker/schemas";
import { useGoalStore } from "@expense-tracker/state";
import type { Goal } from "@expense-tracker/domain";

export interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalCreated?: () => void;
}

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  isOpen,
  onClose,
  onGoalCreated,
}) => {
  const { addGoal } = useGoalStore();

  const [name, setName] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [deadline, setDeadline] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const rawPayload = {
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      deadline: deadline.trim().length > 0 ? deadline : undefined,
      description: description.trim().length > 0 ? description.trim() : undefined,
      status: "active" as const,
    };

    const validation = CreateGoalSchema.safeParse(rawPayload);

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

    const newGoal: Goal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: validation.data.name,
      targetAmount: validation.data.targetAmount,
      deadline: validation.data.deadline,
      description: validation.data.description,
      status: validation.data.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addGoal(newGoal);
    onClose();
    if (onGoalCreated) onGoalCreated();

    // Reset form
    setName("");
    setTargetAmount("");
    setDeadline("");
    setDescription("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Savings Goal">
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <p style={{ fontSize: "0.8125rem", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
          Define a dedicated savings target. Funds can be reserved into this goal from your verified
          bank balance.
        </p>

        {/* Goal Name */}
        <Input
          label="Goal Name"
          placeholder="e.g. Emergency Fund (6 Months), New Laptop..."
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
          placeholder="e.g. 100000"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          error={errors.targetAmount}
          required
        />

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
            placeholder="Details about target purpose or priority..."
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
            Create Goal
          </Button>
        </div>
      </form>
    </Modal>
  );
};
