# Phase 25 — OpenRouter LLM Client Abstraction

Phase 25 implements a modular, replaceable LLM client abstraction and OpenRouter client conforming to **Master Specification Section 84 (Phase 25), Section 34 (OpenRouter), Section 35 (LLM Input), Section 36 (LLM Output), and Section 37 (LLM Safety Rules)**.

---

## 1. Architectural Overview

```text
Structured ML Result (Insights & Evidence)
                 │
                 ▼
          LLM Client Interface (LLMClient)
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
OpenRouterClient       MockLLMClient (Offline / Testing / Local)
(https://openrouter.ai/api/v1)
      │                     │
      ▼                     ▼
Schema Parsing & Validation (parseLLMResponseSafe / Zod)
                 │
                 ▼
       Validated LLM Findings & Guidance
```

---

## 2. Core Components & Implementation

### A. Universal `LLMClient` Abstraction

Located in [`packages/llm-client/src/types.ts`](file:///home/surya/Project_dir/Expense_super/packages/llm-client/src/types.ts):

```ts
export interface LLMClient {
  generateExplanation(input: LLMAnalysisInput): Promise<LLMAnalysisResult>;
}
```

Allows switching between OpenRouter and alternative providers (e.g. Local LLM, Mock, Custom) with zero changes to downstream consumers.

### B. OpenRouter Client

Located in [`packages/llm-client/src/openrouter-client.ts`](file:///home/surya/Project_dir/Expense_super/packages/llm-client/src/openrouter-client.ts):

- Connects to OpenRouter's `/chat/completions` API using user's BYO API key (never hardcoded or committed).
- Defaults to `anthropic/claude-3.5-sonnet` with low temperature ($0.2$) for factual groundedness.
- Handles authentication errors (401), depleted balance (402), rate limits (429), and timeouts gracefully.
- Parses output with [`parseLLMResponseSafe`](file:///home/surya/Project_dir/Expense_super/packages/schemas/src/llm-contract.schema.ts), rejecting malformed payloads and stripping code fences.

### C. Offline / Mock LLM Client

Located in [`packages/llm-client/src/mock-client.ts`](file:///home/surya/Project_dir/Expense_super/packages/llm-client/src/mock-client.ts):

- Generates high-quality deterministic financial guidance offline without network access or API keys.

### D. Privacy & Safety Enforcement

- **Minimum Necessary Information**: Only sends aggregate statistical summaries, persona, anomaly status, and structured insight deltas. Raw transaction histories and private notes are never transmitted (Section 35).
- **Strict Groundedness**: System prompt enforces Section 37 safety rules (never invent numbers, only explain supplied evidence).

---

## 3. Verification Suite

Implemented in [`packages/llm-client/tests/openrouter-client.test.ts`](file:///home/surya/Project_dir/Expense_super/packages/llm-client/tests/openrouter-client.test.ts):

1. **Successful Generation**: Validates request headers, prompt serialization, and parsed output.
2. **Markdown Stripping**: Verifies ` ```json ... ``` ` fenced output parsing.
3. **API Error Handling**: Verifies 401, 402, 429, and 500 error handling.
4. **Zod Validation**: Rejects invalid outputs that fail schema validation.
5. **Data Privacy**: Asserts no raw transaction IDs or sensitive notes in request bodies.
6. **Factory & Mocking**: Verifies `createLLMClient` and `MockLLMClient` offline capability.
