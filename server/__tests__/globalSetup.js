import { startTestDb, stopTestDb } from './utils/testDbManager.js';

export async function setup() {
  console.log('[GlobalSetup] Memulai Testcontainers (hanya dijalankan sekali)...');
  const url = await startTestDb();
  process.env.DATABASE_URL = url; // Pass to workers
  return url;
}

export async function teardown() {
  console.log('[GlobalTeardown] Mematikan Testcontainers...');
  await stopTestDb();
}
