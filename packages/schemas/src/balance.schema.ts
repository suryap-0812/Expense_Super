import { z } from "zod";
import { IsoDateStringSchema } from "./transaction.schema.js";

/**
 * Validates non-negative bank balances (>= 0)
 */
export const BalanceAmountSchema = z
  .number({
    required_error: "Balance is required",
    invalid_type_error: "Balance must be a number",
  })
  .min(0, "Bank balance cannot be negative")
  .finite("Balance must be a finite number")
  .refine(
    (val) => {
      const parts = val.toString().split(".");
      return parts.length < 2 || (parts[1]?.length ?? 0) <= 2;
    },
    { message: "Balance cannot have more than 2 decimal places" },
  );

export const CreateBalanceRecordSchema = z.object({
  balance: BalanceAmountSchema,
  recordedAt: IsoDateStringSchema,
  note: z.string().trim().max(500).optional(),
});

export const UpdateBalanceRecordSchema = z.object({
  balance: BalanceAmountSchema.optional(),
  recordedAt: IsoDateStringSchema.optional(),
  note: z.string().trim().max(500).optional(),
});

export const BalanceRecordSchema = CreateBalanceRecordSchema.extend({
  id: z.string().min(1, "Balance record ID is required"),
  createdAt: z.string().datetime({ message: "createdAt must be an ISO 8601 timestamp" }),
});

export type CreateBalanceRecordInput = z.infer<typeof CreateBalanceRecordSchema>;
export type UpdateBalanceRecordInput = z.infer<typeof UpdateBalanceRecordSchema>;
export type BalanceRecordDto = z.infer<typeof BalanceRecordSchema>;
