import { expect } from '@playwright/test';

/**
 * Base Page Object Model class
 *
 * All page objects should extend this class to inherit common functionality
 */
export class BasePage {
  
  
  

  /**
   * @param page - Playwright Page object
   * @param path - URL path (e.g., '/login', '/dashboard')
   */
  constructor(page, path) {
    this.page = page;
    this.path = path;
    this.url = `${process.env.BASE_URL || 'https://casir.local'}${path}`;
  }

  /**
   * Navigate to this page
   */
  async goto() {
    await this.page.goto(this.url);
    await this.waitForLoad();
  }

  /**
   * Reload the current page
   */
  async reload() {
    await this.page.reload();
    await this.waitForLoad();
  }

  /**
   * Wait for page to be in a stable state
   */
  async waitForLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    // Additional wait for dynamic content
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for network to be idle (no more than 2 requests for 500ms)
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot of the current page
   * @param name - Screenshot file name
   */
  async screenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshots/${name}-${timestamp}.png`;
    await this.page.screenshot({ path: filename, fullPage: true });
  }

  /**
   * Take a screenshot on test failure
   * @param name - Test name for the screenshot
   */
  async screenshotOnFailure(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({
      path: `screenshots/failure-${name}-${timestamp}.png`,
      fullPage: true,
    });
  }

  /**
   * Get page title
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  async getUrl() {
    return this.page.url();
  }

  /**
   * Check if we're on the expected page
   * @param expectedPath - Expected URL path
   */
  async assertOnPage(expectedPath) {
    const url = new URL(await this.getUrl());
    expect(url.pathname).toBe(expectedPath);
  }

  /**
   * Wait for an element to be visible
   * @param locator - Playwright Locator
   * @param timeout - Custom timeout (ms)
   */
  async waitForVisible(locator, timeout = 5000) {
    await expect(locator).toBeVisible({ timeout });
  }

  /**
   * Wait for an element to be hidden
   * @param locator - Playwright Locator
   * @param timeout - Custom timeout (ms)
   */
  async waitForHidden(locator, timeout = 5000) {
    await expect(locator).toBeHidden({ timeout });
  }

  /**
   * Click an element
   * @param locator - Playwright Locator
   */
  async click(locator) {
    await locator.click();
  }

  /**
   * Fill an input field
   * @param locator - Playwright Locator
   * @param value - Value to fill
   */
  async fill(locator, value) {
    await locator.fill(value);
  }

  /**
   * Select an option from a dropdown
   * @param locator - Playwright Locator for select element
   * @param value - Option value or label
   */
  async selectOption(locator, value) {
    await locator.selectOption(value);
  }

  /**
   * Check if element is visible
   * @param locator - Playwright Locator
   */
  async isVisible(locator) {
    return await locator.isVisible();
  }

  /**
   * Get text content of an element
   * @param locator - Playwright Locator
   */
  async getText(locator) {
    return await locator.textContent() || '';
  }

  /**
   * Wait for and verify toast/notification message
   * @param message - Expected message text
   * @param selector - Custom selector for toast/notification
   */
  async waitForToast(message, selector = '[data-testid="toast-notification"]') {
    const toast = this.page.locator(selector);
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(message);
    await expect(toast).toBeHidden({ timeout: 5000 });
  }

  /**
   * Verify page heading
   * @param text - Expected heading text
   * @param level - Heading level (h1, h2, etc.)
   */
  async verifyHeading(text, level = 'h1') {
    const heading = this.page.locator(`${level}:has-text("${text}")`);
    await expect(heading).toBeVisible();
  }

  /**
   * Navigate to a sub-path within this page
   * @param subPath - Sub-path to navigate to
   */
  async navigateTo(subPath) {
    await this.page.goto(`${this.url}${subPath}`);
    await this.waitForLoad();
  }

  /**
   * Check if current user is authenticated
   * @returns true if authenticated, false otherwise
   */
  async isAuthenticated() {
    // Check for authentication indicator (like a user menu or logout button)
    const logoutButton = this.page.locator('[data-testid="logout-button"], button:has-text("Logout")').first();
    return await logoutButton.count() > 0;
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    const userMenu = this.page.locator('[data-testid="user-menu"], .user-menu').first();

    if (await userMenu.count() > 0) {
      const name = await userMenu.locator('[data-testid="user-name"]').textContent().catch(() => '');
      const email = await userMenu.locator('[data-testid="user-email"]').textContent().catch(() => '');

      return {
        name: name?.trim() || '',
        email: email?.trim() || '',
      };
    }

    return null;
  }
}

export default BasePage;
