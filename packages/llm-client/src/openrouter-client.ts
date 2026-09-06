/**
 * OpenRouter LLM Client Implementation (Section 34, 36 & 84).
 * Connects to OpenRouter API to generate validated, structured financial guidance explanations.
 */

import { parseLLMResponseSafe } from "@expense-tracker/schemas";
import { FINANCIAL_GUIDANCE_SYSTEM_PROMPT, buildFinancialGuidanceUserPrompt } from "./prompts";
import type {
  LLMAnalysisInput,
  LLMAnalysisResult,
  LLMClient,
  OpenRouterClientConfig,
} from "./types";

export const DEFAULT_OPENROUTER_MODEL = "anthropic/claude-3.5-sonnet";
export const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * Production OpenRouter LLM Client.
 */
export class OpenRouterClient implements LLMClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly siteUrl: string;
  private readonly siteName: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;

  constructor(config: OpenRouterClientConfig) {
    if (!config.apiKey || config.apiKey.trim() === "") {
      throw new Error(
        "OpenRouter API key is required. Please supply a valid key via settings (Section 34).",
      );
    }

    this.apiKey = config.apiKey.trim();
    this.model = config.model ?? DEFAULT_OPENROUTER_MODEL;
    this.baseUrl = (config.baseUrl ?? DEFAULT_OPENROUTER_BASE_URL).replace(/\/+$/, "");
    this.siteUrl = config.siteUrl ?? "https://expense-super.local";
    this.siteName = config.siteName ?? "Expense Super";
    this.timeoutMs = config.timeoutMs ?? 30000;
    this.fetchFn = config.fetchFn ?? globalThis.fetch;
  }

  public async generateExplanation(input: LLMAnalysisInput): Promise<LLMAnalysisResult> {
    const startTime = performance.now();
    const userPrompt = buildFinancialGuidanceUserPrompt(input);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": this.siteUrl,
          "X-Title": this.siteName,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: FINANCIAL_GUIDANCE_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch {
          // Ignore read error
        }

        if (response.status === 401) {
          throw new Error(
            "OpenRouter authentication failed: Invalid API key. Please check your key in settings.",
          );
        }
        if (response.status === 402) {
          throw new Error(
            "OpenRouter credit balance depleted or insufficient for requested model.",
          );
        }
        if (response.status === 429) {
          throw new Error(
            "OpenRouter rate limit reached. Please wait a moment before trying again.",
          );
        }
        throw new Error(
          `OpenRouter API error (HTTP ${response.status}): ${errorBody || response.statusText}`,
        );
      }

      const jsonResponse = (await response.json()) as {
        id?: string;
        model?: string;
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      };

      const rawContent = jsonResponse.choices?.[0]?.message?.content;
      if (!rawContent || rawContent.trim() === "") {
        throw new Error("OpenRouter returned an empty response.");
      }

      // Strictly validate with Zod (Section 36)
      const parseResult = parseLLMResponseSafe(rawContent);
      if (!parseResult.success) {
        throw new Error(`Invalid LLM response format: ${parseResult.error}`);
      }

      const latencyMs = Math.round(performance.now() - startTime);

      return {
        summary: parseResult.data.summary,
        findings: parseResult.data.findings,
        modelUsed: jsonResponse.model ?? this.model,
        latencyMs,
        rawResponse: jsonResponse,
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          throw new Error(`OpenRouter request timed out after ${this.timeoutMs}ms.`);
        }
        throw err;
      }
      throw new Error(`Unknown error during OpenRouter execution: ${String(err)}`);
    }
  }
}
