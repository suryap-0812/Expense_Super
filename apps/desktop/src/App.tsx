import React, { useEffect, useMemo } from "react";
import { DesktopHeader } from "./components/DesktopHeader.js";
import { DesktopDashboardView } from "./components/DesktopDashboardView.js";
import { useTransactionStore, useAnalysisStore, useGoalStore } from "@expense-tracker/state";
import { createFinancialAnalysisEngine } from "@expense-tracker/ml-contract";
import {
  initialSampleTransactions,
  initialSampleGoals,
  initialSampleAllocations,
} from "./data/sample-data.js";

export const App: React.FC = () => {
  const { transactions, setTransactions, filters } = useTransactionStore();
  const { analysisResult, runAnalysis } = useAnalysisStore();
  const { setGoals } = useGoalStore();

  const engine = useMemo(() => createFinancialAnalysisEngine(), []);

  // Initialize sample data on mount if empty
  useEffect(() => {
    if (transactions.length === 0) {
      setTransactions(initialSampleTransactions);
      setGoals(initialSampleGoals, initialSampleAllocations);
    }
  }, [setTransactions, setGoals, transactions.length]);

  // Reactive financial analysis execution
  const triggerAnalysis = React.useCallback(() => {
    if (transactions.length > 0) {
      runAnalysis(engine, {
        transactions,
        period: filters.period,
      });
    }
  }, [engine, filters.period, runAnalysis, transactions]);

  useEffect(() => {
    triggerAnalysis();
  }, [triggerAnalysis]);

  return (
    <div className="desktop-container">
      <DesktopHeader onRefreshAnalysis={triggerAnalysis} />
      <main className="desktop-content">
        <DesktopDashboardView analysis={analysisResult} />
      </main>
    </div>
  );
};
