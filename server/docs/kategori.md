# API Documentation: Kategori (Category)

## Overview

Dokumen ini menjelaskan endpoint API yang tersedia untuk pengelolaan kategori produk di aplikasi Casir-Online.

## Base URL

```
https://api.casir-online.com/v1
```

## Endpoints

### Get All Kategori

Mengambil daftar semua kategori.

- **URL**: `/kategori`
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
  "success": true,
  "data": [
    {
      "id": "string",
      "namaKategori": "string",
      "deskripsi": "string",
      "status": "aktif",
      "deletedAt": null,
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```

**Response Error (401 - Unauthorized)**:

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### Get Kategori By ID

Mengambil informasi kategori berdasarkan ID.

- **URL**: `/kategori/:kategoriId`
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
  "success": true,
  "data": {
    "id": "string",
    "namaKategori": "string",
    "deskripsi": "string",
    "status": "string",
    "deletedAt": null,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Response Error (404 - Not Found)**:

```json
{
  "success": false,
  "message": "Category not found"
}
```

### Create New Kategori

Membuat kategori baru.

- **URL**: `/kategori`
- **Method**: `POST`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Hanya super_admin

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
Content-Type: application/json
```

**Request Body**:

```json
{
  "namaKategori": "string",
  "deskripsi": "string",
  "status": "aktif"
}
```

**Response Success (201)**:

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "string",
    "namaKategori": "string",
    "deskripsi": "string",
    "status": "string",
    "deletedAt": null,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Response Error (400 - Bad Request)**:

```json
{
  "success": false,
  "message": "Validation error"
}
```

**Response Error (403 - Forbidden)**:

```json
{
  "success": false,
  "message": "Access denied"
}
```

### Update Kategori

Memperbarui informasi kategori yang ada.

- **URL**: `/kategori/:kategoriId`
- **Method**: `PUT`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Hanya super_admin

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
Content-Type: application/json
```

**Request Body**:

```json
{
  "namaKategori": "string",
  "deskripsi": "string",
  "status": "string"
}
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": "string",
    "namaKategori": "string",
    "deskripsi": "string",
    "status": "string",
    "deletedAt": null,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Response Error (404 - Not Found)**:

```json
{
  "success": false,
  "message": "Category not found"
}
```

**Response Error (403 - Forbidden)**:

```json
{
  "success": false,
  "message": "Access denied"
}
```

### Delete Kategori

Menghapus kategori (soft delete).

- **URL**: `/kategori/:kategoriId`
- **Method**: `DELETE`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Hanya super_admin

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Response Error (404 - Not Found)**:

```json
{
  "success": false,
  "message": "Category not found"
}
```

**Response Error (403 - Forbidden)**:

```json
{
  "success": false,
  "message": "Access denied"
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
| 500         | Internal Server Error |

## Struktur Data Kategori

| Field        | Type     | Description                      |
| ------------ | -------- | -------------------------------- |
| id           | string   | ID unik kategori                 |
| namaKategori | string   | Nama kategori                    |
| deskripsi    | string   | Deskripsi kategori               |
| status       | string   | Status kategori (aktif/nonaktif) |
| deletedAt    | datetime | Waktu penghapusan (soft delete)  |
| createdAt    | datetime | Waktu pembuatan                  |
| updatedAt    | datetime | Waktu terakhir diperbarui        |
