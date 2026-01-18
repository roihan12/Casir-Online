# API Documentation: Transaksi

## Overview

Dokumen ini menjelaskan endpoint API yang tersedia untuk pengelolaan transaksi di aplikasi Casir-Online. Transaksi mencakup penjualan, pembelian, retur penjualan, dan retur pembelian dengan berbagai metode pembayaran.

## Base URL

```
https://api.casir-online.com/v1
```

## Endpoints

### Create Transaksi

Membuat transaksi baru (penjualan, pembelian, retur).

- **URL**: `/transaksi`
- **Method**: `POST`
- **Auth Required**: Yes (Cookie)
- **Permissions**: admin_cabang, kasir, super_admin

**Request Body**:

```json
{
  "cabang_id": "string",
  "jenis_transaksi": "PENJUALAN", // PENJUALAN, PEMBELIAN, RETUR_PENJUALAN, RETUR_PEMBELIAN
  "tanggal": "2023-01-01T00:00:00Z", // Opsional, default: waktu saat ini
  "pelanggan_id": "string", // Opsional
  "supplier_id": "string", // Opsional
  "shift_id": "string", // Opsional
  "promo_id": "string", // Opsional
  "details": [
    {
      "produk_id": "string",
      "batch_number": "string", // Opsional
      "expired_date": "2023-12-31", // Opsional
      "jumlah": 5,
      "harga_satuan": 10000,
      "diskon_persen": 0, // Opsional, default: 0
      "pajak_persen": 0 // Opsional, default: 0
    }
  ],
  "biaya_tambahan": 0, // Opsional, default: 0
  "keterangan": "string" // Opsional
}
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (201)**:

```json
{
  "status": true,
  "message": "Transaksi berhasil dibuat",
  "data": {
    "transaksi_id": "string",
    "nomor_transaksi": "string",
    "cabang_id": "string",
    "user_id": "string",
    "jenis_transaksi": "string",
    "tanggal": "timestamp",
    "pelanggan_id": "string",
    "supplier_id": "string",
    "shift_id": "string",
    "promo_id": "string",
    "subtotal": "number",
    "diskon": "number",
    "pajak": "number",
    "biaya_tambahan": "number",
    "total": "number",
    "status_pembayaran": "string",
    "keterangan": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "transaksi_detail": [
      {
        "id": "string",
        "transaksi_id": "string",
        "produk_id": "string",
        "batch_number": "string",
        "expired_date": "date",
        "jumlah": "number",
        "harga_satuan": "number",
        "diskon_persen": "number",
        "pajak_persen": "number",
        "subtotal": "number",
        "produk": {
          "id": "string",
          "namaProduk": "string",
          "sku": "string"
        }
      }
    ]
  }
}
```

**Response Error (400)**:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": "cabang_id is required, details must contain at least 1 items"
}
```

### Get Transaksi By ID

Mendapatkan detail transaksi berdasarkan ID.

- **URL**: `/transaksi/:id`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: admin_cabang, kasir, super_admin

**URL Parameters**:

```
id: string - ID transaksi
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Berhasil mendapatkan detail transaksi",
  "data": {
    "transaksi_id": "string",
    "nomor_transaksi": "string",
    "cabang_id": "string",
    "user_id": "string",
    "jenis_transaksi": "string",
    "tanggal": "timestamp",
    "pelanggan_id": "string",
    "supplier_id": "string",
    "shift_id": "string",
    "promo_id": "string",
    "subtotal": "number",
    "diskon": "number",
    "pajak": "number",
    "biaya_tambahan": "number",
    "total": "number",
    "status_pembayaran": "string",
    "keterangan": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "transaksi_detail": [
      {
        "id": "string",
        "transaksi_id": "string",
        "produk_id": "string",
        "batch_number": "string",
        "expired_date": "date",
        "jumlah": "number",
        "harga_satuan": "number",
        "diskon_persen": "number",
        "pajak_persen": "number",
        "subtotal": "number",
        "produk": {
          "id": "string",
          "namaProduk": "string",
          "sku": "string"
        }
      }
    ],
    "pembayaran": [
      {
        "id": "string",
        "transaksi_id": "string",
        "metode_pembayaran": "string",
        "provider": "string",
        "nomor_referensi": "string",
        "jumlah_bayar": "number",
        "jumlah_kembali": "number",
        "tanggal_pembayaran": "timestamp",
        "bukti_bayar_url": "string",
        "status": "string",
        "keterangan": "string"
      }
    ],
    "pelanggan": {
      "id": "string",
      "namaPelanggan": "string",
      "telepon": "string",
      "email": "string"
    },
    "supplier": {
      "id": "string",
      "namaSupplier": "string",
      "telepon": "string",
      "email": "string"
    },
    "cabang": {
      "id": "string",
      "namaCabang": "string"
    },
    "user": {
      "id": "string",
      "namaLengkap": "string"
    },
    "loyaltyInfo": {
      "poin": "number",
      "level": "string"
    }
  }
}
```

