import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execPromise = util.promisify(exec);
let prismaClient;
let container;
let databaseUrl;

export const startTestDb = async () => {
  try {
    const isWindows = process.platform === 'win32';
    container = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('casir_test')
      .withUsername('testuser')
      .withPassword('testpass')
      .start();

    databaseUrl = container.getConnectionUri();
    console.log(`[Testcontainers] PostgreSQL berjalan di: ${databaseUrl}`);

    // ✅ Enable extensions sebelum prisma db push
    const client = new pg.Client({ connectionString: databaseUrl });
    try {
      await client.connect();

      // Create extensions schema if it doesn't exist
      await client.query('CREATE SCHEMA IF NOT EXISTS extensions;');

      // Create uuid-ossp in extensions schema (avoid duplicate error with IF NOT EXISTS)
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;');
      } catch (err) {
        // Ignore if extension already exists in public schema
        if (!err.message.includes('already exists')) {
          console.warn('[Testcontainers] Warning creating uuid-ossp extension:', err.message);
        }
      }

      // Create pgcrypto extension
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
      } catch (err) {
        if (!err.message.includes('already exists')) {
          console.warn('[Testcontainers] Warning creating pgcrypto extension:', err.message);
        }
      }

      console.log('[Testcontainers] Extensions berhasil diaktifkan.');
    } finally {
      await client.end();
    }

    // Set DATABASE_URL for both test and app Prisma clients
    process.env.DATABASE_URL = databaseUrl;
    process.env.DIRECT_URL = databaseUrl;

    const { PrismaClient } = await import('@prisma/client');

    // Create test Prisma client with connection pooling settings
    prismaClient = new PrismaClient({
      datasourceUrl: databaseUrl,
      log: ['error', 'warn'],
    });

    // Test connection
    await prismaClient.$connect();
    console.log('[Testcontainers] Test Prisma Client connected.');

    console.log('[Testcontainers] Menerapkan skema database (Prisma db push)...');
    const prismaSchemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
    const env = { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: databaseUrl };

    await execPromise(`npx prisma@6 db push --schema="${prismaSchemaPath}"`, { env });

    console.log('[Testcontainers] Database test siap digunakan!');
  } catch (error) {
    console.error('[Testcontainers] Gagal memulai database testing:', error);
    throw error;
  }
};

export const stopTestDb = async () => {
  // Disconnect test Prisma client
  if (prismaClient) {
    try {
      await prismaClient.$disconnect();
      console.log('[Testcontainers] Test Prisma Client disconnected.');
    } catch (error) {
      console.error('[Testcontainers] Error disconnecting Prisma:', error.message);
    }
  }

  // Stop container (only if not in reuse mode)
  if (container) {
    try {
      await container.stop();
      console.log('[Testcontainers] Container PostgreSQL dimatikan.');
    } catch (error) {
      console.error('[Testcontainers] Error stopping container:', error.message);
    }
  }
};

export const clearTestDb = async () => {
  if (!prismaClient) {
    throw new Error('Test Prisma Client not initialized');
  }

  try {
    // Get all tables except migrations
    const tablenames = await prismaClient.$queryRaw`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname='public'
      AND tablename != '_prisma_migrations'
    `;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .map((name) => `"public"."${name}"`)
      .join(', ');

    if (tables) {
      await prismaClient.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    }

    // Reset sequences
    await prismaClient.$executeRawUnsafe(`
      DO $$
      DECLARE
        seq_record RECORD;
      BEGIN
        FOR seq_record IN
          SELECT sequence_name
          FROM information_schema.sequences
          WHERE sequence_schema = 'public'
        LOOP
          EXECUTE 'ALTER SEQUENCE ' || quote_ident(seq_record.sequence_name) || ' RESTART WITH 1';
        END LOOP;
      END $$;
    `);
  } catch (error) {
    console.error('[Testcontainers] Error clearing database:', error);
    throw error;
  }
};

export const getTestPrismaClient = () => {
  if (!prismaClient) {
    throw new Error('Test Prisma Client belum diinisialisasi. Pastikan startTestDb dipanggil.');
  }

  // Verify connection is still alive
  prismaClient.$queryRaw`SELECT 1`.catch((err) => {
    throw new Error('Database connection lost:', err);
  });

  return prismaClient;
};

export const getDatabaseUrl = () => {
  if (!databaseUrl) {
    throw new Error('Database URL not available. Start test database first.');
  }
  return databaseUrl;
};