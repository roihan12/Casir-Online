-- =============================================
-- Contoh Query untuk Analisis Pergerakan Stok
-- =============================================
-- File ini berisi contoh query untuk menganalisis pergerakan stok
-- yang dapat digunakan langsung di aplikasi atau untuk reporting

-- =============================================
-- 1. Analisis Pergerakan Stok Harian
-- =============================================

-- Pergerakan stok harian untuk cabang tertentu dalam 30 hari terakhir
SELECT 
    DATE(im.createdAt) AS tanggal,
    c.namaCabang AS nama_cabang,
    SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS stok_masuk,
    SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS stok_keluar,
    SUM(im.quantity) AS perubahan_bersih,
    COUNT(*) AS jumlah_transaksi
FROM "inventory_movement" im
JOIN "cabang" c ON im.cabangId = c.id
WHERE 
    im.cabangId = :cabangId AND
    im.createdAt >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 
    DATE(im.createdAt),
    c.namaCabang
ORDER BY 
    DATE(im.createdAt) DESC;

-- =============================================
-- 2. Analisis Pergerakan Stok per Produk
-- =============================================

-- Pergerakan stok per produk dalam periode tertentu
SELECT 
    pm.namaProduk AS nama_produk,
    pm.sku,
    k.namaKategori AS kategori,
    SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS stok_masuk,
    SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS stok_keluar,
    SUM(im.quantity) AS perubahan_bersih,
    COUNT(*) AS jumlah_transaksi,
    p.stok AS stok_saat_ini
FROM "inventory_movement" im
JOIN "produk" p ON im.produkId = p.id
JOIN "produk_master" pm ON p.produkMasterId = pm.id
LEFT JOIN "kategori" k ON pm.kategoriId = k.id
WHERE 
    im.cabangId = :cabangId AND
    im.createdAt BETWEEN :startDate AND :endDate
GROUP BY 
    pm.namaProduk,
    pm.sku,
    k.namaKategori,
    p.stok
ORDER BY 
    stok_keluar DESC;

-- =============================================
-- 3. Analisis Tren Pergerakan Stok Bulanan
-- =============================================

-- Tren pergerakan stok bulanan untuk tahun berjalan
SELECT 
    TO_CHAR(DATE_TRUNC('month', im.createdAt), 'YYYY-MM') AS bulan,
    SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS stok_masuk,
    SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS stok_keluar,
    SUM(im.quantity) AS perubahan_bersih,
    COUNT(*) AS jumlah_transaksi
FROM "inventory_movement" im
WHERE 
    im.cabangId = :cabangId AND
    im.createdAt >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY 
    DATE_TRUNC('month', im.createdAt)
ORDER BY 
    DATE_TRUNC('month', im.createdAt);

-- =============================================
-- 4. Analisis Pergerakan Stok per Kategori
-- =============================================

-- Pergerakan stok per kategori produk
SELECT 
    k.namaKategori AS kategori,
    SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS stok_masuk,
    SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS stok_keluar,
    SUM(im.quantity) AS perubahan_bersih,
    COUNT(DISTINCT im.produkId) AS jumlah_produk,
    COUNT(*) AS jumlah_transaksi
FROM "inventory_movement" im
JOIN "produk" p ON im.produkId = p.id
JOIN "produk_master" pm ON p.produkMasterId = pm.id
JOIN "kategori" k ON pm.kategoriId = k.id
WHERE 
    im.cabangId = :cabangId AND
    im.createdAt BETWEEN :startDate AND :endDate
GROUP BY 
    k.namaKategori
ORDER BY 
    stok_keluar DESC;

-- =============================================
-- 5. Analisis Pergerakan Stok per Tipe Referensi
-- =============================================

-- Pergerakan stok berdasarkan tipe referensi (penjualan, pembelian, adjustment, dll)
SELECT 
    im.referenceType AS tipe_referensi,
    SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS stok_masuk,
    SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS stok_keluar,
    SUM(im.quantity) AS perubahan_bersih,
    COUNT(*) AS jumlah_transaksi
FROM "inventory_movement" im
WHERE 
    im.cabangId = :cabangId AND
    im.createdAt BETWEEN :startDate AND :endDate
GROUP BY 
    im.referenceType
ORDER BY 
    jumlah_transaksi DESC;

-- =============================================
-- 6. Analisis Pergerakan Stok per User
-- =============================================

-- Pergerakan stok berdasarkan user yang melakukan transaksi
SELECT 
    u.namaLengkap AS nama_user,
    SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS stok_masuk,
    SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS stok_keluar,
    SUM(im.quantity) AS perubahan_bersih,
    COUNT(*) AS jumlah_transaksi
