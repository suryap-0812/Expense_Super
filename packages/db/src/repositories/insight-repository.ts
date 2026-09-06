import type { IInsightRepository, AIInsight, CreateAIInsightInput } from "@expense-tracker/domain";
import { AIInsightSchema, CreateAIInsightSchema } from "@expense-tracker/schemas";
import type { ISqliteDriver } from "../driver.js";

export class SqliteInsightRepository implements IInsightRepository {
  constructor(private readonly driver: ISqliteDriver) {}

  public async saveInsight(input: CreateAIInsightInput): Promise<AIInsight> {
    const validated = CreateAIInsightSchema.parse(input);
    const now = new Date().toISOString();
    const id = `ins_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const insight: AIInsight = {
      id,
      generatedAt: now,
      period: validated.period,
      insightType: validated.insightType,
      severity: validated.severity,
      title: validated.title,
      description: validated.description,
      mlResult: validated.mlResult,
      llmExplanation: validated.llmExplanation,
      actionableSteps: validated.actionableSteps,
      dismissed: false,
      createdAt: now,
    };

    const parsed = AIInsightSchema.parse(insight);

    await this.driver.execute(
      `INSERT INTO insights (id, generatedAt, period, insightType, severity, title, description, mlResult, llmExplanation, actionableSteps, dismissed, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        parsed.id,
        parsed.generatedAt,
        parsed.period,
        parsed.insightType,
        parsed.severity,
        parsed.title,
        parsed.description,
        parsed.mlResult ? JSON.stringify(parsed.mlResult) : null,
        parsed.llmExplanation ?? null,
        parsed.actionableSteps ? JSON.stringify(parsed.actionableSteps) : null,
        parsed.dismissed ? 1 : 0,
        parsed.createdAt,
      ],
    );

    return parsed;
  }

  public async getById(id: string): Promise<AIInsight | null> {
    const rows = await this.driver.query<Record<string, unknown>>(
      `SELECT id, generatedAt, period, insightType, severity, title, description, mlResult, llmExplanation, actionableSteps, dismissed, createdAt FROM insights WHERE id = ?;`,
      [id],
    );

    if (rows.length === 0 || !rows[0]) return null;
    return this.mapRowToInsight(rows[0]);
  }

  public async list(period?: string): Promise<AIInsight[]> {
    let sql = `SELECT id, generatedAt, period, insightType, severity, title, description, mlResult, llmExplanation, actionableSteps, dismissed, createdAt FROM insights WHERE dismissed = 0`;
    const params: unknown[] = [];

    if (period) {
      sql += ` AND period = ?`;
      params.push(period);
    }

    sql += ` ORDER BY createdAt DESC;`;

    const rows = await this.driver.query<Record<string, unknown>>(sql, params);
    return rows.map((r) => this.mapRowToInsight(r));
  }

  public async dismiss(id: string): Promise<void> {
    await this.driver.execute(`UPDATE insights SET dismissed = 1 WHERE id = ?;`, [id]);
  }

  private mapRowToInsight(row: Record<string, unknown>): AIInsight {
    let mlResultObj = undefined;
    if (typeof row["mlResult"] === "string") {
      try {
        mlResultObj = JSON.parse(row["mlResult"]);
      } catch {
        mlResultObj = undefined;
      }
    }

    let stepsArr = undefined;
    if (typeof row["actionableSteps"] === "string") {
      try {
        stepsArr = JSON.parse(row["actionableSteps"]);
      } catch {
        stepsArr = undefined;
      }
    }

    const raw = {
      id: row["id"],
      generatedAt: row["generatedAt"],
      period: row["period"],
      insightType: row["insightType"],
      severity: row["severity"],
      title: row["title"],
      description: row["description"],
      mlResult: mlResultObj,
      llmExplanation: row["llmExplanation"] ?? undefined,
      actionableSteps: stepsArr,
      dismissed: Boolean(row["dismissed"]),
      createdAt: row["createdAt"],
    };
    return AIInsightSchema.parse(raw);
  }
}
