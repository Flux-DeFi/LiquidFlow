/** @vitest-environment node */
/**
 * Render tests for the shared Button component.
 *
 * Button.tsx is reused everywhere in the dashboard; these tests assert that
 * every variant/size/prop combination renders the expected CSS classes so an
 * unintentional style regression is caught in CI.
 */
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { Button } from "./Button";

const BASE = "inline-flex items-center justify-center rounded-full font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

function renderButton(jsx: React.ReactElement): string {
  return renderToString(jsx);
}

describe("Button", () => {
  describe("default render", () => {
    it("renders children", () => {
      const html = renderButton(<Button>Click me</Button>);
      expect(html).toContain("Click me");
    });

    it("renders a <button> element", () => {
      const html = renderButton(<Button>btn</Button>);
      expect(html).toMatch(/^<button/);
      expect(html).toMatch(/<\/button>$/);
    });

    it("includes base styles", () => {
      const html = renderButton(<Button>btn</Button>);
      // Every word in BASE should be present in the rendered class attribute
      for (const token of BASE.split(" ")) {
        expect(html).toContain(token);
      }
    });
  });

  describe("variant prop", () => {
    it("renders primary variant by default", () => {
      const html = renderButton(<Button>btn</Button>);
      expect(html).toContain("bg-accent");
      expect(html).toContain("text-background");
    });

    it("renders secondary variant", () => {
      const html = renderButton(<Button variant="secondary">btn</Button>);
      expect(html).toContain("bg-accent-secondary");
      expect(html).toContain("text-white");
    });

    it("renders outline variant", () => {
      const html = renderButton(<Button variant="outline">btn</Button>);
      expect(html).toContain("border");
      expect(html).toContain("border-glass-border");
      expect(html).toContain("bg-glass");
    });

    it("renders ghost variant", () => {
      const html = renderButton(<Button variant="ghost">btn</Button>);
      expect(html).toContain("text-slate-400");
      expect(html).toContain("hover:text-accent");
    });
  });

  describe("size prop", () => {
    it("renders md size by default", () => {
      const html = renderButton(<Button>btn</Button>);
      expect(html).toContain("px-6");
      expect(html).toContain("py-2.5");
      expect(html).toContain("text-sm");
    });

    it("renders sm size", () => {
      const html = renderButton(<Button size="sm">btn</Button>);
      expect(html).toContain("px-4");
      expect(html).toContain("py-1.5");
      expect(html).toContain("text-xs");
    });

    it("renders lg size", () => {
      const html = renderButton(<Button size="lg">btn</Button>);
      expect(html).toContain("px-8");
      expect(html).toContain("py-3.5");
      expect(html).toContain("text-base");
    });
  });

  describe("glow prop", () => {
    it("adds glow styles when glow is true", () => {
      const html = renderButton(<Button glow>btn</Button>);
      expect(html).toContain("shadow-[0_0_20px_rgba(16,185,129,0.3)]");
    });

    it("omits glow styles when glow is false", () => {
      const html = renderButton(<Button glow={false}>btn</Button>);
      expect(html).not.toContain("shadow-[0_0_20px");
    });
  });

  describe("disabled state", () => {
    it("includes disabled classes when disabled", () => {
      const html = renderButton(<Button disabled>btn</Button>);
      expect(html).toContain("disabled:opacity-50");
      expect(html).toContain("disabled:pointer-events-none");
    });

    it("applies disabled attribute", () => {
      const html = renderButton(<Button disabled>btn</Button>);
      expect(html).toContain('disabled=""');
    });
  });

  describe("className prop", () => {
    it("appends custom className", () => {
      const html = renderButton(<Button className="tracking-wide">btn</Button>);
      expect(html).toContain("tracking-wide");
    });
  });

  describe("native button attributes", () => {
    it("passes type attribute", () => {
      const html = renderButton(<Button type="submit">btn</Button>);
      expect(html).toContain('type="submit"');
    });

    it("passes data-* attributes", () => {
      const html = renderButton(<Button data-testid="action-btn">btn</Button>);
      expect(html).toContain('data-testid="action-btn"');
    });
  });

  describe("variant + size + glow combinations", () => {
    it("renders secondary + lg + glow", () => {
      const html = renderButton(
        <Button variant="secondary" size="lg" glow>
          btn
        </Button>
      );
      expect(html).toContain("bg-accent-secondary");
      expect(html).toContain("px-8");
      expect(html).toContain("shadow-[0_0_20px");
    });

    it("renders outline + sm", () => {
      const html = renderButton(
        <Button variant="outline" size="sm">
          btn
        </Button>
      );
      expect(html).toContain("border-glass-border");
      expect(html).toContain("px-4");
    });

    it("renders ghost + lg without glow", () => {
      const html = renderButton(
        <Button variant="ghost" size="lg" glow={false}>
          btn
        </Button>
      );
      expect(html).toContain("text-slate-400");
      expect(html).toContain("px-8");
      expect(html).not.toContain("shadow-[0_0_20px");
    });
  });
});