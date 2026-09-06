import React, { useEffect, useState, useMemo } from "react";
import { Header } from "./components/layout/Header";
import { SummaryCards } from "./components/dashboard/SummaryCards";
import { MLInsightsSection } from "./components/dashboard/MLInsightsSection";
import { SpendingTrendsSection } from "./components/dashboard/SpendingTrendsSection";
import { AnalyticsSection } from "./components/dashboard/AnalyticsSection";
import { GoalsSection } from "./components/dashboard/GoalsSection";
import { TransactionsSection } from "./components/dashboard/TransactionsSection";
import { AIAdvisorSection } from "./components/dashboard/AIAdvisorSection";
import { AddTransactionModal } from "./components/modals/AddTransactionModal";
import { EditTransactionModal } from "./components/modals/EditTransactionModal";
import { UpdateBalanceModal } from "./components/modals/UpdateBalanceModal";
import { BalanceHistoryModal } from "./components/modals/BalanceHistoryModal";
import { CreateGoalModal } from "./components/modals/CreateGoalModal";
import { EditGoalModal } from "./components/modals/EditGoalModal";
import { GoalAllocationModal } from "./components/modals/GoalAllocationModal";
import { GoalHistoryModal } from "./components/modals/GoalHistoryModal";
import {
  useTransactionStore,
  useAnalysisStore,
  useGoalStore,
  useBalanceStore,
} from "@expense-tracker/state";
import { createFinancialAnalysisEngine } from "@expense-tracker/ml-contract";
import type { Transaction, GoalWithProgress } from "@expense-tracker/domain";
import {
  initialSampleTransactions,
  initialSampleGoals,
  initialSampleAllocations,
  initialSampleGoalAllocations,
  initialSampleBalanceRecords,
} from "./data/sample-data";

export const App: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isUpdateBalanceOpen, setIsUpdateBalanceOpen] = useState(false);
  const [isBalanceHistoryOpen, setIsBalanceHistoryOpen] = useState(false);

  // Goal Modals State
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null);
  const [allocatingGoal, setAllocatingGoal] = useState<GoalWithProgress | null>(null);
  const [historyGoal, setHistoryGoal] = useState<GoalWithProgress | null>(null);

  const { transactions, setTransactions, filters } = useTransactionStore();
  const { analysisResult, runAnalysis } = useAnalysisStore();
  const { goals, setGoals } = useGoalStore();
  const { balanceHistory, setBalanceHistory } = useBalanceStore();

  const engine = useMemo(() => createFinancialAnalysisEngine(), []);

  // Initialize sample data on mount if empty
  useEffect(() => {
    if (transactions.length === 0) {
      setTransactions(initialSampleTransactions);
    }
    if (goals.length === 0) {
      setGoals(initialSampleGoals, initialSampleAllocations, initialSampleGoalAllocations);
    }
    if (balanceHistory.length === 0) {
      setBalanceHistory(initialSampleBalanceRecords);
    }
  }, [
    setTransactions,
    setGoals,
    setBalanceHistory,
    transactions.length,
    goals.length,
    balanceHistory.length,
  ]);

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
        {/* Left Column (7 cols): Monthly Trends & Spending Breakdown */}
        <div className="col-7" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <SpendingTrendsSection transactions={transactions} />
          <AnalyticsSection transactions={transactions} analysis={analysisResult} />
        </div>

        {/* Right Column (5 cols): ML Insights, Goals & AI Advisor */}
        <div className="col-5" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <MLInsightsSection analysis={analysisResult} />
          <GoalsSection
            onOpenCreateGoal={() => setIsCreateGoalOpen(true)}
            onOpenEditGoal={(goal) => setEditingGoal(goal)}
            onOpenAllocation={(goal) => setAllocatingGoal(goal)}
            onOpenHistory={(goal) => setHistoryGoal(goal)}
          />
          <AIAdvisorSection analysis={analysisResult} />
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

      {/* Create Goal Modal */}
      <CreateGoalModal isOpen={isCreateGoalOpen} onClose={() => setIsCreateGoalOpen(false)} />

      {/* Edit Goal Modal */}
      <EditGoalModal
        isOpen={editingGoal !== null}
        onClose={() => setEditingGoal(null)}
        goal={editingGoal}
      />

      {/* Goal Allocation / Reduction Modal */}
      <GoalAllocationModal
        isOpen={allocatingGoal !== null}
        onClose={() => setAllocatingGoal(null)}
        goal={allocatingGoal}
      />

      {/* Goal Allocation History Modal */}
      <GoalHistoryModal
        isOpen={historyGoal !== null}
        onClose={() => setHistoryGoal(null)}
        goal={historyGoal}
      />
    </div>
  );
};

export default App;
