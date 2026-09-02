/**
 * User Settings Domain Entity and Defaults
 */

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | (string & {});

export type ThemeMode = "light" | "dark" | "system";

export type AppTerminology = "default" | "debit_credit";

export interface UserSettings {
  currency: CurrencyCode;
  currencySymbol: string;
  theme: ThemeMode;
  terminology: AppTerminology;
  llmProvider: string;
  llmApiKey?: string;
  llmModel: string;
  notificationsEnabled: boolean;
  /** Contamination / sensitivity threshold for anomaly detection (e.g. 0.05) */
  anomaliesThreshold: number;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  currency: "INR",
  currencySymbol: "₹",
  theme: "system",
  terminology: "default",
  llmProvider: "openrouter",
  llmModel: "anthropic/claude-3.5-sonnet",
  notificationsEnabled: true,
  anomaliesThreshold: 0.05,
};
