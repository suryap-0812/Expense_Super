import { describe, it, expect, vi } from "vitest";
import { TauriSqliteAdapter } from "../src/adapters/tauri-adapter.js";
import { ExpoSqliteAdapter } from "../src/adapters/expo-adapter.js";

describe("Platform SQLite Adapters Suite (Section 77)", () => {
  describe("TauriSqliteAdapter", () => {
    it("executes query via native Tauri IPC invoker when present", async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        rows: [{ id: "tx_1", amount: 500 }],
        rows_affected: 1,
      });

      const adapter = new TauriSqliteAdapter({ invoke: mockInvoke });
      const rows = await adapter.query("SELECT * FROM transactions WHERE amount > ?", [100]);

      expect(mockInvoke).toHaveBeenCalledWith("execute_sqlite_query", {
        query: "SELECT * FROM transactions WHERE amount > ?",
        params: [100],
      });
      expect(rows).toEqual([{ id: "tx_1", amount: 500 }]);
    });

    it("falls back to memory driver when native invoke fails or is absent", async () => {
      const failingInvoke = vi.fn().mockRejectedValue(new Error("Tauri IPC unavailable"));
      const adapter = new TauriSqliteAdapter({ invoke: failingInvoke });

      // Should not throw, should gracefully return memory driver result
      await adapter.execute("CREATE TABLE test_table (id TEXT);");
      await adapter.execute("INSERT INTO test_table (id) VALUES (?);", ["id_1"]);
      const rows = await adapter.query("SELECT * FROM test_table;");

      expect(rows.length).toBe(1);
    });
  });

  describe("ExpoSqliteAdapter", () => {
    it("executes queries via Expo SQLite database interface when present", async () => {
      const mockDb = {
        runAsync: vi.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 10 }),
        getAllAsync: vi.fn().mockResolvedValue([{ id: "goal_1", name: "Car" }]),
      };

      const adapter = new ExpoSqliteAdapter(mockDb);
      const res = await adapter.execute("INSERT INTO goals (name) VALUES (?);", ["Car"]);
      expect(mockDb.runAsync).toHaveBeenCalled();
      expect(res.rowsAffected).toBe(1);

      const rows = await adapter.query("SELECT * FROM goals;");
      expect(mockDb.getAllAsync).toHaveBeenCalled();
      expect(rows).toEqual([{ id: "goal_1", name: "Car" }]);
    });

    it("falls back to memory driver when Expo database methods fail or are absent", async () => {
      const failingDb = {
        getAllAsync: vi.fn().mockRejectedValue(new Error("Expo native DB unavailable")),
      };

      const adapter = new ExpoSqliteAdapter(failingDb);
      await adapter.execute("CREATE TABLE expo_fallback (id TEXT);");
      await adapter.execute("INSERT INTO expo_fallback (id) VALUES (?);", ["test_id"]);
      const rows = await adapter.query("SELECT * FROM expo_fallback;");

      expect(rows.length).toBe(1);
    });
  });
});
