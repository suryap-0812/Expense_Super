/**
 * Balance History Domain Entity
 * Tracks the authoritative manual bank balance updates over time.
 */

export interface BalanceRecord {
  id: string;
  /** Manually entered balance in base currency. Must be >= 0 */
  balance: number;
  /** ISO 8601 Date string or timestamp when balance was recorded */
  recordedAt: string;
  note?: string;
  createdAt: string;
}

export interface CreateBalanceRecordInput {
  balance: number;
  recordedAt: string;
  note?: string;
}
