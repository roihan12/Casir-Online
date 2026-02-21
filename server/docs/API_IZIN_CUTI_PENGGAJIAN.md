# API Documentation: Phase 4 (Izin & Cuti) + Phase 5 (Penggajian)

> Base URL: `http://localhost:3000/api`
> Semua endpoint membutuhkan header `Authorization: Bearer <token>` kecuali dinyatakan lain.

---

## 📋 Daftar Endpoint

| Module | Base Path | Method | Endpoint | Deskripsi |
|--------|-----------|--------|----------|-----------|
| **Hari Libur** | `/hari-libur` | GET | `/` | List hari libur |
| | | GET | `/check?tanggal=` | Cek tanggal libur |
| | | GET | `/hitung-hari-kerja?dari=&sampai=` | Hitung hari kerja |
| | | POST | `/` | Tambah hari libur |
| | | POST | `/import` | Import bulk |
| | | DELETE | `/:id` | Hapus hari libur |
| **Izin & Cuti** | `/izin-cuti` | POST | `/izin` | Ajukan izin |
| | | POST | `/cuti` | Ajukan cuti |
| | | GET | `/me` | Izin/cuti saya |
| | | GET | `/pending` | Antrian persetujuan |
| | | GET | `/` | List semua (admin) |
| | | GET | `/:id` | Detail izin/cuti |
| | | PUT | `/:id/approve` | Setujui |
| | | PUT | `/:id/reject` | Tolak |
| | | DELETE | `/:id` | Batalkan |
| **Kuota Cuti** | `/kuota-cuti` | GET | `/` | List kuota (admin) |
| | | GET | `/:userId` | Kuota per karyawan |
| | | POST | `/generate` | Generate kuota tahunan |
| | | PUT | `/:id` | Adjust kuota manual |
| **Penggajian** | `/penggajian` | GET | `/komponen` | List komponen gaji |
| | | POST | `/komponen` | Buat komponen |
| | | GET | `/komponen/:id` | Detail komponen |
| | | PUT | `/komponen/:id` | Update komponen |
| | | DELETE | `/komponen/:id` | Hapus komponen |
| | | GET | `/tunjangan` | List tunjangan |
| | | POST | `/tunjangan` | Tambah tunjangan |
| | | PUT | `/tunjangan/:id` | Update tunjangan |
| | | DELETE | `/tunjangan/:id` | Hapus tunjangan |
| | | GET | `/gaji/:userId` | Data gaji karyawan |
| | | PUT | `/gaji/:userId` | Update gaji |
| | | GET | `/gaji/:userId/riwayat` | Riwayat gaji |
| | | GET | `/slip/me` | Slip gaji saya |
| | | GET | `/slip` | List slip gaji (admin) |
| | | GET | `/slip/:id` | Detail slip gaji |
| | | POST | `/slip/generate` | Generate slip gaji |
| | | PUT | `/slip/:id/finalize` | Finalize slip |
| | | POST | `/slip/batch-finalize` | Batch finalize |
| | | DELETE | `/slip/:id` | Hapus slip draft |

---

## 🗓️ HARI LIBUR

### GET `/api/hari-libur`
List hari libur dengan filter tahun.

**Query Parameters:**
| Param | Type | Required | Default | Deskripsi |
|-------|------|----------|---------|-----------|
| `tahun` | number | ❌ | - | Filter tahun |
| `page` | number | ❌ | 1 | Halaman |
| `limit` | number | ❌ | 50 | Jumlah per halaman |

**Test API (curl):**
```bash
curl -X GET "http://localhost:3000/api/hari-libur?tahun=2026" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Holidays retrieved successfully",
  "data": [
    {
      "libur_id": "uuid",
      "tanggal": "2026-01-01T00:00:00.000Z",
      "nama": "Tahun Baru 2026",
      "is_recurring": true,
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 15, "totalPages": 1 }
}
```

### POST `/api/hari-libur`
Tambah satu hari libur. **Permission: `hari_libur:create`**

**Request Body:**
```json
{
  "tanggal": "2026-08-17",
  "nama": "Hari Kemerdekaan RI",
  "isRecurring": true
}
```

**Test API:**
```bash
curl -X POST "http://localhost:3000/api/hari-libur" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tanggal":"2026-08-17","nama":"Hari Kemerdekaan RI","isRecurring":true}'
```

