/**
 * Goal and Goal Allocation Domain Entities
 */

export type GoalStatus = "active" | "completed" | "archived" | "cancelled";

export interface Goal {
  id: string;
  name: string;
  /** Target amount in base currency. Must be > 0 */
  targetAmount: number;
  /** Optional ISO 8601 Date string: YYYY-MM-DD */
  deadline?: string;
  description?: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalInput {
  name: string;
  targetAmount: number;
  deadline?: string;
  description?: string;
  status?: GoalStatus;
}

export interface UpdateGoalInput {
  name?: string;
  targetAmount?: number;
  deadline?: string;
  description?: string;
  status?: GoalStatus;
}

export interface GoalAllocation {
  id: string;
  goalId: string;
  /**
   * Allocation amount.
   * Positive value allocates funds to the goal.
   * Negative value releases funds back from the goal.
   */
  amount: number;
  /** ISO 8601 Date string: YYYY-MM-DD */
  allocationDate: string;
  note?: string;
  createdAt: string;
}

export interface CreateGoalAllocationInput {
  goalId: string;
  amount: number;
  allocationDate: string;
  note?: string;
}

export interface GoalWithProgress extends Goal {
  allocatedAmount: number;
  progressPercentage: number;
  remainingAmount: number;
  isCompleted: boolean;
}
