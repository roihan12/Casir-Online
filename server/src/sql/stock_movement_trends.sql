-- =============================================
-- View untuk Pergerakan Stok
-- =============================================
-- Dibuat untuk menampilkan tren pergerakan stok dalam periode waktu tertentu
-- Mencakup: pergerakan masuk, keluar, dan perubahan bersih stok

-- =============================================
-- View 1: Pergerakan Stok Harian
-- =============================================
CREATE OR REPLACE VIEW vw_pergerakan_stok_harian AS
WITH daily_movements AS (
  SELECT 
    DATE(im.createdAt) AS tanggal,
    im.cabangId AS cabang_id,
    c.namaCabang AS nama_cabang,
    im.produkId AS produk_id,
    pm.namaProduk AS nama_produk,
    pm.sku,
    SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS stok_masuk,
    SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS stok_keluar,
    SUM(im.quantity) AS perubahan_bersih,
    COUNT(*) AS jumlah_transaksi
  FROM "inventory_movement" im
  JOIN "produk" p ON im.produkId = p.id
  JOIN "produk_master" pm ON p.produkMasterId = pm.id
  JOIN "cabang" c ON im.cabangId = c.id
  GROUP BY 
    DATE(im.createdAt),
    im.cabangId,
    c.namaCabang,
    im.produkId,
    pm.namaProduk,
    pm.sku
  ORDER BY 
    DATE(im.createdAt) DESC,
    im.cabangId,
    im.produkId
)
SELECT * FROM daily_movements;

-- =============================================
-- View 2: Pergerakan Stok Bulanan
-- =============================================
CREATE OR REPLACE VIEW vw_pergerakan_stok_bulanan AS
WITH monthly_movements AS (
  SELECT 
    DATE_TRUNC('month', im.createdAt) AS bulan,
    im.cabangId AS cabang_id,
    c.namaCabang AS nama_cabang,
    im.produkId AS produk_id,
    pm.namaProduk AS nama_produk,
    pm.sku,
    SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS stok_masuk,
    SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS stok_keluar,
    SUM(im.quantity) AS perubahan_bersih,
    COUNT(*) AS jumlah_transaksi
  FROM "inventory_movement" im
  JOIN "produk" p ON im.produkId = p.id
  JOIN "produk_master" pm ON p.produkMasterId = pm.id
  JOIN "cabang" c ON im.cabangId = c.id
  GROUP BY 
    DATE_TRUNC('month', im.createdAt),
    im.cabangId,
    c.namaCabang,
    im.produkId,
    pm.namaProduk,
    pm.sku
  ORDER BY 
    DATE_TRUNC('month', im.createdAt) DESC,
    im.cabangId,
    im.produkId
)
SELECT * FROM monthly_movements;

-- =============================================
-- View 3: Pergerakan Stok per Kategori
-- =============================================
CREATE OR REPLACE VIEW vw_pergerakan_stok_kategori AS
WITH category_movements AS (
  SELECT 
    DATE_TRUNC('month', im.createdAt) AS bulan,
    im.cabangId AS cabang_id,
    c.namaCabang AS nama_cabang,
    k.id AS kategori_id,
    k.namaKategori AS nama_kategori,
    SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS stok_masuk,
    SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS stok_keluar,
    SUM(im.quantity) AS perubahan_bersih,
    COUNT(DISTINCT im.produkId) AS jumlah_produk,
    COUNT(*) AS jumlah_transaksi
  FROM "inventory_movement" im
  JOIN "produk" p ON im.produkId = p.id
  JOIN "produk_master" pm ON p.produkMasterId = pm.id
  JOIN "kategori" k ON pm.kategoriId = k.id
  JOIN "cabang" c ON im.cabangId = c.id
  GROUP BY 
    DATE_TRUNC('month', im.createdAt),
    im.cabangId,
    c.namaCabang,
    k.id,
    k.namaKategori
  ORDER BY 
    DATE_TRUNC('month', im.createdAt) DESC,
    im.cabangId,
    k.namaKategori
)
SELECT * FROM category_movements;

