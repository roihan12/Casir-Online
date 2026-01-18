-- Materialized views for financial reporting dashboard

-- 1. Daily Financial Summary View (Overview)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_financial_summary AS
WITH transaction_data AS (
  SELECT
    COALESCE(t.cabang_id, 'all') AS cabang_id,
    DATE(t.tanggal) AS transaction_date,
    t.jenis_transaksi,
    SUM(t.total) AS total_amount,
    SUM(t.subtotal) AS subtotal_amount,
    SUM(t.diskon) AS discount_amount,
    SUM(t.pajak) AS tax_amount,
    SUM(t.biaya_tambahan) AS additional_fees,
    COUNT(t.transaksi_id) AS transaction_count
  FROM
    transaksi t
  WHERE
    t.deleted_at IS NULL
    AND t.status_pembayaran != 'DIBATALKAN'
  GROUP BY
    ROLLUP(t.cabang_id), DATE(t.tanggal), t.jenis_transaksi
)
SELECT
  td.cabang_id,
  td.transaction_date,
  SUM(CASE WHEN td.jenis_transaksi = 'PENJUALAN' THEN td.total_amount ELSE 0 END) AS total_pendapatan,
  SUM(CASE WHEN td.jenis_transaksi = 'PEMBELIAN' THEN td.total_amount ELSE 0 END) AS total_pengeluaran,
  SUM(CASE WHEN td.jenis_transaksi = 'PENJUALAN' THEN td.total_amount ELSE 0 END) - 
  SUM(CASE WHEN td.jenis_transaksi = 'PEMBELIAN' THEN td.total_amount ELSE 0 END) AS keuntungan_bersih,
  CASE 
    WHEN SUM(CASE WHEN td.jenis_transaksi = 'PENJUALAN' THEN td.total_amount ELSE 0 END) > 0 
    THEN ROUND(
      (SUM(CASE WHEN td.jenis_transaksi = 'PENJUALAN' THEN td.total_amount ELSE 0 END) - 
       SUM(CASE WHEN td.jenis_transaksi = 'PEMBELIAN' THEN td.total_amount ELSE 0 END)) * 100.0 / 
      SUM(CASE WHEN td.jenis_transaksi = 'PENJUALAN' THEN td.total_amount ELSE 0 END), 2)
    ELSE 0
  END AS margin_keuntungan,
  SUM(CASE WHEN td.jenis_transaksi = 'PENJUALAN' THEN td.tax_amount ELSE 0 END) AS total_pajak,
  SUM(CASE WHEN td.jenis_transaksi = 'PENJUALAN' THEN td.additional_fees ELSE 0 END) AS total_biaya_layanan,
  SUM(CASE WHEN td.jenis_transaksi = 'PENJUALAN' THEN td.transaction_count ELSE 0 END) AS total_transaksi_penjualan,
  SUM(CASE WHEN td.jenis_transaksi = 'PEMBELIAN' THEN td.transaction_count ELSE 0 END) AS total_transaksi_pembelian,
  NOW() AS last_updated
FROM
  transaction_data td
GROUP BY
  td.cabang_id, td.transaction_date
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_financial_summary_cabang_id ON mv_financial_summary(cabang_id);
CREATE INDEX IF NOT EXISTS idx_mv_financial_summary_date ON mv_financial_summary(transaction_date);

