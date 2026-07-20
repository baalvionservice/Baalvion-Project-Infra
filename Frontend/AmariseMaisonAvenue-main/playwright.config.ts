import { defineConfig, devices } from '@playwright/test';

// Requires the full stack running (this app + commerce/order/inventory/auth services + Postgres)
// — see repo root `pnpm run dev` / `pnpm run infra:up`. Not run in CI yet (no live backend
// available there); intended for local/staging verification of the checkout golden path.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3033',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'pnpm dev',
    url: 'http://localhost:3033',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
