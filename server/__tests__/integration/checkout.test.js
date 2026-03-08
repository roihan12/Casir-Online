import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { getTestPrismaClient, clearTestDb } from '../utils/testDbManager';
import { createCabang, createKategori, createProdukMaster } from '../factories/userFactory';

let app;
let agent;

describe('Checkout API Integration Tests (Public)', () => {
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

  // Helper: create a produk for checkout items
  const createTestProduk = async (cabang) => {
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
    return produk;
  };

  // ========================================
  // POSITIVE TEST CASES
  // ========================================

  describe('POST /api/checkout - Positive Cases', () => {
    it('✅ Should create PICKUP order with PAY_AT_STORE', async () => {
      const cabang = await createCabang({}, prisma);
      const produk = await createTestProduk(cabang);

      const response = await agent
        .post('/api/checkout')
        .send({
          cabang_id: cabang.id,
          customer_name: 'John Doe',
          customer_phone: '081234567890',
          order_type: 'PICKUP',
          payment_method: 'PAY_AT_STORE',
          items: [{
            produk_id: produk.id,
            jumlah: 2,
          }],
        })
        .expect(201);

      expect(response.body.status || response.body.success).toBeTruthy();
      expect(response.body.data).toBeDefined();
    });

    it('✅ Should create DELIVERY order with COD', async () => {
      const cabang = await createCabang({}, prisma);
      const produk = await createTestProduk(cabang);

      const response = await agent
        .post('/api/checkout')
        .send({
          cabang_id: cabang.id,
          customer_name: 'Jane Doe',
          customer_phone: '081234567891',
          customer_address: 'Jl. Merdeka No. 10',
          order_type: 'DELIVERY',
          payment_method: 'COD',
          items: [{
            produk_id: produk.id,
            jumlah: 1,
          }],
        })
        .expect(201);

      expect(response.body.status || response.body.success).toBeTruthy();
    });

    it('✅ Should create PICKUP order with PAYMENT_LINK', async () => {
      const cabang = await createCabang({}, prisma);
      const produk = await createTestProduk(cabang);

      const response = await agent
        .post('/api/checkout')
        .send({
          cabang_id: cabang.id,
          customer_name: 'Bob Smith',
          customer_phone: '081234567892',
          order_type: 'PICKUP',
          payment_method: 'PAYMENT_LINK',
          items: [{
            produk_id: produk.id,
            jumlah: 3,
          }],
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/checkout/:transaksiId/status - Positive Cases', () => {
    it('✅ Should return order status', async () => {
      const cabang = await createCabang({}, prisma);
      const produk = await createTestProduk(cabang);

      const createRes = await agent
        .post('/api/checkout')
        .send({
          cabang_id: cabang.id,
          customer_name: 'Track User',
          customer_phone: '081234567893',
          order_type: 'PICKUP',
          payment_method: 'PAY_AT_STORE',
          items: [{ produk_id: produk.id, jumlah: 1 }],
        })
        .expect(201);

      const transaksiId = createRes.body.data.id || createRes.body.data.transaksi_id;

      if (transaksiId) {
        const response = await agent
          .get(`/api/checkout/${transaksiId}/status?cabangId=${cabang.id}`)
          .expect(200);

        expect(response.body.status || response.body.success).toBeTruthy();
      }
    });
  });

  // ========================================
  // NEGATIVE TEST CASES
  // ========================================

  describe('POST /api/checkout - Negative Cases - Validation', () => {
    it('❌ Should return 400 when cabang_id is missing', async () => {
      const response = await agent
        .post('/api/checkout')
        .send({
          customer_name: 'Test',
          customer_phone: '081234567890',
          order_type: 'PICKUP',
          payment_method: 'PAY_AT_STORE',
          items: [{ produk_id: 'some-id', jumlah: 1 }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when customer_name is missing', async () => {
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/checkout')
        .send({
          cabang_id: cabang.id,
          customer_phone: '081234567890',
          order_type: 'PICKUP',
          payment_method: 'PAY_AT_STORE',
          items: [{ produk_id: 'some-id', jumlah: 1 }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when customer_phone format is invalid', async () => {
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/checkout')
        .send({
          cabang_id: cabang.id,
          customer_name: 'Test',
          customer_phone: 'not-a-phone',
          order_type: 'PICKUP',
          payment_method: 'PAY_AT_STORE',
          items: [{ produk_id: 'some-id', jumlah: 1 }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when order_type is invalid', async () => {
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/checkout')
        .send({
          cabang_id: cabang.id,
          customer_name: 'Test',
          customer_phone: '081234567890',
          order_type: 'DINE_IN',
          payment_method: 'PAY_AT_STORE',
          items: [{ produk_id: 'some-id', jumlah: 1 }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when payment_method is invalid', async () => {
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/checkout')
        .send({
          cabang_id: cabang.id,
          customer_name: 'Test',
          customer_phone: '081234567890',
          order_type: 'PICKUP',
          payment_method: 'BITCOIN',
          items: [{ produk_id: 'some-id', jumlah: 1 }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when items is empty', async () => {
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/checkout')
        .send({
          cabang_id: cabang.id,
          customer_name: 'Test',
          customer_phone: '081234567890',
          order_type: 'PICKUP',
          payment_method: 'PAY_AT_STORE',
          items: [],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when COD with PICKUP (business rule)', async () => {
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/checkout')
        .send({
          cabang_id: cabang.id,
          customer_name: 'Test',
          customer_phone: '081234567890',
          order_type: 'PICKUP',
          payment_method: 'COD',
          items: [{ produk_id: 'some-id', jumlah: 1 }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when PAY_AT_STORE with DELIVERY (business rule)', async () => {
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/checkout')
        .send({
          cabang_id: cabang.id,
          customer_name: 'Test',
          customer_phone: '081234567890',
          customer_address: 'Jl. Test',
          order_type: 'DELIVERY',
          payment_method: 'PAY_AT_STORE',
          items: [{ produk_id: 'some-id', jumlah: 1 }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when DELIVERY without customer_address', async () => {
      const cabang = await createCabang({}, prisma);

      const response = await agent
        .post('/api/checkout')
        .send({
          cabang_id: cabang.id,
          customer_name: 'Test',
          customer_phone: '081234567890',
          order_type: 'DELIVERY',
          payment_method: 'COD',
          items: [{ produk_id: 'some-id', jumlah: 1 }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/checkout/:transaksiId/status - Negative Cases', () => {
    it('❌ Should return 404 for non-existent order', async () => {
      const cabang = await createCabang({}, prisma);
      const response = await agent
        .get(`/api/checkout/00000000-0000-0000-0000-000000000000/status?cabangId=${cabang.id}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // NO AUTH REQUIRED (Public Routes)
  // ========================================

  describe('Public Access', () => {
    it('✅ Checkout routes should not require authentication', async () => {
      const freshAgent = request.agent(app);
      const cabang = await createCabang({}, prisma);
      const produk = await createTestProduk(cabang);

      const response = await freshAgent
        .post('/api/checkout')
        .send({
          cabang_id: cabang.id,
          customer_name: 'Guest User',
          customer_phone: '081234567890',
          order_type: 'PICKUP',
          payment_method: 'PAY_AT_STORE',
          items: [{ produk_id: produk.id, jumlah: 1 }],
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
    });
  });
});
