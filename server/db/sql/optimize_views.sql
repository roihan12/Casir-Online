-- File: server/src/sql/optimize_views.sql
-- This file contains SQL commands to optimize the view strategy for better performance

-- 1. Convert critical materialized views to regular views
-- These views need real-time data for operational purposes

-- Convert mv_financial_detail to regular view
DROP MATERIALIZED VIEW IF EXISTS mv_financial_detail CASCADE;
CREATE OR REPLACE VIEW financial_detail AS
WITH transaction_detail AS (
    SELECT t.transaksi_id,
        t.cabang_id,
        t.jenis_transaksi,
        t.nomor_transaksi,
        date(t.tanggal) AS transaction_date,
        t.status_pembayaran,
        t.total,
        t.subtotal,
        t.diskon,
        t.pajak,
        t.biaya_tambahan,
        t.pelanggan_id,
        t.supplier_id,
        p.nama_pelanggan,
        s.nama_supplier,
        CASE
            WHEN t.jenis_transaksi::text = 'PENJUALAN'::text THEN t.total
            ELSE 0::numeric
        END AS pendapatan,
        CASE
            WHEN t.jenis_transaksi::text = 'PEMBELIAN'::text THEN t.total
            ELSE 0::numeric
        END AS pengeluaran,
        CASE
            WHEN t.jenis_transaksi::text = 'PENJUALAN'::text THEN t.total - COALESCE(cogs.total_cost, 0::numeric)
            ELSE 0::numeric
        END AS keuntungan,
        CASE
            WHEN t.jenis_transaksi::text = 'PENJUALAN'::text AND t.total > 0::numeric THEN round((t.total - COALESCE(cogs.total_cost, 0::numeric)) * 100.0 / t.total, 2)
            ELSE 0::numeric
        END AS margin_persen
    FROM transaksi t
        LEFT JOIN pelanggan p ON t.pelanggan_id::text = p.pelanggan_id
        LEFT JOIN supplier s ON t.supplier_id::text = s.supplier_id
        LEFT JOIN (
            SELECT td_1.transaksi_id,
                sum(td_1.jumlah::numeric * p_1.harga_beli) AS total_cost
            FROM transaksi_detail td_1
                JOIN produk p_1 ON td_1.produk_id::text = p_1.produk_id
            GROUP BY td_1.transaksi_id
        ) cogs ON t.transaksi_id::text = cogs.transaksi_id::text
    WHERE t.deleted_at IS NULL AND t.status_pembayaran <> 'DIBATALKAN'::"StatusPembayaran"
)
SELECT td.transaksi_id,
    COALESCE(td.cabang_id, 'all'::character varying) AS cabang_id,
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
    now() AS last_updated
FROM transaction_detail td;

-- Convert mv_financial_summary to regular view
DROP MATERIALIZED VIEW IF EXISTS mv_financial_summary CASCADE;
CREATE OR REPLACE VIEW financial_summary AS
WITH transaction_data AS (
    SELECT COALESCE(t.cabang_id, 'all'::character varying) AS cabang_id,
        date(t.tanggal) AS transaction_date,
        t.jenis_transaksi,
        sum(t.total) AS total_amount,
        sum(t.subtotal) AS subtotal_amount,
        sum(t.diskon) AS discount_amount,
        sum(t.pajak) AS tax_amount,
        sum(t.biaya_tambahan) AS additional_fees,
        count(t.transaksi_id) AS transaction_count
    FROM transaksi t
    WHERE t.deleted_at IS NULL AND t.status_pembayaran <> 'DIBATALKAN'::"StatusPembayaran"
    GROUP BY ROLLUP(t.cabang_id), (date(t.tanggal)), t.jenis_transaksi
)
SELECT td.cabang_id,
    td.transaction_date,
    sum(
        CASE
            WHEN td.jenis_transaksi::text = 'PENJUALAN'::text THEN td.total_amount
            ELSE 0::numeric
        END) AS total_pendapatan,
    sum(
        CASE
            WHEN td.jenis_transaksi::text = 'PEMBELIAN'::text THEN td.total_amount
            ELSE 0::numeric
        END) AS total_pengeluaran,
    sum(
        CASE
            WHEN td.jenis_transaksi::text = 'PENJUALAN'::text THEN td.total_amount
            ELSE 0::numeric
        END) - sum(
        CASE
            WHEN td.jenis_transaksi::text = 'PEMBELIAN'::text THEN td.total_amount
            ELSE 0::numeric
        END) AS keuntungan_bersih,
    CASE
        WHEN sum(
        CASE
            WHEN td.jenis_transaksi::text = 'PENJUALAN'::text THEN td.total_amount
            ELSE 0::numeric
        END) > 0::numeric THEN round((sum(
        CASE
            WHEN td.jenis_transaksi::text = 'PENJUALAN'::text THEN td.total_amount
            ELSE 0::numeric
        END) - sum(
        CASE
            WHEN td.jenis_transaksi::text = 'PEMBELIAN'::text THEN td.total_amount
            ELSE 0::numeric
        END)) * 100.0 / sum(
        CASE
            WHEN td.jenis_transaksi::text = 'PENJUALAN'::text THEN td.total_amount
            ELSE 0::numeric
        END), 2)
        ELSE 0::numeric
    END AS margin_keuntungan,
    sum(
        CASE
            WHEN td.jenis_transaksi::text = 'PENJUALAN'::text THEN td.tax_amount
            ELSE 0::numeric
        END) AS total_pajak,
    sum(
        CASE
            WHEN td.jenis_transaksi::text = 'PENJUALAN'::text THEN td.additional_fees
            ELSE 0::numeric
        END) AS total_biaya_layanan,
    sum(
        CASE
            WHEN td.jenis_transaksi::text = 'PENJUALAN'::text THEN td.transaction_count
            ELSE 0::bigint
        END) AS total_transaksi_penjualan,
    sum(
        CASE
            WHEN td.jenis_transaksi::text = 'PEMBELIAN'::text THEN td.transaction_count
            ELSE 0::bigint
        END) AS total_transaksi_pembelian,
    now() AS last_updated
