-- =============================================
-- Inventory Dashboard Views
-- =============================================
-- Dibuat untuk menampilkan data inventory pada dashboard
-- Mencakup: produk dengan stok menipis, produk yang akan kadaluarsa, dan transfer antar cabang terbaru

-- =============================================
-- View 1: Produk dengan Stok Menipis
-- =============================================
CREATE OR REPLACE VIEW vw_produk_stok_menipis AS
WITH produk_stok AS (
  SELECT 
    p.id AS produk_id,
    p.cabangId AS cabang_id,
    c.namaCabang AS nama_cabang,
    pm.namaProduk AS nama_produk,
    pm.sku,
    pm.barcode,
    p.stok,
    p.minStok AS min_stok,
    p.maxStok AS max_stok,
    p.hargaBeli AS harga_beli,
    p.hargaJual AS harga_jual,
    p.status,
    CASE 
      WHEN p.stok <= p.minStok THEN true
      ELSE false
    END AS is_low_stock,
    CASE
      WHEN p.stok = 0 THEN 'Habis'
      WHEN p.stok <= p.minStok THEN 'Menipis'
      ELSE 'Normal'
    END AS stok_status,
    p.updatedAt AS updated_at
  FROM "produk" p
  JOIN "produk_master" pm ON p.produkMasterId = pm.id
  JOIN "cabang" c ON p.cabangId = c.id
  WHERE p.stok <= p.minStok AND p.stok >= 0 AND p.status = 'tersedia'
)
SELECT 
  ps.*,
  CASE 
    WHEN ps.stok = 0 THEN 0
    ELSE ROUND(CAST((ps.stok::float / NULLIF(ps.min_stok, 0)::float) * 100 AS numeric), 2)
  END AS stok_percentage
FROM produk_stok ps
ORDER BY ps.stok_percentage ASC, ps.updated_at DESC;

-- =============================================
-- View 2: Produk yang Akan Kadaluarsa
-- =============================================
CREATE OR REPLACE VIEW vw_produk_akan_kadaluarsa AS
WITH produk_kadaluarsa AS (
  SELECT 
    p.id AS produk_id,
    p.cabangId AS cabang_id,
    c.namaCabang AS nama_cabang,
    pm.namaProduk AS nama_produk,
    pm.sku,
    pm.barcode,
    p.stok,
    p.tanggalKedaluwarsa AS tanggal_kadaluarsa,
    p.hargaJual AS harga_jual,
    p.status,
    CURRENT_DATE AS tanggal_sekarang,
    CASE 
      WHEN p.tanggalKedaluwarsa IS NULL THEN NULL
      ELSE (p.tanggalKedaluwarsa - CURRENT_DATE)
    END AS hari_tersisa
  FROM "produk" p
  JOIN "produk_master" pm ON p.produkMasterId = pm.id
  JOIN "cabang" c ON p.cabangId = c.id
  WHERE 
    p.tanggalKedaluwarsa IS NOT NULL 
    AND p.stok > 0 
    AND p.status = 'tersedia'
)
SELECT 
  pk.*,
  CASE 
    WHEN pk.hari_tersisa <= 0 THEN 'Kadaluarsa'
    WHEN pk.hari_tersisa <= 7 THEN 'Kritis (< 7 hari)'
    WHEN pk.hari_tersisa <= 30 THEN 'Perhatian (< 30 hari)'
    WHEN pk.hari_tersisa <= 90 THEN 'Waspada (< 90 hari)'
    ELSE 'Aman'
  END AS status_kadaluarsa
FROM produk_kadaluarsa pk
WHERE pk.hari_tersisa <= 90
ORDER BY pk.hari_tersisa ASC;

