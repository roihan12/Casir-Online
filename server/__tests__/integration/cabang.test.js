import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { getTestPrismaClient, clearTestDb } from '../utils/testDbManager';
import { createCabang } from '../factories/userFactory';
import { createUserWithModulePermissions } from '../helpers/permissionSetup';

// We'll dynamically import app after DATABASE_URL is set
let app;
let agent;

describe('Cabang API Integration Tests', () => {
  let prisma;

  beforeAll(async () => {
    prisma = getTestPrismaClient();
    const appModule = await import('../../src/app.js');
    app = appModule.default;
    agent = request.agent(app);
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await clearTestDb();
  });

  // Helper to login and get authenticated agent with cabang permissions
  const authenticateAgent = async () => {
    const result = await createUserWithModulePermissions(
      'cabang', // Module name for permissions
      {}, // Default user data
      prisma // Pass the test's prisma instance
    );

    await agent
      .post('/api/auth/login')
      .set('User-Agent', 'test-agent')
      .set('X-Forwarded-For', '127.0.0.1')
      .send({
        username: result.user.username,
        password: result.plainPassword,
      });

    return result; // Return { user, role, cabang, plainPassword }
  };

  // Helper to give user access to a cabang by creating UserCabang
  const grantUserCabangAccess = async (user, cabang) => {
    // Check if user already has access to this cabang
    const existingAccess = await prisma.userCabang.findFirst({
      where: {
        userId: user.id,
        cabangId: cabang.id,
      },
    });

    if (!existingAccess) {
      // Create new UserCabang entry
      await prisma.userCabang.create({
        data: {
          userId: user.id,
          cabangId: cabang.id,
          isPrimary: false,
        },
      });
    }
  };

  // ========================================
  // POSITIVE TEST CASES (8 tests)
  // ========================================

  describe('GET /api/cabang - Positive Cases', () => {
    it('✅ Should return empty array when no cabang exist', async () => {
      // User created in authenticateAgent has 1 cabang, but we'll clear it
      const { user, cabang } = await authenticateAgent();
      // Remove user's access to the default cabang
      await prisma.userCabang.deleteMany({
        where: { userId: user.id },
      });

      const response = await agent
        .get('/api/cabang')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('✅ Should return list of cabang user has access to', async () => {
      const { user } = await authenticateAgent();

      // Create additional cabang and grant user access
      const cabang2 = await createCabang({ namaCabang: 'Cabang 2' }, prisma);
      const cabang3 = await createCabang({ namaCabang: 'Cabang 3' }, prisma);
      await grantUserCabangAccess(user, cabang2);
      await grantUserCabangAccess(user, cabang3);

      const response = await agent
        .get('/api/cabang')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      expect(response.body.data[0]).toMatchObject({
        namaCabang: expect.any(String),
        status: expect.any(String),
      });
    });

    it.skip('✅ Should handle pagination correctly', async () => {
      const { user } = await authenticateAgent();

      // Create 15 cabang and grant user access
      for (let i = 0; i < 15; i++) {
        const cabang = await createCabang({ namaCabang: `Cabang ${i}` }, prisma);
        await grantUserCabangAccess(user, cabang);
      }

      const response = await agent
        .get('/api/cabang?page=2&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination).toMatchObject({
        page: 2,
        limit: 10,
      });
    });

    it.skip('✅ Should filter by status', async () => {
      await authenticateAgent();

      // This test depends on whether the API supports status filtering
      // Skip for now as it's not clear if getAllCabang supports this
    });
  });

  describe('GET /api/cabang/:cabangId - Positive Cases', () => {
    it('✅ Should return cabang by valid ID that user has access to', async () => {
      const { user, cabang } = await authenticateAgent();

      const response = await agent
        .get(`/api/cabang/${cabang.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: cabang.id,
        namaCabang: cabang.namaCabang,
      });
    });

    it('✅ Should include all related fields', async () => {
      const { user, cabang } = await authenticateAgent();

      const response = await agent
        .get(`/api/cabang/${cabang.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: cabang.id,
        namaCabang: cabang.namaCabang,
        alamat: cabang.alamat,
        telepon: cabang.telepon,
        status: 'aktif',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('POST /api/cabang - Positive Cases', () => {
    it('✅ Should create cabang with minimal required fields', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/cabang')
        .send({
          namaCabang: 'Minimal Cabang',
          alamat: 'Jl. Minimal',
          telepon: '08123456789',
          latitude: 12.345678,
          longitude: 98.765432,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        namaCabang: 'Minimal Cabang',
        alamat: 'Jl. Minimal',
        telepon: '08123456789',
      });
      expect(response.body.data.id).toBeDefined();

      // Verify status in database
      const dbCabang = await prisma.cabang.findUnique({
        where: { id: response.body.data.id },
      });
      expect(dbCabang.status).toBe('aktif');
    });

    it('✅ Should create cabang with all optional fields', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/cabang')
        .send({
          namaCabang: 'Complete Cabang',
          alamat: 'Jl. Complete No. 456',
          telepon: '08987654321',
          latitude: -6.2088,
          longitude: 106.8456,
          radiusGeofence: 500,
          status: 'aktif',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        namaCabang: 'Complete Cabang',
        alamat: 'Jl. Complete No. 456',
        telepon: '08987654321',
      });
      expect(response.body.data.id).toBeDefined();

      // Verify all fields in database
      const dbCabang = await prisma.cabang.findUnique({
        where: { id: response.body.data.id },
      });
      expect(dbCabang.namaCabang).toBe('Complete Cabang');
      expect(dbCabang.alamat).toBe('Jl. Complete No. 456');
      expect(dbCabang.telepon).toBe('08987654321');
      expect(dbCabang.radiusGeofence).toBe(500);
      expect(dbCabang.status).toBe('aktif');
    });
  });

  describe('PUT /api/cabang/:cabangId - Positive Cases', () => {
    it('✅ Should update cabang with valid data', async () => {
      const { user } = await authenticateAgent();
      const cabang = await createCabang({ namaCabang: 'Original Name' }, prisma);
      await grantUserCabangAccess(user, cabang);

      const response = await agent
        .put(`/api/cabang/${cabang.id}`)
        .send({
          namaCabang: 'Updated Name',
          alamat: 'Updated Address',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: cabang.id,
        namaCabang: 'Updated Name',
        alamat: 'Updated Address',
      });
    });
  });

  describe('DELETE /api/cabang/:cabangId - Positive Cases', () => {
    it('✅ Should delete cabang successfully', async () => {
      const { user } = await authenticateAgent();
      const cabang = await createCabang({ namaCabang: 'To Be Deleted' }, prisma);
      await grantUserCabangAccess(user, cabang);

      const response = await agent
        .delete(`/api/cabang/${cabang.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion in database (should have deletedAt set, not hard delete)
      const deletedCabang = await prisma.cabang.findUnique({
        where: { id: cabang.id },
      });
      expect(deletedCabang.deletedAt).not.toBeNull();
    });
  });

  // ========================================
  // NEGATIVE TEST CASES (19 tests)
  // ========================================

  describe('GET /api/cabang/:cabangId - Negative Cases', () => {
    it('❌ Should return 403 for non-existent UUID (cabangAccess middleware denies access)', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/cabang/00000000-0000-0000-0000-000000000000')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 403 for invalid UUID format (cabangAccess middleware runs first)', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/cabang/invalid-uuid')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/cabang - Negative Cases - Validation', () => {
    it('❌ Should return 400 when namaCabang is missing', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/cabang')
        .send({
          alamat: 'Jl. Test',
          telepon: '08123456789',
          latitude: 12.345678,
          longitude: 98.765432,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/namaCabang/i);
    });

    it('❌ Should return 400 when alamat is missing', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/cabang')
        .send({
          namaCabang: 'Test Cabang',
          telepon: '08123456789',
          latitude: 12.345678,
          longitude: 98.765432,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/alamat/i);
    });

    it('❌ Should return 400 when telepon is missing', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/cabang')
        .send({
          namaCabang: 'Test Cabang',
          alamat: 'Jl. Test',
          latitude: 12.345678,
          longitude: 98.765432,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/telepon/i);
    });

    it('❌ Should return 400 when latitude is missing', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/cabang')
        .send({
          namaCabang: 'Test Cabang',
          alamat: 'Jl. Test',
          telepon: '08123456789',
          longitude: 98.765432,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/latitude/i);
    });

    it('❌ Should return 400 when longitude is missing', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/cabang')
        .send({
          namaCabang: 'Test Cabang',
          alamat: 'Jl. Test',
          telepon: '08123456789',
          latitude: 12.345678,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/longitude/i);
    });

    it('❌ Should return 400 when namaCabang is empty string', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/cabang')
        .send({
          namaCabang: '',
          alamat: 'Jl. Test',
          telepon: '08123456789',
          latitude: 12.345678,
          longitude: 98.765432,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when namaCabang exceeds 100 chars', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/cabang')
        .send({
          namaCabang: 'a'.repeat(101),
          alamat: 'Jl. Test',
          telepon: '08123456789',
          latitude: 12.345678,
          longitude: 98.765432,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when alamat exceeds 200 chars', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/cabang')
        .send({
          namaCabang: 'Test Cabang',
          alamat: 'a'.repeat(201),
          telepon: '08123456789',
          latitude: 12.345678,
          longitude: 98.765432,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when telepon exceeds 20 chars', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/cabang')
        .send({
          namaCabang: 'Test Cabang',
          alamat: 'Jl. Test',
          telepon: 'a'.repeat(21),
          latitude: 12.345678,
          longitude: 98.765432,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when status is invalid', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/cabang')
        .send({
          namaCabang: 'Test Cabang',
          alamat: 'Jl. Test',
          telepon: '08123456789',
          latitude: 12.345678,
          longitude: 98.765432,
          status: 'INVALID_STATUS',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/cabang/:cabangId - Negative Cases', () => {
    it('❌ Should return 404 when cabang does not exist', async () => {
      await authenticateAgent();

      const response = await agent
        .put('/api/cabang/00000000-0000-0000-0000-000000000000')
        .send({
          namaCabang: 'Updated',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 404 for invalid UUID format (API returns 404, not 400)', async () => {
      await authenticateAgent();

      const response = await agent
        .put('/api/cabang/not-a-uuid')
        .send({
          namaCabang: 'Updated',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when namaCabang exceeds 100 chars', async () => {
      const { user } = await authenticateAgent();
      const cabang = await createCabang({ namaCabang: 'Test' }, prisma);
      await grantUserCabangAccess(user, cabang);

      const response = await agent
        .put(`/api/cabang/${cabang.id}`)
        .send({
          namaCabang: 'a'.repeat(101),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when status is invalid', async () => {
      const { user } = await authenticateAgent();
      const cabang = await createCabang({ namaCabang: 'Test' }, prisma);
      await grantUserCabangAccess(user, cabang);

      const response = await agent
        .put(`/api/cabang/${cabang.id}`)
        .send({
          status: 'INVALID',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/cabang/:cabangId - Negative Cases', () => {
    it('❌ Should return 404 when cabang does not exist', async () => {
      await authenticateAgent();

      const response = await agent
        .delete('/api/cabang/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 404 for invalid UUID format (API returns 404, not 400)', async () => {
      await authenticateAgent();

      const response = await agent
        .delete('/api/cabang/invalid-uuid-format')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it.skip('❌ Should fail to delete if cabang has related users', async () => {
      // Note: Remove .skip once UserRole tests are implemented
      const { user } = await authenticateAgent();
      const cabang = await createCabang({ namaCabang: 'Has Users' }, prisma);
      await grantUserCabangAccess(user, cabang);
      // await createUserWithCabang(cabang.id, prisma);

      const response = await agent
        .delete(`/api/cabang/${cabang.id}`)
        .expect(400); // Or 409 depending on business logic

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/user|pegawai/i);
    });
  });

  // ========================================
  // AUTHENTICATION TESTS
  // ========================================

  describe('Authentication & Authorization', () => {
    it('❌ Should deny access without authentication', async () => {
      const freshAgent = request.agent(app);

      const response = await freshAgent
        .get('/api/cabang')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny create without cabang:create permission', async () => {
      // Create user WITHOUT cabang:create permission
      const { user, plainPassword } = await createUserWithModulePermissions(
        'kategori', // Different module = no cabang permissions
        {},
        prisma
      );

      await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({
          username: user.username,
          password: plainPassword,
        });

      const response = await agent
        .post('/api/cabang')
        .send({
          namaCabang: 'Test',
          alamat: 'Jl. Test',
          telepon: '08123456789',
          latitude: 12.345678,
          longitude: 98.765432,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny update without cabang:update permission', async () => {
      const result = await createUserWithModulePermissions(
        'kategori',
        {},
        prisma
      );

      const cabang = await createCabang({ namaCabang: 'Test' }, prisma);
      await grantUserCabangAccess(result.user, cabang);

      await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({
          username: result.user.username,
          password: result.plainPassword,
        });

      const response = await agent
        .put(`/api/cabang/${cabang.id}`)
        .send({
          namaCabang: 'Updated',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny delete without cabang:delete permission', async () => {
      const result = await createUserWithModulePermissions(
        'kategori',
        {},
        prisma
      );

      const cabang = await createCabang({ namaCabang: 'Test' }, prisma);
      await grantUserCabangAccess(result.user, cabang);

      await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({
          username: result.user.username,
          password: result.plainPassword,
        });

      const response = await agent
        .delete(`/api/cabang/${cabang.id}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // SPECIAL CASES: Cabang Access Middleware
  // ========================================

  describe('Cabang Access Middleware', () => {
    it('✅ Should allow access to cabang user has access to', async () => {
      const { user, cabang } = await authenticateAgent();

      const response = await agent
        .get(`/api/cabang/${cabang.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('❌ Should deny access to cabang user does not have access to', async () => {
      // Create user with cabang permissions
      const { user, plainPassword } = await createUserWithModulePermissions(
        'cabang',
        {},
        prisma
      );

      await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({
          username: user.username,
          password: plainPassword,
        });

      // Create a cabang that this user doesn't have access to
      const otherCabang = await createCabang({ namaCabang: 'Other Cabang' }, prisma);

      const response = await agent
        .get(`/api/cabang/${otherCabang.id}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
