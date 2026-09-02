# Testing Strategy

## Philosophy

- **Deterministic Test Fixtures:** Financial systems must never rely on random assertions. Fixed deterministic fixtures guarantee reproducible test results.
- **Strict Verification:** No feature is considered complete until automated tests have been executed and passed.
- **Coverage Domains:**
  1. Unit tests for domain invariant rules and financial mathematics.
  2. Schema validation tests for Zod parsing and edge-case handling.
  3. Feature engineering and anomaly detection tests in Python and ONNX Runtime.
  4. Integration tests between stores, repositories, and calculation engines.
  5. UI component testing for accessibility, input validation, and layout responsiveness.
