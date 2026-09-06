import type {
  IBalanceRepository,
  BalanceRecord,
  CreateBalanceRecordInput,
} from "@expense-tracker/domain";
import { BalanceRecordSchema, CreateBalanceRecordSchema } from "@expense-tracker/schemas";
import type { ISqliteDriver } from "../driver.js";

export class SqliteBalanceRepository implements IBalanceRepository {
  constructor(private readonly driver: ISqliteDriver) {}

  public async recordBalance(input: CreateBalanceRecordInput): Promise<BalanceRecord> {
    const validated = CreateBalanceRecordSchema.parse(input);
    const now = new Date().toISOString();
    const id = `bal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const record: BalanceRecord = {
      id,
      balance: validated.balance,
      recordedAt: validated.recordedAt,
      note: validated.note,
      createdAt: now,
    };

    const parsed = BalanceRecordSchema.parse(record);

    await this.driver.execute(
      `INSERT INTO balance_records (id, balance, recordedAt, note, createdAt) VALUES (?, ?, ?, ?, ?);`,
      [parsed.id, parsed.balance, parsed.recordedAt, parsed.note ?? null, parsed.createdAt],
    );

    return parsed;
  }

  public async getLatestBalance(): Promise<BalanceRecord | null> {
    const rows = await this.driver.query<Record<string, unknown>>(
      `SELECT id, balance, recordedAt, note, createdAt FROM balance_records ORDER BY recordedAt DESC LIMIT 1;`,
    );

    if (rows.length === 0 || !rows[0]) return null;
    return this.mapRowToBalance(rows[0]);
  }

  public async listHistory(limit = 30): Promise<BalanceRecord[]> {
    const rows = await this.driver.query<Record<string, unknown>>(
      `SELECT id, balance, recordedAt, note, createdAt FROM balance_records ORDER BY recordedAt DESC LIMIT ${limit};`,
    );
    return rows.map((r) => this.mapRowToBalance(r));
  }

  private mapRowToBalance(row: Record<string, unknown>): BalanceRecord {
    const raw = {
      id: row["id"],
      balance: Number(row["balance"]),
      recordedAt: row["recordedAt"],
      note: row["note"] ?? undefined,
      createdAt: row["createdAt"],
    };
    return BalanceRecordSchema.parse(raw);
  }
}
