-- DROP FUNCTION public.refresh_financial_materialized_views();

CREATE OR REPLACE FUNCTION public.refresh_financial_materialized_views()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_payment_method_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_daily_trend;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_detail;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_expense_analysis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tax_and_fees;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_transaction_fees_by_payment;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_profit_loss_report;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_profit_loss_expense_detail;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_branch_recommendations;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_dashboard_attributes;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_dashboard_category_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_dashboard_distribution;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_dashboard_profitability;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_dashboard_sales_trend;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_dashboard_stock_turnover;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_dashboard_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_dashboard_top_products;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_recommendations;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_sales_trend;
  RETURN NULL;
END;
$function$
;



-- public.mv_transaction_fees_by_payment source

CREATE MATERIALIZED VIEW public.mv_transaction_fees_by_payment
TABLESPACE pg_default
AS WITH payment_fees AS (
         SELECT COALESCE(t.cabang_id, 'all'::character varying) AS cabang_id,
            p.metode_pembayaran,
            count(p.pembayaran_id) AS transaction_count,
            sum(p.jumlah_bayar) AS total_amount,
                CASE
                    WHEN p.metode_pembayaran::text = 'TUNAI'::text THEN sum(p.jumlah_bayar) * 0.0095
                    WHEN p.metode_pembayaran::text = 'TRANSFER'::text THEN sum(p.jumlah_bayar) * 0.0217
                    WHEN p.metode_pembayaran::text = 'KARTU_DEBIT'::text THEN sum(p.jumlah_bayar) * 0.0205
                    WHEN p.metode_pembayaran::text = 'KARTU_KREDIT'::text THEN sum(p.jumlah_bayar) * 0.0178
                    WHEN p.metode_pembayaran::text = 'QRIS'::text THEN sum(p.jumlah_bayar) * 0.0252
                    WHEN p.metode_pembayaran::text = 'E_WALLET'::text THEN sum(p.jumlah_bayar) * 0.0307
                    ELSE sum(p.jumlah_bayar) * 0.02
                END AS transaction_fees
           FROM transaksi t
             JOIN pembayaran p ON t.transaksi_id::text = p.transaksi_id::text
          WHERE t.deleted_at IS NULL AND t.status_pembayaran <> 'DIBATALKAN'::"StatusPembayaran" AND p.status = 'SUKSES'::"StatusPembayaranProvider" AND t.jenis_transaksi::text = 'PENJUALAN'::text
          GROUP BY ROLLUP(t.cabang_id), p.metode_pembayaran
        )
 SELECT pf.cabang_id,
    pf.metode_pembayaran,
    pf.transaction_count,
    pf.total_amount,
    pf.transaction_fees,
        CASE
            WHEN pf.total_amount > 0::numeric THEN round(pf.transaction_fees * 100.0 / pf.total_amount, 2)
            ELSE 0::numeric
        END AS fee_percentage,
    now() AS last_updated
   FROM payment_fees pf
  WHERE pf.metode_pembayaran IS NOT NULL
WITH DATA;

-- View indexes:
CREATE UNIQUE INDEX idx_mv_transaction_fees_by_payment_unique ON public.mv_transaction_fees_by_payment USING btree (cabang_id, metode_pembayaran);
CREATE INDEX idx_mv_transaction_fees_payment_cabang_id ON public.mv_transaction_fees_by_payment USING btree (cabang_id);
CREATE INDEX idx_mv_transaction_fees_payment_method ON public.mv_transaction_fees_by_payment USING btree (metode_pembayaran);



-- public.mv_tax_and_fees source

CREATE MATERIALIZED VIEW public.mv_tax_and_fees
TABLESPACE pg_default
AS WITH tax_data AS (
         SELECT COALESCE(t.cabang_id, 'all'::character varying) AS cabang_id,
            sum(t.pajak) AS total_tax,
            sum(t.biaya_tambahan) AS total_fees,
            sum(t.total) AS total_sales,
            count(t.transaksi_id) AS transaction_count
           FROM transaksi t
          WHERE t.deleted_at IS NULL AND t.status_pembayaran <> 'DIBATALKAN'::"StatusPembayaran" AND t.jenis_transaksi::text = 'PENJUALAN'::text
          GROUP BY ROLLUP(t.cabang_id)
        )
 SELECT td.cabang_id,
    td.total_tax,
    td.total_fees,
    td.total_sales,
    td.transaction_count,
        CASE
            WHEN td.total_sales > 0::numeric THEN round(td.total_tax * 100.0 / td.total_sales, 2)
            ELSE 0::numeric
        END AS tax_percentage,
        CASE
            WHEN td.total_sales > 0::numeric THEN round(td.total_fees * 100.0 / td.total_sales, 2)
            ELSE 0::numeric
        END AS fees_percentage,
    now() AS last_updated
   FROM tax_data td
WITH DATA;

-- View indexes:
CREATE INDEX idx_mv_tax_and_fees_cabang_id ON public.mv_tax_and_fees USING btree (cabang_id);
CREATE UNIQUE INDEX idx_mv_tax_and_fees_unique ON public.mv_tax_and_fees USING btree (cabang_id);


-- public.mv_profit_loss_report source

