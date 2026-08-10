import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Mirror the `@/*` path alias from tsconfig.json so hooks can be imported
  // under the same specifiers they use in the app.
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
  },
  // Inline an empty PostCSS config so unit tests don't try to load the
  // project's Tailwind PostCSS pipeline.
  css: {
    postcss: {},
  },
});
