import type { ISqliteDriver, QueryResult } from "../driver.js";
import { InMemorySqliteAdapter } from "./in-memory-adapter.js";

export interface TauriIpcInvoker {
  invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T>;
}

/**
 * Desktop Tauri SQLite adapter (Section 77).
 * Connects to Tauri's native SQLite backend via IPC with fallback to in-memory store.
 */
export class TauriSqliteAdapter implements ISqliteDriver {
  private fallbackDriver = new InMemorySqliteAdapter();

  constructor(private readonly invoker?: TauriIpcInvoker) {}

  public async execute(sql: string, params: unknown[] = []): Promise<QueryResult> {
    if (this.invoker) {
      try {
        const res = await this.invoker.invoke<{ rows_affected: number; last_insert_id?: number }>(
          "execute_sqlite_query",
          { query: sql, params },
        );
        return {
          rows: [],
          rowsAffected: res.rows_affected ?? 0,
          lastInsertId: res.last_insert_id,
        };
      } catch (err) {
        console.warn("Tauri native execute failed, falling back to memory driver:", err);
      }
    }
    return this.fallbackDriver.execute(sql, params);
  }

  public async query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    if (this.invoker) {
      try {
        const res = await this.invoker.invoke<{ rows: T[] }>("execute_sqlite_query", {
          query: sql,
          params,
        });
        return res.rows ?? [];
      } catch (err) {
        console.warn("Tauri native query failed, falling back to memory driver:", err);
      }
    }
    return this.fallbackDriver.query<T>(sql, params);
  }

  public async transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (this.invoker) {
      try {
        await this.execute("BEGIN TRANSACTION;");
        const result = await fn();
        await this.execute("COMMIT;");
        return result;
      } catch (err) {
        await this.execute("ROLLBACK;");
        throw err;
      }
    }
    return this.fallbackDriver.transaction(fn);
  }
}
