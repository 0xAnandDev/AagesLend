// Playwright test example
const { test, expect } = require('@playwright/test');

test.describe('AagesLend Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto('http://localhost:5173');
  });

  test('should display dashboard title and connect button', async ({ page }) => {
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/AagesLend/);

    // Expect the connect wallet button to be visible
    const connectButton = page.getByRole('button', { name: /Connect Wallet/i });
    await expect(connectButton).toBeVisible();
  });

  test('should navigate to Lend page', async ({ page }) => {
    // Click the Lend link in the navigation
    await page.getByRole('link', { name: /Lend/i }).click();

    // Expect the URL to contain /lend
    await expect(page).toHaveURL(/.*lend/);
    
    // Expect specific Lend page loaded
    await expect(page.getByRole('heading', { level: 2, name: /Supply/i })).toBeVisible();
  });
});