**Response (201):**
```json
{
  "success": true,
  "message": "Holiday created successfully",
  "data": {
    "libur_id": "uuid",
    "tanggal": "2026-08-17T00:00:00.000Z",
    "nama": "Hari Kemerdekaan RI",
    "is_recurring": true
  }
}
```

### POST `/api/hari-libur/import`
Import bulk hari libur. **Permission: `hari_libur:create`**

**Request Body:**
```json
{
  "holidays": [
    { "tanggal": "2026-01-01", "nama": "Tahun Baru", "isRecurring": true },
    { "tanggal": "2026-03-28", "nama": "Isra Mi'raj", "isRecurring": false },
    { "tanggal": "2026-05-01", "nama": "Hari Buruh", "isRecurring": true }
  ]
}
```

**Test API:**
```bash
curl -X POST "http://localhost:3000/api/hari-libur/import" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"holidays":[{"tanggal":"2026-01-01","nama":"Tahun Baru","isRecurring":true},{"tanggal":"2026-05-01","nama":"Hari Buruh","isRecurring":true}]}'
```

**Response (201):**
```json
{
  "success": true,
  "message": "Holidays imported successfully",
  "data": { "created": 2, "skipped": 0, "errors": [] }
}
```

### GET `/api/hari-libur/check?tanggal=2026-08-17`
Cek apakah tanggal tersebut hari libur.

```bash
curl -X GET "http://localhost:3000/api/hari-libur/check?tanggal=2026-08-17" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**
```json
{ "success": true, "data": { "isLibur": true, "nama": "Hari Kemerdekaan RI" } }
```

### GET `/api/hari-libur/hitung-hari-kerja?dari=2026-01-01&sampai=2026-01-31`
Hitung hari kerja antara dua tanggal (exclude weekend + libur).

```bash
curl -X GET "http://localhost:3000/api/hari-libur/hitung-hari-kerja?dari=2026-01-01&sampai=2026-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": { "totalHariKerja": 21, "hariLibur": ["2026-01-01"] }
}
```

### DELETE `/api/hari-libur/:id`
Hapus hari libur. **Permission: `hari_libur:delete`**

```bash
curl -X DELETE "http://localhost:3000/api/hari-libur/UUID_LIBUR_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 IZIN & CUTI

### POST `/api/izin-cuti/izin`
Ajukan izin (sakit/keperluan). Siapa saja yang terautentikasi.

**Tipe Izin:** `izin_sakit` | `izin_keperluan`

**Request Body:**
```json
{
  "tipeIzin": "izin_sakit",
  "cabangId": "cabang-uuid",
  "tanggalMulai": "2026-03-01",
  "tanggalSelesai": "2026-03-03",
  "alasan": "Sakit demam dan batuk, perlu istirahat beberapa hari",
  "lampiranFile": "https://storage.example.com/surat-dokter.pdf"
}
```

**Test API:**
```bash
curl -X POST "http://localhost:3000/api/izin-cuti/izin" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tipeIzin":"izin_sakit","cabangId":"CABANG_ID","tanggalMulai":"2026-03-01","tanggalSelesai":"2026-03-03","alasan":"Sakit demam dan batuk, perlu istirahat","lampiranFile":null}'
```

**Response (201):**
```json
{
  "success": true,
  "message": "Pengajuan izin berhasil dibuat",
  "data": {
    "izin_id": "uuid",
    "user_id": "user-uuid",
    "tipe_izin": "izin_sakit",
    "tanggal_mulai": "2026-03-01",
    "tanggal_selesai": "2026-03-03",
    "jumlah_hari": 2,
    "status": "pending"
  }
}
```

### POST `/api/izin-cuti/cuti`
Ajukan cuti tahunan (otomatis cek kuota).

**Tipe Cuti:** `cuti_tahunan` | `cuti_melahirkan` | `cuti_bersama` | `cuti_khusus`

**Request Body:**
```json
{
  "tipeIzin": "cuti_tahunan",
  "cabangId": "cabang-uuid",
  "tanggalMulai": "2026-04-01",
  "tanggalSelesai": "2026-04-05",
  "alasan": "Liburan keluarga ke luar kota selama satu minggu"
}
```

**Test API:**
```bash
curl -X POST "http://localhost:3000/api/izin-cuti/cuti" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tipeIzin":"cuti_tahunan","cabangId":"CABANG_ID","tanggalMulai":"2026-04-01","tanggalSelesai":"2026-04-05","alasan":"Liburan keluarga ke luar kota selama satu minggu"}'
```

