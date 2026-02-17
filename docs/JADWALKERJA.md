# API Test Documentation — Regu & Jadwal Sistem Shift Bergilir

## Daftar Isi
1. [Prerequisites](#prerequisites)
2. [Regu CRUD](#regu-crud)
3. [Regu Member](#regu-member)
4. [Jadwal Single](#jadwal-single)
5. [Jadwal Bulk Generate](#jadwal-bulk-generate)
6. [Jadwal Generate Regu Rolling](#jadwal-generate-regu-rolling)
7. [Jadwal Read, Update, Delete](#jadwal-read-update-delete)
8. [Error Scenarios](#error-scenarios)
9. [Testing Checklist](#testing-checklist)

---

## Prerequisites

Pastikan data berikut sudah ada sebelum mulai test:

```bash
# 1. Jalankan seed master shift
node scripts/seedMasterShift.js

# 2. Cek data yang tersedia
curl -b cookies.txt "http://localhost:3000/api/cabang"
curl -b cookies.txt "http://localhost:3000/api/users"
curl -b cookies.txt "http://localhost:3000/api/master-shifts"
```

**Contoh variabel yang akan dipakai di seluruh dokumen ini:**

| Variabel | Contoh nilai |
|---|---|
| `CABANG_ID` | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| `USER_ID_1` | `u1000001-0000-0000-0000-000000000001` |
| `USER_ID_2` | `u1000001-0000-0000-0000-000000000002` |
| `USER_ID_3` | `u1000001-0000-0000-0000-000000000003` |
| `USER_ID_4` | `u1000001-0000-0000-0000-000000000004` |
| `USER_ID_5` | `u1000001-0000-0000-0000-000000000005` |
| `SHIFT_PAGI_ID` | `s0000001-0000-0000-0000-000000000001` |
| `SHIFT_SIANG_ID` | `s0000001-0000-0000-0000-000000000002` |
| `SHIFT_MALAM_ID` | `s0000001-0000-0000-0000-000000000003` |
| `SHIFT_PAGI_PANJANG_ID` | `s0000001-0000-0000-0000-000000000004` |
| `SHIFT_MALAM_PANJANG_ID` | `s0000001-0000-0000-0000-000000000005` |

---

## Regu CRUD

### Skenario 1 — Buat Regu Baru

**Request:**
```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/regu" \
  -H "Content-Type: application/json" \
  -d '{
    "namaRegu": "Regu A",
    "cabangId": "{{CABANG_ID}}",
    "keterangan": "Regu shift pagi-siang-malam, pola 2K-2L"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Regu berhasil dibuat",
  "data": {
    "id": "regu-a-uuid",
    "namaRegu": "Regu A",
    "cabangId": "{{CABANG_ID}}",
    "keterangan": "Regu shift pagi-siang-malam, pola 2K-2L",
    "cabang": {
      "id": "{{CABANG_ID}}",
      "namaCabang": "Cabang Jakarta Pusat"
    },
    "_count": { "members": 0 },
    "createdAt": "2025-02-01T00:00:00.000Z"
  }
}
```

> **Simpan `data.id` → `REGU_A_ID`**

---

### Skenario 2 — Buat Regu Kedua

```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/regu" \
  -H "Content-Type: application/json" \
  -d '{
    "namaRegu": "Regu B",
    "cabangId": "{{CABANG_ID}}",
    "keterangan": "Regu shift pagi-siang-malam, offset 2 hari dari Regu A"
  }'
```

> **Simpan `data.id` → `REGU_B_ID`**

---

### Skenario 3 — Buat Regu dengan Pola 12 Jam

```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/regu" \
  -H "Content-Type: application/json" \
  -d '{
    "namaRegu": "Regu C (12 Jam)",
    "cabangId": "{{CABANG_ID}}",
    "keterangan": "Regu shift panjang 12 jam, pola 2K-2L, hanya 2 rotasi shift"
  }'
```

> **Simpan `data.id` → `REGU_C_ID`**

---

### Skenario 4 — List Semua Regu

```bash
# Semua regu
curl -b cookies.txt "http://localhost:3000/api/regu"

# Filter per cabang
curl -b cookies.txt "http://localhost:3000/api/regu?cabangId={{CABANG_ID}}"

# Search nama
curl -b cookies.txt "http://localhost:3000/api/regu?search=Regu A"

# Pagination
curl -b cookies.txt "http://localhost:3000/api/regu?page=1&limit=10"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Data regu berhasil diambil",
  "data": [
    {
      "id": "regu-a-uuid",
      "namaRegu": "Regu A",
      "_count": { "members": 0 }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

---

### Skenario 5 — Detail Regu

```bash
curl -b cookies.txt "http://localhost:3000/api/regu/{{REGU_A_ID}}"
```

---

### Skenario 6 — Update Regu

```bash
curl -b cookies.txt -X PUT "http://localhost:3000/api/regu/{{REGU_A_ID}}" \
  -H "Content-Type: application/json" \
  -d '{
    "keterangan": "Updated: Regu A pola 2K-2L dengan 3 rotasi shift"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Regu berhasil diupdate",
  "data": {
    "id": "regu-a-uuid",
    "namaRegu": "Regu A",
    "keterangan": "Updated: Regu A pola 2K-2L dengan 3 rotasi shift"
  }
}
```

---

### Skenario 7 — Delete Regu (harus gagal jika ada member)

```bash
# Akan gagal jika regu masih punya anggota
curl -b cookies.txt -X DELETE "http://localhost:3000/api/regu/{{REGU_A_ID}}"
```

**Expected Error (400) jika ada member:**
```json
{
  "error": "Regu masih memiliki 3 anggota. Hapus anggota terlebih dahulu."
}
```

**Expected Response (200) jika kosong:**
```json
{
  "success": true,
  "message": "Regu berhasil dihapus"
}
```

---

## Regu Member

### Skenario 8 — Tambah Anggota ke Regu A

```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/regu/{{REGU_A_ID}}/members" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [
      "{{USER_ID_1}}",
      "{{USER_ID_2}}",
      "{{USER_ID_3}}"
    ]
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "3 anggota berhasil ditambahkan ke regu Regu A",
  "data": {
    "reguId": "regu-a-uuid",
    "namaRegu": "Regu A",
    "addedCount": 3,
    "members": [
      {
        "userId": "{{USER_ID_1}}",
        "user": { "id": "...", "namaLengkap": "Budi Santoso", "email": "budi@example.com" },
        "joinedAt": "2025-02-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### Skenario 9 — Tambah Anggota ke Regu B dan C

```bash
# Regu B — user 4 dan 5
curl -b cookies.txt -X POST "http://localhost:3000/api/regu/{{REGU_B_ID}}/members" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["{{USER_ID_4}}", "{{USER_ID_5}}"]
  }'

# Regu C — user baru (misal USER_ID_6 dan USER_ID_7)
curl -b cookies.txt -X POST "http://localhost:3000/api/regu/{{REGU_C_ID}}/members" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["{{USER_ID_6}}", "{{USER_ID_7}}"]
  }'
```

---

### Skenario 10 — Tambah User yang Sudah di Regu Lain (harus gagal)

> User 1 sudah ada di Regu A. Mencoba tambah ke Regu B harus ditolak.

```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/regu/{{REGU_B_ID}}/members" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["{{USER_ID_1}}"]
  }'
```

**Expected Error (409):**
```json
{
  "error": "User berikut sudah terdaftar di regu lain dalam cabang yang sama: Budi Santoso (sudah di Regu A)"
}
```

---

### Skenario 11 — List Anggota Regu

```bash
# List dengan pagination
curl -b cookies.txt "http://localhost:3000/api/regu/{{REGU_A_ID}}/members?page=1&limit=10"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Daftar anggota regu berhasil diambil",
  "reguId": "regu-a-uuid",
  "namaRegu": "Regu A",
  "data": [
    {
      "userId": "{{USER_ID_1}}",
      "user": { "namaLengkap": "Budi Santoso", "email": "budi@example.com" },
      "joinedAt": "2025-02-01T00:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 3, "totalPages": 1 }
}
```

---

### Skenario 12 — Pindah Anggota Antar Regu

> User 3 dipindah dari Regu A ke Regu B

```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/regu/members/move" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["{{USER_ID_3}}"],
    "fromReguId": "{{REGU_A_ID}}",
    "toReguId": "{{REGU_B_ID}}"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "1 anggota berhasil dipindah ke Regu B",
  "movedCount": 1
}
```

---

### Skenario 13 — Hapus Anggota dari Regu

```bash
curl -b cookies.txt -X DELETE "http://localhost:3000/api/regu/{{REGU_A_ID}}/members" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["{{USER_ID_2}}"]
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "1 anggota berhasil dihapus dari regu",
  "removedCount": 1
}
```

---

## Jadwal Single

### Skenario 14 — Buat Jadwal Shift 1 Hari

```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "{{USER_ID_1}}",
    "cabangId": "{{CABANG_ID}}",
    "tanggal": "2025-02-17",
    "tipeJadwal": "shift",
    "shiftId": "{{SHIFT_PAGI_ID}}"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Jadwal berhasil dibuat",
  "data": {
    "id": "jadwal-uuid",
    "tanggalMulai": "2025-02-17T00:00:00.000Z",
    "jamMasuk": "06:00",
    "jamKeluar": "14:00",
    "tipe_jadwal": "shift",
    "master_shift_id": "{{SHIFT_PAGI_ID}}"
  }
}
```

---

### Skenario 15 — Buat Jadwal Reguler (custom jam)

```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "{{USER_ID_2}}",
    "cabangId": "{{CABANG_ID}}",
    "tanggal": "2025-02-17",
    "tipeJadwal": "reguler",
    "jamMasukOverride": "08:30",
    "jamKeluarOverride": "17:30",
    "keterangan": "Jam fleksibel"
  }'
```

---

### Skenario 16 — Buat Jadwal Libur & WFH

```bash
# Libur
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "{{USER_ID_1}}",
    "cabangId": "{{CABANG_ID}}",
    "tanggal": "2025-02-18",
    "tipeJadwal": "libur",
    "keterangan": "Hari libur nasional"
  }'

# WFH
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "{{USER_ID_1}}",
    "cabangId": "{{CABANG_ID}}",
    "tanggal": "2025-02-19",
    "tipeJadwal": "wfh",
    "keterangan": "Work from home"
  }'
```

---

## Jadwal Bulk Generate

### Skenario 17 — Generate Bulk Sederhana (satu shift, semua hari kerja)

```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["{{USER_ID_1}}", "{{USER_ID_2}}", "{{USER_ID_3}}"],
    "cabangId": "{{CABANG_ID}}",
    "shiftId": "{{SHIFT_PAGI_ID}}",
    "tanggalMulai": "2025-03-01",
    "tanggalSelesai": "2025-03-31",
    "hariKerja": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    "tipeJadwal": "shift",
    "skipExisting": true
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Schedules generated successfully",
  "data": {
    "totalGenerated": 63,
    "skipped": 0,
    "usersProcessed": 3,
    "dateRange": {
      "start": "2025-03-01",
      "end": "2025-03-31"
    }
  }
}
```

> **Catatan:** Maret 2025 punya 21 hari kerja (Senin–Jumat) × 3 user = 63 jadwal

---

## Jadwal Generate Regu Rolling

### Skenario 18 — Generate Regu A & B (3 Shift, Pola 2K-2L)

```
Regu A: mulai kerja 1 Feb (offset 0)
        pola     : [1, 1, 0, 0]  → 2 kerja, 2 libur
        rotasi   : PAGI → SIANG → MALAM, ganti setiap 4 hari kerja

Regu B: mulai kerja 3 Feb (offset 2 hari → hari pertama jatuh di posisi pola ke-2 = LIBUR)
        pola     : [1, 1, 0, 0]  (sama)
        rotasi   : sama, mulai dari PAGI juga
```

```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal/generate-regu" \
  -H "Content-Type: application/json" \
  -d '{
    "cabangId": "{{CABANG_ID}}",
    "tanggalMulai": "2025-02-01",
    "tanggalSelesai": "2025-02-28",
    "skipExisting": true,
    "regu": [
      {
        "reguId": "{{REGU_A_ID}}",
        "tanggalMulaiKerjaRegu": "2025-02-01",
        "pola": [1, 1, 0, 0],
        "rotasiShift": [
          "{{SHIFT_PAGI_ID}}",
          "{{SHIFT_SIANG_ID}}",
          "{{SHIFT_MALAM_ID}}"
        ],
        "hariKerjaPerRotasi": 4,
        "startShiftId": "{{SHIFT_PAGI_ID}}"
      },
      {
        "reguId": "{{REGU_B_ID}}",
        "tanggalMulaiKerjaRegu": "2025-02-03",
        "pola": [1, 1, 0, 0],
        "rotasiShift": [
          "{{SHIFT_PAGI_ID}}",
          "{{SHIFT_SIANG_ID}}",
          "{{SHIFT_MALAM_ID}}"
        ],
        "hariKerjaPerRotasi": 4,
        "startShiftId": "{{SHIFT_PAGI_ID}}"
      }
    ]
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Jadwal regu berhasil dibuat",
  "data": {
    "totalGenerated": 168,
    "skipped": 0,
    "reguProcessed": 2,
    "dateRange": {
      "start": "2025-02-01",
      "end": "2025-02-28"
    },
    "summaryPerRegu": [
      {
        "reguId": "{{REGU_A_ID}}",
        "namaRegu": "Regu A",
        "jumlahAnggota": 3,
        "jadwalDibuat": 84,
        "jadwalDilewati": 0,
        "rotasiDetail": [
          { "mulaiTanggal": "2025-02-01", "namaShift": "Shift Pagi (06:00-14:00)" },
          { "mulaiTanggal": "2025-02-09", "namaShift": "Shift Siang (14:00-22:00)" },
          { "mulaiTanggal": "2025-02-17", "namaShift": "Shift Malam (22:00-06:00)" },
          { "mulaiTanggal": "2025-02-25", "namaShift": "Shift Pagi (06:00-14:00)" }
        ]
      },
      {
        "reguId": "{{REGU_B_ID}}",
        "namaRegu": "Regu B",
        "jumlahAnggota": 2,
        "jadwalDibuat": 84,
        "jadwalDilewati": 0,
        "rotasiDetail": [
          { "mulaiTanggal": "2025-02-03", "namaShift": "Shift Pagi (06:00-14:00)" },
          { "mulaiTanggal": "2025-02-11", "namaShift": "Shift Siang (14:00-22:00)" },
          { "mulaiTanggal": "2025-02-19", "namaShift": "Shift Malam (22:00-06:00)" },
          { "mulaiTanggal": "2025-02-27", "namaShift": "Shift Pagi (06:00-14:00)" }
        ]
      }
    ]
  }
}
```

---

### Skenario 19 — Generate Regu C (2 Shift 12 Jam, Pola 2K-2L)

```
Regu C: pola     : [1, 1, 0, 0]
        rotasi   : PAGI_PANJANG (06:00-18:00) → MALAM_PANJANG (18:00-06:00)
        ganti setiap 4 hari kerja
```

```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal/generate-regu" \
  -H "Content-Type: application/json" \
  -d '{
    "cabangId": "{{CABANG_ID}}",
    "tanggalMulai": "2025-02-01",
    "tanggalSelesai": "2025-02-28",
    "skipExisting": true,
    "regu": [
      {
        "reguId": "{{REGU_C_ID}}",
        "tanggalMulaiKerjaRegu": "2025-02-01",
        "pola": [1, 1, 0, 0],
        "rotasiShift": [
          "{{SHIFT_PAGI_PANJANG_ID}}",
          "{{SHIFT_MALAM_PANJANG_ID}}"
        ],
        "hariKerjaPerRotasi": 4,
        "startShiftId": "{{SHIFT_PAGI_PANJANG_ID}}"
      }
    ]
  }'
```

---

### Skenario 20 — Generate Regu dengan Pola Berbeda (2K-1L)

> Regu dengan shift 8 jam, kerja 2 hari libur 1 hari

```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal/generate-regu" \
  -H "Content-Type: application/json" \
  -d '{
    "cabangId": "{{CABANG_ID}}",
    "tanggalMulai": "2025-02-01",
    "tanggalSelesai": "2025-02-28",
    "skipExisting": true,
    "regu": [
      {
        "reguId": "{{REGU_D_ID}}",
        "tanggalMulaiKerjaRegu": "2025-02-01",
        "pola": [1, 1, 0],
        "rotasiShift": [
          "{{SHIFT_PAGI_ID}}",
          "{{SHIFT_SIANG_ID}}",
          "{{SHIFT_MALAM_ID}}"
        ],
        "hariKerjaPerRotasi": 4,
        "startShiftId": "{{SHIFT_PAGI_ID}}"
      }
    ]
  }'
```

---

### Skenario 21 — Generate dengan tanggalMulaiKerjaRegu Sebelum Periode

> Regu sudah mulai kerja sejak 15 Januari, tapi kita generate untuk Februari saja.
> Sistem harus hitung offset yang tepat agar rotasi shift tidak salah.

```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal/generate-regu" \
  -H "Content-Type: application/json" \
  -d '{
    "cabangId": "{{CABANG_ID}}",
    "tanggalMulai": "2025-02-01",
    "tanggalSelesai": "2025-02-28",
    "skipExisting": true,
    "regu": [
      {
        "reguId": "{{REGU_A_ID}}",
        "tanggalMulaiKerjaRegu": "2025-01-15",
        "pola": [1, 1, 0, 0],
        "rotasiShift": [
          "{{SHIFT_PAGI_ID}}",
          "{{SHIFT_SIANG_ID}}",
          "{{SHIFT_MALAM_ID}}"
        ],
        "hariKerjaPerRotasi": 4,
        "startShiftId": "{{SHIFT_PAGI_ID}}"
      }
    ]
  }'
```

> **Yang diverifikasi:** `rotasiDetail[0].namaShift` harus mencerminkan shift yang
> tepat sesuai posisi siklus di 1 Feb (bukan selalu mulai dari PAGI).

---

### Skenario 22 — Generate dengan skipExisting false (overwrite)

```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal/generate-regu" \
  -H "Content-Type: application/json" \
  -d '{
    "cabangId": "{{CABANG_ID}}",
    "tanggalMulai": "2025-02-01",
    "tanggalSelesai": "2025-02-28",
    "skipExisting": false,
    "regu": [ ... ]
  }'
```

> **Catatan:** Karena ada `skipDuplicates: true` di `createMany`, data lama tidak
> ter-overwrite. Jika ingin overwrite harus delete jadwal periode tersebut dulu.

---

## Jadwal Read, Update, Delete

### Skenario 23 — List Jadwal dengan Filter

```bash
# Filter per user bulan Februari
curl -b cookies.txt "http://localhost:3000/api/jadwal?userId={{USER_ID_1}}&tanggalMulai=2025-02-01&tanggalSelesai=2025-02-28"

# Filter per regu (via userId list — satu per satu)
curl -b cookies.txt "http://localhost:3000/api/jadwal?cabangId={{CABANG_ID}}&tipeJadwal=shift"

# Filter per shift
curl -b cookies.txt "http://localhost:3000/api/jadwal?shiftId={{SHIFT_PAGI_ID}}"

# Pagination
curl -b cookies.txt "http://localhost:3000/api/jadwal?page=1&limit=50"
```

---

### Skenario 24 — Detail Jadwal

```bash
curl -b cookies.txt "http://localhost:3000/api/jadwal/{{JADWAL_ID}}"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Detail jadwal berhasil diambil",
  "data": {
    "id": "jadwal-uuid",
    "tanggalMulai": "2025-02-01T00:00:00.000Z",
    "jamMasuk": "06:00",
    "jamKeluar": "14:00",
    "hariKerja": ["Sabtu"],
    "tipe_jadwal": "shift",
    "keterangan": null,
    "user": { "id": "...", "namaLengkap": "Budi Santoso", "email": "budi@example.com" },
    "cabang": { "id": "...", "namaCabang": "Cabang Jakarta Pusat" },
    "master_shift": {
      "id": "{{SHIFT_PAGI_ID}}",
      "namaShift": "Shift Pagi (06:00-14:00)",
      "toleransiTerlambat": 15,
      "isOvernight": false
    }
  }
}
```

---

### Skenario 25 — Update Jadwal: Ganti Shift

```bash
curl -b cookies.txt -X PUT "http://localhost:3000/api/jadwal/{{JADWAL_ID}}" \
  -H "Content-Type: application/json" \
  -d '{
    "tipeJadwal": "shift",
    "shiftId": "{{SHIFT_SIANG_ID}}"
  }'
```

---

### Skenario 26 — Update Jadwal: Ubah ke Reguler

```bash
curl -b cookies.txt -X PUT "http://localhost:3000/api/jadwal/{{JADWAL_ID}}" \
  -H "Content-Type: application/json" \
  -d '{
    "tipeJadwal": "reguler",
    "jamMasukOverride": "09:00",
    "jamKeluarOverride": "18:00",
    "keterangan": "Overtime — event hari ini"
  }'
```

---

### Skenario 27 — Delete Jadwal

```bash
curl -b cookies.txt -X DELETE "http://localhost:3000/api/jadwal/{{JADWAL_ID}}"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Schedule deleted successfully"
}
```

---

## Error Scenarios

### Validasi Joi

| Skenario | Request | Expected Error |
|---|---|---|
| namaRegu kosong | `{"namaRegu": ""}` | `namaRegu tidak boleh kosong` |
| cabangId bukan UUID | `{"cabangId": "bukan-uuid"}` | `cabangId harus berformat UUID v4` |
| pola semua 1 (tidak ada libur) | `"pola": [1,1,1]` | `pola harus mengandung minimal 1 hari libur` |
| pola semua 0 (tidak ada kerja) | `"pola": [0,0,0]` | `pola harus mengandung minimal 1 hari kerja` |
| pola berisi nilai selain 0/1 | `"pola": [1,2,0]` | `pola hanya boleh berisi 0 atau 1` |
| startShiftId tidak ada di rotasiShift | validasi cross-field | `startShiftId harus ada di dalam array rotasiShift` |
| tanggalMulai > tanggalSelesai | date range terbalik | `tanggalMulai tidak boleh lebih besar dari tanggalSelesai` |
| range > 366 hari | range terlalu panjang | `Rentang tanggal tidak boleh lebih dari 366 hari` |
| userIds duplikat | `"userIds": ["uuid1","uuid1"]` | `userIds tidak boleh duplikat` |
| reguId duplikat dalam satu request | `"regu": [{reguId: x}, {reguId: x}]` | `reguId tidak boleh duplikat dalam satu request` |

### Business Logic

| Skenario | Expected Error |
|---|---|
| Buat jadwal tanggal yang sudah ada | `400 — Schedule already exists for this user on YYYY-MM-DD` |
| Add member yang sudah di regu lain | `409 — User sudah terdaftar di regu lain` |
| Add member yang sudah di regu yang sama | `409 — User sudah menjadi anggota regu ini` |
| Delete regu yang masih punya member | `400 — Regu masih memiliki N anggota` |
| Move member dari regu yang salah | `404 — User tidak ditemukan di regu asal` |
| Move ke regu yang sama | `400 — Regu asal dan tujuan tidak boleh sama` |
| Generate jadwal shift tanpa shiftId | `400 — shiftId is required when tipeJadwal is 'shift'` |
| shiftId tidak aktif | `404 — Shift not found or inactive` |

---

## Testing Checklist

### Regu CRUD
- [ ] Buat Regu A, B, C berhasil
- [ ] List regu tampil dengan `_count.members`
- [ ] Filter regu per cabang berhasil
- [ ] Search regu by nama berhasil
- [ ] Detail regu tampil beserta member
- [ ] Update keterangan regu berhasil
- [ ] Delete regu kosong berhasil
- [ ] Delete regu berisi member gagal dengan pesan yang benar

### Regu Member
- [ ] Tambah 3 user ke Regu A berhasil
- [ ] Tambah user yang sudah di regu lain → error 409
- [ ] Tambah user yang sudah di regu yang sama → error 409
- [ ] List member dengan pagination benar
- [ ] Pindah member antar regu berhasil, tidak ada di regu lama
- [ ] Hapus member berhasil, `_count.members` berkurang
- [ ] Hapus member yang tidak ada di regu → response skipped info

### Jadwal Single
- [ ] Buat jadwal shift berhasil, `jamMasuk`/`jamKeluar` dari master shift
- [ ] Buat jadwal reguler berhasil, jam dari override
- [ ] Buat jadwal libur berhasil, jam null
- [ ] Buat duplikat jadwal → error 400

### Jadwal Bulk Generate
- [ ] Generate 3 user × 1 bulan weekday berhasil
- [ ] `skipExisting: true` melewati jadwal yang sudah ada
- [ ] Jumlah jadwal yang dibuat sesuai perhitungan

### Jadwal Generate Regu Rolling
- [ ] Regu A & B dengan offset berbeda — hari kerja tidak overlap
- [ ] Rotasi shift berganti setelah tepat N hari kerja
- [ ] Hari libur muncul sebagai record `tipe_jadwal: "libur"`
- [ ] `tanggalMulaiKerjaRegu` sebelum `tanggalMulai` generate — shift di hari pertama sudah di posisi yang benar (bukan selalu mulai PAGI)
- [ ] Regu C dengan 2 shift 12 jam, pola 2K-2L berhasil
- [ ] `summaryPerRegu.rotasiDetail` mencerminkan pergantian shift yang akurat
- [ ] Generate 2 periode berturut-turut dengan `skipExisting: true` → tidak duplikat

### Jadwal CRUD
- [ ] Update jadwal ganti shift → jam ikut berubah
- [ ] Update jadwal ke reguler → `master_shift_id` null
- [ ] Delete jadwal berhasil
- [ ] Get jadwal dengan semua kombinasi filter

---

## Cleanup Test Data

```bash
# Hapus semua jadwal dalam range bulan Februari
# (Gunakan hanya di environment development)
curl -b cookies.txt "http://localhost:3000/api/jadwal?tanggalMulai=2025-02-01&tanggalSelesai=2025-02-28&limit=200" \
  | jq -r '.data[].id' \
  | xargs -I{} curl -b cookies.txt -X DELETE "http://localhost:3000/api/jadwal/{}"

# Atau langsung via SQL
# DELETE FROM jadwal_kerja WHERE tanggal_mulai BETWEEN '2025-02-01' AND '2025-02-28';
# DELETE FROM regu_member WHERE regu_id IN (SELECT id FROM regu WHERE nama_regu LIKE 'Regu %');
# DELETE FROM regu WHERE nama_regu LIKE 'Regu %' AND deleted_at IS NULL;
```