import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useGoalStore } from "@expense-tracker/state";
import type { Goal } from "@expense-tracker/domain";

export const GoalsProgress: React.FC = () => {
  const { goals, allocations } = useGoalStore();

  if (goals.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Savings Goals</Text>
      <View style={styles.goalsList}>
        {goals.map((goal: Goal) => {
          const current = allocations[goal.id] ?? 0;
          const pct = Math.min(100, Math.round((current / goal.targetAmount) * 100));

          return (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalName}>{goal.name}</Text>
                <Text style={styles.goalPct}>{pct}%</Text>
              </View>

              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
              </View>

              <View style={styles.goalFooter}>
                <Text style={styles.goalSub}>₹{current.toLocaleString("en-IN")} saved</Text>
                <Text style={styles.goalSub}>
                  Target: ₹{goal.targetAmount.toLocaleString("en-IN")}
                </Text>
              </View>
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 10,
  },
  goalsList: {
    gap: 10,
  },
  goalCard: {
    backgroundColor: "#0c1222",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 14,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  goalName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f8fafc",
  },
  goalPct: {
    fontSize: 13,
    fontWeight: "700",
    color: "#818cf8",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#6366f1",
    borderRadius: 3,
  },
  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  goalSub: {
    fontSize: 11,
    color: "#94a3b8",
  },
});