**Error Response (400) — kuota habis:**
```json
{
  "success": false,
  "message": "Saldo cuti tidak mencukupi. Sisa: 3 hari, dibutuhkan: 5 hari"
}
```

### GET `/api/izin-cuti/me`
Lihat pengajuan izin/cuti saya.

```bash
curl -X GET "http://localhost:3000/api/izin-cuti/me?status=pending&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET `/api/izin-cuti/pending`
Lihat antrian persetujuan. **Permission: `izin:approve`**

```bash
curl -X GET "http://localhost:3000/api/izin-cuti/pending?cabangId=CABANG_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET `/api/izin-cuti`
List semua izin/cuti dengan filter. **Permission: `izin:read`**

**Query Parameters:**
| Param | Type | Required |
|-------|------|----------|
| `userId` | string | ❌ |
| `cabangId` | string | ❌ |
| `status` | `pending`/`disetujui`/`ditolak`/`dibatalkan` | ❌ |
| `tipeIzin` | string | ❌ |
| `tanggalMulai` | date | ❌ |
| `tanggalSelesai` | date | ❌ |
| `page` | number | ❌ |
| `limit` | number | ❌ |

### PUT `/api/izin-cuti/:id/approve`
Setujui izin/cuti. **Permission: `izin:approve`**

Auto-create attendance records & update kuota cuti.

```bash
curl -X PUT "http://localhost:3000/api/izin-cuti/UUID/approve" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"catatanApprover":"Disetujui, semoga lekas sembuh"}'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Pengajuan berhasil disetujui",
  "data": { "updatedIzin": {...}, "absensiCreated": 2 }
}
```

### PUT `/api/izin-cuti/:id/reject`
Tolak izin/cuti. **Permission: `izin:approve`**

```bash
curl -X PUT "http://localhost:3000/api/izin-cuti/UUID/reject" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"catatanApprover":"Ditolak karena bertabrakan dengan jadwal shift penting"}'
```

### DELETE `/api/izin-cuti/:id`
Batalkan pengajuan sendiri (hanya jika status `pending`).

```bash
curl -X DELETE "http://localhost:3000/api/izin-cuti/UUID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 KUOTA CUTI

### POST `/api/kuota-cuti/generate`
Generate kuota cuti tahunan untuk semua karyawan aktif. **Permission: `kuota_cuti:create`**

```json
{
  "tahun": 2026,
  "kuotaDefault": 12,
  "carryOver": true,
  "maxCarryOver": 5
}
```

**Test API:**
```bash
curl -X POST "http://localhost:3000/api/kuota-cuti/generate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tahun":2026,"kuotaDefault":12,"carryOver":true,"maxCarryOver":5}'
```

**Response (201):**
```json
{
  "success": true,
  "message": "Leave quota generated for year 2026",
  "data": { "tahun": 2026, "created": 25, "skipped": 0, "total": 25 }
}
```

### GET `/api/kuota-cuti`
List semua kuota. **Permission: `kuota_cuti:read`**

```bash
curl -X GET "http://localhost:3000/api/kuota-cuti?tahun=2026" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET `/api/kuota-cuti/:userId`
Lihat kuota per karyawan.

```bash
curl -X GET "http://localhost:3000/api/kuota-cuti/USER_ID?tahun=2026" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "kuota_id": "uuid",
    "user_id": "user-uuid",
    "tahun": 2026,
    "kuota_tahunan": 12,
    "kuota_diambil": 3,
    "kuota_pending": 2,
    "kuota_sisa": 7,
    "user": { "id": "uuid", "namaLengkap": "John Doe", "email": "john@mail.com" }
  }
}
```

### PUT `/api/kuota-cuti/:id`
Adjust kuota manual (HRD). **Permission: `kuota_cuti:update`**

```bash
curl -X PUT "http://localhost:3000/api/kuota-cuti/KUOTA_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"kuotaTahunan":15,"alasan":"Penambahan kuota khusus karena loyalitas"}'
```

---

## 💰 PENGGAJIAN — KOMPONEN GAJI (T-17)

### POST `/api/penggajian/komponen`
Buat komponen gaji baru. **Permission: `komponen_gaji:create`**

```json
{
  "nama": "Tunjangan Makan",
  "tipe": "tunjangan",
  "nilai": 500000,
  "isProrate": true,
  "keterangan": "Tunjangan makan harian, prorate berdasarkan kehadiran"
}
```

