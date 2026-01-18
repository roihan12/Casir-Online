# Panduan Penggunaan Data RBAC dan Menu

File-file SQL di direktori ini berisi data untuk Role-Based Access Control (RBAC) dan struktur menu aplikasi Casir-Online.

## Daftar File

1. `rbac_seed.sql` - Berisi data untuk:
   - Roles (Super Admin, Admin, Kasir, Manajer, Gudang)
   - Permissions (hak akses per modul)
   - Role Permissions (mapping role dengan permission)
   - Menu (struktur menu aplikasi)
   - Role Menu (mapping role dengan menu)
   - Sample User (pengguna contoh)
   - Sample Cabang (cabang contoh)
   - User Cabang (mapping pengguna dengan cabang)
   - User Role (mapping pengguna dengan role)

2. `user_seed.sql` - Berisi data pengguna dengan password yang sudah di-hash menggunakan bcrypt.

## Cara Menggunakan

### Menggunakan psql (PostgreSQL CLI)

```bash
psql -U username -d database_name -f rbac_seed.sql
psql -U username -d database_name -f user_seed.sql
```

### Menggunakan pgAdmin

1. Buka pgAdmin
2. Pilih database yang ingin digunakan
3. Klik kanan pada database > Query Tool
4. Buka file SQL (rbac_seed.sql atau user_seed.sql)
5. Klik tombol Execute/Run

### Menggunakan Node.js

Anda juga dapat menggunakan script Node.js untuk menjalankan file SQL:

```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'username',
  host: 'localhost',
  database: 'database_name',
  password: 'password',
  port: 5432,
});

async function executeSqlFile(filePath) {
  try {
    const sql = fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
    await pool.query(sql);
    console.log(`File ${filePath} berhasil dieksekusi`);
  } catch (err) {
    console.error(`Error mengeksekusi file ${filePath}:`, err);
  }
}

async function seedDatabase() {
  await executeSqlFile('./rbac_seed.sql');
  await executeSqlFile('./user_seed.sql');
  await pool.end();
}

seedDatabase();
```

## Informasi Pengguna

Semua pengguna contoh menggunakan password yang sama: `password123`

| Username    | Password    | Role        |
|-------------|-------------|-------------|
| superadmin  | password123 | Super Admin |
| admin       | password123 | Admin       |
| kasir       | password123 | Kasir       |
| manajer     | password123 | Manajer     |
| gudang      | password123 | Gudang      |

## Struktur RBAC

### Roles

1. **Super Admin** - Akses penuh ke seluruh sistem
2. **Admin** - Akses administratif ke sistem
3. **Kasir** - Akses ke modul transaksi dan produk
4. **Manajer** - Akses ke laporan dan manajemen
5. **Gudang** - Akses ke modul inventori

### Permissions

Permissions dikelompokkan berdasarkan modul dan tindakan (create, read, update, delete, manage).

### Menu

Struktur menu terdiri dari menu utama dan sub-menu:

1. **Dashboard**
2. **Transaksi**
3. **Produk**
   - Daftar Produk
   - Kategori
   - Supplier
4. **Pelanggan**
5. **Laporan**
   - Laporan Penjualan
   - Laporan Stok
   - Laporan Keuangan
6. **Pengaturan**
   - Pengguna
   - Role & Permissions
   - Cabang
   - Promo & Diskon
   - Shift
   - Program Loyalty
7. **Inventory**
   - Stok Barang
   - Transfer Stok
   - Penyesuaian Stok

## Catatan

- Pastikan database sudah dibuat sebelum menjalankan file SQL.
- Jika ada error foreign key constraint, pastikan tabel-tabel yang direferensikan sudah ada.
- Jika ingin menjalankan ulang, hapus terlebih dahulu data yang sudah ada untuk menghindari duplikasi.