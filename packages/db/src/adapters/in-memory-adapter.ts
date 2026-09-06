import type { ISqliteDriver, QueryResult } from "../driver.js";

/**
 * In-memory SQLite driver adapter.
 * Used for automated tests, Node.js runner validation, and non-native browser fallback.
 */
export class InMemorySqliteAdapter implements ISqliteDriver {
  private tables = new Map<string, Map<string, Record<string, unknown>>>();
  private inTransaction = false;

  public async execute(sql: string, params: unknown[] = []): Promise<QueryResult> {
    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();

    // 1. Handle CREATE TABLE
    if (upper.startsWith("CREATE TABLE")) {
      const match = trimmed.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i);
      if (match && match[1]) {
        const tableName = match[1].toLowerCase();
        if (!this.tables.has(tableName)) {
          this.tables.set(tableName, new Map());
        }
      }
      return { rows: [], rowsAffected: 0 };
    }

    // 2. Handle CREATE INDEX
    if (upper.startsWith("CREATE INDEX")) {
      return { rows: [], rowsAffected: 0 };
    }

    // 3. Handle INSERT
    if (upper.startsWith("INSERT INTO")) {
      const match = trimmed.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES/i);
      if (match && match[1] && match[2]) {
        const tableName = match[1].toLowerCase();
        const columns = match[2].split(",").map((c) => c.trim());
        const table = this.tables.get(tableName) ?? new Map();
        this.tables.set(tableName, table);

        const row: Record<string, unknown> = {};
        for (let i = 0; i < columns.length; i++) {
          const col = columns[i]!;
          row[col] = params[i] ?? null;
        }

        const id =
          (row["id"] as string) ??
          (row["version"] !== undefined
            ? String(row["version"])
            : `auto_${Date.now()}_${Math.random()}`);
        table.set(id, row);
        return { rows: [], rowsAffected: 1 };
      }
    }

    // 4. Handle UPDATE
    if (upper.startsWith("UPDATE")) {
      const match = trimmed.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
      if (match && match[1] && match[2] && match[3]) {
        const tableName = match[1].toLowerCase();
        const table = this.tables.get(tableName);
        if (!table) return { rows: [], rowsAffected: 0 };

        const setClause = match[2];
        const whereClause = match[3];
        const setParts = setClause.split(",").map((c) => c.trim());

        let paramIdx = 0;
        const setAssignments: Array<{ col: string; val: unknown }> = [];

        for (const part of setParts) {
          const [colPart, valPart] = part.split("=").map((s) => s.trim());
          if (!colPart) continue;

          if (valPart === "?") {
            setAssignments.push({ col: colPart, val: params[paramIdx++] });
          } else if (valPart !== undefined) {
            // Literal number or string
            const num = Number(valPart);
            if (!isNaN(num)) {
              setAssignments.push({ col: colPart, val: num });
            } else {
              setAssignments.push({ col: colPart, val: valPart.replace(/^['"]|['"]$/g, "") });
            }
          }
        }

        const whereParam = params[paramIdx];

        let rowsAffected = 0;
        for (const [id, row] of table.entries()) {
          const whereColMatch = whereClause.match(/([a-zA-Z0-9_]+)\s*=\s*\?/i);
          const whereCol = whereColMatch ? whereColMatch[1] : "id";

          if (whereParam === undefined || String(row[whereCol!]) === String(whereParam)) {
            for (const assign of setAssignments) {
              row[assign.col] = assign.val;
            }
            table.set(id, row);
            rowsAffected++;
          }
        }
        return { rows: [], rowsAffected };
      }
    }

    // 5. Handle DELETE
    if (upper.startsWith("DELETE FROM")) {
      const match = trimmed.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?/i);
      if (match && match[1]) {
        const tableName = match[1].toLowerCase();
        const table = this.tables.get(tableName);
        if (!table) return { rows: [], rowsAffected: 0 };

        if (!match[2]) {
          const count = table.size;
          table.clear();
          return { rows: [], rowsAffected: count };
        }

        const whereClause = match[2];
        const whereColMatch = whereClause.match(/([a-zA-Z0-9_]+)\s*=\s*\?/i);
        const whereCol = whereColMatch ? whereColMatch[1] : "id";
        const targetVal = params[0];

        let rowsAffected = 0;
        for (const [id, row] of Array.from(table.entries())) {
          if (String(row[whereCol!]) === String(targetVal)) {
            table.delete(id);
            rowsAffected++;
          }
        }
        return { rows: [], rowsAffected };
      }
    }

    return { rows: [], rowsAffected: 0 };
  }

  public async query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    const trimmed = sql.trim();
    const match = trimmed.match(
      /SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?;?$/i,
    );

    if (!match || !match[2]) {
      return [];
    }

    const tableName = match[2].toLowerCase();
    const table = this.tables.get(tableName);
    if (!table) return [];

    let rows = Array.from(table.values());

    // Evaluate WHERE filters
    if (match[3]) {
      const whereClause = match[3];
      let paramIdx = 0;

      // Handle simple AND clauses
      const conditions = whereClause.split(/\s+AND\s+/i);
      for (const cond of conditions) {
        const eqMatch = cond.match(/([a-zA-Z0-9_]+)\s*=\s*\?/i);
        const eqLitMatch = cond.match(/([a-zA-Z0-9_]+)\s*=\s*([0-9]+|'[^']*'|"[^"]*")/i);
        const gteMatch = cond.match(/([a-zA-Z0-9_]+)\s*>=\s*\?/i);
        const lteMatch = cond.match(/([a-zA-Z0-9_]+)\s*<=\s*\?/i);
        const isNullMatch = cond.match(/([a-zA-Z0-9_]+)\s+IS\s+NULL/i);

        if (eqMatch && eqMatch[1]) {
          const col = eqMatch[1];
          const val = params[paramIdx++];
          rows = rows.filter((r) => String(r[col]) === String(val));
        } else if (eqLitMatch && eqLitMatch[1] && eqLitMatch[2]) {
          const col = eqLitMatch[1];
          const litStr = eqLitMatch[2].replace(/^['"]|['"]$/g, "");
          const litVal = !isNaN(Number(litStr)) ? Number(litStr) : litStr;
          rows = rows.filter((r) => {
            const raw = r[col];
            if (typeof litVal === "number" && typeof raw === "number") {
              return raw === litVal;
            }
            if (typeof litVal === "number" && typeof raw === "boolean") {
              return (raw ? 1 : 0) === litVal;
            }
            return String(raw) === String(litVal);
          });
        } else if (gteMatch && gteMatch[1]) {
          const col = gteMatch[1];
          const val = params[paramIdx++];
          rows = rows.filter((r) => (r[col] as number | string) >= (val as number | string));
        } else if (lteMatch && lteMatch[1]) {
          const col = lteMatch[1];
          const val = params[paramIdx++];
          rows = rows.filter((r) => (r[col] as number | string) <= (val as number | string));
        } else if (isNullMatch && isNullMatch[1]) {
          const col = isNullMatch[1];
          rows = rows.filter((r) => r[col] === null || r[col] === undefined);
        }
      }
    }

    // Evaluate ORDER BY
    if (match[4]) {
      const orderClause = match[4];
      const isDesc = /DESC/i.test(orderClause);
      const col = orderClause.split(/\s+/)[0]?.trim();
      if (col) {
        rows.sort((a, b) => {
          const valA = a[col];
          const valB = b[col];
          if (valA === valB) return 0;
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;
          if (valA < valB) return isDesc ? 1 : -1;
          return isDesc ? -1 : 1;
        });
      }
    }

    // Evaluate LIMIT
    if (match[5]) {
      const limit = parseInt(match[5], 10);
      if (!isNaN(limit)) {
        rows = rows.slice(0, limit);
      }
    }

    return rows as unknown as T[];
  }

  public async transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (this.inTransaction) {
      return fn();
    }
    this.inTransaction = true;
    try {
      const result = await fn();
      return result;
    } finally {
      this.inTransaction = false;
    }
  }

  public getTableSize(tableName: string): number {
    return this.tables.get(tableName.toLowerCase())?.size ?? 0;
  }
}
