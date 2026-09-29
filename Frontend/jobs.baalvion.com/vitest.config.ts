import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Vitest configuration.
 *
 * - `globals: true` exposes describe/test/expect without explicit imports
 *   (matches the existing test style and keeps test files terse).
 * - The `@` alias mirrors tsconfig `paths` (@/* -> src/*) so module specifiers
 *   resolve identically in tests and in the app.
 * - `environment: 'node'` is sufficient for the current pure-logic tests. Switch
 *   individual files to jsdom with a `// @vitest-environment jsdom` docblock (or
 *   change this default) once React component tests are added.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    clearMocks: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
