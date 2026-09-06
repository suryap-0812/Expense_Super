import { describe, it, expect, vi, beforeEach } from "vitest";
import { TauriDesktopBridge, isTauriEnvironment } from "../src/bridge/tauri-bridge.js";

describe("TauriDesktopBridge & Native IPC Fallback", () => {
  let bridge: TauriDesktopBridge;

  beforeEach(() => {
    vi.restoreAllMocks();
    bridge = new TauriDesktopBridge();
  });

  it("detects browser fallback mode in non-Tauri environment", () => {
    expect(isTauriEnvironment()).toBe(false);
    expect(bridge.isTauri()).toBe(false);
  });

  it("retrieves system info with web fallback metadata", async () => {
    const sysInfo = await bridge.getSystemInfo();
    expect(sysInfo).toBeDefined();
    expect(sysInfo.appName).toContain("ExpenseSuper Desktop");
    expect(sysInfo.isNativeTauri).toBe(false);
    expect(typeof sysInfo.version).toBe("string");
  });

  it("handles exportDataFile in browser context using Blob and download link", async () => {
    const testContent = JSON.stringify({ test: "data", timestamp: 123456 });
    const res = await bridge.exportDataFile("test-export.json", testContent);
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.filePath).toBe("test-export.json");
  });

  it("executes fallback query structure for executeSqliteQuery", async () => {
    const result = await bridge.executeSqliteQuery(
      "SELECT * FROM transactions WHERE amount > ?",
      [100],
    );
    expect(result).toBeDefined();
    expect(Array.isArray(result.rows)).toBe(true);
    expect(result.rowsAffected).toBe(0);
  });
});
