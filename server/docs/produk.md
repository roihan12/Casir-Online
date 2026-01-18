# API Documentation: Produk (Product)

## Overview

Dokumen ini menjelaskan endpoint API yang tersedia untuk pengelolaan produk di aplikasi Casir-Online.

## Base URL

```
https://api.casir-online.com/v1
```

## Endpoints

### Get All Produk

Mengambil daftar semua produk dengan dukungan paginasi dan filtering.

- **URL**: `/produk`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Semua pengguna terotentikasi

**Query Parameters**:

```
search: string - Pencarian berdasarkan nama, SKU, atau barcode
produkMasterId: string - Filter berdasarkan ID produk master
cabangId: string - Filter berdasarkan ID cabang
status: string - Filter berdasarkan status (tersedia, kosong, nonaktif)
minHarga: number - Filter berdasarkan harga minimal
maxHarga: number - Filter berdasarkan harga maksimal
minStok: number - Filter berdasarkan stok minimal
maxStok: number - Filter berdasarkan stok maksimal
kategoriId: string - Filter berdasarkan kategori
page: number (default: 1) - Halaman yang diminta
limit: number (default: 10) - Jumlah item per halaman
sortBy: string (default: updatedAt) - Kolom untuk pengurutan
sortOrder: string (default: desc) - Arah pengurutan (asc/desc)
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Success get all products",
  "data": [
    {
      "id": "string",
      "produkMasterId": "string",
      "cabangId": "string",
      "hargaBeli": "number",
      "hargaJual": "number",
      "hargaGrosir": "number",
      "stok": "number",
      "minStok": "number",
      "maxStok": "number",
      "status": "string",
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "produkMaster": {
        "id": "string",
        "namaProduk": "string",
        "sku": "string",
        "barcode": "string",
        "deskripsi": "string",
        "kategori": {
          "id": "string",
          "namaKategori": "string"
        },
        "produkImage": [
          {
            "id": "string",
            "filePath": "string",
            "isPrimary": "boolean"
          }
        ]
      },
      "cabang": {
        "id": "string",
        "namaCabang": "string"
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

### Get Produk By ID

Mengambil informasi produk berdasarkan ID.

- **URL**: `/produk/:id`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Semua pengguna terotentikasi

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Success get product detail",
  "data": {
    "id": "string",
    "produkMasterId": "string",
    "cabangId": "string",
    "hargaBeli": "number",
    "hargaJual": "number",
    "hargaGrosir": "number",
    "stok": "number",
    "minStok": "number",
    "maxStok": "number",
    "status": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "produkMaster": {
      "id": "string",
      "namaProduk": "string",
      "sku": "string",
      "barcode": "string",
      "deskripsi": "string",
      "kategori": {
        "id": "string",
        "namaKategori": "string",
        "status": "string"
      },
      "produkImage": [
        {
          "id": "string",
          "filePath": "string",
          "isPrimary": "boolean"
        }
      ]
    },
    "cabang": {
      "id": "string",
      "namaCabang": "string"
    },
    "produkPriceHistory": [
      {
        "id": "string",
        "tipeHarga": "string",
        "hargaLama": "number",
        "hargaBaru": "number",
        "tanggalPerubahan": "timestamp",
        "alasanPerubahan": "string"
      }
    ]
  }
}
```

**Response Error (404 - Not Found)**:

```json
{
  "status": false,
  "message": "Product not found"
}
```

### Search Produk

Mencari produk berdasarkan ID produk master dan cabang.

- **URL**: `/produk/search`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Semua pengguna terotentikasi

**Query Parameters**:

```
produkMasterId: string (required) - ID produk master
cabangId: string (required) - ID cabang
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Success get product",
  "data": {
    "id": "string",
    "produkMasterId": "string",
    "cabangId": "string",
    "hargaBeli": "number",
    "hargaJual": "number",
    "hargaGrosir": "number",
    "stok": "number",
    "minStok": "number",
    "maxStok": "number",
    "status": "string",
    "produkMaster": {
      "id": "string",
      "namaProduk": "string",
      "sku": "string"
    },
    "cabang": {
      "id": "string",
      "namaCabang": "string"
    }
  }
}
```

**Response Error (400 - Bad Request)**:

