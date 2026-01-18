# API Documentation: Authentication

## Overview

Dokumen ini menjelaskan endpoint API yang tersedia untuk proses autentikasi di aplikasi Casir-Online.

## Base URL

```
https://api.casir-online.com/v1
```

## Endpoints

### Register

Mendaftarkan pengguna baru ke dalam sistem.

- **URL**: `/auth/register`
- **Method**: `POST`
- **Auth Required**: No

**Request Body**:

```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "passwordConfirmation": "string"
}
```

**Response Success (200)**:

```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "createdAt": "timestamp"
  }
}
```

**Response Error (400 - Bad Request)**:

```json
{
  "status": "error",
  "message": "Validation error",
  "errors": {
    "email": ["Email already exists", "Invalid email format"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

### Login

Mengautentikasi pengguna dan mengembalikan token akses.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No

**Request Body**:

```json
{
  "username": "string",
  "password": "string"
}
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "namaLengkap": "string",
      "email": "string",
      "telepon": "string",
      "avatarUrl": "string",
      "status": "aktif",
      "roles": [
        {
          "roleId": "string",
          "namaRole": "string",
          "cabangId": "string",
          "namaCabang": "string"
        }
      ],
      "cabang": [
        {
          "cabangId": "string",
          "namaCabang": "string",
          "isPrimary": boolean
        }
      ]
    }
  }
}
```

**Response Error (401 - Unauthorized)**:

```json
{
  "success": false,
  "message": "Username or password is incorrect or inactive account"
}
```

### Logout

Menghapus token pengguna yang sedang login.

- **URL**: `/auth/logout`
- **Method**: `POST`
- **Auth Required**: Yes (Cookie)

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Response Error (500 - Internal Server Error)**:

```json
{
  "success": false,
  "message": "Logout failed"
}
```

### Get Profile

Mendapatkan informasi pengguna yang sedang login.

- **URL**: `/auth/profile`
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
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "namaLengkap": "string",
      "email": "string",
      "avatarUrl": "string",
      "status": "string",
      "telepon": "string",
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "roles": [
        {
          "roleId": "string",
          "namaRole": "string",
          "cabangId": "string",
          "namaCabang": "string"
        }
      ],
      "cabang": [
        {
          "cabangId": "string",
          "namaCabang": "string",
          "isPrimary": boolean
        }
      ]
    }
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

### Refresh Token

Memperbaharui token akses.

- **URL**: `/auth/refresh`
- **Method**: `POST`
- **Auth Required**: Yes (Bearer Token)

**Headers**:

```
Authorization: Bearer {token}
```

**Response Success (200)**:

```json
{
  "status": "success",
  "data": {
    "token": "string"
  }
}
```

**Response Error (401 - Unauthorized)**:

```json
{
  "status": "error",
  "message": "Invalid or expired token"
}
```

### Forgot Password

Mengirim email untuk reset password.

- **URL**: `/auth/forgot-password`
- **Method**: `POST`
- **Auth Required**: No

**Request Body**:

```json
{
  "email": "string"
}
```

**Response Success (200)**:

```json
{
  "status": "success",
  "message": "Password reset email sent"
}
```

**Response Error (404 - Not Found)**:

```json
{
  "status": "error",
  "message": "Email not found"
}
```

### Reset Password

Mengubah password dengan token reset.

- **URL**: `/auth/reset-password`
- **Method**: `POST`
- **Auth Required**: No

**Request Body**:

```json
{
  "token": "string",
  "password": "string",
  "passwordConfirmation": "string"
}
```

**Response Success (200)**:

```json
{
  "status": "success",
  "message": "Password has been reset successfully"
}
```

**Response Error (400 - Bad Request)**:

```json
{
  "status": "error",
  "message": "Invalid or expired token"
}
```

## Error Codes

| Status Code | Description           |
| ----------- | --------------------- |
| 200         | OK                    |
| 400         | Bad Request           |
| 401         | Unauthorized          |
| 403         | Forbidden             |
| 404         | Not Found             |
| 422         | Validation Error      |
| 500         | Internal Server Error |

## Authentication Flow

1. **Login**: Pengguna login dengan `POST /auth/login` dan menerima token melalui cookie
2. **API Calls**: Token otomatis disertakan dalam cookie untuk mengakses endpoint terproteksi
3. **Logout**: Hapus token dengan `POST /auth/logout`

## Keamanan

- Cookie HTTP-Only digunakan untuk penyimpanan token
- Sesi user disimpan di database dan Redis
- HTTPS digunakan untuk semua komunikasi API
- Password di-hash menggunakan bcrypt sebelum disimpan
- Sesi kedaluwarsa setelah 1 hari
