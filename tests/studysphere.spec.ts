import { test, expect } from '@playwright/test';

test('StudySphere loads successfully', async ({ page }) => {
  await page.goto('http://localhost:5173');

  await expect(page.locator('body')).toBeVisible();
});