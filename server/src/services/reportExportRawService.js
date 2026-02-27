const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a single ID — only alphanumeric, hyphens, and underscores allowed.
 */
function sanitizeId(value) {
  if (!value || typeof value !== "string") return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new ResponseError(`Invalid identifier value: ${value}`, 400);
  }
  return value;
}

/**
 * Build a SQL cabang filter supporting single or comma-separated multi-IDs.
 * e.g. "SSO-0001,BAE-0001" → AND t.cabang_id IN ('SSO-0001','BAE-0001')
 *
 * @param {string|null|undefined} cabangId
 * @param {string}                columnExpr  e.g. "t.cabang_id"
 * @returns {{ sql: string }}
 */
function buildCabangFilter(cabangId, columnExpr) {
  if (!cabangId || cabangId === "all") return { sql: "" };

  const ids = cabangId
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length === 0) return { sql: "" };

  ids.forEach(sanitizeId);

  if (ids.length === 1) {
    return { sql: `AND ${columnExpr} = '${ids[0]}'` };
  }

  const list = ids.map((id) => `'${id}'`).join(", ");
  return { sql: `AND ${columnExpr} IN (${list})` };
}

/**
 * Parse cabangId → PostgreSQL VARCHAR[] (or null for "all").
 * Used specifically for fn_report_profit_loss which accepts an array parameter.
 *
 * @param {string|null|undefined} cabangId
 * @returns {string[]|null}
 */
function parseCabangIds(cabangId) {
  if (!cabangId || cabangId === "all") return null;

  const ids = cabangId
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length === 0) return null;

  ids.forEach(sanitizeId); // reuse same validator

  return ids; // JS string[] → Prisma passes as PostgreSQL VARCHAR[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────
class ReportExportRawService {

  // ── Generic paginated streamer ─────────────────────────────────────────────
  static async *queryStreamer(queryStr, batchSize = 2500) {
    let offset = 0;
    while (true) {
      const queryWithLimit = `${queryStr} LIMIT ${batchSize} OFFSET ${offset}`;
      const rows = await prisma.withRls(tx => tx.$queryRawUnsafe(queryWithLimit));
      if (rows.length === 0) break;

      for (const row of rows) yield row;

      offset += batchSize;
      if (rows.length < batchSize) break;
    }
  }

  // ── Sales ──────────────────────────────────────────────────────────────────
  static getSalesDataStream(filters) {
    const { startDate, endDate, cabangId } = filters;
    const { sql: cabangFilter } = buildCabangFilter(cabangId, "t.cabang_id");

    const query = `
      SELECT
        t.tanggal,
        t.nomor_transaksi                  AS "nomorTransaksi",
        COALESCE(p.nama_pelanggan, 'Umum') AS pelanggan,
        COALESCE(c.nama_cabang, '-')       AS cabang,
        t.subtotal,
        t.diskon,
        t.diskon_member                    AS "diskonMember",
        t.total_diskon_final               AS "totalDiskonFinal",
        t.diskon_manual_persen             AS "diskonManualPersen",
        t.diskon_manual_nominal            AS "diskonManualNominal",
        t.diskon_manual_alasan             AS "diskonManualAlasan",
        t.loyalty_discount                 AS "loyaltyDiscount",
        t.points_earned                    AS "pointsEarned",
        t.points_redeemed                  AS "pointsRedeemed",
        t.pajak,
        t.total,
        t.status_pembayaran                AS status
      FROM transaksi t
      LEFT JOIN pelanggan p ON t.pelanggan_id = p.pelanggan_id
      LEFT JOIN cabang    c ON t.cabang_id    = c.cabang_id
      WHERE t.deleted_at IS NULL
        AND t.jenis_transaksi = 'PENJUALAN'
        AND t.tanggal >= '${startDate} 00:00:00'::timestamp
        AND t.tanggal <= '${endDate} 23:59:59'::timestamp
        ${cabangFilter}
      ORDER BY t.tanggal DESC
    `;
    return this.queryStreamer(query);
  }

  // ── Inventory ──────────────────────────────────────────────────────────────
  static getInventoryDataStream(filters) {
    const { cabangId } = filters;
    const { sql: cabangFilter } = buildCabangFilter(cabangId, "p.cabang_id");

    const query = `
      SELECT
        COALESCE(c.nama_cabang, '-')   AS cabang,
        pm.sku,
        pm.nama_produk                 AS "namaProduk",
        pm.satuan,
        pm.brand,
        COALESCE(k.nama_kategori, '-') AS kategori,
        p.stok                         AS "stokAkhir",
        p.harga_beli                   AS "hargaBeli",
        p.harga_jual                   AS "hargaJual",
        p.harga_grosir                 AS "hargaGrosir",
        (p.stok * p.harga_beli)        AS "nilaiStok"
      FROM produk p
      INNER JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
      LEFT JOIN  kategori      k  ON pm.kategori_id     = k.kategori_id
      LEFT JOIN  cabang        c  ON p.cabang_id        = c.cabang_id
      WHERE p.deleted_at IS NULL
        ${cabangFilter}
      ORDER BY pm.nama_produk ASC
    `;
    return this.queryStreamer(query);
  }

