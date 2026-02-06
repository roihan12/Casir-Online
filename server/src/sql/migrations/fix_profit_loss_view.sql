-- ============================================================================
-- Migration: Fix mv_profit_loss_report Double-Counting Issue
-- Date: 2026-02-06
-- Description: 
--   Fix ROLLUP placement in expense_details CTE to prevent double-counting
--   Change pattern matching to case-insensitive (ILIKE)
-- ============================================================================

-- Step 1: Drop existing materialized view
DROP MATERIALIZED VIEW IF EXISTS public.mv_profit_loss_report CASCADE;

-- Step 2: Recreate with fixed logic
CREATE MATERIALIZED VIEW public.mv_profit_loss_report
TABLESPACE pg_default
AS 
-- Revenue data (unchanged, already correct)
WITH revenue_data AS (
  SELECT 
    COALESCE(t.cabang_id, 'all'::character varying) AS cabang_id,
    date_trunc('month', t.tanggal) AS period_month,
    sum(t.total) AS total_revenue,
    sum(t.subtotal) AS subtotal_revenue,
    sum(t.diskon) AS total_discount,
    sum(t.pajak) AS total_tax,
    sum(t.biaya_tambahan) AS total_additional_fees,
    count(t.transaksi_id) AS transaction_count
  FROM transaksi t
  WHERE t.jenis_transaksi = 'PENJUALAN' 
    AND t.deleted_at IS NULL 
    AND t.status_pembayaran <> 'DIBATALKAN'
  GROUP BY ROLLUP(t.cabang_id), date_trunc('month', t.tanggal)
),
-- FIX 1: Remove ROLLUP from expense_details, only group by actual data
expense_details AS (
  SELECT 
    t.cabang_id,  -- No COALESCE here, keep actual cabang_id
    date_trunc('month', t.tanggal) AS period_month,
    CASE
      WHEN td.produk_id IS NOT NULL THEN 'Pembelian Stok'
      -- FIX 2: Use ILIKE for case-insensitive matching
      WHEN t.keterangan ILIKE '%gaji%' THEN 'Gaji Karyawan'
      WHEN t.keterangan ILIKE '%sewa%' OR t.keterangan ILIKE '%gedung%' THEN 'Sewa'
      WHEN t.keterangan ILIKE '%listrik%' OR t.keterangan ILIKE '%air%' OR t.keterangan ILIKE '%utilitas%' THEN 'Utilitas'
      WHEN t.keterangan ILIKE '%marketing%' OR t.keterangan ILIKE '%iklan%' OR t.keterangan ILIKE '%promosi%' THEN 'Pemasaran'
      ELSE 'Lainnya'
    END AS expense_category,
    sum(COALESCE(td.total, t.total)) AS total_expense
  FROM transaksi t
    LEFT JOIN transaksi_detail td ON t.transaksi_id = td.transaksi_id
  WHERE t.jenis_transaksi = 'PEMBELIAN' 
    AND t.deleted_at IS NULL 
    AND t.status_pembayaran <> 'DIBATALKAN'
  GROUP BY 
    t.cabang_id, 
    date_trunc('month', t.tanggal),
    CASE
      WHEN td.produk_id IS NOT NULL THEN 'Pembelian Stok'
      WHEN t.keterangan ILIKE '%gaji%' THEN 'Gaji Karyawan'
      WHEN t.keterangan ILIKE '%sewa%' OR t.keterangan ILIKE '%gedung%' THEN 'Sewa'
      WHEN t.keterangan ILIKE '%listrik%' OR t.keterangan ILIKE '%air%' OR t.keterangan ILIKE '%utilitas%' THEN 'Utilitas'
      WHEN t.keterangan ILIKE '%marketing%' OR t.keterangan ILIKE '%iklan%' OR t.keterangan ILIKE '%promosi%' THEN 'Pemasaran'
      ELSE 'Lainnya'
    END
),
-- FIX 3: Apply ROLLUP only at summary level to avoid double-counting
expense_summary AS (
  SELECT 
    COALESCE(cabang_id, 'all'::character varying) AS cabang_id,
    period_month,
    sum(total_expense) AS total_expenses
  FROM expense_details
  GROUP BY ROLLUP(cabang_id), period_month
),
-- COGS data (unchanged, already correct)
cogs_data AS (
  SELECT 
    COALESCE(t.cabang_id, 'all'::character varying) AS cabang_id,
    date_trunc('month', t.tanggal) AS period_month,
    sum(td.jumlah::numeric * p.harga_beli) AS total_cogs
  FROM transaksi t
    JOIN transaksi_detail td ON t.transaksi_id = td.transaksi_id
    JOIN produk p ON td.produk_id = p.produk_id
  WHERE t.jenis_transaksi = 'PENJUALAN' 
    AND t.deleted_at IS NULL 
    AND t.status_pembayaran <> 'DIBATALKAN'
  GROUP BY ROLLUP(t.cabang_id), date_trunc('month', t.tanggal)
)
-- Final SELECT: Combine all CTEs
SELECT 
  COALESCE(r.cabang_id, e.cabang_id, c.cabang_id, 'all'::character varying) AS cabang_id,
  COALESCE(r.period_month, e.period_month, c.period_month) AS period_month,
  COALESCE(r.total_revenue, 0::numeric) AS total_revenue,
  COALESCE(r.subtotal_revenue, 0::numeric) AS subtotal_revenue,
  COALESCE(r.total_discount, 0::numeric) AS total_discount,
  COALESCE(r.total_tax, 0::numeric) AS total_tax,
  COALESCE(r.total_additional_fees, 0::numeric) AS total_additional_fees,
  COALESCE(r.transaction_count, 0::bigint) AS sales_transaction_count,
  COALESCE(c.total_cogs, 0::numeric) AS total_cogs,
  -- Gross Profit = Revenue - COGS
  COALESCE(r.total_revenue, 0::numeric) - COALESCE(c.total_cogs, 0::numeric) AS gross_profit,
  -- Gross Profit Margin %
  CASE
    WHEN COALESCE(r.total_revenue, 0::numeric) > 0 
    THEN round(
      (COALESCE(r.total_revenue, 0::numeric) - COALESCE(c.total_cogs, 0::numeric)) 
      * 100.0 / COALESCE(r.total_revenue, 0::numeric), 
      2
    )
    ELSE 0::numeric
  END AS gross_profit_margin,
  COALESCE(e.total_expenses, 0::numeric) AS total_operating_expenses,
  -- Net Profit = Revenue - COGS - Operating Expenses
  COALESCE(r.total_revenue, 0::numeric) 
    - COALESCE(c.total_cogs, 0::numeric) 
    - COALESCE(e.total_expenses, 0::numeric) AS net_profit,
  -- Net Profit Margin %
  CASE
    WHEN COALESCE(r.total_revenue, 0::numeric) > 0 
    THEN round(
      (COALESCE(r.total_revenue, 0::numeric) 
        - COALESCE(c.total_cogs, 0::numeric) 
        - COALESCE(e.total_expenses, 0::numeric)) 
      * 100.0 / COALESCE(r.total_revenue, 0::numeric), 
      2
    )
    ELSE 0::numeric
  END AS net_profit_margin,
  now() AS last_updated
