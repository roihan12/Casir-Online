import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { getTestPrismaClient, clearTestDb } from '../utils/testDbManager';
import bcrypt from 'bcrypt';
import path from 'path';

// We'll dynamically import app after DATABASE_URL is set
let app;

// Use supertest agent to persist cookies between requests
let agent;

describe('Auth API Integration Tests', () => {
  let prisma;

  beforeAll(async () => {
    // Ambil koneksi Prisma yang sudah terhubung ke Testcontainers
    prisma = getTestPrismaClient();

    // Import app AFTER DATABASE_URL is set by setup.js
    // This ensures the app uses the test database
    const appModule = await import('../../src/app.js');
    app = appModule.default;

    // Create agent for cookie persistence
    agent = request.agent(app);
  });

  // Helper function untuk membuat test user dengan struktur schema yang benar
  const createTestUser = async (userData = {}) => {
    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const uniqueSuffix = Date.now();

    // 1. Create Cabang (required for UserRole)
    // Note: Cabang.id doesn't have @default(uuid()), so we need to provide it
    const cabang = await prisma.cabang.create({
      data: {
        id: `cabang-${uniqueSuffix}`, // Manual ID required (no @default in schema)
        namaCabang: 'Test Cabang',
        alamat: 'Jl. Test No. 123',
        telepon: '08123456789',
        status: 'aktif', // CabangStatus enum
      },
    });

    // 2. Create Role with unique name
    const role = await prisma.role.create({
      data: {
        namaRole: `KASIR-${uniqueSuffix}`, // Unique to avoid constraint violations
        deskripsi: 'Kasir Role Test',
        displayName: 'Kasir',
      },
    });

    // 3. Create User with unique username
    const user = await prisma.user.create({
      data: {
        namaLengkap: 'Test Kasir',
        username: `testkasir-${uniqueSuffix}`, // Unique username
        email: `kasir_test_${uniqueSuffix}@example.com`,
        password: hashedPassword,
        status: 'aktif', // ✅ FIX: UserStatus enum, not boolean isActive
      },
    });

    // 4. Create UserRole junction (required because User has many-to-many with Role)
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        cabangId: cabang.id,
      },
    });

    return { user, role, cabang, plainPassword: defaultPassword };
  };

  describe('POST /api/auth/login', () => {
    it('harus gagal jika kredensial salah', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'wronguser',
          password: 'wrongpassword',
        });

      // Sesuaikan dengan implementasi controller Anda (400 atau 401)
      expect([400, 401]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('harus gagal jika username tidak diberikan', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('harus gagal jika password tidak diberikan', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('harus gagal login dengan user nonaktif', async () => {
      const { user, plainPassword } = await createTestUser();

      // Set user status to nonaktif
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'nonaktif' },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: user.username,
          password: plainPassword,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('harus berhasil jika kredensial benar', async () => {
      const { user, plainPassword } = await createTestUser();

      const response = await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({
          username: user.username,
          password: plainPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Token is in the cookie, not in the response body
      expect(response.headers['set-cookie']).toBeDefined();

      // Check that auth_token cookie is set
      const authCookie = response.headers['set-cookie']?.find(cookie =>
        cookie.startsWith('auth_token=')
      );
      expect(authCookie).toBeDefined();

      expect(response.body.data.user).toMatchObject({
        id: user.id,
        username: user.username,
        namaLengkap: user.namaLengkap,
      });
      // Pastikan password tidak dikirim di response
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('harus mengembalikan data user dengan role yang benar', async () => {
      const { user, role, plainPassword } = await createTestUser();

      const response = await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({
          username: user.username,
          password: plainPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.user).toHaveProperty('roles');
      expect(Array.isArray(response.body.data.user.roles)).toBe(true);
    });

    it('harus gagal jika password salah', async () => {
      const { user } = await createTestUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: user.username,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('harus berhasil logout dengan token valid', async () => {
      const { user, plainPassword } = await createTestUser();

      // Login dulu untuk dapat token (disimpan di cookie oleh agent)
      const loginResponse = await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({
          username: user.username,
          password: plainPassword,
        });

      expect(loginResponse.status).toBe(200);

      // Logout using the same agent (cookies are persisted)
      const logoutResponse = await agent
        .post('/api/auth/logout');

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);
    });

    it('harus gagal logout tanpa session', async () => {
      // Use a fresh agent without cookies/session
      const freshAgent = request.agent(app);
      const response = await freshAgent.post('/api/auth/logout');

      // Logout requires authentication (middleware checks for valid session)
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
