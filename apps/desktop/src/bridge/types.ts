/**
 * Desktop bridge type contracts for Tauri native IPC integration.
 */

export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  appName: string;
  isNativeTauri: boolean;
  memoryMb?: number;
}

export interface SqliteQueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowsAffected: number;
  lastInsertId?: number;
}

export interface IDesktopBridge {
  isTauri(): boolean;
  getSystemInfo(): Promise<SystemInfo>;
  exportDataFile(
    filename: string,
    content: string,
    title?: string,
  ): Promise<{ success: boolean; filePath?: string }>;
  importDataFile(
    title?: string,
    extensions?: string[],
  ): Promise<{ success: boolean; data?: string; filename?: string }>;
  executeSqliteQuery<T = Record<string, unknown>>(
    query: string,
    params?: unknown[],
  ): Promise<SqliteQueryResult<T>>;
}
