

/**
 * Global teardown for Playwright E2E tests
 *
 * This runs once after all tests:
 * - Clean up test data
 * - Generate reports
 * - Close any open connections
 */
async function globalTeardown(config) {
  console.log('🎭 Playwright E2E Test Teardown');
  console.log('   Tests completed. Check playwright-report/ for detailed results.');
  console.log('');
  console.log('📊 Next Steps:');
  console.log('   1. View HTML report: npx playwright show-report');
  console.log('   2. View test results: open playwright-report/index.html');
}

export default globalTeardown;
