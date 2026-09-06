import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTransactionStore } from "@expense-tracker/state";
import type { Transaction } from "@expense-tracker/domain";

export const TransactionsList: React.FC = () => {
  const { transactions } = useTransactionStore();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <View style={styles.list}>
        {transactions.slice(0, 8).map((tx: Transaction) => {
          const isIncome = tx.type === "income";

          return (
            <View key={tx.id} style={styles.row}>
              <View style={styles.leftCol}>
                <Text style={styles.desc}>{tx.description || tx.categoryId}</Text>
                <Text style={styles.meta}>
                  {tx.categoryId} • {tx.transactionDate}
                </Text>
              </View>
              <Text style={[styles.amount, { color: isIncome ? "#10b981" : "#f43f5e" }]}>
                {isIncome ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
              </Text>
            </View>
          );
        })}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 10,
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
  amount: {
    fontSize: 14,
    fontWeight: "700",
  },
});
