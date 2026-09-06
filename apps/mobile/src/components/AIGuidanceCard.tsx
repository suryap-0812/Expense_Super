import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { FinancialAnalysisResult } from "@expense-tracker/ml-contract";
import type { LLMFinding } from "@expense-tracker/schemas";
import type { LLMAnalysisResult } from "@expense-tracker/llm-client";

interface AIGuidanceCardProps {
  analysis: FinancialAnalysisResult | null;
  guidanceResult?: LLMAnalysisResult | null;
  isGenerating?: boolean;
  onRefresh?: () => void;
}

export const AIGuidanceCard: React.FC<AIGuidanceCardProps> = ({
  guidanceResult,
  isGenerating = false,
  onRefresh,
}) => {
  const findings: LLMFinding[] = guidanceResult?.findings ?? [];
  const summary = guidanceResult?.summary ?? null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>AI Financial Guidance</Text>
          <Text style={styles.subtitle}>Grounded ML + LLM Coaching</Text>
        </View>
        {onRefresh && (
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} disabled={isGenerating}>
            {isGenerating ? (
              <ActivityIndicator size="small" color="#c7d2fe" />
            ) : (
              <Text style={styles.refreshBtnText}>Refresh</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Provenance Tiers */}
      <View style={styles.provenanceRow}>
        <View style={[styles.badge, styles.badgeCalc]}>
          <Text style={styles.badgeTextCalc}>● Calculated</Text>
        </View>
        <View style={[styles.badge, styles.badgeML]}>
          <Text style={styles.badgeTextML}>● ML Detected</Text>
        </View>
        <View style={[styles.badge, styles.badgeLLM]}>
          <Text style={styles.badgeTextLLM}>● LLM Suggested</Text>
        </View>
      </View>

      {/* Summary */}
      {summary ? (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Executive Summary</Text>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
      ) : (
        <Text style={styles.placeholderText}>
          Tap refresh to generate grounded financial findings and actionable recommendations.
        </Text>
      )}

      {/* Findings */}
      {findings.map((finding, idx) => (
        <View key={idx} style={styles.findingCard}>
          <View style={styles.findingHeader}>
            <Text style={styles.findingTitle}>{finding.title}</Text>
            <View
              style={[
                styles.priorityBadge,
                finding.priority === "high"
                  ? styles.priorityHigh
                  : finding.priority === "medium"
                    ? styles.priorityMedium
                    : styles.priorityLow,
              ]}
            >
              <Text
                style={[
                  styles.priorityText,
                  finding.priority === "high"
                    ? styles.priorityTextHigh
                    : finding.priority === "medium"
                      ? styles.priorityTextMedium
                      : styles.priorityTextLow,
                ]}
              >
                {finding.priority.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Evidence */}
          <View style={styles.evidenceBox}>
            <Text style={styles.evidenceLabel}>Evidence:</Text>
            <Text style={styles.evidenceText}>{finding.evidence}</Text>
          </View>

          {/* Explanation */}
          <Text style={styles.explanationText}>{finding.explanation}</Text>

          {/* Recommendation */}
          <View style={styles.recommendationBox}>
            <Text style={styles.recommendationLabel}>Recommendation:</Text>
            <Text style={styles.recommendationText}>{finding.recommendation}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.35)",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f8fafc",
  },
  subtitle: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  refreshBtn: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.4)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  refreshBtnText: {
    color: "#c7d2fe",
    fontSize: 12,
    fontWeight: "600",
  },
  provenanceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeCalc: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderWidth: 1,
  },
  badgeTextCalc: {
    color: "#34d399",
    fontSize: 9,
    fontWeight: "600",
  },
  badgeML: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    borderColor: "rgba(139, 92, 246, 0.3)",
    borderWidth: 1,
  },
  badgeTextML: {
    color: "#a78bfa",
    fontSize: 9,
    fontWeight: "600",
  },
  badgeLLM: {
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    borderColor: "rgba(6, 182, 212, 0.3)",
    borderWidth: 1,
  },
  badgeTextLLM: {
    color: "#22d3ee",
    fontSize: 9,
    fontWeight: "600",
  },
  summaryBox: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
    borderRadius: 8,
    padding: 10,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#22d3ee",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 12,
    color: "#f8fafc",
    lineHeight: 16,
  },
  placeholderText: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
  },
  findingCard: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  findingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  findingTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#f8fafc",
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityHigh: {
    backgroundColor: "rgba(244, 63, 94, 0.2)",
  },
  priorityMedium: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
  },
  priorityLow: {
    backgroundColor: "rgba(14, 165, 233, 0.2)",
  },
  priorityText: {
    fontSize: 9,
    fontWeight: "700",
  },
  priorityTextHigh: {
    color: "#fb7185",
  },
  priorityTextMedium: {
    color: "#fbbf24",
  },
  priorityTextLow: {
    color: "#38bdf8",
  },
  evidenceBox: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 6,
    padding: 8,
  },
  evidenceLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  evidenceText: {
    fontSize: 11,
    color: "#cbd5e1",
    fontFamily: "monospace",
    marginTop: 2,
  },
  explanationText: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 16,
  },
  recommendationBox: {
    backgroundColor: "rgba(6, 182, 212, 0.08)",
    borderLeftWidth: 2,
    borderLeftColor: "#22d3ee",
    borderRadius: 4,
    padding: 8,
  },
  recommendationLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#22d3ee",
    textTransform: "uppercase",
  },
  recommendationText: {
    fontSize: 12,
    color: "#f8fafc",
    fontWeight: "500",
    marginTop: 2,
  },
});
