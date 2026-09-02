import { z } from "zod";

export const InsightSeveritySchema = z.enum(["info", "low", "medium", "high", "critical"]);

/**
 * Feature set schema passed to ML models for inference.
 */
export const MLFeatureSetSchema = z
  .object({
    average_monthly_income: z.number().min(0),
    average_monthly_expense: z.number().min(0),
    savings_rate: z.number(),
    shopping_ratio: z.number().min(0).max(1),
    weekend_spending_ratio: z.number().min(0).max(1),
  })
  .passthrough(); // allows additional engineered features in Phase 5

/**
 * Stable input contract for local ML inference (Section 29).
 */
export const MLInputContractSchema = z.object({
  schema_version: z.string().min(1),
  period: z.string().min(1),
  features: MLFeatureSetSchema,
});

export const MLInsightItemSchema = z.object({
  type: z.string().min(1),
  category: z.string().optional(),
  value: z.number().optional(),
  amount: z.number().optional(),
  unit: z.string().optional(),
  severity: InsightSeveritySchema,
  score: z.number().optional(),
  explanation: z.string().optional(),
});

export const MLDataQualitySchema = z.object({
  transaction_count: z.number().int().min(0),
  sufficient_data: z.boolean(),
});

/**
 * Stable output contract produced by ML inference (Section 29).
 */
export const MLOutputContractSchema = z.object({
  schema_version: z.string().min(1),
  period: z.string().min(1),
  data_quality: MLDataQualitySchema,
  insights: z.array(MLInsightItemSchema),
});

export type InsightSeverity = z.infer<typeof InsightSeveritySchema>;
export type MLFeatureSet = z.infer<typeof MLFeatureSetSchema>;
export type MLInputContract = z.infer<typeof MLInputContractSchema>;
export type MLInsightItem = z.infer<typeof MLInsightItemSchema>;
export type MLDataQuality = z.infer<typeof MLDataQualitySchema>;
export type MLOutputContract = z.infer<typeof MLOutputContractSchema>;
