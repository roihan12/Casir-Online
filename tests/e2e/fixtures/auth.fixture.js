import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * Authentication fixtures for E2E tests
 *
 * Provides pre-authenticated page objects and common auth scenarios
 */

/**
 * Base fixture with login page
 */
export const test = base.extend({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});

/**
 * Authenticated page fixture - logs in as admin user
 * Note: Requires test user to exist in the database
 */
export const authenticated = base.extend({
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);

    // Login with test credentials
    await loginPage.login('admin', 'admin123');
    await loginPage.assertLoginSuccess('/dashboard');

    await use(page);

    // Cleanup: Logout after each test
    await page.close().catch(() => {});

    // Note: Page is closed, so no explicit logout needed
    // The browser context will be cleaned up by Playwright
  },
});

/**
 * Fixture for testing different user roles
 * @param role - User role (admin, kasir, manager, etc.)
 */
export const createRoleFixture = (role) => {
  return base.extend({
    authenticatedPage: async ({ page }, use) => {
      const loginPage = new LoginPage(page);

      // Login with role-specific credentials
      const credentials = getTestCredentials(role);
      await loginPage.login(credentials.username, credentials.password);
      await loginPage.assertLoginSuccess('/dashboard');

      await use(page);
    },
  });
};

/**
 * Fixture for testing with new user creation
 */
export const withNewUser = base.extend({
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);

    // This would create a new user via API before testing
    // For now, just provide the page object
    await use(dashboardPage);
  },
});

/**
 * Get test credentials for different roles
 */
function getTestCredentials(role) {
  const credentials = {
    admin: { username: 'admin', password: 'admin123' },
    kasir: { username: 'kasir1', password: 'kasir123' },
    manager: { username: 'manager1', password: 'manager123' },
  };

  return credentials[role] || credentials.admin;
}

/**
 * Reusable login function for tests
 */
export async function loginAs(page, role = 'admin') {
  const loginPage = new LoginPage(page);
  const credentials = getTestCredentials(role);
  await loginPage.login(credentials.username, credentials.password);
  await loginPage.assertLoginSuccess('/dashboard');
  return page;
}

/**
 * Reusable logout function for tests
 */
export async function logout(page) {
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.logout();
}

export { loginAs, logout };