FROM transaction_data td
GROUP BY td.cabang_id, td.transaction_date;

-- 2. Add last_refreshed timestamp to remaining materialized views

-- Replace the DO block that attempts to ALTER materialized views with recreate approach
-- PostgreSQL doesn't support adding columns to materialized views with ALTER

-- Instead, we'll recreate the views that need the last_refreshed column
-- Let's create a function to help with this process

CREATE OR REPLACE FUNCTION add_last_refreshed_to_mv(mv_name text)
RETURNS void AS $$
DECLARE
    mv_definition text;
    new_definition text;
    original_query text;
BEGIN
    -- Get the current view definition (this returns just the SELECT part)
    SELECT pg_get_viewdef(mv_name::regclass, true) INTO original_query;
    
    -- Remove the trailing semicolon if present
    IF right(original_query, 1) = ';' THEN
        original_query := substring(original_query, 1, length(original_query) - 1);
    END IF;
    
    -- Modify the query to include the last_refreshed column
    -- Check if the query already has a final closing parenthesis or FROM clause
    IF position(' FROM ' in upper(original_query)) > 0 THEN
        -- Add the column before the FROM clause if it exists
        new_definition := regexp_replace(
            original_query,
            'FROM',
            ', now() AS last_refreshed FROM',
            'i'  -- case insensitive
        );
    ELSE
        -- Otherwise just append it to the end
        new_definition := original_query || ', now() AS last_refreshed';
    END IF;
    
    -- Create the full materialized view definition
    mv_definition := 'CREATE MATERIALIZED VIEW ' || mv_name || ' AS ' || new_definition || ' WITH DATA';
    
    -- Drop the existing view (this will also drop dependent objects)
    EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS ' || mv_name || ' CASCADE';
    
    -- Create the new materialized view
    EXECUTE mv_definition;
    
    -- Recreate indexes if needed
    IF mv_name = 'mv_payment_method_summary' THEN
        EXECUTE 'CREATE INDEX idx_mv_payment_method_summary_cabang_id ON mv_payment_method_summary USING btree (cabang_id)';
        EXECUTE 'CREATE INDEX idx_mv_payment_method_summary_date ON mv_payment_method_summary USING btree (transaction_date)';
        EXECUTE 'CREATE INDEX idx_mv_payment_method_summary_method ON mv_payment_method_summary USING btree (metode_pembayaran)';
        EXECUTE 'CREATE UNIQUE INDEX idx_mv_payment_method_summary_unique ON mv_payment_method_summary USING btree (cabang_id, transaction_date, metode_pembayaran)';
    ELSIF mv_name = 'mv_financial_daily_trend' THEN
        EXECUTE 'CREATE INDEX idx_mv_financial_daily_trend_cabang_id ON mv_financial_daily_trend USING btree (cabang_id)';
        EXECUTE 'CREATE INDEX idx_mv_financial_daily_trend_date ON mv_financial_daily_trend USING btree (transaction_date)';
        EXECUTE 'CREATE UNIQUE INDEX idx_mv_financial_daily_trend_unique ON mv_financial_daily_trend USING btree (cabang_id, transaction_date)';
    ELSIF mv_name = 'mv_tax_and_fees' THEN
        EXECUTE 'CREATE INDEX idx_mv_tax_and_fees_cabang_id ON mv_tax_and_fees USING btree (cabang_id)';
        EXECUTE 'CREATE UNIQUE INDEX idx_mv_tax_and_fees_unique ON mv_tax_and_fees USING btree (cabang_id)';
    END IF;
    
    RAISE NOTICE 'Successfully added last_refreshed column to %', mv_name;
