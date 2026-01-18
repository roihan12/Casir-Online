-- Materialized view for Profit and Loss (Laba Rugi) reporting

-- Profit and Loss (Laba Rugi) Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_profit_loss_report AS
WITH revenue_data AS (
  SELECT
    COALESCE(t.cabang_id, 'all') AS cabang_id,
    DATE_TRUNC('month', t.tanggal) AS period_month,
    SUM(t.total) AS total_revenue,
    SUM(t.subtotal) AS subtotal_revenue,
    SUM(t.diskon) AS total_discount,
    SUM(t.pajak) AS total_tax,
    SUM(t.biaya_tambahan) AS total_additional_fees,
    COUNT(t.transaksi_id) AS transaction_count
  FROM
    transaksi t
  WHERE
    t.jenis_transaksi = 'PENJUALAN'
    AND t.deleted_at IS NULL
    AND t.status_pembayaran != 'DIBATALKAN'
  GROUP BY
    ROLLUP(t.cabang_id), DATE_TRUNC('month', t.tanggal)
),
expense_details AS (
  -- Get expenses with categories
  SELECT
    COALESCE(t.cabang_id, 'all') AS cabang_id,
    DATE_TRUNC('month', t.tanggal) AS period_month,
    CASE
      WHEN td.produk_id IS NOT NULL THEN 'Pembelian Stok'
      WHEN t.keterangan LIKE '%gaji%' THEN 'Gaji Karyawan'
      WHEN t.keterangan LIKE '%sewa%' OR t.keterangan LIKE '%gedung%' THEN 'Sewa'
      WHEN t.keterangan LIKE '%listrik%' OR t.keterangan LIKE '%air%' OR t.keterangan LIKE '%utilitas%' THEN 'Utilitas'
      WHEN t.keterangan LIKE '%marketing%' OR t.keterangan LIKE '%iklan%' OR t.keterangan LIKE '%promosi%' THEN 'Pemasaran'
      ELSE 'Lainnya'
    END AS expense_category,
    SUM(COALESCE(td.total, t.total)) AS total_expense
  FROM
    transaksi t
  LEFT JOIN
    transaksi_detail td ON t.transaksi_id = td.transaksi_id
  WHERE
    t.jenis_transaksi = 'PEMBELIAN'
    AND t.deleted_at IS NULL
    AND t.status_pembayaran != 'DIBATALKAN'
  GROUP BY
    ROLLUP(t.cabang_id), 
    DATE_TRUNC('month', t.tanggal),
    CASE
      WHEN td.produk_id IS NOT NULL THEN 'Pembelian Stok'
      WHEN t.keterangan LIKE '%gaji%' THEN 'Gaji Karyawan'
      WHEN t.keterangan LIKE '%sewa%' OR t.keterangan LIKE '%gedung%' THEN 'Sewa'
      WHEN t.keterangan LIKE '%listrik%' OR t.keterangan LIKE '%air%' OR t.keterangan LIKE '%utilitas%' THEN 'Utilitas'
      WHEN t.keterangan LIKE '%marketing%' OR t.keterangan LIKE '%iklan%' OR t.keterangan LIKE '%promosi%' THEN 'Pemasaran'
      ELSE 'Lainnya'
    END
),
expense_summary AS (
  -- Summarize expenses by cabang and period
  SELECT
    cabang_id,
    period_month,
    SUM(total_expense) AS total_expenses
  FROM
    expense_details
  GROUP BY
    cabang_id, period_month
),
cogs_data AS (
  -- Calculate Cost of Goods Sold
  SELECT
    COALESCE(t.cabang_id, 'all') AS cabang_id,
    DATE_TRUNC('month', t.tanggal) AS period_month,
    SUM(td.jumlah * p.hargaBeli) AS total_cogs
  FROM
    transaksi t
  JOIN
    transaksi_detail td ON t.transaksi_id = td.transaksi_id
  JOIN
    produk p ON td.produk_id = p.id
  WHERE
    t.jenis_transaksi = 'PENJUALAN'
    AND t.deleted_at IS NULL
    AND t.status_pembayaran != 'DIBATALKAN'
  GROUP BY
    ROLLUP(t.cabang_id), DATE_TRUNC('month', t.tanggal)
)
-- Combine all data for the profit and loss report
SELECT
  COALESCE(r.cabang_id, e.cabang_id, c.cabang_id, 'all') AS cabang_id,
  COALESCE(r.period_month, e.period_month, c.period_month) AS period_month,
  -- Create a unique ID for each row to support concurrent refresh
  MD5(COALESCE(r.cabang_id, e.cabang_id, c.cabang_id, 'all') || '_' || 
      COALESCE(r.period_month, e.period_month, c.period_month)::text)::uuid AS unique_id,
  -- Revenue section
  COALESCE(r.total_revenue, 0) AS total_revenue,
  COALESCE(r.subtotal_revenue, 0) AS subtotal_revenue,
  COALESCE(r.total_discount, 0) AS total_discount,
  COALESCE(r.total_tax, 0) AS total_tax,
  COALESCE(r.total_additional_fees, 0) AS total_additional_fees,
  COALESCE(r.transaction_count, 0) AS sales_transaction_count,
  -- Cost of Goods Sold
  COALESCE(c.total_cogs, 0) AS total_cogs,
  -- Gross Profit
  COALESCE(r.total_revenue, 0) - COALESCE(c.total_cogs, 0) AS gross_profit,
  -- Gross Profit Margin
  CASE 
    WHEN COALESCE(r.total_revenue, 0) > 0 
    THEN ROUND((COALESCE(r.total_revenue, 0) - COALESCE(c.total_cogs, 0)) * 100.0 / COALESCE(r.total_revenue, 0), 2)
    ELSE 0 
  END AS gross_profit_margin,
  -- Expenses
  COALESCE(e.total_expenses, 0) AS total_operating_expenses,
  -- Net Profit
  COALESCE(r.total_revenue, 0) - COALESCE(c.total_cogs, 0) - COALESCE(e.total_expenses, 0) AS net_profit,
  -- Net Profit Margin
  CASE 
    WHEN COALESCE(r.total_revenue, 0) > 0 
    THEN ROUND((COALESCE(r.total_revenue, 0) - COALESCE(c.total_cogs, 0) - COALESCE(e.total_expenses, 0)) * 100.0 / COALESCE(r.total_revenue, 0), 2)
    ELSE 0 
  END AS net_profit_margin,
  NOW() AS last_updated
