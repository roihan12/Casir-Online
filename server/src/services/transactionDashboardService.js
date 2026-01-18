const prisma = require("../config/db");
const {
  cacheSet,
  cacheGet,
  createCacheKey,
  cacheDeletePattern,
} = require("../utils/redisUtils");

const CACHE_KEYS = {
  TRANSACTION_DASHBOARD: "transaction-dashboard",
};

const CACHE_TTL = {
  TRANSACTION_DASHBOARD: 300, // 5 menit
};

const PAYMENT_STATUS = {
  LUNAS: "LUNAS",
  BELUM_LUNAS: "BELUM_LUNAS",
  DIBATALKAN: "DIBATALKAN",
};

class TransactionDashboardService {
  /**
   * Mendapatkan data dashboard transaksi
   * @param {Object} filters - Filter untuk data dashboard
   * @param {string} filters.cabang_id - ID cabang (opsional)
   * @param {string} filters.tanggal_mulai - Tanggal awal (format: YYYY-MM-DD)
   * @param {string} filters.tanggal_akhir - Tanggal akhir (format: YYYY-MM-DD)
   * @returns {Promise<Object>} Data dashboard transaksi
   */
  static async getTransactionDashboardData(filters = {}) {
    const { cabang_id, tanggal_mulai, tanggal_akhir } = filters;

    // Buat kunci cache berdasarkan filter
    const cacheKey = createCacheKey(
      CACHE_KEYS.TRANSACTION_DASHBOARD,
      `${cabang_id || "all"}-${tanggal_mulai || "all"}-${tanggal_akhir || "all"}`
    );

    // Coba ambil dari cache terlebih dahulu
    const cachedData = await cacheGet(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Ambil data transaksi dari database
    const transactions = await this.fetchTransactions(filters);

    // Hitung ringkasan transaksi
    const summary = this.calculateSummary(transactions, filters);

    // Siapkan data dashboard
    const dashboardData = {
      summary,
      sales_trend: this.calculateSalesTrend(transactions, tanggal_mulai, tanggal_akhir),
      branch_distribution: this.calculateBranchDistribution(transactions),
      top_products: this.getTopProducts(transactions, 10),
      payment_status: this.calculatePaymentStatus(transactions),
    };

    // Simpan ke cache
    await cacheSet(cacheKey, dashboardData, CACHE_TTL.TRANSACTION_DASHBOARD);

    return dashboardData;
  }

  /**
   * Mengambil data transaksi dari database
   * @param {Object} filters - Filter untuk query
   * @returns {Promise<Array>} Daftar transaksi
   */
  static async fetchTransactions(filters = {}) {
    const { cabang_id, tanggal_mulai, tanggal_akhir } = filters;

    // Siapkan filter untuk query
    const whereClause = {
      deleted_at: null,
      jenis_transaksi: "PENJUALAN", // Hanya ambil transaksi penjualan
    };

    // Tambahkan filter cabang jika ada
    if (cabang_id) {
      whereClause.cabang_id = cabang_id;
    }

    // Tambahkan filter tanggal jika ada
    if (tanggal_mulai && tanggal_akhir) {
      whereClause.tanggal = {
        gte: new Date(tanggal_mulai),
        lte: new Date(`${tanggal_akhir}T23:59:59.999Z`),
      };
    } else if (tanggal_mulai) {
      whereClause.tanggal = {
        gte: new Date(tanggal_mulai),
      };
    } else if (tanggal_akhir) {
      whereClause.tanggal = {
        lte: new Date(`${tanggal_akhir}T23:59:59.999Z`),
      };
    }

    return prisma.transaksi.findMany({
      where: whereClause,
      include: {
        pembayaran: {
          select: {
            pembayaran_id: true,
            status: true,
            transaksi_id: true,
            metode_pembayaran: true,
            jumlah_bayar: true,
            jumlah_kembali: true,
            provider: true,
            created_at: true,
          },
        },
        transaksi_detail: {
          include: {
            produk: {
              include: {
                produkMaster: {
                  select: {
                    id: true,
                    namaProduk: true,
                  }
                },
              },
            },
          },
        },
        cabang: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
      },
      orderBy: {
        tanggal: "desc",
      },
    });
  }

  /**
   * Menghitung ringkasan transaksi
   * @param {Array} transactions - Daftar transaksi
   * @param {Object} filters - Filter yang digunakan
   * @returns {Object} Ringkasan transaksi
   */
  static calculateSummary(transactions, filters) {
    const { tanggal_mulai, tanggal_akhir } = filters;

    // Hitung total penjualan
    const totalPenjualan = transactions.reduce(
      (sum, trans) => sum + Number(trans.total),
      0
    );

    // Ringkasan metode pembayaran
    const metode_pembayaran = {};
    transactions.forEach((trans) => {
      trans.pembayaran.forEach((payment) => {
        const method = payment.metode_pembayaran;
        if (!metode_pembayaran[method]) {
          metode_pembayaran[method] = 0;
        }
        metode_pembayaran[method] += Number(payment.jumlah_bayar || 0);
      });
    });

    return {
      total_transaksi: transactions.length,
      total_penjualan: totalPenjualan,
      rata_rata_nilai_transaksi:
        transactions.length > 0 ? totalPenjualan / transactions.length : 0,
      metode_pembayaran,
      periode: {
        tanggal_mulai: tanggal_mulai || "semua",
        tanggal_akhir: tanggal_akhir || "semua",
      },
    };
  }

  /**
   * Menghitung status pembayaran transaksi (lunas, belum lunas, dibatalkan)
   * @param {Array} transactions - Daftar transaksi
   * @returns {Object} Informasi status pembayaran
   */
  static calculatePaymentStatus(transactions) {
    const paymentStatus = {
      [PAYMENT_STATUS.LUNAS]: {
        count: 0,
        total: 0,
      },
      [PAYMENT_STATUS.BELUM_LUNAS]: {
        count: 0,
        total: 0,
      },
      [PAYMENT_STATUS.DIBATALKAN]: {
        count: 0,
        total: 0,
      },
    };

    transactions.forEach((trans) => {
      // Cek status transaksi dari pembayaran
      if (trans.status === "DIBATALKAN") {
        paymentStatus[PAYMENT_STATUS.DIBATALKAN].count++;
        paymentStatus[PAYMENT_STATUS.DIBATALKAN].total += Number(trans.total);
      } else {
        // Cek apakah pembayaran sudah lunas
        const totalPembayaran = trans.pembayaran.reduce(
          (sum, payment) => sum + Number(payment.jumlah_bayar || 0),
          0
        );
        
        // Jika total pembayaran >= total transaksi, maka lunas
        if (totalPembayaran >= Number(trans.total)) {
          paymentStatus[PAYMENT_STATUS.LUNAS].count++;
          paymentStatus[PAYMENT_STATUS.LUNAS].total += Number(trans.total);
        } else {
          paymentStatus[PAYMENT_STATUS.BELUM_LUNAS].count++;
          paymentStatus[PAYMENT_STATUS.BELUM_LUNAS].total += Number(trans.total);
        }
      }
    });

    return paymentStatus;
  }

  /**
   * Menghitung tren penjualan berdasarkan periode waktu
   * @param {Array} transactions - Daftar transaksi
   * @param {string} startDate - Tanggal awal
   * @param {string} endDate - Tanggal akhir
   * @returns {Array} Tren penjualan
   */
  static calculateSalesTrend(transactions, startDate, endDate) {
    // Jika tidak ada transaksi, kembalikan array kosong
    if (transactions.length === 0) {
      return [];
    }

    // Tentukan periode berdasarkan rentang tanggal
    let groupBy = "day";

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

      if (diffDays > 90) {
        groupBy = "month";
      } else if (diffDays > 30) {
        groupBy = "week";
      }
    }

    // Kelompokkan transaksi berdasarkan periode
    const trendMap = new Map();

    transactions.forEach((trans) => {
      const date = new Date(trans.tanggal);
      let key;

      if (groupBy === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else if (groupBy === "week") {
        // Hitung nomor minggu dalam tahun
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = `${date.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
          date.getDate()
        ).padStart(2, "0")}`;
      }

      if (!trendMap.has(key)) {
        trendMap.set(key, {
          periode: key,
          total_penjualan: 0,
          jumlah_transaksi: 0,
        });
      }

      const entry = trendMap.get(key);
      entry.total_penjualan += Number(trans.total);
      entry.jumlah_transaksi += 1;
    });

    // Konversi Map ke Array dan urutkan berdasarkan periode
    return Array.from(trendMap.values()).sort((a, b) => a.periode.localeCompare(b.periode));
  }

  /**
   * Menghitung distribusi transaksi per cabang
   * @param {Array} transactions - Daftar transaksi
   * @returns {Array} Distribusi transaksi per cabang
   */
  static calculateBranchDistribution(transactions) {
    const branchMap = new Map();

    transactions.forEach((trans) => {
      if (!trans.cabang) return;

      const branchId = trans.cabang.id;
      const branchName = trans.cabang.namaCabang;

      if (!branchMap.has(branchId)) {
        branchMap.set(branchId, {
          cabang_id: branchId,
          nama_cabang: branchName,
          total_penjualan: 0,
          jumlah_transaksi: 0,
        });
      }

      const branch = branchMap.get(branchId);
      branch.total_penjualan += Number(trans.total);
      branch.jumlah_transaksi += 1;
    });

    // Konversi Map ke Array dan urutkan berdasarkan total penjualan
    return Array.from(branchMap.values()).sort((a, b) => b.total_penjualan - a.total_penjualan);
  }

  /**
   * Mendapatkan produk terlaris
   * @param {Array} transactions - Daftar transaksi
   * @param {number} limit - Jumlah produk yang akan ditampilkan
   * @returns {Array} Daftar produk terlaris
   */
  static getTopProducts(transactions, limit = 10) {
    // Struktur data untuk menyimpan informasi produk per cabang
    const productBranchMap = new Map();
    
    // Struktur data untuk menyimpan data agregat produk
    const productMap = new Map();

    transactions.forEach((trans) => {
      if (!trans.cabang) return;
      
      const cabangId = trans.cabang.id;
      const cabangNama = trans.cabang.namaCabang;
      
      trans.transaksi_detail.forEach((detail) => {
        if (!detail.produk?.produkMaster) return;
        
        const produkId = detail.produk.produkMaster.id;
        const produkName = detail.produk.produkMaster.namaProduk;

        // Tambahkan produk ke data agregat
        if (!productMap.has(produkId)) {
          productMap.set(produkId, {
            produk_id: produkId,
            nama_produk: produkName,
            jumlah_terjual: 0,
            total_penjualan: 0,
            cabang_penjualan: [],
          });
        }

        // Update data agregat produk
        const product = productMap.get(produkId);
        product.jumlah_terjual += detail.jumlah;
        product.total_penjualan += Number(detail.total);

        // Buat kunci komposit untuk produk-cabang
        const produkCabangKey = `${produkId}-${cabangId}`;
        
        // Tambahkan atau update informasi produk per cabang
        if (!productBranchMap.has(produkCabangKey)) {
          productBranchMap.set(produkCabangKey, {
            produk_id: produkId,
            cabang_id: cabangId,
            nama_cabang: cabangNama,
            jumlah_terjual: 0,
            total_penjualan: 0,
          });
        }
        
        // Update data produk per cabang
        const branchProduct = productBranchMap.get(produkCabangKey);
        branchProduct.jumlah_terjual += detail.jumlah;
        branchProduct.total_penjualan += Number(detail.total);
      });
    });

    // Untuk setiap produk, tambahkan informasi penjualan per cabang
    for (const [produkId, product] of productMap.entries()) {
      // Filter productBranchMap untuk produk ini
      const branchesForProduct = Array.from(productBranchMap.values())
        .filter(item => item.produk_id === produkId)
        .sort((a, b) => b.total_penjualan - a.total_penjualan);
      
      // Tambahkan data cabang ke produk
      product.cabang_penjualan = branchesForProduct;
    }

    // Konversi Map ke Array, urutkan berdasarkan total penjualan, dan batasi jumlahnya
    return Array.from(productMap.values())
      .sort((a, b) => b.total_penjualan - a.total_penjualan)
      .slice(0, limit);
  }

  /**
   * Menghapus cache dashboard transaksi
   * @param {string} cabangId - ID cabang (opsional)
   * @returns {Promise<void>}
   */
  static async invalidateTransactionDashboardCache(cabangId = null) {
    const pattern = cabangId 
      ? createCacheKey(CACHE_KEYS.TRANSACTION_DASHBOARD, `${cabangId}-*`)
      : `${CACHE_KEYS.TRANSACTION_DASHBOARD}:*`;
    
    await cacheDeletePattern(pattern);
  }
}

module.exports = TransactionDashboardService;