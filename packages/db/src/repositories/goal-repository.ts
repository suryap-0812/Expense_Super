import type {
  IGoalRepository,
  Goal,
  CreateGoalInput,
  UpdateGoalInput,
  GoalAllocation,
  CreateGoalAllocationInput,
} from "@expense-tracker/domain";
import {
  GoalSchema,
  CreateGoalSchema,
  UpdateGoalSchema,
  GoalAllocationSchema,
  CreateGoalAllocationSchema,
} from "@expense-tracker/schemas";
import type { ISqliteDriver } from "../driver.js";

export class SqliteGoalRepository implements IGoalRepository {
  constructor(private readonly driver: ISqliteDriver) {}

  public async create(input: CreateGoalInput): Promise<Goal> {
    const validated = CreateGoalSchema.parse(input);
    const now = new Date().toISOString();
    const id = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const goal: Goal = {
      id,
      name: validated.name,
      targetAmount: validated.targetAmount,
      deadline: validated.deadline,
      description: validated.description,
      status: validated.status ?? "active",
      createdAt: now,
      updatedAt: now,
    };

    const parsed = GoalSchema.parse(goal);

    await this.driver.execute(
      `INSERT INTO goals (id, name, targetAmount, deadline, description, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        parsed.id,
        parsed.name,
        parsed.targetAmount,
        parsed.deadline ?? null,
        parsed.description ?? null,
        parsed.status,
        parsed.createdAt,
        parsed.updatedAt,
      ],
    );

    return parsed;
  }

  public async update(id: string, input: UpdateGoalInput): Promise<Goal> {
    const validated = UpdateGoalSchema.parse(input);
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Goal with id '${id}' not found`);
    }

    const updated: Goal = {
      ...existing,
      ...validated,
      updatedAt: new Date().toISOString(),
    };

    const parsed = GoalSchema.parse(updated);

    await this.driver.execute(
      `UPDATE goals SET name = ?, targetAmount = ?, deadline = ?, description = ?, status = ?, updatedAt = ? WHERE id = ?;`,
      [
        parsed.name,
        parsed.targetAmount,
        parsed.deadline ?? null,
        parsed.description ?? null,
        parsed.status,
        parsed.updatedAt,
        id,
      ],
    );

    return parsed;
  }

  public async delete(id: string): Promise<void> {
    await this.driver.transaction(async () => {
      await this.driver.execute(`DELETE FROM goal_allocations WHERE goalId = ?;`, [id]);
      await this.driver.execute(`DELETE FROM goals WHERE id = ?;`, [id]);
    });
  }

  public async getById(id: string): Promise<Goal | null> {
    const rows = await this.driver.query<Record<string, unknown>>(
      `SELECT id, name, targetAmount, deadline, description, status, createdAt, updatedAt FROM goals WHERE id = ?;`,
      [id],
    );

    if (rows.length === 0 || !rows[0]) return null;
    return this.mapRowToGoal(rows[0]);
  }

  public async list(status?: string): Promise<Goal[]> {
    let sql = `SELECT id, name, targetAmount, deadline, description, status, createdAt, updatedAt FROM goals`;
    const params: unknown[] = [];

    if (status) {
      sql += ` WHERE status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY createdAt DESC;`;

    const rows = await this.driver.query<Record<string, unknown>>(sql, params);
    return rows.map((r) => this.mapRowToGoal(r));
  }

  public async createAllocation(input: CreateGoalAllocationInput): Promise<GoalAllocation> {
    const validated = CreateGoalAllocationSchema.parse(input);
    const now = new Date().toISOString();
    const id = `alloc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const allocation: GoalAllocation = {
      id,
      goalId: validated.goalId,
      amount: validated.amount,
      allocationDate: validated.allocationDate,
      note: validated.note,
      createdAt: now,
    };

    const parsed = GoalAllocationSchema.parse(allocation);

    await this.driver.execute(
      `INSERT INTO goal_allocations (id, goalId, amount, allocationDate, note, createdAt) VALUES (?, ?, ?, ?, ?, ?);`,
      [
        parsed.id,
        parsed.goalId,
        parsed.amount,
        parsed.allocationDate,
        parsed.note ?? null,
        parsed.createdAt,
      ],
    );

    return parsed;
  }

  public async deleteAllocation(allocationId: string): Promise<void> {
    await this.driver.execute(`DELETE FROM goal_allocations WHERE id = ?;`, [allocationId]);
  }

  public async listAllocations(goalId?: string): Promise<GoalAllocation[]> {
    let sql = `SELECT id, goalId, amount, allocationDate, note, createdAt FROM goal_allocations`;
    const params: unknown[] = [];

    if (goalId) {
      sql += ` WHERE goalId = ?`;
      params.push(goalId);
    }

    sql += ` ORDER BY allocationDate DESC;`;

    const rows = await this.driver.query<Record<string, unknown>>(sql, params);
    return rows.map((r) => this.mapRowToAllocation(r));
  }

  private mapRowToGoal(row: Record<string, unknown>): Goal {
    const raw = {
      id: row["id"],
      name: row["name"],
      targetAmount: Number(row["targetAmount"]),
      deadline: row["deadline"] ?? undefined,
      description: row["description"] ?? undefined,
      status: row["status"],
      createdAt: row["createdAt"],
      updatedAt: row["updatedAt"],
    };
    return GoalSchema.parse(raw);
  }

  private mapRowToAllocation(row: Record<string, unknown>): GoalAllocation {
    const raw = {
      id: row["id"],
      goalId: row["goalId"],
      amount: Number(row["amount"]),
      allocationDate: row["allocationDate"],
      note: row["note"] ?? undefined,
      createdAt: row["createdAt"],
    };
    return GoalAllocationSchema.parse(raw);
  }
}
