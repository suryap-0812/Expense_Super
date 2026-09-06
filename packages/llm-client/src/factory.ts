/**
 * LLM Client Factory (Section 84).
 * Creates and configures interchangeable LLM clients conforming to LLMClient interface.
 */

import { MockLLMClient } from "./mock-client";
import { OpenRouterClient } from "./openrouter-client";
import type { LLMClient, LLMClientFactoryOptions, OpenRouterClientConfig } from "./types";

/**
 * Creates an instance of LLMClient according to the provided configuration.
 */
export function createLLMClient(options: LLMClientFactoryOptions = {}): LLMClient {
  if (options.customClient) {
    return options.customClient;
  }

  if (options.provider === "openrouter" && options.openRouterConfig?.apiKey) {
    return new OpenRouterClient(options.openRouterConfig as OpenRouterClientConfig);
  }

  if (options.provider === "mock" || !options.openRouterConfig?.apiKey) {
    return new MockLLMClient();
  }

  return new MockLLMClient();
}
