import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Baalvion E2E tests.
 *
 * This file is NOT at the repo root, so it has to be passed explicitly:
 * `playwright test --config e2e/playwright.config.ts` (which is what the root
 * `test:e2e` script now does). Run bare from the root, Playwright finds no config,
 * falls back to testDir '.', and tries to execute every *.test.ts in all 115
 * workspaces — jest and vitest files included — which is what `pnpm run test:e2e`
 * did for as long as it has been documented.
 *
 * baseURL targets about-baalvion (:3020) because about.spec.ts inherits it. Every
 * other spec targets a different app and sets its own base inline (:3026 jobs,
 * :3071 canwemarry, :3027 IR), so there is no single baseURL to be right about.
 *
 * There is deliberately no `webServer` block: the specs span four apps, three of
 * which need their own backend, so starting them is the caller's job — see
 * .github/workflows/e2e.yml for the one journey CI stands up end to end.
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
