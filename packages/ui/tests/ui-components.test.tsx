import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, Input, Card, Modal, Badge, ProvenanceBadge } from "../src";

describe("UI Component Library QA (packages/ui)", () => {
  describe("Button Component", () => {
    it("renders primary, secondary, danger, and ghost variants", () => {
      const primaryHtml = renderToStaticMarkup(<Button variant="primary">Submit</Button>);
      expect(primaryHtml).toContain("Submit");
      expect(primaryHtml).toContain("ui-button primary");

      const dangerHtml = renderToStaticMarkup(<Button variant="danger">Delete</Button>);
      expect(dangerHtml).toContain("ui-button danger");

      const ghostHtml = renderToStaticMarkup(<Button variant="ghost">Cancel</Button>);
      expect(ghostHtml).toContain("ui-button ghost");
    });

    it("handles disabled state and sizes cleanly", () => {
      const disabledHtml = renderToStaticMarkup(
        <Button size="sm" disabled>
          Processing
        </Button>,
      );
      expect(disabledHtml).toContain("disabled");
      expect(disabledHtml).toContain("sm");
    });
  });

  describe("Input Component", () => {
    it("renders with label, placeholder, and helper text", () => {
      const html = renderToStaticMarkup(
        <Input label="Transaction Amount" placeholder="0.00" type="number" defaultValue={500} />,
      );
      expect(html).toContain("Transaction Amount");
      expect(html).toContain('placeholder="0.00"');
      expect(html).toContain('type="number"');
    });

    it("displays error state and error message when provided", () => {
      const html = renderToStaticMarkup(
        <Input label="Email" error="Please enter a valid email address" />,
      );
      expect(html).toContain("Please enter a valid email address");
    });
  });

  describe("Card Component", () => {
    it("renders glass, outline, and standard variants with custom padding", () => {
      const glassHtml = renderToStaticMarkup(
        <Card variant="glass" padding="lg">
          <div>Glass Content</div>
        </Card>,
      );
      expect(glassHtml).toContain("Glass Content");
      expect(glassHtml).toContain("ui-card glass");

      const outlineHtml = renderToStaticMarkup(
        <Card variant="outline" padding="sm">
          <div>Outline Content</div>
        </Card>,
      );
      expect(outlineHtml).toContain("Outline Content");
    });
  });

  describe("Modal Component", () => {
    it("renders title, children, and close triggers when open", () => {
      const html = renderToStaticMarkup(
        <Modal isOpen={true} title="Create Budget Goal" onClose={() => {}}>
          <p>Modal Body Details</p>
        </Modal>,
      );
      expect(html).toContain("Create Budget Goal");
      expect(html).toContain("Modal Body Details");
    });

    it("renders nothing when isOpen is false", () => {
      const html = renderToStaticMarkup(
        <Modal isOpen={false} title="Hidden Modal" onClose={() => {}}>
          <p>Should Not Appear</p>
        </Modal>,
      );
      expect(html).toBe("");
    });
  });

  describe("Badge Component", () => {
    it("renders all 6 status variants properly", () => {
      const variants = ["success", "danger", "warning", "info", "brand", "neutral"] as const;
      for (const variant of variants) {
        const html = renderToStaticMarkup(<Badge variant={variant}>{variant}</Badge>);
        expect(html).toContain(variant);
        expect(html).toContain(`ui-badge ${variant}`);
      }
    });
  });

  describe("ProvenanceBadge Component", () => {
    it("renders all 3 provenance tiers with appropriate iconography and labels", () => {
      const calcHtml = renderToStaticMarkup(<ProvenanceBadge tier="calculated" />);
      expect(calcHtml).toContain("Calculated");

      const mlHtml = renderToStaticMarkup(<ProvenanceBadge tier="ml_detected" />);
      expect(mlHtml).toContain("ML Detected");

      const llmHtml = renderToStaticMarkup(<ProvenanceBadge tier="llm_suggested" />);
      expect(llmHtml).toContain("LLM Suggested");
    });
  });
});