END;
$$ LANGUAGE plpgsql;

-- Add last_refreshed to each materialized view that needs it
-- Note: For production, you may want to create a backup of these views first

SELECT add_last_refreshed_to_mv('mv_payment_method_summary');
SELECT add_last_refreshed_to_mv('mv_financial_daily_trend');
SELECT add_last_refreshed_to_mv('mv_tax_and_fees');
SELECT add_last_refreshed_to_mv('mv_profit_loss_report');
SELECT add_last_refreshed_to_mv('mv_profit_loss_expense_detail');
SELECT add_last_refreshed_to_mv('mv_product_branch_recommendations');
SELECT add_last_refreshed_to_mv('mv_product_dashboard_attributes');
SELECT add_last_refreshed_to_mv('mv_product_dashboard_category_performance');
SELECT add_last_refreshed_to_mv('mv_product_dashboard_distribution');
SELECT add_last_refreshed_to_mv('mv_product_dashboard_profitability');
SELECT add_last_refreshed_to_mv('mv_product_dashboard_sales_trend');
SELECT add_last_refreshed_to_mv('mv_product_dashboard_stock_turnover');
SELECT add_last_refreshed_to_mv('mv_product_dashboard_summary');
SELECT add_last_refreshed_to_mv('mv_product_dashboard_top_products');
SELECT add_last_refreshed_to_mv('mv_product_recommendations');
SELECT add_last_refreshed_to_mv('mv_product_sales_trend');
SELECT add_last_refreshed_to_mv('mv_expense_analysis');
SELECT add_last_refreshed_to_mv('mv_transaction_fees_by_payment');
SELECT add_last_refreshed_to_mv('inventory_dashboard_view');

-- 3. Create modified refresh strategy with selective and full refresh functions

-- Create function for selective (critical) refresh
CREATE OR REPLACE FUNCTION perform_selective_view_refresh()
RETURNS VOID AS $$
DECLARE
    refresh_error BOOLEAN := FALSE;
    error_message TEXT;
    has_last_refreshed BOOLEAN;
BEGIN
    -- Refresh only semi-real-time views
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_payment_method_summary;
        
        -- Check if last_refreshed column exists before trying to update it
        SELECT EXISTS (
            SELECT 1 
            FROM pg_attribute a
            JOIN pg_class c ON a.attrelid = c.oid
            WHERE c.relname = 'mv_payment_method_summary'
            AND a.attname = 'last_refreshed'
        ) INTO has_last_refreshed;
        
        IF has_last_refreshed THEN
            UPDATE mv_payment_method_summary SET last_refreshed = now();
        END IF;
    EXCEPTION WHEN OTHERS THEN
        refresh_error := TRUE;
        error_message := SQLERRM;
        RAISE NOTICE 'Error refreshing mv_payment_method_summary: %', error_message;
    END;
    
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_daily_trend;
        
        -- Check if last_refreshed column exists
        SELECT EXISTS (
            SELECT 1 
            FROM pg_attribute a
            JOIN pg_class c ON a.attrelid = c.oid
            WHERE c.relname = 'mv_financial_daily_trend'
            AND a.attname = 'last_refreshed'
        ) INTO has_last_refreshed;
        
        IF has_last_refreshed THEN
            UPDATE mv_financial_daily_trend SET last_refreshed = now();
        END IF;
    EXCEPTION WHEN OTHERS THEN
        refresh_error := TRUE;
        error_message := SQLERRM;
        RAISE NOTICE 'Error refreshing mv_financial_daily_trend: %', error_message;
    END;
    
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tax_and_fees;
        
        -- Check if last_refreshed column exists
        SELECT EXISTS (
            SELECT 1 
            FROM pg_attribute a
            JOIN pg_class c ON a.attrelid = c.oid
            WHERE c.relname = 'mv_tax_and_fees'
            AND a.attname = 'last_refreshed'
        ) INTO has_last_refreshed;
        
        IF has_last_refreshed THEN
            UPDATE mv_tax_and_fees SET last_refreshed = now();
        END IF;
    EXCEPTION WHEN OTHERS THEN
        refresh_error := TRUE;
        error_message := SQLERRM;
        RAISE NOTICE 'Error refreshing mv_tax_and_fees: %', error_message;
    END;
    
    -- Log refresh result
    IF refresh_error THEN
        RAISE NOTICE 'Some selective materialized view refreshes failed. Check server logs for details.';
    ELSE
        RAISE NOTICE 'All selective materialized view refreshes completed successfully.';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function for full analytics refresh
