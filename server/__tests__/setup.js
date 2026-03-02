import { beforeAll, afterAll } from 'vitest';
import path from 'path';
import dotenv from 'dotenv';
import { startTestDb, stopTestDb } from './utils/testDbManager';

// Muat variabel lingkungan khusus testing jika ada (opsional)
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

let appPrismaModule;

beforeAll(async () => {
  // Jalankan database di container sebelum semua test suite dimulai
  console.log('Menyiapkan Environment Testing...');
  await startTestDb();
}, 120000); // Waktu di perpanjang ke 120 detik, pull image postgres bisa memakan waktu pertama kali

afterAll(async () => {
  // Disconnect the app's Prisma client before stopping the database
  // This prevents "terminating connection due to administrator command" errors
  try {
    // Clear the module cache for config/db to force reload on next test run
    const dbConfigPath = path.resolve(__dirname, '../src/config/db.js');
    delete require.cache[require.resolve(dbConfigPath)];

    // Also clear app and any controllers/services that imported db
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

  // Matikan container setelah semua test suite selesai
  console.log('Membersihkan Environment Testing...');
  await stopTestDb();
});
