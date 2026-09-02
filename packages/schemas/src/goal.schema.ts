import { z } from "zod";
import { MonetaryAmountSchema, IsoDateStringSchema } from "./transaction.schema.js";

export const GoalStatusSchema = z.enum(["active", "completed", "archived", "cancelled"]);

export const CreateGoalSchema = z.object({
  name: z.string().trim().min(1, "Goal name is required").max(100),
  targetAmount: MonetaryAmountSchema,
  deadline: IsoDateStringSchema.optional(),
  description: z.string().trim().max(1000).optional(),
  status: GoalStatusSchema.default("active"),
});

export const UpdateGoalSchema = CreateGoalSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided to update a goal" },
);

export const GoalSchema = CreateGoalSchema.extend({
  id: z.string().min(1, "Goal ID is required"),
  createdAt: z.string().datetime({ message: "createdAt must be an ISO 8601 timestamp" }),
  updatedAt: z.string().datetime({ message: "updatedAt must be an ISO 8601 timestamp" }),
});

/**
 * Validates non-zero delta allocation amount (positive = add to goal, negative = release from goal)
 */
export const AllocationAmountSchema = z
  .number({
    required_error: "Allocation amount is required",
    invalid_type_error: "Allocation amount must be a number",
  })
  .finite("Amount must be a finite number")
  .refine((val) => val !== 0, { message: "Allocation amount cannot be zero" })
  .refine(
    (val) => {
      const parts = val.toString().split(".");
      return parts.length < 2 || (parts[1]?.length ?? 0) <= 2;
    },
    { message: "Allocation amount cannot have more than 2 decimal places" },
  );

export const CreateGoalAllocationSchema = z.object({
  goalId: z.string().min(1, "Goal ID is required"),
  amount: AllocationAmountSchema,
  allocationDate: IsoDateStringSchema,
  note: z.string().trim().max(500).optional(),
});

export const GoalAllocationSchema = CreateGoalAllocationSchema.extend({
  id: z.string().min(1, "Allocation ID is required"),
  createdAt: z.string().datetime({ message: "createdAt must be an ISO 8601 timestamp" }),
});

export type GoalStatus = z.infer<typeof GoalStatusSchema>;
export type CreateGoalInput = z.infer<typeof CreateGoalSchema>;
export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>;
export type GoalDto = z.infer<typeof GoalSchema>;
export type CreateGoalAllocationInput = z.infer<typeof CreateGoalAllocationSchema>;
export type GoalAllocationDto = z.infer<typeof GoalAllocationSchema>;
