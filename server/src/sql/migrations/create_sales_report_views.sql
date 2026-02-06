-- ============================================================================
-- SALES REPORT OPTIMIZATION - MATERIALIZED VIEW & REGULAR VIEW
-- ============================================================================
-- This migration creates optimized views for sales reporting with multi-branch support
-- Created: 2026-02-06
-- Author: System

-- ============================================================================
-- 1. MATERIALIZED VIEW: Daily Sales Summary (Pre-aggregated)
-- ============================================================================
-- Purpose: Fast access to daily sales aggregations
-- Refresh: Should be refreshed daily (see refresh function below)
-- Performance: Excellent for dashboard cards and summary metrics

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_sales_daily_summary AS
WITH daily_sales AS (
  SELECT 
    DATE(tanggal) as sale_date,
    cabang_id,
    COUNT(transaksi_id) as transaction_count,
    SUM(subtotal) as total_subtotal,
    SUM(diskon) as total_discount,
    SUM(pajak) as total_tax,
    SUM(biaya_tambahan) as total_additional_fees,
    SUM(total) as total_sales,
    AVG(total) as avg_transaction,
    MIN(total) as min_transaction,
    MAX(total) as max_transaction
  FROM transaksi
  WHERE deleted_at IS NULL 
    AND jenis_transaksi = 'PENJUALAN'
    AND status_pembayaran <> 'DIBATALKAN'
  GROUP BY DATE(tanggal), cabang_id
),
rollup_summary AS (
  SELECT 
    sale_date,
    COALESCE(cabang_id, 'all') as cabang_id,
    SUM(transaction_count) as transaction_count,
    SUM(total_subtotal) as total_subtotal,
    SUM(total_discount) as total_discount,
    SUM(total_tax) as total_tax,
    SUM(total_additional_fees) as total_additional_fees,
    SUM(total_sales) as total_sales,
    AVG(avg_transaction) as avg_transaction,
    MIN(min_transaction) as min_transaction,
    MAX(max_transaction) as max_transaction
  FROM daily_sales
  GROUP BY ROLLUP(sale_date, cabang_id)
)
SELECT 
  sale_date,
  cabang_id,
  transaction_count,
  total_subtotal,
  total_discount,
  total_tax,
  total_additional_fees,
  total_sales,
  avg_transaction,
  min_transaction,
  max_transaction,
  NOW() as last_updated
FROM rollup_summary
WHERE sale_date IS NOT NULL;

-- Create unique index for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sales_daily_summary_unique 
  ON mv_sales_daily_summary(sale_date, cabang_id);

-- Create additional indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_mv_sales_daily_summary_date 
  ON mv_sales_daily_summary(sale_date);

CREATE INDEX IF NOT EXISTS idx_mv_sales_daily_summary_cabang 
  ON mv_sales_daily_summary(cabang_id);

CREATE INDEX IF NOT EXISTS idx_mv_sales_daily_summary_date_range
  ON mv_sales_daily_summary(sale_date, cabang_id, total_sales);

-- ============================================================================
-- 2. REGULAR VIEW: Sales Report with Flexible Filtering
-- ============================================================================
-- Purpose: Always-fresh data for transaction lists with joins
-- Performance: Fast with proper indexes on base tables

CREATE OR REPLACE VIEW v_sales_report AS
SELECT 
  t.transaksi_id,
  t.tanggal,
  DATE(t.tanggal) as sale_date,
  t.cabang_id,
  c.nama_cabang as cabang_nama,
  t.pelanggan_id,
  p.nama_pelanggan,
  t.subtotal,
  t.diskon,
  t.pajak,
  t.biaya_tambahan,
  t.total,
  t.status_pembayaran,
  t.jenis_transaksi,
  t.created_at,
  t.updated_at
FROM transaksi t
LEFT JOIN cabang c ON t.cabang_id = c.cabang_id
LEFT JOIN pelanggan p ON t.pelanggan_id = p.pelanggan_id
WHERE t.deleted_at IS NULL 
  AND t.jenis_transaksi = 'PENJUALAN'
  AND t.status_pembayaran <> 'DIBATALKAN';

-- ============================================================================
-- 3. INDEXES ON BASE TABLES (if not exists)
-- ============================================================================
-- These indexes support both the materialized view and regular queries

