import { z } from "zod";
import { TransactionSchema } from "./transaction.schema.js";
import { CategorySchema } from "./category.schema.js";
import { GoalSchema, GoalAllocationSchema } from "./goal.schema.js";
import { BalanceRecordSchema } from "./balance.schema.js";
import { UserSettingsSchema } from "./settings.schema.js";

/**
 * Validates full portable backup archive of local user data.
 */
export const DataExportSchema = z.object({
  version: z.literal("1.0"),
  exportedAt: z.string().datetime(),
  transactions: z.array(TransactionSchema),
  categories: z.array(CategorySchema),
  goals: z.array(GoalSchema),
  goalAllocations: z.array(GoalAllocationSchema),
  balanceHistory: z.array(BalanceRecordSchema),
  settings: UserSettingsSchema,
});

export const DataImportSchema = DataExportSchema;

export type DataExportDto = z.infer<typeof DataExportSchema>;
export type DataImportDto = z.infer<typeof DataImportSchema>;