-- 2. Payment Method Summary View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_payment_method_summary AS
WITH payment_data AS (
  SELECT
    COALESCE(t.cabang_id, 'all') AS cabang_id,
    DATE(t.tanggal) AS transaction_date,
    p.metode_pembayaran,
    SUM(p.jumlah_bayar) AS total_amount,
    COUNT(p.pembayaran_id) AS transaction_count
  FROM
    transaksi t
  JOIN
    pembayaran p ON t.transaksi_id = p.transaksi_id
  WHERE
    t.deleted_at IS NULL
    AND t.status_pembayaran != 'DIBATALKAN'
    AND p.status = 'SUKSES'
    AND t.jenis_transaksi = 'PENJUALAN'
  GROUP BY
    ROLLUP(t.cabang_id), DATE(t.tanggal), p.metode_pembayaran
)
SELECT
  pd.cabang_id,
  pd.transaction_date,
  pd.metode_pembayaran,
  pd.total_amount,
  pd.transaction_count,
  SUM(pd.total_amount) OVER (PARTITION BY pd.cabang_id, pd.transaction_date) AS total_daily_payments,
  CASE 
    WHEN SUM(pd.total_amount) OVER (PARTITION BY pd.cabang_id, pd.transaction_date) > 0 
    THEN ROUND(pd.total_amount * 100.0 / SUM(pd.total_amount) OVER (PARTITION BY pd.cabang_id, pd.transaction_date), 2)
    ELSE 0
  END AS percentage,
  NOW() AS last_updated
FROM
  payment_data pd
WHERE
  pd.metode_pembayaran IS NOT NULL
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_payment_method_summary_cabang_id ON mv_payment_method_summary(cabang_id);
CREATE INDEX IF NOT EXISTS idx_mv_payment_method_summary_date ON mv_payment_method_summary(transaction_date);
CREATE INDEX IF NOT EXISTS idx_mv_payment_method_summary_method ON mv_payment_method_summary(metode_pembayaran);

-- 3. Daily Revenue and Expenses Trend View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_financial_daily_trend AS
WITH daily_data AS (
  SELECT
    COALESCE(t.cabang_id, 'all') AS cabang_id,
    DATE(t.tanggal) AS transaction_date,
    t.jenis_transaksi,
    SUM(t.total) AS total_amount
  FROM
    transaksi t
  WHERE
    t.deleted_at IS NULL
    AND t.status_pembayaran != 'DIBATALKAN'
    AND t.tanggal >= CURRENT_DATE - INTERVAL '60 days'
  GROUP BY
    ROLLUP(t.cabang_id), DATE(t.tanggal), t.jenis_transaksi
)
SELECT
  dd.cabang_id,
  dd.transaction_date,
  SUM(CASE WHEN dd.jenis_transaksi = 'PENJUALAN' THEN dd.total_amount ELSE 0 END) AS pendapatan,
  SUM(CASE WHEN dd.jenis_transaksi = 'PEMBELIAN' THEN dd.total_amount ELSE 0 END) AS pengeluaran,
  SUM(CASE WHEN dd.jenis_transaksi = 'PENJUALAN' THEN dd.total_amount ELSE 0 END) - 
  SUM(CASE WHEN dd.jenis_transaksi = 'PEMBELIAN' THEN dd.total_amount ELSE 0 END) AS keuntungan,
  NOW() AS last_updated
FROM
  daily_data dd
GROUP BY
  dd.cabang_id, dd.transaction_date
ORDER BY
  dd.transaction_date
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_financial_daily_trend_cabang_id ON mv_financial_daily_trend(cabang_id);
CREATE INDEX IF NOT EXISTS idx_mv_financial_daily_trend_date ON mv_financial_daily_trend(transaction_date);