  // ── Inventory Health ───────────────────────────────────────────────────────
  static getInventoryHealthDataStream(filters) {
    const { cabangId } = filters;
    const { sql: cabangFilter } = buildCabangFilter(cabangId, "p.cabang_id");

    const query = `
      SELECT
        COALESCE(c.nama_cabang, '-')   AS cabang,
        pm.sku,
        pm.nama_produk                 AS "namaProduk",
        pm.satuan,
        p.stok                         AS "currentStock",
        p.min_stok                     AS "minStock",
        p.max_stok                     AS "maxStock",
        CASE
          WHEN p.stok <= 0                                      THEN 'Kosong'
          WHEN p.min_stok IS NOT NULL AND p.stok <= p.min_stok  THEN 'Menipis'
          WHEN p.max_stok IS NOT NULL AND p.stok >  p.max_stok  THEN 'Overstock'
          ELSE 'Sehat'
        END AS "statusKesehatan"
      FROM produk p
      INNER JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
      LEFT JOIN  cabang        c  ON p.cabang_id        = c.cabang_id
      WHERE p.deleted_at IS NULL
        ${cabangFilter}
    `;
    return this.queryStreamer(query);
  }

  // ── Profit & Loss ──────────────────────────────────────────────────────────
  //
  //  Berbeda dari method lain: data bersumber dari stored function PostgreSQL
  //  (fn_report_profit_loss) yang mengembalikan JSONB bertingkat, bukan tabel
  //  flat. Oleh karena itu method ini bersifat async generator (bukan delegate
  //  ke queryStreamer), dan melakukan flattening JSONB → baris P&L di sini.
  //
  //  Struktur output per baris:
  //    { cabang_id, nama_cabang, urutan, keterangan, nilai, pct, tipe }
  // ──────────────────────────────────────────────────────────────────────────
  static async *getProfitLossDataStream(filters) {
    const { startDate, endDate, cabangId } = filters;

    if (!startDate || !endDate) {
      throw new ResponseError("startDate dan endDate wajib diisi.", 400);
    }

    const cabangIds = parseCabangIds(cabangId);

    const [result] = await prisma.$queryRawUnsafe(
      `SELECT fn_report_profit_loss($1::date, $2::date, $3::varchar[]) AS payload`,
      startDate,
      endDate,
      cabangIds   // null → SQL NULL → semua cabang; string[] → array filter
    );

    const raw = result.payload;

    // Helper: build the 8 standard P&L line-item rows for one entity
    const buildSection = (cabangId, namaCabang, d) => [
      { cabang_id: cabangId, nama_cabang: namaCabang, urutan: 1, keterangan: "Gross Sales (Penjualan Kotor)", nilai:  d.gross_sales,      pct: null,               tipe: "revenue"      },
      { cabang_id: cabangId, nama_cabang: namaCabang, urutan: 2, keterangan: "Less: Retur Penjualan",         nilai: -d.total_retur,      pct: null,               tipe: "deduction"    },
      { cabang_id: cabangId, nama_cabang: namaCabang, urutan: 3, keterangan: "Less: Diskon",                  nilai: -d.total_diskon,     pct: null,               tipe: "deduction"    },
      { cabang_id: cabangId, nama_cabang: namaCabang, urutan: 4, keterangan: "Net Sales (Penjualan Bersih)",  nilai:  d.net_sales,        pct: null,               tipe: "subtotal"     },
      { cabang_id: cabangId, nama_cabang: namaCabang, urutan: 5, keterangan: "HPP (Harga Pokok Penjualan)",   nilai: -d.cogs,             pct: null,               tipe: "cogs"         },
      { cabang_id: cabangId, nama_cabang: namaCabang, urutan: 6, keterangan: "Laba Kotor",                    nilai:  d.gross_profit,     pct: d.gross_margin_pct, tipe: "gross_profit" },
      { cabang_id: cabangId, nama_cabang: namaCabang, urutan: 7, keterangan: "Pajak",                         nilai: -d.total_pajak,      pct: null,               tipe: "deduction"    },
      { cabang_id: cabangId, nama_cabang: namaCabang, urutan: 8, keterangan: "Laba Bersih",                   nilai:  d.net_profit,       pct: d.net_margin_pct,   tipe: "net_profit"   },
    ];

    const n = (v) => Number(v ?? 0);

    // Per-cabang rows
    for (const branch of raw.data?.by_cabang ?? []) {
      const d = {
        gross_sales:      n(branch.revenue_section.gross_sales),
        total_retur:      n(branch.revenue_section.less_retur),
        total_diskon:     n(branch.revenue_section.less_diskon),
        net_sales:        n(branch.revenue_section.net_sales),
        cogs:             n(branch.cogs_section.total_cogs),
        gross_profit:     n(branch.profit_section.gross_profit),
        gross_margin_pct: n(branch.profit_section.gross_margin_pct),
        total_pajak:      n(branch.tax_section.total_pajak),
        net_profit:       n(branch.net_profit),
        net_margin_pct:   n(branch.net_margin_pct),
      };
      for (const row of buildSection(branch.cabang_id, branch.nama_cabang, d)) yield row;
    }

    // Consolidated / TOTAL rows (always shown at the bottom)
    const con = raw.data?.consolidated;
    if (con) {
      const d = {
        gross_sales:      n(con.gross_sales),
        total_retur:      n(con.total_retur),
        total_diskon:     n(con.total_diskon),
        net_sales:        n(con.net_sales),
        cogs:             n(con.cogs),
        gross_profit:     n(con.gross_profit),
        gross_margin_pct: n(con.gross_margin_pct),
        total_pajak:      n(con.total_pajak),
        net_profit:       n(con.net_profit),
        net_margin_pct:   n(con.net_margin_pct),
      };
      for (const row of buildSection("TOTAL", "TOTAL (Semua Cabang)", d)) yield row;
    }
  }

