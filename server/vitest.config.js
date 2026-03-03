import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true, // Berkenan menggunakan describe, it, expect tanpa import manual
    environment: 'node', // Testing environment khusus backend (tidak ada dom)
    setupFiles: ['./__tests__/setup.js'], // Script ini yang akan run container DB
    include: ['__tests__/**/*.test.js'], // Membaca spec di folder ini saja
    testTimeout: 120000, // Timeout tinggi untuk instal docker container jika node belum siap
    hookTimeout: 120000,
    fileParallelism: false, // Penting! Jangan jalankan file .test secara pararel jika menggunakan 1 test container yang sama untuk hindari racewar
    sequence: {
      shuffle: false, // Don't shuffle tests
      concurrent: false, // Run tests sequentially
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
