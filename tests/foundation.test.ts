import { describe, it, expect } from "vitest";
import { DOMAIN_PACKAGE_VERSION } from "@expense-tracker/domain";
import { SCHEMAS_PACKAGE_VERSION } from "@expense-tracker/schemas";
import { STATE_PACKAGE_VERSION } from "@expense-tracker/state";
import { ANALYTICS_PACKAGE_VERSION } from "@expense-tracker/analytics";
import { ML_CONTRACT_PACKAGE_VERSION } from "@expense-tracker/ml-contract";
import { UI_PACKAGE_VERSION } from "@expense-tracker/ui";
import { UTILS_PACKAGE_VERSION } from "@expense-tracker/utils";

describe("Monorepo Phase 0 Foundation Verification", () => {
  it("exports baseline domain package foundation", () => {
    expect(DOMAIN_PACKAGE_VERSION).toBe("0.1.0");
  });

  it("exports baseline schemas package foundation", () => {
    expect(SCHEMAS_PACKAGE_VERSION).toBe("0.1.0");
  });

  it("exports baseline state package foundation", () => {
    expect(STATE_PACKAGE_VERSION).toBe("0.1.0");
  });

  it("exports baseline analytics package foundation", () => {
    expect(ANALYTICS_PACKAGE_VERSION).toBe("0.1.0");
  });

  it("exports baseline ml-contract package foundation", () => {
    expect(ML_CONTRACT_PACKAGE_VERSION).toBe("0.1.0");
  });

  it("exports baseline ui package foundation", () => {
    expect(UI_PACKAGE_VERSION).toBe("0.1.0");
  });

  it("exports baseline utils package foundation", () => {
    expect(UTILS_PACKAGE_VERSION).toBe("0.1.0");
  });
});