```json
{
  "status": false,
  "message": "produkMasterId and cabangId are required"
}
```

### Search Products By Cabang

Mencari produk di cabang tertentu dengan berbagai parameter.

- **URL**: `/produk/:cabangId/search`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Semua pengguna terotentikasi

**Path Parameters**:

```
cabangId: string - ID cabang
```

**Query Parameters**:

```
query: string - Kata kunci pencarian
kategoriId: string - Filter berdasarkan kategori
page: number (default: 1) - Halaman yang diminta
limit: number (default: 10) - Jumlah item per halaman
sortBy: string (default: namaProduk) - Kolom untuk pengurutan
sortOrder: string (default: asc) - Arah pengurutan (asc/desc)
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "string",
      "produkMasterId": "string",
      "cabangId": "string",
      "hargaBeli": "number",
      "hargaJual": "number",
      "hargaGrosir": "number",
      "stok": "number",
      "status": "string",
      "produkMaster": {
        "namaProduk": "string",
        "sku": "string",
        "kategori": {
          "namaKategori": "string"
        }
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

### Get Product By Barcode

Mengambil produk berdasarkan barcode.

- **URL**: `/produk/barcode/:barcode`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Semua pengguna terotentikasi

**Path Parameters**:

```
barcode: string - Barcode produk
```

**Query Parameters**:

```
cabangId: string (required) - ID cabang
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Product retrieved successfully",
  "data": {
    "id": "string",
    "produkMasterId": "string",
    "cabangId": "string",
    "hargaBeli": "number",
    "hargaJual": "number",
    "hargaGrosir": "number",
    "stok": "number",
    "status": "string",
    "produkMaster": {
      "namaProduk": "string",
      "sku": "string",
      "kategori": {
        "namaKategori": "string"
      }
    }
  }
}
```

**Response Error (404 - Not Found)**:

```json
{
  "status": false,
  "message": "Produk dengan barcode tersebut tidak ditemukan"
}
```

### Get Frequently Used Products

Mengambil daftar produk yang sering digunakan di cabang tertentu.

- **URL**: `/produk/frequent/:cabangId`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Semua pengguna terotentikasi

**Path Parameters**:

```
cabangId: string - ID cabang
```

**Query Parameters**:

```
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
  "message": "Frequently used products retrieved successfully",
  "data": [
    {
      "id": "string",
      "produkMasterId": "string",
      "cabangId": "string",
      "hargaJual": "number",
      "stok": "number",
      "produkMaster": {
        "namaProduk": "string",
        "sku": "string"
      }
    }
  ]
}
```

### Create New Produk

Membuat produk baru.

- **URL**: `/produk`
- **Method**: `POST`
- **Auth Required**: Yes (Cookie)
- **Permissions**: admin_cabang dan super_admin

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
Content-Type: application/json
```

**Request Body**:

```json
{
  "produkMasterId": "string",
  "cabangId": "string",
  "hargaBeli": "number",
  "hargaJual": "number",
  "hargaGrosir": "number",
  "stok": "number",
  "minStok": "number",
  "maxStok": "number",
  "status": "string"
}
```

**Response Success (201)**:

```json
{
  "status": true,
  "message": "Product created successfully",
  "data": {
    "id": "string",
    "produkMasterId": "string",
    "cabangId": "string",
    "hargaBeli": "number",
    "hargaJual": "number",
    "hargaGrosir": "number",
    "stok": "number",
    "minStok": "number",
    "maxStok": "number",
    "status": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Response Error (400 - Bad Request)**:

```json
{
  "status": false,
  "message": "Validation error"
}
```

**Response Error (409 - Conflict)**:

```json
{
  "status": false,
  "message": "Product already exists for this branch"
}
```

### Update Produk

Memperbarui informasi produk.

- **URL**: `/produk/:id`
- **Method**: `PUT`
- **Auth Required**: Yes (Cookie)
- **Permissions**: admin_cabang dan super_admin

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
Content-Type: application/json
```

**Request Body**:

