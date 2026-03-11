import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';

/**
 * Playwright Configuration for Casir-Online E2E Testing
 *
 * This configuration supports:
 * - Multiple browsers (Chromium, Firefox, WebKit)
 * - Mobile emulation
 * - Visual regression testing
 * - CI/CD integration
 * - HTML and JUnit reporting
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e/specs',

  // Fully parallel test execution
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'playwright-results/junit.xml' }],
    ['list'], // Print summary after test run
  ],

  // Shared settings for all tests
  use: {
    // Base URL for tests (can be overridden via BASE_URL env var)
    baseURL: 'https://casir.local',

    // Collect trace when retrying the test
    trace: 'on-first-retry',

    // Record screenshot only when test fails
    screenshot: 'only-on-failure',

    // Record video only when test fails
    video: 'retain-on-failure',

    // Headless mode (can be overridden with HEADED=1)
    headless: true,

    // Action and navigation timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // Viewport size
    viewport: { width: 1280, height: 720 },
  },

  // Projects define different test configurations
  projects: [
    // Desktop Chrome
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Desktop Firefox
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // Desktop Safari (WebKit)
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile Chrome
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    // Mobile Safari
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },

    // Authenticated tests - Uses pre-saved authentication state
    {
      name: 'authenticated',
      testMatch: /.*\.auth\.spec\.js/,
      use: {
        // Use stored authentication state
        storageState: 'tests/e2e/.auth/admin-user.json',
      },
    },

    // Visual regression tests
    {
      name: 'visual-regression',
      testMatch: /.*\.visual\.spec\.js/,
      use: {
        screenshot: 'only-on-failure',
      },
    },
  ],

  // Global setup and teardown
  globalSetup: resolve('./tests/e2e/global-setup.js'),
  globalTeardown: resolve('./tests/e2e/global-teardown.js'),

  // Web server configuration for development
  // This allows Playwright to start the dev server automatically
  webServer: {
    command: 'npm run dev',
    url: 'https://casir.local',
    timeout: 120 * 1000, // 2 minutes
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