FROM revenue_data r
  FULL JOIN expense_summary e 
    ON r.cabang_id = e.cabang_id 
    AND r.period_month = e.period_month
  FULL JOIN cogs_data c 
    ON r.cabang_id = c.cabang_id 
    AND r.period_month = c.period_month
WHERE COALESCE(r.period_month, e.period_month, c.period_month) IS NOT NULL
WITH DATA;

-- Step 3: Recreate indexes
CREATE INDEX idx_mv_profit_loss_cabang_id 
  ON public.mv_profit_loss_report 
  USING btree (cabang_id);

CREATE INDEX idx_mv_profit_loss_period 
  ON public.mv_profit_loss_report 
  USING btree (period_month);

CREATE UNIQUE INDEX idx_mv_profit_loss_unique 
  ON public.mv_profit_loss_report 
  USING btree (cabang_id, period_month);

-- Step 4: Add comment for documentation
COMMENT ON MATERIALIZED VIEW public.mv_profit_loss_report IS 
'Profit & Loss Report aggregated by month and branch. 
Fixed version (2026-02-06): Removed ROLLUP from expense_details to prevent double-counting.
Refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_profit_loss_report;';

-- Step 5: Grant permissions (adjust as needed)
-- GRANT SELECT ON public.mv_profit_loss_report TO your_app_user;

-- Step 6: Initial refresh
REFRESH MATERIALIZED VIEW public.mv_profit_loss_report;

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify the fix worked:
-- SELECT 
--   cabang_id,
--   period_month,
--   total_revenue,
--   total_operating_expenses,
--   net_profit
-- FROM mv_profit_loss_report
-- WHERE cabang_id = 'all'
-- ORDER BY period_month DESC
-- LIMIT 5;
