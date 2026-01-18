# API Documentation: Dashboard

## Overview

Dokumen ini menjelaskan endpoint API yang tersedia untuk mendapatkan data dashboard di aplikasi Casir-Online.

## Base URL

```
https://api.casir-online.com/v1
```

## Endpoints

### Get Dashboard Data

Mengambil data dashboard berdasarkan pengguna dan cabang yang dipilih.

- **URL**: `/dashboard`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)
- **Permissions**: Pengguna terotentikasi dengan akses ke cabang tertentu

**Query Parameters**:

```
cabangId: string (optional) - ID cabang yang dipilih. Jika tidak disediakan, akan menggunakan cabang utama pengguna.
```

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Dashboard Data",
  "data": {
    "salesSummary": {
      "daily": {
        "_sum": {
          "total": "number",
          "diskon": "number"
        },
        "_count": {
          "transaksi_id": "number"
        },
        "percentageChange": "number"
      },
      "weekly": {
        "_sum": {
          "total": "number",
          "diskon": "number"
        },
        "_count": {
          "transaksi_id": "number"
        },
        "percentageChange": "number"
      },
      "monthly": {
        "_sum": {
          "total": "number",
          "diskon": "number"
        },
        "_count": {
          "transaksi_id": "number"
        },
        "percentageChange": "number"
      },
      "yearly": {
        "_sum": {
          "total": "number",
          "diskon": "number"
        },
        "_count": {
          "transaksi_id": "number"
        },
        "percentageChange": "number"
      }
    },
    "transactionCounts": {
      "total": "number",
      "today": "number",
      "hourlyRate": "number",
      "hourlyBreakdown": [
        {
          "hour": "number",
          "count": "number"
        }
      ]
    },
    "averageTransactionValue": {
      "average": "number",
      "previousAverage": "number",
      "percentageChange": "number",
      "trend": "string"
    },
    "criticalAlerts": {
      "lowStockProducts": {
        "count": "number",
        "details": [
          {
            "id": "string",
            "stok": "number",
            "minStok": "number",
            "severity": "string",
            "cabang": {
              "namaCabang": "string"
            },
            "produkMaster": {
              "namaProduk": "string"
            }
          }
        ]
      },
      "pendingApprovals": "number",
      "expiringStock": {
        "count": "number",
        "details": [
          {
            "produk": {
              "id": "string",
              "produkMaster": {
                "namaProduk": "string"
              }
            },
            "expiredDate": "timestamp",
            "batchNumber": "string",
            "quantity": "number"
          }
        ]
      },
      "unreadNotifications": "number"
    },
    "branchPerformance": {
      "topBranches": [
        {
          "id": "string",
          "name": "string",
          "status": "string",
          "revenue": "number"
        }
      ],
      "branchStatusMap": {
        "branchId": "string"
      }
    },
    "productPerformance": [
      {
        "id": "string",
        "name": "string",
        "sku": "string",
        "category": "string",
        "quantitySold": "number",
        "revenue": "number"
      }
    ],
    "categoryDistribution": [
      {
        "category": "string",
        "value": "number",
        "percentage": "number"
      }
    ],
    "stockHealth": {
      "total": "number",
      "healthy": {
        "count": "number",
        "percentage": "number"
      },
      "lowStock": {
        "count": "number",
        "percentage": "number"
      },
      "outOfStock": {
        "count": "number",
        "percentage": "number"
      },
      "overstock": {
        "count": "number",
        "percentage": "number"
      }
    },
    "staffActivity": {
      "activeUsers": {
        "total": "number",
        "byBranch": [
          {
            "id": "string",
            "name": "string",
            "users": [
              {
                "id": "string",
                "name": "string",
                "lastActivity": "timestamp"
              }
            ]
          }
        ]
      },
      "openShifts": {
        "count": "number",
        "details": [
          {
            "id": "string",
            "waktuMulai": "timestamp",
            "user": {
              "namaLengkap": "string"
            },
            "cabang": {
              "namaCabang": "string"
            }
          }
        ]
      },
      "recentActivity": [
        {
          "id": "string",
          "action": "string",
          "tableName": "string",
          "timestamp": "timestamp",
          "user": "string"
        }
      ]
    },
    "paymentMethods": {
      "summary": {
        "totalVolume": "number",
        "methodCount": "number",
        "mostPopular": "string"
      },
      "globalMethods": [
        {
          "method": "string",
          "provider": "string",
          "count": "number",
          "amount": "number",
          "percentageChange": "number",
          "trend": "string",
          "percentage": "string"
        }
      ],
      "branchBreakdown": [
        {
          "id": "string",
          "name": "string",
          "methods": [
            {
              "method": "string",
              "provider": "string",
              "count": "number",
              "amount": "number",
              "percentage": "string"
            }
          ]
        }
      ]
    },
    "revenueTimeSeries": [
      {
        "date": "date",
        "branchId": "string",
        "branchName": "string",
        "revenue": "number"
      }
    ],
    "userContext": {
      "isSuperAdmin": "boolean",
      "accessibleBranches": [
        {
          "id": "string",
          "name": "string"
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

### Get Active Shift

Mendapatkan informasi shift aktif untuk pengguna di cabang tertentu.

- **URL**: `/dashboard/active-shift/:cabangId`
- **Method**: `GET`
- **Auth Required**: Yes (Cookie)

**Headers**:

```
Cookie: auth_token=<token>; session_id=<session_id>
```

**Response Success (200)**:

```json
{
  "status": true,
  "message": "Active Shift",
  "data": {
    "id": "string",
    "userId": "string",
    "cabangId": "string",
    "waktuMulai": "timestamp",
    "waktuSelesai": null,
    "kasAwal": "number",
    "kasAkhir": null,
    "totalTransaksi": "number",
    "totalPendapatan": "number",
    "keterangan": "string",
    "status": "dibuka",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Response Error (404 - Not Found)**:

```json
{
  "status": false,
  "message": "No active shift found"
}
```

## Error Codes

| Status Code | Description           |
| ----------- | --------------------- |
| 200         | OK                    |
| 401         | Unauthorized          |
| 403         | Forbidden             |
| 404         | Not Found             |
| 500         | Internal Server Error |

## Jenis Data Dashboard

### Sales Summary (Ringkasan Penjualan)

Menyediakan data ringkasan penjualan untuk berbagai periode (harian, mingguan, bulanan, tahunan) dengan persentase perubahan.

### Transaction Counts (Jumlah Transaksi)

Menyediakan jumlah total transaksi, transaksi hari ini, dan rincian per jam.

### Average Transaction Value (Nilai Transaksi Rata-rata)

Menyediakan nilai rata-rata transaksi hari ini, dibandingkan dengan periode sebelumnya.

### Critical Alerts (Peringatan Penting)

Menyediakan informasi tentang produk dengan stok rendah, persetujuan tertunda, stok yang akan kedaluwarsa, dan notifikasi yang belum dibaca.

### Branch Performance (Kinerja Cabang)

Menyediakan data kinerja cabang dan statusnya.

### Product Performance (Kinerja Produk)

Menyediakan data tentang produk terlaris berdasarkan pendapatan.

### Category Distribution (Distribusi Kategori)

Menyediakan distribusi penjualan berdasarkan kategori produk.

### Stock Health (Kesehatan Stok)

Menyediakan ringkasan kesehatan stok meliputi stok sehat, stok rendah, stok habis, dan kelebihan stok.

### Staff Activity (Aktivitas Staf)

Menyediakan informasi tentang pengguna aktif, shift yang dibuka, dan aktivitas terbaru.

### Payment Methods (Metode Pembayaran)

Menyediakan analisis metode pembayaran yang digunakan.

### Revenue Time Series (Deret Waktu Pendapatan)

Menyediakan data deret waktu pendapatan untuk analisis tren.
