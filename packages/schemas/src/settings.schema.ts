import { z } from "zod";

export const ThemeModeSchema = z.enum(["light", "dark", "system"]);

export const AppTerminologySchema = z.enum(["default", "debit_credit"]);

export const UserSettingsSchema = z.object({
  currency: z.string().trim().min(1, "Currency code is required").default("INR"),
  currencySymbol: z.string().trim().min(1, "Currency symbol is required").default("₹"),
  theme: ThemeModeSchema.default("system"),
  terminology: AppTerminologySchema.default("default"),
  llmProvider: z.string().trim().default("openrouter"),
  llmApiKey: z.string().trim().optional(),
  llmModel: z.string().trim().default("anthropic/claude-3.5-sonnet"),
  notificationsEnabled: z.boolean().default(true),
  anomaliesThreshold: z
    .number()
    .gt(0, "Anomaly threshold must be greater than 0")
    .lte(1, "Anomaly threshold cannot exceed 1")
    .default(0.05),
});

export const UpdateUserSettingsSchema = UserSettingsSchema.partial();

export type ThemeMode = z.infer<typeof ThemeModeSchema>;
export type AppTerminology = z.infer<typeof AppTerminologySchema>;
export type UserSettingsDto = z.infer<typeof UserSettingsSchema>;
export type UpdateUserSettingsInput = z.infer<typeof UpdateUserSettingsSchema>;
