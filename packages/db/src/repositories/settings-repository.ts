import type { ISettingsRepository, UserSettings } from "@expense-tracker/domain";
import { DEFAULT_USER_SETTINGS } from "@expense-tracker/domain";
import { UserSettingsSchema, UpdateUserSettingsSchema } from "@expense-tracker/schemas";
import type { ISqliteDriver } from "../driver.js";

const SETTINGS_ROW_ID = "singleton_user_settings";

export class SqliteSettingsRepository implements ISettingsRepository {
  constructor(private readonly driver: ISqliteDriver) {}

  public async getSettings(): Promise<UserSettings> {
    const rows = await this.driver.query<Record<string, unknown>>(
      `SELECT id, currency, currencySymbol, theme, terminology, llmProvider, llmApiKey, llmModel, notificationsEnabled, anomaliesThreshold FROM user_settings WHERE id = ?;`,
      [SETTINGS_ROW_ID],
    );

    if (rows.length === 0 || !rows[0]) {
      // Default settings seed
      const defaults: UserSettings = DEFAULT_USER_SETTINGS;
      await this.driver.execute(
        `INSERT INTO user_settings (id, currency, currencySymbol, theme, terminology, llmProvider, llmApiKey, llmModel, notificationsEnabled, anomaliesThreshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          SETTINGS_ROW_ID,
          defaults.currency,
          defaults.currencySymbol,
          defaults.theme,
          defaults.terminology,
          defaults.llmProvider,
          defaults.llmApiKey ?? null,
          defaults.llmModel,
          defaults.notificationsEnabled ? 1 : 0,
          defaults.anomaliesThreshold,
        ],
      );
      return defaults;
    }

    return this.mapRowToSettings(rows[0]);
  }

  public async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const validated = UpdateUserSettingsSchema.parse(settings);
    const current = await this.getSettings();
    const updated: UserSettings = {
      ...current,
      ...validated,
    };

    const parsed = UserSettingsSchema.parse(updated);

    await this.driver.execute(
      `UPDATE user_settings SET currency = ?, currencySymbol = ?, theme = ?, terminology = ?, llmProvider = ?, llmApiKey = ?, llmModel = ?, notificationsEnabled = ?, anomaliesThreshold = ? WHERE id = ?;`,
      [
        parsed.currency,
        parsed.currencySymbol,
        parsed.theme,
        parsed.terminology,
        parsed.llmProvider,
        parsed.llmApiKey ?? null,
        parsed.llmModel,
        parsed.notificationsEnabled ? 1 : 0,
        parsed.anomaliesThreshold,
        SETTINGS_ROW_ID,
      ],
    );

    return parsed;
  }

  private mapRowToSettings(row: Record<string, unknown>): UserSettings {
    const raw = {
      currency: row["currency"],
      currencySymbol: row["currencySymbol"],
      theme: row["theme"],
      terminology: row["terminology"],
      llmProvider: row["llmProvider"],
      llmApiKey: row["llmApiKey"] ?? undefined,
      llmModel: row["llmModel"],
      notificationsEnabled: Boolean(row["notificationsEnabled"]),
      anomaliesThreshold: Number(row["anomaliesThreshold"]),
    };
    return UserSettingsSchema.parse(raw);
  }
}
