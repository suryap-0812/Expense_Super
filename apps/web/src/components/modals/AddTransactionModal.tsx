import React, { useState } from "react";
import { Modal, Input, Button } from "@expense-tracker/ui";
import { CreateTransactionSchema } from "@expense-tracker/schemas";
import { useTransactionStore } from "@expense-tracker/state";
import type { Transaction } from "@expense-tracker/domain";

export interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionAdded?: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onTransactionAdded,
}) => {
  const { addTransaction } = useTransactionStore();

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("Food");
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [description, setDescription] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    "Food",
    "Dining",
    "Shopping",
    "Transport",
    "Utilities",
    "Rent",
    "Entertainment",
    "Health",
    "Salary",
    "Freelance",
    "Investment",
    "Other",
  ];

  const paymentMethods = ["UPI", "Credit Card", "Debit Card", "Bank Transfer", "Cash"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const rawPayload = {
      type,
      amount: parseFloat(amount),
      categoryId,
      paymentMethod,
      transactionDate,
      description: description.trim(),
    };

    const validation = CreateTransactionSchema.safeParse(rawPayload);

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

    const newTx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: validation.data.type,
      amount: validation.data.amount,
      categoryId: validation.data.categoryId,
      paymentMethod: validation.data.paymentMethod,
      transactionDate: validation.data.transactionDate,
      description: validation.data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addTransaction(newTx);
    onClose();
    if (onTransactionAdded) onTransactionAdded();

    // Reset form
    setAmount("");
    setDescription("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Financial Record">
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        {/* Type Toggle */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => {
              setType("expense");
              if (categoryId === "Salary" || categoryId === "Freelance") setCategoryId("Food");
            }}
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "0.5rem",
              border:
                type === "expense" ? "1px solid #f43f5e" : "1px solid rgba(255, 255, 255, 0.1)",
              background: type === "expense" ? "rgba(244, 63, 94, 0.15)" : "transparent",
              color: type === "expense" ? "#fb7185" : "#94a3b8",
              fontWeight: 600,
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
          >
            Expense (-)
          </button>
          <button
            type="button"
            onClick={() => {
              setType("income");
              setCategoryId("Salary");
            }}
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "0.5rem",
              border:
                type === "income" ? "1px solid #10b981" : "1px solid rgba(255, 255, 255, 0.1)",
              background: type === "income" ? "rgba(16, 185, 129, 0.15)" : "transparent",
              color: type === "income" ? "#34d399" : "#94a3b8",
              fontWeight: 600,
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
          >
            Income (+)
          </button>
        </div>

        {/* Amount */}
        <Input
          label="Amount (INR)"
          type="number"
          step="0.01"
          placeholder="e.g. 2500"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          required
        />

        {/* Description */}
        <Input
          label="Description"
          placeholder="e.g. Monthly groceries or Client payment"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          required
        />

        {/* Category & Payment Method Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#94a3b8" }}>
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
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
              {categories.map((c) => (
                <option key={c} value={c} style={{ background: "#0f172a" }}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#94a3b8" }}>
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
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
              {paymentMethods.map((m) => (
                <option key={m} value={m} style={{ background: "#0f172a" }}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Transaction Date */}
        <Input
          label="Transaction Date"
          type="date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
          error={errors.transactionDate}
          required
        />

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
            Save Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};