FROM
  revenue_data r
FULL OUTER JOIN
  expense_summary e ON r.cabang_id = e.cabang_id AND r.period_month = e.period_month
FULL OUTER JOIN
  cogs_data c ON r.cabang_id = c.cabang_id AND r.period_month = c.period_month
WHERE
  COALESCE(r.period_month, e.period_month, c.period_month) IS NOT NULL
WITH DATA;

-- Create indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_mv_profit_loss_cabang_id ON mv_profit_loss_report(cabang_id);
CREATE INDEX IF NOT EXISTS idx_mv_profit_loss_period ON mv_profit_loss_report(period_month);
-- Create unique index to support concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_profit_loss_unique ON mv_profit_loss_report(unique_id);

-- Create detail view for expense breakdown by category
-- Use the same logic, but with its own CTEs instead of depending on the previous query's CTEs
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_profit_loss_expense_detail AS
WITH expense_categories AS (
  -- Get expenses with categories
  SELECT
    COALESCE(t.cabang_id, 'all') AS cabang_id,
    DATE_TRUNC('month', t.tanggal) AS period_month,
    CASE
      WHEN td.produk_id IS NOT NULL THEN 'Pembelian Stok'
      WHEN t.keterangan LIKE '%gaji%' THEN 'Gaji Karyawan'
      WHEN t.keterangan LIKE '%sewa%' OR t.keterangan LIKE '%gedung%' THEN 'Sewa'
      WHEN t.keterangan LIKE '%listrik%' OR t.keterangan LIKE '%air%' OR t.keterangan LIKE '%utilitas%' THEN 'Utilitas'
      WHEN t.keterangan LIKE '%marketing%' OR t.keterangan LIKE '%iklan%' OR t.keterangan LIKE '%promosi%' THEN 'Pemasaran'
      ELSE 'Lainnya'
    END AS expense_category,
    SUM(COALESCE(td.total, t.total)) AS category_expense
  FROM
    transaksi t
  LEFT JOIN
    transaksi_detail td ON t.transaksi_id = td.transaksi_id
  WHERE
    t.jenis_transaksi = 'PEMBELIAN'
    AND t.deleted_at IS NULL
    AND t.status_pembayaran != 'DIBATALKAN'
  GROUP BY
    ROLLUP(t.cabang_id), 
    DATE_TRUNC('month', t.tanggal),
    CASE
      WHEN td.produk_id IS NOT NULL THEN 'Pembelian Stok'
      WHEN t.keterangan LIKE '%gaji%' THEN 'Gaji Karyawan'
      WHEN t.keterangan LIKE '%sewa%' OR t.keterangan LIKE '%gedung%' THEN 'Sewa'
      WHEN t.keterangan LIKE '%listrik%' OR t.keterangan LIKE '%air%' OR t.keterangan LIKE '%utilitas%' THEN 'Utilitas'
      WHEN t.keterangan LIKE '%marketing%' OR t.keterangan LIKE '%iklan%' OR t.keterangan LIKE '%promosi%' THEN 'Pemasaran'
      ELSE 'Lainnya'
    END
),
expense_totals AS (
  -- Calculate total expenses per cabang and period
  SELECT
    cabang_id,
    period_month,
    SUM(category_expense) AS total_expenses
  FROM
    expense_categories
  WHERE
    expense_category IS NOT NULL
  GROUP BY
    cabang_id, period_month
)
-- Calculate final results with percentages
SELECT
  ec.cabang_id,
  ec.period_month,
  ec.expense_category,
  -- Create a unique ID for each row to support concurrent refresh
  MD5(ec.cabang_id || '_' || ec.period_month::text || '_' || ec.expense_category)::uuid AS unique_id,
  ec.category_expense,
  et.total_expenses,
  CASE 
    WHEN et.total_expenses > 0 
    THEN ROUND(ec.category_expense * 100.0 / et.total_expenses, 2)
    ELSE 0
  END AS expense_percentage,
  NOW() AS last_updated