  // ── Shift Performance ──────────────────────────────────────────────────────
  static getShiftPerformanceDataStream(filters) {
    const { startDate, endDate, cabangId } = filters;
    const { sql: cabangFilter } = buildCabangFilter(cabangId, "s.cabang_id");

    const query = `
      SELECT
        u.nama_lengkap  AS kasir,
        c.nama_cabang   AS cabang,
        s.waktu_mulai   AS "waktuMulai",
        s.waktu_selesai AS "waktuSelesai",
        s.kas_awal      AS "kasAwal",
        s.kas_akhir     AS "kasAkhir",
        s.total_pendapatan AS "totalPendapatan",
        s.total_transaksi  AS "totalTransaksi",
        (COALESCE(s.kas_akhir, 0) - COALESCE(s.kas_awal, 0) - COALESCE(s.total_pendapatan, 0)) AS "selisihKas",
        s.status
      FROM shift s
      LEFT JOIN "user" u ON s.user_id   = u.user_id
      LEFT JOIN cabang  c ON s.cabang_id = c.cabang_id
      WHERE s.waktu_mulai >= '${startDate} 00:00:00'::timestamp
        AND s.waktu_mulai <= '${endDate} 23:59:59'::timestamp
        ${cabangFilter}
      ORDER BY s.waktu_mulai DESC
    `;
    return this.queryStreamer(query);
  }

  // ── Financial Summary ──────────────────────────────────────────────────────
  static getFinancialDataStream(filters) {
    const { startDate, endDate, cabangId } = filters;
    const { sql: cabangFilter } = buildCabangFilter(cabangId, "cabang_id");

    const query = `
      SELECT
        tanggal,
        jenis_transaksi                                                 AS jenis,
        nomor_transaksi                                                 AS deskripsi,
        CASE WHEN jenis_transaksi = 'PENJUALAN' THEN total ELSE 0 END  AS pemasukan,
        CASE WHEN jenis_transaksi != 'PENJUALAN' THEN total ELSE 0 END AS pengeluaran
      FROM transaksi
      WHERE deleted_at IS NULL
        AND tanggal >= '${startDate} 00:00:00'::timestamp
        AND tanggal <= '${endDate} 23:59:59'::timestamp
        ${cabangFilter}
      ORDER BY tanggal ASC
    `;
    return this.queryStreamer(query);
  }

