# Dokumentasi View PostgreSQL untuk Dashboard Inventory

## Deskripsi

File ini berisi tiga view PostgreSQL yang dibuat untuk menampilkan data inventory pada dashboard:

1. **vw_produk_stok_menipis** - Menampilkan produk dengan stok menipis atau habis
2. **vw_produk_akan_kadaluarsa** - Menampilkan produk yang akan kadaluarsa dalam waktu dekat
3. **vw_transfer_antar_cabang** - Menampilkan data transfer stok antar cabang

Selain itu, terdapat tiga fungsi untuk memfilter data berdasarkan rentang waktu:

1. **get_produk_stok_menipis** - Filter produk stok menipis berdasarkan cabang dan rentang waktu
2. **get_produk_akan_kadaluarsa** - Filter produk akan kadaluarsa berdasarkan cabang dan rentang waktu
3. **get_transfer_antar_cabang** - Filter transfer antar cabang berdasarkan cabang dan rentang waktu

## Cara Penggunaan

### Instalasi

1. Jalankan file `inventory_views.sql` pada database PostgreSQL Anda untuk membuat view dan fungsi
2. Gunakan file `inventory_views_usage.sql` sebagai referensi contoh penggunaan

### Parameter Filter Rentang Waktu

Semua fungsi filter mendukung parameter rentang waktu berikut:

- `today` - Data hari ini saja
- `7days` - Data 7 hari terakhir/ke depan
- `30days` - Data 30 hari terakhir/ke depan
- `90days` - Data 90 hari terakhir/ke depan
- `6months` - Data 6 bulan terakhir/ke depan
- `1year` - Data 1 tahun terakhir/ke depan

### Contoh Penggunaan

#### 1. Melihat Produk dengan Stok Menipis

```sql
-- Semua produk dengan stok menipis
SELECT * FROM vw_produk_stok_menipis;

-- Produk dengan stok menipis dalam 7 hari terakhir
SELECT * FROM get_produk_stok_menipis(NULL, '7days');

-- Produk dengan stok menipis untuk cabang tertentu
SELECT * FROM get_produk_stok_menipis('id_cabang_anda', '30days');
```

#### 2. Melihat Produk yang Akan Kadaluarsa

```sql
-- Semua produk yang akan kadaluarsa
SELECT * FROM vw_produk_akan_kadaluarsa;

-- Produk yang akan kadaluarsa dalam 30 hari ke depan
SELECT * FROM get_produk_akan_kadaluarsa(NULL, '30days');

-- Produk yang akan kadaluarsa untuk cabang tertentu
SELECT * FROM get_produk_akan_kadaluarsa('id_cabang_anda', '90days');
```

#### 3. Melihat Transfer Antar Cabang

```sql
-- Semua transfer antar cabang
SELECT * FROM vw_transfer_antar_cabang;

-- Transfer antar cabang dalam 30 hari terakhir
SELECT * FROM get_transfer_antar_cabang(NULL, '30days');

-- Transfer antar cabang untuk cabang tertentu
SELECT * FROM get_transfer_antar_cabang('id_cabang_anda', '7days');
```

## Struktur Data

### vw_produk_stok_menipis

| Kolom | Tipe Data | Deskripsi |
|-------|-----------|------------|
| produk_id | TEXT | ID produk |
| cabang_id | TEXT | ID cabang |
| nama_cabang | TEXT | Nama cabang |
| nama_produk | TEXT | Nama produk |
| sku | TEXT | SKU produk |
| barcode | TEXT | Barcode produk |
| stok | INTEGER | Jumlah stok saat ini |
| min_stok | INTEGER | Jumlah stok minimum |
| max_stok | INTEGER | Jumlah stok maksimum |
| harga_beli | DECIMAL | Harga beli produk |
| harga_jual | DECIMAL | Harga jual produk |
| status | TEXT | Status produk |
| is_low_stock | BOOLEAN | Flag stok menipis |
| stok_status | TEXT | Status stok (Habis/Menipis/Normal) |
| updated_at | TIMESTAMP | Waktu update terakhir |
| stok_percentage | DECIMAL | Persentase stok terhadap minimum |

### vw_produk_akan_kadaluarsa

| Kolom | Tipe Data | Deskripsi |
|-------|-----------|------------|
| produk_id | TEXT | ID produk |
| cabang_id | TEXT | ID cabang |
| nama_cabang | TEXT | Nama cabang |
| nama_produk | TEXT | Nama produk |
| sku | TEXT | SKU produk |
| barcode | TEXT | Barcode produk |
| stok | INTEGER | Jumlah stok saat ini |
| tanggal_kadaluarsa | DATE | Tanggal kadaluarsa |
| harga_jual | DECIMAL | Harga jual produk |
| status | TEXT | Status produk |
| tanggal_sekarang | DATE | Tanggal hari ini |
| hari_tersisa | INTEGER | Jumlah hari tersisa sebelum kadaluarsa |
| status_kadaluarsa | TEXT | Status kadaluarsa (Kadaluarsa/Kritis/Perhatian/Waspada/Aman) |

### vw_transfer_antar_cabang

| Kolom | Tipe Data | Deskripsi |
|-------|-----------|------------|
| transfer_id | TEXT | ID transfer |
| nomor_transfer | TEXT | Nomor transfer |
| cabang_asal | TEXT | Nama cabang asal |
| cabang_tujuan | TEXT | Nama cabang tujuan |
| tanggal_kirim | TIMESTAMP | Tanggal pengiriman |
| tanggal_terima | TIMESTAMP | Tanggal penerimaan |
| status | TEXT | Status transfer |
| keterangan | TEXT | Keterangan transfer |
| created_at | TIMESTAMP | Waktu pembuatan |
| updated_at | TIMESTAMP | Waktu update terakhir |
| created_by_name | TEXT | Nama pembuat transfer |
| jumlah_item | BIGINT | Jumlah item yang ditransfer |
| total_barang_kirim | BIGINT | Total barang yang dikirim |
| total_barang_terima | BIGINT | Total barang yang diterima |
| status_text | TEXT | Teks status yang mudah dibaca |
| status_style | TEXT | Kelas CSS untuk styling status |

## Integrasi dengan Aplikasi

View dan fungsi ini dapat digunakan untuk menampilkan data pada dashboard inventory aplikasi Casir-Online. Data dapat diakses melalui API atau langsung dari database PostgreSQL.

Untuk mengintegrasikan dengan aplikasi, tambahkan endpoint API yang memanggil fungsi-fungsi ini dan mengembalikan data dalam format JSON untuk ditampilkan pada frontend.