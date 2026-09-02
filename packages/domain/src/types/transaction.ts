/**
 * Transaction Domain Entity and Types
 */

export type TransactionType = "income" | "expense";

export type PaymentMethod =
  "UPI" | "Cash" | "Credit Card" | "Debit Card" | "Net Banking" | "Bank Transfer" | "Other";

export interface Transaction {
  id: string;
  type: TransactionType;
  /** Amount in base currency units (e.g. INR or USD). Must be > 0 */
  amount: number;
  categoryId: string;
  description: string;
  paymentMethod: PaymentMethod;
  /** ISO 8601 Date string: YYYY-MM-DD */
  transactionDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  paymentMethod: PaymentMethod;
  transactionDate: string;
  notes?: string;
}

export interface UpdateTransactionInput {
  type?: TransactionType;
  amount?: number;
  categoryId?: string;
  description?: string;
  paymentMethod?: PaymentMethod;
  transactionDate?: string;
  notes?: string;
}

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  categoryId?: string;
  paymentMethod?: PaymentMethod;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
}