FROM
  expense_categories ec
JOIN
  expense_totals et ON ec.cabang_id = et.cabang_id AND ec.period_month = et.period_month
WHERE
  ec.expense_category IS NOT NULL
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_profit_loss_expense_detail_cabang_id ON mv_profit_loss_expense_detail(cabang_id);
CREATE INDEX IF NOT EXISTS idx_mv_profit_loss_expense_detail_period ON mv_profit_loss_expense_detail(period_month);
CREATE INDEX IF NOT EXISTS idx_mv_profit_loss_expense_detail_category ON mv_profit_loss_expense_detail(expense_category);
-- Create unique index to support concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_profit_loss_expense_detail_unique ON mv_profit_loss_expense_detail(unique_id);

-- Now add similar unique index definitions for other financial materialized views
DO $$
BEGIN
  -- Create unique index for mv_financial_summary if it exists
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_financial_summary') THEN
    -- First check if we need to add a unique_id column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'mv_financial_summary' AND column_name = 'unique_id'
    ) THEN
      -- Try creating a unique index on the combination of existing columns
      BEGIN
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_financial_summary_unique ON mv_financial_summary(cabang_id, transaction_date)';
      EXCEPTION WHEN OTHERS THEN
        -- If that fails, we need to refresh the view with a unique_id column
        RAISE NOTICE 'Unable to create unique index on mv_financial_summary. Please modify the view to include a unique ID column.';
      END;
    ELSE
      -- If unique_id column exists, create index on it
      EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_financial_summary_unique ON mv_financial_summary(unique_id)';
    END IF;
  END IF;

  -- Create unique index for mv_payment_method_summary if it exists
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_payment_method_summary') THEN
    BEGIN
      EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_payment_method_summary_unique ON mv_payment_method_summary(cabang_id, transaction_date, metode_pembayaran)';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Unable to create unique index on mv_payment_method_summary. Please modify the view.';
    END;
  END IF;

  -- Create unique index for mv_financial_daily_trend if it exists
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_financial_daily_trend') THEN
    BEGIN
      EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_financial_daily_trend_unique ON mv_financial_daily_trend(cabang_id, transaction_date)';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Unable to create unique index on mv_financial_daily_trend. Please modify the view.';
    END;
  END IF;
  
  -- Create unique index for other views
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_financial_detail') THEN
    BEGIN
      EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_financial_detail_unique ON mv_financial_detail(transaksi_id)';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Unable to create unique index on mv_financial_detail. Please modify the view.';
    END;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_expense_analysis') THEN
    BEGIN
      EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_expense_analysis_unique ON mv_expense_analysis(cabang_id, expense_category)';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Unable to create unique index on mv_expense_analysis. Please modify the view.';
    END;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_tax_and_fees') THEN
    BEGIN
      EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_tax_and_fees_unique ON mv_tax_and_fees(cabang_id)';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Unable to create unique index on mv_tax_and_fees. Please modify the view.';
    END;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_transaction_fees_by_payment') THEN
    BEGIN
      EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_transaction_fees_by_payment_unique ON mv_transaction_fees_by_payment(cabang_id, metode_pembayaran)';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Unable to create unique index on mv_transaction_fees_by_payment. Please modify the view.';
    END;
  END IF;
