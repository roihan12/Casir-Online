# Playwright & K6 Testing Implementation Plan

## Overview
This document outlines the implementation plan for adding Playwright (E2E testing) and K6 (load/performance testing) to the Casir-Online project.

## Table of Contents
1. [Playwright E2E Testing](#1-playwright-e2e-testing)
2. [K6 Performance Testing](#2-k6-performance-testing)
3. [CI/CD Integration](#3-cicd-integration)
4. [Documentation & Training](#4-documentation--training)

---

## 1. Playwright E2E Testing

### 1.1 Installation & Setup

**Install Dependencies:**
```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers (Chromium, Firefox, WebKit)
npx playwright install

# Install additional dependencies
npm install -D @playwright/experimental-ct-react
```

**Configuration Files to Create:**
- `playwright.config.ts` - Main configuration
- `tests/e2e/.gitkeep` - Test directory structure
- `tests/e2e/fixtures/auth.fixture.ts` - Authentication fixtures
- `tests/e2e/pages/` - Page Object Model files
- `tests/e2e/utils/` - Test utilities

### 1.2 Directory Structure

```
server/
├── tests/
│   ├── integration/           # Existing integration tests
│   ├── e2e/                   # New E2E tests
│   │   ├── fixtures/          # Test fixtures (auth, data)
│   │   ├── pages/             # Page Object Models
│   │   │   ├── BasePage.ts
│   │   │   ├── LoginPage.ts
│   │   │   ├── DashboardPage.ts
│   │   │   ├── ProdukPage.ts
│   │   │   ├── TransaksiPage.ts
│   │   │   ├── ShiftPage.ts
│   │   │   └── ReportPage.ts
│   │   ├── specs/             # Test specifications
│   │   │   ├── auth/
│   │   │   ├── produk/
│   │   │   ├── transaksi/
│   │   │   ├── shift/
│   │   │   └── reports/
│   │   └── utils/             # Helper functions
│   ├── performance/          # K6 performance tests
│   │   ├── scripts/           # K6 test scripts
│   │   ├── scenarios/         # Test scenarios
│   │   └── data/              # Test data
│   └── utils/                 # Shared test utilities
├── playwright.config.ts       # Playwright configuration
├── k6.config.js              # K6 configuration
└── package.json
```

### 1.3 Playwright Configuration

**playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'playwright-results/junit.xml' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'auth',
      testMatch: /.*\.auth\.spec\.ts/,
      use: {
        storageState: 'tests/e2e/.auth/admin-user.json',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### 1.4 Page Object Model Examples

**BasePage.ts:**
```typescript
import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly url: string;

  constructor(page: Page, url: string) {
    this.page = page;
    this.url = url;
  }

  async goto() {
    await this.page.goto(this.url);
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async screenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}
```

**LoginPage.ts:**
```typescript
import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page, '/login');
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: /login|sign in/i });
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async login(username: string, password: string) {
    await this.goto();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.waitForLoad();
  }

  async assertLoginSuccess() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async assertLoginError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }
}
```

### 1.5 Authentication Fixtures

**tests/e2e/fixtures/auth.fixture.ts:**
```typescript
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

type AuthFixtures = {
  loginPage: LoginPage;
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  authenticatedPage: async ({ page }, use) => {
    // Login as admin user
    const loginPage = new LoginPage(page);
    await loginPage.login('admin', 'admin123');
    await use(page);
    // Cleanup: logout after test
    await page.goto('/logout');
  },
});
```

### 1.6 Test Scenarios to Implement

**Priority 1 - Critical User Flows:**
1. **Authentication Flow**
   - Login with valid credentials
   - Login with invalid credentials
   - Logout
   - Password reset flow
   - Remember me functionality

2. **Product Management**
   - Create new product
   - Edit existing product
   - Delete product
   - Search products
   - Filter products by category
   - Product image upload

3. **Transaction (POS) Flow**
   - Add products to cart
   - Apply discount/promo
   - Process payment
   - Print receipt
   - Handle cash vs card payment

4. **Shift Management**
   - Open shift
   - Close shift
   - View shift summary
   - Handle shift adjustments

**Priority 2 - Important Features:**
5. **Customer Management**
   - Add new customer
   - Search customer
   - View customer history

6. **Reports & Analytics**
   - View sales report
   - Export report to PDF/Excel
   - Filter reports by date range

7. **Inventory Management**
   - Stock adjustment
   - Stock transfer
   - Low stock alerts

**Priority 3 - Advanced Features:**
8. **Multi-branch Operations**
   - Switch between branches
   - Branch-specific reports

9. **User & Role Management**
   - Create user
   - Assign roles
   - Set permissions

10. **Delivery Management**
    - Create delivery order
    - Assign driver
    - Track delivery

### 1.7 Example Test Cases

**Authentication Test:**
```typescript
import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ loginPage }) => {
    await loginPage.login('admin', 'admin123');
    await loginPage.assertLoginSuccess();
  });

  test('should show error with invalid credentials', async ({ loginPage }) => {
    await loginPage.login('admin', 'wrongpassword');
    await loginPage.assertLoginError('Invalid username or password');
  });

  test('should redirect to dashboard after login', async ({ loginPage }) => {
    await loginPage.login('admin', 'admin123');
    await expect(loginPage.page).toHaveURL('/dashboard');
  });
});
```

**Transaction Test:**
```typescript
import { test, expect } from '../../fixtures/auth.fixture';
import { TransaksiPage } from '../../pages/TransaksiPage';

test.describe('POS Transaction', () => {
  test('should complete a cash transaction', async ({ authenticatedPage }) => {
    const transaksiPage = new TransaksiPage(authenticatedPage);

    await transaksiPage.goto();
    await transaksiPage.addProduct('PROD-001', 2);
    await transaksiPage.assertCartTotal(50000);

    await transaksiPage.selectPaymentMethod('CASH');
    await transaksiPage.processPayment(50000);

    await transaksiPage.assertTransactionSuccess();
    await transaksiPage.assertReceiptGenerated();
  });

  test('should apply discount promo code', async ({ authenticatedPage }) => {
    const transaksiPage = new TransaksiPage(authenticatedPage);

    await transaksiPage.goto();
    await transaksiPage.addProduct('PROD-001', 1);
    await transaksiPage.applyPromoCode('DISC10');

    await transaksiPage.assertDiscountApplied(10);
    await transaksiPage.assertCartTotal(45000);
  });
});
```

---

## 2. K6 Performance Testing

### 2.1 Installation & Setup

**Install K6:**
```bash
# Download K6 binary for Windows
# https://grafana.com/docs/k6/set-up/install-k6/

# Or using package manager
choco install k6

# Verify installation
k6 version
```

**Install K6 Reporter:**
```bash
# Install for HTML reporting
k6 reporter install json k6-reporter
```

### 2.2 Directory Structure

```
server/
├── tests/
│   └── performance/
│       ├── scripts/           # K6 test scripts
│       │   ├── smoke-test.js
│       │   ├── load-test.js
│       │   ├── stress-test.js
│       │   ├── spike-test.js
│       │   └── soak-test.js
│       ├── scenarios/         # Reusable test scenarios
│       │   ├── auth.js
│       │   ├── products.js
│       │   ├── transaksi.js
│       │   └── reports.js
│       ├── data/              # Test data
│       │   ├── users.json
│       │   ├── products.json
│       │   └── transactions.json
│       ├── utils/             # Helper functions
│       │   ├── http.js
│       │   ├── metrics.js
│       │   └── helpers.js
│       └── outputs/           # Test results
│           ├── html/
│           └── json/
```

### 2.3 K6 Configuration

**k6.config.js:**
```javascript
module.exports = {
  // Base configuration for all tests
  baseURL: 'http://localhost:5173',

  // Test stages
  stages: {
    smoke: [
      { duration: '1m', target: 1 },
      { duration: '1m', target: 0 },
    ],
    load: [
      { duration: '2m', target: 10 },
      { duration: '5m', target: 10 },
      { duration: '2m', target: 0 },
    ],
    stress: [
      { duration: '1m', target: 50 },
      { duration: '3m', target: 100 },
      { duration: '1m', target: 0 },
    ],
    spike: [
      { duration: '1m', target: 10 },
      { duration: '1m', target: 1000 },
      { duration: '3m', target: 1000 },
      { duration: '1m', target: 10 },
      { duration: '1m', target: 0 },
    ],
    soak: [
      { duration: '10m', target: 10 },
      { duration: '50m', target: 50 },
      { duration: '10m', target: 10 },
      { duration: '10m', target: 0 },
    ],
  },

  // Thresholds
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.95'],
  },
};
```

### 2.4 Utility Functions

**tests/performance/utils/http.js:**
```javascript
import http from 'k6/http';
import { check } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';

export class HttpClient {
  constructor() {
    this.params = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };
  }

  post(url, data) {
    return http.post(`${BASE_URL}${url}`, JSON.stringify(data), this.params);
  }

  get(url) {
    return http.get(`${BASE_URL}${url}`, this.params);
  }

  put(url, data) {
    return http.put(`${BASE_URL}${url}`, JSON.stringify(data), this.params);
  }

  delete(url) {
    return http.del(`${BASE_URL}${url}`, this.params);
  }

  checkSuccess(response) {
    return check(response, {
      'status is 200': (r) => r.status === 200,
      'has data': (r) => r.json('data') !== undefined,
    });
  }
}
```

### 2.5 Test Scenarios

**tests/performance/scripts/smoke-test.js:**
```javascript
import { HttpClient } from '../utils/http.js';
import { check, group } from 'k6';

const http = new HttpClient();

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<200'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  group('Authentication', () => {
    const response = http.post('/api/auth/login', {
      username: 'admin',
      password: 'admin123',
    });

    check(response, {
      'login successful': (r) => r.status === 200,
    });
  });

  group('Get Products', () => {
    const response = http.get('/api/produk');

    check(response, {
      'products loaded': (r) => r.status === 200,
      'has products': (r) => {
        const data = r.json();
        return data.data && data.data.length > 0;
      },
    });
  });
}
```

**tests/performance/scripts/load-test.js:**
```javascript
import { HttpClient } from '../utils/http.js';
import { check, group, sleep } from 'k6';

const http = new HttpClient();
let authToken = '';

export const options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 10 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.95'],
  },
};

export default function () {
  group('Setup - Login', () => {
    if (!authToken) {
      const response = http.post('/api/auth/login', {
        username: 'admin',
        password: 'admin123',
      });

      check(response, { 'login successful': (r) => r.status === 200 });

      if (response.status === 200) {
        authToken = response.json('data.token');
        http.params.headers['Authorization'] = `Bearer ${authToken}`;
      }
    }
  });

  group('Products', () => {
    const response = http.get('/api/produk?page=1&limit=10');

    check(response, {
      'products loaded': (r) => r.status === 200,
    });

    sleep(1);
  });

  group('Create Transaction', () => {
    const response = http.post('/api/transaksi', {
      cabangId: 'cabang-1',
      items: [
        { produkId: 'prod-1', jumlah: 2 },
      ],
      paymentMethod: 'CASH',
    });

    check(response, {
      'transaction created': (r) => r.status === 201,
    });
  });

  sleep(2);
}
```

**tests/performance/scripts/stress-test.js:**
```javascript
import { HttpClient } from '../utils/http.js';
import { check, group } from 'k6';

const http = new HttpClient();

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.1'], // Allow 10% failure under stress
    checks: ['rate>0.90'],
  },
};

export default function () {
  group('Authentication', () => {
    const response = http.post('/api/auth/login', {
      username: `user${__VU}`,
      password: 'test123',
    });

    check(response, {
      'login successful': (r) => r.status === 200 || r.status === 401, // Allow auth failures
    });
  });

  group('Load Products', () => {
    const response = http.get('/api/produk');

    check(response, {
      'products loaded': (r) => r.status === 200,
    });
  });
}
```

### 2.6 Test Data Generation

**tests/performance/data/users.json:**
```json
{
  "users": [
    { "username": "admin", "password": "admin123", "role": "admin" },
    { "username": "cashier1", "password": "cashier123", "role": "cashier" },
    { "username": "cashier2", "password": "cashier123", "role": "cashier" }
  ]
}
```

**tests/performance/data/products.json:**
```json
{
  "products": [
    { "id": "prod-1", "nama": "Product 1", "harga": 25000 },
    { "id": "prod-2", "nama": "Product 2", "harga": 15000 },
    { "id": "prod-3", "nama": "Product 3", "harga": 50000 }
  ]
}
```

---

## 3. CI/CD Integration

### 3.1 GitHub Actions Workflow

**.github/workflows/e2e-tests.yml:**
```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    # Run every night at 2 AM UTC
    - cron: '0 2 * * *'

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest

    strategy:
      matrix:
        browser: [chromium, firefox]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        working-directory: ./server
        run: npm ci

      - name: Install Playwright Browsers
        working-directory: ./server
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        working-directory: ./server
        run: npx playwright test --project=${{ matrix.browser }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results-${{ matrix.browser }}
          path: server/playwright-report/
          retention-days: 30

      - name: Upload Playwright Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-html-report-${{ matrix.browser }}
          path: server/playwright-report/index.html
          retention-days: 30
```

### 3.2 Performance Tests Workflow

**.github/workflows/performance-tests.yml:**
```yaml
name: Performance Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    # Run every Sunday at 3 AM UTC
    - cron: '0 3 * * 0'
  workflow_dispatch:

jobs:
  k6-tests:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        test: [smoke, load, stress]

    steps:
      - uses: actions/checkout@v4

      - name: Setup K6
        run: |
          curl https://github.com/grafana/k6/releases/download/v0.52.0/k6-v0.52.0-linux-amd64.tar.gz -L | tar xvz
          sudo mv k6-v0.52.0-linux-amd64/k6 /usr/local/bin/
          k6 version

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        working-directory: ./server
        run: npm ci

      - name: Start application
        working-directory: ./server
        run: |
          npm run prisma:generate
          npm run seed &
          npm run dev &
          npx wait-on http://localhost:5173

      - name: Run K6 smoke test
        if: matrix.test == 'smoke'
        run: |
          cd server/tests/performance
          k6 run scripts/smoke-test.js --out json=outputs/smoke-test.json

      - name: Run K6 load test
        if: matrix.test == 'load'
        run: |
          cd server/tests/performance
          k6 run scripts/load-test.js --out json=outputs/load-test.json

      - name: Run K6 stress test
        if: matrix.test == 'stress'
        run: |
          cd server/tests/performance
          k6 run scripts/stress-test.js --out json=outputs/stress-test.json

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: k6-${{ matrix.test }}-results
          path: server/tests/performance/outputs/
```

---

## 4. Documentation & Training

### 4.1 Documentation Structure

Create the following documentation:

1. **TESTING.md** - Main testing guide
2. **docs/playwright-guide.md** - Playwright testing guide
3. **docs/k6-guide.md** - K6 performance testing guide
4. **docs/writing-e2e-tests.md** - Best practices for E2E tests
5. **docs/writing-performance-tests.md** - Best practices for performance tests

### 4.2 Training Materials

**Training Modules:**
1. Introduction to E2E Testing with Playwright
2. Page Object Model Pattern
3. Writing Maintainable Test Cases
4. Introduction to Performance Testing with K6
5. Analyzing Performance Test Results
6. Continuous Testing in CI/CD

---

## 5. Implementation Timeline

### Phase 1: Foundation (Week 1)
- [ ] Install Playwright and dependencies
- [ ] Set up Playwright configuration
- [ ] Create base page classes and fixtures
- [ ] Set up K6 installation and configuration
- [ ] Create K6 utility functions

### Phase 2: Critical Test Coverage (Week 2)
- [ ] Write authentication E2E tests
- [ ] Write product management E2E tests
- [ ] Write transaction/POS E2E tests
- [ ] Write shift management E2E tests
- [ ] Write K6 smoke and load tests

### Phase 3: Advanced Features (Week 3)
- [ ] Write customer management E2E tests
- [ ] Write reports E2E tests
- [ ] Write inventory management E2E tests
- [ ] Write K6 stress and spike tests
- [ ] Set up test data factories

### Phase 4: CI/CD Integration (Week 4)
- [ ] Set up GitHub Actions workflows
- [ ] Configure test reporting
- [ ] Set up performance monitoring
- [ ] Create testing documentation
- [ ] Team training sessions

---

## 6. Best Practices

### 6.1 Playwright Best Practices

1. **Use Page Object Model** - Encapsulate page logic in reusable classes
2. **Use Fixtures** - Share setup code across tests
3. **Wait for Elements Properly** - Use explicit waits over `sleep()`
4. **Use Data Attributes** - Use `data-testid` for stable selectors
5. **Keep Tests Independent** - Each test should be runnable independently
6. **Use Descriptive Test Names** - Make test failures easy to understand

### 6.2 K6 Best Practices

1. **Start Small** - Begin with smoke tests before complex load tests
2. **Use Realistic Scenarios** - Test actual user behavior patterns
3. **Set Appropriate Thresholds** - Based on business requirements
4. **Monitor System Resources** - CPU, memory, database connections
5. **Test in Staging** - Never run load tests against production
6. **Analyze Results** - Look beyond pass/fail, identify bottlenecks

### 6.3 Data Management

1. **Use Test Databases** - Never use production data
2. **Reset Data Between Tests** - Ensure test isolation
3. **Use Meaningful Test Data** - Realistic but obfuscated
4. **Clean Up After Tests** - Delete created resources
5. **Version Control Test Data** - Track changes to test scenarios

---

## 7. Success Metrics

### 7.1 E2E Test Metrics

- **Coverage**: 80% of critical user flows covered
- **Pass Rate**: >95% consistent pass rate in CI
- **Execution Time**: Full test suite < 30 minutes
- **Maintenance**: < 2 hours per week for test updates

### 7.2 Performance Test Metrics

- **Response Time**: p95 < 500ms, p99 < 1000ms
- **Throughput**: Handle 100 concurrent users
- **Error Rate**: < 1% under normal load
- **Resource Usage**: CPU < 70%, Memory < 80% under load

---

## 8. Next Steps

1. **Review and Approve** - Review this plan with the team
2. **Start Implementation** - Begin with Phase 1
3. **Regular Check-ins** - Weekly progress meetings
4. **Documentation** - Update documentation as we go
5. **Training** - Schedule team training sessions
6. **Iterate** - Refine tests based on feedback

---

## 9. References

- [Playwright Documentation](https://playwright.dev/)
- [K6 Documentation](https://grafana.com/docs/k6/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Page Object Model](https://www.selenium.dev/documentation/test-practices/page_object_models/)