-- =============================================
-- View 3: Transfer Antar Cabang Terbaru
-- =============================================
CREATE OR REPLACE VIEW vw_transfer_antar_cabang AS
SELECT 
  st.id AS transfer_id,
  st.nomorTransfer AS nomor_transfer,
  ca.namaCabang AS cabang_asal,
  ct.namaCabang AS cabang_tujuan,
  st.tanggalKirim AS tanggal_kirim,
  st.tanggalTerima AS tanggal_terima,
  st.status,
  st.keterangan,
  st.createdAt AS created_at,
  st.updatedAt AS updated_at,
  u.namaLengkap AS created_by_name,
  COUNT(std.id) AS jumlah_item,
  SUM(std.jumlahKirim) AS total_barang_kirim,
  SUM(std.jumlahTerima) AS total_barang_terima,
  CASE
    WHEN st.status = 'draft' THEN 'Draft'
    WHEN st.status = 'pending_approval' THEN 'Menunggu Persetujuan'
    WHEN st.status = 'approved' THEN 'Disetujui'
    WHEN st.status = 'rejected' THEN 'Ditolak'
    WHEN st.status = 'sent' THEN 'Dikirim'
    WHEN st.status = 'received' THEN 'Diterima'
    WHEN st.status = 'cancelled' THEN 'Dibatalkan'
    ELSE st.status::text
  END AS status_text,
  CASE
    WHEN st.status = 'draft' THEN 'bg-gray-200 text-gray-800'
    WHEN st.status = 'pending_approval' THEN 'bg-yellow-100 text-yellow-800'
    WHEN st.status = 'approved' THEN 'bg-blue-100 text-blue-800'
    WHEN st.status = 'rejected' THEN 'bg-red-100 text-red-800'
    WHEN st.status = 'sent' THEN 'bg-indigo-100 text-indigo-800'
    WHEN st.status = 'received' THEN 'bg-green-100 text-green-800'
    WHEN st.status = 'cancelled' THEN 'bg-gray-100 text-gray-800'
    ELSE 'bg-gray-100 text-gray-800'
  END AS status_style
FROM "stock_transfer" st
JOIN "cabang" ca ON st.cabangAsalId = ca.id
JOIN "cabang" ct ON st.cabangTujuanId = ct.id
LEFT JOIN "stock_transfer_detail" std ON st.id = std.transferId
LEFT JOIN "user" u ON st.created_by_user_Id = u.id
GROUP BY 
  st.id, 
  st.nomorTransfer, 
  ca.namaCabang, 
  ct.namaCabang, 
  st.tanggalKirim, 
  st.tanggalTerima, 
  st.status, 
  st.keterangan, 
  st.createdAt, 
  st.updatedAt, 
  u.namaLengkap
ORDER BY st.createdAt DESC;

-- =============================================
-- Fungsi untuk Filter Berdasarkan Rentang Waktu
-- =============================================

-- Fungsi untuk produk stok menipis dengan filter tanggal
CREATE OR REPLACE FUNCTION get_produk_stok_menipis(
  p_cabang_id TEXT DEFAULT NULL,
  p_date_range TEXT DEFAULT 'today'
) RETURNS TABLE (
  produk_id TEXT,
  cabang_id TEXT,
  nama_cabang TEXT,
  nama_produk TEXT,
  sku TEXT,
  barcode TEXT,
  stok INTEGER,
  min_stok INTEGER,
  max_stok INTEGER,
  harga_beli DECIMAL,
  harga_jual DECIMAL,
  status TEXT,
  is_low_stock BOOLEAN,
  stok_status TEXT,
  updated_at TIMESTAMP,
  stok_percentage DECIMAL
) AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- Tentukan rentang tanggal berdasarkan parameter
  CASE p_date_range
    WHEN 'today' THEN
      v_start_date := CURRENT_DATE;
      v_end_date := CURRENT_DATE;
    WHEN '7days' THEN
      v_start_date := CURRENT_DATE - INTERVAL '7 days';
      v_end_date := CURRENT_DATE;
    WHEN '30days' THEN
      v_start_date := CURRENT_DATE - INTERVAL '30 days';
      v_end_date := CURRENT_DATE;
    WHEN '90days' THEN
      v_start_date := CURRENT_DATE - INTERVAL '90 days';
      v_end_date := CURRENT_DATE;
    WHEN '6months' THEN
      v_start_date := CURRENT_DATE - INTERVAL '6 months';
      v_end_date := CURRENT_DATE;
    WHEN '1year' THEN
      v_start_date := CURRENT_DATE - INTERVAL '1 year';
      v_end_date := CURRENT_DATE;
    ELSE
      v_start_date := CURRENT_DATE;
      v_end_date := CURRENT_DATE;
  END CASE;
  
  -- Return data dengan filter
  RETURN QUERY
  SELECT * FROM vw_produk_stok_menipis
  WHERE (p_cabang_id IS NULL OR cabang_id = p_cabang_id)
  AND (updated_at::DATE BETWEEN v_start_date AND v_end_date);
