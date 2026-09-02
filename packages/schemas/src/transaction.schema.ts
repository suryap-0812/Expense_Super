import { z } from "zod";

export const TransactionTypeSchema = z.enum(["income", "expense"]);

export const PaymentMethodSchema = z.enum([
  "UPI",
  "Cash",
  "Credit Card",
  "Debit Card",
  "Net Banking",
  "Bank Transfer",
  "Other",
]);

/**
 * Validates monetary amounts:
 * - Must be finite positive number (> 0)
 * - Maximum 2 decimal places
 */
export const MonetaryAmountSchema = z
  .number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  })
  .positive("Amount must be greater than zero")
  .finite("Amount must be a finite number")
  .refine(
    (val) => {
      const parts = val.toString().split(".");
      return parts.length < 2 || (parts[1]?.length ?? 0) <= 2;
    },
    { message: "Amount cannot have more than 2 decimal places" },
  );

/**
 * Validates ISO Date format YYYY-MM-DD and checks that it's a valid calendar date
 */
export const IsoDateStringSchema = z
  .string({ required_error: "Transaction date is required" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine(
    (val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d.toISOString().startsWith(val);
    },
    { message: "Date must be a valid calendar date" },
  );

export const CreateTransactionSchema = z.object({
  type: TransactionTypeSchema,
  amount: MonetaryAmountSchema,
  categoryId: z.string().min(1, "Category ID is required"),
  description: z.string().trim().min(1, "Description is required").max(255),
  paymentMethod: PaymentMethodSchema,
  transactionDate: IsoDateStringSchema,
  notes: z.string().max(1000).optional(),
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided to update a transaction" },
);

export const TransactionSchema = CreateTransactionSchema.extend({
  id: z.string().min(1, "ID is required"),
  createdAt: z.string().datetime({ message: "createdAt must be an ISO 8601 timestamp" }),
  updatedAt: z.string().datetime({ message: "updatedAt must be an ISO 8601 timestamp" }),
});

export const TransactionFilterSchema = z.object({
  startDate: IsoDateStringSchema.optional(),
  endDate: IsoDateStringSchema.optional(),
  type: TransactionTypeSchema.optional(),
  categoryId: z.string().min(1).optional(),
  paymentMethod: PaymentMethodSchema.optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  searchQuery: z.string().trim().optional(),
});

export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type TransactionDto = z.infer<typeof TransactionSchema>;
export type TransactionFilterDto = z.infer<typeof TransactionFilterSchema>;
