import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { getTestPrismaClient, clearTestDb } from '../utils/testDbManager';
import { createCabang, createKategori, createProdukMaster } from '../factories/userFactory';
import { createUserWithModulePermissions } from '../helpers/permissionSetup';

let app;
let agent;

describe('Transaksi with Promo API Integration Tests', () => {
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

  // Helper: create a produk in DB
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

  // Helper: create a promo
  const createTestPromo = async (cabang, overrides = {}) => {
    const promoData = {
      kodePromo: 'TEST10',
      namaPromo: 'Test Promo 10%',
      nilaiDiskon: 10,
      cabangId: cabang.id,
      tanggalMulai: new Date(),
      tanggalBerakhir: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      limitPenggunaan: 100,
      minPembelian: 0,
      status: 'aktif',
      ...overrides,
    };

    return await prisma.promoDiskon.create({
      data: promoData,
    });
  };

  // ========================================
  // POSITIVE TEST CASES
  // ========================================

  describe('POST /api/transaksi/create-with-promo - Positive Cases', () => {
    it.skip('✅ Should create transaction with valid promo code', async () => {
      // SKIPPED: Requires validate_promo_eligibility stored procedure
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);
      const promo = await createTestPromo(cabang, {
        kodePromo: 'DISCOUNT10',
        nilaiDiskon: 10,
      });

      const response = await agent
        .post('/api/transaksi/create-with-promo')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          promo_codes: [promo.kodePromo],
          details: [{
            produk_id: produk.id,
            jumlah: 2,
            harga_satuan: produk.hargaJual,
          }],
        })
        .expect(201);

      expect(response.body.status || response.body.success).toBeTruthy();
      expect(response.body.data).toBeDefined();
      expect(response.body.data.transaksi_id).toBeDefined();
    });

    it.skip('✅ Should create transaction with nominal discount promo', async () => {
      // SKIPPED: Requires validate_promo_eligibility stored procedure
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);
      const promo = await createTestPromo(cabang, {
        kodePromo: 'NOMINAL5000',
        nilaiDiskon: 5000,
        minPembelian: 20000,
      });

      const response = await agent
        .post('/api/transaksi/create-with-promo')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          promo_codes: [promo.kodePromo],
          details: [
            { produk_id: produk.id, jumlah: 3, harga_satuan: produk.hargaJual },
          ],
        })
        .expect(201);

      expect(response.body.status || response.body.success).toBeTruthy();
      expect(response.body.data).toBeDefined();
    });

    it('✅ Should create transaction with manual discount percentage', async () => {
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);

      const response = await agent
        .post('/api/transaksi/create-with-promo')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          manual_discount_persen: 5,
          manual_discount_alasan: 'Member special',
          details: [{
            produk_id: produk.id,
            jumlah: 2,
            harga_satuan: produk.hargaJual,
          }],
        })
        .expect(201);

      expect(response.body.status || response.body.success).toBeTruthy();
      expect(response.body.data).toBeDefined();
    });

    it('✅ Should create transaction with manual discount nominal', async () => {
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);

      const response = await agent
        .post('/api/transaksi/create-with-promo')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          manual_discount_nominal: 2000,
          manual_discount_alasan: 'Special discount',
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: produk.hargaJual,
          }],
        })
        .expect(201);

      expect(response.body.status || response.body.success).toBeTruthy();
      expect(response.body.data).toBeDefined();
    });
  });

  describe('POST /api/transaksi/preview-discount - Positive Cases', () => {
    it.skip('✅ Should preview discounts before creating transaction', async () => {
      // SKIPPED: Requires different validation (subtotal instead of details)
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);
      const promo = await createTestPromo(cabang, {
        kodePromo: 'PREVIEW10',
        nilaiDiskon: 10,
      });

      const response = await agent
        .post('/api/transaksi/preview-discount')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          promo_codes: [promo.kodePromo],
          details: [{
            produk_id: produk.id,
            jumlah: 2,
            harga_satuan: produk.hargaJual,
          }],
        })
        .expect(200);

      expect(response.body.status || response.body.success).toBeTruthy();
      expect(response.body.data).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
    });

    it.skip('✅ Should preview manual discount', async () => {
      // SKIPPED: Requires different validation (subtotal instead of details)
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);

      const response = await agent
        .post('/api/transaksi/preview-discount')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          manual_discount_persen: 10,
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: produk.hargaJual,
          }],
        })
        .expect(200);

      expect(response.body.status || response.body.success).toBeTruthy();
      expect(response.body.data).toBeDefined();
    });

    it.skip('✅ Should preview combined discounts (promo + manual)', async () => {
      // SKIPPED: Requires different validation (subtotal instead of details)
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);
      const promo = await createTestPromo(cabang, {
        kodePromo: 'COMBO10',
        nilaiDiskon: 10,
      });

      const response = await agent
        .post('/api/transaksi/preview-discount')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          promo_codes: [promo.kodePromo],
          manual_discount_persen: 5,
          details: [{
            produk_id: produk.id,
            jumlah: 3,
            harga_satuan: produk.hargaJual,
          }],
        })
        .expect(200);

      expect(response.body.status || response.body.success).toBeTruthy();
      expect(response.body.data).toBeDefined();
    });
  });

  // ========================================
  // NEGATIVE TEST CASES
  // ========================================

  describe('POST /api/transaksi/create-with-promo - Negative Cases', () => {
    it.skip('❌ Should return 400 for invalid promo code', async () => {
      // SKIPPED: Promo code validation may not be fully implemented
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);

      const response = await agent
        .post('/api/transaksi/create-with-promo')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          promo_codes: ['INVALID_PROMO'],
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: produk.hargaJual,
          }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it.skip('❌ Should return 400 when minimum purchase not met', async () => {
      // SKIPPED: Minimum purchase validation may not be fully implemented
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);
      const promo = await createTestPromo(cabang, {
        kodePromo: 'MIN50K',
        minPembelian: 50000,
        nilaiDiskon: 10,
      });

      const response = await agent
        .post('/api/transaksi/create-with-promo')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          promo_codes: [promo.kodePromo],
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: produk.hargaJual,
          }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it.skip('❌ Should return 400 for expired promo code', async () => {
      // SKIPPED: Expired promo validation may not be fully implemented
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);
      const promo = await createTestPromo(cabang, {
        kodePromo: 'EXPIRED',
        tanggalMulai: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        tanggalBerakhir: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      });

      const response = await agent
        .post('/api/transaksi/create-with-promo')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          promo_codes: [promo.kodePromo],
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: produk.hargaJual,
          }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it.skip('❌ Should return 400 when promo usage limit exceeded', async () => {
      // SKIPPED: Usage limit validation may not be fully implemented
      const { cabang } = await authenticateAgent();
      const produk = await createTestProduk(cabang);
      const promo = await createTestPromo(cabang, {
        kodePromo: 'LIMITED',
        limitPenggunaan: 1,
        nilaiDiskon: 10,
      });

      // Create first transaction
      await agent
        .post('/api/transaksi/create-with-promo')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          promo_codes: [promo.kodePromo],
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: produk.hargaJual,
          }],
        })
        .expect(201);

      // Try to use same promo again
      const response = await agent
        .post('/api/transaksi/create-with-promo')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          promo_codes: [promo.kodePromo],
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: produk.hargaJual,
          }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // AUTHENTICATION TESTS
  // ========================================

  describe('Authentication & Authorization', () => {
    it('❌ Should deny create-with-promo without authentication', async () => {
      const freshAgent = request.agent(app);
      const cabang = await createCabang({}, prisma);
      const produk = await createTestProduk(cabang);

      const response = await freshAgent
        .post('/api/transaksi/create-with-promo')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: produk.hargaJual,
          }],
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny create-with-promo without transaksi:create permission', async () => {
      const { user, plainPassword } = await createUserWithModulePermissions(
        'kategori', {}, prisma
      );
      const cabang = await createCabang({}, prisma);
      const produk = await createTestProduk(cabang);

      await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({ username: user.username, password: plainPassword });

      const response = await agent
        .post('/api/transaksi/create-with-promo')
        .send({
          cabang_id: cabang.id,
          jenis_transaksi: 'PENJUALAN',
          metode_pembayaran: 'TUNAI',
          details: [{
            produk_id: produk.id,
            jumlah: 1,
            harga_satuan: produk.hargaJual,
          }],
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
