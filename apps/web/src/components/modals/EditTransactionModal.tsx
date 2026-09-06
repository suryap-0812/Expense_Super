import React, { useState, useEffect } from "react";
import { Modal, Input, Button } from "@expense-tracker/ui";
import { UpdateTransactionSchema } from "@expense-tracker/schemas";
import { useTransactionStore, useCategoryStore } from "@expense-tracker/state";
import type { Transaction } from "@expense-tracker/domain";

export interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onTransactionUpdated?: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onTransactionUpdated,
}) => {
  const { updateTransaction } = useTransactionStore();
  const { categories } = useCategoryStore();

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("Food");
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [transactionDate, setTransactionDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const paymentMethods = [
    "UPI",
    "Credit Card",
    "Debit Card",
    "Bank Transfer",
    "Cash",
    "Net Banking",
    "Other",
  ];

  // Populate form fields when transaction changes
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setCategoryId(transaction.categoryId);
      setPaymentMethod(transaction.paymentMethod);
      setTransactionDate(transaction.transactionDate);
      setDescription(transaction.description);
      setNotes(transaction.notes || "");
      setErrors({});
    }
  }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;
    setErrors({});

    const rawPayload = {
      type,
      amount: parseFloat(amount),
      categoryId,
      paymentMethod,
      transactionDate,
      description: description.trim(),
      notes: notes.trim().length > 0 ? notes.trim() : undefined,
    };

    const validation = UpdateTransactionSchema.safeParse(rawPayload);

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

    updateTransaction(transaction.id, {
      type: validation.data.type,
      amount: validation.data.amount,
      categoryId: validation.data.categoryId,
      paymentMethod: validation.data.paymentMethod,
      transactionDate: validation.data.transactionDate,
      description: validation.data.description,
      notes: validation.data.notes,
    });

    onClose();
    if (onTransactionUpdated) onTransactionUpdated();
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.type === type || c.type === "both" || c.name.toLowerCase() === categoryId.toLowerCase(),
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Financial Record">
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        {/* Type Toggle */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => setType("expense")}
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
            onClick={() => setType("income")}
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
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.name} style={{ background: "#0f172a" }}>
                  {c.name}
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

        {/* Optional Notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#94a3b8" }}>
            Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Add relevant context or memo..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
            Update Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};
