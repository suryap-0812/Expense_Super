import React, { useState, useEffect } from "react";
import { desktopBridge } from "../bridge/index.js";
import type { SystemInfo } from "../bridge/types.js";
import {
  Download,
  Upload,
  Monitor,
  RefreshCw,
  Cpu,
  Database,
  CheckCircle,
  Shield,
} from "lucide-react";
import { useTransactionStore } from "@expense-tracker/state";

interface DesktopHeaderProps {
  onRefreshAnalysis: () => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({ onRefreshAnalysis }) => {
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const transactions = useTransactionStore((s) => s.transactions);
  const setTransactions = useTransactionStore((s) => s.setTransactions);

  useEffect(() => {
    desktopBridge.getSystemInfo().then(setSysInfo);
  }, []);

  const showNotification = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleExport = async () => {
    setIsBusy(true);
    try {
      const dataStr = JSON.stringify(transactions, null, 2);
      const res = await desktopBridge.exportDataFile("expense-data-export.json", dataStr);
      if (res.success) {
        showNotification(`Exported successfully: ${res.filePath ?? "expense-data-export.json"}`);
      } else {
        showNotification("Export canceled or failed");
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleImport = async () => {
    setIsBusy(true);
    try {
      const res = await desktopBridge.importDataFile("Import Expense Transactions", ["json"]);
      if (res.success && res.data) {
        const parsed = JSON.parse(res.data);
        if (Array.isArray(parsed)) {
          setTransactions(parsed);
          onRefreshAnalysis();
          showNotification(`Imported ${parsed.length} transactions from ${res.filename ?? "file"}`);
        }
      }
    } catch {
      showNotification("Failed to parse imported file");
    } finally {
      setIsBusy(false);
    }
  };

  const handleTestSqlite = async () => {
    setIsBusy(true);
    try {
      const result = await desktopBridge.executeSqliteQuery("SELECT 1 as is_active");
      showNotification(`SQLite Query Executed (${result.rows.length} rows returned)`);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <header
      className="desktop-titlebar"
      style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem 1.5rem" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Shield style={{ width: "1.5rem", height: "1.5rem", color: "var(--accent-indigo)" }} />
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              ExpenseSuper Desktop
            </h1>
          </div>
          {sysInfo?.isNativeTauri ? (
            <span className="badge-native">
              <Cpu style={{ width: "0.85rem", height: "0.85rem" }} /> Tauri Native (
              {sysInfo.platform} / {sysInfo.arch})
            </span>
          ) : (
            <span className="badge-web">
              <Monitor style={{ width: "0.85rem", height: "0.85rem" }} /> Desktop Web Bridge
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            className="btn-secondary"
            onClick={handleTestSqlite}
            disabled={isBusy}
            title="Execute Native SQLite Diagnostic Query"
          >
            <Database style={{ width: "0.9rem", height: "0.9rem" }} />
            <span>SQLite Diagnostic</span>
          </button>
          <button
            className="btn-secondary"
            onClick={handleImport}
            disabled={isBusy}
            title="Import native transactions"
          >
            <Upload style={{ width: "0.9rem", height: "0.9rem" }} />
            <span>Import</span>
          </button>
          <button
            className="btn-secondary"
            onClick={handleExport}
            disabled={isBusy}
            title="Export native backup"
          >
            <Download style={{ width: "0.9rem", height: "0.9rem" }} />
            <span>Export Backup</span>
          </button>
          <button
            className="btn-primary"
            onClick={onRefreshAnalysis}
            disabled={isBusy}
            title="Recalculate deterministic and ML analysis"
          >
            <RefreshCw style={{ width: "0.9rem", height: "0.9rem" }} />
            <span>Run Analysis</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.4rem 0.8rem",
            borderRadius: "0.5rem",
            background: "rgba(99, 102, 241, 0.15)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            color: "#c7d2fe",
            fontSize: "0.8125rem",
          }}
        >
          <CheckCircle style={{ width: "0.9rem", height: "0.9rem", color: "#818cf8" }} />
          <span>{statusMsg}</span>
        </div>
      )}
    </header>
  );
};
