import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Transaction / Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@example.com', 'password123');
    await page.waitForURL('**/dashboard');
  });

  test('should be able to add item to cart and checkout', async ({ page }) => {
    // Navigate to POS/Cashier page
    await page.goto('/transaksi'); // Adjust endpoint to actual cashier route
    
    // Ensure product list loads
    const productCard = page.locator('.product-card, [data-testid="product-item"]').first();
    await expect(productCard).toBeVisible();

    // Click on a product to add to cart
    await productCard.click();

    // Verify product is in cart
    const cartItem = page.locator('.cart-item, [data-testid="cart-item-name"]').first();
    await expect(cartItem).toBeVisible();

    // Click checkout / pay button
    const payButton = page.locator('button:has-text("Bayar"), button:has-text("Pay")');
    await payButton.click();

    // Expect payment modal to appear
    const paymentModal = page.locator('.payment-modal, [data-testid="payment-modal"]');
    await expect(paymentModal).toBeVisible();

    // Input exact amount or choose payment method
    const exactAmountBtn = page.locator('button:has-text("Uang Pas")');
    if (await exactAmountBtn.isVisible()) {
      await exactAmountBtn.click();
    }
    
    // Submit transaction
    const processBtn = page.locator('button:has-text("Proses Pembayaran"), button:has-text("Selesai")');
    await processBtn.click();

    // Verify success receipt or message
    await expect(page.locator('text=/Transaksi Berhasil|Transaction Success/i')).toBeVisible();
  });
});
