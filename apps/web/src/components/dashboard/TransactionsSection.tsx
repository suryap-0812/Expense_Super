import React, { useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  X,
} from "lucide-react";
import { Card, Button, Badge } from "@expense-tracker/ui";
import {
  useTransactionStore,
  useCategoryStore,
  selectFilteredTransactions,
  type TransactionSortField,
} from "@expense-tracker/state";
import type { Transaction } from "@expense-tracker/domain";

export interface TransactionsSectionProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (transaction: Transaction) => void;
}

export const TransactionsSection: React.FC<TransactionsSectionProps> = ({
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const {
    transactions,
    filters,
    setSearchQuery,
    setTypeFilter,
    setCategoryFilter,
    setPaymentMethodFilter,
    setSorting,
    resetFilters,
    deleteTransaction,
  } = useTransactionStore();

  const { categories } = useCategoryStore();
  const [selectedTxIdForNotes, setSelectedTxIdForNotes] = useState<string | null>(null);

  const filtered = selectFilteredTransactions(transactions, filters);

  const handleSort = (field: TransactionSortField) => {
    if (filters.sortField === field) {
      const nextOrder = filters.sortOrder === "asc" ? "desc" : "asc";
      setSorting(field, nextOrder);
    } else {
      setSorting(field, "asc");
    }
  };

  const renderSortIcon = (field: TransactionSortField) => {
    if (filters.sortField !== field) {
      return <ArrowUpDown size={12} color="#64748b" style={{ marginLeft: 4 }} />;
    }
    return filters.sortOrder === "asc" ? (
      <ArrowUp size={12} color="#6366f1" style={{ marginLeft: 4 }} />
    ) : (
      <ArrowDown size={12} color="#6366f1" style={{ marginLeft: 4 }} />
    );
  };

  const paymentMethods = [
    "UPI",
    "Credit Card",
    "Debit Card",
    "Bank Transfer",
    "Cash",
    "Net Banking",
    "Other",
  ];

  const handleDelete = (id: string, description: string) => {
    if (window.confirm(`Are you sure you want to delete transaction "${description}"?`)) {
      deleteTransaction(id);
    }
  };

  const isFilterActive =
    filters.type !== "all" ||
    filters.category !== null ||
    filters.paymentMethod !== null ||
    filters.searchQuery.trim().length > 0;

  return (
    <Card
      variant="glass"
      padding="md"
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      {/* Table Header & Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <h2 style={{ fontSize: "1.05rem", margin: 0 }}>Transactions Ledger</h2>
          <Badge variant="neutral" size="sm">
            {filtered.length} of {transactions.length} records
          </Badge>
          {isFilterActive && (
            <button
              onClick={resetFilters}
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "0.25rem",
                color: "#f87171",
                fontSize: "0.75rem",
                padding: "0.15rem 0.4rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                cursor: "pointer",
              }}
              title="Reset all filters"
            >
              <X size={12} /> Clear Filters
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {/* Search Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "0.375rem",
              padding: "0.25rem 0.6rem",
            }}
          >
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search memo, notes..."
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "#f8fafc",
                fontSize: "0.8125rem",
                outline: "none",
                width: "150px",
              }}
            />
            {filters.searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Type Filter Buttons */}
          <div
            style={{
              display: "flex",
              background: "rgba(0, 0, 0, 0.4)",
              borderRadius: "0.375rem",
              padding: "0.15rem",
            }}
          >
            {(["all", "income", "expense"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                style={{
                  background: filters.type === type ? "rgba(99, 102, 241, 0.3)" : "transparent",
                  color: filters.type === type ? "#f8fafc" : "#94a3b8",
                  border: "none",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Category Dropdown Filter */}
          <select
            value={filters.category || ""}
            onChange={(e) => setCategoryFilter(e.target.value || null)}
            style={{
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "0.375rem",
              padding: "0.25rem 0.5rem",
              color: filters.category ? "#f8fafc" : "#94a3b8",
              fontSize: "0.75rem",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="" style={{ background: "#0f172a" }}>
              All Categories
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.name} style={{ background: "#0f172a" }}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Payment Method Dropdown Filter */}
          <select
            value={filters.paymentMethod || ""}
            onChange={(e) => setPaymentMethodFilter(e.target.value || null)}
            style={{
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "0.375rem",
              padding: "0.25rem 0.5rem",
              color: filters.paymentMethod ? "#f8fafc" : "#94a3b8",
              fontSize: "0.75rem",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="" style={{ background: "#0f172a" }}>
              All Payment Methods
            </option>
            {paymentMethods.map((m) => (
              <option key={m} value={m} style={{ background: "#0f172a" }}>
                {m}
              </option>
            ))}
          </select>

          <Button variant="primary" size="sm" onClick={onOpenAddModal} icon={<Plus size={14} />}>
            Add
          </Button>
        </div>
      </div>

      {/* Dense Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th
                onClick={() => handleSort("date")}
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                Date {renderSortIcon("date")}
              </th>
              <th
                onClick={() => handleSort("description")}
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                Description {renderSortIcon("description")}
              </th>
              <th
                onClick={() => handleSort("category")}
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                Category {renderSortIcon("category")}
              </th>
              <th>Method</th>
              <th
                onClick={() => handleSort("amount")}
                style={{ textAlign: "right", cursor: "pointer", userSelect: "none" }}
              >
                Amount (INR) {renderSortIcon("amount")}
              </th>
              <th style={{ textAlign: "center", width: "70px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}
                >
                  No transactions match the selected criteria.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <React.Fragment key={tx.id}>
                  <tr>
                    <td className="num-mono" style={{ color: "var(--text-secondary)" }}>
                      {tx.transactionDate}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <span>{tx.description}</span>
                        {tx.notes && (
                          <button
                            onClick={() =>
                              setSelectedTxIdForNotes((prev) => (prev === tx.id ? null : tx.id))
                            }
                            style={{
                              background: "transparent",
                              border: "none",
                              color: selectedTxIdForNotes === tx.id ? "#6366f1" : "#64748b",
                              cursor: "pointer",
                              padding: 0,
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                            title={tx.notes}
                          >
                            <FileText size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant="neutral" size="sm">
                        {tx.categoryId}
                      </Badge>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      {tx.paymentMethod}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 600,
                        color: tx.type === "income" ? "#10b981" : "#f43f5e",
                      }}
                      className="num-mono"
                    >
                      {tx.type === "income" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <button
                          onClick={() => onOpenEditModal(tx)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#64748b",
                            cursor: "pointer",
                            padding: "0.2rem",
                            borderRadius: "0.25rem",
                          }}
                          title="Edit transaction"
                          aria-label="Edit record"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id, tx.description)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#64748b",
                            cursor: "pointer",
                            padding: "0.2rem",
                            borderRadius: "0.25rem",
                          }}
                          title="Delete transaction"
                          aria-label="Delete record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded Notes Row */}
                  {selectedTxIdForNotes === tx.id && tx.notes && (
                    <tr style={{ background: "rgba(99, 102, 241, 0.05)" }}>
                      <td
                        colSpan={6}
                        style={{
                          fontSize: "0.75rem",
                          color: "#94a3b8",
                          padding: "0.4rem 1rem",
                          borderTop: "1px dashed rgba(255, 255, 255, 0.06)",
                        }}
                      >
                        <strong style={{ color: "#c7d2fe" }}>Notes:</strong> {tx.notes}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