**Test API:**
```bash
curl -X POST "http://localhost:3000/api/penggajian/komponen" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nama":"Tunjangan Makan","tipe":"tunjangan","nilai":500000,"isProrate":true,"keterangan":"Pro-rate kehadiran"}'
```

### GET `/api/penggajian/komponen`
List komponen gaji. **Permission: `komponen_gaji:read`**

**Query:** `tipe`, `isActive`, `search`, `page`, `limit`

```bash
curl -X GET "http://localhost:3000/api/penggajian/komponen?tipe=tunjangan&isActive=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### PUT `/api/penggajian/komponen/:id`
Update komponen. **Permission: `komponen_gaji:update`**

```bash
curl -X PUT "http://localhost:3000/api/penggajian/komponen/UUID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nilai":600000,"keterangan":"Naik per Januari 2026"}'
```

### DELETE `/api/penggajian/komponen/:id`
Hapus komponen (tidak bisa jika sudah dipakai). **Permission: `komponen_gaji:delete`**

---

## 💰 PENGGAJIAN — TUNJANGAN PEGAWAI (T-18)

### POST `/api/penggajian/tunjangan`
Assign tunjangan ke karyawan. **Permission: `tunjangan:create`**

```json
{
  "userId": "user-uuid",
  "komponenId": "komponen-uuid",
  "nilaiOverride": 750000,
  "berlakuDari": "2026-01-01",
  "berlakuSampai": null
}
```

**Test API:**
```bash
curl -X POST "http://localhost:3000/api/penggajian/tunjangan" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","komponenId":"KOMPONEN_ID","nilaiOverride":750000,"berlakuDari":"2026-01-01"}'
```

### GET `/api/penggajian/tunjangan`
List tunjangan. **Permission: `tunjangan:read`**

**Query:** `userId`, `komponenId`, `isActive`

```bash
curl -X GET "http://localhost:3000/api/penggajian/tunjangan?userId=USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 💰 PENGGAJIAN — GAJI PEGAWAI & RIWAYAT (T-19)

### GET `/api/penggajian/gaji/:userId`
Data gaji karyawan + active tunjangan. **Permission: `gaji:read`**

```bash
curl -X GET "http://localhost:3000/api/penggajian/gaji/USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "gaji": {
      "gaji_id": "uuid",
      "gaji_pokok": "5000000.00",
      "tarif_lembur": "50000.00",
      "tipe_gaji": "bulanan"
    },
    "tunjangan": [
      {
        "tunjangan_id": "uuid",
        "komponen_gaji": { "nama": "Tunjangan Makan", "tipe": "tunjangan", "nilai": "500000" },
        "nilai_override": "750000"
      }
    ]
  }
}
```

### PUT `/api/penggajian/gaji/:userId`
Update gaji (auto-create riwayat). **Permission: `gaji:update`**

```json
{
  "gajiPokok": 5500000,
  "tarifLembur": 55000,
  "tipeGaji": "bulanan",
  "alasan": "Kenaikan gaji tahunan berdasarkan performance review Q4"
}
```

**Test API:**
```bash
curl -X PUT "http://localhost:3000/api/penggajian/gaji/USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"gajiPokok":5500000,"tarifLembur":55000,"tipeGaji":"bulanan","alasan":"Kenaikan gaji tahunan performance review Q4"}'
```

### GET `/api/penggajian/gaji/:userId/riwayat`
Riwayat perubahan gaji. **Permission: `gaji:read`**

```bash
curl -X GET "http://localhost:3000/api/penggajian/gaji/USER_ID/riwayat" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 💰 PENGGAJIAN — SLIP GAJI (T-20/T-21)

### POST `/api/penggajian/slip/generate`
Generate slip gaji bulk per periode. **Permission: `slip_gaji:create`**

```json
{
  "periode": "2026-02",
  "cabangId": "cabang-uuid",
  "userIds": ["user-1", "user-2"]
}
```

> Jika `userIds` tidak diisi, akan generate untuk **semua karyawan aktif** di cabang.

**Test API:**
```bash
curl -X POST "http://localhost:3000/api/penggajian/slip/generate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"periode":"2026-02","cabangId":"CABANG_ID"}'
```

**Response (201):**
```json
{
  "success": true,
  "message": "Slip gaji berhasil di-generate",
  "data": { "created": 10, "skipped": 0, "errors": [] }
}
```

### GET `/api/penggajian/slip`
List slip gaji. **Permission: `slip_gaji:read`**

**Query:** `userId`, `cabangId`, `periode`, `status(draft/final/dibayar)`, `page`, `limit`

```bash
curl -X GET "http://localhost:3000/api/penggajian/slip?periode=2026-02&cabangId=CABANG_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET `/api/penggajian/slip/me`
Slip gaji saya (hanya yang finalized terlihat oleh karyawan).

