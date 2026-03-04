import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { getTestPrismaClient, clearTestDb } from '../utils/testDbManager';
import { createCabang, createKategori, createProdukMaster } from '../factories/userFactory';
import { createUserWithModulePermissions } from '../helpers/permissionSetup';

let app;
let agent;

describe('Produk API Integration Tests', () => {
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

  // Helper: authenticate with produk + inventory permissions
  const authenticateAgent = async () => {
    // Create user with produk permissions
    const result = await createUserWithModulePermissions('produk', {}, prisma);

    // Also add inventory permissions for stock update tests
    const invPermissions = ['create', 'read', 'update', 'delete', 'manage'];
    for (const action of invPermissions) {
      let perm = await prisma.permission.findFirst({
        where: { module: 'inventory', action },
      });
      if (!perm) {
        perm = await prisma.permission.create({
          data: {
            name: `inventory:${action}`,
            description: `Permission to ${action} inventory`,
            module: 'inventory',
            action,
            status: 'aktif',
          },
        });
      }
      await prisma.rolePermission.create({
        data: { roleId: result.role.id, permissionId: perm.id },
      }).catch(() => {}); // ignore if already exists
    }

    await agent
      .post('/api/auth/login')
      .set('User-Agent', 'test-agent')
      .set('X-Forwarded-For', '127.0.0.1')
      .send({ username: result.user.username, password: result.plainPassword });

    return result;
  };

  // Helper: create a full produk in DB
  const createTestProduk = async (overrides = {}) => {
    const cabang = overrides.cabang || await createCabang({}, prisma);
    const kategori = await createKategori({}, prisma);
    const produkMaster = await createProdukMaster({ kategoriId: kategori.id }, prisma);

    const produk = await prisma.produk.create({
      data: {
        produkMasterId: produkMaster.id,
        cabangId: cabang.id,
        hargaJual: overrides.hargaJual || 10000,
        hargaBeli: overrides.hargaBeli || 8000,
        stok: overrides.stok ?? 100,
        status: overrides.status || 'tersedia',
      },
    });

    return { produk, cabang, kategori, produkMaster };
  };

  // ========================================
  // POSITIVE TEST CASES
  // ========================================

  describe('GET /api/produk - Positive Cases', () => {
    it('✅ Should return products list', async () => {
      await authenticateAgent();
      await createTestProduk();

      const response = await agent.get('/api/produk').expect(200);

      expect(response.body.status).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('✅ Should filter products by cabangId', async () => {
      await authenticateAgent();
      const cabang = await createCabang({ namaCabang: 'Filter Cabang' }, prisma);
      await createTestProduk({ cabang });

      const response = await agent
        .get(`/api/produk?cabangId=${cabang.id}`)
        .expect(200);

      expect(response.body.status).toBe(true);
    });
  });

  describe('GET /api/produk/:id - Positive Cases', () => {
    it('✅ Should return product by valid ID', async () => {
      await authenticateAgent();
      const { produk } = await createTestProduk();

      const response = await agent
        .get(`/api/produk/${produk.id}`)
        .expect(200);

      expect(response.body.status).toBe(true);
      expect(response.body.data.id).toBe(produk.id);
    });
  });

  describe('POST /api/produk - Positive Cases', () => {
    it('✅ Should create product with required fields', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);
      const kategori = await createKategori({}, prisma);
      const pm = await createProdukMaster({ kategoriId: kategori.id }, prisma);

      const response = await agent
        .post('/api/produk')
        .send({
          produkMasterId: pm.id,
          cabangId: cabang.id,
          hargaBeli: 5000,
          hargaJual: 8000,
        })
        .expect(201);

      expect(response.body.status).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
    });

    it('✅ Should create product with all optional fields', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);
      const kategori = await createKategori({}, prisma);
      const pm = await createProdukMaster({ kategoriId: kategori.id }, prisma);

      const response = await agent
        .post('/api/produk')
        .send({
          produkMasterId: pm.id,
          cabangId: cabang.id,
          hargaBeli: 5000,
          hargaJual: 8000,
          hargaGrosir: 6000,
          stok: 50,
          minStok: 10,
          maxStok: 200,
          status: 'tersedia',
        })
        .expect(201);

      expect(response.body.status).toBe(true);
    });
  });

  describe('PUT /api/produk/:id - Positive Cases', () => {
    it('✅ Should update product price', async () => {
      await authenticateAgent();
      const { produk } = await createTestProduk();

      const response = await agent
        .put(`/api/produk/${produk.id}`)
        .send({ hargaJual: 15000 })
        .expect(200);

      expect(response.body.status).toBe(true);
    });
  });

  describe('PUT /api/produk/:id/stock - Positive Cases', () => {
    it('✅ Should adjust stock with valid data', async () => {
      await authenticateAgent();
      const { produk } = await createTestProduk({ stok: 100 });

      const response = await agent
        .put(`/api/produk/${produk.id}/stock`)
        .send({
          quantity: 50,
          keterangan: 'Restocking from supplier',
        })
        .expect(200);

      expect(response.body.status).toBe(true);
    });

    it('✅ Should adjust stock with negative quantity (stock out)', async () => {
      await authenticateAgent();
      const { produk } = await createTestProduk({ stok: 100 });

      const response = await agent
        .put(`/api/produk/${produk.id}/stock`)
        .send({
          quantity: -10,
          keterangan: 'Manual adjustment',
          referenceType: 'ADJUSTMENT',
        })
        .expect(200);

      expect(response.body.status).toBe(true);
    });
  });

  // ========================================
  // NEGATIVE TEST CASES
  // ========================================

  describe('GET /api/produk/:id - Negative Cases', () => {
    it('❌ Should return 404 for non-existent product', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/produk/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.status || response.body.success).toBeFalsy();
    });
  });

  describe('POST /api/produk - Negative Cases', () => {
    it('❌ Should return 400 when produkMasterId is missing', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/produk')
        .send({
          cabangId: cabang.id,
          hargaBeli: 5000,
          hargaJual: 8000,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when cabangId is missing', async () => {
      await authenticateAgent();
      const kategori = await createKategori({}, prisma);
      const pm = await createProdukMaster({ kategoriId: kategori.id }, prisma);

      const response = await agent
        .post('/api/produk')
        .send({
          produkMasterId: pm.id,
          hargaBeli: 5000,
          hargaJual: 8000,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when hargaBeli is missing', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);
      const kategori = await createKategori({}, prisma);
      const pm = await createProdukMaster({ kategoriId: kategori.id }, prisma);

      const response = await agent
        .post('/api/produk')
        .send({
          produkMasterId: pm.id,
          cabangId: cabang.id,
          hargaJual: 8000,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when hargaJual is negative', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);
      const kategori = await createKategori({}, prisma);
      const pm = await createProdukMaster({ kategoriId: kategori.id }, prisma);

      const response = await agent
        .post('/api/produk')
        .send({
          produkMasterId: pm.id,
          cabangId: cabang.id,
          hargaBeli: 5000,
          hargaJual: -100,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when status is invalid', async () => {
      await authenticateAgent();
      const cabang = await createCabang({}, prisma);
      const kategori = await createKategori({}, prisma);
      const pm = await createProdukMaster({ kategoriId: kategori.id }, prisma);

      const response = await agent
        .post('/api/produk')
        .send({
          produkMasterId: pm.id,
          cabangId: cabang.id,
          hargaBeli: 5000,
          hargaJual: 8000,
          status: 'INVALID',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/produk/:id/stock - Negative Cases', () => {
    it('❌ Should return 400 when quantity is missing', async () => {
      await authenticateAgent();
      const { produk } = await createTestProduk();

      const response = await agent
        .put(`/api/produk/${produk.id}/stock`)
        .send({ keterangan: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when keterangan is missing', async () => {
      await authenticateAgent();
      const { produk } = await createTestProduk();

      const response = await agent
        .put(`/api/produk/${produk.id}/stock`)
        .send({ quantity: 10 })
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
      const response = await freshAgent.get('/api/produk').expect(401);
      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny create without produk:create permission', async () => {
      const { user, plainPassword } = await createUserWithModulePermissions(
        'kategori', {}, prisma
      );

      await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({ username: user.username, password: plainPassword });

      const response = await agent
        .post('/api/produk')
        .send({
          produkMasterId: 'test',
          cabangId: 'test',
          hargaBeli: 5000,
          hargaJual: 8000,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