-- =============================================
-- View 4: Produk dengan Pergerakan Stok Tertinggi
-- =============================================
CREATE OR REPLACE VIEW vw_produk_pergerakan_tertinggi AS
WITH product_movements AS (
  SELECT 
    im.produkId AS produk_id,
    pm.namaProduk AS nama_produk,
    pm.sku,
    im.cabangId AS cabang_id,
    c.namaCabang AS nama_cabang,
    SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS total_stok_masuk,
    SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS total_stok_keluar,
    SUM(ABS(im.quantity)) AS total_pergerakan,
    COUNT(*) AS jumlah_transaksi,
    MAX(im.createdAt) AS transaksi_terakhir,
    p.stok AS stok_saat_ini
  FROM "inventory_movement" im
  JOIN "produk" p ON im.produkId = p.id
  JOIN "produk_master" pm ON p.produkMasterId = pm.id
  JOIN "cabang" c ON im.cabangId = c.id
  WHERE im.createdAt >= (CURRENT_DATE - INTERVAL '90 days')
  GROUP BY 
    im.produkId,
    pm.namaProduk,
    pm.sku,
    im.cabangId,
    c.namaCabang,
    p.stok
  ORDER BY 
    total_pergerakan DESC
)
SELECT * FROM product_movements;

-- =============================================
-- Fungsi untuk Analisis Pergerakan Stok dengan Filter
-- =============================================