```bash
curl -X GET "http://localhost:3000/api/penggajian/slip/me?periode=2026-02" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET `/api/penggajian/slip/:id`
Detail slip gaji + breakdown komponen.

```bash
curl -X GET "http://localhost:3000/api/penggajian/slip/SLIP_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "slip_id": "uuid",
    "periode": "2026-02",
    "total_hari_kerja": 22,
    "total_hadir": 20,
    "total_alpha": 1,
    "total_terlambat": 2,
    "gaji_pokok": "5000000.00",
    "total_tunjangan": "1200000.00",
    "total_potongan": "300000.00",
    "upah_lembur": "250000.00",
    "potongan_alpha": "227272.73",
    "potongan_terlambat": "100000.00",
    "gaji_bersih": "5822727.27",
    "status": "draft",
    "slip_gaji_detail": [
      { "nama": "Tunjangan Makan", "tipe": "tunjangan", "nilai": "700000.00", "keterangan": "Pro-rate: 20/22 hari" },
      { "nama": "Tunjangan Transport", "tipe": "tunjangan", "nilai": "500000.00" },
      { "nama": "BPJS Kesehatan", "tipe": "potongan", "nilai": "300000.00" }
    ]
  }
}
```

### PUT `/api/penggajian/slip/:id/finalize`
Finalize slip (draft → final). Mengirim notifikasi ke karyawan. **Permission: `slip_gaji:update`**

```bash
curl -X PUT "http://localhost:3000/api/penggajian/slip/SLIP_ID/finalize" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"catatan":"Gaji bulan Februari sudah final"}'
```

### POST `/api/penggajian/slip/batch-finalize`
Batch finalize semua slip draft untuk satu periode. **Permission: `slip_gaji:update`**

```bash
curl -X POST "http://localhost:3000/api/penggajian/slip/batch-finalize" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"periode":"2026-02","cabangId":"CABANG_ID"}'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Batch finalize berhasil",
  "data": { "periode": "2026-02", "cabangId": "uuid", "finalized": 10, "total": 10 }
}
```

### DELETE `/api/penggajian/slip/:id`
Hapus slip gaji (hanya draft). **Permission: `slip_gaji:delete`**

```bash
curl -X DELETE "http://localhost:3000/api/penggajian/slip/SLIP_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔑 Permission yang Dibutuhkan

| Module | Permission |
|--------|-----------|
| Hari Libur | `hari_libur:create`, `hari_libur:delete` |
| Izin & Cuti | `izin:read`, `izin:approve` |
| Kuota Cuti | `kuota_cuti:read`, `kuota_cuti:create`, `kuota_cuti:update` |
| Komponen Gaji | `komponen_gaji:read`, `komponen_gaji:create`, `komponen_gaji:update`, `komponen_gaji:delete` |
| Tunjangan | `tunjangan:read`, `tunjangan:create`, `tunjangan:update`, `tunjangan:delete` |
| Gaji Pegawai | `gaji:read`, `gaji:update` |
| Slip Gaji | `slip_gaji:read`, `slip_gaji:create`, `slip_gaji:update`, `slip_gaji:delete` |

---

## ⚠️ Error Responses

Semua error mengikuti format:
```json
{
  "success": false,
  "message": "Pesan error yang deskriptif"
}
```

| Status | Deskripsi |
|--------|-----------|
| 400 | Validation error / business rule violation |
| 401 | Unauthorized (token tidak valid) |
| 403 | Forbidden (tidak punya permission) |
| 404 | Resource tidak ditemukan |
| 500 | Internal server error |

---

## 📐 Formula Kalkulasi Gaji

```
Gaji Bersih = Gaji Pokok 
            + Total Tunjangan (pro-rate jika berlaku)
            + Upah Lembur (tarif × jam lembur)
            - Total Potongan
            - Potongan Alpha (gaji_pokok / hari_kerja × total_alpha)
            - Potongan Terlambat (1% × gaji_pokok × total_terlambat)
```

> **Pro-rate:** `nilai / total_hari_kerja × total_hadir`
