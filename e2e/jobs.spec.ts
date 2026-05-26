import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Jobs Portal frontend (port 3026).
 * These tests override the baseURL to point at :3026.
 */

const JOBS_BASE = 'http://localhost:3026';

test('jobs portal homepage loads', async ({ page }) => {
  await page.goto(JOBS_BASE);
  await expect(page).toHaveTitle(/Baalvion/i);
});

test('job listings are visible on homepage', async ({ page }) => {
  await page.goto(JOBS_BASE);
  // Expect a list or grid of job cards — covers both ul/ol list elements and role=list
  const jobList = page.locator('ul, ol, [role="list"], [class*="grid"], [class*="list"]').first();
  await expect(jobList).toBeVisible();
});

test('search input accepts text', async ({ page }) => {
  await page.goto(JOBS_BASE);
  const searchInput = page.locator('input[type="search"], input[type="text"], input[placeholder*="search" i]').first();
  await expect(searchInput).toBeVisible();
  await searchInput.fill('software engineer');
  await expect(searchInput).toHaveValue('software engineer');
});
