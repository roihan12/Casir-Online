import fs from 'fs';
import path from 'path';

/**
 * Global setup for Playwright E2E tests
 *
 * This runs once before all tests:
 * - Create necessary directories
 * - Setup test data
 * - Configure environment
 */
async function globalSetup(config) {
  const { projects } = config;

  console.log('🎭 Playwright E2E Test Setup');
  console.log(`   Projects: ${projects.map(p => p.name).join(', ')}`);

  // Create necessary directories
  const dirs = [
    'tests/e2e/.auth',
    'tests/e2e/screenshots',
    'tests/e2e/traces',
    'tests/e2e/videos',
    'tests/e2e/downloads',
    'tests/performance/outputs',
  ];

  dirs.forEach(dir => {
    const fullPath = path.resolve(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`   ✓ Created directory: ${dir}`);
    }
  });

  // Add gitkeep to preserve empty directories
  const gitkeepDirs = [
    'tests/e2e/fixtures',
    'tests/e2e/pages',
    'tests/e2e/specs/auth',
    'tests/e2e/specs/produk',
    'tests/e2e/specs/transaksi',
    'tests/e2e/specs/shift',
    'tests/e2e/specs/reports',
    'tests/e2e/utils',
    'tests/performance/scripts',
    'tests/performance/scenarios',
    'tests/performance/data',
    'tests/performance/utils',
    'tests/utils',
  ];

  gitkeepDirs.forEach(dir => {
    const gitkeepPath = path.resolve(process.cwd(), dir, '.gitkeep');
    if (!fs.existsSync(path.dirname(gitkeepPath))) {
      fs.mkdirSync(path.dirname(gitkeepPath), { recursive: true });
    }
    if (!fs.existsSync(gitkeepPath)) {
      fs.writeFileSync(gitkeepPath, '# Preserve this directory in git\n');
    }
  });
}

export default globalSetup;
