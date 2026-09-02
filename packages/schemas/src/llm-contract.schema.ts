import { z } from "zod";

export const LLMPrioritySchema = z.enum(["low", "medium", "high"]);

export const LLMFindingSchema = z.object({
  title: z.string().trim().min(1, "Finding title cannot be empty"),
  evidence: z.string().trim().min(1, "Evidence is required"),
  explanation: z.string().trim().min(1, "Explanation is required"),
  recommendation: z.string().trim().min(1, "Recommendation is required"),
  priority: LLMPrioritySchema,
});

/**
 * Structured LLM Output Contract (Section 36)
 */
export const LLMGuidanceResponseSchema = z.object({
  summary: z.string().trim().min(1, "Summary is required"),
  findings: z.array(LLMFindingSchema),
});

export type LLMPriority = z.infer<typeof LLMPrioritySchema>;
export type LLMFinding = z.infer<typeof LLMFindingSchema>;
export type LLMGuidanceResponse = z.infer<typeof LLMGuidanceResponseSchema>;

export type SafeLLMParseResult =
  { success: true; data: LLMGuidanceResponse } | { success: false; error: string; raw: unknown };

/**
 * Safely validates LLM response (supports JSON object or JSON string).
 * Strictly guards against malformed output or prompt injection / hallucinated payloads.
 */
export function parseLLMResponseSafe(input: unknown): SafeLLMParseResult {
  let parsedJson: unknown = input;

  if (typeof input === "string") {
    try {
      // Remove any potential markdown code fence markers (e.g. ```json ... ```)
      const sanitized = input
        .replace(/^\s*```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
      parsedJson = JSON.parse(sanitized);
    } catch {
      return {
        success: false,
        error: "LLM output is not valid JSON.",
        raw: input,
      };
    }
  }

  const result = LLMGuidanceResponseSchema.safeParse(parsedJson);
  if (!result.success) {
    const errorMessages = result.error.errors
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join("; ");
    return {
      success: false,
      error: `LLM response failed schema validation: ${errorMessages}`,
      raw: input,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