CREATE MATERIALIZED VIEW public.mv_profit_loss_report
TABLESPACE pg_default
AS WITH revenue_data AS (
         SELECT COALESCE(t.cabang_id, 'all'::character varying) AS cabang_id,
            date_trunc('month'::text, t.tanggal) AS period_month,
            sum(t.total) AS total_revenue,
            sum(t.subtotal) AS subtotal_revenue,
            sum(t.diskon) AS total_discount,
            sum(t.pajak) AS total_tax,
            sum(t.biaya_tambahan) AS total_additional_fees,
            count(t.transaksi_id) AS transaction_count
           FROM transaksi t
          WHERE t.jenis_transaksi::text = 'PENJUALAN'::text AND t.deleted_at IS NULL AND t.status_pembayaran <> 'DIBATALKAN'::"StatusPembayaran"
          GROUP BY ROLLUP(t.cabang_id), (date_trunc('month'::text, t.tanggal))
        ), expense_details AS (
         SELECT COALESCE(t.cabang_id, 'all'::character varying) AS cabang_id,
            date_trunc('month'::text, t.tanggal) AS period_month,
                CASE
                    WHEN td.produk_id IS NOT NULL THEN 'Pembelian Stok'::text
                    WHEN t.keterangan ~~ '%gaji%'::text THEN 'Gaji Karyawan'::text
                    WHEN t.keterangan ~~ '%sewa%'::text OR t.keterangan ~~ '%gedung%'::text THEN 'Sewa'::text
                    WHEN t.keterangan ~~ '%listrik%'::text OR t.keterangan ~~ '%air%'::text OR t.keterangan ~~ '%utilitas%'::text THEN 'Utilitas'::text
                    WHEN t.keterangan ~~ '%marketing%'::text OR t.keterangan ~~ '%iklan%'::text OR t.keterangan ~~ '%promosi%'::text THEN 'Pemasaran'::text
                    ELSE 'Lainnya'::text
                END AS expense_category,
            sum(COALESCE(td.total, t.total)) AS total_expense
           FROM transaksi t
             LEFT JOIN transaksi_detail td ON t.transaksi_id::text = td.transaksi_id::text
          WHERE t.jenis_transaksi::text = 'PEMBELIAN'::text AND t.deleted_at IS NULL AND t.status_pembayaran <> 'DIBATALKAN'::"StatusPembayaran"
          GROUP BY ROLLUP(t.cabang_id), (date_trunc('month'::text, t.tanggal)), (
                CASE
                    WHEN td.produk_id IS NOT NULL THEN 'Pembelian Stok'::text
                    WHEN t.keterangan ~~ '%gaji%'::text THEN 'Gaji Karyawan'::text
                    WHEN t.keterangan ~~ '%sewa%'::text OR t.keterangan ~~ '%gedung%'::text THEN 'Sewa'::text
                    WHEN t.keterangan ~~ '%listrik%'::text OR t.keterangan ~~ '%air%'::text OR t.keterangan ~~ '%utilitas%'::text THEN 'Utilitas'::text
                    WHEN t.keterangan ~~ '%marketing%'::text OR t.keterangan ~~ '%iklan%'::text OR t.keterangan ~~ '%promosi%'::text THEN 'Pemasaran'::text
                    ELSE 'Lainnya'::text
                END)
        ), expense_summary AS (
         SELECT expense_details.cabang_id,
            expense_details.period_month,
            sum(expense_details.total_expense) AS total_expenses
           FROM expense_details
          GROUP BY expense_details.cabang_id, expense_details.period_month
        ), cogs_data AS (
         SELECT COALESCE(t.cabang_id, 'all'::character varying) AS cabang_id,
            date_trunc('month'::text, t.tanggal) AS period_month,
            sum(td.jumlah::numeric * p.harga_beli) AS total_cogs
           FROM transaksi t
             JOIN transaksi_detail td ON t.transaksi_id::text = td.transaksi_id::text
             JOIN produk p ON td.produk_id::text = p.produk_id
          WHERE t.jenis_transaksi::text = 'PENJUALAN'::text AND t.deleted_at IS NULL AND t.status_pembayaran <> 'DIBATALKAN'::"StatusPembayaran"
          GROUP BY ROLLUP(t.cabang_id), (date_trunc('month'::text, t.tanggal))
        )
 SELECT COALESCE(r.cabang_id, e.cabang_id, c.cabang_id, 'all'::character varying) AS cabang_id,
    COALESCE(r.period_month, e.period_month, c.period_month) AS period_month,
    COALESCE(r.total_revenue, 0::numeric) AS total_revenue,
    COALESCE(r.subtotal_revenue, 0::numeric) AS subtotal_revenue,
    COALESCE(r.total_discount, 0::numeric) AS total_discount,
    COALESCE(r.total_tax, 0::numeric) AS total_tax,
    COALESCE(r.total_additional_fees, 0::numeric) AS total_additional_fees,
    COALESCE(r.transaction_count, 0::bigint) AS sales_transaction_count,
    COALESCE(c.total_cogs, 0::numeric) AS total_cogs,
    COALESCE(r.total_revenue, 0::numeric) - COALESCE(c.total_cogs, 0::numeric) AS gross_profit,
        CASE
            WHEN COALESCE(r.total_revenue, 0::numeric) > 0::numeric THEN round((COALESCE(r.total_revenue, 0::numeric) - COALESCE(c.total_cogs, 0::numeric)) * 100.0 / COALESCE(r.total_revenue, 0::numeric), 2)
            ELSE 0::numeric
        END AS gross_profit_margin,
    COALESCE(e.total_expenses, 0::numeric) AS total_operating_expenses,
    COALESCE(r.total_revenue, 0::numeric) - COALESCE(c.total_cogs, 0::numeric) - COALESCE(e.total_expenses, 0::numeric) AS net_profit,
        CASE
            WHEN COALESCE(r.total_revenue, 0::numeric) > 0::numeric THEN round((COALESCE(r.total_revenue, 0::numeric) - COALESCE(c.total_cogs, 0::numeric) - COALESCE(e.total_expenses, 0::numeric)) * 100.0 / COALESCE(r.total_revenue, 0::numeric), 2)
            ELSE 0::numeric
        END AS net_profit_margin,
    now() AS last_updated
   FROM revenue_data r
     FULL JOIN expense_summary e ON r.cabang_id::text = e.cabang_id::text AND r.period_month = e.period_month
     FULL JOIN cogs_data c ON r.cabang_id::text = c.cabang_id::text AND r.period_month = c.period_month
  WHERE COALESCE(r.period_month, e.period_month, c.period_month) IS NOT NULL
WITH DATA;

-- View indexes:
CREATE INDEX idx_mv_profit_loss_cabang_id ON public.mv_profit_loss_report USING btree (cabang_id);
CREATE INDEX idx_mv_profit_loss_period ON public.mv_profit_loss_report USING btree (period_month);
CREATE UNIQUE INDEX idx_mv_profit_loss_unique ON public.mv_profit_loss_report USING btree (cabang_id, period_month);


-- public.mv_profit_loss_expense_detail source

CREATE MATERIALIZED VIEW public.mv_profit_loss_expense_detail
TABLESPACE pg_default
AS WITH expense_categories AS (
         SELECT COALESCE(t.cabang_id, 'all'::character varying) AS cabang_id,
            date_trunc('month'::text, t.tanggal) AS period_month,
                CASE
                    WHEN td.produk_id IS NOT NULL THEN 'Pembelian Stok'::text
                    WHEN t.keterangan ~~ '%gaji%'::text THEN 'Gaji Karyawan'::text
                    WHEN t.keterangan ~~ '%sewa%'::text OR t.keterangan ~~ '%gedung%'::text THEN 'Sewa'::text
                    WHEN t.keterangan ~~ '%listrik%'::text OR t.keterangan ~~ '%air%'::text OR t.keterangan ~~ '%utilitas%'::text THEN 'Utilitas'::text
                    WHEN t.keterangan ~~ '%marketing%'::text OR t.keterangan ~~ '%iklan%'::text OR t.keterangan ~~ '%promosi%'::text THEN 'Pemasaran'::text
                    ELSE 'Lainnya'::text
                END AS expense_category,
            sum(COALESCE(td.total, t.total)) AS category_expense
           FROM transaksi t
             LEFT JOIN transaksi_detail td ON t.transaksi_id::text = td.transaksi_id::text
          WHERE t.jenis_transaksi::text = 'PEMBELIAN'::text AND t.deleted_at IS NULL AND t.status_pembayaran <> 'DIBATALKAN'::"StatusPembayaran"
          GROUP BY ROLLUP(t.cabang_id), (date_trunc('month'::text, t.tanggal)), (
                CASE
                    WHEN td.produk_id IS NOT NULL THEN 'Pembelian Stok'::text
                    WHEN t.keterangan ~~ '%gaji%'::text THEN 'Gaji Karyawan'::text
                    WHEN t.keterangan ~~ '%sewa%'::text OR t.keterangan ~~ '%gedung%'::text THEN 'Sewa'::text
                    WHEN t.keterangan ~~ '%listrik%'::text OR t.keterangan ~~ '%air%'::text OR t.keterangan ~~ '%utilitas%'::text THEN 'Utilitas'::text
                    WHEN t.keterangan ~~ '%marketing%'::text OR t.keterangan ~~ '%iklan%'::text OR t.keterangan ~~ '%promosi%'::text THEN 'Pemasaran'::text
                    ELSE 'Lainnya'::text
                END)
        ), expense_totals AS (
         SELECT expense_categories.cabang_id,
            expense_categories.period_month,
            sum(expense_categories.category_expense) AS total_expenses
           FROM expense_categories
          WHERE expense_categories.expense_category IS NOT NULL
          GROUP BY expense_categories.cabang_id, expense_categories.period_month
        )
 SELECT ec.cabang_id,
    ec.period_month,
    ec.expense_category,
    ec.category_expense,
    et.total_expenses,
        CASE
            WHEN et.total_expenses > 0::numeric THEN round(ec.category_expense * 100.0 / et.total_expenses, 2)
            ELSE 0::numeric
        END AS expense_percentage,
    now() AS last_updated
   FROM expense_categories ec
     JOIN expense_totals et ON ec.cabang_id::text = et.cabang_id::text AND ec.period_month = et.period_month
  WHERE ec.expense_category IS NOT NULL
