import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { FinancialAnalysisResult } from "@expense-tracker/ml-contract";

interface MLInsightsCardProps {
  analysis: FinancialAnalysisResult | null;
}

export const MLInsightsCard: React.FC<MLInsightsCardProps> = ({ analysis }) => {
  const archetype = analysis?.persona?.archetype ?? "Balanced Optimizer";
  const description =
    analysis?.persona?.description ??
    "Consistently maintains high savings rate with low volatility discretionary spending.";
  const isAnomalous = analysis?.anomaly?.isAnomalous ?? false;
  const anomalyScore = analysis?.anomaly?.anomalyScore ?? 0.05;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Behavioral Archetype</Text>
        <View style={[styles.badge, isAnomalous ? styles.badgeDanger : styles.badgeNominal]}>
          <Text
            style={[
              styles.badgeText,
              isAnomalous ? styles.badgeTextDanger : styles.badgeTextNominal,
            ]}
          >
            {isAnomalous ? `Anomaly (${(anomalyScore * 100).toFixed(0)}%)` : "Normal Baseline"}
          </Text>
        </View>
      </View>

      <Text style={styles.archetypeText}>{archetype}</Text>
      <Text style={styles.descriptionText}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#0c1222",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
    borderRadius: 14,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: "#a5b4fc",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeNominal: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  badgeDanger: {
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.3)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  badgeTextNominal: {
    color: "#34d399",
  },
  badgeTextDanger: {
    color: "#fda4af",
  },
  archetypeText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18,
  },
});
