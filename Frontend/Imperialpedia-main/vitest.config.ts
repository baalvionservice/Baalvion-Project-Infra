import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * There was no vitest config, so the `@/…` alias every module in src/ imports
 * with was unresolvable under test — which is why the only test file that
 * existed tested a module with no internal imports. Mirroring the alias from
 * tsconfig.json lets tests cover application code rather than just leaf utils.
 */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
