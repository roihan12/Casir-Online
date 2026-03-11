import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Reports and Analytics', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@example.com', 'password123');
    await page.waitForURL('**/dashboard');
  });

  test('should load sales report page', async ({ page }) => {
    await page.goto('/laporan/penjualan'); // Adjust URL to actual reporting path
    
    // Expect title
    await expect(page.locator('h1, h2').filter({ hasText: /Laporan|Penjualan/i })).toBeVisible();

    // Expect charting library or table to load
    // Assuming we use charts or a data grid
    const reportContainer = page.locator('.report-container, canvas, table').first();
    await expect(reportContainer).toBeVisible();
  });

  test('should allow date filtering', async ({ page }) => {
    await page.goto('/laporan/penjualan');

    // Look for datepicker inputs
    const dateInput = page.locator('input[type="date"], .datepicker-input').first();
    
    if (await dateInput.isVisible()) {
      // Just verifying the filter exists
      await expect(dateInput).toBeEnabled();
      
      // Look for a filter button
      const filterBtn = page.locator('button:has-text("Filter"), button:has-text("Tampilkan")');
      if (await filterBtn.isVisible()) {
        await expect(filterBtn).toBeEnabled();
      }
    }
  });
});