  // ── Promo / Discount ───────────────────────────────────────────────────────
  static getPromoDiscountDataStream(filters) {
    const { startDate, endDate, cabangId } = filters;
    const { sql: cabangFilter } = buildCabangFilter(cabangId, "t.cabang_id");

    const query = `
      SELECT
        pd.nama_promo                AS "namaPromo",
        pd.kode_promo                AS "kodePromo",
        pd.tipe_diskon               AS "tipeDiskon",
        CAST(pd.nilai_diskon AS INTEGER) AS "nilaiDiskon",
        CAST(COUNT(tp.transaksi_promo_id) AS INTEGER) AS "totalPenggunaan",
        CAST(SUM(tp.total_diskon) AS INTEGER) AS "totalDiskon"
      FROM transaksi_promo tp
      JOIN promo_diskon pd ON tp.promo_id     = pd.promo_id
      JOIN transaksi    t  ON tp.transaksi_id = t.transaksi_id
      WHERE t.deleted_at IS NULL
        AND t.tanggal >= '${startDate} 00:00:00'::timestamp
        AND t.tanggal <= '${endDate} 23:59:59'::timestamp
        ${cabangFilter}
      GROUP BY pd.promo_id, pd.nama_promo, pd.kode_promo, pd.tipe_diskon, pd.nilai_diskon
      ORDER BY "totalDiskon" DESC
    `;
    return this.queryStreamer(query);
  }

  // ── Low Stock ──────────────────────────────────────────────────────────────
  static getLowStockDataStream(filters) {
    const { cabangId } = filters;
    const { sql: cabangFilter } = buildCabangFilter(cabangId, "p.cabang_id");

    const query = `
      SELECT
        pm.sku,
        pm.nama_produk                 AS "namaProduk",
        COALESCE(k.nama_kategori, '-') AS kategori,
        p.min_stok                     AS "minStok",
        p.stok                         AS "stokTersisa",
        c.nama_cabang                  AS cabang
      FROM produk p
      JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
      LEFT JOIN kategori k ON pm.kategori_id = k.kategori_id
      LEFT JOIN cabang   c ON p.cabang_id    = c.cabang_id
      WHERE p.deleted_at IS NULL
        AND p.min_stok IS NOT NULL
        AND p.stok <= p.min_stok
        ${cabangFilter}
      ORDER BY p.stok ASC
    `;
    return this.queryStreamer(query);
  }

  // ── Customer Loyalty ───────────────────────────────────────────────────────
  static getCustomerLoyaltyDataStream(filters) {
    const { startDate, endDate, cabangId } = filters;
    const { sql: cabangFilter } = buildCabangFilter(cabangId, "t.cabang_id");

    const query = `
      SELECT
        p.nama_pelanggan      AS "namaPelanggan",
        p.email,
        p.telepon,
        p.segmen              AS "segmen",
        c.nama_cabang         AS "namaCabang",
        CAST(p.poin AS INTEGER) AS "poinSisa",
        CAST(COUNT(t.transaksi_id) AS INTEGER) AS "totalTransaksi",
        CAST(SUM(t.total) AS INTEGER) AS "totalBelanja"
      FROM pelanggan p
      JOIN transaksi t ON p.pelanggan_id = t.pelanggan_id
      JOIN cabang c ON t.cabang_id = c.cabang_id
      WHERE t.deleted_at IS NULL
        AND t.tanggal >= '${startDate} 00:00:00'::timestamp
        AND t.tanggal <= '${endDate} 23:59:59'::timestamp
        ${cabangFilter}
      GROUP BY p.pelanggan_id, p.nama_pelanggan, p.telepon, p.poin, p.email, c.nama_cabang
      ORDER BY "totalBelanja" DESC
    `;
    return this.queryStreamer(query);
  }

  // ── Transaction Detail ─────────────────────────────────────────────────────
  static getTransactionDetailDataStream(filters) {
    const { startDate, endDate, cabangId } = filters;
    const { sql: cabangFilter } = buildCabangFilter(cabangId, "t.cabang_id");

    const query = `
      SELECT
        t.tanggal,
        t.nomor_transaksi                  AS "nomorTransaksi",
        COALESCE(p.nama_pelanggan, 'Umum') AS pelanggan,
        pm.nama_produk                     AS "namaProduk",
        td.jumlah                          AS qty,
        td.harga_satuan                    AS "hargaSatuan",
        td.diskon_nominal                  AS "diskonLine",
        td.total                           AS "totalLine"
      FROM transaksi t
      JOIN transaksi_detail td ON t.transaksi_id      = td.transaksi_id
      JOIN produk          pr  ON td.produk_id        = pr.produk_id
      JOIN produk_master   pm  ON pr.produk_master_id = pm.produk_master_id
      LEFT JOIN pelanggan  p   ON t.pelanggan_id      = p.pelanggan_id
      WHERE t.deleted_at IS NULL
        AND t.tanggal >= '${startDate} 00:00:00'::timestamp
        AND t.tanggal <= '${endDate} 23:59:59'::timestamp
        ${cabangFilter}
      ORDER BY t.tanggal DESC
    `;
    return this.queryStreamer(query);
  }
}

module.exports = ReportExportRawService;