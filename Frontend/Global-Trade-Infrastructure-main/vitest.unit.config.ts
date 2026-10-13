import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Fast unit tests for pure logic. Unlike the main config it starts no database, so it runs in
 * seconds and anywhere:  pnpm exec vitest run --config vitest.unit.config.ts
 */
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: { environment: 'node', include: ['src/**/*.unit.test.ts'], globals: false },
});