-- Index for date + cabang filtering (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_transaksi_cabang_date_sales
  ON transaksi(cabang_id, DATE(tanggal), deleted_at) 
  WHERE jenis_transaksi = 'PENJUALAN' AND status_pembayaran <> 'DIBATALKAN';

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_transaksi_date_sales
  ON transaksi(DATE(tanggal), deleted_at) 
  WHERE jenis_transaksi = 'PENJUALAN';

-- Composite index for aggregation queries
CREATE INDEX IF NOT EXISTS idx_transaksi_sales_aggregation
  ON transaksi(tanggal, cabang_id, total, subtotal, diskon, pajak)
  WHERE deleted_at IS NULL 
    AND jenis_transaksi = 'PENJUALAN' 
    AND status_pembayaran <> 'DIBATALKAN';

-- ============================================================================
-- 4. REFRESH FUNCTION FOR MATERIALIZED VIEW
-- ============================================================================
-- This function should be called daily (e.g., via cron or scheduled job)

CREATE OR REPLACE FUNCTION refresh_sales_materialized_view()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Refresh the materialized view concurrently (allows reads during refresh)
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_daily_summary;
  
  RAISE NOTICE 'Sales materialized view refreshed at %', NOW();
END;
$$;

-- ============================================================================
-- 5. TRIGGER TO AUTO-REFRESH ON TRANSACTION CHANGES (Optional, for real-time)
-- ============================================================================
-- Note: This can be expensive for high-volume transactions
-- Consider using scheduled refresh instead for better performance

-- Trigger function
CREATE OR REPLACE FUNCTION trigger_refresh_sales_mv()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only refresh if it's a sales transaction
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.jenis_transaksi = 'PENJUALAN' THEN
    PERFORM refresh_sales_materialized_view();
  ELSIF TG_OP = 'DELETE' AND OLD.jenis_transaksi = 'PENJUALAN' THEN
    PERFORM refresh_sales_materialized_view();
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger (commented out by default - enable if you want real-time refresh)
-- WARNING: This may impact write performance on high-volume systems
/*
DROP TRIGGER IF EXISTS trg_refresh_sales_mv ON transaksi;
CREATE TRIGGER trg_refresh_sales_mv
  AFTER INSERT OR UPDATE OR DELETE ON transaksi
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_sales_mv();
*/

-- ============================================================================
-- 6. HELPER FUNCTION: Get Sales Summary for Date Range with Multi-Branch
-- ============================================================================

CREATE OR REPLACE FUNCTION get_sales_summary(
  p_start_date DATE,
  p_end_date DATE,
  p_cabang_ids TEXT[] DEFAULT NULL  -- Array of branch IDs, NULL for all
)
RETURNS TABLE (
  total_sales NUMERIC,
  total_transactions BIGINT,
  average_transaction NUMERIC,
  total_discount NUMERIC,
  total_tax NUMERIC,
  total_additional_fees NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(total_sales), 0)::NUMERIC as total_sales,
    COALESCE(SUM(transaction_count), 0) as total_transactions,
    COALESCE(AVG(avg_transaction), 0)::NUMERIC as average_transaction,
    COALESCE(SUM(total_discount), 0)::NUMERIC as total_discount,
    COALESCE(SUM(total_tax), 0)::NUMERIC as total_tax,
    COALESCE(SUM(total_additional_fees), 0)::NUMERIC as total_additional_fees
  FROM mv_sales_daily_summary
  WHERE sale_date >= p_start_date
    AND sale_date <= p_end_date
    AND (p_cabang_ids IS NULL OR cabang_id = ANY(p_cabang_ids) OR cabang_id = 'all');
END;
$$;

-- ============================================================================
-- 7. USAGE EXAMPLES
-- ============================================================================

-- Example 1: Get sales summary for date range, all branches
-- SELECT * FROM get_sales_summary('2026-01-01'::DATE, '2026-01-31'::DATE, NULL);

-- Example 2: Get sales summary for specific branches
-- SELECT * FROM get_sales_summary(
--   '2026-01-01'::DATE, 
--   '2026-01-31'::DATE, 
--   ARRAY['branch_001', 'branch_002']::TEXT[]
-- );

-- Example 3: Get daily trend from materialized view
-- SELECT 
--   sale_date,
--   SUM(transaction_count) as transactions,
--   SUM(total_sales) as total
-- FROM mv_sales_daily_summary
-- WHERE sale_date >= '2026-01-01'::DATE
--   AND sale_date <= '2026-01-31'::DATE
--   AND cabang_id = ANY(ARRAY['branch_001', 'branch_002']::TEXT[])
-- GROUP BY sale_date
-- ORDER BY sale_date;

-- Example 4: Get transaction list from regular view
-- SELECT * FROM v_sales_report
-- WHERE sale_date >= '2026-01-01'::DATE
--   AND sale_date <= '2026-01-31'::DATE
--   AND cabang_id = ANY(ARRAY['branch_001']::TEXT[])
-- ORDER BY tanggal DESC
-- LIMIT 50;

-- ============================================================================
-- 8. MAINTENANCE COMMANDS
-- ============================================================================

-- Manually refresh materialized view:
-- SELECT refresh_sales_materialized_view();

-- Check when view was last refreshed:
-- SELECT last_updated FROM mv_sales_daily_summary LIMIT 1;

-- Drop views (if needed for rollback):
-- DROP MATERIALIZED VIEW IF EXISTS mv_sales_daily_summary CASCADE;
-- DROP VIEW IF EXISTS v_sales_report CASCADE;
-- DROP FUNCTION IF EXISTS refresh_sales_materialized_view() CASCADE;
-- DROP FUNCTION IF EXISTS get_sales_summary(DATE, DATE, TEXT[]) CASCADE;