```json
{
  "hargaBeli": "number",
  "hargaJual": "number",
  "hargaGrosir": "number",
  "minStok": "number",
  "maxStok": "number",
  "status": "string",
  "alasanPerubahan": "string",
  "dokumenReferensi": "string",
  "supplierId": "string"
}
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Product updated successfully",
  "data": {
    "id": "string",
    "produkMasterId": "string",
    "cabangId": "string",
    "hargaBeli": "number",
    "hargaJual": "number",
    "hargaGrosir": "number",
    "stok": "number",
    "minStok": "number",
    "maxStok": "number",
    "status": "string",
    "updatedAt": "timestamp"
  }
}
```

**Response Error (404 - Not Found)**:

```json
{
  "status": false,
  "message": "Product not found"
}
```

### Update Stok

Memperbarui stok produk.

- **URL**: `/produk/:id/stock`
- **Method**: `PUT`
- **Auth Required**: Yes (Cookie)
- **Permissions**: admin_cabang dan super_admin

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
Content-Type: application/json
```

**Request Body**:

```json
{
  "quantity": "number",
  "keterangan": "string",
  "referenceId": "string",
  "referenceType": "string",
  "batchNumber": "string",
  "expiredDate": "date"
}
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Stock updated successfully",
  "data": {
    "id": "string",
    "produkMasterId": "string",
    "cabangId": "string",
    "stok": "number",
    "updatedAt": "timestamp"
  }
}
```

**Response Error (404 - Not Found)**:

```json
{
  "status": false,
  "message": "Product not found"
}
```

### Get Inventory Movements

Mengambil riwayat pergerakan stok.

- **URL**: `/produk/:id/inventory-movements`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: admin_cabang dan super_admin

**Path Parameters**:

```
id: string - ID produk
```

**Query Parameters**:

```
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
  "message": "Success get inventory movements",
  "data": [
    {
      "id": "string",
      "produkId": "string",
      "cabangId": "string",
      "referenceId": "string",
      "referenceType": "string",
      "quantity": "number",
      "batchNumber": "string",
      "expiredDate": "date",
      "keterangan": "string",
      "userId": "string",
      "createdAt": "timestamp",
      "user": {
        "id": "string",
        "namaLengkap": "string"
      },
      "cabang": {
        "id": "string",
        "namaCabang": "string"
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

### Get Price History

Mengambil riwayat perubahan harga.

- **URL**: `/produk/:id/price-history`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: admin_cabang dan super_admin

**Path Parameters**:

```
id: string - ID produk
```

**Query Parameters**:

```
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
  "message": "Success get price history",
  "data": [
    {
      "id": "string",
      "produkId": "string",
      "tipeHarga": "string",
      "hargaLama": "number",
      "hargaBaru": "number",
      "tanggalPerubahan": "timestamp",
      "alasanPerubahan": "string",
      "supplierId": "string",
      "dokumenReferensi": "string",
      "userId": "string",
      "createdAt": "timestamp",
      "cabangId": "string",
      "user": {
        "id": "string",
        "namaLengkap": "string"
      },
      "supplier": {
        "id": "string",
        "namaSupplier": "string"
      },
      "cabang": {
        "id": "string",
        "namaCabang": "string"
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

### Get Low Stock Products

Mengambil daftar produk dengan stok rendah.

- **URL**: `/produk/reports/low-stock/:cabangId`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Semua pengguna terotentikasi

**Path Parameters**:

```
cabangId: string - ID cabang
```

**Query Parameters**:

```
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
  "message": "Success get low stock products",
  "data": [
    {
      "id": "string",
      "produkMasterId": "string",
      "cabangId": "string",
      "stok": "number",
      "minStok": "number",
      "maxStok": "number",
      "produkMaster": {
        "namaProduk": "string",
        "sku": "string",
        "kategori": {
          "namaKategori": "string"
        },
        "produkImage": [
          {
            "filePath": "string"
          }
        ]
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

### Get Product Recommendations

Mendapatkan rekomendasi produk untuk ditambahkan ke cabang.

- **URL**: `/produk/recommendations/:cabangId`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: admin_cabang dan super_admin

**Path Parameters**:

```
cabangId: string - ID cabang
```

**Query Parameters**:

```
limit: number (default: 20) - Jumlah item per halaman
kategoriId: string - Filter berdasarkan kategori
search: string - Kata kunci pencarian
page: number (default: 1) - Halaman yang diminta
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Success get product recommendations",
  "data": [
    {
      "id": "string",
      "namaProduk": "string",
      "sku": "string",
      "kategori": {
        "id": "string",
        "namaKategori": "string"
      },
      "gambar": "string",
      "satuan": "string",
      "totalTerjual": "number",
      "rekomendasiHargaBeli": "number",
      "rekomendasiHargaJual": "number",
      "rekomendasiStokAwal": "number",
      "popularitasScore": "number"
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

### Get Product Templates

Mendapatkan template produk.

- **URL**: `/produk/new/templates`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: admin_cabang dan super_admin

**Query Parameters**:

```
kategoriId: string - Filter berdasarkan kategori
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Success get product templates",
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "defaultValues": {
        "marginPercentage": "number",
        "minStok": "number",
        "maxStok": "number",
        "status": "string"
      },
      "kategoriIds": ["string"]
    }
  ]
}
```

### Bulk Add Products

Menambahkan produk secara massal ke cabang.

- **URL**: `/produk/bulk/:cabangId`
- **Method**: `POST`
- **Auth Required**: Yes (Cookie)
- **Permissions**: admin_cabang dan super_admin

**Path Parameters**:

```
cabangId: string - ID cabang
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
Content-Type: application/json
```

**Request Body**:

```json
{
  "products": [
    "string" // produkMasterId
    // atau
    {
      "produkMasterId": "string",
      "hargaBeli": "number",
      "hargaJual": "number",
      "marginPercentage": "number",
      "stok": "number",
      "minStok": "number",
      "maxStok": "number",
      "status": "string"
    }
  ],
  "defaultValues": {
    "hargaBeli": "number",
    "hargaJual": "number",
    "hargaGrosir": "number",
    "marginPercentage": "number",
    "stok": "number",
    "minStok": "number",
    "maxStok": "number",
    "status": "string"
  }
}
```

**Response Success (201)**:

```json
{
  "status": true,
  "message": "Successfully added X products to branch",
  "data": {
    "addedProducts": "number",
    "skippedProducts": "number",
    "createdProducts": [
      {
        "id": "string",
        "produkMasterId": "string",
        "namaProduk": "string"
      }
    ],
    "skippedProductDetails": [
      {
        "produkMasterId": "string",
        "namaProduk": "string",
        "error": "string"
      }
    ]
  }
}
```

**Response Error (400 - Bad Request)**:

```json
{
  "status": false,
  "message": "Validation error"
}
```

## Error Codes

| Status Code | Description           |
| ----------- | --------------------- |
| 200         | OK                    |
| 201         | Created               |
| 400         | Bad Request           |
| 401         | Unauthorized          |
| 403         | Forbidden             |
| 404         | Not Found             |
| 409         | Conflict              |
| 500         | Internal Server Error |

## Struktur Data Produk

### Produk

| Field          | Type     | Description                              |
| -------------- | -------- | ---------------------------------------- |
| id             | string   | ID unik produk                           |
| produkMasterId | string   | ID produk master                         |
| cabangId       | string   | ID cabang                                |
| hargaBeli      | number   | Harga beli produk                        |
| hargaJual      | number   | Harga jual produk                        |
| hargaGrosir    | number   | Harga grosir produk (opsional)           |
| stok           | number   | Jumlah stok produk                       |
| minStok        | number   | Jumlah stok minimal (opsional)           |
| maxStok        | number   | Jumlah stok maksimal (opsional)          |
| status         | string   | Status produk (tersedia/kosong/nonaktif) |
| createdAt      | datetime | Waktu pembuatan                          |
| updatedAt      | datetime | Waktu terakhir diperbarui                |

### Produk Master

| Field      | Type     | Description                   |
| ---------- | -------- | ----------------------------- |
| id         | string   | ID unik produk master         |
| namaProduk | string   | Nama produk                   |
| sku        | string   | Stock Keeping Unit            |
| barcode    | string   | Barcode produk (opsional)     |
| deskripsi  | string   | Deskripsi produk (opsional)   |
| kategoriId | string   | ID kategori produk (opsional) |
| brand      | string   | Merek produk (opsional)       |
| satuan     | string   | Satuan produk (opsional)      |
| status     | string   | Status produk master          |
| createdAt  | datetime | Waktu pembuatan               |
| updatedAt  | datetime | Waktu terakhir diperbarui     |