-- 4. Detailed Revenue and Expenses View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_financial_detail AS
WITH transaction_detail AS (
  SELECT
    t.transaksi_id,
    t.cabang_id,
    t.jenis_transaksi,
    t.nomor_transaksi,
    DATE(t.tanggal) AS transaction_date,
    t.status_pembayaran,
    t.total,
    t.subtotal,
    t.diskon,
    t.pajak,
    t.biaya_tambahan,
    t.pelanggan_id,
    t.supplier_id,
    p.namaPelanggan AS nama_pelanggan,
    s.namaSupplier AS nama_supplier,
    CASE
      WHEN t.jenis_transaksi = 'PENJUALAN' THEN t.total
      ELSE 0
    END AS pendapatan,
    CASE
      WHEN t.jenis_transaksi = 'PEMBELIAN' THEN t.total
      ELSE 0
    END AS pengeluaran,
    CASE 
      WHEN t.jenis_transaksi = 'PENJUALAN' THEN t.total - COALESCE(cogs.total_cost, 0)
      ELSE 0
    END AS keuntungan,
    CASE 
      WHEN t.jenis_transaksi = 'PENJUALAN' AND t.total > 0 
      THEN ROUND(((t.total - COALESCE(cogs.total_cost, 0)) * 100.0 / t.total), 2)
      ELSE 0
    END AS margin_persen
  FROM
    transaksi t
  LEFT JOIN
    pelanggan p ON t.pelanggan_id = p.id
  LEFT JOIN
    supplier s ON t.supplier_id = s.id
  LEFT JOIN (
    -- Calculate Cost of Goods Sold (COGS) for each transaction
    SELECT
      td.transaksi_id,
      SUM(td.jumlah * p.hargaBeli) AS total_cost
    FROM
      transaksi_detail td
    JOIN
      produk p ON td.produk_id = p.id
    GROUP BY
      td.transaksi_id
  ) cogs ON t.transaksi_id = cogs.transaksi_id
  WHERE
    t.deleted_at IS NULL
    AND t.status_pembayaran != 'DIBATALKAN'
)
SELECT
  td.transaksi_id,
  COALESCE(td.cabang_id, 'all') AS cabang_id,
  td.jenis_transaksi,
  td.nomor_transaksi,
  td.transaction_date,
  td.status_pembayaran,
  td.total,
  td.subtotal,
  td.diskon,
  td.pajak,
  td.biaya_tambahan,
  td.pendapatan,
  td.pengeluaran,
  td.keuntungan,
  td.margin_persen,
  td.pelanggan_id,
  td.supplier_id,
  td.nama_pelanggan,
  td.nama_supplier,
  NOW() AS last_updated
FROM
  transaction_detail td
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_financial_detail_cabang_id ON mv_financial_detail(cabang_id);
CREATE INDEX IF NOT EXISTS idx_mv_financial_detail_date ON mv_financial_detail(transaction_date);
CREATE INDEX IF NOT EXISTS idx_mv_financial_detail_jenis ON mv_financial_detail(jenis_transaksi);

