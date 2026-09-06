/**
 * Multi-Platform Production Packaging & Distribution Integrity QA (Phase 30).
 * Validates distribution bundles, package type declarations, web/desktop assets, and ONNX model packaging.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Multi-Platform Packaging & Distribution Integrity (Phase 30)", () => {
  const rootDir = path.resolve(__dirname, "..");

  describe("Core Package Compilation & Type Declarations", () => {
    const packages = [
      "domain",
      "schemas",
      "state",
      "analytics",
      "ml-contract",
      "llm-client",
      "ui",
      "utils",
      "db",
    ];

    it.each(packages)(
      "package '@expense-tracker/%s' provides valid dist and .d.ts declarations",
      (pkgName) => {
        const pkgDist = path.join(rootDir, "packages", pkgName, "dist");
        expect(fs.existsSync(pkgDist)).toBe(true);

        const files = fs.readdirSync(pkgDist);
        const hasDts = files.some((f) => f.endsWith(".d.ts"));
        const hasJs = files.some((f) => f.endsWith(".js"));

        expect(hasDts).toBe(true);
        expect(hasJs).toBe(true);
      },
    );
  });

  describe("Web Application Production Distribution (apps/web)", () => {
    const webDist = path.join(rootDir, "apps", "web", "dist");

    it("contains an optimized index.html and assets directory", () => {
      expect(fs.existsSync(webDist)).toBe(true);
      const indexHtmlPath = path.join(webDist, "index.html");
      expect(fs.existsSync(indexHtmlPath)).toBe(true);

      const htmlContent = fs.readFileSync(indexHtmlPath, "utf-8");
      expect(htmlContent.toLowerCase()).toContain("<!doctype html>");
      expect(htmlContent).toContain("<script");
      expect(htmlContent).toContain('<link rel="stylesheet"');
    });

    it("generates minified JS and CSS chunks conforming to production budgets", () => {
      const assetsDir = path.join(webDist, "assets");
      expect(fs.existsSync(assetsDir)).toBe(true);

      const assets = fs.readdirSync(assetsDir);
      const jsFiles = assets.filter((f) => f.endsWith(".js"));
      const cssFiles = assets.filter((f) => f.endsWith(".css"));

      expect(jsFiles.length).toBeGreaterThan(0);
      expect(cssFiles.length).toBeGreaterThan(0);

      // Verify total JS bundle is reasonably compact (< 2MB)
      let totalJsSize = 0;
      for (const js of jsFiles) {
        const stats = fs.statSync(path.join(assetsDir, js));
        totalJsSize += stats.size;
      }
      expect(totalJsSize).toBeLessThan(2 * 1024 * 1024);
    });
  });

  describe("Desktop Application Frontend Distribution (apps/desktop)", () => {
    const desktopDist = path.join(rootDir, "apps", "desktop", "dist");

    it("contains valid desktop frontend production bundle", () => {
      expect(fs.existsSync(desktopDist)).toBe(true);
      const indexHtmlPath = path.join(desktopDist, "index.html");
      expect(fs.existsSync(indexHtmlPath)).toBe(true);

      const assetsDir = path.join(desktopDist, "assets");
      expect(fs.existsSync(assetsDir)).toBe(true);
      const assets = fs.readdirSync(assetsDir);
      expect(assets.some((f) => f.endsWith(".js"))).toBe(true);
    });

    it("verifies Tauri configuration manifest exists and is valid JSON", () => {
      const tauriConfigPath = path.join(rootDir, "apps", "desktop", "src-tauri", "tauri.conf.json");
      expect(fs.existsSync(tauriConfigPath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(tauriConfigPath, "utf-8"));
      expect(content.build.frontendDist).toBe("../dist");
      expect(content.productName).toBeTruthy();
    });
  });

  describe("Mobile Application Foundation (apps/mobile)", () => {
    it("verifies Expo App configuration and root entry point", () => {
      const appJsonPath = path.join(rootDir, "apps", "mobile", "app.json");
      expect(fs.existsSync(appJsonPath)).toBe(true);

      const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
      expect(appJson.expo.name).toBe("ExpenseSuper");
      expect(appJson.expo.slug).toBeTruthy();

      const entryFile = path.join(rootDir, "apps", "mobile", "App.tsx");
      expect(fs.existsSync(entryFile)).toBe(true);
    });
  });

  describe("ONNX Models & Behavioral Artifacts Packaging", () => {
    const modelsDir = path.join(rootDir, "ml", "models");

    it("contains valid binary ONNX models with non-zero size", () => {
      const anomalyModel = path.join(modelsDir, "isolation_forest.onnx");
      const clusteringModel = path.join(modelsDir, "kmeans_clusterer.onnx");

      expect(fs.existsSync(anomalyModel)).toBe(true);
      expect(fs.existsSync(clusteringModel)).toBe(true);

      const anomStat = fs.statSync(anomalyModel);
      const clustStat = fs.statSync(clusteringModel);

      expect(anomStat.size).toBeGreaterThan(100);
      expect(clustStat.size).toBeGreaterThan(100);
    });

    it("contains valid model manifests with signature metadata", () => {
      const manifestPath = path.join(modelsDir, "onnx_models_manifest.json");
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      expect(manifest.models.anomaly_detector).toBeDefined();
      expect(manifest.models.persona_clusterer).toBeDefined();
      expect(manifest.models.anomaly_detector.input_schema.feature_count).toBe(14);
      expect(manifest.models.persona_clusterer.input_schema.feature_count).toBe(8);
    });
  });
});
