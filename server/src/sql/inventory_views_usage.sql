-- =============================================
-- Contoh Penggunaan View Inventory Dashboard
-- =============================================

-- 1. Contoh penggunaan view produk dengan stok menipis

-- Melihat semua produk dengan stok menipis
SELECT * FROM vw_produk_stok_menipis;

-- Melihat produk dengan stok menipis untuk cabang tertentu
SELECT * FROM vw_produk_stok_menipis WHERE cabang_id = 'id_cabang_anda';

-- Melihat produk dengan stok habis (stok = 0)
SELECT * FROM vw_produk_stok_menipis WHERE stok = 0;

-- Menggunakan fungsi dengan filter rentang waktu
-- Parameter: p_cabang_id (opsional), p_date_range ('today', '7days', '30days', '90days', '6months', '1year')

-- Produk dengan stok menipis hari ini
SELECT * FROM get_produk_stok_menipis(NULL, 'today');

-- Produk dengan stok menipis dalam 7 hari terakhir untuk cabang tertentu
SELECT * FROM get_produk_stok_menipis('id_cabang_anda', '7days');

-- Produk dengan stok menipis dalam 30 hari terakhir
SELECT * FROM get_produk_stok_menipis(NULL, '30days');


-- 2. Contoh penggunaan view produk yang akan kadaluarsa

-- Melihat semua produk yang akan kadaluarsa
SELECT * FROM vw_produk_akan_kadaluarsa;

-- Melihat produk yang akan kadaluarsa untuk cabang tertentu
SELECT * FROM vw_produk_akan_kadaluarsa WHERE cabang_id = 'id_cabang_anda';

-- Melihat produk yang sudah kadaluarsa (hari_tersisa <= 0)
SELECT * FROM vw_produk_akan_kadaluarsa WHERE hari_tersisa <= 0;

-- Melihat produk yang akan kadaluarsa dalam 7 hari ke depan
SELECT * FROM vw_produk_akan_kadaluarsa WHERE hari_tersisa BETWEEN 1 AND 7;

-- Menggunakan fungsi dengan filter rentang waktu

-- Produk yang akan kadaluarsa dalam 7 hari ke depan
SELECT * FROM get_produk_akan_kadaluarsa(NULL, '7days');

-- Produk yang akan kadaluarsa dalam 30 hari ke depan untuk cabang tertentu
SELECT * FROM get_produk_akan_kadaluarsa('id_cabang_anda', '30days');

-- Produk yang akan kadaluarsa dalam 90 hari ke depan
SELECT * FROM get_produk_akan_kadaluarsa(NULL, '90days');


-- 3. Contoh penggunaan view transfer antar cabang

-- Melihat semua transfer antar cabang
SELECT * FROM vw_transfer_antar_cabang;

-- Melihat transfer antar cabang dengan status tertentu
SELECT * FROM vw_transfer_antar_cabang WHERE status = 'sent';

-- Melihat transfer antar cabang untuk cabang asal tertentu
SELECT * FROM vw_transfer_antar_cabang WHERE cabang_asal = 'Nama Cabang Anda';

-- Melihat transfer antar cabang untuk cabang tujuan tertentu
SELECT * FROM vw_transfer_antar_cabang WHERE cabang_tujuan = 'Nama Cabang Anda';

-- Menggunakan fungsi dengan filter rentang waktu

-- Transfer antar cabang hari ini
SELECT * FROM get_transfer_antar_cabang(NULL, 'today');

-- Transfer antar cabang dalam 7 hari terakhir untuk cabang tertentu (sebagai asal atau tujuan)
SELECT * FROM get_transfer_antar_cabang('id_cabang_anda', '7days');

-- Transfer antar cabang dalam 30 hari terakhir
SELECT * FROM get_transfer_antar_cabang(NULL, '30days');


-- 4. Contoh query untuk dashboard inventory

-- Menghitung jumlah produk dengan stok menipis per cabang
SELECT 
  nama_cabang, 
  COUNT(*) AS jumlah_produk_stok_menipis,
  SUM(CASE WHEN stok = 0 THEN 1 ELSE 0 END) AS jumlah_produk_habis
FROM vw_produk_stok_menipis
GROUP BY nama_cabang
ORDER BY jumlah_produk_stok_menipis DESC;

-- Menghitung jumlah produk yang akan kadaluarsa per cabang
SELECT 
  nama_cabang, 
  COUNT(*) AS jumlah_produk_akan_kadaluarsa,
  SUM(CASE WHEN hari_tersisa <= 7 THEN 1 ELSE 0 END) AS kritis_7_hari,
  SUM(CASE WHEN hari_tersisa BETWEEN 8 AND 30 THEN 1 ELSE 0 END) AS perhatian_30_hari,
  SUM(CASE WHEN hari_tersisa BETWEEN 31 AND 90 THEN 1 ELSE 0 END) AS waspada_90_hari
FROM vw_produk_akan_kadaluarsa
GROUP BY nama_cabang
ORDER BY jumlah_produk_akan_kadaluarsa DESC;

-- Menghitung jumlah transfer antar cabang per status
SELECT 
  status_text, 
  COUNT(*) AS jumlah_transfer,
  SUM(jumlah_item) AS total_item
FROM vw_transfer_antar_cabang
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY status_text
ORDER BY jumlah_transfer DESC;

-- Menghitung jumlah transfer antar cabang per cabang (sebagai asal)
SELECT 
  cabang_asal, 
  COUNT(*) AS jumlah_transfer_keluar,
  SUM(total_barang_kirim) AS total_barang_keluar
FROM vw_transfer_antar_cabang
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY cabang_asal
ORDER BY jumlah_transfer_keluar DESC;

-- Menghitung jumlah transfer antar cabang per cabang (sebagai tujuan)
SELECT 
  cabang_tujuan, 
  COUNT(*) AS jumlah_transfer_masuk,
  SUM(total_barang_terima) AS total_barang_masuk
FROM vw_transfer_antar_cabang
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND status = 'received'
GROUP BY cabang_tujuan
ORDER BY jumlah_transfer_masuk DESC;