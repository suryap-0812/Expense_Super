import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { FinancialAnalysisResult } from "@expense-tracker/ml-contract";
import { useBalanceStore, useGoalStore } from "@expense-tracker/state";

interface SummaryCardsProps {
  analysis: FinancialAnalysisResult | null;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ analysis }) => {
  const { currentBalance, getUnallocatedCash } = useBalanceStore();
  const { getTotalAllocations } = useGoalStore();

  const totalGoalAllocations = getTotalAllocations();
  const displayBalance = currentBalance > 0 ? currentBalance : 450000;
  const unallocatedCash = getUnallocatedCash(totalGoalAllocations);

  const totalIncome = analysis?.summary.totalIncome ?? 75000;
  const totalExpense = analysis?.summary.totalExpense ?? 30850;
  const savingsRate = analysis?.summary.savingsRate ?? 58.8;

  return (
    <View style={styles.grid}>
      <View style={styles.card}>
        <Text style={styles.label}>Bank Balance (Manual)</Text>
        <Text style={[styles.value, { color: "#f8fafc" }]}>
          ₹{displayBalance.toLocaleString("en-IN")}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Unallocated Cash</Text>
        <Text style={[styles.value, { color: "#34d399" }]}>
          ₹{unallocatedCash.toLocaleString("en-IN")}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Monthly Income</Text>
        <Text style={[styles.value, { color: "#10b981" }]}>
          ₹{totalIncome.toLocaleString("en-IN")}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Expenses / Savings</Text>
        <Text style={[styles.value, { color: "#f43f5e" }]}>
          ₹{totalExpense.toLocaleString("en-IN")}{" "}
          <Text style={{ fontSize: 12, color: "#818cf8" }}>
            ({savingsRate !== null ? `${savingsRate.toFixed(0)}%` : ""})
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: "#0c1222",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 6,
  },
});
