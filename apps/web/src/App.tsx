import React, { useEffect, useState, useMemo } from "react";
import { Header } from "./components/layout/Header";
import { SummaryCards } from "./components/dashboard/SummaryCards";
import { MLInsightsSection } from "./components/dashboard/MLInsightsSection";
import { AnalyticsSection } from "./components/dashboard/AnalyticsSection";
import { GoalsSection } from "./components/dashboard/GoalsSection";
import { TransactionsSection } from "./components/dashboard/TransactionsSection";
import { AIAdvisorSection } from "./components/dashboard/AIAdvisorSection";
import { AddTransactionModal } from "./components/modals/AddTransactionModal";
import { EditTransactionModal } from "./components/modals/EditTransactionModal";
import { UpdateBalanceModal } from "./components/modals/UpdateBalanceModal";
import { BalanceHistoryModal } from "./components/modals/BalanceHistoryModal";
import {
  useTransactionStore,
  useAnalysisStore,
  useGoalStore,
  useBalanceStore,
} from "@expense-tracker/state";
import { createFinancialAnalysisEngine } from "@expense-tracker/ml-contract";
import type { Transaction } from "@expense-tracker/domain";
import {
  initialSampleTransactions,
  initialSampleGoals,
  initialSampleAllocations,
  initialSampleBalanceRecords,
} from "./data/sample-data";

export const App: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isUpdateBalanceOpen, setIsUpdateBalanceOpen] = useState(false);
  const [isBalanceHistoryOpen, setIsBalanceHistoryOpen] = useState(false);

  const { transactions, setTransactions, filters } = useTransactionStore();
  const { analysisResult, runAnalysis } = useAnalysisStore();
  const { setGoals } = useGoalStore();
  const { balanceHistory, setBalanceHistory } = useBalanceStore();

  const engine = useMemo(() => createFinancialAnalysisEngine(), []);

  // Initialize sample data on mount if empty
  useEffect(() => {
    if (transactions.length === 0) {
      setTransactions(initialSampleTransactions);
      setGoals(initialSampleGoals, initialSampleAllocations);
    }
    if (balanceHistory.length === 0) {
      setBalanceHistory(initialSampleBalanceRecords);
    }
  }, [setTransactions, setGoals, setBalanceHistory, transactions.length, balanceHistory.length]);

  // Reactive ML Analysis computation whenever transactions or period change
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
    <div className="app-container">
      {/* Top Navigation & App Header */}
      <Header onOpenAddModal={() => setIsAddModalOpen(true)} onRefreshAnalysis={triggerAnalysis} />

      {/* Primary 4-Metric Summary Cards */}
      <SummaryCards
        analysis={analysisResult}
        onOpenUpdateBalance={() => setIsUpdateBalanceOpen(true)}
        onOpenBalanceHistory={() => setIsBalanceHistoryOpen(true)}
      />

      {/* Main Grid: Analytical & Behavioral Sections */}
      <div className="dashboard-grid">
        {/* Left Column (7 cols): Behavioral ML Insights & Spending Breakdown */}
        <div className="col-7" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <MLInsightsSection analysis={analysisResult} />
          <AnalyticsSection transactions={transactions} />
        </div>

        {/* Right Column (5 cols): AI Guidance & Savings Goals */}
        <div className="col-5" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <AIAdvisorSection />
          <GoalsSection />
        </div>

        {/* Full-width Transactions Section */}
        <div className="col-12">
          <TransactionsSection
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenEditModal={(tx) => setEditingTransaction(tx)}
          />
        </div>
      </div>

      {/* Add Record Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTransactionAdded={triggerAnalysis}
      />

      {/* Edit Record Modal */}
      <EditTransactionModal
        isOpen={editingTransaction !== null}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
        onTransactionUpdated={triggerAnalysis}
      />

      {/* Update Bank Balance Modal */}
      <UpdateBalanceModal
        isOpen={isUpdateBalanceOpen}
        onClose={() => setIsUpdateBalanceOpen(false)}
      />

      {/* Balance History Modal */}
      <BalanceHistoryModal
        isOpen={isBalanceHistoryOpen}
        onClose={() => setIsBalanceHistoryOpen(false)}
      />
    </div>
  );
};

export default App;
