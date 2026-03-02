import { beforeAll, beforeEach, afterAll } from 'vitest';
import { getTestPrismaClient, clearTestDb } from '../utils/testDbManager';

let prisma;

/**
 * Setup database for tests
 * Call this in your test file to use the test database
 * @returns {{ prisma: import('@prisma/client').PrismaClient }}
 */
export const useTestDatabase = () => {
  beforeAll(async () => {
    prisma = getTestPrismaClient();
  });

  // Clean database before each test for isolation
  beforeEach(async () => {
    await clearTestDb();
  });

  // Optional: Clean after all tests
  afterAll(async () => {
    await clearTestDb();
  });

  return { prisma };
};

/**
 * Get the prisma client instance
 * @returns {import('@prisma/client').PrismaClient}
 * @throws {Error} if prisma client is not initialized
 */
export const getPrisma = () => {
  if (!prisma) {
    throw new Error(
      'Prisma client not initialized. Make sure useTestDatabase() is called before using getPrisma().'
    );
  }
  return prisma;
};

/**
 * Clean database between tests
 * Useful for manual cleanup in specific scenarios
 */
export const cleanDatabase = async () => {
  await clearTestDb();
};