WITH DATA;

-- View indexes:
CREATE INDEX idx_mv_profit_loss_expense_detail_cabang_id ON public.mv_profit_loss_expense_detail USING btree (cabang_id);
CREATE INDEX idx_mv_profit_loss_expense_detail_category ON public.mv_profit_loss_expense_detail USING btree (expense_category);
CREATE INDEX idx_mv_profit_loss_expense_detail_period ON public.mv_profit_loss_expense_detail USING btree (period_month);
CREATE UNIQUE INDEX idx_mv_profit_loss_expense_detail_unique ON public.mv_profit_loss_expense_detail USING btree (cabang_id, period_month, expense_category);


-- public.mv_product_sales_trend source

CREATE MATERIALIZED VIEW public.mv_product_sales_trend
TABLESPACE pg_default
AS WITH monthly_sales AS (
         SELECT p.produk_id,
            pm.nama_produk,
            date_trunc('month'::text, t.tanggal) AS month,
            sum(td.jumlah) AS total_sold,
            sum(td.jumlah::numeric * td.harga_satuan) AS total_revenue
           FROM transaksi_detail td
             JOIN transaksi t ON td.transaksi_id::text = t.transaksi_id::text
             JOIN produk p ON td.produk_id::text = p.produk_id
             JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
          WHERE t.tanggal >= (now() - '6 mons'::interval)
          GROUP BY p.produk_id, pm.nama_produk, (date_trunc('month'::text, t.tanggal))
        )
 SELECT row_number() OVER () AS surrogate_key,
    monthly_sales.produk_id,
    monthly_sales.nama_produk,
    monthly_sales.month,
    monthly_sales.total_sold,
    monthly_sales.total_revenue,
    rank() OVER (PARTITION BY monthly_sales.month ORDER BY monthly_sales.total_revenue DESC) AS rank
   FROM monthly_sales
WITH DATA;

-- View indexes:
CREATE UNIQUE INDEX idx_mv_product_sales_trend_unique ON public.mv_product_sales_trend USING btree (surrogate_key);


-- public.mv_product_recommendations source

CREATE MATERIALIZED VIEW public.mv_product_recommendations
TABLESPACE pg_default
AS WITH recent_sales AS (
         SELECT p.produk_id,
            p.produk_master_id,
            pm.nama_produk,
            pm.sku,
            p.stok,
            p.harga_jual,
            p.harga_beli,
            c.nama_cabang,
            p.cabang_id,
            pm.status,
            COALESCE(sum(
                CASE
                    WHEN t.tanggal >= (now() - '30 days'::interval) THEN td.jumlah
                    ELSE 0
                END), 0::bigint) AS sales_30_days,
            COALESCE(sum(
                CASE
                    WHEN t.tanggal >= (now() - '90 days'::interval) AND t.tanggal < (now() - '30 days'::interval) THEN td.jumlah
                    ELSE 0
                END), 0::bigint) AS sales_previous_60_days
           FROM produk p
             JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
             JOIN cabang c ON p.cabang_id = c.cabang_id
             LEFT JOIN transaksi_detail td ON p.produk_id = td.produk_id::text
             LEFT JOIN transaksi t ON td.transaksi_id::text = t.transaksi_id::text
          GROUP BY p.produk_id, p.produk_master_id, pm.nama_produk, pm.sku, p.stok, p.harga_jual, p.harga_beli, c.nama_cabang, p.cabang_id, pm.status
        )
 SELECT recent_sales.produk_id,
    recent_sales.produk_master_id,
    recent_sales.nama_produk,
    recent_sales.sku,
    recent_sales.cabang_id,
    recent_sales.nama_cabang,
    recent_sales.stok,
    recent_sales.sales_30_days,
    recent_sales.sales_previous_60_days,
    recent_sales.status,
        CASE
            WHEN NULLIF(30.0, 0::numeric) IS NOT NULL THEN recent_sales.sales_30_days::numeric / NULLIF(30.0, 0::numeric)
            ELSE 0::numeric
        END AS avg_daily_sales,
        CASE
            WHEN NULLIF(recent_sales.sales_previous_60_days, 0) > 0 THEN
            CASE
                WHEN NULLIF(recent_sales.sales_previous_60_days / 2, 0) IS NOT NULL THEN (recent_sales.sales_30_days - recent_sales.sales_previous_60_days / 2) / NULLIF(recent_sales.sales_previous_60_days / 2, 0) * 100
                ELSE 0::bigint
            END
            WHEN recent_sales.sales_30_days > 0 THEN 100::bigint
            ELSE 0::bigint
        END AS sales_growth,
        CASE
            WHEN recent_sales.stok > 0 AND NULLIF(recent_sales.sales_30_days::numeric / NULLIF(30.0, 0::numeric), 0::numeric) IS NOT NULL AND (recent_sales.sales_30_days::numeric / NULLIF(30.0, 0::numeric)) > 0::numeric THEN round(recent_sales.stok::numeric / NULLIF(recent_sales.sales_30_days::numeric / NULLIF(30.0, 0::numeric), 0::numeric))
            WHEN recent_sales.stok > 0 THEN 999::numeric
            ELSE 0::numeric
        END AS days_until_stock_out,
    recent_sales.harga_jual - recent_sales.harga_beli AS margin,
        CASE
            WHEN NULLIF(recent_sales.harga_jual, 0::numeric) IS NOT NULL THEN (recent_sales.harga_jual - recent_sales.harga_beli) / NULLIF(recent_sales.harga_jual, 0::numeric) * 100::numeric
            ELSE 0::numeric
        END AS margin_percentage
   FROM recent_sales
WITH DATA;

-- View indexes:
CREATE UNIQUE INDEX idx_mv_product_recommendations2_unique ON public.mv_product_recommendations USING btree (produk_id);


-- public.mv_product_dashboard_top_products source

CREATE MATERIALIZED VIEW public.mv_product_dashboard_top_products
TABLESPACE pg_default
AS WITH sales_data AS (
         SELECT p_1.produk_master_id,
            p_1.cabang_id,
            sum(td.jumlah) AS total_sold,
            max(t.tanggal) AS last_sold_date
           FROM transaksi_detail td
             JOIN transaksi t ON td.transaksi_id::text = t.transaksi_id::text
             JOIN produk p_1 ON td.produk_id::text = p_1.produk_id
          WHERE t.tanggal >= (now() - '30 days'::interval) AND t.status_pembayaran = 'LUNAS'::"StatusPembayaran"
          GROUP BY p_1.produk_master_id, p_1.cabang_id
        )
 SELECT row_number() OVER () AS surrogate_key,
    sd.produk_master_id,
    COALESCE(sd.cabang_id, 'all'::text) AS cabang_id,
    pm.nama_produk,
    pm.sku,
    k.kategori_id,
    k.nama_kategori,
    pi.file_path AS gambar,
    sum(p.stok) AS total_stok,
    pm.satuan,
    sum(sd.total_sold) AS total_terjual,
    max(sd.last_sold_date) AS last_sold_date
   FROM sales_data sd
     JOIN produk_master pm ON sd.produk_master_id = pm.produk_master_id
     LEFT JOIN kategori k ON pm.kategori_id = k.kategori_id
     LEFT JOIN produk_image pi ON pm.produk_master_id = pi.produk_master_id AND pi.is_primary = true
     JOIN produk p ON sd.produk_master_id = p.produk_master_id AND (sd.cabang_id = p.cabang_id OR sd.cabang_id IS NULL)
  WHERE pm.deleted_at IS NULL
  GROUP BY sd.produk_master_id, ROLLUP(sd.cabang_id), pm.nama_produk, pm.sku, k.kategori_id, k.nama_kategori, pi.file_path, pm.satuan
  ORDER BY (sum(sd.total_sold)) DESC