-- 5. Expense Analysis by Category View (for Bar Chart)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_expense_analysis AS
WITH expense_data AS (
  SELECT
    COALESCE(t.cabang_id, 'all') AS cabang_id,
    CASE
      WHEN td.produk_id IS NOT NULL THEN 'Pembelian Stok'
      ELSE 'Lainnya'
    END AS expense_category,
    SUM(td.total) AS total_amount
  FROM
    transaksi t
  JOIN
    transaksi_detail td ON t.transaksi_id = td.transaksi_id
  LEFT JOIN
    produk p ON td.produk_id = p.id
  LEFT JOIN
    produkMaster pm ON p.produkMasterId = pm.id
  WHERE
    t.deleted_at IS NULL
    AND t.status_pembayaran != 'DIBATALKAN'
    AND t.jenis_transaksi = 'PEMBELIAN'
  GROUP BY
    ROLLUP(t.cabang_id), 
    CASE
      WHEN td.produk_id IS NOT NULL THEN 'Pembelian Stok'
      ELSE 'Lainnya'
    END
  
  UNION ALL
  
  -- Additional expense categories from employee payroll
  SELECT
    COALESCE(t.cabang_id, 'all') AS cabang_id,
    'Gaji Karyawan' AS expense_category,
    SUM(t.total) AS total_amount
  FROM
    transaksi t
  WHERE
    t.deleted_at IS NULL
    AND t.status_pembayaran != 'DIBATALKAN'
    AND t.jenis_transaksi = 'PEMBELIAN'
    AND t.keterangan LIKE '%gaji%'
  GROUP BY
    ROLLUP(t.cabang_id)
  
  UNION ALL
  
  -- Operational expenses like utilities
  SELECT
    COALESCE(t.cabang_id, 'all') AS cabang_id,
    'Utilitas' AS expense_category,
    SUM(t.total) AS total_amount
  FROM
    transaksi t
  WHERE
    t.deleted_at IS NULL
    AND t.status_pembayaran != 'DIBATALKAN'
    AND t.jenis_transaksi = 'PEMBELIAN'
    AND (t.keterangan LIKE '%listrik%' OR t.keterangan LIKE '%air%' OR t.keterangan LIKE '%utilitas%')
  GROUP BY
    ROLLUP(t.cabang_id)
  
  UNION ALL
  
  -- Rent expenses
  SELECT
    COALESCE(t.cabang_id, 'all') AS cabang_id,
    'Sewa' AS expense_category,
    SUM(t.total) AS total_amount
  FROM
    transaksi t
  WHERE
    t.deleted_at IS NULL
    AND t.status_pembayaran != 'DIBATALKAN'
    AND t.jenis_transaksi = 'PEMBELIAN'
    AND (t.keterangan LIKE '%sewa%' OR t.keterangan LIKE '%gedung%')
  GROUP BY
    ROLLUP(t.cabang_id)
  
  UNION ALL
  
  -- Marketing expenses
  SELECT
    COALESCE(t.cabang_id, 'all') AS cabang_id,
    'Pemasaran' AS expense_category,
    SUM(t.total) AS total_amount
  FROM
    transaksi t
  WHERE
    t.deleted_at IS NULL
    AND t.status_pembayaran != 'DIBATALKAN'
    AND t.jenis_transaksi = 'PEMBELIAN'
    AND (t.keterangan LIKE '%marketing%' OR t.keterangan LIKE '%iklan%' OR t.keterangan LIKE '%promosi%')
  GROUP BY
    ROLLUP(t.cabang_id)
)
SELECT
  ed.cabang_id,
  ed.expense_category,
  COALESCE(ed.total_amount, 0) AS total_amount,
  SUM(ed.total_amount) OVER (PARTITION BY ed.cabang_id) AS total_expenses,
  CASE 
    WHEN SUM(ed.total_amount) OVER (PARTITION BY ed.cabang_id) > 0 
    THEN ROUND(ed.total_amount * 100.0 / SUM(ed.total_amount) OVER (PARTITION BY ed.cabang_id), 2)
    ELSE 0
  END AS percentage,
  NOW() AS last_updated
FROM
  expense_data ed
WHERE
  ed.expense_category IS NOT NULL
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_expense_analysis_cabang_id ON mv_expense_analysis(cabang_id);
CREATE INDEX IF NOT EXISTS idx_mv_expense_analysis_category ON mv_expense_analysis(expense_category);

-- 6. Tax and Additional Fees View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_tax_and_fees AS
WITH tax_data AS (
  SELECT
    COALESCE(t.cabang_id, 'all') AS cabang_id,
    SUM(t.pajak) AS total_tax,
    SUM(t.biaya_tambahan) AS total_fees,
    SUM(t.total) AS total_sales,
    COUNT(t.transaksi_id) AS transaction_count
  FROM
    transaksi t
  WHERE
    t.deleted_at IS NULL
    AND t.status_pembayaran != 'DIBATALKAN'
    AND t.jenis_transaksi = 'PENJUALAN'
  GROUP BY
    ROLLUP(t.cabang_id)
)
SELECT
  td.cabang_id,
  td.total_tax,
  td.total_fees,
  td.total_sales,
  td.transaction_count,
  CASE 
    WHEN td.total_sales > 0 
    THEN ROUND(td.total_tax * 100.0 / td.total_sales, 2)
    ELSE 0
  END AS tax_percentage,
  CASE 
    WHEN td.total_sales > 0 
    THEN ROUND(td.total_fees * 100.0 / td.total_sales, 2)
    ELSE 0
  END AS fees_percentage,
  NOW() AS last_updated
FROM
  tax_data td
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_tax_and_fees_cabang_id ON mv_tax_and_fees(cabang_id);

