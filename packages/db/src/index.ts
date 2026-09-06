/**
 * @expense-tracker/db
 * Authoritative SQLite Database Abstraction, Versioned Migrations, and Platform Adapters (Section 12 & 77).
 */

export const DB_PACKAGE_VERSION = "0.1.0";

export * from "./driver.js";
export * from "./migrations/index.js";
export * from "./adapters/in-memory-adapter.js";
export * from "./adapters/tauri-adapter.js";
export * from "./adapters/expo-adapter.js";
export * from "./repositories/transaction-repository.js";
export * from "./repositories/category-repository.js";
export * from "./repositories/goal-repository.js";
export * from "./repositories/balance-repository.js";
export * from "./repositories/settings-repository.js";
export * from "./repositories/insight-repository.js";
