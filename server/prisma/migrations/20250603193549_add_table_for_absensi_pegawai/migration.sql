-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('create', 'read', 'update', 'delete', 'manage');

-- CreateEnum
CREATE TYPE "JenisNotifikasiKredit" AS ENUM ('jatuh_tempo', 'pengingat', 'keterlambatan', 'pelunasan');

-- CreateEnum
CREATE TYPE "StatusNotifikasi" AS ENUM ('belum_dikirim', 'terkirim', 'gagal', 'dibaca');

-- CreateEnum
CREATE TYPE "MetodePengiriman" AS ENUM ('sms', 'email', 'whatsapp', 'push_notification');

-- CreateEnum
CREATE TYPE "StatusPersetujuan" AS ENUM ('pending', 'disetujui', 'ditolak');

-- CreateEnum
CREATE TYPE "StatusKehadiran" AS ENUM ('hadir', 'terlambat', 'izin', 'sakit', 'cuti', 'tanpa_keterangan', 'lembur');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "face_data_json" TEXT,
ADD COLUMN     "face_image_url" VARCHAR(255),
ADD COLUMN     "face_recognition_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_face_update" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "permissions" (
    "permission_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "module" VARCHAR(50) NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_permission_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_permission_id")
);

-- CreateTable
CREATE TABLE "kredit_notifikasi" (
    "kredit_notifikasi_id" TEXT NOT NULL,
    "kredit_transaksi_id" TEXT NOT NULL,
    "pelanggan_id" TEXT NOT NULL,
    "angsuran_ke" INTEGER NOT NULL,
    "jumlah_tagihan" DECIMAL(15,2) NOT NULL,
    "tanggal_jatuh_tempo" TIMESTAMP(3) NOT NULL,
    "jenisNotifikasi" "JenisNotifikasiKredit" NOT NULL,
    "statusNotifikasi" "StatusNotifikasi" NOT NULL DEFAULT 'belum_dikirim',
    "tanggal_kirim" TIMESTAMP(3),
    "metodePengiriman" "MetodePengiriman"[],
    "pesan_notifikasi" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kredit_notifikasi_pkey" PRIMARY KEY ("kredit_notifikasi_id")
);

-- CreateTable
CREATE TABLE "kredit_rekomendasi" (
    "kredit_rekomendasi_id" TEXT NOT NULL,
    "pelanggan_id" TEXT NOT NULL,
    "skor_kredit" INTEGER NOT NULL,
    "limit_kredit" DECIMAL(15,2) NOT NULL,
    "tenor_maksimal" INTEGER NOT NULL,
    "bunga_per_bulan" DECIMAL(5,2),
    "biaya_admin" DECIMAL(15,2),
    "status_persetujuan" "StatusPersetujuan" NOT NULL DEFAULT 'pending',
    "disetujui_oleh" TEXT,
    "tanggal_disetujui" TIMESTAMP(3),
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(36),
    "updated_by" VARCHAR(36),
    "deleted_by" VARCHAR(36),
    "deleted_by_user_id" VARCHAR(36),
    "created_by_user_id" VARCHAR(36),
    "updated_by_user_id" VARCHAR(36),

    CONSTRAINT "kredit_rekomendasi_pkey" PRIMARY KEY ("kredit_rekomendasi_id")
);

-- CreateTable
CREATE TABLE "opsi_pembayaran_kredit" (
    "opsi_pembayaran_id" TEXT NOT NULL,
    "rekomendasi_id" TEXT NOT NULL,
    "jangka_waktu" INTEGER NOT NULL,
    "jumlah_cicilan" INTEGER,
    "minimum_bayar" DECIMAL(15,2),
    "bunga_per_bulan" DECIMAL(5,2),
    "biaya_admin" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opsi_pembayaran_kredit_pkey" PRIMARY KEY ("opsi_pembayaran_id")
);

-- CreateTable
CREATE TABLE "absensi_pegawai" (
    "absensi_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "lokasi_absensi_id" TEXT,
    "tanggal_absensi" DATE NOT NULL,
    "waktu_masuk" TIMESTAMP(3) NOT NULL,
    "waktu_keluar" TIMESTAMP(3),
    "statusKehadiran" "StatusKehadiran" NOT NULL DEFAULT 'hadir',
    "keterangan" TEXT,
    "lokasi_masuk" TEXT,
    "lokasi_keluar" TEXT,
    "latitude_masuk" DECIMAL(10,8),
    "longitude_masuk" DECIMAL(11,8),
    "latitude_keluar" DECIMAL(10,8),
    "longitude_keluar" DECIMAL(11,8),
    "foto_masuk" TEXT,
    "foto_keluar" TEXT,
    "face_recognition_masuk" BOOLEAN NOT NULL DEFAULT false,
    "face_recognition_keluar" BOOLEAN NOT NULL DEFAULT false,
    "face_match_score_masuk" DECIMAL(5,2),
    "face_match_score_keluar" DECIMAL(5,2),
    "shift_id" TEXT,
    "jam_kerja" DECIMAL(5,2),
    "is_lembur" BOOLEAN NOT NULL DEFAULT false,
    "jam_lembur" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "absensi_pegawai_pkey" PRIMARY KEY ("absensi_id")
);

