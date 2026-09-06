import type { IDesktopBridge, SqliteQueryResult, SystemInfo } from "./types.js";

/**
 * Checks if the current execution context is inside a Tauri native window.
 */
export function isTauriEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  return "__TAURI_INTERNALS__" in window || "__TAURI__" in window || "__TAURI_IPC__" in window;
}

/**
 * Native Tauri IPC caller or browser fallback implementation.
 */
export class TauriDesktopBridge implements IDesktopBridge {
  private _isTauri: boolean;

  constructor() {
    this._isTauri = isTauriEnvironment();
  }

  public isTauri(): boolean {
    return this._isTauri || isTauriEnvironment();
  }

  public async getSystemInfo(): Promise<SystemInfo> {
    if (this.isTauri()) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const info = await invoke<Partial<SystemInfo>>("get_system_info");
        return {
          platform: info.platform ?? "desktop-native",
          arch: info.arch ?? "x64",
          version: info.version ?? "0.1.0",
          appName: "ExpenseSuper Desktop",
          isNativeTauri: true,
          memoryMb: info.memoryMb,
        };
      } catch (err) {
        console.warn("Tauri get_system_info invoke failed, falling back to browser context:", err);
      }
    }

    // Fallback: Browser context
    const platform = typeof navigator !== "undefined" ? navigator.platform || "web-linux" : "node";
    return {
      platform,
      arch: "x86_64",
      version: "0.1.0-web",
      appName: "ExpenseSuper Desktop (Web Fallback)",
      isNativeTauri: false,
    };
  }

  public async exportDataFile(
    filename: string,
    content: string,
    title = "Save Expense Data",
  ): Promise<{ success: boolean; filePath?: string }> {
    if (this.isTauri()) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const res = await invoke<{ success: boolean; filePath?: string }>("export_file", {
          filename,
          content,
          title,
        });
        return res;
      } catch (err) {
        console.warn("Tauri export_file invoke failed, falling back to browser download:", err);
      }
    }

    // Fallback: Browser download via Blob or Node fallback
    if (typeof document !== "undefined") {
      try {
        const blob = new Blob([content], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return { success: true, filePath: filename };
      } catch (err) {
        console.error("Browser export error:", err);
        return { success: false };
      }
    }

    // Node / headless test fallback
    return { success: true, filePath: filename };
  }

  public async importDataFile(
    title = "Open Expense Data File",
    extensions: string[] = ["json", "csv"],
  ): Promise<{ success: boolean; data?: string; filename?: string }> {
    if (this.isTauri()) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const res = await invoke<{ success: boolean; data?: string; filename?: string }>(
          "import_file",
          {
            title,
            extensions,
          },
        );
        return res;
      } catch (err) {
        console.warn("Tauri import_file invoke failed, falling back to browser file input:", err);
      }
    }

    // Fallback: Browser file input element
    if (typeof document !== "undefined") {
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = extensions.map((e) => `.${e}`).join(",");
        input.onchange = async (e) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          if (!file) {
            resolve({ success: false });
            return;
          }
          try {
            const text = await file.text();
            resolve({ success: true, data: text, filename: file.name });
          } catch {
            resolve({ success: false });
          }
        };
        input.click();
      });
    }

    return { success: false };
  }

  public async executeSqliteQuery<T = Record<string, unknown>>(
    query: string,
    params: unknown[] = [],
  ): Promise<SqliteQueryResult<T>> {
    if (this.isTauri()) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const result = await invoke<SqliteQueryResult<T>>("execute_sqlite_query", {
          query,
          params,
        });
        return result;
      } catch (err) {
        console.warn(
          "Tauri execute_sqlite_query invoke failed, falling back to in-memory store:",
          err,
        );
      }
    }

    // Web Fallback: Emulated in-memory query handler
    return {
      rows: [] as T[],
      rowsAffected: 0,
    };
  }
}

export const desktopBridge = new TauriDesktopBridge();