-- Fungsi untuk pergerakan stok dengan filter periode dan cabang
CREATE OR REPLACE FUNCTION get_pergerakan_stok(
  p_cabang_id TEXT DEFAULT NULL,
  p_produk_id TEXT DEFAULT NULL,
  p_kategori_id TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days'),
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_interval TEXT DEFAULT 'day' -- 'day', 'week', 'month'
) RETURNS TABLE (
  periode TEXT,
  cabang_id TEXT,
  nama_cabang TEXT,
  produk_id TEXT,
  nama_produk TEXT,
  sku TEXT,
  stok_masuk NUMERIC,
  stok_keluar NUMERIC,
  perubahan_bersih NUMERIC,
  jumlah_transaksi BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN p_interval = 'day' THEN TO_CHAR(DATE(im.createdAt), 'YYYY-MM-DD')
      WHEN p_interval = 'week' THEN TO_CHAR(DATE_TRUNC('week', im.createdAt), 'YYYY-MM-DD') || ' - ' || 
                                    TO_CHAR((DATE_TRUNC('week', im.createdAt) + INTERVAL '6 days'), 'YYYY-MM-DD')
      WHEN p_interval = 'month' THEN TO_CHAR(DATE_TRUNC('month', im.createdAt), 'YYYY-MM')
      ELSE TO_CHAR(DATE(im.createdAt), 'YYYY-MM-DD')
    END AS periode,
    im.cabangId AS cabang_id,
    c.namaCabang AS nama_cabang,
    im.produkId AS produk_id,
    pm.namaProduk AS nama_produk,
    pm.sku,
    SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS stok_masuk,
    SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS stok_keluar,
    SUM(im.quantity) AS perubahan_bersih,
    COUNT(*) AS jumlah_transaksi
  FROM "inventory_movement" im
  JOIN "produk" p ON im.produkId = p.id
  JOIN "produk_master" pm ON p.produkMasterId = pm.id
  JOIN "cabang" c ON im.cabangId = c.id
  LEFT JOIN "kategori" k ON pm.kategoriId = k.id
  WHERE 
    (p_cabang_id IS NULL OR im.cabangId = p_cabang_id) AND
    (p_produk_id IS NULL OR im.produkId = p_produk_id) AND
    (p_kategori_id IS NULL OR pm.kategoriId = p_kategori_id) AND
    (im.createdAt BETWEEN p_start_date AND (p_end_date + INTERVAL '1 day' - INTERVAL '1 second'))
  GROUP BY 
    CASE 
      WHEN p_interval = 'day' THEN DATE(im.createdAt)
      WHEN p_interval = 'week' THEN DATE_TRUNC('week', im.createdAt)
      WHEN p_interval = 'month' THEN DATE_TRUNC('month', im.createdAt)
      ELSE DATE(im.createdAt)
    END,
    im.cabangId,
    c.namaCabang,
    im.produkId,
    pm.namaProduk,
    pm.sku
  ORDER BY 
    CASE 
      WHEN p_interval = 'day' THEN DATE(im.createdAt)
      WHEN p_interval = 'week' THEN DATE_TRUNC('week', im.createdAt)
      WHEN p_interval = 'month' THEN DATE_TRUNC('month', im.createdAt)
      ELSE DATE(im.createdAt)
    END DESC,
    im.cabangId,
    im.produkId;
END;
$$ LANGUAGE plpgsql;

-- Fungsi untuk mendapatkan produk dengan pergerakan stok tertinggi
CREATE OR REPLACE FUNCTION get_produk_pergerakan_tertinggi(
  p_cabang_id TEXT DEFAULT NULL,
  p_kategori_id TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days'),
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_limit INTEGER DEFAULT 10,
  p_sort_by TEXT DEFAULT 'total' -- 'total', 'masuk', 'keluar'
) RETURNS TABLE (
  produk_id TEXT,
  nama_produk TEXT,
  sku TEXT,
  cabang_id TEXT,
  nama_cabang TEXT,
  total_stok_masuk NUMERIC,
  total_stok_keluar NUMERIC,
  total_pergerakan NUMERIC,
  jumlah_transaksi BIGINT,
  transaksi_terakhir TIMESTAMP,
  stok_saat_ini INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    im.produkId AS produk_id,
    pm.namaProduk AS nama_produk,
    pm.sku,
    im.cabangId AS cabang_id,
    c.namaCabang AS nama_cabang,
    SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS total_stok_masuk,
    SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS total_stok_keluar,
    SUM(ABS(im.quantity)) AS total_pergerakan,
    COUNT(*) AS jumlah_transaksi,
    MAX(im.createdAt) AS transaksi_terakhir,
    p.stok AS stok_saat_ini
  FROM "inventory_movement" im
  JOIN "produk" p ON im.produkId = p.id
  JOIN "produk_master" pm ON p.produkMasterId = pm.id
  JOIN "cabang" c ON im.cabangId = c.id
  LEFT JOIN "kategori" k ON pm.kategoriId = k.id
  WHERE 
    (p_cabang_id IS NULL OR im.cabangId = p_cabang_id) AND
    (p_kategori_id IS NULL OR pm.kategoriId = p_kategori_id) AND
    (im.createdAt BETWEEN p_start_date AND (p_end_date + INTERVAL '1 day' - INTERVAL '1 second'))
  GROUP BY 
    im.produkId,
    pm.namaProduk,
    pm.sku,
    im.cabangId,
    c.namaCabang,
    p.stok
  ORDER BY 
    CASE 
      WHEN p_sort_by = 'masuk' THEN SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END)
      WHEN p_sort_by = 'keluar' THEN SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END)
      ELSE SUM(ABS(im.quantity))
    END DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- View 5: Nilai Inventori per Kategori
