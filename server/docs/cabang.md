# API Documentation: Cabang (Branch)

## Overview

Dokumen ini menjelaskan endpoint API yang tersedia untuk pengelolaan cabang di aplikasi Casir-Online.

## Base URL

```
https://api.casir-online.com/v1
```

## Endpoints

### Get All Cabang

Mengambil daftar semua cabang yang dapat diakses oleh pengguna.

- **URL**: `/cabang`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Semua pengguna terotentikasi (super_admin melihat semua cabang, pengguna lain hanya melihat cabang yang diakses)

**Query Parameters**:

```
page: integer (default: 1)
limit: integer (default: 10)
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
      "namaCabang": "string",
      "alamat": "string",
      "telepon": "string",
      "latitude": "decimal",
      "longitude": "decimal",
      "radiusGeofence": "integer",
      "status": "aktif",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ],
  "pagination": {
    "totalItems": "integer",
    "totalPages": "integer",
    "currentPage": "integer",
    "itemsPerPage": "integer",
    "hasNextPage": "boolean",
    "hasPrevPage": "boolean"
  }
}
```

**Response Error (401 - Unauthorized)**:

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### Get Cabang By ID

Mengambil informasi cabang berdasarkan ID.

- **URL**: `/cabang/:cabangId`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Pengguna harus memiliki akses ke cabang tersebut

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
    "namaCabang": "string",
    "alamat": "string",
    "telepon": "string",
    "latitude": "decimal",
    "longitude": "decimal",
    "radiusGeofence": "integer",
    "status": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Response Error (404 - Not Found)**:

```json
{
  "success": false,
  "message": "Branch not found"
}
```

### Get Cabang By User ID

Mengambil daftar cabang yang diakses oleh pengguna tertentu.

- **URL**: `/cabang/user/:userId`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)

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
      "namaCabang": "string",
      "alamat": "string",
      "telepon": "string",
      "latitude": "decimal",
      "longitude": "decimal",
      "radiusGeofence": "integer",
      "status": "string",
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

### Create New Cabang

Membuat cabang baru.

- **URL**: `/cabang`
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
  "namaCabang": "string",
  "alamat": "string",
  "telepon": "string",
  "latitude": "number",
  "longitude": "number",
  "radiusGeofence": "number",
  "status": "aktif"
}
```

**Response Success (201)**:

```json
{
  "success": true,
  "message": "Branch created successfully",
  "data": {
    "id": "string",
    "namaCabang": "string",
    "alamat": "string",
    "telepon": "string",
    "latitude": "decimal",
    "longitude": "decimal",
    "radiusGeofence": "integer",
    "status": "string",
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

### Update Cabang

Memperbarui informasi cabang yang ada.

- **URL**: `/cabang/:cabangId`
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
  "namaCabang": "string",
  "alamat": "string",
  "telepon": "string",
  "latitude": "number",
  "longitude": "number",
  "radiusGeofence": "number",
  "status": "string"
}
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "Branch updated successfully",
  "data": {
    "id": "string",
    "namaCabang": "string",
    "alamat": "string",
    "telepon": "string",
    "latitude": "decimal",
    "longitude": "decimal",
    "radiusGeofence": "integer",
    "status": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Response Error (404 - Not Found)**:

```json
{
  "success": false,
  "message": "Branch not found"
}
```

**Response Error (403 - Forbidden)**:

```json
{
  "success": false,
  "message": "Access denied"
}
```

### Delete Cabang

Menghapus cabang (soft delete).

- **URL**: `/cabang/:cabangId`
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
  "message": "Branch deleted successfully"
}
```

**Response Error (404 - Not Found)**:

```json
{
  "success": false,
  "message": "Branch not found"
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

## Struktur Data Cabang

| Field          | Type     | Description                       |
| -------------- | -------- | --------------------------------- |
| id             | string   | ID unik cabang                    |
| namaCabang     | string   | Nama cabang                       |
| alamat         | string   | Alamat fisik cabang               |
| telepon        | string   | Nomor telepon cabang              |
| latitude       | decimal  | Koordinat latitude lokasi cabang  |
| longitude      | decimal  | Koordinat longitude lokasi cabang |
| radiusGeofence | integer  | Radius geofence dalam meter       |
| status         | string   | Status cabang (aktif/nonaktif)    |
| createdAt      | datetime | Waktu pembuatan                   |
| updatedAt      | datetime | Waktu terakhir diperbarui         |