END $$;

-- Add these materialized views to the refresh function
DROP FUNCTION IF EXISTS refresh_financial_materialized_views CASCADE;
CREATE OR REPLACE FUNCTION refresh_financial_materialized_views()
RETURNS TRIGGER AS $$
DECLARE
  refresh_error BOOLEAN := FALSE;
  error_message TEXT;
BEGIN
  -- Use pg_notify to trigger asynchronous refresh instead of doing it directly
  -- This allows the transaction to complete without waiting for the views to refresh
  PERFORM pg_notify('refresh_mv_channel', 'Refresh materialized views');
  
  -- Return immediately without waiting for refresh
  -- The actual refresh will be handled by a separate process/listener
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a function to actually perform the refresh (to be called by a listener)
CREATE OR REPLACE FUNCTION perform_materialized_view_refresh()
RETURNS VOID AS $$
DECLARE
  refresh_error BOOLEAN := FALSE;
  error_message TEXT;
BEGIN
  -- Use exception handling for each view refresh to continue even if one fails
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_profit_loss_report;
  EXCEPTION WHEN OTHERS THEN
    refresh_error := TRUE;
    error_message := SQLERRM;
    RAISE NOTICE 'Error refreshing mv_profit_loss_report: %', error_message;
  END;
  
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_profit_loss_expense_detail;
  EXCEPTION WHEN OTHERS THEN
    refresh_error := TRUE;
    error_message := SQLERRM;
    RAISE NOTICE 'Error refreshing mv_profit_loss_expense_detail: %', error_message;
  END;
  
  -- Try refreshing other views if they exist and have unique indexes
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_mv_financial_summary_unique'
    ) THEN
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_summary;
    ELSE
      REFRESH MATERIALIZED VIEW mv_financial_summary;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error refreshing mv_financial_summary: %', SQLERRM;
    -- Try non-concurrent refresh as fallback
    BEGIN
      REFRESH MATERIALIZED VIEW mv_financial_summary;
    EXCEPTION WHEN OTHERS THEN
      refresh_error := TRUE;
      error_message := SQLERRM;
      RAISE NOTICE 'Error with non-concurrent refresh of mv_financial_summary: %', error_message;
    END;
  END;
  
  -- Similar pattern for other views
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_mv_payment_method_summary_unique'
    ) THEN
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_payment_method_summary;
    ELSE
      REFRESH MATERIALIZED VIEW mv_payment_method_summary;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error refreshing mv_payment_method_summary: %', SQLERRM;
    BEGIN
      REFRESH MATERIALIZED VIEW mv_payment_method_summary;
    EXCEPTION WHEN OTHERS THEN
      refresh_error := TRUE;
    END;
  END;
  
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_mv_financial_daily_trend_unique'
    ) THEN
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_daily_trend;
    ELSE
      REFRESH MATERIALIZED VIEW mv_financial_daily_trend;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error refreshing mv_financial_daily_trend: %', SQLERRM;
    BEGIN
      REFRESH MATERIALIZED VIEW mv_financial_daily_trend;
    EXCEPTION WHEN OTHERS THEN
      refresh_error := TRUE;
    END;
  END;
  
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_mv_financial_detail_unique'
    ) THEN
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_detail;
    ELSE
      REFRESH MATERIALIZED VIEW mv_financial_detail;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error refreshing mv_financial_detail: %', SQLERRM;
    BEGIN
      REFRESH MATERIALIZED VIEW mv_financial_detail;
    EXCEPTION WHEN OTHERS THEN
      refresh_error := TRUE;
    END;
  END;
  
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_mv_expense_analysis_unique'
    ) THEN
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_expense_analysis;
    ELSE
      REFRESH MATERIALIZED VIEW mv_expense_analysis;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error refreshing mv_expense_analysis: %', SQLERRM;
    BEGIN
      REFRESH MATERIALIZED VIEW mv_expense_analysis;
    EXCEPTION WHEN OTHERS THEN
      refresh_error := TRUE;
    END;
  END;
  
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_mv_tax_and_fees_unique'
    ) THEN
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tax_and_fees;
    ELSE
      REFRESH MATERIALIZED VIEW mv_tax_and_fees;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error refreshing mv_tax_and_fees: %', SQLERRM;
    BEGIN
      REFRESH MATERIALIZED VIEW mv_tax_and_fees;
    EXCEPTION WHEN OTHERS THEN
      refresh_error := TRUE;
    END;
  END;
  
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_mv_transaction_fees_by_payment_unique'
    ) THEN
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_transaction_fees_by_payment;
    ELSE
      REFRESH MATERIALIZED VIEW mv_transaction_fees_by_payment;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error refreshing mv_transaction_fees_by_payment: %', SQLERRM;
    BEGIN
      REFRESH MATERIALIZED VIEW mv_transaction_fees_by_payment;
    EXCEPTION WHEN OTHERS THEN
      refresh_error := TRUE;
    END;
  END;
  
  -- Log refresh result
  IF refresh_error THEN
    RAISE NOTICE 'Some materialized view refreshes failed. Check server logs for details.';
  ELSE
    RAISE NOTICE 'All materialized view refreshes completed successfully.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh materialized views when data changes
