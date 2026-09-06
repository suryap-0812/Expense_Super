import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface HeaderProps {
  onRefresh: () => void;
  isAnalyzing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, isAnalyzing = false }) => {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>ExpenseSuper</Text>
        <Text style={styles.subtitle}>Mobile Intelligence</Text>
      </View>
      <TouchableOpacity
        style={[styles.button, isAnalyzing && styles.buttonDisabled]}
        onPress={onRefresh}
        disabled={isAnalyzing}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>{isAnalyzing ? "Analyzing..." : "Run ML"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#0c1222",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f8fafc",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "600",
    marginTop: 2,
  },
  button: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
});
