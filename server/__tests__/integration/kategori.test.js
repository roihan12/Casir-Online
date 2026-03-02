import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { getTestPrismaClient, clearTestDb } from '../utils/testDbManager';
import { createKategori } from '../factories/userFactory';
import { createUserWithModulePermissions } from '../helpers/permissionSetup';

// We'll dynamically import app after DATABASE_URL is set
let app;
let agent;

describe('Kategori API Integration Tests', () => {
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

  // Helper to login and get authenticated agent with kategori permissions
  const authenticateAgent = async () => {
    const { user, plainPassword } = await createUserWithModulePermissions(
      'kategori', // Module name for permissions
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
  // POSITIVE TEST CASES (8 tests)
  // ========================================

  describe('GET /api/kategori - Positive Cases', () => {
    it('✅ Should return empty array when no categories exist', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/kategori')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('✅ Should return list of all categories', async () => {
      const { user } = await authenticateAgent();

      await createKategori({ namaKategori: 'Category 1' }, prisma);
      await createKategori({ namaKategori: 'Category 2' }, prisma);
      await createKategori({ namaKategori: 'Category 3' }, prisma);

      const response = await agent
        .get('/api/kategori')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toMatchObject({
        namaKategori: expect.any(String),
        status: expect.any(String),
      });
    });

    it('✅ Should handle pagination correctly', async () => {
      await authenticateAgent();

      // Create 15 categories
      for (let i = 0; i < 15; i++) {
        await createKategori({ namaKategori: `Cat ${i}` }, prisma);
      }

      const response = await agent
        .get('/api/kategori?limit=10&offset=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10);
    });
  });

  describe('GET /api/kategori/:id - Positive Cases', () => {
    it('✅ Should return category by valid ID', async () => {
      await authenticateAgent();
      const category = await createKategori({ namaKategori: 'Test Category' }, prisma);

      const response = await agent
        .get(`/api/kategori/${category.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: category.id,
        namaKategori: 'Test Category',
      });
    });

    it('✅ Should include all related fields', async () => {
      await authenticateAgent();
      const category = await createKategori({
        namaKategori: 'Full Category',
        deskripsi: 'Test description',
        status: 'aktif',
      }, prisma);

      const response = await agent
        .get(`/api/kategori/${category.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: category.id,
        namaKategori: 'Full Category',
        deskripsi: 'Test description',
        status: 'aktif',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('POST /api/kategori - Positive Cases', () => {
    it('✅ Should create category with minimal required fields', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/kategori')
        .send({
          namaKategori: 'Minimal Category',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        namaKategori: 'Minimal Category',
        status: expect.any(String),
      });
      expect(response.body.data.id).toBeDefined();
    });

    it('✅ Should create category with all optional fields', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/kategori')
        .send({
          namaKategori: 'Complete Category',
          deskripsi: 'This is a test description',
          status: 'aktif',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        namaKategori: 'Complete Category',
        deskripsi: 'This is a test description',
        status: 'aktif',
      });
    });
  });

  describe('PUT /api/kategori/:id - Positive Cases', () => {
    it('✅ Should update category with valid data', async () => {
      await authenticateAgent();
      const category = await createKategori({ namaKategori: 'Original Name' }, prisma);

      const response = await agent
        .put(`/api/kategori/${category.id}`)
        .send({
          namaKategori: 'Updated Name',
          deskripsi: 'Updated description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: category.id,
        namaKategori: 'Updated Name',
        deskripsi: 'Updated description',
      });
    });
  });

  // ========================================
  // NEGATIVE TEST CASES (19 tests)
  // ========================================

  describe('GET /api/kategori/:id - Negative Cases', () => {
    it('❌ Should return 404 for non-existent UUID', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/kategori/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 for invalid UUID format', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/kategori/invalid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 for SQL injection attempts', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/kategori/1\' OR \'1\'=\'1')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/kategori - Negative Cases - Validation', () => {
    it('❌ Should return 400 when namaKategori is missing', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/kategori')
        .send({
          deskripsi: 'Test description',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/namaKategori/i);
    });

    it('❌ Should return 400 when namaKategori is empty string', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/kategori')
        .send({
          namaKategori: '',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when namaKategori is whitespace only', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/kategori')
        .send({
          namaKategori: '   ',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when namaKategori exceeds 100 chars', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/kategori')
        .send({
          namaKategori: 'a'.repeat(101),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when namaKategori is not a string', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/kategori')
        .send({
          namaKategori: 12345,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when status is invalid', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/kategori')
        .send({
          namaKategori: 'Test Category',
          status: 'INVALID_STATUS',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/kategori - Negative Cases - Business Logic', () => {
    it('❌ Should return 409 when namaKategori already exists', async () => {
      await authenticateAgent();
      await createKategori({ namaKategori: 'DUPLICATE' }, prisma);

      const response = await agent
        .post('/api/kategori')
        .send({
          namaKategori: 'DUPLICATE',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('✅ Should handle special characters (XSS prevention)', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/kategori')
        .send({
          namaKategori: '<script>alert("xss")</script>',
          deskripsi: '"><img src=x onerror=alert(1)>',
        })
        .expect(201);

      // Should succeed but escape/strip the dangerous content
      expect(response.body.success).toBe(true);
      expect(response.body.data.namaKategori).not.toContain('<script>');
    });
  });

  describe('PUT /api/kategori/:id - Negative Cases', () => {
    it('❌ Should return 404 when category does not exist', async () => {
      await authenticateAgent();

      const response = await agent
        .put('/api/kategori/00000000-0000-0000-0000-000000000000')
        .send({
          namaKategori: 'Updated',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 for invalid UUID format', async () => {
      await authenticateAgent();

      const response = await agent
        .put('/api/kategori/not-a-uuid')
        .send({
          namaKategori: 'Updated',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when namaKategori exceeds 100 chars', async () => {
      await authenticateAgent();
      const category = await createKategori({ namaKategori: 'Test' }, prisma);

      const response = await agent
        .put(`/api/kategori/${category.id}`)
        .send({
          namaKategori: 'a'.repeat(101),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when status is invalid', async () => {
      await authenticateAgent();
      const category = await createKategori({ namaKategori: 'Test' }, prisma);

      const response = await agent
        .put(`/api/kategori/${category.id}`)
        .send({
          status: 'INVALID',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 409 when namaKategori conflicts with existing', async () => {
      await authenticateAgent();
      const cat1 = await createKategori({ namaKategori: 'Category 1' }, prisma);
      const cat2 = await createKategori({ namaKategori: 'Category 2' }, prisma);

      const response = await agent
        .put(`/api/kategori/${cat2.id}`)
        .send({
          namaKategori: 'Category 1',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('✅ Should be idempotent (same data should not error)', async () => {
      await authenticateAgent();
      const category = await createKategori({
        namaKategori: 'Original',
        deskripsi: 'Original description',
      }, prisma);

      // Update with the same data
      const response = await agent
        .put(`/api/kategori/${category.id}`)
        .send({
          namaKategori: 'Original',
          deskripsi: 'Original description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/kategori/:id - Negative Cases', () => {
    it('❌ Should return 404 when category does not exist', async () => {
      await authenticateAgent();

      const response = await agent
        .delete('/api/kategori/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 for invalid UUID format', async () => {
      await authenticateAgent();

      const response = await agent
        .delete('/api/kategori/invalid-uuid-format')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // AUTHENTICATION TESTS
  // ========================================

  describe('Authentication & Authorization', () => {
    it('❌ Should deny access without authentication', async () => {
      const freshAgent = request.agent(app);

      const response = await freshAgent
        .get('/api/kategori')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny access without kategori:read permission', async () => {
      // Create user WITHOUT kategori permissions
      const { user, plainPassword } = await createUserWithModulePermissions(
        'supplier', // Different module = no kategori permissions
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
        .get('/api/kategori')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