-- =============================================
CREATE OR REPLACE VIEW vw_nilai_inventori_kategori AS
WITH inventory_value AS (
  SELECT 
    c.id AS cabang_id,
    c.namaCabang AS nama_cabang,
    k.id AS kategori_id,
    k.namaKategori AS nama_kategori,
    COUNT(DISTINCT p.id) AS jumlah_produk,
    SUM(p.stok) AS total_stok,
    SUM(p.stok * p.hargaBeli) AS nilai_inventori_beli,
    SUM(p.stok * p.hargaJual) AS nilai_inventori_jual
  FROM "produk" p
  JOIN "produk_master" pm ON p.produkMasterId = pm.id
  JOIN "kategori" k ON pm.kategoriId = k.id
  JOIN "cabang" c ON p.cabangId = c.id
  WHERE p.stok > 0
  GROUP BY 
    c.id,
    c.namaCabang,
    k.id,
    k.namaKategori
),
total_values AS (
  SELECT
    cabang_id,
    SUM(nilai_inventori_beli) AS total_nilai_beli,
    SUM(nilai_inventori_jual) AS total_nilai_jual
  FROM inventory_value
  GROUP BY cabang_id
)
SELECT 
  iv.cabang_id,
  iv.nama_cabang,
  iv.kategori_id,
  iv.nama_kategori,
  iv.jumlah_produk,
  iv.total_stok,
  iv.nilai_inventori_beli,
  iv.nilai_inventori_jual,
  (iv.nilai_inventori_beli / NULLIF(tv.total_nilai_beli, 0)) * 100 AS persentase_nilai_beli,
  (iv.nilai_inventori_jual / NULLIF(tv.total_nilai_jual, 0)) * 100 AS persentase_nilai_jual,
  iv.nilai_inventori_jual - iv.nilai_inventori_beli AS potensi_keuntungan,
  CASE 
    WHEN iv.nilai_inventori_beli > 0 THEN 
      ((iv.nilai_inventori_jual - iv.nilai_inventori_beli) / iv.nilai_inventori_beli) * 100 
    ELSE 0 
  END AS persentase_margin
FROM inventory_value iv
JOIN total_values tv ON iv.cabang_id = tv.cabang_id
ORDER BY 
  iv.cabang_id,
  iv.nilai_inventori_beli DESC;

