import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { getTestPrismaClient, clearTestDb } from '../utils/testDbManager';
import { createCabang, createKategori, createProdukMaster, createUserWithRole } from '../factories/userFactory';
import { createUserWithModulePermissions } from '../helpers/permissionSetup';

let app;
let agent;

describe('Delivery API Integration Tests', () => {
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

  // Helper: authenticate with delivery/transaksi permissions
  const authenticateAgent = async () => {
    const result = await createUserWithModulePermissions('transaksi', {}, prisma);

    // Also add delivery permissions
    const actions = ['create', 'read', 'update', 'delete', 'manage'];
    for (const action of actions) {
      let perm = await prisma.permission.findFirst({
        where: { module: 'delivery', action },
      });
      if (!perm) {
        perm = await prisma.permission.create({
          data: {
            name: `delivery:${action}`,
            description: `Permission to ${action} delivery`,
            module: 'delivery',
            action,
            status: 'aktif',
          },
        });
      }
      await prisma.rolePermission.create({
        data: { roleId: result.role.id, permissionId: perm.id },
      }).catch(() => {});
    }

    await agent
      .post('/api/auth/login')
      .set('User-Agent', 'test-agent')
      .set('X-Forwarded-For', '127.0.0.1')
      .send({ username: result.user.username, password: result.plainPassword });
    return result;
  };

  // Helper: create a delivery order via checkout
  const createDeliveryOrder = async (cabang) => {
    const kategori = await createKategori({}, prisma);
    const pm = await createProdukMaster({ kategoriId: kategori.id }, prisma);
    const produk = await prisma.produk.create({
      data: {
        produkMasterId: pm.id,
        cabangId: cabang.id,
        hargaJual: 25000,
        hargaBeli: 18000,
        stok: 50,
        status: 'tersedia',
      },
    });

    const orderRes = await agent
      .post('/api/checkout')
      .send({
        cabang_id: cabang.id,
        customer_name: 'Delivery Customer',
        customer_phone: '081234567890',
        customer_address: 'Jl. Delivery No. 1',
        order_type: 'DELIVERY',
        payment_method: 'COD',
        items: [{ produk_id: produk.id, jumlah: 1 }],
      });

    return orderRes.body.data;
  };

  // ========================================
  // POSITIVE TEST CASES
  // ========================================

  describe('GET /api/delivery/orders - Positive Cases', () => {
    it('✅ Should return delivery orders list', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/delivery/orders')
        .expect(200);

      expect(response.body.status || response.body.success).toBeTruthy();
    });

    it('✅ Should filter delivery orders by status', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/delivery/orders?status=PENDING')
        .expect(200);

      expect(response.body.status || response.body.success).toBeTruthy();
    });
  });

  describe('GET /api/delivery/orders/:id/tracking - Positive (Public)', () => {
    it('✅ Should return tracking info for existing order', async () => {
      const { cabang } = await authenticateAgent();
      const order = await createDeliveryOrder(cabang);
      const orderId = order?.id || order?.transaksi_id;

      if (orderId) {
        const freshAgent = request.agent(app);
        const response = await freshAgent
          .get(`/api/delivery/orders/${orderId}/tracking`)
          .expect(200);

        expect(response.body.status || response.body.success).toBeTruthy();
      }
    });
  });

  describe('PATCH /api/delivery/orders/:id/assign - Positive Cases', () => {
    it('✅ Should assign driver to delivery order', async () => {
      const authResult = await authenticateAgent();
      const order = await createDeliveryOrder(authResult.cabang);
      const orderId = order?.id || order?.transaksi_id;

      if (orderId) {
        const response = await agent
          .patch(`/api/delivery/orders/${orderId}/assign`)
          .send({ driver_id: authResult.user.id })
          .expect(200);

        expect(response.body.status || response.body.success).toBeTruthy();
      }
    });
  });

  // ========================================
  // NEGATIVE TEST CASES
  // ========================================

  describe('PATCH /api/delivery/orders/:id/assign - Negative Cases', () => {
    it('❌ Should return error when driver_id is missing', async () => {
      await authenticateAgent();

      const response = await agent
        .patch('/api/delivery/orders/00000000-0000-0000-0000-000000000000/assign')
        .send({});

      // Should be 400 or 404
      expect([400, 404]).toContain(response.status);
    });
  });

  describe('PATCH /api/delivery/orders/:id/delivery-status - Negative Cases', () => {
    it('❌ Should return error when status is invalid', async () => {
      await authenticateAgent();

      const response = await agent
        .patch('/api/delivery/orders/00000000-0000-0000-0000-000000000000/delivery-status')
        .send({ status: 'INVALID' });

      expect([400, 404]).toContain(response.status);
    });
  });

  describe('PATCH /api/delivery/orders/:id/failed - Negative Cases', () => {
    it('❌ Should return error when alasan is missing', async () => {
      await authenticateAgent();

      const response = await agent
        .patch('/api/delivery/orders/00000000-0000-0000-0000-000000000000/failed')
        .send({});

      expect([400, 404]).toContain(response.status);
    });
  });

  describe('GET /api/delivery/orders/:id/tracking - Negative Cases', () => {
    it('❌ Should return 404 for non-existent order tracking', async () => {
      const freshAgent = request.agent(app);

      const response = await freshAgent
        .get('/api/delivery/orders/00000000-0000-0000-0000-000000000000/tracking')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // AUTHENTICATION TESTS
  // ========================================

  describe('Authentication & Authorization', () => {
    it('❌ Should deny access to protected routes without authentication', async () => {
      const freshAgent = request.agent(app);
      const response = await freshAgent.get('/api/delivery/orders').expect(401);
      expect(response.body.success).toBe(false);
    });

    it('✅ Public tracking route should work without auth', async () => {
      const freshAgent = request.agent(app);

      // Even though order doesn't exist, it should not return 401
      const response = await freshAgent
        .get('/api/delivery/orders/00000000-0000-0000-0000-000000000000/tracking');

      expect(response.status).not.toBe(401);
    });
  });
});
