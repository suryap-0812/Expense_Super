import type { ISqliteDriver, QueryResult } from "../driver.js";
import { InMemorySqliteAdapter } from "./in-memory-adapter.js";

export interface ExpoSqliteDatabaseLike {
  runAsync?: (
    sql: string,
    params?: unknown[],
  ) => Promise<{ changes: number; lastInsertRowId?: number }>;
  getAllAsync?: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
  execAsync?: (sql: string) => Promise<void>;
  withTransactionAsync?: <T>(fn: () => Promise<T>) => Promise<T>;
}

/**
 * Mobile React Native / Expo SQLite adapter (Section 77).
 * Connects to Expo SQLite with fallback to in-memory store.
 */
export class ExpoSqliteAdapter implements ISqliteDriver {
  private fallbackDriver = new InMemorySqliteAdapter();

  constructor(private readonly db?: ExpoSqliteDatabaseLike) {}

  public async execute(sql: string, params: unknown[] = []): Promise<QueryResult> {
    if (this.db?.runAsync) {
      try {
        const res = await this.db.runAsync(sql, params);
        return {
          rows: [],
          rowsAffected: res.changes ?? 0,
          lastInsertId: res.lastInsertRowId,
        };
      } catch (err) {
        console.warn("Expo SQLite runAsync failed, falling back to memory driver:", err);
      }
    } else if (this.db?.execAsync && params.length === 0) {
      try {
        await this.db.execAsync(sql);
        return { rows: [], rowsAffected: 0 };
      } catch (err) {
        console.warn("Expo SQLite execAsync failed, falling back to memory driver:", err);
      }
    }
    return this.fallbackDriver.execute(sql, params);
  }

  public async query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    if (this.db?.getAllAsync) {
      try {
        const rows = await this.db.getAllAsync<T>(sql, params);
        return rows ?? [];
      } catch (err) {
        console.warn("Expo SQLite getAllAsync failed, falling back to memory driver:", err);
      }
    }
    return this.fallbackDriver.query<T>(sql, params);
  }

  public async transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (this.db?.withTransactionAsync) {
      try {
        return await this.db.withTransactionAsync(fn);
      } catch (err) {
        console.warn("Expo SQLite transaction failed, falling back to memory driver:", err);
      }
    }
    return this.fallbackDriver.transaction(fn);
  }
}