WITH DATA;

-- View indexes:
CREATE UNIQUE INDEX idx_mv_product_dashboard_top_products_unique ON public.mv_product_dashboard_top_products USING btree (surrogate_key);


-- public.mv_product_dashboard_summary source

CREATE MATERIALIZED VIEW public.mv_product_dashboard_summary
TABLESPACE pg_default
AS SELECT COALESCE(p.cabang_id, 'all'::text) AS cabang_id,
    count(DISTINCT p.produk_id) AS total_products,
    sum(
        CASE
            WHEN p.status = 'tidak_tersedia'::"ProdukStatus" THEN 1
            ELSE 0
        END) AS inactive_products,
    sum(
        CASE
            WHEN p.stok <= p.min_stok AND p.stok > 0 THEN 1
            ELSE 0
        END) AS stock_low_count,
    sum(
        CASE
            WHEN p.stok = 0 THEN 1
            ELSE 0
        END) AS stock_out_count,
    count(DISTINCT pm.kategori_id) AS total_categories,
    round(sum(p.stok::numeric * p.harga_beli::numeric), 6)::numeric(18,2) AS inventory_value
   FROM produk p
     JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
  WHERE p.deleted_at IS NULL AND pm.deleted_at IS NULL
  GROUP BY ROLLUP(p.cabang_id)
WITH DATA;

-- View indexes:
CREATE UNIQUE INDEX idx_mv_product_dashboard_summary_unique ON public.mv_product_dashboard_summary USING btree (cabang_id);


-- public.mv_product_dashboard_stock_turnover source

CREATE MATERIALIZED VIEW public.mv_product_dashboard_stock_turnover
TABLESPACE pg_default
AS WITH sales_data AS (
         SELECT p.produk_master_id,
            p.cabang_id,
            p.produk_id,
            sum(td.jumlah) AS total_sold_30d,
            p.stok AS current_stock,
            c.nama_cabang
           FROM transaksi_detail td
             JOIN transaksi t ON td.transaksi_id::text = t.transaksi_id::text
             JOIN produk p ON td.produk_id::text = p.produk_id
             JOIN cabang c ON p.cabang_id = c.cabang_id
          WHERE t.tanggal >= (now() - '30 days'::interval) AND t.status_pembayaran = 'LUNAS'::"StatusPembayaran"
          GROUP BY p.produk_master_id, p.cabang_id, p.produk_id, p.stok, c.nama_cabang
        )
 SELECT row_number() OVER () AS surrogate_key,
    sd.produk_master_id,
    COALESCE(sd.cabang_id, 'all'::text) AS cabang_id,
    sd.nama_cabang,
    pm.nama_produk,
    pm.sku,
    sum(sd.total_sold_30d) AS total_sold_30d,
    sum(sd.current_stock) AS total_stock,
    round(
        CASE
            WHEN sum(sd.current_stock) > 0 THEN sum(sd.total_sold_30d) / sum(sd.current_stock)::numeric
            ELSE 0::numeric
        END, 2) AS turnover_rate,
    round(
        CASE
            WHEN sum(sd.total_sold_30d) > 0::numeric THEN sum(sd.current_stock)::numeric / (sum(sd.total_sold_30d) / 30::numeric)
            ELSE 999::numeric
        END, 0) AS days_of_supply
   FROM sales_data sd
     JOIN produk_master pm ON sd.produk_master_id = pm.produk_master_id
  WHERE pm.deleted_at IS NULL
  GROUP BY sd.produk_master_id, ROLLUP(sd.cabang_id), pm.nama_produk, pm.sku, sd.nama_cabang
  ORDER BY (
        CASE
            WHEN sum(sd.current_stock) > 0 THEN sum(sd.total_sold_30d) / sum(sd.current_stock)::numeric
            ELSE 0::numeric
        END) DESC
WITH DATA;

-- View indexes:
CREATE UNIQUE INDEX idx_mv_product_dashboard_stock_turnover_unique ON public.mv_product_dashboard_stock_turnover USING btree (surrogate_key);


-- public.mv_product_dashboard_sales_trend source

CREATE MATERIALIZED VIEW public.mv_product_dashboard_sales_trend
TABLESPACE pg_default
AS WITH monthly_sales AS (
         SELECT p.produk_master_id,
            p.cabang_id,
            pm.nama_produk,
            to_char(t.tanggal, 'YYYY-MM'::text) AS month_key,
            sum(td.jumlah) AS quantity_sold,
            sum(td.jumlah::numeric * td.harga_satuan) AS revenue
           FROM transaksi_detail td
             JOIN transaksi t ON td.transaksi_id::text = t.transaksi_id::text
             JOIN produk p ON td.produk_id::text = p.produk_id
             JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
          WHERE t.tanggal >= (now() - '6 mons'::interval)
          GROUP BY p.produk_master_id, p.cabang_id, pm.nama_produk, (to_char(t.tanggal, 'YYYY-MM'::text))
        ), product_totals AS (
         SELECT monthly_sales.produk_master_id,
            monthly_sales.cabang_id,
            monthly_sales.nama_produk,
            sum(monthly_sales.quantity_sold) AS total_sold,
            sum(monthly_sales.revenue) AS total_revenue
           FROM monthly_sales
          GROUP BY monthly_sales.produk_master_id, monthly_sales.cabang_id, monthly_sales.nama_produk
        )
 SELECT row_number() OVER () AS surrogate_key,
    pt.produk_master_id,
    COALESCE(pt.cabang_id, 'all'::text) AS cabang_id,
    pt.nama_produk,
    pt.total_sold,
    pt.total_revenue,
    ms.month_key,
    ms.quantity_sold,
    ms.revenue
   FROM product_totals pt
     JOIN monthly_sales ms ON pt.produk_master_id = ms.produk_master_id AND (pt.cabang_id = ms.cabang_id OR pt.cabang_id IS NULL)
  ORDER BY pt.total_revenue DESC, pt.produk_master_id, ms.month_key
WITH DATA;

-- View indexes:
CREATE UNIQUE INDEX idx_mv_product_dashboard_sales_trend_unique ON public.mv_product_dashboard_sales_trend USING btree (surrogate_key);


-- public.mv_product_dashboard_profitability source