END;
$$ LANGUAGE plpgsql;

-- Fungsi untuk produk akan kadaluarsa dengan filter tanggal
CREATE OR REPLACE FUNCTION get_produk_akan_kadaluarsa(
  p_cabang_id TEXT DEFAULT NULL,
  p_date_range TEXT DEFAULT 'today'
) RETURNS TABLE (
  produk_id TEXT,
  cabang_id TEXT,
  nama_cabang TEXT,
  nama_produk TEXT,
  sku TEXT,
  barcode TEXT,
  stok INTEGER,
  tanggal_kadaluarsa DATE,
  harga_jual DECIMAL,
  status TEXT,
  tanggal_sekarang DATE,
  hari_tersisa INTEGER,
  status_kadaluarsa TEXT
) AS $$
DECLARE
  v_max_days INTEGER;
BEGIN
  -- Tentukan maksimum hari berdasarkan parameter
  CASE p_date_range
    WHEN 'today' THEN
      v_max_days := 1;
    WHEN '7days' THEN
      v_max_days := 7;
    WHEN '30days' THEN
      v_max_days := 30;
    WHEN '90days' THEN
      v_max_days := 90;
    WHEN '6months' THEN
      v_max_days := 180;
    WHEN '1year' THEN
      v_max_days := 365;
    ELSE
      v_max_days := 30;
  END CASE;
  
  -- Return data dengan filter
  RETURN QUERY
  SELECT * FROM vw_produk_akan_kadaluarsa
  WHERE (p_cabang_id IS NULL OR cabang_id = p_cabang_id)
  AND (hari_tersisa <= v_max_days);
END;
$$ LANGUAGE plpgsql;

-- Fungsi untuk transfer antar cabang dengan filter tanggal
CREATE OR REPLACE FUNCTION get_transfer_antar_cabang(
  p_cabang_id TEXT DEFAULT NULL,
  p_date_range TEXT DEFAULT 'today'
) RETURNS TABLE (
  transfer_id TEXT,
  nomor_transfer TEXT,
  cabang_asal TEXT,
  cabang_tujuan TEXT,
  tanggal_kirim TIMESTAMP,
  tanggal_terima TIMESTAMP,
  status TEXT,
  keterangan TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_by_name TEXT,
  jumlah_item BIGINT,
  total_barang_kirim BIGINT,
  total_barang_terima BIGINT,
  status_text TEXT,
  status_style TEXT
) AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- Tentukan rentang tanggal berdasarkan parameter
  CASE p_date_range
    WHEN 'today' THEN
      v_start_date := CURRENT_DATE;
      v_end_date := CURRENT_DATE;
    WHEN '7days' THEN
      v_start_date := CURRENT_DATE - INTERVAL '7 days';
      v_end_date := CURRENT_DATE;
    WHEN '30days' THEN
      v_start_date := CURRENT_DATE - INTERVAL '30 days';
      v_end_date := CURRENT_DATE;
    WHEN '90days' THEN
      v_start_date := CURRENT_DATE - INTERVAL '90 days';
      v_end_date := CURRENT_DATE;
    WHEN '6months' THEN
      v_start_date := CURRENT_DATE - INTERVAL '6 months';
      v_end_date := CURRENT_DATE;
    WHEN '1year' THEN
      v_start_date := CURRENT_DATE - INTERVAL '1 year';
      v_end_date := CURRENT_DATE;
    ELSE
      v_start_date := CURRENT_DATE;
      v_end_date := CURRENT_DATE;
  END CASE;
  
  -- Return data dengan filter
  RETURN QUERY
  SELECT * FROM vw_transfer_antar_cabang
  WHERE (p_cabang_id IS NULL OR cabang_asal = p_cabang_id OR cabang_tujuan = p_cabang_id)
  AND (created_at::DATE BETWEEN v_start_date AND v_end_date);
END;
$$ LANGUAGE plpgsql;