**Response Error (404)**:

```json
{
  "success": false,
  "message": "Transaksi tidak ditemukan"
}
```

### Get Transaksi List

Mendapatkan daftar transaksi dengan dukungan paginasi dan filtering.

- **URL**: `/transaksi`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: admin_cabang, kasir, super_admin

**Query Parameters**:

```
cabang_id: string - Filter berdasarkan ID cabang
jenis_transaksi: string - Filter berdasarkan jenis transaksi (PENJUALAN, PEMBELIAN, RETUR_PENJUALAN, RETUR_PEMBELIAN)
status_pembayaran: string - Filter berdasarkan status pembayaran (LUNAS, BELUM_LUNAS, DIBATALKAN)
pelanggan_id: string - Filter berdasarkan ID pelanggan
supplier_id: string - Filter berdasarkan ID supplier
user_id: string - Filter berdasarkan ID user
tanggal_mulai: date - Filter transaksi dari tanggal tertentu
tanggal_akhir: date - Filter transaksi sampai tanggal tertentu
search: string - Pencarian berdasarkan nomor transaksi atau keterangan
page: number (default: 1) - Halaman yang diminta
limit: number (default: 10) - Jumlah item per halaman
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Berhasil mendapatkan daftar transaksi",
  "data": [
    {
      "transaksi_id": "string",
      "nomor_transaksi": "string",
      "cabang_id": "string",
      "user_id": "string",
      "jenis_transaksi": "string",
      "tanggal": "timestamp",
      "pelanggan_id": "string",
      "supplier_id": "string",
      "subtotal": "number",
      "diskon": "number",
      "pajak": "number",
      "biaya_tambahan": "number",
      "total": "number",
      "status_pembayaran": "string",
      "keterangan": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "transaksi_detail": [
        {
          "id": "string",
          "transaksi_id": "string",
          "produk_id": "string",
          "jumlah": "number",
          "harga_satuan": "number",
          "subtotal": "number",
          "produk": {
            "id": "string",
            "namaProduk": "string"
          }
        }
      ],
      "pelanggan": {
        "id": "string",
        "namaPelanggan": "string"
      },
      "supplier": {
        "id": "string",
        "namaSupplier": "string"
      },
      "cabang": {
        "id": "string",
        "namaCabang": "string"
      },
      "user": {
        "id": "string",
        "namaLengkap": "string"
      }
    }
  ],
  "pagination": {
    "totalItems": "number",
    "totalPages": "number",
    "currentPage": "number",
    "itemsPerPage": "number",
    "hasNextPage": "boolean",
    "hasPrevPage": "boolean"
  }
}
```

### Add Payment

Menambahkan pembayaran untuk transaksi.

- **URL**: `/transaksi/payment`
- **Method**: `POST`
- **Auth Required**: Yes (Cookie)
- **Permissions**: admin_cabang, kasir, super_admin

**Request Body**:

```json
{
  "transaksi_id": "string",
  "metode_pembayaran": "TUNAI", // TUNAI, KARTU_DEBIT, KARTU_KREDIT, TRANSFER, QRIS, E_WALLET
  "provider": "string", // Opsional (contoh: BCA, Mandiri, OVO, dll)
  "nomor_referensi": "string", // Opsional
  "jumlah_bayar": 100000,
  "jumlah_kembali": 0, // Opsional, default: 0
  "tanggal_pembayaran": "2023-01-01T00:00:00Z", // Opsional, default: waktu saat ini
  "bukti_bayar_url": "string", // Opsional
  "keterangan": "string", // Opsional
  "generate_receipt": true // Opsional, default: true
}
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Pembayaran berhasil ditambahkan",
  "data": {
    "id": "string",
    "transaksi_id": "string",
    "metode_pembayaran": "string",
    "provider": "string",
    "nomor_referensi": "string",
    "jumlah_bayar": "number",
    "jumlah_kembali": "number",
    "tanggal_pembayaran": "timestamp",
    "bukti_bayar_url": "string",
    "status": "string",
    "keterangan": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "transaksi": {
      "transaksi_id": "string",
      "nomor_transaksi": "string",
      "status_pembayaran": "string",
      "total": "number"
    },
    "receipt": {
      "url": "string",
      "filename": "string"
    }
  }
}
```