CREATE MATERIALIZED VIEW public.mv_product_dashboard_profitability
TABLESPACE pg_default
AS WITH product_data AS (
         SELECT p.produk_id,
            p.produk_master_id,
            p.cabang_id,
            p.harga_beli,
            p.harga_jual,
            p.harga_jual - p.harga_beli AS margin,
                CASE
                    WHEN p.harga_jual > 0::numeric THEN (p.harga_jual - p.harga_beli) / p.harga_jual * 100::numeric
                    ELSE 0::numeric
                END AS margin_percentage,
            pm.nama_produk,
            pm.sku,
            k.kategori_id,
            k.nama_kategori,
            c.nama_cabang,
            COALESCE(sum(td.jumlah), 0::bigint) AS total_sold,
            COALESCE(sum(td.jumlah::numeric * td.harga_satuan), 0::numeric) AS total_revenue,
            COALESCE(sum(td.jumlah::numeric * (td.harga_satuan - p.harga_beli)), 0::numeric) AS total_profit
           FROM produk p
             JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
             JOIN cabang c ON p.cabang_id = c.cabang_id
             LEFT JOIN kategori k ON pm.kategori_id = k.kategori_id
             LEFT JOIN transaksi_detail td ON td.produk_id::text = p.produk_id
             LEFT JOIN transaksi t ON td.transaksi_id::text = t.transaksi_id::text AND t.status_pembayaran = 'LUNAS'::"StatusPembayaran"
          WHERE pm.deleted_at IS NULL
          GROUP BY p.produk_id, p.produk_master_id, p.cabang_id, p.harga_beli, p.harga_jual, pm.nama_produk, pm.sku, k.kategori_id, k.nama_kategori, c.nama_cabang
        )
 SELECT row_number() OVER () AS surrogate_key,
    pd.produk_id AS id,
    pd.produk_master_id,
    COALESCE(pd.cabang_id, 'all'::text) AS cabang_id,
    pd.nama_produk,
    pd.sku,
    COALESCE(pd.nama_kategori, 'Tidak ada kategori'::text::character varying) AS kategori,
    pd.nama_cabang AS cabang,
    pd.harga_beli,
    pd.harga_jual,
    pd.margin,
    round(pd.margin_percentage, 2) AS margin_percentage,
    sum(pd.total_sold) AS total_sold,
    sum(pd.total_revenue) AS total_revenue,
    sum(pd.total_profit) AS total_profit,
        CASE
            WHEN sum(pd.total_sold) > 0::numeric AND pd.harga_beli > 0::numeric THEN round(sum(pd.total_profit) / (pd.harga_beli * sum(pd.total_sold)) * 100::numeric, 2)
            ELSE 0::numeric
        END AS roi
   FROM product_data pd
  GROUP BY pd.produk_id, pd.produk_master_id, ROLLUP(pd.cabang_id), pd.nama_produk, pd.sku, pd.nama_kategori, pd.nama_cabang, pd.harga_beli, pd.harga_jual, pd.margin, pd.margin_percentage
  ORDER BY (sum(pd.total_profit))
WITH DATA;

-- View indexes:
CREATE UNIQUE INDEX idx_mv_product_dashboard_profitability_unique ON public.mv_product_dashboard_profitability USING btree (surrogate_key);

-- public.mv_product_dashboard_distribution source

CREATE MATERIALIZED VIEW public.mv_product_dashboard_distribution
TABLESPACE pg_default
AS SELECT row_number() OVER () AS surrogate_key,
    COALESCE(p.cabang_id, 'all'::text) AS cabang_id,
    k.kategori_id,
    k.nama_kategori,
    count(DISTINCT p.produk_id) AS jumlah_produk
   FROM produk p
     JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
     JOIN kategori k ON pm.kategori_id = k.kategori_id
  WHERE p.deleted_at IS NULL AND pm.deleted_at IS NULL AND k.deleted_at IS NULL
  GROUP BY ROLLUP(p.cabang_id), k.kategori_id, k.nama_kategori
WITH DATA;

-- View indexes:
CREATE UNIQUE INDEX idx_mv_product_dashboard_distribution_unique ON public.mv_product_dashboard_distribution USING btree (surrogate_key);


-- public.mv_product_dashboard_category_performance source

CREATE MATERIALIZED VIEW public.mv_product_dashboard_category_performance
TABLESPACE pg_default
AS WITH category_data AS (
         SELECT pm.kategori_id,
            p.cabang_id,
            c.nama_cabang,
            sum(td.jumlah) AS total_sold,
            sum(td.jumlah::numeric * td.harga_satuan) AS total_revenue,
            sum(td.jumlah::numeric * (td.harga_satuan - p.harga_beli)) AS total_profit,
            count(DISTINCT p.produk_id) AS product_count,
            sum(p.stok) AS total_stock,
            sum(p.stok::numeric * p.harga_beli) AS inventory_value
           FROM produk p
             JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
             JOIN cabang c ON p.cabang_id = c.cabang_id
             LEFT JOIN transaksi_detail td ON td.produk_id::text = p.produk_id
             LEFT JOIN transaksi t ON td.transaksi_id::text = t.transaksi_id::text AND t.status_pembayaran = 'LUNAS'::"StatusPembayaran"
          WHERE pm.kategori_id IS NOT NULL AND pm.deleted_at IS NULL
          GROUP BY pm.kategori_id, p.cabang_id, c.nama_cabang
        )
 SELECT row_number() OVER () AS surrogate_key,
    cd.kategori_id AS id,
    COALESCE(cd.cabang_id, 'all'::text) AS cabang_id,
    cd.nama_cabang,
    k.nama_kategori,
    sum(cd.total_sold) AS total_sold,
    sum(cd.total_revenue) AS total_revenue,
    sum(cd.total_profit) AS total_profit,
    sum(cd.product_count) AS total_products,
    sum(cd.total_stock) AS total_stock,
    sum(cd.inventory_value) AS inventory_value,
    round(
        CASE
            WHEN sum(cd.product_count) > 0::numeric THEN sum(cd.total_revenue) / sum(cd.product_count)
            ELSE 0::numeric
        END, 2) AS avgrevenueperproduct,
    round(
        CASE
            WHEN sum(cd.total_sold) > 0::numeric THEN sum(cd.total_stock) / sum(cd.total_sold)
            ELSE 0::numeric
        END, 2) AS stocktosalesratio
   FROM category_data cd
     JOIN kategori k ON cd.kategori_id = k.kategori_id
  WHERE k.deleted_at IS NULL
  GROUP BY cd.kategori_id, ROLLUP(cd.cabang_id), k.nama_kategori, cd.nama_cabang
  ORDER BY (sum(cd.total_revenue)) DESC
WITH DATA;

-- View indexes:
CREATE INDEX idx_mv_product_dashboard_category_performance_cabang_id ON public.mv_product_dashboard_category_performance USING btree (cabang_id);
CREATE INDEX idx_mv_product_dashboard_category_performance_kategori_id ON public.mv_product_dashboard_category_performance USING btree (id);
CREATE UNIQUE INDEX idx_mv_product_dashboard_category_performance_unique ON public.mv_product_dashboard_category_performance USING btree (surrogate_key);


-- public.mv_product_dashboard_attributes source

CREATE MATERIALIZED VIEW public.mv_product_dashboard_attributes
TABLESPACE pg_default
AS SELECT COALESCE(p.cabang_id, 'all'::text) AS cabang_id,
    sum(
        CASE
            WHEN pm.sku IS NOT NULL AND pm.sku::text <> ''::text THEN 1
            ELSE 0
        END) AS with_sku,
    sum(
        CASE
            WHEN pm.barcode IS NOT NULL AND pm.barcode::text <> ''::text THEN 1
            ELSE 0
        END) AS with_barcode,
    sum(
        CASE
            WHEN pm.deskripsi IS NOT NULL AND pm.deskripsi <> ''::text THEN 1
            ELSE 0
        END) AS with_description,
    sum(
        CASE
            WHEN pi.image_id IS NOT NULL THEN 1
            ELSE 0
        END) AS with_images,
    sum(
        CASE
            WHEN pi.image_id IS NULL THEN 1
            ELSE 0
        END) AS without_images,
    sum(
        CASE
            WHEN pm.berat IS NOT NULL AND pm.berat > 0::numeric THEN 1
            ELSE 0
        END) AS with_weight,
    sum(
        CASE
            WHEN pm.dimensi_p IS NOT NULL AND pm.dimensi_p > 0::numeric OR pm.dimensi_l IS NOT NULL AND pm.dimensi_l > 0::numeric OR pm.dimensi_t IS NOT NULL AND pm.dimensi_t > 0::numeric THEN 1
            ELSE 0
        END) AS with_dimension
   FROM produk p
     JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
     LEFT JOIN produk_image pi ON pm.produk_master_id = pi.produk_master_id AND pi.is_primary = true
  WHERE p.deleted_at IS NULL AND pm.deleted_at IS NULL
  GROUP BY ROLLUP(p.cabang_id)
WITH DATA;

