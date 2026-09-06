import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { FinancialAnalysisResult } from "@expense-tracker/ml-contract";

interface SummaryCardsProps {
  analysis: FinancialAnalysisResult | null;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ analysis }) => {
  const totalIncome = analysis?.summary.totalIncome ?? 75000;
  const totalExpense = analysis?.summary.totalExpense ?? 30850;
  const savingsRate = analysis?.summary.savingsRate ?? 58.8;
  const netSavings = analysis?.summary.netSavings ?? 44150;

  return (
    <View style={styles.grid}>
      <View style={styles.card}>
        <Text style={styles.label}>Income</Text>
        <Text style={[styles.value, { color: "#10b981" }]}>
          ₹{totalIncome.toLocaleString("en-IN")}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Expenses</Text>
        <Text style={[styles.value, { color: "#f43f5e" }]}>
          ₹{totalExpense.toLocaleString("en-IN")}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Net Savings</Text>
        <Text style={[styles.value, { color: netSavings >= 0 ? "#10b981" : "#f43f5e" }]}>
          ₹{netSavings.toLocaleString("en-IN")}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Savings Rate</Text>
        <Text style={[styles.value, { color: "#818cf8" }]}>
          {savingsRate !== null ? `${savingsRate.toFixed(1)}%` : "N/A"}
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
