import type {
  ITransactionRepository,
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilter,
} from "@expense-tracker/domain";
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  TransactionSchema,
} from "@expense-tracker/schemas";
import type { ISqliteDriver } from "../driver.js";

export class SqliteTransactionRepository implements ITransactionRepository {
  constructor(private readonly driver: ISqliteDriver) {}

  public async create(input: CreateTransactionInput): Promise<Transaction> {
    const validated = CreateTransactionSchema.parse(input);
    const now = new Date().toISOString();
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const transaction: Transaction = {
      id,
      type: validated.type,
      amount: validated.amount,
      categoryId: validated.categoryId,
      description: validated.description,
      paymentMethod: validated.paymentMethod,
      transactionDate: validated.transactionDate,
      notes: validated.notes,
      createdAt: now,
      updatedAt: now,
    };

    const parsed = TransactionSchema.parse(transaction);

    await this.driver.execute(
      `INSERT INTO transactions (id, type, amount, categoryId, description, paymentMethod, transactionDate, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        parsed.id,
        parsed.type,
        parsed.amount,
        parsed.categoryId,
        parsed.description,
        parsed.paymentMethod,
        parsed.transactionDate,
        parsed.notes ?? null,
        parsed.createdAt,
        parsed.updatedAt,
      ],
    );

    return parsed;
  }

  public async update(id: string, input: UpdateTransactionInput): Promise<Transaction> {
    const validated = UpdateTransactionSchema.parse(input);
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Transaction with id '${id}' not found`);
    }

    const updated: Transaction = {
      ...existing,
      ...validated,
      updatedAt: new Date().toISOString(),
    };

    const parsed = TransactionSchema.parse(updated);

    await this.driver.execute(
      `UPDATE transactions SET type = ?, amount = ?, categoryId = ?, description = ?, paymentMethod = ?, transactionDate = ?, notes = ?, updatedAt = ? WHERE id = ?;`,
      [
        parsed.type,
        parsed.amount,
        parsed.categoryId,
        parsed.description,
        parsed.paymentMethod,
        parsed.transactionDate,
        parsed.notes ?? null,
        parsed.updatedAt,
        id,
      ],
    );

    return parsed;
  }

  public async delete(id: string): Promise<void> {
    await this.driver.execute(`DELETE FROM transactions WHERE id = ?;`, [id]);
  }

  public async getById(id: string): Promise<Transaction | null> {
    const rows = await this.driver.query<Record<string, unknown>>(
      `SELECT id, type, amount, categoryId, description, paymentMethod, transactionDate, notes, createdAt, updatedAt FROM transactions WHERE id = ?;`,
      [id],
    );

    if (rows.length === 0 || !rows[0]) return null;
    return this.mapRowToTransaction(rows[0]);
  }

  public async list(filter?: TransactionFilter): Promise<Transaction[]> {
    let sql = `SELECT id, type, amount, categoryId, description, paymentMethod, transactionDate, notes, createdAt, updatedAt FROM transactions`;
    const whereClauses: string[] = [];
    const params: unknown[] = [];

    if (filter?.type) {
      whereClauses.push(`type = ?`);
      params.push(filter.type);
    }
    if (filter?.categoryId) {
      whereClauses.push(`categoryId = ?`);
      params.push(filter.categoryId);
    }
    if (filter?.paymentMethod) {
      whereClauses.push(`paymentMethod = ?`);
      params.push(filter.paymentMethod);
    }
    if (filter?.startDate) {
      whereClauses.push(`transactionDate >= ?`);
      params.push(filter.startDate);
    }
    if (filter?.endDate) {
      whereClauses.push(`transactionDate <= ?`);
      params.push(filter.endDate);
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ` + whereClauses.join(" AND ");
    }

    sql += ` ORDER BY transactionDate DESC;`;

    const rows = await this.driver.query<Record<string, unknown>>(sql, params);
    return rows.map((r) => this.mapRowToTransaction(r));
  }

  private mapRowToTransaction(row: Record<string, unknown>): Transaction {
    const raw = {
      id: row["id"],
      type: row["type"],
      amount: Number(row["amount"]),
      categoryId: row["categoryId"],
      description: row["description"],
      paymentMethod: row["paymentMethod"],
      transactionDate: row["transactionDate"],
      notes: row["notes"] ?? undefined,
      createdAt: row["createdAt"],
      updatedAt: row["updatedAt"],
    };
    return TransactionSchema.parse(raw);
  }
}