-- View indexes:
CREATE UNIQUE INDEX idx_mv_product_dashboard_attributes_unique ON public.mv_product_dashboard_attributes USING btree (cabang_id);


-- public.mv_product_branch_recommendations source

CREATE MATERIALIZED VIEW public.mv_product_branch_recommendations
TABLESPACE pg_default
AS WITH branch_product_matrix AS (
         SELECT pm.produk_master_id,
            c.cabang_id,
                CASE
                    WHEN p.produk_id IS NOT NULL THEN true
                    ELSE false
                END AS exists_in_branch
           FROM ( SELECT produk_master.produk_master_id
                   FROM produk_master
                  WHERE produk_master.deleted_at IS NULL AND produk_master.status = 'aktif'::"ProdukMasterStatus") pm
             CROSS JOIN ( SELECT cabang.cabang_id
                   FROM cabang
                  WHERE cabang.deleted_at IS NULL AND cabang.status = 'aktif'::"CabangStatus") c
             LEFT JOIN produk p ON p.produk_master_id = pm.produk_master_id AND p.cabang_id = c.cabang_id
        ), product_popularity AS (
         SELECT p.produk_master_id,
            p.cabang_id,
            p.harga_beli,
            p.harga_jual,
            pm.nama_produk,
            pm.sku,
            pm.barcode,
            pm.satuan,
            k.kategori_id,
            k.nama_kategori,
            COALESCE(( SELECT sum(td.jumlah) AS sum
                   FROM transaksi_detail td
                     JOIN transaksi t ON td.transaksi_id::text = t.transaksi_id::text
                  WHERE td.produk_id::text = p.produk_id AND t.status_pembayaran = 'LUNAS'::"StatusPembayaran"), 0::bigint) AS total_sold,
            ( SELECT pi.file_path
                   FROM produk_image pi
                  WHERE pi.produk_master_id = p.produk_master_id AND pi.is_primary = true
                 LIMIT 1) AS gambar,
            p.created_at
           FROM produk p
             JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
             LEFT JOIN kategori k ON pm.kategori_id = k.kategori_id
          WHERE pm.deleted_at IS NULL AND pm.status = 'aktif'::"ProdukMasterStatus"
        )
 SELECT bpm.cabang_id AS target_cabang_id,
    pp.produk_master_id AS id,
    pp.nama_produk,
    pp.sku,
    pp.kategori_id,
    pp.nama_kategori,
    pp.satuan,
    pp.gambar,
    pp.total_sold AS total_terjual,
    pp.harga_beli AS rekomendasi_harga_beli,
    pp.harga_jual AS rekomendasi_harga_jual,
    10 AS rekomendasi_stok_awal,
    pp.total_sold AS popularitas_score,
    pp.created_at
   FROM branch_product_matrix bpm
     JOIN product_popularity pp ON pp.produk_master_id = bpm.produk_master_id AND pp.cabang_id <> bpm.cabang_id
  WHERE bpm.exists_in_branch = false
  ORDER BY pp.total_sold DESC, pp.created_at DESC
WITH DATA;

-- View indexes:
CREATE UNIQUE INDEX idx_mv_product_branch_recommendations_unique ON public.mv_product_branch_recommendations USING btree (kategori_id, nama_produk, sku, target_cabang_id);
CREATE INDEX idx_mv_product_recommendations_nama_produk ON public.mv_product_branch_recommendations USING btree (nama_produk);
CREATE INDEX idx_mv_product_recommendations_sku ON public.mv_product_branch_recommendations USING btree (sku);
CREATE INDEX idx_mv_product_recommendations_target_cabang ON public.mv_product_branch_recommendations USING btree (target_cabang_id);
CREATE INDEX idx_mv_product_recommendations_unique ON public.mv_product_branch_recommendations USING btree (kategori_id);


-- public.mv_payment_method_summary source

CREATE MATERIALIZED VIEW public.mv_payment_method_summary
TABLESPACE pg_default
AS WITH payment_data AS (
         SELECT COALESCE(t.cabang_id, 'all'::character varying) AS cabang_id,
            date(t.tanggal) AS transaction_date,
            p.metode_pembayaran,
            sum(p.jumlah_bayar) AS total_amount,
            count(p.pembayaran_id) AS transaction_count
           FROM transaksi t
             JOIN pembayaran p ON t.transaksi_id::text = p.transaksi_id::text
          WHERE t.deleted_at IS NULL AND t.status_pembayaran <> 'DIBATALKAN'::"StatusPembayaran" AND p.status = 'SUKSES'::"StatusPembayaranProvider" AND t.jenis_transaksi::text = 'PENJUALAN'::text
          GROUP BY ROLLUP(t.cabang_id), (date(t.tanggal)), p.metode_pembayaran
        )
 SELECT pd.cabang_id,
    pd.transaction_date,
    pd.metode_pembayaran,
    pd.total_amount,
    pd.transaction_count,
    sum(pd.total_amount) OVER (PARTITION BY pd.cabang_id, pd.transaction_date) AS total_daily_payments,
        CASE
            WHEN sum(pd.total_amount) OVER (PARTITION BY pd.cabang_id, pd.transaction_date) > 0::numeric THEN round(pd.total_amount * 100.0 / sum(pd.total_amount) OVER (PARTITION BY pd.cabang_id, pd.transaction_date), 2)
            ELSE 0::numeric
        END AS percentage,
    now() AS last_updated
   FROM payment_data pd
  WHERE pd.metode_pembayaran IS NOT NULL
WITH DATA;

-- View indexes:
CREATE INDEX idx_mv_payment_method_summary_cabang_id ON public.mv_payment_method_summary USING btree (cabang_id);
CREATE INDEX idx_mv_payment_method_summary_date ON public.mv_payment_method_summary USING btree (transaction_date);
CREATE INDEX idx_mv_payment_method_summary_method ON public.mv_payment_method_summary USING btree (metode_pembayaran);
CREATE UNIQUE INDEX idx_mv_payment_method_summary_unique ON public.mv_payment_method_summary USING btree (cabang_id, transaction_date, metode_pembayaran);


-- public.mv_financial_summary source

