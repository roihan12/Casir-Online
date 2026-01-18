-- Materialized views for product dashboard optimization
-- These views should be created directly in the database as Prisma doesn't natively support materialized views

-- 1. Product Summary Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_dashboard_summary AS
SELECT
    COALESCE(p."cabangId", 'all') AS cabang_id,
    COUNT(DISTINCT p.id) AS total_products,
    SUM(CASE WHEN p.status = 'inactive' THEN 1 ELSE 0 END) AS inactive_products,
    SUM(CASE WHEN p.stok <= pm."stokMinimum" AND p.stok > 0 THEN 1 ELSE 0 END) AS stock_low_count,
    SUM(CASE WHEN p.stok = 0 THEN 1 ELSE 0 END) AS stock_out_count,
    COUNT(DISTINCT pm."kategoriId") AS total_categories,
    SUM(p.stok * p."hargaBeli") AS inventory_value
FROM
    "produk" p
JOIN
    "produkMaster" pm ON p."produkMasterId" = pm.id
WHERE
    p."deletedAt" IS NULL AND pm."deletedAt" IS NULL
GROUP BY
    ROLLUP(p."cabangId")
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_product_dashboard_summary_cabang_id ON mv_product_dashboard_summary(cabang_id);

-- 2. Product Attributes Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_dashboard_attributes AS
SELECT
    COALESCE(p."cabangId", 'all') AS cabang_id,
    SUM(CASE WHEN pm.sku IS NOT NULL AND pm.sku != '' THEN 1 ELSE 0 END) AS with_sku,
    SUM(CASE WHEN pm.barcode IS NOT NULL AND pm.barcode != '' THEN 1 ELSE 0 END) AS with_barcode,
    SUM(CASE WHEN pm.deskripsi IS NOT NULL AND pm.deskripsi != '' THEN 1 ELSE 0 END) AS with_description,
    SUM(CASE WHEN pi.id IS NOT NULL THEN 1 ELSE 0 END) AS with_images,
    SUM(CASE WHEN pi.id IS NULL THEN 1 ELSE 0 END) AS without_images,
    SUM(CASE WHEN pm.berat IS NOT NULL AND pm.berat > 0 THEN 1 ELSE 0 END) AS with_weight,
    SUM(CASE WHEN (pm.panjang IS NOT NULL AND pm.panjang > 0) OR 
              (pm.lebar IS NOT NULL AND pm.lebar > 0) OR 
              (pm.tinggi IS NOT NULL AND pm.tinggi > 0) THEN 1 ELSE 0 END) AS with_dimension
FROM
    "produk" p
JOIN
    "produkMaster" pm ON p."produkMasterId" = pm.id
LEFT JOIN
    "produkImage" pi ON pm.id = pi."produkMasterId" AND pi."isPrimary" = true
WHERE
    p."deletedAt" IS NULL AND pm."deletedAt" IS NULL
GROUP BY
    ROLLUP(p."cabangId")
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_product_dashboard_attributes_cabang_id ON mv_product_dashboard_attributes(cabang_id);

-- 3. Top Products Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_dashboard_top_products AS
WITH sales_data AS (
    SELECT
        p."produkMasterId",
        p."cabangId",
        SUM(td.jumlah) AS total_sold,
        MAX(t.tanggal) AS last_sold_date
    FROM
        "transaksiDetail" td
    JOIN
        "transaksi" t ON td."transaksiId" = t.id
    JOIN
        "produk" p ON td."produkId" = p.id
    WHERE
        t.tanggal >= NOW() - INTERVAL '30 days'
        AND t.status = 'selesai'
    GROUP BY
        p."produkMasterId", p."cabangId"
)
SELECT
    sd."produkMasterId",
    COALESCE(sd."cabangId", 'all') AS cabang_id,
    pm."namaProduk" AS nama_produk,
    pm.sku,
    k.id AS kategori_id,
    k."namaKategori" AS nama_kategori,
    pi."filePath" AS gambar,
    SUM(p.stok) AS total_stok,
    pm.satuan,
    SUM(sd.total_sold) AS total_terjual,
    MAX(sd.last_sold_date) AS last_sold_date
