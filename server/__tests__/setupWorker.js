import { beforeAll, afterAll } from 'vitest';
import path from 'path';
import dotenv from 'dotenv';
import { connectWorkerDb, disconnectWorkerDb } from './utils/testDbManager';

// Muat variabel lingkungan khusus testing jika ada (opsional)
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

beforeAll(async () => {
  // Disable Redis caching in tests
  process.env.REDIS_ENABLED = 'false';
  process.env.NODE_ENV = 'test';

  // Fallback if env variable wasn't passed (safety check)
  if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL tidak ditemukan di worker, test mungkin gagal');
  } else {
      process.env.DIRECT_URL = process.env.DATABASE_URL;
  }

  // Connect prisma client for this worker
  await connectWorkerDb();
});

afterAll(async () => {
  // Disconnect the app's Prisma client
  try {
    const dbConfigPath = path.resolve(__dirname, '../src/config/db.js');
    delete require.cache[require.resolve(dbConfigPath)];

    const modulesToClear = [
      '../src/app.js',
      '../src/controllers/authController.js',
      '../src/services/authService.js',
    ];

    modulesToClear.forEach((mod) => {
      const modPath = path.resolve(__dirname, mod);
      if (require.cache[require.resolve(modPath)]) {
        delete require.cache[require.resolve(modPath)];
      }
    });
  } catch (error) {
    console.warn('Warning clearing module cache:', error.message);
  }

  await disconnectWorkerDb();
});