FROM "inventory_movement" im
JOIN "user" u ON im.userId = u.id
WHERE 
    im.cabangId = :cabangId AND
    im.createdAt BETWEEN :startDate AND :endDate
GROUP BY 
    u.namaLengkap
ORDER BY 
    jumlah_transaksi DESC;

-- =============================================
-- 7. Analisis Pergerakan Stok Mingguan
-- =============================================

-- Pergerakan stok mingguan untuk 3 bulan terakhir
SELECT 
    TO_CHAR(DATE_TRUNC('week', im.createdAt), 'YYYY-MM-DD') || ' - ' || 
    TO_CHAR((DATE_TRUNC('week', im.createdAt) + INTERVAL '6 days'), 'YYYY-MM-DD') AS minggu,
    SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS stok_masuk,
    SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS stok_keluar,
    SUM(im.quantity) AS perubahan_bersih,
    COUNT(*) AS jumlah_transaksi
FROM "inventory_movement" im
WHERE 
    im.cabangId = :cabangId AND
    im.createdAt >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY 
    DATE_TRUNC('week', im.createdAt)
ORDER BY 
    DATE_TRUNC('week', im.createdAt) DESC;

-- =============================================
-- 8. Analisis Produk dengan Pergerakan Stok Tertinggi
-- =============================================

-- Top 10 produk dengan pergerakan stok tertinggi
SELECT 
    pm.namaProduk AS nama_produk,
    pm.sku,
    k.namaKategori AS kategori,
    SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS stok_masuk,
    SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS stok_keluar,
    SUM(ABS(im.quantity)) AS total_pergerakan,
    COUNT(*) AS jumlah_transaksi,
    p.stok AS stok_saat_ini,
    p.minStok AS stok_minimum,
    ROUND((p.stok::NUMERIC / NULLIF(p.minStok, 0)::NUMERIC) * 100, 2) AS persentase_stok
FROM "inventory_movement" im
JOIN "produk" p ON im.produkId = p.id
JOIN "produk_master" pm ON p.produkMasterId = pm.id
LEFT JOIN "kategori" k ON pm.kategoriId = k.id
WHERE 
    im.cabangId = :cabangId AND
    im.createdAt BETWEEN :startDate AND :endDate
GROUP BY 
    pm.namaProduk,
    pm.sku,
    k.namaKategori,
    p.stok,
    p.minStok
ORDER BY 
    total_pergerakan DESC
LIMIT 10;

-- =============================================
-- 9. Analisis Pergerakan Stok Berdasarkan Batch
-- =============================================

-- Pergerakan stok berdasarkan batch number
SELECT 
    im.batchNumber AS nomor_batch,
    pm.namaProduk AS nama_produk,
    pm.sku,
    SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS stok_masuk,
    SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS stok_keluar,
    SUM(im.quantity) AS perubahan_bersih,
    MIN(im.createdAt) AS tanggal_pertama,
    MAX(im.createdAt) AS tanggal_terakhir,
    COUNT(*) AS jumlah_transaksi
FROM "inventory_movement" im
JOIN "produk" p ON im.produkId = p.id
JOIN "produk_master" pm ON p.produkMasterId = pm.id
WHERE 
    im.cabangId = :cabangId AND
    im.batchNumber IS NOT NULL AND
    im.createdAt BETWEEN :startDate AND :endDate
GROUP BY 
    im.batchNumber,
    pm.namaProduk,
    pm.sku
ORDER BY 
    tanggal_terakhir DESC;

-- =============================================
-- 10. Analisis Pergerakan Stok Harian dengan Rata-rata Bergerak
-- =============================================

-- Pergerakan stok harian dengan rata-rata bergerak 7 hari
WITH daily_movements AS (
    SELECT 
        DATE(im.createdAt) AS tanggal,
        SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS stok_masuk,
        SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS stok_keluar,
        SUM(im.quantity) AS perubahan_bersih
    FROM "inventory_movement" im
    WHERE 
        im.cabangId = :cabangId AND
        im.createdAt >= CURRENT_DATE - INTERVAL '60 days'
    GROUP BY 
        DATE(im.createdAt)
    ORDER BY 
        DATE(im.createdAt)
)
SELECT 
    tanggal,
    stok_masuk,
    stok_keluar,
    perubahan_bersih,
    AVG(stok_masuk) OVER (ORDER BY tanggal ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS avg_stok_masuk_7d,
    AVG(stok_keluar) OVER (ORDER BY tanggal ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS avg_stok_keluar_7d,
    AVG(perubahan_bersih) OVER (ORDER BY tanggal ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS avg_perubahan_7d
FROM daily_movements
ORDER BY tanggal DESC;