FROM
    sales_data sd
JOIN
    "produkMaster" pm ON sd."produkMasterId" = pm.id
LEFT JOIN
    "kategori" k ON pm."kategoriId" = k.id
LEFT JOIN
    "produkImage" pi ON pm.id = pi."produkMasterId" AND pi."isPrimary" = true
JOIN
    "produk" p ON sd."produkMasterId" = p."produkMasterId" AND (sd."cabangId" = p."cabangId" OR sd."cabangId" IS NULL)
WHERE
    pm."deletedAt" IS NULL
GROUP BY
    sd."produkMasterId", ROLLUP(sd."cabangId"), pm."namaProduk", pm.sku, k.id, k."namaKategori", pi."filePath", pm.satuan
ORDER BY
    SUM(sd.total_sold) DESC
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_product_dashboard_top_products_cabang_id ON mv_product_dashboard_top_products(cabang_id);
CREATE INDEX IF NOT EXISTS idx_mv_product_dashboard_top_products_produk_master_id ON mv_product_dashboard_top_products("produkMasterId");

-- 4. Product Distribution Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_dashboard_distribution AS
SELECT
    COALESCE(p."cabangId", 'all') AS cabang_id,
    k.id AS kategori_id,
    k."namaKategori" AS nama_kategori,
    COUNT(DISTINCT p.id) AS jumlah_produk
FROM
    "produk" p
JOIN
    "produkMaster" pm ON p."produkMasterId" = pm.id
JOIN
    "kategori" k ON pm."kategoriId" = k.id
WHERE
    p."deletedAt" IS NULL AND pm."deletedAt" IS NULL AND k."deletedAt" IS NULL
GROUP BY
    ROLLUP(p."cabangId"), k.id, k."namaKategori"
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_product_dashboard_distribution_cabang_id ON mv_product_dashboard_distribution(cabang_id);
CREATE INDEX IF NOT EXISTS idx_mv_product_dashboard_distribution_kategori_id ON mv_product_dashboard_distribution(kategori_id);

-- 5. Product Profitability Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_dashboard_profitability AS
WITH sales_data AS (
    SELECT
        p."produkMasterId",
        p."cabangId",
        SUM(td.jumlah) AS total_sold,
        SUM(td.jumlah * (td.harga - p."hargaBeli")) AS total_profit
    FROM
        "transaksiDetail" td
    JOIN
        "transaksi" t ON td."transaksiId" = t.id
    JOIN
        "produk" p ON td."produkId" = p.id
    WHERE
        t.tanggal >= NOW() - INTERVAL '30 days'
        AND t.status = 'selesai'
    GROUP BY
        p."produkMasterId", p."cabangId"
)
SELECT
    sd."produkMasterId",
    COALESCE(sd."cabangId", 'all') AS cabang_id,
    pm."namaProduk" AS nama_produk,
    pm.sku,
    SUM(sd.total_sold) AS total_terjual,
    SUM(sd.total_profit) AS total_profit,
    CASE 
        WHEN SUM(sd.total_sold) > 0 THEN SUM(sd.total_profit) / SUM(sd.total_sold)
        ELSE 0
    END AS profit_per_unit
FROM
    sales_data sd
JOIN
    "produkMaster" pm ON sd."produkMasterId" = pm.id
WHERE
    pm."deletedAt" IS NULL
GROUP BY
    sd."produkMasterId", ROLLUP(sd."cabangId"), pm."namaProduk", pm.sku
ORDER BY
    SUM(sd.total_profit) DESC
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_product_dashboard_profitability_cabang_id ON mv_product_dashboard_profitability(cabang_id);
CREATE INDEX IF NOT EXISTS idx_mv_product_dashboard_profitability_produk_master_id ON mv_product_dashboard_profitability("produkMasterId");