**Response Error (400)**:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": "transaksi_id is required, jumlah_bayar must be greater than 0"
}
```

**Response Error (404)**:

```json
{
  "success": false,
  "message": "Transaksi tidak ditemukan"
}
```

### Create QRIS Payment

Membuat pembayaran QRIS untuk transaksi.

- **URL**: `/transaksi/payment/qris`
- **Method**: `POST`
- **Auth Required**: Yes (Cookie)
- **Permissions**: admin_cabang, kasir, super_admin

**Request Body**:

```json
{
  "transaksi_id": "string",
  "amount": 100000,
  "description": "string" // Opsional
}
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Pembayaran QRIS berhasil dibuat",
  "data": {
    "id": "string",
    "transaksi_id": "string",
    "metode_pembayaran": "QRIS",
    "provider": "string",
    "nomor_referensi": "string",
    "jumlah_bayar": "number",
    "status": "PENDING",
    "keterangan": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "qris_data": {
      "qr_string": "string",
      "qr_image_url": "string",
      "amount": "number",
      "external_id": "string",
      "expiry_date": "timestamp"
    }
  }
}
```

**Response Error (400)**:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": "transaksi_id is required, amount must be greater than 0"
}
```

**Response Error (404)**:

```json
{
  "success": false,
  "message": "Transaksi tidak ditemukan"
}
```

### QRIS Callback Webhook

Endpoint untuk menerima callback dari payment gateway QRIS.

- **URL**: `/transaksi/payment/qris/callback`
- **Method**: `POST`
- **Auth Required**: No

**Request Body**:

```json
{
  "payment_id": "string",
  "payment_status": "SUKSES", // SUKSES, GAGAL, PENDING
  "reference_id": "string"
}
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Status pembayaran QRIS berhasil diupdate",
  "data": {
    "id": "string",
    "transaksi_id": "string",
    "metode_pembayaran": "QRIS",
    "status": "string",
    "updated_at": "timestamp"
  }
}
```

### Cancel Transaksi

Membatalkan transaksi.

- **URL**: `/transaksi/:id/cancel`
- **Method**: `PUT`
- **Auth Required**: Yes (Cookie)
- **Permissions**: admin_cabang, super_admin

**URL Parameters**:

```
id: string - ID transaksi
```

**Request Body**:

```json
{
  "alasan": "string"
}
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Transaksi berhasil dibatalkan",
  "data": {
    "transaksi_id": "string",
    "nomor_transaksi": "string",
    "status_pembayaran": "DIBATALKAN",
    "keterangan": "string",
    "updated_at": "timestamp"
  }
}
```

**Response Error (400)**:

```json
{
  "success": false,
  "message": "Alasan pembatalan diperlukan"
}
```

**Response Error (400) - Already Paid**:

```json
{
  "success": false,
  "message": "Transaksi dengan pembayaran berhasil tidak dapat dibatalkan"
}
```

**Response Error (404)**:

```json
{
  "success": false,
  "message": "Transaksi tidak ditemukan"
}
```

### Get Sales Report

Mendapatkan laporan penjualan.

- **URL**: `/transaksi/reports/sales`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: admin_cabang, super_admin

**Query Parameters**:

