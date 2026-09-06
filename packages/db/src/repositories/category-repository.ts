import type {
  ICategoryRepository,
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@expense-tracker/domain";
import {
  CategorySchema,
  CreateCategorySchema,
  UpdateCategorySchema,
} from "@expense-tracker/schemas";
import type { ISqliteDriver } from "../driver.js";

export class SqliteCategoryRepository implements ICategoryRepository {
  constructor(private readonly driver: ISqliteDriver) {}

  public async create(input: CreateCategoryInput): Promise<Category> {
    const validated = CreateCategorySchema.parse(input);
    const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const category: Category = {
      id,
      name: validated.name,
      type: validated.type,
      color: validated.color,
      icon: validated.icon,
      isPredefined: false,
    };

    const parsed = CategorySchema.parse(category);

    await this.driver.execute(
      `INSERT INTO categories (id, name, type, color, icon, isPredefined) VALUES (?, ?, ?, ?, ?, ?);`,
      [
        parsed.id,
        parsed.name,
        parsed.type,
        parsed.color ?? null,
        parsed.icon ?? null,
        parsed.isPredefined ? 1 : 0,
      ],
    );

    return parsed;
  }

  public async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    const validated = UpdateCategorySchema.parse(input);
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Category with id '${id}' not found`);
    }

    const updated: Category = {
      ...existing,
      ...validated,
    };

    const parsed = CategorySchema.parse(updated);

    await this.driver.execute(`UPDATE categories SET name = ?, color = ?, icon = ? WHERE id = ?;`, [
      parsed.name,
      parsed.color ?? null,
      parsed.icon ?? null,
      id,
    ]);

    return parsed;
  }

  public async delete(id: string): Promise<void> {
    await this.driver.execute(`DELETE FROM categories WHERE id = ?;`, [id]);
  }

  public async getById(id: string): Promise<Category | null> {
    const rows = await this.driver.query<Record<string, unknown>>(
      `SELECT id, name, type, color, icon, isPredefined FROM categories WHERE id = ?;`,
      [id],
    );

    if (rows.length === 0 || !rows[0]) return null;
    return this.mapRowToCategory(rows[0]);
  }

  public async list(): Promise<Category[]> {
    const rows = await this.driver.query<Record<string, unknown>>(
      `SELECT id, name, type, color, icon, isPredefined FROM categories ORDER BY name ASC;`,
    );
    return rows.map((r) => this.mapRowToCategory(r));
  }

  private mapRowToCategory(row: Record<string, unknown>): Category {
    const raw = {
      id: row["id"],
      name: row["name"],
      type: row["type"],
      color: row["color"] ?? undefined,
      icon: row["icon"] ?? undefined,
      isPredefined: Boolean(row["isPredefined"]),
    };
    return CategorySchema.parse(raw);
  }
}
