import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Product Management', () => {
  // Use authenticated state if available, but for now we manually login
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@example.com', 'password123'); // Adjust to actual seed data
    await page.waitForURL('**/dashboard');
  });

  test('should display product list', async ({ page }) => {
    // Navigate to product page
    await page.click('text=/Produk/i'); // Using text or nav link
    await expect(page).toHaveURL(/.*\/products|.*\/produk/);
    
    // Expect product table or grid to be visible
    await expect(page.locator('table, .product-grid, [data-testid="product-list"]')).toBeVisible();
  });

  test('should open add product modal/page', async ({ page }) => {
    await page.goto('/produk'); // Adjust relative URL based on actual app routes
    
    // Click Add button
    const addButton = page.locator('text=/Tambah|Add/i').first();
    await addButton.click();
    
    // Expect form to appear
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="name"], input[name="nama"]')).toBeVisible();
  });
});
