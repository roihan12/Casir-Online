# API Documentation: Produk Master

## Overview

Dokumen ini menjelaskan endpoint API yang tersedia untuk pengelolaan produk master di aplikasi Casir-Online. Produk master adalah data induk produk yang digunakan sebagai referensi untuk produk di setiap cabang.

## Base URL

```
https://api.casir-online.com/v1
```

## Endpoints

### Get All Produk Master

Mengambil daftar semua produk master dengan dukungan paginasi dan filtering.

- **URL**: `/produk-master`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Semua pengguna terotentikasi

**Query Parameters**:

```
search: string - Pencarian berdasarkan nama, SKU, barcode, atau brand
kategoriId: string - Filter berdasarkan ID kategori
status: string - Filter berdasarkan status (aktif, nonaktif)
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
  "success": true,
  "data": [
    {
      "id": "string",
      "namaProduk": "string",
      "sku": "string",
      "barcode": "string",
      "deskripsi": "string",
      "kategoriId": "string",
      "brand": "string",
      "satuan": "string",
      "berat": "number",
      "dimensiP": "number",
      "dimensiL": "number",
      "dimensiT": "number",
      "isManagedStock": "boolean",
      "hasExpired": "boolean",
      "status": "string",
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "kategori": {
        "id": "string",
        "namaKategori": "string"
      },
      "produkImage": [
        {
          "id": "string",
          "fileName": "string",
          "filePath": "string",
          "isPrimary": "boolean",
          "urutan": "number"
        }
      ]
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

**Response Error (401)**:

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### Get Produk Master By ID

Mengambil detail produk master berdasarkan ID.

- **URL**: `/produk-master/:id`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Semua pengguna terotentikasi

**URL Parameters**:

```
id: string - ID produk master
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "success": true,
  "data": {
    "id": "string",
    "namaProduk": "string",
    "sku": "string",
    "barcode": "string",
    "deskripsi": "string",
    "kategoriId": "string",
    "brand": "string",
    "satuan": "string",
    "berat": "number",
    "dimensiP": "number",
    "dimensiL": "number",
    "dimensiT": "number",
    "isManagedStock": "boolean",
    "hasExpired": "boolean",
    "status": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "kategori": {
      "id": "string",
      "namaKategori": "string"
    },
    "produkImage": [
      {
        "id": "string",
        "fileName": "string",
        "filePath": "string",
        "isPrimary": "boolean",
        "urutan": "number"
      }
    ]
  }
}
```

**Response Error (404)**:

```json
{
  "success": false,
  "message": "Master product not found"
}
```

### Create Produk Master

Membuat produk master baru.

- **URL**: `/produk-master`
- **Method**: `POST`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Super Admin
- **Content-Type**: `multipart/form-data`

**Request Body**:

```
namaProduk: string (required) - Nama produk
sku: string (required) - Stock Keeping Unit
barcode: string - Barcode produk (opsional)
deskripsi: string - Deskripsi produk (opsional)
kategoriId: string (required) - ID kategori produk
brand: string - Merek produk (opsional)
satuan: string - Satuan produk (opsional)
berat: number - Berat produk (opsional)
dimensiP: number - Panjang produk (opsional)
dimensiL: number - Lebar produk (opsional)
dimensiT: number - Tinggi produk (opsional)
isManagedStock: boolean (default: false) - Apakah stok dikelola
hasExpired: boolean (default: false) - Apakah produk memiliki tanggal kadaluarsa
status: string (default: "aktif") - Status produk (aktif, nonaktif)
produkImages: file[] - File gambar produk (max 10 files)
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
Content-Type: multipart/form-data
```

**Response Success (201)**:

```json
{
  "success": true,
  "message": "Master product created successfully",
  "data": {
    "id": "string",
    "namaProduk": "string",
    "sku": "string",
    "barcode": "string",
    "deskripsi": "string",
    "kategoriId": "string",
    "brand": "string",
    "satuan": "string",
    "berat": "number",
    "dimensiP": "number",
    "dimensiL": "number",
    "dimensiT": "number",
    "isManagedStock": "boolean",
    "hasExpired": "boolean",
    "status": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "produkImage": [
      {
        "id": "string",
        "fileName": "string",
        "filePath": "string",
        "isPrimary": "boolean",
        "urutan": "number"
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
  "errors": "namaProduk is required, sku is required"
}
```

**Response Error (400) - SKU Exists**:

```json
{
  "success": false,
  "message": "SKU already exists"
}
```

**Response Error (401)**:

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Response Error (403)**:

```json
{
  "success": false,
  "message": "Forbidden: Requires super_admin role"
}
```

### Update Produk Master

Memperbarui produk master yang sudah ada.

- **URL**: `/produk-master/:id`
- **Method**: `PUT`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Super Admin
- **Content-Type**: `multipart/form-data`

**URL Parameters**:

```
id: string - ID produk master
```

**Request Body**:

```
namaProduk: string - Nama produk
sku: string - Stock Keeping Unit
barcode: string - Barcode produk (opsional)
deskripsi: string - Deskripsi produk (opsional)
kategoriId: string - ID kategori produk
brand: string - Merek produk (opsional)
satuan: string - Satuan produk (opsional)
berat: number - Berat produk (opsional)
dimensiP: number - Panjang produk (opsional)
dimensiL: number - Lebar produk (opsional)
dimensiT: number - Tinggi produk (opsional)
isManagedStock: boolean - Apakah stok dikelola
hasExpired: boolean - Apakah produk memiliki tanggal kadaluarsa
status: string - Status produk (aktif, nonaktif)
produkImages: file[] - File gambar produk (max 10 files)
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
Content-Type: multipart/form-data
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "Master product updated successfully",
  "data": {
    "id": "string",
    "namaProduk": "string",
    "sku": "string",
    "barcode": "string",
    "deskripsi": "string",
    "kategoriId": "string",
    "brand": "string",
    "satuan": "string",
    "berat": "number",
    "dimensiP": "number",
    "dimensiL": "number",
    "dimensiT": "number",
    "isManagedStock": "boolean",
    "hasExpired": "boolean",
    "status": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "produkImage": [
      {
        "id": "string",
        "fileName": "string",
        "filePath": "string",
        "isPrimary": "boolean",
        "urutan": "number"
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
  "errors": "namaProduk must be a string"
}
```

**Response Error (400) - SKU Exists**:

```json
{
  "success": false,
  "message": "SKU already exists"
}
```

**Response Error (404)**:

```json
{
  "success": false,
  "message": "Master product not found"
}
```

### Upload Produk Master Images

Menambahkan gambar ke produk master yang sudah ada.

- **URL**: `/produk-master/:id`
- **Method**: `POST`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Super Admin
- **Content-Type**: `multipart/form-data`

**URL Parameters**:

```
id: string - ID produk master
```

**Request Body**:

```
produkImages: file[] - File gambar produk (max 10 files)
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
Content-Type: multipart/form-data
```

**Response Success (201)**:

```json
{
  "success": true,
  "message": "Master product images created successfully",
  "data": {
    "id": "string",
    "namaProduk": "string",
    "sku": "string",
    "produkImage": [
      {
        "id": "string",
        "fileName": "string",
        "filePath": "string",
        "isPrimary": "boolean",
        "urutan": "number"
      }
    ]
  }
}
```

**Response Error (404)**:

```json
{
  "success": false,
  "message": "Master product not found"
}
```

### Delete Produk Master

Menghapus produk master.

- **URL**: `/produk-master/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Super Admin

**URL Parameters**:

```
id: string - ID produk master
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "Master product deleted successfully"
}
```

**Response Error (404)**:

```json
{
  "success": false,
  "message": "Master product not found"
}
```

### Delete Produk Master Image

Menghapus gambar dari produk master.

- **URL**: `/produk-master/:id/images/:imageId`
- **Method**: `DELETE`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Super Admin

**URL Parameters**:

```
id: string - ID produk master
imageId: string - ID gambar produk
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "Master product images deleted successfully"
}
```

**Response Error (404)**:

```json
{
  "success": false,
  "message": "Master product not found"
}
```

## Struktur Data Produk Master

| Field         | Type     | Description                                 |
| ------------- | -------- | ------------------------------------------- |
| id            | string   | ID unik produk master                       |
| namaProduk    | string   | Nama produk                                 |
| sku           | string   | Stock Keeping Unit                          |
| barcode       | string   | Barcode produk (opsional)                   |
| deskripsi     | string   | Deskripsi produk (opsional)                 |
| kategoriId    | string   | ID kategori produk                          |
| brand         | string   | Merek produk (opsional)                     |
| satuan        | string   | Satuan produk (opsional)                    |
| berat         | number   | Berat produk (opsional)                     |
| dimensiP      | number   | Panjang produk (opsional)                   |
| dimensiL      | number   | Lebar produk (opsional)                     |
| dimensiT      | number   | Tinggi produk (opsional)                    |
| isManagedStock| boolean  | Apakah stok dikelola (default: false)       |
| hasExpired    | boolean  | Apakah produk memiliki kadaluarsa (default: false) |
| status        | string   | Status produk master (aktif, nonaktif)      |
| createdAt     | datetime | Waktu pembuatan                             |
| updatedAt     | datetime | Waktu terakhir diperbarui                   |

### Struktur Data Produk Image

| Field     | Type     | Description                        |
| --------- | -------- | ---------------------------------- |
| id        | string   | ID unik gambar produk              |
| fileName  | string   | Nama file gambar                   |
| filePath  | string   | Path file gambar                   |
| isPrimary | boolean  | Apakah gambar utama                |
| urutan    | number   | Urutan tampilan gambar             |