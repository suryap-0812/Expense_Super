import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, ScrollView, SafeAreaView, StatusBar } from "react-native";
import { Header } from "./components/Header.js";
import { SummaryCards } from "./components/SummaryCards.js";
import { MLInsightsCard } from "./components/MLInsightsCard.js";
import { GoalsProgress } from "./components/GoalsProgress.js";
import { TransactionsList } from "./components/TransactionsList.js";
import { useTransactionStore, useAnalysisStore, useGoalStore } from "@expense-tracker/state";
import { createFinancialAnalysisEngine } from "@expense-tracker/ml-contract";
import {
  initialMobileTransactions,
  initialMobileGoals,
  initialMobileAllocations,
} from "./data/sample-data.js";

export const App: React.FC = () => {
  const [isBusy, setIsBusy] = useState(false);
  const { transactions, setTransactions, filters } = useTransactionStore();
  const { analysisResult, runAnalysis } = useAnalysisStore();
  const { setGoals } = useGoalStore();

  const engine = useMemo(() => createFinancialAnalysisEngine(), []);

  // Initialize sample data on mount if empty
  useEffect(() => {
    if (transactions.length === 0) {
      setTransactions(initialMobileTransactions);
      setGoals(initialMobileGoals, initialMobileAllocations);
    }
  }, [setTransactions, setGoals, transactions.length]);

  // Reactive financial analysis execution
  const triggerAnalysis = React.useCallback(async () => {
    if (transactions.length > 0) {
      setIsBusy(true);
      try {
        await runAnalysis(engine, {
          transactions,
          period: filters.period,
        });
      } finally {
        setIsBusy(false);
      }
    }
  }, [engine, filters.period, runAnalysis, transactions]);

  useEffect(() => {
    triggerAnalysis();
  }, [triggerAnalysis]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#060911" />
      <Header onRefresh={triggerAnalysis} isAnalyzing={isBusy} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <SummaryCards analysis={analysisResult} />
        <MLInsightsCard analysis={analysisResult} />
        <GoalsProgress />
        <TransactionsList />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#060911",
  },
  scrollView: {
    flex: 1,
  },
});

export default App;