-- 6. Stock Turnover Analysis Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_dashboard_stock_turnover AS
WITH sales_data AS (
    SELECT
        p."produkMasterId",
        p."cabangId",
        p.id AS produk_id,
        SUM(td.jumlah) AS total_sold_30d,
        p.stok AS current_stock
    FROM
        "transaksiDetail" td
    JOIN
        "transaksi" t ON td."transaksiId" = t.id
    JOIN
        "produk" p ON td."produkId" = p.id
    WHERE
        t.tanggal >= NOW() - INTERVAL '30 days'
        AND t.status = 'selesai'
    GROUP BY
        p."produkMasterId", p."cabangId", p.id, p.stok
)
SELECT
    sd."produkMasterId",
    COALESCE(sd."cabangId", 'all') AS cabang_id,
    pm."namaProduk" AS nama_produk,
    pm.sku,
    SUM(sd.total_sold_30d) AS total_sold_30d,
    SUM(sd.current_stock) AS total_stock,
    CASE 
        WHEN SUM(sd.current_stock) > 0 THEN SUM(sd.total_sold_30d) / SUM(sd.current_stock)
        ELSE 0
    END AS turnover_rate,
    CASE 
        WHEN SUM(sd.total_sold_30d) > 0 THEN SUM(sd.current_stock) / (SUM(sd.total_sold_30d) / 30)
        ELSE 999
    END AS days_of_supply
FROM
    sales_data sd
JOIN
    "produkMaster" pm ON sd."produkMasterId" = pm.id
WHERE
    pm."deletedAt" IS NULL
GROUP BY
    sd."produkMasterId", ROLLUP(sd."cabangId"), pm."namaProduk", pm.sku
ORDER BY
    turnover_rate DESC
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_product_dashboard_stock_turnover_cabang_id ON mv_product_dashboard_stock_turnover(cabang_id);
CREATE INDEX IF NOT EXISTS idx_mv_product_dashboard_stock_turnover_produk_master_id ON mv_product_dashboard_stock_turnover("produkMasterId");

-- 7. Category Performance Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_dashboard_category_performance AS
WITH category_sales AS (
    SELECT
        pm."kategoriId",
        p."cabangId",
        SUM(td.jumlah) AS total_sold,
        SUM(td.jumlah * (td.harga - p."hargaBeli")) AS total_profit,
        COUNT(DISTINCT p.id) AS product_count
    FROM
        "transaksiDetail" td
    JOIN
        "transaksi" t ON td."transaksiId" = t.id
    JOIN
        "produk" p ON td."produkId" = p.id
    JOIN
        "produkMaster" pm ON p."produkMasterId" = pm.id
    WHERE
        t.tanggal >= NOW() - INTERVAL '30 days'
        AND t.status = 'selesai'
        AND pm."kategoriId" IS NOT NULL
    GROUP BY
        pm."kategoriId", p."cabangId"
)
SELECT
    cs."kategoriId",
    COALESCE(cs."cabangId", 'all') AS cabang_id,
    k."namaKategori" AS nama_kategori,
    SUM(cs.total_sold) AS total_sold,
    SUM(cs.total_profit) AS total_profit,
    SUM(cs.product_count) AS product_count,
    CASE 
        WHEN SUM(cs.product_count) > 0 THEN SUM(cs.total_profit) / SUM(cs.product_count)
        ELSE 0
    END AS profit_per_product
FROM
    category_sales cs
JOIN
    "kategori" k ON cs."kategoriId" = k.id
WHERE
    k."deletedAt" IS NULL
GROUP BY
    cs."kategoriId", ROLLUP(cs."cabangId"), k."namaKategori"
ORDER BY
    SUM(cs.total_profit) DESC
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_product_dashboard_category_performance_cabang_id ON mv_product_dashboard_category_performance(cabang_id);
CREATE INDEX IF NOT EXISTS idx_mv_product_dashboard_category_performance_kategori_id ON mv_product_dashboard_category_performance("kategoriId");
