/** @vitest-environment node */
/**
 * Render tests for the shared Card component.
 *
 * Card.tsx is reused everywhere in the dashboard; these tests assert that
 * every variant/prop combination renders the expected CSS classes so an
 * unintentional style regression is caught in CI.
 */
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { Card } from "./Card";

/** Chars that are always present in any Card render. */
const BASE_CLASSES = ["glass-card", "rounded-2xl", "p-6", "transition-all", "duration-300"];

function renderCard(jsx: React.ReactElement): string {
  return renderToString(jsx);
}

describe("Card", () => {
  describe("default render", () => {
    it("renders children", () => {
      const html = renderCard(<Card>Hello</Card>);
      expect(html).toContain("Hello");
    });

    it("includes base layout classes", () => {
      const html = renderCard(<Card>content</Card>);
      for (const cls of BASE_CLASSES) {
        expect(html).toContain(cls);
      }
    });

    it("includes hover treatment by default", () => {
      const html = renderCard(<Card>content</Card>);
      expect(html).toContain("hover:-translate-y-1");
    });

    it("does not include glow by default", () => {
      const html = renderCard(<Card>content</Card>);
      expect(html).not.toContain("glow-card");
    });
  });

  describe("glow prop", () => {
    it("adds glow-card class when glow is true", () => {
      const html = renderCard(<Card glow>content</Card>);
      expect(html).toContain("glow-card");
    });

    it("still includes base classes when glow is true", () => {
      const html = renderCard(<Card glow>content</Card>);
      for (const cls of BASE_CLASSES) {
        expect(html).toContain(cls);
      }
    });
  });

  describe("hover prop", () => {
    it("omits hover treatment when hover is false", () => {
      const html = renderCard(<Card hover={false}>content</Card>);
      expect(html).not.toContain("hover:-translate-y-1");
    });

    it("still includes base classes when hover is false", () => {
      const html = renderCard(<Card hover={false}>content</Card>);
      for (const cls of BASE_CLASSES) {
        expect(html).toContain(cls);
      }
    });
  });

  describe("className prop", () => {
    it("appends custom className", () => {
      const html = renderCard(<Card className="my-custom-class">content</Card>);
      expect(html).toContain("my-custom-class");
    });

    it("preserves base classes with custom className", () => {
      const html = renderCard(<Card className="extra">content</Card>);
      for (const cls of BASE_CLASSES) {
        expect(html).toContain(cls);
      }
    });
  });

  describe("combined props", () => {
    it("renders glow + hover=false together", () => {
      const html = renderCard(
        <Card glow hover={false}>
          content
        </Card>
      );
      expect(html).toContain("glow-card");
      expect(html).not.toContain("hover:-translate-y-1");
      for (const cls of BASE_CLASSES) {
        expect(html).toContain(cls);
      }
    });

    it("renders all props together", () => {
      const html = renderCard(
        <Card glow hover className="p-8">
          content
        </Card>
      );
      expect(html).toContain("glow-card");
      expect(html).toContain("hover:-translate-y-1");
      expect(html).toContain("p-8");
      for (const cls of BASE_CLASSES) {
        expect(html).toContain(cls);
      }
    });

    it("renders complex children", () => {
      const html = renderCard(
        <Card>
          <h3>Title</h3>
          <p>Description text</p>
        </Card>
      );
      expect(html).toContain("Title");
      expect(html).toContain("Description text");
    });
  });
});