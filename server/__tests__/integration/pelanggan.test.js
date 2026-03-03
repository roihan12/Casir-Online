import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { getTestPrismaClient, clearTestDb } from '../utils/testDbManager';
import { createPelanggan, createCabang } from '../factories/userFactory';
import { createUserWithModulePermissions } from '../helpers/permissionSetup';

// We'll dynamically import app after DATABASE_URL is set
let app;
let agent;

describe('Pelanggan API Integration Tests', () => {
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

  // Helper to login and get authenticated agent with pelanggan permissions
  const authenticateAgent = async () => {
    const result = await createUserWithModulePermissions(
      'pelanggan', // Module name for permissions
      {},
      prisma
    );

    await agent
      .post('/api/auth/login')
      .set('User-Agent', 'test-agent')
      .set('X-Forwarded-For', '127.0.0.1')
      .send({
        username: result.user.username,
        password: result.plainPassword,
      });

    return result;
  };

  // ========================================
  // POSITIVE TEST CASES (8 tests)
  // ========================================

  describe('GET /api/pelanggan - Positive Cases', () => {
    it('✅ Should return empty array when no pelanggan exist', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/pelanggan')
        .expect(200);

      expect(response.body.success).toBe(true);
      // API returns pagination object with data array
      expect(response.body.data.data || response.body.data).toEqual([]);
    });

    it('✅ Should return list of all pelanggan', async () => {
      await authenticateAgent();

      await createPelanggan({ namaPelanggan: 'Customer 1' }, prisma);
      await createPelanggan({ namaPelanggan: 'Customer 2' }, prisma);
      await createPelanggan({ namaPelanggan: 'Customer 3' }, prisma);

      const response = await agent
        .get('/api/pelanggan')
        .expect(200);

      expect(response.body.success).toBe(true);
      // API returns pagination object with data array
      const data = response.body.data.data || response.body.data;
      expect(data).toHaveLength(3);
      expect(data[0]).toMatchObject({
        namaPelanggan: expect.any(String),
        status: expect.any(String),
      });
    });

    it.skip('✅ Should handle pagination correctly', async () => {
      await authenticateAgent();

      // Create 15 pelanggan
      for (let i = 0; i < 15; i++) {
        await createPelanggan({ namaPelanggan: `Customer ${i}` }, prisma);
      }

      const response = await agent
        .get('/api/pelanggan?limit=10&page=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
    });
  });

  describe('GET /api/pelanggan/:id - Positive Cases', () => {
    it('✅ Should return pelanggan by valid ID', async () => {
      await authenticateAgent();
      const pelanggan = await createPelanggan({ namaPelanggan: 'Test Customer' }, prisma);

      const response = await agent
        .get(`/api/pelanggan/${pelanggan.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: pelanggan.id,
        namaPelanggan: 'Test Customer',
      });
    });

    it('✅ Should include all related fields', async () => {
      await authenticateAgent();
      const pelanggan = await createPelanggan({
        namaPelanggan: 'Full Customer',
        alamat: 'Jl. Test No. 123',
        telepon: '08123456789',
        email: 'customer@example.com',
        gender: 'pria',
        status: 'aktif',
      }, prisma);

      const response = await agent
        .get(`/api/pelanggan/${pelanggan.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: pelanggan.id,
        namaPelanggan: 'Full Customer',
        alamat: 'Jl. Test No. 123',
        telepon: '08123456789',
        email: 'customer@example.com',
        gender: 'pria',
        status: 'aktif',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('POST /api/pelanggan - Positive Cases', () => {
    it('✅ Should create pelanggan with minimal required fields', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/pelanggan')
        .send({
          cabang_id: cabang.id,
          namaPelanggan: 'Minimal Customer',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        namaPelanggan: 'Minimal Customer',
        cabang_id: cabang.id,
      });
      expect(response.body.data.id).toBeDefined();

      // Verify status in database
      const dbPelanggan = await prisma.pelanggan.findUnique({
        where: { id: response.body.data.id },
      });
      expect(dbPelanggan.status).toBe('aktif');
    });

    it('✅ Should create pelanggan with all optional fields', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/pelanggan')
        .send({
          cabang_id: cabang.id,
          namaPelanggan: 'Complete Customer',
          alamat: 'Jl. Complete No. 456',
          telepon: '08987654321',
          email: 'complete@example.com',
          tanggalLahir: '1990-01-01',
          gender: 'wanita',
          poin: 100,
          segmen: 'vip',
          status: 'aktif',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        namaPelanggan: 'Complete Customer',
        cabang_id: cabang.id,
      });
      expect(response.body.data.id).toBeDefined();

      // Verify all fields in database
      const dbPelanggan = await prisma.pelanggan.findUnique({
        where: { id: response.body.data.id },
      });
      expect(dbPelanggan.namaPelanggan).toBe('Complete Customer');
      expect(dbPelanggan.alamat).toBe('Jl. Complete No. 456');
      expect(dbPelanggan.gender).toBe('wanita');
      expect(dbPelanggan.segmen).toBe('vip');
    });
  });

  describe('PUT /api/pelanggan/:id - Positive Cases', () => {
    it('✅ Should update pelanggan with valid data', async () => {
      await authenticateAgent();
      const pelanggan = await createPelanggan({ namaPelanggan: 'Original Name' }, prisma);

      const response = await agent
        .put(`/api/pelanggan/${pelanggan.id}`)
        .send({
          namaPelanggan: 'Updated Name',
          telepon: '0000000000',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: pelanggan.id,
        namaPelanggan: 'Updated Name',
        telepon: '0000000000',
      });
    });
  });

  describe('DELETE /api/pelanggan/:id - Positive Cases', () => {
    it('✅ Should delete pelanggan successfully', async () => {
      await authenticateAgent();
      const pelanggan = await createPelanggan({ namaPelanggan: 'To Be Deleted' }, prisma);

      const response = await agent
        .delete(`/api/pelanggan/${pelanggan.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion in database (hard delete - returns null)
      const deletedPelanggan = await prisma.pelanggan.findUnique({
        where: { id: pelanggan.id },
      });
      expect(deletedPelanggan).toBeNull();
    });
  });

  // ========================================
  // NEGATIVE TEST CASES (19 tests)
  // ========================================

  describe('GET /api/pelanggan/:id - Negative Cases', () => {
    it('❌ Should return 404 for non-existent UUID', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/pelanggan/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 404 for invalid UUID format (API returns 404, not 400)', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/pelanggan/invalid-uuid')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/pelanggan - Negative Cases - Validation', () => {
    it('❌ Should return 400 when namaPelanggan is missing', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/pelanggan')
        .send({
          cabang_id: cabang.id,
          telepon: '08123456789',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeTruthy();
    });

    it('❌ Should return 400 when cabang_id is missing', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/pelanggan')
        .send({
          namaPelanggan: 'Test Customer',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeTruthy();
    });

    it('❌ Should return 400 when namaPelanggan is empty string', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/pelanggan')
        .send({
          cabang_id: cabang.id,
          namaPelanggan: '',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when namaPelanggan exceeds 100 chars', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/pelanggan')
        .send({
          cabang_id: cabang.id,
          namaPelanggan: 'a'.repeat(101),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when telepon exceeds 20 chars', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/pelanggan')
        .send({
          cabang_id: cabang.id,
          namaPelanggan: 'Test Customer',
          telepon: 'a'.repeat(21),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when email format is invalid', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/pelanggan')
        .send({
          cabang_id: cabang.id,
          namaPelanggan: 'Test Customer',
          email: 'invalid-email-format',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when email exceeds 100 chars', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/pelanggan')
        .send({
          cabang_id: cabang.id,
          namaPelanggan: 'Test Customer',
          email: 'a'.repeat(101) + '@example.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when gender is invalid', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/pelanggan')
        .send({
          cabang_id: cabang.id,
          namaPelanggan: 'Test Customer',
          gender: 'INVALID',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when segmen is invalid', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/pelanggan')
        .send({
          cabang_id: cabang.id,
          namaPelanggan: 'Test Customer',
          segmen: 'INVALID',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when status is invalid', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/pelanggan')
        .send({
          cabang_id: cabang.id,
          namaPelanggan: 'Test Customer',
          status: 'INVALID',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 404 when cabang_id does not exist', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/pelanggan')
        .send({
          cabang_id: '00000000-0000-0000-0000-000000000000',
          namaPelanggan: 'Test Customer',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/pelanggan - Negative Cases - Business Logic', () => {
    it('❌ Should handle special characters (backend stores as-is)', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/pelanggan')
        .send({
          cabang_id: cabang.id,
          namaPelanggan: '<script>alert("xss")</script>',
          alamat: '"><img src=x onerror=alert(1)>',
        })
        .expect(201);

      // Backend should accept and store special characters
      // Frontend is responsible for escaping when rendering
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/pelanggan/:id - Negative Cases', () => {
    it('❌ Should return 404 when pelanggan does not exist', async () => {
      await authenticateAgent();

      const response = await agent
        .put('/api/pelanggan/00000000-0000-0000-0000-000000000000')
        .send({
          namaPelanggan: 'Updated',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 404 for invalid UUID format (API returns 404, not 400)', async () => {
      await authenticateAgent();

      const response = await agent
        .put('/api/pelanggan/not-a-uuid')
        .send({
          namaPelanggan: 'Updated',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when namaPelanggan exceeds 100 chars', async () => {
      await authenticateAgent();
      const pelanggan = await createPelanggan({ namaPelanggan: 'Test' }, prisma);

      const response = await agent
        .put(`/api/pelanggan/${pelanggan.id}`)
        .send({
          namaPelanggan: 'a'.repeat(101),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when email format is invalid', async () => {
      await authenticateAgent();
      const pelanggan = await createPelanggan({ namaPelanggan: 'Test' }, prisma);

      const response = await agent
        .put(`/api/pelanggan/${pelanggan.id}`)
        .send({
          email: 'not-an-email',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when gender is invalid', async () => {
      await authenticateAgent();
      const pelanggan = await createPelanggan({ namaPelanggan: 'Test' }, prisma);

      const response = await agent
        .put(`/api/pelanggan/${pelanggan.id}`)
        .send({
          gender: 'INVALID',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when segmen is invalid', async () => {
      await authenticateAgent();
      const pelanggan = await createPelanggan({ namaPelanggan: 'Test' }, prisma);

      const response = await agent
        .put(`/api/pelanggan/${pelanggan.id}`)
        .send({
          segmen: 'INVALID',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when status is invalid', async () => {
      await authenticateAgent();
      const pelanggan = await createPelanggan({ namaPelanggan: 'Test' }, prisma);

      const response = await agent
        .put(`/api/pelanggan/${pelanggan.id}`)
        .send({
          status: 'INVALID',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('✅ Should be idempotent (same data should not error)', async () => {
      await authenticateAgent();
      const pelanggan = await createPelanggan({
        namaPelanggan: 'Original',
        telepon: '08123456789',
      }, prisma);

      // Update with the same data
      const response = await agent
        .put(`/api/pelanggan/${pelanggan.id}`)
        .send({
          namaPelanggan: 'Original',
          telepon: '08123456789',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/pelanggan/:id - Negative Cases', () => {
    it('❌ Should return 404 when pelanggan does not exist', async () => {
      await authenticateAgent();

      const response = await agent
        .delete('/api/pelanggan/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 404 for invalid UUID format (API returns 404, not 400)', async () => {
      await authenticateAgent();

      const response = await agent
        .delete('/api/pelanggan/invalid-uuid-format')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it.skip('❌ Should fail to delete if pelanggan has related transactions', async () => {
      // Note: Remove .skip once Transaksi tests are fully implemented
      await authenticateAgent();
      const pelanggan = await createPelanggan({ namaPelanggan: 'Has Transactions' }, prisma);
      // await createTransaksi(pelanggan.id, prisma);

      const response = await agent
        .delete(`/api/pelanggan/${pelanggan.id}`)
        .expect(400); // Or 409 depending on business logic

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/transaksi|pesanan/i);
    });
  });

  // ========================================
  // AUTHENTICATION TESTS
  // ========================================

  describe('Authentication & Authorization', () => {
    it('❌ Should deny access without authentication', async () => {
      const freshAgent = request.agent(app);

      const response = await freshAgent
        .get('/api/pelanggan')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny access without pelanggan:read permission', async () => {
      // Create user WITHOUT pelanggan permissions
      const { user, plainPassword } = await createUserWithModulePermissions(
        'kategori', // Different module = no pelanggan permissions
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
        .get('/api/pelanggan')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny create without pelanggan:create permission', async () => {
      const { user, plainPassword } = await createUserWithModulePermissions(
        'kategori',
        {},
        prisma
      );

      const cabang = await createCabang({}, prisma);

      await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({
          username: user.username,
          password: plainPassword,
        });

      const response = await agent
        .post('/api/pelanggan')
        .send({
          cabang_id: cabang.id,
          namaPelanggan: 'Test',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny update without pelanggan:update permission', async () => {
      const { user, plainPassword } = await createUserWithModulePermissions(
        'kategori',
        {},
        prisma
      );

      const pelanggan = await createPelanggan({ namaPelanggan: 'Test' }, prisma);

      await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({
          username: user.username,
          password: plainPassword,
        });

      const response = await agent
        .put(`/api/pelanggan/${pelanggan.id}`)
        .send({
          namaPelanggan: 'Updated',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny delete without pelanggan:delete permission', async () => {
      const { user, plainPassword } = await createUserWithModulePermissions(
        'kategori',
        {},
        prisma
      );

      const pelanggan = await createPelanggan({ namaPelanggan: 'Test' }, prisma);

      await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({
          username: user.username,
          password: plainPassword,
        });

      const response = await agent
        .delete(`/api/pelanggan/${pelanggan.id}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
