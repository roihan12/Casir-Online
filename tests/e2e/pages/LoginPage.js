import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object Model
 *
 * Handles user authentication functionality
 */
export class LoginPage extends BasePage {
  // Form elements
  ;
  ;
  ;
  ;
  ;
  ;

  // Page elements
  ;
  ;

  constructor(page) {
    super(page, '/login');

    // Form inputs
    this.usernameInput = page.getByLabel(/username|email/i);
    this.passwordInput = page.getByLabel(/password|kata sandi/i);
    this.loginButton = page.getByRole('button', { name: /login|masuk|sign in/i });

    // Additional elements
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
    this.rememberMeCheckbox = page.getByLabel(/remember me|ingat saya/i);
    this.errorMessage = page.locator('[data-testid="error-message"], .error-message, .alert-error');

    // Page elements
    this.pageTitle = page.locator('h1, h2');
    this.logo = page.locator('[data-testid="logo"], .logo');
  }

  /**
   * Login with username and password
   * @param username - Username or email
   * @param password - Password
   * @param rememberMe - Whether to remember the user
   */
  async login(username, password, rememberMe = false) {
    await this.goto();

    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);

    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }

    await this.loginButton.click();
    await this.waitForLoad();

    // Should redirect to dashboard after successful login
    // Note: This may need adjustment based on actual app behavior
  }

  /**
   * Verify login was successful
   * @param expectedPath - Expected path after login (default: '/dashboard')
   */
  async assertLoginSuccess(expectedPath = '/dashboard') {
    await this.page.waitForURL(`**${expectedPath}*`);
    const currentUser = await this.getCurrentUser();
    expect(currentUser).not.toBeNull();
  }

  /**
   * Verify login error message is displayed
   * @param expectedMessage - Expected error message
   */
  async assertLoginError(expectedMessage) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(expectedMessage);
  }

  /**
   * Navigate to forgot password page
   */
  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
    // Verify we're on the forgot password page
    await expect(this.page).toHaveURL(/\/forgot-password|\/reset-password/);
  }

  /**
   * Toggle remember me checkbox
   */
  async toggleRememberMe() {
    await this.rememberMeCheckbox.check();
  }

  /**
   * Verify page is loaded correctly
   */
  async assertPageLoaded() {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Get validation error for a specific field
   * @param field - Field name ('username' or 'password')
   */
  async getFieldError(field) {
    const fieldLocator = field === 'username' ? this.usernameInput : this.passwordInput;
    const errorLocator = fieldLocator.locator('..').locator('[data-testid="error-message"], .error-message, .text-red-500');
    return await errorLocator.textContent() || '';
  }

  /**
   * Verify password is masked
   */
  async assertPasswordMasked() {
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
  }

  /**
   * Submit login form with empty fields
   */
  async submitEmptyForm() {
    await this.goto();
    await this.loginButton.click();
    await this.assertPageLoaded();
  }
}

export default LoginPage;