-- Trigger for transaksi table
DROP TRIGGER IF EXISTS trg_refresh_financial_views_transaksi ON transaksi;
CREATE TRIGGER trg_refresh_financial_views_transaksi
AFTER INSERT OR UPDATE OR DELETE ON transaksi
FOR EACH STATEMENT EXECUTE FUNCTION refresh_financial_materialized_views();

-- Trigger for transaksi_detail table
DROP TRIGGER IF EXISTS trg_refresh_financial_views_transaksi_detail ON transaksi_detail;
CREATE TRIGGER trg_refresh_financial_views_transaksi_detail
AFTER INSERT OR UPDATE OR DELETE ON transaksi_detail
FOR EACH STATEMENT EXECUTE FUNCTION refresh_financial_materialized_views();

-- Trigger for pembayaran table
DROP TRIGGER IF EXISTS trg_refresh_financial_views_pembayaran ON pembayaran;
CREATE TRIGGER trg_refresh_financial_views_pembayaran
AFTER INSERT OR UPDATE OR DELETE ON pembayaran
FOR EACH STATEMENT EXECUTE FUNCTION refresh_financial_materialized_views();

-- Schedule regular refresh (every day at midnight)
-- Note: This requires the 'pg_cron' extension to be installed
-- Uncomment if pg_cron is available in your environment
/*
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('0 0 * * *', $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_payment_method_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_daily_trend;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_detail;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_expense_analysis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tax_and_fees;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_transaction_fees_by_payment;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_profit_loss_report;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_profit_loss_expense_detail;
$$);
*/ 