-- CreateTable
CREATE TABLE "jadwal_kerja" (
    "jadwal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "tanggal_mulai" DATE NOT NULL,
    "tanggal_selesai" DATE NOT NULL,
    "jam_masuk" TEXT NOT NULL,
    "jam_keluar" TEXT NOT NULL,
    "hari_kerja" TEXT[],
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(36),
    "updated_by" VARCHAR(36),

    CONSTRAINT "jadwal_kerja_pkey" PRIMARY KEY ("jadwal_id")
);

-- CreateTable
CREATE TABLE "lokasi_absensi" (
    "lokasi_id" TEXT NOT NULL,
    "nama_lokasi" VARCHAR(100) NOT NULL,
    "alamat" TEXT,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "radius" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "require_face_recognition" BOOLEAN NOT NULL DEFAULT false,
    "min_face_match_score" DECIMAL(5,2),
    "cabang_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(36),
    "updated_by" VARCHAR(36),

    CONSTRAINT "lokasi_absensi_pkey" PRIMARY KEY ("lokasi_id")
);

-- CreateTable
CREATE TABLE "user_lokasi_absensi" (
    "user_lokasi_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lokasi_id" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_lokasi_absensi_pkey" PRIMARY KEY ("user_lokasi_id")
);

-- CreateTable
CREATE TABLE "_CabangToUserLokasiAbsensi" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CabangToUserLokasiAbsensi_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_lokasi_absensi_user_id_lokasi_id_key" ON "user_lokasi_absensi"("user_id", "lokasi_id");

-- CreateIndex
CREATE INDEX "_CabangToUserLokasiAbsensi_B_index" ON "_CabangToUserLokasiAbsensi"("B");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("permission_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kredit_notifikasi" ADD CONSTRAINT "kredit_notifikasi_kredit_transaksi_id_fkey" FOREIGN KEY ("kredit_transaksi_id") REFERENCES "kredit_transaksi"("kredit_transaksi_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kredit_notifikasi" ADD CONSTRAINT "kredit_notifikasi_pelanggan_id_fkey" FOREIGN KEY ("pelanggan_id") REFERENCES "pelanggan"("pelanggan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kredit_rekomendasi" ADD CONSTRAINT "kredit_rekomendasi_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kredit_rekomendasi" ADD CONSTRAINT "kredit_rekomendasi_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kredit_rekomendasi" ADD CONSTRAINT "kredit_rekomendasi_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kredit_rekomendasi" ADD CONSTRAINT "kredit_rekomendasi_pelanggan_id_fkey" FOREIGN KEY ("pelanggan_id") REFERENCES "pelanggan"("pelanggan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kredit_rekomendasi" ADD CONSTRAINT "kredit_rekomendasi_disetujui_oleh_fkey" FOREIGN KEY ("disetujui_oleh") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opsi_pembayaran_kredit" ADD CONSTRAINT "opsi_pembayaran_kredit_rekomendasi_id_fkey" FOREIGN KEY ("rekomendasi_id") REFERENCES "kredit_rekomendasi"("kredit_rekomendasi_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi_pegawai" ADD CONSTRAINT "absensi_pegawai_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi_pegawai" ADD CONSTRAINT "absensi_pegawai_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi_pegawai" ADD CONSTRAINT "absensi_pegawai_lokasi_absensi_id_fkey" FOREIGN KEY ("lokasi_absensi_id") REFERENCES "lokasi_absensi"("lokasi_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi_pegawai" ADD CONSTRAINT "absensi_pegawai_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shift"("shift_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_kerja" ADD CONSTRAINT "jadwal_kerja_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_kerja" ADD CONSTRAINT "jadwal_kerja_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lokasi_absensi" ADD CONSTRAINT "lokasi_absensi_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lokasi_absensi" ADD CONSTRAINT "user_lokasi_absensi_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lokasi_absensi" ADD CONSTRAINT "user_lokasi_absensi_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "lokasi_absensi"("lokasi_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CabangToUserLokasiAbsensi" ADD CONSTRAINT "_CabangToUserLokasiAbsensi_A_fkey" FOREIGN KEY ("A") REFERENCES "cabang"("cabang_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CabangToUserLokasiAbsensi" ADD CONSTRAINT "_CabangToUserLokasiAbsensi_B_fkey" FOREIGN KEY ("B") REFERENCES "user_lokasi_absensi"("user_lokasi_id") ON DELETE CASCADE ON UPDATE CASCADE;