-- 7. Transaction Fees by Payment Method View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_transaction_fees_by_payment AS
WITH payment_fees AS (
  SELECT
    COALESCE(t.cabang_id, 'all') AS cabang_id,
    p.metode_pembayaran,
    COUNT(p.pembayaran_id) AS transaction_count,
    SUM(p.jumlah_bayar) AS total_amount,
    -- Simulate transaction fees based on payment method
    CASE
      WHEN p.metode_pembayaran = 'TUNAI' THEN SUM(p.jumlah_bayar) * 0.0095 -- 0.95% for cash handling
      WHEN p.metode_pembayaran = 'TRANSFER' THEN SUM(p.jumlah_bayar) * 0.0217 -- 2.17% for bank transfers
      WHEN p.metode_pembayaran = 'KARTU_DEBIT' THEN SUM(p.jumlah_bayar) * 0.0205 -- 2.05% for debit cards
      WHEN p.metode_pembayaran = 'KARTU_KREDIT' THEN SUM(p.jumlah_bayar) * 0.0178 -- 1.78% for credit cards
      WHEN p.metode_pembayaran = 'QRIS' THEN SUM(p.jumlah_bayar) * 0.0252 -- 2.52% for QRIS
      WHEN p.metode_pembayaran = 'E_WALLET' THEN SUM(p.jumlah_bayar) * 0.0307 -- 3.07% for e-wallets
      ELSE SUM(p.jumlah_bayar) * 0.02 -- 2% default
    END AS transaction_fees
  FROM
    transaksi t
  JOIN
    pembayaran p ON t.transaksi_id = p.transaksi_id
  WHERE
    t.deleted_at IS NULL
    AND t.status_pembayaran != 'DIBATALKAN'
    AND p.status = 'SUKSES'
    AND t.jenis_transaksi = 'PENJUALAN'
  GROUP BY
    ROLLUP(t.cabang_id), p.metode_pembayaran
)
SELECT
  pf.cabang_id,
  pf.metode_pembayaran,
  pf.transaction_count,
  pf.total_amount,
  pf.transaction_fees,
  CASE 
    WHEN pf.total_amount > 0 
    THEN ROUND(pf.transaction_fees * 100.0 / pf.total_amount, 2)
    ELSE 0
  END AS fee_percentage,
  NOW() AS last_updated
FROM
  payment_fees pf
WHERE
  pf.metode_pembayaran IS NOT NULL
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_transaction_fees_payment_cabang_id ON mv_transaction_fees_by_payment(cabang_id);
CREATE INDEX IF NOT EXISTS idx_mv_transaction_fees_payment_method ON mv_transaction_fees_by_payment(metode_pembayaran);

-- Create function to refresh all financial report materialized views
CREATE OR REPLACE FUNCTION refresh_financial_materialized_views()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_payment_method_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_daily_trend;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_detail;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_expense_analysis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tax_and_fees;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_transaction_fees_by_payment;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh the views when relevant tables are modified
DROP TRIGGER IF EXISTS refresh_financial_views_transaksi ON transaksi;
CREATE TRIGGER refresh_financial_views_transaksi
AFTER INSERT OR UPDATE OR DELETE ON transaksi
FOR EACH STATEMENT EXECUTE FUNCTION refresh_financial_materialized_views();

DROP TRIGGER IF EXISTS refresh_financial_views_pembayaran ON pembayaran;
CREATE TRIGGER refresh_financial_views_pembayaran
AFTER INSERT OR UPDATE OR DELETE ON pembayaran
FOR EACH STATEMENT EXECUTE FUNCTION refresh_financial_materialized_views();

DROP TRIGGER IF EXISTS refresh_financial_views_transaksi_detail ON transaksi_detail;
CREATE TRIGGER refresh_financial_views_transaksi_detail
AFTER INSERT OR UPDATE OR DELETE ON transaksi_detail
FOR EACH STATEMENT EXECUTE FUNCTION refresh_financial_materialized_views(); 