CREATE OR REPLACE FUNCTION perform_full_materialized_view_refresh()
RETURNS VOID AS $$
DECLARE
    refresh_error BOOLEAN := FALSE;
    error_message TEXT;
    has_last_refreshed BOOLEAN;
    
    -- Helper function to refresh a view and update its timestamp if possible
    PROCEDURE refresh_mv(mv_name text) AS $$
    DECLARE
        has_column BOOLEAN;
    BEGIN
        EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY ' || mv_name;
        
        -- Check if last_refreshed column exists
        SELECT EXISTS (
            SELECT 1 
            FROM pg_attribute a
            JOIN pg_class c ON a.attrelid = c.oid
            WHERE c.relname = mv_name
            AND a.attname = 'last_refreshed'
        ) INTO has_column;
        
        IF has_column THEN
            EXECUTE 'UPDATE ' || mv_name || ' SET last_refreshed = now()';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        refresh_error := TRUE;
        error_message := SQLERRM;
        RAISE NOTICE 'Error refreshing %: %', mv_name, error_message;
    END;
    $$ LANGUAGE plpgsql;
BEGIN
    -- Refresh all analytics views using the helper procedure
    CALL refresh_mv('mv_profit_loss_report');
    CALL refresh_mv('mv_profit_loss_expense_detail');
    CALL refresh_mv('mv_product_dashboard_attributes');
    CALL refresh_mv('mv_product_dashboard_category_performance');
    CALL refresh_mv('mv_product_dashboard_distribution');
    CALL refresh_mv('mv_product_dashboard_profitability');
    CALL refresh_mv('mv_product_dashboard_sales_trend');
    CALL refresh_mv('mv_product_dashboard_stock_turnover');
    CALL refresh_mv('mv_product_dashboard_summary');
    CALL refresh_mv('mv_product_dashboard_top_products');
    CALL refresh_mv('mv_product_recommendations');
    CALL refresh_mv('mv_product_sales_trend');
    CALL refresh_mv('mv_expense_analysis');
    CALL refresh_mv('mv_transaction_fees_by_payment');
    CALL refresh_mv('inventory_dashboard_view');
    
    -- Log refresh result
    IF refresh_error THEN
        RAISE NOTICE 'Some full materialized view refreshes failed. Check server logs for details.';
    ELSE
        RAISE NOTICE 'All full materialized view refreshes completed successfully.';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Modify the trigger function to use async notification instead of direct refresh
DROP FUNCTION IF EXISTS refresh_financial_materialized_views() CASCADE;
CREATE OR REPLACE FUNCTION refresh_financial_materialized_views()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Use pg_notify to trigger asynchronous refresh instead of doing it directly
  -- This allows the transaction to complete without waiting for the views to refresh
  PERFORM pg_notify('refresh_mv_channel', 'transaction_updated');
  
  -- Return immediately without waiting for refresh
  -- The actual refresh will be handled by a separate process/listener
  RETURN NULL;
END;
$function$;

-- 5. Set up scheduled refreshes (requires pg_cron extension)
-- Note: Make sure pg_cron extension is installed. If not, you'll need to install it
-- or handle scheduling through your application

-- Uncomment these lines if pg_cron is available
/*
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule full refreshes at 3 AM daily
SELECT cron.schedule('0 3 * * *', 'SELECT perform_full_materialized_view_refresh()');

-- Schedule more frequent selective refreshes (hourly)
SELECT cron.schedule('0 * * * *', 'SELECT perform_selective_view_refresh()');
*/

-- 6. Re-create the triggers to use the new async approach
DROP TRIGGER IF EXISTS trg_refresh_financial_views_transaksi ON transaksi;
CREATE TRIGGER trg_refresh_financial_views_transaksi
AFTER INSERT OR UPDATE OR DELETE ON transaksi
FOR EACH STATEMENT EXECUTE FUNCTION refresh_financial_materialized_views();

DROP TRIGGER IF EXISTS trg_refresh_financial_views_transaksi_detail ON transaksi_detail;
CREATE TRIGGER trg_refresh_financial_views_transaksi_detail
AFTER INSERT OR UPDATE OR DELETE ON transaksi_detail
FOR EACH STATEMENT EXECUTE FUNCTION refresh_financial_materialized_views();

DROP TRIGGER IF EXISTS trg_refresh_financial_views_pembayaran ON pembayaran;
CREATE TRIGGER trg_refresh_financial_views_pembayaran
AFTER INSERT OR UPDATE OR DELETE ON pembayaran
FOR EACH STATEMENT EXECUTE FUNCTION refresh_financial_materialized_views(); 