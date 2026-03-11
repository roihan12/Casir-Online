import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Authentication Flow', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

   test('should show validation error for short password', async () => {
    // 1. Fill username and a short password (less than 5 chars)
    // This should enable the button according to user feedback
    await loginPage.usernameInput.fill('admin');
    await loginPage.passwordInput.fill('123'); // 3 characters < 5
    
    // 2. Click the login button (should be enabled now)
    await loginPage.loginButton.click();
    
    // 3. Assert that the specific validation error is visible
    const minLengthError = loginPage.page.locator('text=/minimal 5 karakter/i').first();
    await expect(minLengthError).toBeVisible();
  });


  test('should login successfully with valid credentials', async ({ page }) => {
    // Note: use credentials that match the local dev environment seeded data
    // Usually admin@example.com / password or similar
    await loginPage.login('superadmin', 'superadmin'); // Adjust based on your actual seeder
    
    // Expect redirection to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Expect to see a welcome message or dashboard element
    await expect(page.locator('text=/Halo, Super Administrator!/i')).toBeVisible();
  });

  test('should show error with invalid credentials', async () => {
    await loginPage.login('wrong@email.com', 'wrongpassword');
    
    // Expect error message snippet (e.g. "Kredensial tidak valid" or "Invalid credentials")
      const errorMsg = loginPage.page.locator('text=/Username or password is incorrect or inactive account/i').first();
    await expect(errorMsg).toBeVisible();
  });
});
