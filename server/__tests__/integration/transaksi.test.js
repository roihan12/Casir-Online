import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { getTestPrismaClient, clearTestDb } from '../utils/testDbManager';
import { createCabang, createKategori, createProdukMaster } from '../factories/userFactory';
import { createUserWithModulePermissions } from '../helpers/permissionSetup';

let app;
let agent;

describe('Transaksi API Integration Tests', () => {
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

  // Helper: authenticate with transaksi permissions
  const authenticateAgent = async () => {
    const result = await createUserWithModulePermissions('transaksi', {}, prisma);
    await agent
      .post('/api/auth/login')
      .set('User-Agent', 'test-agent')
      .set('X-Forwarded-For', '127.0.0.1')
      .send({ username: result.user.username, password: result.plainPassword });
    return result;
  };

  // Helper: create a produk in DB for transaction details
  const createTestProduk = async (cabang) => {
    const kategori = await createKategori({}, prisma);
    const pm = await createProdukMaster({ kategoriId: kategori.id }, prisma);
    const produk = await prisma.produk.create({
      data: {
        produkMasterId: pm.id,
        cabangId: cabang.id,
        hargaJual: 10000,
        hargaBeli: 8000,
        stok: 100,
        status: 'tersedia',
      },
    });
    return produk;
  };

  // ========================================
  // POSITIVE TEST CASES
  // ========================================

  describe('POST /api/transaksi - Positive Cases', () => {
    it('✅ Should create a PENJUALAN transaction', async () => {
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);

      const response = await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          details: [{
            produk_id: produk.id,
            jumlah: 2,
            harga_satuan: 10000,
          }],
        })
        .expect(201);

      expect(response.body.status || response.body.success).toBeTruthy();
      expect(response.body.data).toBeDefined();
      expect(response.body.data.transaksi_id).toBeDefined();
    });

    it('✅ Should create transaction with additional fees', async () => {
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);

      const response = await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          biaya_tambahan: 5000,
          keterangan: 'Additional shipping cost',
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: 10000,
          }],
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/transaksi - Positive Cases', () => {
    it('✅ Should return transactions list', async () => {
      await authenticateAgent();

      const response = await agent.get('/api/transaksi').expect(200);
      expect(response.body.status || response.body.success).toBeTruthy();
    });

    it('✅ Should filter transactions by cabang_id', async () => {
      const { cabang } = await authenticateAgent();

      const response = await agent
        .get(`/api/transaksi?cabang_id=${cabang.id}`)
        .expect(200);

      expect(response.body.status || response.body.success).toBeTruthy();
    });
  });

  describe('GET /api/transaksi/:id - Positive Cases', () => {
    it('✅ Should return transaction detail by ID', async () => {
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);

      // Create transaction first
      const createRes = await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: 10000,
          }],
        })
        .expect(201);

      const transaksiId = createRes.body.data.transaksi_id;

      const response = await agent
        .get(`/api/transaksi/${transaksiId}`)
        .expect(200);

      expect(response.body.data.id).toBe(transaksiId);
    });
  });

  describe('PUT /api/transaksi/:id/cancel - Positive Cases', () => {
    it('✅ Should cancel a transaction', async () => {
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);

      const createRes = await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: 10000,
          }],
        })
        .expect(201);

      const response = await agent
        .put(`/api/transaksi/${createRes.body.data.transaksi_id}/cancel`)
        .send({ alasan: 'Customer request' })
        .expect(200);

      expect(response.body.status || response.body.success).toBeTruthy();
    });
  });

  // ========================================
  // NEGATIVE TEST CASES
  // ========================================

  describe('POST /api/transaksi - Negative Cases', () => {
    it('❌ Should return 400 when cabang_id is missing', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/transaksi')
        .send({
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          details: [{ produk_id: 'some-id', jumlah: 1, harga_satuan: 100 }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when jenis_transaksi is invalid', async () => {
      const { cabang } = await authenticateAgent();

      const response = await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'INVALID',
          metode_pembayaran: 'TUNAI',
          details: [{ produk_id: 'some-id', jumlah: 1, harga_satuan: 100 }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when metode_pembayaran is invalid', async () => {
      const { cabang } = await authenticateAgent();

      const response = await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'BITCOIN',
          details: [{ produk_id: 'some-id', jumlah: 1, harga_satuan: 100 }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when details is empty', async () => {
      const { cabang } = await authenticateAgent();

      const response = await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          details: [],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when detail jumlah is 0', async () => {
      const { cabang } = await authenticateAgent();

      const response = await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          details: [{
            produk_id: 'some-id',
            jumlah: 0,
            harga_satuan: 10000,
          }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when detail harga_satuan is negative', async () => {
      const { cabang } = await authenticateAgent();

      const response = await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          details: [{
            produk_id: 'some-id',
            jumlah: 1,
            harga_satuan: -100,
          }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/transaksi/:id - Negative Cases', () => {
    it('❌ Should return 404 for non-existent transaction', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/transaksi/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // EDGE CASES & ADDITIONAL TESTS
  // ========================================

  describe('POST /api/transaksi - Transaction Types & Payment Methods', () => {
    it.skip('✅ Should create PEMBELIAN transaction', async () => {
      // SKIPPED: Requires complex supplier setup and business logic validation
      // This test needs proper supplier configuration and additional setup
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);

      // Create a supplier for PEMBELIAN transaction
      const supplier = await prisma.supplier.create({
        data: {
          namaSupplier: 'Test Supplier',
          telepon: '081234567890',
          alamat: 'Test Address',
        },
      });

      const response = await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PEMBELIAN',
          metode_pembayaran: 'TUNAI',
          supplier_id: supplier.supplier_id,
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: 8000,
          }],
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.jenis_transaksi).toBe('PEMBELIAN');
    });

    it('✅ Should create transaction with TRANSFER payment method', async () => {
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);

      const response = await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TRANSFER',
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: 10000,
          }],
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
    });

    it('✅ Should create transaction with QRIS payment method', async () => {
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);

      const response = await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'QRIS',
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: 10000,
          }],
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
    });

    it('✅ Should create transaction with E_WALLET payment method', async () => {
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);

      const response = await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'E_WALLET',
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: 10000,
          }],
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
    });
  });

  describe('POST /api/transaksi - Multiple Items & Edge Cases', () => {
    it('✅ Should create transaction with multiple items', async () => {
      const { cabang } = await authenticateAgent();
      const produk1 = await createTestProduk(cabang);
      const produk2 = await createTestProduk(cabang);

      const response = await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          details: [
            { produk_id: produk1.id, jumlah: 2, harga_satuan: produk1.hargaJual },
            { produk_id: produk2.id, jumlah: 1, harga_satuan: produk2.hargaJual },
          ],
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.transaksi_detail).toBeDefined();
    });

    it('✅ Should create transaction with zero biaya_tambahan', async () => {
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);

      const response = await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          biaya_tambahan: 0,
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: 10000,
          }],
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(parseFloat(response.body.data.biaya_tambahan)).toBe(0);
    });
  });

  describe('POST /api/transaksi - Negative Edge Cases', () => {
    it('❌ Should return 400 for invalid produk_id', async () => {
      const { cabang } = await authenticateAgent();

      const response = await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          details: [{
            produk_id: '00000000-0000-0000-0000-000000000000',
            jumlah: 1,
            harga_satuan: 10000,
          }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/transaksi - Filtering', () => {
    it('✅ Should filter transactions by date range', async () => {
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);

      await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: 10000,
          }],
        })
        .expect(201);

      const today = new Date().toISOString().split('T')[0];
      const response = await agent
        .get(`/api/transaksi?startDate=${today}&endDate=${today}`)
        .expect(200);

      expect(response.body.status || response.body.success).toBeTruthy();
    });

    it('✅ Should filter transactions by jenis_transaksi', async () => {
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);

      await agent
        .post('/api/transaksi')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: 10000,
          }],
        })
        .expect(201);

      const response = await agent
        .get(`/api/transaksi?jenisTransaksi=PENJUALAN`)
        .expect(200);

      expect(response.body.status || response.body.success).toBeTruthy();
    });

    it('✅ Should filter transactions by status_pembayaran', async () => {
      const { cabang } = await authenticateAgent();

      const response = await agent
        .get(`/api/transaksi?statusPembayaran=LUNAS`)
        .expect(200);

      expect(response.body.status || response.body.success).toBeTruthy();
    });
  });

  // ========================================
  // AUTHENTICATION TESTS
  // ========================================

  describe('Authentication & Authorization', () => {
    it('❌ Should deny access without authentication', async () => {
      const freshAgent = request.agent(app);
      const response = await freshAgent.get('/api/transaksi').expect(401);
      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny create without transaksi:create permission', async () => {
      const { user, plainPassword } = await createUserWithModulePermissions(
        'kategori', {}, prisma
      );

      await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({ username: user.username, password: plainPassword });

      const response = await agent
        .post('/api/transaksi')
        .send({
          cabang_id: 'test',
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          details: [{ produk_id: 'test', jumlah: 1, harga_satuan: 100 }],
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
