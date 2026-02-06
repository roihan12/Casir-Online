-- ============================================================================
-- Verification Script for mv_profit_loss_report Fix
-- Date: 2026-02-06
-- Description: Test queries to verify the fix worked correctly
-- ============================================================================

-- Test 1: Check if view exists and has data
SELECT 
  'Test 1: View exists and has data' AS test_name,
  count(*) AS total_rows,
  count(DISTINCT cabang_id) AS unique_branches,
  count(DISTINCT period_month) AS unique_months
FROM mv_profit_loss_report;

-- Expected: Should have data, multiple branches including 'all'

-- ============================================================================
-- Test 2: Verify 'all' aggregation matches sum of individual branches
-- ============================================================================
WITH individual_sum AS (
  SELECT 
    period_month,
    sum(total_revenue) AS sum_revenue,
    sum(total_operating_expenses) AS sum_expenses,
    sum(net_profit) AS sum_net_profit
  FROM mv_profit_loss_report
  WHERE cabang_id <> 'all'
  GROUP BY period_month
),
all_branch AS (
  SELECT 
    period_month,
    total_revenue,
    total_operating_expenses,
    net_profit
  FROM mv_profit_loss_report
  WHERE cabang_id = 'all'
)
SELECT 
  'Test 2: All branch totals match sum of individuals' AS test_name,
  i.period_month,
  a.total_revenue AS all_revenue,
  i.sum_revenue AS individual_sum_revenue,
  a.total_revenue - i.sum_revenue AS revenue_diff,
  a.total_operating_expenses AS all_expenses,
  i.sum_expenses AS individual_sum_expenses,
  a.total_operating_expenses - i.sum_expenses AS expenses_diff,
  a.net_profit AS all_net_profit,
  i.sum_net_profit AS individual_sum_net_profit,
  a.net_profit - i.sum_net_profit AS net_profit_diff
FROM all_branch a
  JOIN individual_sum i ON a.period_month = i.period_month
WHERE 
  abs(a.total_revenue - i.sum_revenue) > 0.01  -- Allow for rounding
  OR abs(a.total_operating_expenses - i.sum_expenses) > 0.01
  OR abs(a.net_profit - i.sum_net_profit) > 0.01
ORDER BY i.period_month DESC
LIMIT 10;

-- Expected: Should return NO ROWS if fix is correct
-- If rows returned, there's still a double-counting issue

-- ============================================================================
-- Test 3: Sample data from latest month
-- ============================================================================
SELECT 
  'Test 3: Latest month sample data' AS test_name,
  cabang_id,
  period_month,
  total_revenue,
  total_cogs,
  gross_profit,
  gross_profit_margin,
  total_operating_expenses,
  net_profit,
  net_profit_margin
FROM mv_profit_loss_report
WHERE period_month = (SELECT max(period_month) FROM mv_profit_loss_report)
ORDER BY cabang_id;

-- Expected: Should show reasonable values, margins should be percentages

-- ============================================================================
-- Test 4: Check expense categorization is working (case-insensitive)
-- ============================================================================
-- This requires checking the expense detail view
-- First, let's verify expense breakdown exists
SELECT 
  'Test 4: Expense categories exist' AS test_name,
  period_month,
  expense_category,
  count(*) AS transaction_count,
  sum(category_expense) AS total_amount
FROM mv_profit_loss_expense_detail
WHERE cabang_id <> 'all'
  AND period_month = (SELECT max(period_month) FROM mv_profit_loss_expense_detail)
GROUP BY period_month, expense_category
ORDER BY total_amount DESC;

-- Expected: Should show various categories (Pembelian Stok, Gaji, etc.)

-- ============================================================================
-- Test 5: Verify no NULL period_month rows
-- ============================================================================
SELECT 
  'Test 5: No NULL period_month' AS test_name,
  count(*) AS null_period_count
FROM mv_profit_loss_report
WHERE period_month IS NULL;

-- Expected: Should return 0

-- ============================================================================
-- Test 6: Check date range coverage
-- ============================================================================
SELECT 
  'Test 6: Date range coverage' AS test_name,
  min(period_month) AS earliest_month,
  max(period_month) AS latest_month,
  count(DISTINCT period_month) AS total_months
FROM mv_profit_loss_report
WHERE cabang_id = 'all';

-- Expected: Should cover expected business date range

-- ============================================================================
-- Test 7: Verify margins are reasonable (0-100%)
-- ============================================================================
SELECT 
  'Test 7: Unreasonable margins' AS test_name,
  cabang_id,
  period_month,
  gross_profit_margin,
  net_profit_margin
FROM mv_profit_loss_report
WHERE 
  abs(gross_profit_margin) > 100 
  OR abs(net_profit_margin) > 100
ORDER BY period_month DESC;

-- Expected: Should return NO ROWS
-- Margins > 100% indicate calculation error

-- ============================================================================
-- Test 8: Compare before/after expense totals (if you have backup)
-- ============================================================================
-- If you backed up the old view data, compare:
-- SELECT 
--   'Comparison' AS test,
--   old.period_month,
--   old.total_operating_expenses AS old_expenses,
--   new.total_operating_expenses AS new_expenses,
--   new.total_operating_expenses - old.total_operating_expenses AS difference
-- FROM mv_profit_loss_report_backup old
--   JOIN mv_profit_loss_report new 
--     ON old.cabang_id = new.cabang_id 
--     AND old.period_month = new.period_month
-- WHERE old.cabang_id = 'all'
-- ORDER BY old.period_month DESC;

-- ============================================================================
-- SUMMARY TEST: All critical checks
-- ============================================================================
SELECT 
  'SUMMARY: All critical checks' AS test_suite,
  (SELECT count(*) FROM mv_profit_loss_report) AS total_rows,
  (SELECT count(*) FROM mv_profit_loss_report WHERE period_month IS NULL) AS null_periods,
  (SELECT count(*) FROM mv_profit_loss_report WHERE abs(gross_profit_margin) > 100) AS invalid_margins,
  CASE 
    WHEN EXISTS (
      WITH individual_sum AS (
        SELECT period_month, sum(total_operating_expenses) AS sum_exp
        FROM mv_profit_loss_report
        WHERE cabang_id <> 'all'
        GROUP BY period_month
      )
      SELECT 1 
      FROM mv_profit_loss_report a
        JOIN individual_sum i ON a.period_month = i.period_month
      WHERE a.cabang_id = 'all'
        AND abs(a.total_operating_expenses - i.sum_exp) > 1
    ) THEN 'FAILED: Double-counting detected'
    ELSE 'PASSED: No double-counting'
  END AS double_count_check;

-- Expected output:
-- total_rows: > 0
-- null_periods: 0
-- invalid_margins: 0
-- double_count_check: 'PASSED: No double-counting'
