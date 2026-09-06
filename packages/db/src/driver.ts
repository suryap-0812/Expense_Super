/**
 * Database Driver and Migration Type Contracts (Section 12 & 77).
 */

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowsAffected: number;
  lastInsertId?: number;
}

export interface ISqliteDriver {
  /**
   * Executes a statement that does not return rows (e.g. INSERT, UPDATE, DELETE, CREATE TABLE).
   */
  execute(sql: string, params?: unknown[]): Promise<QueryResult>;

  /**
   * Executes a SELECT query and returns typed rows.
   */
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;

  /**
   * Executes multiple statements inside an ACID transaction.
   */
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}

export interface Migration {
  version: number;
  name: string;
  up: (driver: ISqliteDriver) => Promise<void>;
  down?: (driver: ISqliteDriver) => Promise<void>;
}

export interface MigrationRecord {
  version: number;
  name: string;
  applied_at: string;
}
