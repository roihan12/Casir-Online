# API Documentation: User

## Overview

Dokumen ini menjelaskan endpoint API yang tersedia untuk pengelolaan pengguna (user) di aplikasi Casir-Online. Pengelolaan pengguna mencakup operasi CRUD (Create, Read, Update, Delete), manajemen status, reset password, manajemen avatar, dan pencatatan aktivitas pengguna.

## Base URL

```
https://api.casir-online.com/v1
```

## Endpoints

### Get All Users

Mendapatkan daftar pengguna dengan dukungan paginasi dan filtering.

- **URL**: `/users`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: super_admin, admin_cabang

**Query Parameters**:

```
search: string - Pencarian berdasarkan username, nama lengkap, atau email
roleId: string - Filter berdasarkan ID role
cabangId: string - Filter berdasarkan ID cabang
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
      "username": "string",
      "namaLengkap": "string",
      "email": "string",
      "telepon": "string",
      "avatarUrl": "string",
      "status": "string",
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "userRoles": [
        {
          "roleId": "string",
          "roleName": "string",
          "cabangId": "string",
          "cabangName": "string"
        }
      ],
      "userCabang": [
        {
          "cabangId": "string",
          "cabangName": "string",
          "isPrimary": "boolean"
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

### Get User By ID

Mendapatkan detail pengguna berdasarkan ID.

- **URL**: `/users/:id`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: super_admin, admin_cabang

**URL Parameters**:

```
id: string - ID pengguna
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
    "username": "string",
    "namaLengkap": "string",
    "email": "string",
    "telepon": "string",
    "avatarUrl": "string",
    "status": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "userRoles": [
      {
        "roleId": "string",
        "roleName": "string",
        "cabangId": "string",
        "cabangName": "string"
      }
    ],
    "userCabang": [
      {
        "cabangId": "string",
        "cabangName": "string",
        "isPrimary": "boolean"
      }
    ],
    "lastLogin": "timestamp",
    "activitySummary": {
      "totalLogins": "number",
      "lastActivity": "timestamp"
    }
  }
}
```

**Response Error (404)**:

```json
{
  "success": false,
  "message": "User not found"
}
```

### Create User

Membuat pengguna baru.

- **URL**: `/users`
- **Method**: `POST`
- **Auth Required**: Yes (Cookie)
- **Permissions**: super_admin
- **Content-Type**: `multipart/form-data` (jika mengunggah avatar) atau `application/json`

**Request Body**:

```json
{
  "username": "string",
  "password": "string",
  "namaLengkap": "string",
  "email": "string",
  "telepon": "string", // Opsional
  "status": "aktif", // Opsional, default: aktif
  "userRoles": [
    {
      "roleId": "string",
      "cabangId": "string"
    }
  ],
  "userCabang": [
    {
      "cabangId": "string",
      "isPrimary": true // Opsional, default: false
    }
  ],
  "avatar": "file" // Opsional, hanya jika menggunakan multipart/form-data
}
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
Content-Type: multipart/form-data atau application/json
```

**Response Success (201)**:

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "string",
    "username": "string",
    "namaLengkap": "string",
    "email": "string",
    "telepon": "string",
    "avatarUrl": "string",
    "status": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "userRoles": [
      {
        "roleId": "string",
        "roleName": "string",
        "cabangId": "string",
        "cabangName": "string"
      }
    ],
    "userCabang": [
      {
        "cabangId": "string",
        "cabangName": "string",
        "isPrimary": "boolean"
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
  "errors": "username is required, password must be at least 6 characters"
}
```

### Update User

Memperbarui data pengguna.

- **URL**: `/users/:id`
- **Method**: `PUT`
- **Auth Required**: Yes (Cookie)
- **Permissions**: super_admin
- **Content-Type**: `multipart/form-data` (jika mengunggah avatar) atau `application/json`

**URL Parameters**:

```
id: string - ID pengguna
```

**Request Body**:

```json
{
  "username": "string", // Opsional
  "password": "string", // Opsional
  "namaLengkap": "string", // Opsional
  "email": "string", // Opsional
  "telepon": "string", // Opsional
  "status": "string", // Opsional
  "userRoles": [ // Opsional
    {
      "roleId": "string",
      "cabangId": "string"
    }
  ],
  "userCabang": [ // Opsional
    {
      "cabangId": "string",
      "isPrimary": true
    }
  ],
  "avatar": "file" // Opsional, hanya jika menggunakan multipart/form-data
}
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
Content-Type: multipart/form-data atau application/json
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "string",
    "username": "string",
    "namaLengkap": "string",
    "email": "string",
    "telepon": "string",
    "avatarUrl": "string",
    "status": "string",
    "updatedAt": "timestamp"
  }
}
```

**Response Error (404)**:

```json
{
  "success": false,
  "message": "User not found"
}
```

### Delete User

Menghapus pengguna.

- **URL**: `/users/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (Cookie)
- **Permissions**: super_admin

**URL Parameters**:

```
id: string - ID pengguna
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Response Error (404)**:

```json
{
  "success": false,
  "message": "User not found"
}
```

### Change User Status

Mengubah status pengguna (aktif/nonaktif).

- **URL**: `/users/:id/status`
- **Method**: `PUT`
- **Auth Required**: Yes (Cookie)
- **Permissions**: super_admin

**URL Parameters**:

```
id: string - ID pengguna
```

**Request Body**:

```json
{
  "status": "aktif", // aktif, nonaktif
  "alasan": "string" // Opsional
}
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "User activated successfully",
  "data": {
    "id": "string",
    "username": "string",
    "status": "string",
    "updatedAt": "timestamp"
  }
}
```