CREATE MATERIALIZED VIEW public.mv_financial_summary
TABLESPACE pg_default
AS WITH transaction_data AS (
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
  GROUP BY td.cabang_id, td.transaction_date
WITH DATA;

-- View indexes:
CREATE INDEX idx_mv_financial_summary_cabang_id ON public.mv_financial_summary USING btree (cabang_id);
CREATE INDEX idx_mv_financial_summary_date ON public.mv_financial_summary USING btree (transaction_date);
CREATE UNIQUE INDEX idx_mv_financial_summary_unique ON public.mv_financial_summary USING btree (cabang_id, transaction_date);


-- public.mv_financial_detail source

CREATE MATERIALIZED VIEW public.mv_financial_detail
TABLESPACE pg_default
AS WITH transaction_detail AS (
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
             LEFT JOIN ( SELECT td_1.transaksi_id,
                    sum(td_1.jumlah::numeric * p_1.harga_beli) AS total_cost
                   FROM transaksi_detail td_1
                     JOIN produk p_1 ON td_1.produk_id::text = p_1.produk_id
                  GROUP BY td_1.transaksi_id) cogs ON t.transaksi_id::text = cogs.transaksi_id::text
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
   FROM transaction_detail td
WITH DATA;

-- View indexes:
CREATE INDEX idx_mv_financial_detail_cabang_id ON public.mv_financial_detail USING btree (cabang_id);
CREATE INDEX idx_mv_financial_detail_date ON public.mv_financial_detail USING btree (transaction_date);
CREATE INDEX idx_mv_financial_detail_jenis ON public.mv_financial_detail USING btree (jenis_transaksi);
CREATE UNIQUE INDEX idx_mv_financial_detail_unique ON public.mv_financial_detail USING btree (transaksi_id);


-- public.mv_financial_daily_trend source

CREATE MATERIALIZED VIEW public.mv_financial_daily_trend
TABLESPACE pg_default
AS WITH daily_data AS (
         SELECT COALESCE(t.cabang_id, 'all'::character varying) AS cabang_id,
            date(t.tanggal) AS transaction_date,
            t.jenis_transaksi,
            sum(t.total) AS total_amount
           FROM transaksi t
          WHERE t.deleted_at IS NULL AND t.status_pembayaran <> 'DIBATALKAN'::"StatusPembayaran" AND t.tanggal >= (CURRENT_DATE - '60 days'::interval)
          GROUP BY ROLLUP(t.cabang_id), (date(t.tanggal)), t.jenis_transaksi
        )
 SELECT dd.cabang_id,
    dd.transaction_date,
    sum(
        CASE
            WHEN dd.jenis_transaksi::text = 'PENJUALAN'::text THEN dd.total_amount
            ELSE 0::numeric
        END) AS pendapatan,
    sum(
        CASE
            WHEN dd.jenis_transaksi::text = 'PEMBELIAN'::text THEN dd.total_amount
            ELSE 0::numeric
        END) AS pengeluaran,
    sum(
        CASE
            WHEN dd.jenis_transaksi::text = 'PENJUALAN'::text THEN dd.total_amount
            ELSE 0::numeric
        END) - sum(
        CASE
            WHEN dd.jenis_transaksi::text = 'PEMBELIAN'::text THEN dd.total_amount
            ELSE 0::numeric
        END) AS keuntungan,
    now() AS last_updated
   FROM daily_data dd
  GROUP BY dd.cabang_id, dd.transaction_date
  ORDER BY dd.transaction_date
WITH DATA;

-- View indexes:
CREATE INDEX idx_mv_financial_daily_trend_cabang_id ON public.mv_financial_daily_trend USING btree (cabang_id);
CREATE INDEX idx_mv_financial_daily_trend_date ON public.mv_financial_daily_trend USING btree (transaction_date);
CREATE UNIQUE INDEX idx_mv_financial_daily_trend_unique ON public.mv_financial_daily_trend USING btree (cabang_id, transaction_date);


-- public.mv_expense_analysis source

CREATE MATERIALIZED VIEW public.mv_expense_analysis
TABLESPACE pg_default
AS WITH expense_data AS (
         SELECT COALESCE(t.cabang_id, 'all'::character varying) AS cabang_id,
                CASE
                    WHEN td.produk_id IS NOT NULL THEN 'Pembelian Stok'::text
                    ELSE 'Lainnya'::text
                END AS expense_category,
            sum(td.total) AS total_amount
           FROM transaksi t
             JOIN transaksi_detail td ON t.transaksi_id::text = td.transaksi_id::text
             LEFT JOIN produk p ON td.produk_id::text = p.produk_id
             LEFT JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
          WHERE t.deleted_at IS NULL AND t.status_pembayaran <> 'DIBATALKAN'::"StatusPembayaran" AND t.jenis_transaksi::text = 'PEMBELIAN'::text
          GROUP BY ROLLUP(t.cabang_id), (
                CASE
                    WHEN td.produk_id IS NOT NULL THEN 'Pembelian Stok'::text
                    ELSE 'Lainnya'::text
                END)
        UNION ALL
         SELECT COALESCE(t.cabang_id, 'all'::character varying) AS cabang_id,
            'Gaji Karyawan'::text AS expense_category,
            sum(t.total) AS total_amount
           FROM transaksi t
          WHERE t.deleted_at IS NULL AND t.status_pembayaran <> 'DIBATALKAN'::"StatusPembayaran" AND t.jenis_transaksi::text = 'PEMBELIAN'::text AND t.keterangan ~~ '%gaji%'::text
          GROUP BY ROLLUP(t.cabang_id)
        UNION ALL
         SELECT COALESCE(t.cabang_id, 'all'::character varying) AS cabang_id,
            'Utilitas'::text AS expense_category,
            sum(t.total) AS total_amount
           FROM transaksi t
          WHERE t.deleted_at IS NULL AND t.status_pembayaran <> 'DIBATALKAN'::"StatusPembayaran" AND t.jenis_transaksi::text = 'PEMBELIAN'::text AND (t.keterangan ~~ '%listrik%'::text OR t.keterangan ~~ '%air%'::text OR t.keterangan ~~ '%utilitas%'::text)
          GROUP BY ROLLUP(t.cabang_id)
        UNION ALL
         SELECT COALESCE(t.cabang_id, 'all'::character varying) AS cabang_id,
            'Sewa'::text AS expense_category,
            sum(t.total) AS total_amount
           FROM transaksi t
          WHERE t.deleted_at IS NULL AND t.status_pembayaran <> 'DIBATALKAN'::"StatusPembayaran" AND t.jenis_transaksi::text = 'PEMBELIAN'::text AND (t.keterangan ~~ '%sewa%'::text OR t.keterangan ~~ '%gedung%'::text)
          GROUP BY ROLLUP(t.cabang_id)
        UNION ALL
         SELECT COALESCE(t.cabang_id, 'all'::character varying) AS cabang_id,
            'Pemasaran'::text AS expense_category,
            sum(t.total) AS total_amount
           FROM transaksi t
          WHERE t.deleted_at IS NULL AND t.status_pembayaran <> 'DIBATALKAN'::"StatusPembayaran" AND t.jenis_transaksi::text = 'PEMBELIAN'::text AND (t.keterangan ~~ '%marketing%'::text OR t.keterangan ~~ '%iklan%'::text OR t.keterangan ~~ '%promosi%'::text)
          GROUP BY ROLLUP(t.cabang_id)
        )
 SELECT ed.cabang_id,
    ed.expense_category,
    COALESCE(ed.total_amount, 0::numeric) AS total_amount,
    sum(ed.total_amount) OVER (PARTITION BY ed.cabang_id) AS total_expenses,
        CASE
            WHEN sum(ed.total_amount) OVER (PARTITION BY ed.cabang_id) > 0::numeric THEN round(ed.total_amount * 100.0 / sum(ed.total_amount) OVER (PARTITION BY ed.cabang_id), 2)
            ELSE 0::numeric
        END AS percentage,
    now() AS last_updated
   FROM expense_data ed
  WHERE ed.expense_category IS NOT NULL
WITH DATA;

-- View indexes:
CREATE INDEX idx_mv_expense_analysis_cabang_id ON public.mv_expense_analysis USING btree (cabang_id);
CREATE INDEX idx_mv_expense_analysis_category ON public.mv_expense_analysis USING btree (expense_category);
CREATE UNIQUE INDEX idx_mv_expense_analysis_unique ON public.mv_expense_analysis USING btree (cabang_id, expense_category);


-- public.inventory_dashboard_view source

CREATE MATERIALIZED VIEW public.inventory_dashboard_view
TABLESPACE pg_default
AS WITH inventory_summary AS (
         SELECT p.cabang_id,
            count(p.produk_id) AS total_products,
            count(
                CASE
                    WHEN p.stok <= p.min_stok AND p.stok > 0 THEN 1
                    ELSE NULL::integer
                END) AS low_stock_count,
            count(
                CASE
                    WHEN p.stok = 0 THEN 1
                    ELSE NULL::integer
                END) AS out_of_stock_count,
            sum(p.stok) AS total_stock,
            sum(p.harga_beli * p.stok::numeric) AS total_value
           FROM produk p
          WHERE p.status = 'tersedia'::"ProdukStatus"
          GROUP BY p.cabang_id
        ), stock_movements_30d AS (
         SELECT im.cabang_id,
            count(*) AS movement_count,
            sum(
                CASE
                    WHEN im.quantity > 0 THEN im.quantity
                    ELSE 0
                END) AS stock_in,
            sum(
                CASE
                    WHEN im.quantity < 0 THEN abs(im.quantity)
                    ELSE 0
                END) AS stock_out
           FROM inventory_movement im
          WHERE im.created_at >= (now() - '30 days'::interval)
          GROUP BY im.cabang_id
        ), stock_movements_60d_30d AS (
         SELECT im.cabang_id,
            count(*) AS movement_count,
            sum(
                CASE
                    WHEN im.quantity > 0 THEN im.quantity
                    ELSE 0
                END) AS stock_in,
            sum(
                CASE
                    WHEN im.quantity < 0 THEN abs(im.quantity)
                    ELSE 0
                END) AS stock_out
           FROM inventory_movement im
          WHERE im.created_at >= (now() - '60 days'::interval) AND im.created_at < (now() - '30 days'::interval)
          GROUP BY im.cabang_id
        ), branch_transfers_30d AS (
         SELECT c_1.cabang_id,
            count(DISTINCT st.transfer_id) AS transfer_count,
            count(DISTINCT
                CASE
                    WHEN st.cabang_asal_id = c_1.cabang_id THEN st.cabang_tujuan_id
                    ELSE st.cabang_asal_id
                END) AS branch_count
           FROM cabang c_1
             LEFT JOIN stock_transfer st ON st.cabang_asal_id = c_1.cabang_id OR st.cabang_tujuan_id = c_1.cabang_id
          WHERE st.created_at >= (now() - '30 days'::interval)
          GROUP BY c_1.cabang_id
        ), expiring_products_30d AS (
         SELECT p.cabang_id,
            count(p.produk_id) AS expiring_count
           FROM produk p
          WHERE p.tanggal_kedaluwarsa IS NOT NULL AND p.tanggal_kedaluwarsa <= (now() + '30 days'::interval) AND p.tanggal_kedaluwarsa > now() AND p.status = 'tersedia'::"ProdukStatus"
          GROUP BY p.cabang_id
        )
 SELECT c.cabang_id,
    c.nama_cabang,
    COALESCE(inv_summary.total_products, 0::bigint) AS total_products,
    COALESCE(inv_summary.low_stock_count, 0::bigint) AS low_stock_count,
    COALESCE(inv_summary.out_of_stock_count, 0::bigint) AS out_of_stock_count,
    COALESCE(exp.expiring_count, 0::bigint) AS expiring_soon_count,
    COALESCE(inv_summary.total_stock, 0::bigint) AS total_stock,
    COALESCE(inv_summary.total_value, 0::numeric) AS total_value,
    COALESCE(sm30.movement_count, 0::bigint) AS movement_count_30d,
    COALESCE(sm30.stock_in, 0::bigint) AS stock_in_30d,
    COALESCE(sm30.stock_out, 0::bigint) AS stock_out_30d,
    COALESCE(sm60.movement_count, 0::bigint) AS movement_count_60d_30d,
    COALESCE(sm60.stock_in, 0::bigint) AS stock_in_60d_30d,
    COALESCE(sm60.stock_out, 0::bigint) AS stock_out_60d_30d,
        CASE
            WHEN COALESCE(sm60.movement_count, 0::bigint) = 0 THEN 0::numeric
            ELSE round((COALESCE(sm30.movement_count, 0::bigint) - COALESCE(sm60.movement_count, 0::bigint))::numeric * 100.0 / NULLIF(COALESCE(sm60.movement_count, 0::bigint), 0)::numeric, 2)
        END AS movement_change_pct,
        CASE
            WHEN COALESCE(sm60.stock_in, 0::bigint) = 0 THEN 0::numeric
            ELSE round((COALESCE(sm30.stock_in, 0::bigint) - COALESCE(sm60.stock_in, 0::bigint))::numeric * 100.0 / NULLIF(COALESCE(sm60.stock_in, 0::bigint), 0)::numeric, 2)
        END AS stock_in_change_pct,
        CASE
            WHEN COALESCE(sm60.stock_out, 0::bigint) = 0 THEN 0::numeric
            ELSE round((COALESCE(sm30.stock_out, 0::bigint) - COALESCE(sm60.stock_out, 0::bigint))::numeric * 100.0 / NULLIF(COALESCE(sm60.stock_out, 0::bigint), 0)::numeric, 2)
        END AS stock_out_change_pct,
        CASE
            WHEN (( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.created_at >= (now() - '60 days'::interval) AND p.created_at < (now() - '30 days'::interval))) = 0 THEN 0::numeric
            ELSE round(((( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.created_at >= (now() - '30 days'::interval))) - (( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.created_at >= (now() - '60 days'::interval) AND p.created_at < (now() - '30 days'::interval))))::numeric * 100.0 / NULLIF(( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.created_at >= (now() - '60 days'::interval) AND p.created_at < (now() - '30 days'::interval)), 0)::numeric, 2)
        END AS total_products_change_pct,
        CASE
            WHEN (( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.stok <= p.min_stok AND p.stok > 0 AND p.status = 'tersedia'::"ProdukStatus" AND p.updated_at >= (now() - '60 days'::interval) AND p.updated_at < (now() - '30 days'::interval))) = 0 THEN 0::numeric
            ELSE round((COALESCE(inv_summary.low_stock_count, 0::bigint) - (( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.stok <= p.min_stok AND p.stok > 0 AND p.status = 'tersedia'::"ProdukStatus" AND p.updated_at >= (now() - '60 days'::interval) AND p.updated_at < (now() - '30 days'::interval))))::numeric * 100.0 / NULLIF(( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.stok <= p.min_stok AND p.stok > 0 AND p.status = 'tersedia'::"ProdukStatus" AND p.updated_at >= (now() - '60 days'::interval) AND p.updated_at < (now() - '30 days'::interval)), 0)::numeric, 2)
        END AS low_stock_change_pct,
        CASE
            WHEN (( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.stok = 0 AND p.status = 'tersedia'::"ProdukStatus" AND p.updated_at >= (now() - '60 days'::interval) AND p.updated_at < (now() - '30 days'::interval))) = 0 THEN 0::numeric
            ELSE round((COALESCE(inv_summary.out_of_stock_count, 0::bigint) - (( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.stok = 0 AND p.status = 'tersedia'::"ProdukStatus" AND p.updated_at >= (now() - '60 days'::interval) AND p.updated_at < (now() - '30 days'::interval))))::numeric * 100.0 / NULLIF(( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.stok = 0 AND p.status = 'tersedia'::"ProdukStatus" AND p.updated_at >= (now() - '60 days'::interval) AND p.updated_at < (now() - '30 days'::interval)), 0)::numeric, 2)
        END AS out_of_stock_change_pct,
    COALESCE(bt.transfer_count, 0::bigint) AS branch_transfer_count,
    COALESCE(bt.branch_count, 0::bigint) AS branch_count,
    now() AS last_refreshed
   FROM cabang c
     LEFT JOIN inventory_summary inv_summary ON c.cabang_id = inv_summary.cabang_id
     LEFT JOIN stock_movements_30d sm30 ON c.cabang_id = sm30.cabang_id
     LEFT JOIN stock_movements_60d_30d sm60 ON c.cabang_id = sm60.cabang_id
     LEFT JOIN branch_transfers_30d bt ON c.cabang_id = bt.cabang_id
     LEFT JOIN expiring_products_30d exp ON c.cabang_id = exp.cabang_id
  WHERE c.status = 'aktif'::"CabangStatus"
WITH DATA;

-- View indexes:
CREATE UNIQUE INDEX inventory_dashboard_view_cabang_id_idx ON public.inventory_dashboard_view USING btree (cabang_id);