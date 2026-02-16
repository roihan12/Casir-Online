# 📋 TASK DOCUMENT
## Sistem Absensi, Izin, Cuti & Penggajian

| | |
|---|---|
| **Versi** | 1.0.0 |
| **Tanggal** | 2025 |
| **Status** | Ready for Development |
| **Total Task** | 28 Task |
| **Total Estimasi** | ±58 Hari Kerja |

---

## 📌 Daftar Isi

- [Overview & Arsitektur](#overview--arsitektur)
- [Phase 1 — Fondasi Database](#phase-1--fondasi-database)
- [Phase 2 — Shift & Jadwal Kerja](#phase-2--shift--jadwal-kerja)
- [Phase 3 — Keamanan & Anti-Fraud](#phase-3--keamanan--anti-fraud)
- [Phase 4 — Izin & Cuti](#phase-4--izin--cuti)
- [Phase 5 — Penggajian](#phase-5--penggajian)
- [Phase 6 — Dashboard, Laporan & Otomasi](#phase-6--dashboard-laporan--otomasi)
- [API Endpoints Summary](#api-endpoints-summary)
- [Dependency Antar Task](#dependency-antar-task)
- [Catatan Teknis](#catatan-teknis)

---

## Overview & Arsitektur

### Tujuan Proyek

Membangun sistem manajemen SDM terintegrasi yang mencakup pencatatan absensi berbasis GPS & face recognition, manajemen shift kerja, pengajuan izin & cuti, serta kalkulasi dan penerbitan slip gaji otomatis.

### Tabel Database yang Ditambahkan

| Modul | Tabel Baru | Keterangan |
|---|---|---|
| Shift & Jadwal | `shift`, `jadwal_kerja_harian` | Unified jadwal harian + master shift |
| Izin & Cuti | `izin_cuti`, `kuota_cuti`, `hari_libur` | Pengajuan, saldo cuti, kalender libur |
| Penggajian | `komponen_gaji`, `gaji_pegawai`, `riwayat_gaji_pegawai`, `tunjangan_pegawai`, `slip_gaji`, `slip_gaji_detail` | Kalkulasi & slip gaji bulanan |
| Keamanan | `koreksi_absensi`, `device_pegawai`, `audit_log` | Anti-fraud & audit trail |
| UX & Performa | `notifikasi`, `rekap_absensi_harian` | Push notif & cache dashboard |

### Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│                   MOBILE APP                        │
│   Absensi  │  Jadwal  │  Izin/Cuti  │  Slip Gaji   │
└────────────────────┬────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────┐
│                  BACKEND SERVICE                    │
│  AbsensiService │ IzinService   │ GajiService       │
│  JadwalService  │ NotifService  │ AuditService      │
└────┬────────────┬───────────────┬──────────────┬────┘
     │            │               │              │
  ┌──▼──┐   ┌────▼───┐   ┌──────▼─┐   ┌────────▼───┐
  │ DB  │   │ Queue  │   │ Cache  │   │  Storage   │
  │Psql │   │BullMQ  │   │ Redis  │   │ Supabase   │
  └─────┘   └────────┘   └────────┘   └────────────┘
```

---

## Phase 1 — Fondasi Database

> **Estimasi:** 5 Hari Kerja | **Sprint:** 1
> 
> Phase ini adalah fondasi dari semua phase berikutnya. **Wajib diselesaikan pertama** sebelum development apapun dimulai.

### Checklist Phase 1

- [ ] T-01 — Database Migration
- [ ] T-02 — Database Indexing
- [ ] T-03 — Update Enum StatusKehadiran
- [ ] T-04 — Prisma Schema Update

---

### T-01 — Database Migration

| | |
|---|---|
| **Prioritas** | 🔴 HIGH |
| **Estimasi** | 1 Hari |
| **PIC** | Backend Dev / DBA |
| **Status** | To Do |

**Deskripsi:**
Jalankan file `migration.sql` ke database PostgreSQL untuk membuat semua tabel, enum, constraint, index, trigger, dan seed data awal.

**Steps:**
1. Backup database production dan staging sebelum eksekusi
2. Jalankan di environment **staging** terlebih dahulu
3. Verifikasi semua tabel terbuat:
   - `shift`, `jadwal_kerja_harian`
   - `izin_cuti`, `kuota_cuti`, `hari_libur`
   - `koreksi_absensi`, `device_pegawai`, `audit_log`
   - `komponen_gaji`, `gaji_pegawai`, `riwayat_gaji_pegawai`, `tunjangan_pegawai`
   - `slip_gaji`, `slip_gaji_detail`
   - `rekap_absensi_harian`, `notifikasi`
4. Verifikasi trigger berjalan (`update_updated_at`, `fn_update_kuota_cuti`, `fn_update_rekap_absensi`)
5. Verifikasi seed data masuk (shift default, hari libur 2025, komponen gaji default)
6. Siapkan rollback script jika ada kegagalan
7. Jika staging sukses, jalankan ke production

**Acceptance Criteria:**
- Semua 17 tabel baru terbuat tanpa error
- Semua foreign key constraint valid
- Semua index terbuat
- Seed data tersedia
- Trigger berfungsi saat insert/update

---

### T-02 — Database Indexing & Performa

| | |
|---|---|
| **Prioritas** | 🔴 HIGH |
| **Estimasi** | 0.5 Hari |
| **PIC** | Backend Dev / DBA |
| **Status** | To Do |

**Deskripsi:**
Tambahkan index pada tabel `absensi_pegawai` yang sudah ada untuk mengoptimasi query yang paling sering digunakan di dashboard dan laporan.

**Index yang Ditambahkan:**

```sql
-- Query paling sering: absensi per user per bulan
CREATE INDEX idx_absensi_user_tanggal
  ON absensi_pegawai (user_id, tanggal_absensi DESC);

-- Query laporan per cabang
CREATE INDEX idx_absensi_cabang_tanggal
  ON absensi_pegawai (cabang_id, tanggal_absensi DESC);

-- Filter status kehadiran
CREATE INDEX idx_absensi_status
  ON absensi_pegawai (status_kehadiran);

-- Geo-query validasi koordinat
CREATE INDEX idx_absensi_koordinat
  ON absensi_pegawai (latitude_masuk, longitude_masuk);
```

**Steps:**
1. Jalankan `EXPLAIN ANALYZE` pada query utama dashboard sebelum indexing (catat waktu)
2. Tambahkan semua index di atas
3. Jalankan ulang `EXPLAIN ANALYZE` dan bandingkan (harus ada peningkatan signifikan)
4. Dokumentasikan hasil benchmark

**Acceptance Criteria:**
- Query dashboard < 200ms untuk data 1 bulan
- Query laporan bulanan < 500ms untuk 100 karyawan

---

### T-03 — Update Enum StatusKehadiran

| | |
|---|---|
| **Prioritas** | 🔴 HIGH |
| **Estimasi** | 0.5 Hari |
| **PIC** | Backend Dev |
| **Status** | To Do |

**Deskripsi:**
Tambahkan nilai-nilai baru ke enum `StatusKehadiran` yang sudah ada tanpa mengganggu data existing.

**Nilai Baru yang Ditambahkan:**

```sql
ALTER TYPE "StatusKehadiran" ADD VALUE IF NOT EXISTS 'hadir_terlambat';
ALTER TYPE "StatusKehadiran" ADD VALUE IF NOT EXISTS 'hadir_pulang_cepat';
ALTER TYPE "StatusKehadiran" ADD VALUE IF NOT EXISTS 'alpha';
ALTER TYPE "StatusKehadiran" ADD VALUE IF NOT EXISTS 'libur';
ALTER TYPE "StatusKehadiran" ADD VALUE IF NOT EXISTS 'off';
ALTER TYPE "StatusKehadiran" ADD VALUE IF NOT EXISTS 'wfh';
ALTER TYPE "StatusKehadiran" ADD VALUE IF NOT EXISTS 'dinas_luar';
```

**Steps:**
1. Jalankan ALTER TYPE di database
2. Update Prisma schema dengan nilai enum baru
3. Jalankan `npx prisma generate`
4. Update service layer yang set `statusKehadiran` (tambah logic untuk nilai baru)
5. Update validasi di API layer

**Acceptance Criteria:**
- Enum berhasil diupdate tanpa error
- Data existing tidak berubah
- Prisma client ter-generate ulang
- API bisa menerima dan menyimpan nilai enum baru

---

### T-04 — Prisma Schema Update

| | |
|---|---|
| **Prioritas** | 🔴 HIGH |
| **Estimasi** | 3 Hari |
| **PIC** | Backend Dev |
| **Status** | To Do |

**Deskripsi:**
Update file `schema.prisma` untuk mencerminkan semua tabel baru, relasi, dan perubahan yang sudah dibuat via SQL migration.

**Model yang Ditambahkan ke schema.prisma:**

```prisma
model Shift {
  id                  String           @id @default(uuid()) @map("shift_id")
  namaShift           String           @map("nama_shift") @db.VarChar(50)
  jamMasuk            String           @map("jam_masuk")
  jamKeluar           String           @map("jam_keluar")
  isOvernight         Boolean          @default(false) @map("is_overnight")
  toleransiTerlambat  Int              @default(15) @map("toleransi_terlambat")
  cabangId            String?          @map("cabang_id")
  isActive            Boolean          @default(true) @map("is_active")
  createdAt           DateTime         @default(now()) @map("created_at")
  updatedAt           DateTime         @updatedAt @map("updated_at")
  created_by          String?          @map("created_by") @db.VarChar(36)
  updated_by          String?          @map("updated_by") @db.VarChar(36)
  absensiPegawai      AbsensiPegawai[]
  jadwalKerja         JadwalKerjaHarian[]
  cabang              Cabang?          @relation(fields: [cabangId], references: [id])
  @@map("shift")
}

model JadwalKerjaHarian {
  id                  String     @id @default(uuid()) @map("jadwal_id")
  userId              String     @map("user_id")
  cabangId            String     @map("cabang_id")
  shiftId             String?    @map("shift_id")
  tanggal             DateTime   @db.Date
  tipeJadwal          TipeJadwal @default(reguler) @map("tipe_jadwal")
  jamMasukOverride    String?    @map("jam_masuk_override")
  jamKeluarOverride   String?    @map("jam_keluar_override")
  keterangan          String?
  createdAt           DateTime   @default(now()) @map("created_at")
  updatedAt           DateTime   @updatedAt @map("updated_at")
  user                User       @relation(fields: [userId], references: [id])
  cabang              Cabang     @relation(fields: [cabangId], references: [id])
  shift               Shift?     @relation(fields: [shiftId], references: [id])
  @@unique([userId, tanggal])
  @@map("jadwal_kerja_harian")
}

// ... (semua model lainnya)
```

**Steps:**
1. Tambahkan semua model baru ke schema.prisma
2. Tambahkan relasi yang diperlukan ke model existing (User, Cabang)
3. Jalankan `npx prisma validate` — pastikan tidak ada error
4. Jalankan `npx prisma generate` untuk update client
5. Buat dan jalankan unit test untuk memastikan relasi Prisma bekerja

**Acceptance Criteria:**
- `npx prisma validate` lulus tanpa error
- `npx prisma generate` sukses
- Semua relasi bisa di-query (tidak ada error runtime)

---

## Phase 2 — Shift & Jadwal Kerja

> **Estimasi:** 10 Hari Kerja | **Sprint:** 2
>
> Mengelola master data shift dan sistem penjadwalan harian karyawan. Fondasi untuk deteksi keterlambatan dan kalkulasi lembur.

### Checklist Phase 2

- [ ] T-05 — Master Shift CRUD API
- [ ] T-06 — Jadwal Kerja Harian API
- [ ] T-07 — Deteksi Keterlambatan Otomatis
- [ ] T-08 — Kalkulasi Jam Kerja & Lembur

---

### T-05 — Master Shift — CRUD API

| | |
|---|---|
| **Prioritas** | 🔴 HIGH |
| **Estimasi** | 2 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-01, T-04 |
| **Status** | To Do |

**Deskripsi:**
API untuk mengelola master data shift kerja perusahaan. Seed data sudah menyediakan 4 shift default (Shift 1, 2, 3, Reguler).

**Endpoints:**

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/shifts` | List semua shift aktif (filter: cabang_id) |
| `GET` | `/api/shifts/:id` | Detail satu shift |
| `POST` | `/api/shifts` | Buat shift baru |
| `PUT` | `/api/shifts/:id` | Update data shift |
| `DELETE` | `/api/shifts/:id` | Soft delete (is_active = false) |

**Request Body (POST/PUT):**

```json
{
  "namaShift": "Shift 1",
  "jamMasuk": "06:00",
  "jamKeluar": "14:00",
  "isOvernight": false,
  "toleransiTerlambat": 15,
  "cabangId": "uuid-cabang"
}
```

**Validasi:**
- `jamMasuk` dan `jamKeluar` harus format `HH:MM`
- Jika `isOvernight = false`, `jamKeluar` harus lebih besar dari `jamMasuk`
- Jika `jamKeluar < jamMasuk`, sistem wajib set `isOvernight = true`
- `toleransiTerlambat` minimal 0 menit, maksimal 60 menit
- Tidak boleh ada 2 shift aktif dengan nama dan jam yang sama di cabang yang sama

**Acceptance Criteria:**
- Semua endpoint CRUD berfungsi
- Validasi overnight berjalan benar
- Soft delete tidak menghapus data, hanya set `is_active = false`
- Shift yang sudah dipakai di jadwal tidak bisa dihapus (tampilkan error)

---

### T-06 — Jadwal Kerja Harian — Generate & Assign

| | |
|---|---|
| **Prioritas** | 🔴 HIGH |
| **Estimasi** | 3 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-05 |
| **Status** | To Do |

**Deskripsi:**
API untuk membuat dan mengelola jadwal kerja harian per karyawan. Mendukung generate bulk untuk satu bulan sekaligus dan assignment individual.

**Endpoints:**

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/jadwal` | List jadwal (filter: userId, cabangId, tanggal range) |
| `POST` | `/api/jadwal` | Buat jadwal 1 hari spesifik |
| `POST` | `/api/jadwal/generate` | Generate jadwal bulk (range tanggal) |
| `PUT` | `/api/jadwal/:id` | Update jadwal 1 hari |
| `DELETE` | `/api/jadwal/:id` | Hapus jadwal |

**Request Body Generate Bulk:**

```json
{
  "userIds": ["uuid-1", "uuid-2"],
  "cabangId": "uuid-cabang",
  "shiftId": "uuid-shift",
  "tanggalMulai": "2025-02-01",
  "tanggalSelesai": "2025-02-28",
  "hariKerja": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
  "tipeJadwal": "shift"
}
```

**Tipe Jadwal:**

| Tipe | Keterangan |
|---|---|
| `shift` | Pakai jam dari master shift |
| `reguler` | Pakai jam override (jamMasukOverride, jamKeluarOverride) |
| `libur` | Karyawan libur di hari ini (khusus) |
| `wfh` | Work From Home |

**Validasi:**
- 1 karyawan hanya boleh punya 1 jadwal per hari (unique constraint)
- Jika `tipeJadwal = shift`, `shiftId` wajib diisi
- Jika `tipeJadwal = reguler`, `jamMasukOverride` dan `jamKeluarOverride` wajib diisi
- Generate bulk akan skip hari yang sudah ada jadwalnya (tidak overwrite)

**Acceptance Criteria:**
- Generate bulk 1 bulan untuk 50 karyawan < 5 detik
- Tidak ada duplikasi jadwal per user per hari
- List jadwal bisa difilter berdasarkan tanggal range dan user

---

### T-07 — Deteksi Keterlambatan Otomatis

| | |
|---|---|
| **Prioritas** | 🔴 HIGH |
| **Estimasi** | 2 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-06, T-03 (Enum Update) |
| **Status** | To Do |

**Deskripsi:**
Logic untuk mendeteksi keterlambatan secara otomatis saat karyawan melakukan clock-in, dengan membandingkan waktu masuk aktual terhadap jadwal kerja.

**Flow Deteksi:**

```
Karyawan Clock In (waktuMasuk)
        │
Cari jadwal hari ini → ambil jamMasuk dari shift/jadwal
        │
Hitung selisih: waktuMasuk - jamMasuk (dalam menit)
        │
├── selisih <= toleransiTerlambat → statusKehadiran = 'hadir'
└── selisih > toleransiTerlambat  → statusKehadiran = 'hadir_terlambat'
                                     catat di field keterangan: "Terlambat X menit"
```

**Yang Harus Dilakukan:**
1. Tambahkan function `hitungStatusKehadiran(userId, waktuMasuk)` di service layer
2. Panggil function ini saat endpoint clock-in dieksekusi
3. Simpan hasil deteksi ke `statusKehadiran` dan `keterangan`
4. Jika tidak ada jadwal hari ini → tampilkan error "Tidak ada jadwal untuk hari ini"

**Kasus Khusus Shift Overnight:**
```
Shift 3: jamMasuk = 22:00
Karyawan masuk jam 22:20 → terlambat 20 menit
Karyawan masuk jam 21:55 → TERLALU AWAL (belum boleh clock-in)
```

**Acceptance Criteria:**
- Status kehadiran ter-set otomatis saat clock-in
- Karyawan tanpa jadwal tidak bisa clock-in
- Shift overnight terdeteksi dengan benar
- Toleransi keterlambatan per shift diterapkan

---

### T-08 — Kalkulasi Jam Kerja & Lembur

| | |
|---|---|
| **Prioritas** | 🔴 HIGH |
| **Estimasi** | 3 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-07 |
| **Status** | To Do |

**Deskripsi:**
Hitung otomatis total jam kerja dan jam lembur saat karyawan melakukan clock-out.

**Formula:**

```
Jam Kerja = waktuKeluar - waktuMasuk (dalam jam, desimal)

Jam Shift Normal = jamKeluar - jamMasuk (dari shift/jadwal)

Jam Lembur = MAX(0, Jam Kerja - Jam Shift Normal)

isLembur = (Jam Lembur > 0)
```

**Penanganan Shift Overnight:**
```
Shift 3 (22:00 - 06:00):
  Jam Shift Normal = 8 jam
  Masuk 22:00, Keluar 06:30
  Jam Kerja = 8.5 jam
  Jam Lembur = 0.5 jam ✅
```

**Yang Harus Dilakukan:**
1. Update endpoint clock-out untuk menghitung dan menyimpan `jamKerja`, `isLembur`, `jamLembur`
2. Tambahkan validasi: waktu keluar tidak boleh lebih awal dari waktu masuk (kecuali overnight)
3. Tambahkan validasi: jam kerja maksimal 16 jam per hari (prevent input error)
4. Update `statusKehadiran` jika pulang lebih awal dari jadwal → `hadir_pulang_cepat`

**Acceptance Criteria:**
- `jamKerja`, `isLembur`, `jamLembur` terisi otomatis saat clock-out
- Shift overnight dihitung dengan benar
- `statusKehadiran` di-update sesuai kondisi

---

## Phase 3 — Keamanan

> **Estimasi:** 7.5 Hari Kerja | **Sprint:** 3
>
> Memastikan integritas data absensi: menyediakan jalur koreksi resmi, dan mencatat semua perubahan data sensitif.

### Checklist Phase 3

- [ ] T-10 — Koreksi Absensi
- [ ] T-11 — Audit Log

---



| | |
|---|---|
| **Prioritas** | 🔴 HIGH |
| **Estimasi** | 2 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-01 |
| **Status** | To Do |

**Deskripsi:**
Mencegah karyawan titip absen dengan memvalidasi bahwa absensi dilakukan dari device yang terdaftar atas nama karyawan tersebut.

**Flow Device Binding:**

```
Login pertama kali dari HP baru
          │
Backend cek apakah device_hardware_id sudah terdaftar
          │
├── Belum ada → Auto-register device
│              Simpan: device_hardware_id, device_name, platform
│              Status: is_active = true
│
└── Sudah ada tapi is_active = false → Tolak login
    Tampilkan: "Device ini telah dinonaktifkan. Hubungi HRD."

Saat Clock-In
          │
Kirim device_hardware_id di request header
          │
Backend validasi: apakah device ini terdaftar & aktif untuk user ini?
          │
├── Ya  → Lanjut proses absensi ✅
└── Tidak → Tolak + kirim alert ke admin ❌
```

**Endpoints:**

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/devices` | List device terdaftar karyawan |
| `DELETE` | `/api/devices/:id` | Nonaktifkan device (admin only) |
| `POST` | `/api/devices/register` | Register device baru (internal, dipanggil saat login) |

**Field yang Dikirim Mobile:**
```json
{
  "deviceHardwareId": "IMEI-atau-UUID-device",
  "deviceName": "Samsung Galaxy A54",
  "platform": "android",
  "appVersion": "1.2.0"
}
```

**Acceptance Criteria:**
- Absensi dari device tidak terdaftar ditolak dengan pesan jelas
- Admin bisa melihat semua device per karyawan
- Admin bisa nonaktifkan device yang hilang/dicuri
- Alert ke admin saat ada percobaan absensi dari device asing

---

### T-10 — Koreksi Absensi — Request & Approval

| | |
|---|---|
| **Prioritas** | 🔴 HIGH |
| **Estimasi** | 3 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-01, T-08 |
| **Status** | To Do |

**Deskripsi:**
Alur resmi untuk karyawan mengajukan perbaikan data absensi. Karyawan tidak boleh langsung mengubah data — harus melalui proses approval.

**Endpoints:**

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/koreksi` | Karyawan ajukan koreksi |
| `GET` | `/api/koreksi` | List pengajuan koreksi (filter: status, userId) |
| `GET` | `/api/koreksi/:id` | Detail satu pengajuan |
| `PUT` | `/api/koreksi/:id/approve` | HRD/atasan setujui koreksi |
| `PUT` | `/api/koreksi/:id/tolak` | HRD/atasan tolak dengan catatan |

**Request Body Koreksi:**
```json
{
  "absensiId": "uuid-absensi",
  "alasan": "Lupa clock-out karena ada meeting mendadak",
  "waktuMasukBaru": null,
  "waktuKeluarBaru": "2025-01-15T17:00:00Z",
  "statusBaru": null
}
```

**Saat Disetujui (Auto):**
1. Update `absensi_pegawai` dengan data koreksi
2. Hitung ulang `jamKerja`, `isLembur`, `jamLembur`
3. Update `statusKehadiran` jika `statusBaru` diisi
4. Catat perubahan ke `audit_log` (data sebelum & sesudah)
5. Kirim notifikasi ke karyawan

**Validasi:**
- Maksimal 1 koreksi aktif (pending) per record absensi
- Koreksi hanya bisa diajukan dalam rentang H+7 setelah tanggal absensi
- `waktuMasukBaru` tidak boleh lebih besar dari `waktuKeluarBaru`

**Acceptance Criteria:**
- Data absensi ter-update otomatis saat koreksi disetujui
- Audit log terekam untuk setiap persetujuan
- Notifikasi terkirim ke karyawan
- Pembatasan 1 pending koreksi per absensi berfungsi

---

### T-11 — Audit Log — Middleware Logging

| | |
|---|---|
| **Prioritas** | 🟡 MEDIUM |
| **Estimasi** | 2.5 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-01 |
| **Status** | To Do |

**Deskripsi:**
Implementasi logging otomatis untuk semua perubahan data sensitif. Bertujuan untuk compliance, investigasi, dan deteksi manipulasi data.

**Tabel yang Di-log:**

| Tabel | Event yang Di-log |
|---|---|
| `absensi_pegawai` | UPDATE (perubahan waktu, status) |
| `izin_cuti` | INSERT, UPDATE status |
| `koreksi_absensi` | INSERT, UPDATE status |
| `slip_gaji` | UPDATE status (draft → final → terbayar) |
| `kuota_cuti` | UPDATE (perubahan kuota) |

**Struktur Log:**
```json
{
  "userId": "uuid-siapa-yang-melakukan",
  "aksi": "UPDATE_ABSENSI",
  "tabel": "absensi_pegawai",
  "recordId": "uuid-record-yang-diubah",
  "dataBefore": { "waktuKeluar": null, "jamKerja": null },
  "dataAfter": { "waktuKeluar": "17:00", "jamKerja": 8.5 },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Implementasi sebagai Middleware/Decorator:**
```
sudah ada function auditLog di utils
```

**Endpoints:**

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/audit-log` | List log (filter: tabel, userId, tanggal, aksi) |
| `GET` | `/api/audit-log/:recordId` | History perubahan 1 record |

**Acceptance Criteria:**
- Semua mutasi pada tabel target tercatat otomatis
- Log tidak bisa dihapus atau diubah (INSERT only)
- Admin bisa melihat siapa yang mengubah data kapan
- Retain policy: log tersimpan minimal 1 tahun

---

## Phase 4 — Izin & Cuti

> **Estimasi:** 11.5 Hari Kerja | **Sprint:** 4 & 5
>
> Sistem pengajuan dan approval izin & cuti yang terintegrasi dengan absensi dan kalkulasi gaji.

### Checklist Phase 4

- [ ] T-12 — Kalender Hari Libur
- [ ] T-13 — Pengajuan Izin
- [ ] T-14 — Approval Izin & Cuti
- [ ] T-15 — Pengajuan Cuti Tahunan
- [ ] T-16 — Manajemen Kuota Cuti

---

### T-12 — Kalender Hari Libur Nasional

| | |
|---|---|
| **Prioritas** | 🟡 MEDIUM |
| **Estimasi** | 1.5 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-01 |
| **Status** | To Do |

**Deskripsi:**
Manajemen kalender hari libur nasional yang digunakan sebagai referensi untuk: kalkulasi hari efektif cuti/izin, generate jadwal kerja, dan validasi pengajuan.

**Endpoints:**

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/hari-libur` | List hari libur (filter: tahun) |
| `POST` | `/api/hari-libur` | Tambah 1 hari libur |
| `POST` | `/api/hari-libur/import` | Bulk import dari file CSV/JSON |
| `DELETE` | `/api/hari-libur/:id` | Hapus hari libur |
| `GET` | `/api/hari-libur/check` | Cek apakah tanggal tertentu hari libur |

**Helper API:**
```
GET /api/hari-libur/check?tanggal=2025-08-17
→ { "isLibur": true, "nama": "HUT Kemerdekaan RI" }

GET /api/hari-libur/hitung-hari-kerja?dari=2025-08-11&sampai=2025-08-15
→ { "totalHariKerja": 3, "harilibur": ["2025-08-15"] }
```

**Format Import CSV:**
```csv
tanggal,nama,is_recurring
2025-01-01,Tahun Baru,false
2025-08-17,HUT Kemerdekaan RI,true
```

**Acceptance Criteria:**
- Import bulk 20 hari libur berhasil dalam 1 request
- Helper `/check` bisa dipakai oleh modul lain (izin, jadwal)
- Seed data hari libur 2025 sudah tersedia

---

### T-13 — Pengajuan Izin

| | |
|---|---|
| **Prioritas** | 🟡 MEDIUM |
| **Estimasi** | 2 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-12 |
| **Status** | To Do |

**Deskripsi:**
API untuk karyawan mengajukan izin sakit atau izin keperluan, lengkap dengan upload lampiran.

**Endpoints:**

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/izin` | Ajukan izin baru |
| `GET` | `/api/izin` | List izin milik karyawan |
| `GET` | `/api/izin/:id` | Detail izin |
| `DELETE` | `/api/izin/:id` | Batalkan izin (hanya jika pending) |

**Request Body:**
```json
{
  "tipeIzin": "izin_sakit",
  "tanggalMulai": "2025-02-10",
  "tanggalSelesai": "2025-02-11",
  "alasan": "Demam dan flu",
  "lampiranFile": "https://storage.../surat_dokter.pdf"
}
```

**Validasi:**
- Tanggal tidak boleh di masa lalu (minimal hari ini)
- Tanggal harus hari kerja (bukan weekend atau hari libur nasional)
- Tidak boleh overlap dengan izin/cuti lain yang sudah disetujui
- Upload lampiran: format PDF/JPG/PNG, maksimal 5MB
- `jumlahHari` dihitung otomatis, exclude weekend dan hari libur

**Hitung Jumlah Hari:**
```
Izin: 10 Feb (Senin) - 14 Feb (Jumat) = 5 hari
Jika 12 Feb adalah hari libur → jumlahHari = 4
```

**Acceptance Criteria:**
- Jumlah hari dihitung otomatis dengan benar
- Validasi overlap berfungsi
- Upload lampiran tersimpan di storage
- Karyawan mendapat notifikasi saat status berubah

---

### T-14 — Approval Izin & Cuti

| | |
|---|---|
| **Prioritas** | 🟡 MEDIUM |
| **Estimasi** | 2 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-13, T-15 |
| **Status** | To Do |

**Deskripsi:**
Alur approval oleh atasan/HRD untuk semua pengajuan izin dan cuti.

**Endpoints:**

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/izin/pending` | List semua pengajuan pending (untuk approver) |
| `PUT` | `/api/izin/:id/approve` | Setujui pengajuan |
| `PUT` | `/api/izin/:id/tolak` | Tolak dengan catatan |

**Request Body Approve:**
```json
{
  "catatanApprover": "Disetujui. Semoga lekas sembuh."
}
```

**Request Body Tolak:**
```json
{
  "catatanApprover": "Mohon lampirkan surat dokter terlebih dahulu."
}
```

**Saat Disetujui (Auto-Process):**
1. Update status → `disetujui`
2. Catat `approvedBy` dan `approvedAt`
3. Auto-create record `absensi_pegawai` untuk setiap hari izin:
   ```
   statusKehadiran = tipeIzin (izin_sakit / cuti_tahunan / dll)
   waktuMasuk = jam kerja normal (dari jadwal)
   ```
4. Jika cuti: trigger update `kuota_cuti` (increment `kuota_diambil`)
5. Kirim notifikasi ke karyawan

**Acceptance Criteria:**
- Record absensi ter-create otomatis untuk setiap hari yang diizinkan
- Kuota cuti ter-update saat pengajuan cuti disetujui
- Notifikasi terkirim (approve maupun tolak)
- Catatan approver wajib diisi saat menolak

---

### T-15 — Pengajuan Cuti Tahunan

| | |
|---|---|
| **Prioritas** | 🟡 MEDIUM |
| **Estimasi** | 2 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-16, T-12 |
| **Status** | To Do |

**Deskripsi:**
API khusus pengajuan cuti tahunan dengan validasi saldo kuota sebelum pengajuan diproses.

**Flow Pengajuan Cuti:**

```
Karyawan ajukan cuti (tanggal, jumlah hari)
          │
Cek saldo: kuota_sisa >= jumlah_hari?
          │
├── Tidak → Tolak: "Saldo cuti tidak mencukupi (sisa: X hari)"
│
└── Ya → Buat record izin_cuti (status: pending)
          Update kuota_pending += jumlah_hari
          Kirim notifikasi ke approver
```

**Tipe Cuti yang Tersedia:**

| Tipe | Keterangan | Potong Kuota |
|---|---|---|
| `cuti_tahunan` | Cuti reguler tahunan | Ya |
| `cuti_melahirkan` | Cuti melahirkan (90 hari) | Tidak |
| `cuti_bersama` | Cuti bersama dari pemerintah | Tidak |
| `cuti_khusus` | Duka, pernikahan (jumlah hari ditentukan kebijakan) | Tergantung kebijakan |

**Acceptance Criteria:**
- Pengajuan ditolak otomatis jika saldo kuota tidak cukup
- `kuota_pending` ter-update saat diajukan
- `kuota_pending` dikembalikan jika ditolak atau dibatalkan
- Saldo sisa ditampilkan dengan akurat

---

### T-16 — Manajemen Kuota Cuti

| | |
|---|---|
| **Prioritas** | 🟡 MEDIUM |
| **Estimasi** | 2 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-01 |
| **Status** | To Do |

**Deskripsi:**
Pengelolaan saldo cuti tahunan per karyawan, termasuk generate otomatis di awal tahun dan penyesuaian manual oleh HRD.

**Endpoints:**

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/kuota-cuti/:userId` | Saldo cuti karyawan (per tahun) |
| `GET` | `/api/kuota-cuti` | Saldo cuti semua karyawan (admin) |
| `POST` | `/api/kuota-cuti/generate` | Generate kuota tahun baru untuk semua karyawan |
| `PUT` | `/api/kuota-cuti/:id` | Adjust manual kuota (HRD only) |

**Response Saldo:**
```json
{
  "tahun": 2025,
  "kuotaTahunan": 12,
  "kuotaDiambil": 3,
  "kuotaPending": 2,
  "kuotaSisa": 7,
  "riwayat": [...]
}
```

**Carry-Over Policy:**
- Sisa cuti tahun lalu bisa ditambahkan ke kuota tahun ini (opsional, per kebijakan)
- Maksimal carry-over: 5 hari (configurable)

**Generate Kuota Tahunan:**
```
POST /api/kuota-cuti/generate
Body: { "tahun": 2025, "kuotaDefault": 12, "carryOver": true }

→ Buat record kuota_cuti untuk semua karyawan aktif
→ Jika carryOver: tambahkan sisa cuti tahun lalu (max 5 hari)
→ Skip karyawan yang sudah punya kuota tahun ini
```

**Acceptance Criteria:**
- Generate massal untuk 200 karyawan < 10 detik
- Carry-over terhitung dengan benar
- Adjustment manual tercatat di audit log dengan alasan

---

## Phase 5 — Penggajian

> **Estimasi:** 13.5 Hari Kerja | **Sprint:** 6 & 7
>
> Engine kalkulasi gaji otomatis berbasis data absensi, dengan output slip gaji yang bisa diekspor ke PDF.

### Checklist Phase 5

- [ ] T-17 — Master Komponen Gaji
- [ ] T-18 — Tunjangan per Karyawan
- [ ] T-19 — Riwayat & Versioning Gaji
- [ ] T-20 — Engine Kalkulasi Gaji
- [ ] T-21 — Generate & Manajemen Slip Gaji

---

### T-17 — Master Komponen Gaji

| | |
|---|---|
| **Prioritas** | 🟡 MEDIUM |
| **Estimasi** | 2 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-01 |
| **Status** | To Do |

**Deskripsi:**
CRUD untuk mengelola komponen-komponen yang membentuk gaji (tunjangan dan potongan). Data seed sudah menyediakan komponen default.

**Endpoints:**

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/komponen-gaji` | List semua komponen aktif |
| `POST` | `/api/komponen-gaji` | Buat komponen baru |
| `PUT` | `/api/komponen-gaji/:id` | Update komponen |
| `DELETE` | `/api/komponen-gaji/:id` | Soft delete (is_active = false) |

**Request Body:**
```json
{
  "nama": "Tunjangan Transport",
  "tipe": "tunjangan",
  "nilai": 500000,
  "isProrate": true,
  "keterangan": "Dihitung proporsional berdasarkan hari hadir"
}
```

**Perbedaan Prorata vs Tetap:**

| Tipe | isProrate | Kalkulasi |
|---|---|---|
| Tunjangan Transport | true | `500.000 × (hadir / total_hari_kerja)` |
| Tunjangan Jabatan | false | `1.000.000` (selalu penuh) |
| BPJS Kesehatan | false | `nilai tetap` (potong selalu) |

**Komponen Default (dari Seed):**
- Tunjangan Transport — Rp 500.000 (prorata)
- Tunjangan Makan — Rp 450.000 (prorata)
- Tunjangan Jabatan — Rp 1.000.000 (tetap)
- BPJS Kesehatan — potong Rp 150.000
- BPJS Ketenagakerjaan — potong Rp 100.000
- PPh 21 — dihitung dinamis

**Acceptance Criteria:**
- CRUD berfungsi lengkap
- Komponen yang sudah dipakai di slip gaji tidak bisa dihapus
- isProrate mempengaruhi kalkulasi di engine gaji

---

### T-18 — Tunjangan per Karyawan

| | |
|---|---|
| **Prioritas** | 🟡 MEDIUM |
| **Estimasi** | 2 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-17 |
| **Status** | To Do |

**Deskripsi:**
Assign komponen gaji/tunjangan spesifik ke karyawan. Karyawan yang berbeda jabatan bisa mendapat tunjangan yang berbeda.

**Endpoints:**

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/tunjangan-pegawai/:userId` | List tunjangan aktif karyawan |
| `POST` | `/api/tunjangan-pegawai` | Assign komponen ke karyawan |
| `PUT` | `/api/tunjangan-pegawai/:id` | Update nilai override atau periode |
| `DELETE` | `/api/tunjangan-pegawai/:id` | Nonaktifkan tunjangan |

**Request Body:**
```json
{
  "userId": "uuid-karyawan",
  "komponenId": "uuid-komponen",
  "nilaiOverride": 750000,
  "berlakuDari": "2025-01-01",
  "berlakuSampai": null
}
```

**Aturan `nilaiOverride`:**
- Jika `nilaiOverride = null` → gunakan nilai dari master `komponen_gaji`
- Jika `nilaiOverride = 750000` → gunakan nilai ini untuk karyawan ini saja

**Use Case:**
```
Manajer A: Tunjangan Jabatan → Rp 2.000.000 (override)
Staff B:   Tunjangan Jabatan → Rp 1.000.000 (dari master)
```

**Acceptance Criteria:**
- Override nilai berfungsi dengan benar saat kalkulasi gaji
- Periode berlaku (berlakuDari/Sampai) diterapkan
- Tidak ada duplikat komponen aktif untuk user yang sama

---

### T-19 — Riwayat & Versioning Gaji

| | |
|---|---|
| **Prioritas** | 🟡 MEDIUM |
| **Estimasi** | 1.5 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-01 |
| **Status** | To Do |

**Deskripsi:**
Simpan riwayat perubahan gaji pokok karyawan untuk memastikan slip gaji historis bisa di-regenerate dengan nilai gaji yang benar saat itu.

**Endpoints:**

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/gaji-pegawai/:userId` | Gaji pokok aktif + riwayat |
| `POST` | `/api/gaji-pegawai` | Set gaji pokok awal karyawan |
| `PUT` | `/api/gaji-pegawai/:userId` | Update gaji (auto-create riwayat) |

**Flow Update Gaji:**
```
PUT /api/gaji-pegawai/:userId
Body: { "gajiPokok": 7000000, "alasan": "Kenaikan tahunan" }

1. Tutup riwayat lama: berlaku_sampai = hari ini - 1
2. Buat riwayat baru: berlaku_dari = hari ini
3. Update gaji_pegawai (tabel aktif)
```

**Penggunaan di Engine Gaji:**
```typescript
// Saat kalkulasi gaji periode Januari 2025
// Ambil gaji yang berlaku DI periode tersebut, bukan gaji saat ini
const gajiAktif = await prisma.riwayatGajiPegawai.findFirst({
  where: {
    userId,
    berlakuDari: { lte: new Date('2025-01-31') },
    OR: [
      { berlakuSampai: null },
      { berlakuSampai: { gte: new Date('2025-01-01') } }
    ]
  }
});
```

**Acceptance Criteria:**
- Riwayat ter-create otomatis setiap kali gaji diubah
- Engine gaji menggunakan gaji yang berlaku di periode, bukan gaji saat ini
- Slip gaji historis bisa di-regenerate dengan nilai yang sama

---

### T-20 — Engine Kalkulasi Gaji

| | |
|---|---|
| **Prioritas** | 🟡 MEDIUM |
| **Estimasi** | 5 Hari |
| **PIC** | Backend Dev (Senior) |
| **Depends On** | T-17, T-18, T-19, T-08, T-06 |
| **Status** | To Do |

**Deskripsi:**
Logika inti untuk menghitung gaji bersih karyawan berdasarkan data absensi bulan berjalan.

**Formula Gaji Bersih:**

```
Gaji Bersih =
  Gaji Pokok
  + Σ Tunjangan Tetap
  + Σ Tunjangan Prorata (nilai × hadir/total_hari_kerja)
  + Upah Lembur (jam_lembur × tarif_lembur)
  - Σ Potongan Tetap (BPJS, dll)
  - Potongan Alpha (jumlah_alpha × tarif_harian)
  - Potongan Terlambat (total_menit × rate/menit)
```

**Rekap Absensi yang Dihitung:**
```typescript
const rekap = {
  totalHariKerja: 22,         // hari kerja bulan ini (exclude weekend & libur)
  totalHadir: 18,             // hari benar-benar hadir
  totalIzin: 2,               // izin sakit + izin keperluan
  totalSakit: 0,
  totalCuti: 1,
  totalAlpha: 1,              // tidak hadir tanpa keterangan
  totalTerlambat: 3,          // berapa kali terlambat
  totalMenitTerlambat: 45,    // total menit keterlambatan
  totalJamKerja: 152.5,       // total jam kerja aktual
  totalJamLembur: 8.0,        // total jam lembur
}
```

**Kalkulasi Detail:**

```typescript
// Tarif harian (untuk potongan alpha)
const tarifHarian = gajiPokok / totalHariKerja;  // = gajiPokok / 22

// Tunjangan prorata
const tunjanganProrata = komponen
  .filter(k => k.tipe === 'tunjangan' && k.isProrate)
  .reduce((sum, k) => sum + (k.nilai * (totalHadir / totalHariKerja)), 0);

// Upah lembur (tarif lembur sudah per jam)
const upahLembur = totalJamLembur * tarifLembur;

// Potongan alpha
const potonganAlpha = totalAlpha * tarifHarian;

// Potongan terlambat (contoh: Rp 1.000 per menit terlambat)
const ratePerMenit = 1000;
const potonganTerlambat = totalMenitTerlambat * ratePerMenit;
```

**Acceptance Criteria:**
- Kalkulasi menghasilkan angka yang konsisten dan bisa diaudit
- Gaji pokok diambil dari riwayat yang berlaku di periode tsb
- Semua komponen tersimpan sebagai snapshot di `slip_gaji_detail`
- Unit test untuk semua skenario edge case (alpha, lembur overnight, dsb)

---

### T-21 — Generate & Manajemen Slip Gaji

| | |
|---|---|
| **Prioritas** | 🟡 MEDIUM |
| **Estimasi** | 3 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-20 |
| **Status** | To Do |

**Deskripsi:**
Endpoint untuk generate, review, finalisasi, dan export slip gaji bulanan.

**Endpoints:**

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/slip-gaji/generate` | Generate slip semua karyawan 1 cabang |
| `POST` | `/api/slip-gaji/generate/:userId` | Generate slip 1 karyawan |
| `GET` | `/api/slip-gaji` | List slip (filter: periode, cabang, status) |
| `GET` | `/api/slip-gaji/:id` | Detail slip + breakdown komponen |
| `PUT` | `/api/slip-gaji/:id/finalize` | Finalize slip (draft → final) |
| `PUT` | `/api/slip-gaji/:id/bayar` | Catat pembayaran (final → terbayar) |
| `GET` | `/api/slip-gaji/:id/pdf` | Export slip gaji ke PDF |

**Status Flow:**
```
draft → (review HRD) → final → (transfer gaji) → terbayar
```

**Generate Request:**
```json
{
  "cabangId": "uuid-cabang",
  "periode": "2025-01",
  "override": false
}
```
> `override: true` → regenerate ulang meski slip sudah ada (hanya untuk status `draft`)

**Response Detail Slip:**
```json
{
  "periode": "2025-01",
  "karyawan": { "nama": "Budi Santoso", "jabatan": "Staff" },
  "rekap": {
    "totalHadir": 20, "totalAlpha": 1, "totalIzin": 1,
    "totalJamLembur": 4.5, "totalTerlambat": 2
  },
  "komponen": [
    { "nama": "Gaji Pokok", "tipe": "tunjangan", "nilai": 5000000 },
    { "nama": "Tunjangan Transport", "tipe": "tunjangan", "nilai": 454545 },
    { "nama": "Upah Lembur", "tipe": "tunjangan", "nilai": 135000 },
    { "nama": "BPJS Kesehatan", "tipe": "potongan", "nilai": 150000 },
    { "nama": "Potongan Alpha", "tipe": "potongan", "nilai": 227272 }
  ],
  "gajiBersih": 5212273
}
```

**Acceptance Criteria:**
- Generate 100 slip gaji sekaligus < 30 detik
- PDF slip gaji terbuat dengan tampilan yang rapi
- Status flow berjalan searah (tidak bisa dari final ke draft)
- Slip final dan terbayar tidak bisa di-regenerate

---

## Phase 6 — Dashboard, Laporan & Otomasi

> **Estimasi:** 11 Hari Kerja | **Sprint:** 8
>
> Visualisasi data untuk pengambilan keputusan, export laporan, dan automasi task berulang.

### Checklist Phase 6

- [ ] T-22 — Notifikasi In-App
- [ ] T-24 — Dashboard Admin
- [ ] T-25 — Dashboard Karyawan
- [ ] T-26 — Laporan Kehadiran
- [ ] T-27 — Laporan Gaji & Payroll
- [ ] T-28 — Cron Jobs & Scheduler
- [ ] T-29 — Testing & QA

---

### T-22 — Notifikasi In-App

| | |
|---|---|
| **Prioritas** | 🟢 LOW |
| **Estimasi** | 3 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-01 |
| **Status** | To Do |

**Deskripsi:**
Sistem notifikasi in-app untuk memberi tahu karyawan dan admin tentang event penting.

**Event Notifikasi:**

| Event | Penerima | Pesan |
|---|---|---|
| `izin_diajukan` | Approver | "Budi mengajukan izin sakit 10-11 Feb" |
| `izin_disetujui` | Karyawan | "Izin Anda tanggal 10-11 Feb telah disetujui" |
| `izin_ditolak` | Karyawan | "Izin Anda ditolak. Alasan: ..." |
| `koreksi_diajukan` | Approver | "Budi mengajukan koreksi absensi 5 Feb" |
| `koreksi_disetujui` | Karyawan | "Koreksi absensi Anda telah disetujui" |
| `slip_gaji_terbit` | Karyawan | "Slip gaji Januari 2025 sudah tersedia" |
| `jadwal_berubah` | Karyawan | "Jadwal kerja Anda tanggal 15 Feb diubah" |
| `pengingat_absensi` | Karyawan | "Anda belum melakukan absensi hari ini" |

**Endpoints:**

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/notifikasi` | List notifikasi user (unread first) |
| `PUT` | `/api/notifikasi/:id/read` | Tandai 1 notifikasi sebagai dibaca |
| `PUT` | `/api/notifikasi/read-all` | Tandai semua sebagai dibaca |
| `GET` | `/api/notifikasi/count` | Jumlah notifikasi belum dibaca |

**Acceptance Criteria:**
- Notifikasi ter-create otomatis di setiap event yang relevan
- Endpoint count dipakai untuk badge icon di mobile
- Cleanup: hapus notifikasi yang sudah dibaca > 30 hari

---

### T-24 — Dashboard Admin & HRD

| | |
|---|---|
| **Prioritas** | 🟢 LOW |
| **Estimasi** | 4 Hari |
| **PIC** | Frontend Dev + Backend Dev |
| **Depends On** | T-15 (Rekap Harian) |
| **Status** | To Do |

**Deskripsi:**
Dashboard real-time untuk HRD dan admin cabang memantau kehadiran dan produktivitas karyawan.

**Widget & Endpoints:**

| Widget | Endpoint | Deskripsi |
|---|---|---|
| Ringkasan Hari Ini | `GET /api/dashboard/hari-ini` | Total hadir/alpha/izin per cabang |
| Belum Absen | `GET /api/dashboard/belum-absen` | List karyawan belum clock-in hari ini |
| Grafik Tren | `GET /api/dashboard/tren?periode=bulan` | Grafik kehadiran 30 hari terakhir |
| Top Terlambat | `GET /api/dashboard/top-terlambat` | 10 karyawan paling sering terlambat bulan ini |
| Rekap Lembur | `GET /api/dashboard/rekap-lembur` | Total jam lembur per cabang |
| Pengajuan Pending | `GET /api/dashboard/pending` | Jumlah izin/koreksi menunggu approval |

**Data Source:**
- Data hari ini → `rekap_absensi_harian` (pre-computed, fast)
- Data historis → query langsung ke `absensi_pegawai` (dengan index)

**Acceptance Criteria:**
- Dashboard load < 2 detik
- Data rekap hari ini akurat (maks delay 1 menit dari trigger)
- Filter by cabang berfungsi

---

### T-25 — Dashboard Karyawan

| | |
|---|---|
| **Prioritas** | 🟢 LOW |
| **Estimasi** | 3 Hari |
| **PIC** | Frontend Dev + Backend Dev |
| **Depends On** | T-16, T-21 |
| **Status** | To Do |

**Deskripsi:**
Halaman home di web app yang menampilkan informasi relevan untuk karyawan.

**Endpoints:**

| Endpoint | Data yang Ditampilkan |
|---|---|
| `GET /api/dashboard/me` | Status absensi hari ini (sudah/belum clock-in) |
| `GET /api/dashboard/me/rekap-bulan` | Rekap kehadiran bulan berjalan |
| `GET /api/dashboard/me/saldo-cuti` | Sisa kuota cuti tahun ini |
| `GET /api/dashboard/me/slip-terbaru` | Slip gaji bulan terakhir |
| `GET /api/dashboard/me/jadwal-minggu-ini` | Jadwal kerja 7 hari ke depan |

**Acceptance Criteria:**
- Semua data menampilkan informasi yang relevan untuk karyawan login
- Status absensi hari ini akurat real-time

---

### T-26 — Laporan Kehadiran

| | |
|---|---|
| **Prioritas** | 🟢 LOW |
| **Estimasi** | 3 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-08, T-10 |
| **Status** | To Do |

**Deskripsi:**
Fitur export rekap kehadiran karyawan dalam format Excel dan PDF.

**Endpoints:**

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/laporan/kehadiran` | Preview rekap (JSON) |
| `GET` | `/api/laporan/kehadiran/export` | Download Excel |
| `GET` | `/api/laporan/kehadiran/export-pdf` | Download PDF |

**Query Params:**
```
?userId=string          → laporan 1 karyawan
?cabangId=string        → laporan semua karyawan 1 cabang
?dari=2025-01-01
&sampai=2025-01-31
&status=alpha         → filter status kehadiran
```

**Kolom Excel:**

| Nama | Tanggal | Hari | Jam Masuk | Jam Keluar | Jam Kerja | Lembur | Status | Keterangan |
|---|---|---|---|---|---|---|---|---|
| Budi Santoso | 01/01 | Rabu | 07:55 | 17:10 | 9.25 | 1.25 | Hadir | - |

**Baris Ringkasan (per karyawan):**
```
Total Hadir: 20 | Alpha: 1 | Izin: 1 | Total Jam Kerja: 165 jam | Total Lembur: 8 jam
```

**Acceptance Criteria:**
- Export Excel berhasil untuk 100 karyawan 1 bulan < 15 detik
- Format tanggal dan angka sesuai standar Indonesia
- Summary row di bagian bawah setiap sheet

---

### T-27 — Laporan Gaji & Payroll

| | |
|---|---|
| **Prioritas** | 🟢 LOW |
| **Estimasi** | 2 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-21 |
| **Status** | To Do |

**Deskripsi:**
Export rekap penggajian untuk keperluan administrasi payroll dan laporan ke manajemen.

**Endpoints:**

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/laporan/payroll` | Preview rekap payroll (JSON) |
| `GET` | `/api/laporan/payroll/export` | Download Excel rekap payroll |

**Kolom Excel Payroll:**

| Nama | Gaji Pokok | Tunjangan | Lembur | Potongan | Gaji Bersih | Status |
|---|---|---|---|---|---|---|
| Budi Santoso | 5.000.000 | 900.000 | 135.000 | 250.000 | 5.785.000 | Terbayar |

**Acceptance Criteria:**
- Total kolom "Gaji Bersih" menampilkan grand total
- Filter by periode dan cabang berfungsi
- Format angka: Rp 5.000.000 (bukan 5000000)

---

### T-28 — Cron Jobs & Scheduler

| | |
|---|---|
| **Prioritas** | 🟢 LOW |
| **Estimasi** | 2 Hari |
| **PIC** | Backend Dev |
| **Depends On** | T-16, T-20, T-22 |
| **Status** | To Do |

**Deskripsi:**
Implementasi background jobs untuk task yang berjalan terjadwal secara otomatis.

**Daftar Cron Jobs:**

| Job | Cron Schedule | Fungsi |
|---|---|---|
| Generate Kuota Cuti | `0 0 1 1 *` | Buat kuota cuti tahun baru untuk semua karyawan aktif |
| Generate Jadwal Bulanan | `0 0 25 * *` | Auto-generate jadwal bulan depan |
| Generate Slip Gaji Draft | `0 23 L * *` | Generate slip gaji draft di akhir bulan |
| Refresh Rekap Harian | `0 * * * *` | Refresh cache rekap_absensi_harian tiap jam |
| Alert Belum Absen | `30 9 * * 1-5` | Kirim notif ke karyawan yang belum clock-in jam 09:30 |
| Cleanup Notifikasi | `0 0 * * 0` | Hapus notifikasi sudah dibaca > 30 hari |
| Expire Device Token | `0 2 * * *` | Nonaktifkan device yang tidak dipakai > 6 bulan |

**Stack yang Direkomendasikan:**
- `BullMQ` + Redis untuk job queue
- `node-cron` untuk trigger scheduler
- Dashboard monitoring: Bull Board / Arena

**Acceptance Criteria:**
- Semua job terdaftar dan bisa dimonitor
- Job gagal otomatis di-retry (max 3x)
- Alert ke tim developer jika job gagal 3x berturut-turut

---

### T-29 — Testing & Quality Assurance

| | |
|---|---|
| **Prioritas** | 🟢 LOW |
| **Estimasi** | 5 Hari |
| **PIC** | QA Engineer + Backend Dev |
| **Depends On** | Semua task selesai |
| **Status** | To Do |

**Deskripsi:**
Pengujian menyeluruh semua fitur sebelum release ke production.

**Scope Testing:**

**Unit Test (Backend):**
- Engine kalkulasi gaji (semua skenario: normal, alpha, lembur, overnight)
- Hitung hari kerja efektif (exclude weekend & libur)
- Deteksi keterlambatan per shift
- Validasi kuota cuti

**Integration Test (API):**
- Flow lengkap absensi: clock-in → clock-out → kalkulasi
- Flow izin: ajukan → approve → absensi ter-create
- Flow cuti: ajukan → cek kuota → approve → kuota berkurang
- Flow gaji: kalkulasi → generate slip → finalize → export PDF

**Performance Test:**
- Generate 100 slip gaji sekaligus < 30 detik
- Dashboard load < 2 detik
- Query laporan 1 bulan, 100 karyawan < 5 detik

**Security Test:**
- Karyawan tidak bisa akses data karyawan lain
- Device binding tidak bisa di-bypass
- Audit log tidak bisa dimanipulasi

**Acceptance Criteria:**
- Code coverage unit test > 80%
- Semua integration test lulus
- Tidak ada critical bug di production readiness check

---

## API Endpoints Summary

### Shift & Jadwal Kerja

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/shifts` | Admin/HRD | List master shift |
| `POST` | `/api/shifts` | Admin | Buat shift baru |
| `PUT` | `/api/shifts/:id` | Admin | Update shift |
| `DELETE` | `/api/shifts/:id` | Admin | Nonaktifkan shift |
| `GET` | `/api/jadwal` | All | List jadwal (filter) |
| `POST` | `/api/jadwal` | Admin/HRD | Buat jadwal 1 hari |
| `POST` | `/api/jadwal/generate` | Admin/HRD | Generate jadwal bulk |
| `PUT` | `/api/jadwal/:id` | Admin/HRD | Update jadwal |
| `DELETE` | `/api/jadwal/:id` | Admin/HRD | Hapus jadwal |

### Keamanan

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/devices` | Karyawan | List device terdaftar |
| `DELETE` | `/api/devices/:id` | Admin | Nonaktifkan device |
| `POST` | `/api/koreksi` | Karyawan | Ajukan koreksi absensi |
| `GET` | `/api/koreksi` | Admin/HRD | List semua pengajuan |
| `PUT` | `/api/koreksi/:id/approve` | Admin/HRD | Setujui koreksi |
| `PUT` | `/api/koreksi/:id/tolak` | Admin/HRD | Tolak koreksi |
| `GET` | `/api/audit-log` | Admin | View audit log |

### Izin & Cuti

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/api/izin` | Karyawan | Ajukan izin |
| `GET` | `/api/izin` | All | List izin |
| `PUT` | `/api/izin/:id/approve` | Admin/HRD | Setujui |
| `PUT` | `/api/izin/:id/tolak` | Admin/HRD | Tolak |
| `DELETE` | `/api/izin/:id` | Karyawan | Batalkan |
| `POST` | `/api/cuti` | Karyawan | Ajukan cuti |
| `GET` | `/api/kuota-cuti/:userId` | All | Saldo cuti |
| `POST` | `/api/kuota-cuti/generate` | Admin | Generate kuota tahunan |
| `GET` | `/api/hari-libur` | All | List hari libur |
| `POST` | `/api/hari-libur/import` | Admin | Import bulk |
| `GET` | `/api/hari-libur/check` | All | Cek tanggal libur |

### Penggajian

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/komponen-gaji` | Admin/HRD | List komponen |
| `POST` | `/api/komponen-gaji` | Admin | Buat komponen |
| `PUT` | `/api/komponen-gaji/:id` | Admin | Update komponen |
| `POST` | `/api/tunjangan-pegawai` | Admin/HRD | Assign tunjangan |
| `GET` | `/api/tunjangan-pegawai/:userId` | Admin/HRD | List tunjangan karyawan |
| `GET` | `/api/gaji-pegawai/:userId` | Admin/HRD | Gaji pokok + riwayat |
| `PUT` | `/api/gaji-pegawai/:userId` | Admin | Update gaji |
| `POST` | `/api/slip-gaji/generate` | Admin/HRD | Generate slip |
| `GET` | `/api/slip-gaji` | All | List slip gaji |
| `GET` | `/api/slip-gaji/:id` | All | Detail slip |
| `PUT` | `/api/slip-gaji/:id/finalize` | HRD | Finalize |
| `GET` | `/api/slip-gaji/:id/pdf` | All | Export PDF |

### Dashboard & Laporan

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/dashboard/hari-ini` | Admin/HRD | Ringkasan kehadiran hari ini |
| `GET` | `/api/dashboard/belum-absen` | Admin/HRD | Karyawan belum absen |
| `GET` | `/api/dashboard/me` | Karyawan | Status absensi saya |
| `GET` | `/api/laporan/kehadiran/export` | Admin/HRD | Export Excel kehadiran |
| `GET` | `/api/laporan/payroll/export` | Admin/HRD | Export Excel payroll |

---

## Dependency Antar Task

```
T-01 Migration ──┬──► T-02 Indexing
                 ├──► T-03 Enum Update
                 ├──► T-04 Prisma Schema
                 ├──► T-05 Master Shift ──► T-06 Jadwal ──► T-07 Deteksi ──► T-08 Lembur
                 ├──► T-09 Device Binding
                 ├──► T-10 Koreksi ────────────────────────────────────────────┐
                 ├──► T-11 Audit Log                                            │
                 ├──► T-12 Kalender Libur ──► T-13 Pengajuan Izin ──► T-14 Approval
                 ├──► T-16 Kuota Cuti ────► T-15 Cuti Tahunan ────► T-14 Approval
                 └──► T-17 Komponen Gaji ──► T-18 Tunjangan ──► T-20 Engine ──► T-21 Slip
                          T-19 Riwayat Gaji ─────────────────┘

T-21 Slip Gaji ──────────────────────────────────────────────► T-27 Laporan Gaji
T-10 Koreksi + T-08 Lembur ──────────────────────────────────► T-26 Laporan Kehadiran
T-22 Notifikasi ─────────────────────────────────────────────► T-23 Push Notification
```

---

## Catatan Teknis

### Kalkulasi Gaji — Formula Lengkap

```
Gaji Bersih =
  [A] Gaji Pokok (dari riwayat yang berlaku di periode ini)
  
+ [B] Tunjangan Tetap (isProrate = false)
      Contoh: Tunjangan Jabatan = nilai penuh

+ [C] Tunjangan Prorata (isProrate = true)
      Contoh: Tunjangan Transport = nilai × (hadir / total_hari_kerja)

+ [D] Upah Lembur
      = total_jam_lembur × tarif_lembur

- [E] Potongan Tetap
      Contoh: BPJS Kesehatan = nilai tetap

- [F] Potongan Alpha
      = jumlah_hari_alpha × (gaji_pokok / total_hari_kerja)

- [G] Potongan Terlambat
      = total_menit_terlambat × rate_per_menit
```

### Shift Overnight — Aturan Penting

```
Shift 3 (22:00 — 06:00 esok hari):

✅ tanggal_absensi = tanggal MASUK (bukan tanggal keluar)
✅ waktu_keluar bisa bertanggal H+1
✅ Jam kerja = waktu_keluar - waktu_masuk (selalu positif)
✅ Jam shift normal = 8 jam

Contoh:
  Masuk:  2025-01-15 22:00
  Keluar: 2025-01-16 06:30
  Jam Kerja = 8.5 jam
  Jam Lembur = 0.5 jam
  tanggal_absensi = 2025-01-15 ✅
```

### Cron Jobs Schedule

| Job | Schedule | Keterangan |
|---|---|---|
| Generate Kuota Cuti | `0 0 1 1 *` | 1 Januari jam 00:00 |
| Generate Jadwal Bulanan | `0 0 25 * *` | Tanggal 25 tiap bulan |
| Generate Slip Gaji Draft | `0 23 L * *` | Hari terakhir bulan jam 23:00 |
| Refresh Rekap Harian | `0 * * * *` | Tiap jam |
| Alert Belum Absen | `30 9 * * 1-5` | Senin-Jumat jam 09:30 |
| Cleanup Notifikasi | `0 0 * * 0` | Minggu jam 00:00 |
| Expire Device Token | `0 2 * * *` | Tiap hari jam 02:00 |

### Stack Rekomendasi

| Layer | Teknologi |
|---|---|
| Runtime | Node.js + Javascript |
| Framework |  Express |
| ORM | Prisma |
| Database | PostgreSQL 15+ |
| Cache | Redis |
| Queue | BullMQ |
| Storage | Supabase |
| PDF Export | Puppeteer atau PDFKit |
| Excel Export | ExcelJS |
| Monitoring | Bull Board + Prometheus |

---

*Dokumen ini bersifat living document dan akan diupdate seiring perkembangan proyek.*

*Versi 1.0.0 — 2025*