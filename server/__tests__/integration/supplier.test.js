import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { getTestPrismaClient, clearTestDb } from '../utils/testDbManager';
import { createSupplier, createCabang } from '../factories/userFactory';
import { createUserWithModulePermissions } from '../helpers/permissionSetup';

// We'll dynamically import app after DATABASE_URL is set
let app;
let agent;

describe('Supplier API Integration Tests', () => {
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

  // Helper to login and get authenticated agent with supplier permissions
  const authenticateAgent = async () => {
    const { user, plainPassword } = await createUserWithModulePermissions(
      'supplier', // Module name for permissions
      {}, // Default user data
      prisma // Pass the test's prisma instance
    );

    await agent
      .post('/api/auth/login')
      .set('User-Agent', 'test-agent')
      .set('X-Forwarded-For', '127.0.0.1')
      .send({
        username: user.username,
        password: plainPassword,
      });

    return { user };
  };

  // ========================================
  // POSITIVE TEST CASES
  // ========================================

  describe('GET /api/supplier - Positive Cases', () => {
    it('✅ Should return empty array when no suppliers exist', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/supplier')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('✅ Should return list of all suppliers', async () => {
      await authenticateAgent();

      await createSupplier({ namaSupplier: 'Supplier 1' }, prisma);
      await createSupplier({ namaSupplier: 'Supplier 2' }, prisma);
      await createSupplier({ namaSupplier: 'Supplier 3' }, prisma);

      const response = await agent
        .get('/api/supplier')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toMatchObject({
        namaSupplier: expect.any(String),
        status: expect.any(String),
      });
    });

    it.skip('✅ Should handle pagination correctly', async () => {
      await authenticateAgent();

      // Create 15 suppliers
      for (let i = 0; i < 15; i++) {
        await createSupplier({ namaSupplier: `Supp ${i}` }, prisma);
      }

      const response = await agent
        .get('/api/supplier?limit=10&offset=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10);
    });
  });

  describe('GET /api/supplier/:id - Positive Cases', () => {
    it('✅ Should return supplier by valid ID', async () => {
      await authenticateAgent();
      const supplier = await createSupplier({ namaSupplier: 'Test Supplier' }, prisma);

      const response = await agent
        .get(`/api/supplier/${supplier.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: supplier.id,
        namaSupplier: 'Test Supplier',
      });
    });

    it('✅ Should include all related fields', async () => {
      await authenticateAgent();
      const supplier = await createSupplier({
        namaSupplier: 'Full Supplier',
        picNama: 'John Doe',
        telepon: '08123456789',
        email: 'john@example.com',
        alamat: '123 Test St',
        status: 'aktif',
      }, prisma);

      const response = await agent
        .get(`/api/supplier/${supplier.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: supplier.id,
        namaSupplier: 'Full Supplier',
        telepon: '08123456789',
        email: 'john@example.com',
        alamat: '123 Test St',
        status: 'aktif',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('POST /api/supplier - Positive Cases', () => {
    it('✅ Should create supplier with minimal required fields', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/supplier')
        .send({
          cabang_id: cabang.id,
          namaSupplier: 'Minimal Supplier',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        namaSupplier: 'Minimal Supplier',
        cabang_id: cabang.id,
      });
      expect(response.body.data.id).toBeDefined();

      // Verify status in database
      const dbSupplier = await prisma.supplier.findUnique({
        where: { id: response.body.data.id },
      });
      expect(dbSupplier.status).toBe('aktif');
    });

    it('✅ Should create supplier with all optional fields', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/supplier')
        .send({
          cabang_id: cabang.id,
          namaSupplier: 'Complete Supplier',
          picNama: 'Jane Doe',
          picKontak: '08987654321',
          telepon: '08123456789',
          email: 'jane@example.com',
          alamat: '456 Test Ave',
          npwp: '1234567890',
          status: 'aktif',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        namaSupplier: 'Complete Supplier',
        cabang_id: cabang.id,
      });
      expect(response.body.data.id).toBeDefined();

      // Verify all fields in database
      const dbSupplier = await prisma.supplier.findUnique({
        where: { id: response.body.data.id },
      });
      expect(dbSupplier.picNama).toBe('Jane Doe');
      expect(dbSupplier.picKontak).toBe('08987654321');
      expect(dbSupplier.telepon).toBe('08123456789');
      expect(dbSupplier.email).toBe('jane@example.com');
      expect(dbSupplier.alamat).toBe('456 Test Ave');
      expect(dbSupplier.npwp).toBe('1234567890');
      expect(dbSupplier.status).toBe('aktif');
    });
  });

  describe('PUT /api/supplier/:id - Positive Cases', () => {
    it('✅ Should update supplier with valid data', async () => {
      await authenticateAgent();
      const supplier = await createSupplier({ namaSupplier: 'Original Name' }, prisma);

      const response = await agent
        .put(`/api/supplier/${supplier.id}`)
        .send({
          namaSupplier: 'Updated Name',
          telepon: '0000000000',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: supplier.id,
        namaSupplier: 'Updated Name',
        telepon: '0000000000',
      });
    });
  });

  describe('DELETE /api/supplier/:id - Positive Cases', () => {
    it('✅ Should delete supplier successfully', async () => {
      await authenticateAgent();
      const supplier = await createSupplier({ namaSupplier: 'To Be Deleted' }, prisma);

      const response = await agent
        .delete(`/api/supplier/${supplier.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion in database
      const deletedSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.id }
      });
      expect(deletedSupplier).toBeNull();
    });
  });

  // ========================================
  // NEGATIVE TEST CASES
  // ========================================

  describe('GET /api/supplier/:id - Negative Cases', () => {
    it('❌ Should return 404 for non-existent UUID', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/supplier/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 404 for invalid UUID format (API returns 404, not 400)', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/supplier/invalid-uuid')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/supplier - Negative Cases - Validation', () => {
    it('❌ Should return 400 when namaSupplier is missing', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/supplier')
        .send({
          cabang_id: cabang.id,
          telepon: '08123456789',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when cabang_id is missing', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/supplier')
        .send({
          namaSupplier: 'Test Supplier',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when namaSupplier is empty string', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/supplier')
        .send({
          cabang_id: cabang.id,
          namaSupplier: '',
          telepon: '08123456789',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when email format is invalid', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/supplier')
        .send({
          cabang_id: cabang.id,
          namaSupplier: 'Test Supplier',
          telepon: '08123456789',
          email: 'invalid-email-format',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/supplier/:id - Negative Cases', () => {
    it('❌ Should return 404 when supplier does not exist', async () => {
      await authenticateAgent();

      const response = await agent
        .put('/api/supplier/00000000-0000-0000-0000-000000000000')
        .send({
          namaSupplier: 'Updated',
          telepon: '08123456789',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 404 for invalid UUID format (API returns 404, not 400)', async () => {
      await authenticateAgent();

      const response = await agent
        .put('/api/supplier/not-a-uuid')
        .send({
          namaSupplier: 'Updated',
          telepon: '08123456789',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/supplier/:id - Negative Cases', () => {
    it('❌ Should return 404 when supplier does not exist', async () => {
      await authenticateAgent();

      const response = await agent
        .delete('/api/supplier/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 404 for invalid UUID format (API returns 404, not 400)', async () => {
      await authenticateAgent();

      const response = await agent
        .delete('/api/supplier/invalid-uuid-format')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it.skip('❌ Should fail to delete if supplier has related products', async () => {
      // Note: Remove .skip once Produk tests and factories are fully implemented
      await authenticateAgent();

      const supplier = await createSupplier({ namaSupplier: 'Has Products' }, prisma);
      // await createProdukWithSupplier(supplier.id, prisma); // Mock related product

      const response = await agent
        .delete(`/api/supplier/${supplier.id}`)
        .expect(400); // Or 409 depending on business logic

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/produk/i);
    });
  });

  // ========================================
  // AUTHENTICATION TESTS
  // ========================================

  describe('Authentication & Authorization', () => {
    it('❌ Should deny access without authentication', async () => {
      const freshAgent = request.agent(app);

      const response = await freshAgent
        .get('/api/supplier')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny access without supplier:read permission', async () => {
      // Create user WITHOUT supplier permissions
      const { user, plainPassword } = await createUserWithModulePermissions(
        'kategori', // Different module = no supplier permissions
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
        .get('/api/supplier')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