**Response Error (400)**:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": "Status must be either 'aktif' or 'nonaktif'"
}
```

### Reset User Password

Mengatur ulang password pengguna.

- **URL**: `/users/:id/reset-password`
- **Method**: `POST`
- **Auth Required**: Yes (Cookie)
- **Permissions**: super_admin

**URL Parameters**:

```
id: string - ID pengguna
```

**Request Body**:

```json
{
  "newPassword": "string",
  "forceLogout": true // Opsional, default: true
}
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "User password reset successfully"
}
```

**Response Error (404)**:

```json
{
  "success": false,
  "message": "User not found"
}
```

### Force User Logout

Memaksa pengguna untuk keluar dari semua sesi.

- **URL**: `/users/:id/force-logout`
- **Method**: `POST`
- **Auth Required**: Yes (Cookie)
- **Permissions**: super_admin

**URL Parameters**:

```
id: string - ID pengguna
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "User logged out successfully",
  "data": {
    "sessionsTerminated": "number"
  }
}
```

**Response Error (404)**:

```json
{
  "success": false,
  "message": "User not found"
}
```

### Upload User Avatar

Mengunggah avatar pengguna.

- **URL**: `/users/:id/avatar`
- **Method**: `POST`
- **Auth Required**: Yes (Cookie)
- **Permissions**: super_admin, admin_cabang
- **Content-Type**: `multipart/form-data`

**URL Parameters**:

```
id: string - ID pengguna
```

**Request Body**:

```
avatar: file - File gambar avatar (jpg, png, gif)
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
  "message": "User avatar uploaded successfully",
  "data": {
    "avatarUrl": "string"
  }
}
```

**Response Error (400)**:

```json
{
  "success": false,
  "message": "No avatar file uploaded"
}
```

### Delete User Avatar

Menghapus avatar pengguna.

- **URL**: `/users/:id/avatar`
- **Method**: `DELETE`
- **Auth Required**: Yes (Cookie)
- **Permissions**: super_admin, admin_cabang

**URL Parameters**:

```
id: string - ID pengguna
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "User avatar deleted successfully"
}
```

**Response Error (404)**:

```json
{
  "success": false,
  "message": "User not found"
}
```

### Get User Activity Logs

Mendapatkan log aktivitas pengguna.

- **URL**: `/users/activity-logs`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: super_admin

**Query Parameters**:

```
userId: string - Filter berdasarkan ID pengguna
startDate: date - Filter aktivitas dari tanggal tertentu
endDate: date - Filter aktivitas sampai tanggal tertentu
action: string - Filter berdasarkan jenis aksi (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
tableName: string - Filter berdasarkan nama tabel
ipAddress: string - Filter berdasarkan alamat IP
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
      "userId": "string",
      "username": "string",
      "action": "string",
      "tableName": "string",
      "recordId": "string",
      "oldValues": "object",
      "newValues": "object",
      "ipAddress": "string",
      "userAgent": "string",
      "createdAt": "timestamp"
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

### Invalidate Cache

Membersihkan cache pengguna.

- **URL**: `/users/invalidate-cache/:id?`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Semua pengguna terautentikasi

**URL Parameters**:

```
id: string - ID pengguna (opsional, jika tidak disediakan akan membersihkan semua cache pengguna)
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "Cache invalidated successfully"
}
```

## Struktur Data User

| Field       | Type     | Description                                 |
| ----------- | -------- | ------------------------------------------- |
| id          | string   | ID unik pengguna                            |
| username    | string   | Nama pengguna untuk login                   |
| password    | string   | Password terenkripsi (tidak ditampilkan)    |
| namaLengkap | string   | Nama lengkap pengguna                       |
| email       | string   | Alamat email pengguna                       |
| telepon     | string   | Nomor telepon pengguna (opsional)           |
| avatarUrl   | string   | URL avatar pengguna (opsional)              |
| status      | string   | Status pengguna (aktif, nonaktif)           |
| createdAt   | datetime | Waktu pembuatan                             |
| updatedAt   | datetime | Waktu terakhir diperbarui                   |

### Struktur Data User Roles

| Field     | Type   | Description                                 |
| --------- | ------ | ------------------------------------------- |
| userId    | string | ID pengguna                                 |
| roleId    | string | ID role                                     |
| cabangId  | string | ID cabang tempat role berlaku               |
| createdAt | datetime | Waktu pembuatan                           |
| updatedAt | datetime | Waktu terakhir diperbarui                 |

### Struktur Data User Cabang

| Field     | Type    | Description                                 |
| --------- | ------- | ------------------------------------------- |
| userId    | string  | ID pengguna                                 |
| cabangId  | string  | ID cabang                                   |
| isPrimary | boolean | Apakah cabang utama pengguna                |
| createdAt | datetime | Waktu pembuatan                            |
| updatedAt | datetime | Waktu terakhir diperbarui                  |

### Struktur Data User Activity Log

| Field      | Type     | Description                                 |
| ---------- | -------- | ------------------------------------------- |
| id         | string   | ID unik log aktivitas                       |
| userId     | string   | ID pengguna yang melakukan aktivitas        |
| action     | string   | Jenis aksi (CREATE, UPDATE, DELETE, dll)    |
| tableName  | string   | Nama tabel yang dimodifikasi                |
| recordId   | string   | ID record yang dimodifikasi                 |
| oldValues  | json     | Nilai lama sebelum modifikasi               |
| newValues  | json     | Nilai baru setelah modifikasi               |
| ipAddress  | string   | Alamat IP pengguna                          |
| userAgent  | string   | User agent browser pengguna                 |
| createdAt  | datetime | Waktu aktivitas                             |