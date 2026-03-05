# Dokumentasi Query Pergerakan Stok

Dokumentasi ini menjelaskan cara menggunakan query untuk menganalisis pergerakan stok dalam sistem Casir-Online.

## Daftar File

1. **stock_movement_trends.sql** - Berisi view dan fungsi untuk analisis pergerakan stok
2. **stock_movement_examples.sql** - Berisi contoh query yang siap digunakan

## View yang Tersedia

### 1. vw_pergerakan_stok_harian
Menampilkan pergerakan stok harian untuk setiap produk di setiap cabang.

```sql
SELECT * FROM vw_pergerakan_stok_harian;
```

### 2. vw_pergerakan_stok_bulanan
Menampilkan pergerakan stok bulanan untuk setiap produk di setiap cabang.

```sql
SELECT * FROM vw_pergerakan_stok_bulanan;
```

### 3. vw_pergerakan_stok_kategori
Menampilkan pergerakan stok per kategori produk.

```sql
SELECT * FROM vw_pergerakan_stok_kategori;
```

### 4. vw_produk_pergerakan_tertinggi
Menampilkan produk dengan pergerakan stok tertinggi dalam 90 hari terakhir.

```sql
SELECT * FROM vw_produk_pergerakan_tertinggi LIMIT 10;
```

## Fungsi yang Tersedia

### 1. get_pergerakan_stok
Menganalisis pergerakan stok dengan berbagai filter dan interval waktu.

**Parameter:**
- p_cabang_id: ID cabang (opsional)
- p_produk_id: ID produk (opsional)
- p_kategori_id: ID kategori (opsional)
- p_start_date: Tanggal mulai (default: 30 hari yang lalu)
- p_end_date: Tanggal akhir (default: hari ini)
- p_interval: Interval waktu ('day', 'week', 'month')

**Contoh penggunaan:**

```sql
-- Pergerakan stok harian dalam 30 hari terakhir
SELECT * FROM get_pergerakan_stok(NULL, NULL, NULL, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 'day');

-- Pergerakan stok mingguan dalam 3 bulan terakhir untuk cabang tertentu
SELECT * FROM get_pergerakan_stok('id_cabang', NULL, NULL, CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE, 'week');

-- Pergerakan stok bulanan dalam 1 tahun terakhir untuk kategori tertentu
SELECT * FROM get_pergerakan_stok(NULL, NULL, 'id_kategori', CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE, 'month');
```

### 2. get_produk_pergerakan_tertinggi
Mendapatkan produk dengan pergerakan stok tertinggi dalam periode tertentu.

**Parameter:**
- p_cabang_id: ID cabang (opsional)
- p_kategori_id: ID kategori (opsional)
- p_start_date: Tanggal mulai (default: 30 hari yang lalu)
- p_end_date: Tanggal akhir (default: hari ini)
- p_limit: Jumlah produk yang ditampilkan (default: 10)
- p_sort_by: Kriteria pengurutan ('total', 'masuk', 'keluar')

**Contoh penggunaan:**

```sql
-- Produk dengan pergerakan stok tertinggi dalam 30 hari terakhir
SELECT * FROM get_produk_pergerakan_tertinggi(NULL, NULL, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 10, 'total');

-- Produk dengan stok masuk tertinggi dalam 30 hari terakhir
SELECT * FROM get_produk_pergerakan_tertinggi(NULL, NULL, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 10, 'masuk');

-- Produk dengan stok keluar tertinggi dalam 30 hari terakhir untuk cabang tertentu
SELECT * FROM get_produk_pergerakan_tertinggi('id_cabang', NULL, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 10, 'keluar');
```

## Contoh Query Siap Pakai

File `stock_movement_examples.sql` berisi berbagai contoh query yang dapat langsung digunakan untuk analisis pergerakan stok, seperti:

1. Analisis pergerakan stok harian
2. Analisis pergerakan stok per produk
3. Tren pergerakan stok bulanan
4. Analisis pergerakan stok per kategori
5. Analisis pergerakan stok per tipe referensi
6. Analisis pergerakan stok per user
7. Analisis pergerakan stok mingguan
8. Analisis produk dengan pergerakan stok tertinggi
9. Analisis pergerakan stok berdasarkan batch
10. Analisis pergerakan stok harian dengan rata-rata bergerak

## Cara Menggunakan

1. Jalankan file `stock_movement_trends.sql` untuk membuat view dan fungsi
2. Gunakan view dan fungsi yang telah dibuat atau contoh query dari `stock_movement_examples.sql`
3. Sesuaikan parameter sesuai kebutuhan analisis

## Catatan Penting

- Pastikan tabel `inventory_movement` memiliki data yang cukup untuk analisis
- Untuk performa yang lebih baik, tambahkan indeks pada kolom yang sering digunakan dalam filter
- Untuk analisis data dalam jumlah besar, pertimbangkan untuk membatasi rentang waktu