```
cabang_id: string - Filter berdasarkan ID cabang
periode: string (default: daily) - Periode laporan (daily, weekly, monthly, yearly)
tanggal_mulai: date - Tanggal awal laporan
tanggal_akhir: date - Tanggal akhir laporan
kasir_id: string - Filter berdasarkan ID kasir
produk_id: string - Filter berdasarkan ID produk
kategori_id: string - Filter berdasarkan ID kategori
payment_method: string - Filter berdasarkan metode pembayaran
include_details: boolean (default: false) - Sertakan detail transaksi
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Berhasil mendapatkan laporan penjualan",
  "data": {
    "summary": {
      "totalTransaksi": "number",
      "totalPenjualan": "number",
      "totalDiskon": "number",
      "totalPajak": "number",
      "totalBiayaTambahan": "number",
      "rataRataTransaksi": "number"
    },
    "byPeriod": [
      {
        "periode": "string", // Tanggal, minggu, bulan, atau tahun
        "totalTransaksi": "number",
        "totalPenjualan": "number"
      }
    ],
    "byPaymentMethod": [
      {
        "metode": "string",
        "jumlah": "number",
        "persentase": "number"
      }
    ],
    "topProducts": [
      {
        "produk_id": "string",
        "namaProduk": "string",
        "jumlahTerjual": "number",
        "totalPenjualan": "number"
      }
    ],
    "transactions": [
      {
        "transaksi_id": "string",
        "nomor_transaksi": "string",
        "tanggal": "timestamp",
        "total": "number",
        "kasir": "string",
        "pelanggan": "string",
        "metode_pembayaran": "string"
      }
    ]
  }
}
```

## Struktur Data Transaksi

| Field             | Type     | Description                                 |
| ----------------- | -------- | ------------------------------------------- |
| transaksi_id      | string   | ID unik transaksi                           |
| nomor_transaksi   | string   | Nomor transaksi yang ditampilkan            |
| cabang_id         | string   | ID cabang tempat transaksi                  |
| user_id           | string   | ID user yang membuat transaksi              |
| jenis_transaksi   | string   | Jenis transaksi (PENJUALAN, PEMBELIAN, dll) |
| tanggal           | datetime | Tanggal transaksi                           |
| pelanggan_id      | string   | ID pelanggan (opsional)                     |
| supplier_id       | string   | ID supplier (opsional)                      |
| shift_id          | string   | ID shift (opsional)                         |
| promo_id          | string   | ID promo (opsional)                         |
| subtotal          | decimal  | Total harga sebelum diskon dan pajak        |
| diskon            | decimal  | Total diskon                                |
| pajak             | decimal  | Total pajak                                 |
| biaya_tambahan    | decimal  | Biaya tambahan                              |
| total             | decimal  | Total harga setelah diskon dan pajak        |
| status_pembayaran | string   | Status pembayaran (LUNAS, BELUM_LUNAS, DIBATALKAN) |
| keterangan        | string   | Keterangan tambahan (opsional)              |
| created_at        | datetime | Waktu pembuatan                             |
| updated_at        | datetime | Waktu terakhir diperbarui                   |

### Struktur Data Transaksi Detail

| Field         | Type     | Description                                 |
| ------------- | -------- | ------------------------------------------- |
| id            | string   | ID unik detail transaksi                    |
| transaksi_id  | string   | ID transaksi                                |
| produk_id     | string   | ID produk                                   |
| batch_number  | string   | Nomor batch produk (opsional)               |
| expired_date  | date     | Tanggal kadaluarsa (opsional)               |
| jumlah        | integer  | Jumlah produk                               |
| harga_satuan  | decimal  | Harga satuan produk                         |
| diskon_persen | decimal  | Persentase diskon per item                  |
| pajak_persen  | decimal  | Persentase pajak per item                   |
| subtotal      | decimal  | Subtotal harga (jumlah * harga_satuan)      |

### Struktur Data Pembayaran

| Field              | Type     | Description                                 |
| ------------------ | -------- | ------------------------------------------- |
| id                 | string   | ID unik pembayaran                          |
| transaksi_id       | string   | ID transaksi                                |
| metode_pembayaran  | string   | Metode pembayaran (TUNAI, KARTU_DEBIT, dll) |
| provider           | string   | Penyedia layanan pembayaran (opsional)      |
| nomor_referensi    | string   | Nomor referensi pembayaran (opsional)       |
| jumlah_bayar       | decimal  | Jumlah yang dibayarkan                      |
| jumlah_kembali     | decimal  | Jumlah kembalian                            |
| tanggal_pembayaran | datetime | Tanggal dan waktu pembayaran                |
| bukti_bayar_url    | string   | URL bukti pembayaran (opsional)             |
| status             | string   | Status pembayaran (SUKSES, GAGAL, PENDING)  |
| keterangan         | string   | Keterangan tambahan (opsional)              |
| created_at         | datetime | Waktu pembuatan                             |
| updated_at         | datetime | Waktu terakhir diperbarui                   |