-- =============================================
-- Fungsi untuk Analisis Nilai Inventori per Kategori dengan Filter
-- =============================================
CREATE OR REPLACE FUNCTION get_nilai_inventori_kategori(
  p_cabang_id TEXT DEFAULT NULL,
  p_kategori_id TEXT DEFAULT NULL
) RETURNS TABLE (
  cabang_id TEXT,
  nama_cabang TEXT,
  kategori_id TEXT,
  nama_kategori TEXT,
  jumlah_produk BIGINT,
  total_stok NUMERIC,
  nilai_inventori_beli NUMERIC,
  nilai_inventori_jual NUMERIC,
  persentase_nilai_beli NUMERIC,
  persentase_nilai_jual NUMERIC,
  potensi_keuntungan NUMERIC,
  persentase_margin NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH inventory_value AS (
    SELECT 
      c.id AS cabang_id,
      c.namaCabang AS nama_cabang,
      k.id AS kategori_id,
      k.namaKategori AS nama_kategori,
      COUNT(DISTINCT p.id) AS jumlah_produk,
      SUM(p.stok) AS total_stok,
      SUM(p.stok * p.hargaBeli) AS nilai_inventori_beli,
      SUM(p.stok * p.hargaJual) AS nilai_inventori_jual
    FROM "produk" p
    JOIN "produk_master" pm ON p.produkMasterId = pm.id
    JOIN "kategori" k ON pm.kategoriId = k.id
    JOIN "cabang" c ON p.cabangId = c.id
    WHERE 
      p.stok > 0 AND
      (p_cabang_id IS NULL OR p.cabangId = p_cabang_id) AND
      (p_kategori_id IS NULL OR k.id = p_kategori_id)
    GROUP BY 
      c.id,
      c.namaCabang,
      k.id,
      k.namaKategori
  ),
  total_values AS (
    SELECT
      cabang_id,
      SUM(nilai_inventori_beli) AS total_nilai_beli,
      SUM(nilai_inventori_jual) AS total_nilai_jual
    FROM inventory_value
    GROUP BY cabang_id
  )
  SELECT 
    iv.cabang_id,
    iv.nama_cabang,
    iv.kategori_id,
    iv.nama_kategori,
    iv.jumlah_produk,
    iv.total_stok,
    iv.nilai_inventori_beli,
    iv.nilai_inventori_jual,
    (iv.nilai_inventori_beli / NULLIF(tv.total_nilai_beli, 0)) * 100 AS persentase_nilai_beli,
    (iv.nilai_inventori_jual / NULLIF(tv.total_nilai_jual, 0)) * 100 AS persentase_nilai_jual,
    iv.nilai_inventori_jual - iv.nilai_inventori_beli AS potensi_keuntungan,
    CASE 
      WHEN iv.nilai_inventori_beli > 0 THEN 
        ((iv.nilai_inventori_jual - iv.nilai_inventori_beli) / iv.nilai_inventori_beli) * 100 
      ELSE 0 
    END AS persentase_margin
  FROM inventory_value iv
  JOIN total_values tv ON iv.cabang_id = tv.cabang_id
  ORDER BY 
    iv.cabang_id,
    iv.nilai_inventori_beli DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- View 6: Aktivitas Inventori Terbaru
-- =============================================
CREATE OR REPLACE VIEW vw_aktivitas_inventori_terbaru AS
WITH recent_activities AS (
  SELECT 
    im.id,
    im.createdAt AS waktu_aktivitas,
    im.cabangId AS cabang_id,
    c.namaCabang AS nama_cabang,
    im.produkId AS produk_id,
    pm.namaProduk AS nama_produk,
    pm.sku,
    im.quantity AS jumlah,
    im.referenceType AS tipe_referensi,
    im.referenceId,
    im.notes AS catatan,
    u.id AS user_id,
    u.namaLengkap AS nama_user,
    CASE 
      WHEN im.quantity > 0 THEN 'Masuk'
      WHEN im.quantity < 0 THEN 'Keluar'
      ELSE 'Tidak Ada Perubahan'
    END AS jenis_pergerakan,
    CASE
      WHEN im.referenceType = 'PURCHASE' THEN 'Pembelian'
      WHEN im.referenceType = 'SALE' THEN 'Penjualan'
      WHEN im.referenceType = 'ADJUSTMENT' THEN 'Penyesuaian'
      WHEN im.referenceType = 'TRANSFER_IN' THEN 'Transfer Masuk'
      WHEN im.referenceType = 'TRANSFER_OUT' THEN 'Transfer Keluar'
      WHEN im.referenceType = 'RETURN' THEN 'Retur'
      ELSE im.referenceType
    END AS tipe_aktivitas
  FROM "inventory_movement" im
  JOIN "produk" p ON im.produkId = p.id
  JOIN "produk_master" pm ON p.produkMasterId = pm.id
  JOIN "cabang" c ON im.cabangId = c.id
  LEFT JOIN "user" u ON im.userId = u.id
  ORDER BY 
    im.createdAt DESC
  LIMIT 100
)
SELECT * FROM recent_activities;

-- =============================================
-- Fungsi untuk Mendapatkan Aktivitas Inventori dengan Filter
-- =============================================
CREATE OR REPLACE FUNCTION get_aktivitas_inventori(
  p_cabang_id TEXT DEFAULT NULL,
  p_produk_id TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_user_id TEXT DEFAULT NULL,
  p_start_date TIMESTAMP DEFAULT (CURRENT_TIMESTAMP - INTERVAL '7 days'),
  p_end_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
  id TEXT,
  waktu_aktivitas TIMESTAMP,
  cabang_id TEXT,
  nama_cabang TEXT,
  produk_id TEXT,
  nama_produk TEXT,
  sku TEXT,
  jumlah NUMERIC,
  tipe_referensi TEXT,
  referenceId TEXT,
  catatan TEXT,
  user_id TEXT,
  nama_user TEXT,
  jenis_pergerakan TEXT,
  tipe_aktivitas TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    im.id,
    im.createdAt AS waktu_aktivitas,
    im.cabangId AS cabang_id,
    c.namaCabang AS nama_cabang,
    im.produkId AS produk_id,
    pm.namaProduk AS nama_produk,
    pm.sku,
    im.quantity AS jumlah,
    im.referenceType AS tipe_referensi,
    im.referenceId,
    im.notes AS catatan,
    u.id AS user_id,
    u.namaLengkap AS nama_user,
    CASE 
      WHEN im.quantity > 0 THEN 'Masuk'
      WHEN im.quantity < 0 THEN 'Keluar'
      ELSE 'Tidak Ada Perubahan'
    END AS jenis_pergerakan,
    CASE
      WHEN im.referenceType = 'PURCHASE' THEN 'Pembelian'
      WHEN im.referenceType = 'SALE' THEN 'Penjualan'
      WHEN im.referenceType = 'ADJUSTMENT' THEN 'Penyesuaian'
      WHEN im.referenceType = 'TRANSFER_IN' THEN 'Transfer Masuk'
      WHEN im.referenceType = 'TRANSFER_OUT' THEN 'Transfer Keluar'
      WHEN im.referenceType = 'RETURN' THEN 'Retur'
      ELSE im.referenceType
    END AS tipe_aktivitas
  FROM "inventory_movement" im
  JOIN "produk" p ON im.produkId = p.id
  JOIN "produk_master" pm ON p.produkMasterId = pm.id
  JOIN "cabang" c ON im.cabangId = c.id
  LEFT JOIN "user" u ON im.userId = u.id
  WHERE 
    (p_cabang_id IS NULL OR im.cabangId = p_cabang_id) AND
    (p_produk_id IS NULL OR im.produkId = p_produk_id) AND
    (p_reference_type IS NULL OR im.referenceType = p_reference_type) AND
    (p_user_id IS NULL OR im.userId = p_user_id) AND
    (im.createdAt BETWEEN p_start_date AND p_end_date)
  ORDER BY 
    im.createdAt DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Contoh Penggunaan
-- =============================================

-- 1. Melihat pergerakan stok harian untuk semua produk
-- SELECT * FROM vw_pergerakan_stok_harian;

-- 2. Melihat pergerakan stok bulanan untuk semua produk
-- SELECT * FROM vw_pergerakan_stok_bulanan;

-- 3. Melihat pergerakan stok per kategori
-- SELECT * FROM vw_pergerakan_stok_kategori;

-- 4. Melihat produk dengan pergerakan stok tertinggi
-- SELECT * FROM vw_produk_pergerakan_tertinggi LIMIT 10;

-- 5. Melihat nilai inventori per kategori
-- SELECT * FROM vw_nilai_inventori_kategori;

-- 6. Melihat nilai inventori untuk kategori tertentu
-- SELECT * FROM get_nilai_inventori_kategori('cabang-id-1', NULL);

-- 7. Menggunakan fungsi untuk analisis pergerakan stok harian dalam 30 hari terakhir
-- SELECT * FROM get_pergerakan_stok(NULL, NULL, NULL, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 'day');

-- 8. Menggunakan fungsi untuk analisis pergerakan stok mingguan dalam 3 bulan terakhir
-- SELECT * FROM get_pergerakan_stok(NULL, NULL, NULL, CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE, 'week');

-- 9. Menggunakan fungsi untuk analisis pergerakan stok bulanan dalam 1 tahun terakhir
-- SELECT * FROM get_pergerakan_stok(NULL, NULL, NULL, CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE, 'month');

-- 10. Melihat produk dengan pergerakan stok tertinggi dalam 30 hari terakhir
-- SELECT * FROM get_produk_pergerakan_tertinggi(NULL, NULL, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 10, 'total');

-- 11. Melihat produk dengan stok masuk tertinggi dalam 30 hari terakhir
-- SELECT * FROM get_produk_pergerakan_tertinggi(NULL, NULL, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 10, 'masuk');

-- 12. Melihat produk dengan stok keluar tertinggi dalam 30 hari terakhir
-- SELECT * FROM get_produk_pergerakan_tertinggi(NULL, NULL, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 10, 'keluar');

-- 13. Melihat aktivitas inventori terbaru
-- SELECT * FROM vw_aktivitas_inventori_terbaru;

-- 14. Melihat aktivitas inventori dengan filter
-- SELECT * FROM get_aktivitas_inventori('cabang-id-1', NULL, 'PURCHASE', NULL, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP, 20);

-- 15. Melihat aktivitas inventori berdasarkan user
-- SELECT * FROM get_aktivitas_inventori(NULL, NULL, NULL, 'user-id-1', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP, 20);

-- 16. Melihat aktivitas inventori berdasarkan tipe referensi
-- SELECT * FROM get_aktivitas_inventori(NULL, NULL, 'SALE', NULL, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP, 20);