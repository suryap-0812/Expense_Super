import { z } from "zod";
import { InsightSeveritySchema } from "./ml-contract.schema.js";

export const InsightTypeSchema = z.enum([
  "anomaly",
  "trend",
  "saving_opportunity",
  "budget_alert",
  "behavioral_pattern",
]);

export const AIInsightSchema = z.object({
  id: z.string().min(1),
  generatedAt: z.string(),
  period: z.string().min(1),
  insightType: InsightTypeSchema,
  severity: InsightSeveritySchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  mlResult: z.record(z.unknown()).optional(),
  llmExplanation: z.string().optional(),
  actionableSteps: z.array(z.string()).optional(),
  dismissed: z.boolean().default(false),
  createdAt: z.string(),
});

export const CreateAIInsightSchema = z.object({
  period: z.string().min(1),
  insightType: InsightTypeSchema,
  severity: InsightSeveritySchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  mlResult: z.record(z.unknown()).optional(),
  llmExplanation: z.string().optional(),
  actionableSteps: z.array(z.string()).optional(),
});

export type InsightType = z.infer<typeof InsightTypeSchema>;
export type AIInsightDto = z.infer<typeof AIInsightSchema>;
export type CreateAIInsightInput = z.infer<typeof CreateAIInsightSchema>;
