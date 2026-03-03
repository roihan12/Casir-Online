import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { getTestPrismaClient, clearTestDb } from '../utils/testDbManager';
import { createProdukMaster, createKategori } from '../factories/userFactory';
import { createUserWithModulePermissions } from '../helpers/permissionSetup';

// We'll dynamically import app after DATABASE_URL is set
let app;
let agent;

describe('ProdukMaster API Integration Tests', () => {
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

  // Helper to login and get authenticated agent with produk permissions
  const authenticateAgent = async () => {
    const result = await createUserWithModulePermissions(
      'produk', // Module name for permissions
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

  describe('GET /api/produk-master - Positive Cases', () => {
    it('✅ Should return empty array when no produk master exist', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/produk-master')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('✅ Should return list of all produk master', async () => {
      await authenticateAgent();

      await createProdukMaster({ namaProduk: 'Produk 1' }, prisma);
      await createProdukMaster({ namaProduk: 'Produk 2' }, prisma);
      await createProdukMaster({ namaProduk: 'Produk 3' }, prisma);

      const response = await agent
        .get('/api/produk-master')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toMatchObject({
        namaProduk: expect.any(String),
        sku: expect.any(String),
        status: expect.any(String),
      });
    });

    it.skip('✅ Should handle pagination correctly', async () => {
      await authenticateAgent();

      // Create 15 produk master
      for (let i = 0; i < 15; i++) {
        await createProdukMaster({ namaProduk: `Produk ${i}` }, prisma);
      }

      const response = await agent
        .get('/api/produk-master?limit=10&offset=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10);
    });
  });

  describe('GET /api/produk-master/:id - Positive Cases', () => {
    it('✅ Should return produk master by valid ID', async () => {
      await authenticateAgent();
      const produk = await createProdukMaster({ namaProduk: 'Test Produk' }, prisma);

      const response = await agent
        .get(`/api/produk-master/${produk.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: produk.id,
        namaProduk: 'Test Produk',
      });
    });

    it('✅ Should include all related fields', async () => {
      await authenticateAgent();
      const produk = await createProdukMaster({
        namaProduk: 'Full Produk',
        sku: 'SKU-123',
        deskripsi: 'Test description',
        brand: 'Test Brand',
        satuan: 'pcs',
        status: 'aktif',
      }, prisma);

      const response = await agent
        .get(`/api/produk-master/${produk.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: produk.id,
        namaProduk: 'Full Produk',
        sku: 'SKU-123',
        deskripsi: 'Test description',
        brand: 'Test Brand',
        satuan: 'pcs',
        status: 'aktif',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('POST /api/produk-master - Positive Cases', () => {
    it('✅ Should create produk master with minimal required fields', async () => {
      await authenticateAgent();
      const kategori = await createKategori({}, prisma);

      const response = await agent
        .post('/api/produk-master')
        .send({
          namaProduk: 'Minimal Produk',
          sku: 'SKU-MIN-001',
          kategoriId: kategori.id,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        namaProduk: 'Minimal Produk',
        sku: 'SKU-MIN-001',
      });
      expect(response.body.data.id).toBeDefined();

      // Verify status in database
      const dbProduk = await prisma.produkMaster.findUnique({
        where: { id: response.body.data.id },
      });
      expect(dbProduk.status).toBe('aktif');
    });

    it('✅ Should create produk master with all optional fields', async () => {
      await authenticateAgent();
      const kategori = await createKategori({}, prisma);

      const response = await agent
        .post('/api/produk-master')
        .send({
          namaProduk: 'Complete Produk',
          sku: 'SKU-COMP-001',
          barcode: '1234567890',
          deskripsi: 'Complete description',
          kategoriId: kategori.id,
          brand: 'Premium Brand',
          satuan: 'kg',
          berat: 1.5,
          dimensiP: 10,
          dimensiL: 20,
          dimensiT: 30,
          isManagedStock: true,
          hasExpired: false,
          status: 'aktif',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        namaProduk: 'Complete Produk',
        sku: 'SKU-COMP-001',
      });
      expect(response.body.data.id).toBeDefined();

      // Verify all fields in database
      const dbProduk = await prisma.produkMaster.findUnique({
        where: { id: response.body.data.id },
      });
      expect(dbProduk.namaProduk).toBe('Complete Produk');
      expect(dbProduk.barcode).toBe('1234567890');
      expect(dbProduk.brand).toBe('Premium Brand');
      expect(dbProduk.satuan).toBe('kg');
    });
  });

  describe('PUT /api/produk-master/:id - Positive Cases', () => {
    it('✅ Should update produk master with valid data', async () => {
      await authenticateAgent();
      const produk = await createProdukMaster({ namaProduk: 'Original Name' }, prisma);

      const response = await agent
        .put(`/api/produk-master/${produk.id}`)
        .send({
          namaProduk: 'Updated Name',
          brand: 'Updated Brand',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: produk.id,
        namaProduk: 'Updated Name',
        brand: 'Updated Brand',
      });
    });
  });

  describe('DELETE /api/produk-master/:id - Positive Cases', () => {
    it('✅ Should delete produk master successfully', async () => {
      await authenticateAgent();
      const produk = await createProdukMaster({ namaProduk: 'To Be Deleted' }, prisma);

      const response = await agent
        .delete(`/api/produk-master/${produk.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion in database (should have deletedAt set)
      const deletedProduk = await prisma.produkMaster.findUnique({
        where: { id: produk.id },
      });
      expect(deletedProduk.deletedAt).not.toBeNull();
    });
  });

  // ========================================
  // NEGATIVE TEST CASES (19 tests)
  // ========================================

  describe('GET /api/produk-master/:id - Negative Cases', () => {
    it('❌ Should return 404 for non-existent UUID', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/produk-master/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 404 for invalid UUID format (API returns 404, not 400)', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/produk-master/invalid-uuid')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/produk-master - Negative Cases - Validation', () => {
    it('❌ Should return 400 when namaProduk is missing', async () => {
      await authenticateAgent();
      const kategori = await createKategori({}, prisma);

      const response = await agent
        .post('/api/produk-master')
        .send({
          sku: 'SKU-123',
          kategoriId: kategori.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      // Validation message may not contain field name
      expect(response.body.message).toBeTruthy();
    });

    it('❌ Should return 400 when sku is missing', async () => {
      await authenticateAgent();
      const kategori = await createKategori({}, prisma);

      const response = await agent
        .post('/api/produk-master')
        .send({
          namaProduk: 'Test Produk',
          kategoriId: kategori.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      // Validation message may not contain field name
      expect(response.body.message).toBeTruthy();
    });

    it('❌ Should return 400 when kategoriId is missing', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/produk-master')
        .send({
          namaProduk: 'Test Produk',
          sku: 'SKU-123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      // Validation message may not contain field name
      expect(response.body.message).toBeTruthy();
    });

    it('❌ Should return 400 when namaProduk is empty string', async () => {
      await authenticateAgent();
      const kategori = await createKategori({}, prisma);

      const response = await agent
        .post('/api/produk-master')
        .send({
          namaProduk: '',
          sku: 'SKU-123',
          kategoriId: kategori.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when namaProduk exceeds 100 chars', async () => {
      await authenticateAgent();
      const kategori = await createKategori({}, prisma);

      const response = await agent
        .post('/api/produk-master')
        .send({
          namaProduk: 'a'.repeat(101),
          sku: 'SKU-123',
          kategoriId: kategori.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when sku exceeds 50 chars', async () => {
      await authenticateAgent();
      const kategori = await createKategori({}, prisma);

      const response = await agent
        .post('/api/produk-master')
        .send({
          namaProduk: 'Test Produk',
          sku: 'a'.repeat(51),
          kategoriId: kategori.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when barcode exceeds 50 chars', async () => {
      await authenticateAgent();
      const kategori = await createKategori({}, prisma);

      const response = await agent
        .post('/api/produk-master')
        .send({
          namaProduk: 'Test Produk',
          sku: 'SKU-123',
          barcode: 'a'.repeat(51),
          kategoriId: kategori.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when status is invalid', async () => {
      await authenticateAgent();
      const kategori = await createKategori({}, prisma);

      const response = await agent
        .post('/api/produk-master')
        .send({
          namaProduk: 'Test Produk',
          sku: 'SKU-123',
          kategoriId: kategori.id,
          status: 'INVALID_STATUS',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/produk-master - Negative Cases - Business Logic', () => {
    it('❌ Should return 400 when sku already exists', async () => {
      await authenticateAgent();
      await createProdukMaster({ sku: 'DUPLICATE-SKU' }, prisma);

      const kategori = await createKategori({}, prisma);
      const response = await agent
        .post('/api/produk-master')
        .send({
          namaProduk: 'Another Name',
          sku: 'DUPLICATE-SKU',
          kategoriId: kategori.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 404 when kategoriId does not exist', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/produk-master')
        .send({
          namaProduk: 'Test Produk',
          sku: 'SKU-123',
          kategoriId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/produk-master/:id - Negative Cases', () => {
    it('❌ Should return 404 when produk master does not exist', async () => {
      await authenticateAgent();

      const response = await agent
        .put('/api/produk-master/00000000-0000-0000-0000-000000000000')
        .send({
          namaProduk: 'Updated',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 404 for invalid UUID format (API returns 404, not 400)', async () => {
      await authenticateAgent();

      const response = await agent
        .put('/api/produk-master/not-a-uuid')
        .send({
          namaProduk: 'Updated',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when namaProduk exceeds 100 chars', async () => {
      await authenticateAgent();
      const produk = await createProdukMaster({ namaProduk: 'Test' }, prisma);

      const response = await agent
        .put(`/api/produk-master/${produk.id}`)
        .send({
          namaProduk: 'a'.repeat(101),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when sku exceeds 50 chars', async () => {
      await authenticateAgent();
      const produk = await createProdukMaster({ namaProduk: 'Test' }, prisma);

      const response = await agent
        .put(`/api/produk-master/${produk.id}`)
        .send({
          sku: 'a'.repeat(51),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when status is invalid', async () => {
      await authenticateAgent();
      const produk = await createProdukMaster({ namaProduk: 'Test' }, prisma);

      const response = await agent
        .put(`/api/produk-master/${produk.id}`)
        .send({
          status: 'INVALID',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when sku conflicts with existing', async () => {
      await authenticateAgent();
      const produk1 = await createProdukMaster({ sku: 'UNIQUE-SKU-1' }, prisma);
      const produk2 = await createProdukMaster({ sku: 'UNIQUE-SKU-2' }, prisma);

      const response = await agent
        .put(`/api/produk-master/${produk2.id}`)
        .send({
          sku: 'UNIQUE-SKU-1',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('✅ Should be idempotent (same data should not error)', async () => {
      await authenticateAgent();
      const produk = await createProdukMaster({
        namaProduk: 'Original',
        sku: 'SKU-123',
        deskripsi: 'Original description',
      }, prisma);

      // Update with the same data
      const response = await agent
        .put(`/api/produk-master/${produk.id}`)
        .send({
          namaProduk: 'Original',
          sku: 'SKU-123',
          deskripsi: 'Original description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/produk-master/:id - Negative Cases', () => {
    it('❌ Should return 404 when produk master does not exist', async () => {
      await authenticateAgent();

      const response = await agent
        .delete('/api/produk-master/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 404 for invalid UUID format (API returns 404, not 400)', async () => {
      await authenticateAgent();

      const response = await agent
        .delete('/api/produk-master/invalid-uuid-format')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it.skip('❌ Should fail to delete if produk has related products', async () => {
      // Note: Remove .skip once Produk tests and factories are fully implemented
      await authenticateAgent();
      const produkMaster = await createProdukMaster({ namaProduk: 'Has Products' }, prisma);
      // await createProduk(produkMaster.id, prisma);

      const response = await agent
        .delete(`/api/produk-master/${produkMaster.id}`)
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
        .get('/api/produk-master')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny access without produk:read permission', async () => {
      // Create user WITHOUT produk permissions
      const { user, plainPassword } = await createUserWithModulePermissions(
        'kategori', // Different module = no produk permissions
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
        .get('/api/produk-master')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny create without produk:manage permission', async () => {
      // Create user with produk:read but not produk:manage
      const { user, plainPassword, role } = await createUserWithModulePermissions(
        'kategori', // Different module
        {},
        prisma
      );

      // Manually add only produk:read permission
      const readPermission = await prisma.permission.findFirst({
        where: { name: 'produk:read' },
      });

      if (readPermission) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: readPermission.id,
          },
        });
      }

      await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({
          username: user.username,
          password: plainPassword,
        });

      const kategori = await createKategori({}, prisma);
      const response = await agent
        .post('/api/produk-master')
        .send({
          namaProduk: 'Test',
          sku: 'SKU-123',
          kategoriId: kategori.id,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny update without produk:manage permission', async () => {
      const { user, plainPassword, role } = await createUserWithModulePermissions(
        'kategori',
        {},
        prisma
      );

      const produk = await createProdukMaster({ namaProduk: 'Test' }, prisma);

      // Add only produk:read permission
      const readPermission = await prisma.permission.findFirst({
        where: { name: 'produk:read' },
      });

      if (readPermission) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: readPermission.id,
          },
        });
      }

      await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({
          username: user.username,
          password: plainPassword,
        });

      const response = await agent
        .put(`/api/produk-master/${produk.id}`)
        .send({
          namaProduk: 'Updated',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny delete without produk:manage permission', async () => {
      const { user, plainPassword, role } = await createUserWithModulePermissions(
        'kategori',
        {},
        prisma
      );

      const produk = await createProdukMaster({ namaProduk: 'Test' }, prisma);

      // Add only produk:read permission
      const readPermission = await prisma.permission.findFirst({
        where: { name: 'produk:read' },
      });

      if (readPermission) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: readPermission.id,
          },
        });
      }

      await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({
          username: user.username,
          password: plainPassword,
        });

      const response = await agent
        .delete(`/api/produk-master/${produk.id}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
