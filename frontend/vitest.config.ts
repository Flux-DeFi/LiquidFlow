import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
  // Inline an empty PostCSS config so unit tests don't try to load the
  // project's Tailwind PostCSS pipeline.
  css: {
    postcss: {},
  },
});
