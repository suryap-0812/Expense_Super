import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  useTransactionStore,
  selectFilteredTransactions,
  type TransactionFilterType,
} from "@expense-tracker/state";
import type { Transaction } from "@expense-tracker/domain";

export const TransactionsList: React.FC = () => {
  const { transactions, filters, setTypeFilter } = useTransactionStore();
  const filtered = selectFilteredTransactions(transactions, filters);

  const filterTabs: TransactionFilterType[] = ["all", "income", "expense"];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Transactions ({filtered.length})</Text>
        <View style={styles.tabContainer}>
          {filterTabs.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setTypeFilter(type)}
              style={[styles.tab, filters.type === type && styles.activeTab]}
            >
              <Text style={[styles.tabText, filters.type === type && styles.activeTabText]}>
                {type.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          filtered.slice(0, 10).map((tx: Transaction) => {
            const isIncome = tx.type === "income";

            return (
              <View key={tx.id} style={styles.row}>
                <View style={styles.leftCol}>
                  <Text style={styles.desc}>{tx.description || tx.categoryId}</Text>
                  <Text style={styles.meta}>
                    {tx.categoryId} • {tx.paymentMethod} • {tx.transactionDate}
                  </Text>
                  {tx.notes ? <Text style={styles.notes}>Note: {tx.notes}</Text> : null}
                </View>
                <Text style={[styles.amount, { color: isIncome ? "#10b981" : "#f43f5e" }]}>
                  {isIncome ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f8fafc",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 6,
    padding: 2,
  },
  tab: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeTab: {
    backgroundColor: "rgba(99, 102, 241, 0.4)",
  },
  tabText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94a3b8",
  },
  activeTabText: {
    color: "#f8fafc",
  },
  list: {
    backgroundColor: "#0c1222",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  leftCol: {
    flex: 1,
    paddingRight: 10,
  },
  desc: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f8fafc",
  },
  meta: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  notes: {
    fontSize: 11,
    color: "#818cf8",
    marginTop: 2,
    fontStyle: "italic",
  },
  amount: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 13,
  },
});
