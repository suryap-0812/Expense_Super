import React from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Card, Button, Badge } from "@expense-tracker/ui";
import { useTransactionStore, selectFilteredTransactions } from "@expense-tracker/state";

export interface TransactionsSectionProps {
  onOpenAddModal: () => void;
}

export const TransactionsSection: React.FC<TransactionsSectionProps> = ({ onOpenAddModal }) => {
  const { transactions, filters, setSearchQuery, setTypeFilter, deleteTransaction } =
    useTransactionStore();

  const filtered = selectFilteredTransactions(transactions, filters);

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
              placeholder="Search ledger..."
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "#f8fafc",
                fontSize: "0.8125rem",
                outline: "none",
                width: "140px",
              }}
            />
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
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Method</th>
              <th style={{ textAlign: "right" }}>Amount (INR)</th>
              <th style={{ textAlign: "center", width: "40px" }}></th>
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
                <tr key={tx.id}>
                  <td className="num-mono" style={{ color: "var(--text-secondary)" }}>
                    {tx.transactionDate}
                  </td>
                  <td style={{ fontWeight: 500 }}>{tx.description}</td>
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
                    <button
                      onClick={() => deleteTransaction(tx.id)}
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
