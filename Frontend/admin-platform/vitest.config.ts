import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Unit tests for the console's pure modules — above all `lib/authz`, which decides what every
 * one of the 35 sections shows. Node environment on purpose: these are decision functions, not
 * components, and they should stay runnable without a DOM.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
