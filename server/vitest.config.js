import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true, // Berkenan menggunakan describe, it, expect tanpa import manual
    environment: 'node', // Testing environment khusus backend (tidak ada dom)
    globalSetup: ['./__tests__/globalSetup.js'],
    setupFiles: ['./__tests__/setupWorker.js'],
    include: ['__tests__/**/*.test.js'],
    testTimeout: 30000, 
    hookTimeout: 30000,
    fileParallelism: false, // We will use false because TRUNCATE runs concurrently
    sequence: {
      shuffle: false, 
      concurrent: false, 
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
      alias: {
        '@': path.resolve(__dirname, './src') // Jika proyek Anda menggunakan import alias emisalnya import { foo } from '@/services'
      }
  }
});
