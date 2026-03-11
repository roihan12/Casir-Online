import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Shift Management', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@example.com', 'password123');
    await page.waitForURL('**/dashboard');
  });

  test('should be able to view shift history', async ({ page }) => {
    // Navigate to shift page
    await page.goto('/shift');
    
    // Check if the page contains the title
    await expect(page.locator('h1, h2').filter({ hasText: /Shift/i })).toBeVisible();
    
    // Expect table to be rendered
    await expect(page.locator('table, [data-testid="shift-list"]')).toBeVisible();
  });

  test('should be able to open or close shift', async ({ page }) => {
    await page.goto('/shift');
    
    // Look for Open/Close shift button
    const toggleShiftBtn = page.locator('button:has-text("Buka Shift"), button:has-text("Tutup Shift")').first();
    
    if (await toggleShiftBtn.isVisible()) {
      await toggleShiftBtn.click();
      
      // Expect modal to appear
      await expect(page.locator('form, .modal')).toBeVisible();
      
      // Close the modal (cancel)
      const cancelBtn = page.locator('button:has-text("Batal"), button:has-text("Cancel")');
      await cancelBtn.click();
    }
  });
});
