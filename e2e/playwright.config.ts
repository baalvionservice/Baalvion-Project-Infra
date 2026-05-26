import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Baalvion E2E tests.
 * baseURL targets about-baalvion (:3020) — per-spec overrides are done inline.
 */
export default defineConfig({
  testDir: './',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3020',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
