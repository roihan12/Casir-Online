-- Quick test script to verify sales report views are working correctly
-- Run this after creating the views

-- ============================================================================
-- TEST 1: Check if views exist
-- ============================================================================
SELECT 
  schemaname,
  matviewname as viewname,
  'materialized' as view_type
FROM pg_matviews
WHERE matviewname = 'mv_sales_daily_summary'

UNION ALL

SELECT 
  schemaname,
  viewname,
  'regular' as view_type
FROM pg_views
WHERE viewname = 'v_sales_report';

-- Expected: 2 rows showing both views exist

-- ============================================================================
-- TEST 2: Check if materialized view has data
-- ============================================================================
SELECT 
  COUNT(*) as total_rows,
  MIN(sale_date) as earliest_date,
  MAX(sale_date) as latest_date,
  COUNT(DISTINCT cabang_id) as branch_count
FROM mv_sales_daily_summary;

-- Expected: Should show row count and date range

-- ============================================================================
-- TEST 3: Test regular view query
-- ============================================================================
SELECT 
  sale_date,
  cabang_id,
  cabang_nama,
  COUNT(*) as transaction_count
FROM v_sales_report
WHERE sale_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY sale_date, cabang_id, cabang_nama
ORDER BY sale_date DESC
LIMIT 10;

-- Expected: Recent transactions grouped by date and branch

-- ============================================================================
-- TEST 4: Test helper function with multi-branch array
-- ============================================================================
-- Get all branches first
WITH all_branches AS (
  SELECT DISTINCT cabang_id 
  FROM v_sales_report 
  WHERE cabang_id IS NOT NULL 
  LIMIT 2
)
SELECT * FROM get_sales_summary(
  (CURRENT_DATE - INTERVAL '30 days')::DATE,
  CURRENT_DATE::DATE,
  ARRAY(SELECT cabang_id FROM all_branches)::TEXT[]
);

-- Expected: Summary metrics for the last 30 days for selected branches

-- ============================================================================
-- TEST 5: Test trend query (similar to what API will use)
-- ============================================================================
-- Daily trend for last 30 days, all branches
SELECT 
  sale_date as date,
  SUM(transaction_count)::int as transactions,
  SUM(total_sales)::NUMERIC as total
FROM mv_sales_daily_summary
WHERE sale_date >= (CURRENT_DATE - INTERVAL '30 days')::DATE
  AND sale_date <= CURRENT_DATE::DATE
GROUP BY sale_date
ORDER BY sale_date DESC
LIMIT 10;

-- Expected: Daily aggregated sales data

-- ============================================================================
-- TEST 6: Test weekly grouping
-- ============================================================================
SELECT 
  DATE_TRUNC('week', sale_date) as date,
  SUM(transaction_count)::int as transactions,
  SUM(total_sales)::NUMERIC as total
FROM mv_sales_daily_summary
WHERE sale_date >= (CURRENT_DATE - INTERVAL '90 days')::DATE
  AND sale_date <= CURRENT_DATE::DATE
GROUP BY DATE_TRUNC('week', sale_date)
ORDER BY date DESC;

-- Expected: Weekly aggregated sales data

-- ============================================================================
-- TEST 7: Refresh materialized view (this will take some time)
-- ============================================================================
SELECT refresh_sales_materialized_view();

-- Expected: Function completes without error

-- ============================================================================
-- TEST 8: Check last refresh time
-- ============================================================================
SELECT 
  last_updated,
  NOW() - last_updated as time_since_refresh
FROM mv_sales_daily_summary
LIMIT 1;

-- Expected: Recent timestamp showing when view was last refreshed

-- ============================================================================
-- TEST 9: Performance comparison (optional)
-- ============================================================================
-- This will show the difference between using raw table vs materialized view

EXPLAIN ANALYZE
SELECT 
  DATE(tanggal) as date,
  COUNT(*) as transactions,
  SUM(total) as total
FROM transaksi
WHERE deleted_at IS NULL
  AND jenis_transaksi = 'PENJUALAN'
  AND DATE(tanggal) >= (CURRENT_DATE - INTERVAL '30 days')
GROUP BY DATE(tanggal);

-- vs

EXPLAIN ANALYZE
SELECT 
  sale_date as date,
  SUM(transaction_count) as transactions,
  SUM(total_sales) as total
FROM mv_sales_daily_summary
WHERE sale_date >= (CURRENT_DATE - INTERVAL '30 days')
GROUP BY sale_date;

-- Expected: Materialized view query should be significantly faster
