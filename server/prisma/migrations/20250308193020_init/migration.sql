-- CreateEnum
CREATE TYPE "JenisTransaksi" AS ENUM ('PENJUALAN', 'PEMBELIAN', 'RETUR_PENJUALAN', 'RETUR_PEMBELIAN');

-- CreateEnum
CREATE TYPE "StatusPembayaran" AS ENUM ('LUNAS', 'BELUM_LUNAS', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "MetodePembayaran" AS ENUM ('TUNAI', 'KARTU_DEBIT', 'KARTU_KREDIT', 'TRANSFER', 'QRIS', 'E_WALLET');

-- CreateEnum
CREATE TYPE "StatusPembayaranProvider" AS ENUM ('SUKSES', 'GAGAL', 'PENDING');

-- CreateEnum
CREATE TYPE "CabangStatus" AS ENUM ('aktif', 'nonaktif');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('aktif', 'nonaktif');

-- CreateEnum
CREATE TYPE "KategoriStatus" AS ENUM ('aktif', 'nonaktif');

-- CreateEnum
CREATE TYPE "PromoDiskonStatus" AS ENUM ('aktif', 'nonaktif');

-- CreateEnum
CREATE TYPE "TipeDiskon" AS ENUM ('persentase', 'nominal', 'bogo', 'bundle');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('dibuka', 'ditutup', 'disesuaikan');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('aktif', 'nonaktif');

-- CreateEnum
CREATE TYPE "PelangganStatus" AS ENUM ('aktif', 'nonaktif');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('pria', 'wanita', 'lainnya');

-- CreateEnum
CREATE TYPE "SegmenPelanggan" AS ENUM ('retail', 'grosir', 'vip');

-- CreateEnum
CREATE TYPE "ProdukMasterStatus" AS ENUM ('aktif', 'nonaktif');

-- CreateEnum
CREATE TYPE "ProdukStatus" AS ENUM ('tersedia', 'tidak_tersedia');

-- CreateEnum
CREATE TYPE "TipeHarga" AS ENUM ('beli', 'jual', 'grosir');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('penjualan', 'pembelian', 'retur', 'adjustment', 'transfer');

-- CreateEnum
CREATE TYPE "StockTransferStatus" AS ENUM ('draft', 'dikirim', 'diterima', 'dibatalkan');

-- CreateTable
CREATE TABLE "cabang" (
    "cabang_id" TEXT NOT NULL,
    "nama_cabang" VARCHAR(100) NOT NULL,
    "alamat" TEXT,
    "telepon" VARCHAR(20),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "radius_geofence" INTEGER,
    "status" "CabangStatus" NOT NULL DEFAULT 'aktif',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cabang_pkey" PRIMARY KEY ("cabang_id")
);

-- CreateTable
CREATE TABLE "user" (
    "user_id" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "nama_lengkap" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "telepon" VARCHAR(20),
    "avatar_url" VARCHAR(255),
    "status" "UserStatus" NOT NULL DEFAULT 'aktif',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_cabang" (
    "user_cabang_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_cabang_pkey" PRIMARY KEY ("user_cabang_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "role_id" TEXT NOT NULL,
    "nama_role" VARCHAR(50) NOT NULL,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_role_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_role_id")
);

-- CreateTable
CREATE TABLE "permission" (
    "permission_id" TEXT NOT NULL,
    "nama_permission" VARCHAR(100) NOT NULL,
    "kode_permission" VARCHAR(50) NOT NULL,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "role_permission_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_permission_id")
);

-- CreateTable
CREATE TABLE "user_session" (
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "last_activity" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_session_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "kategori" (
    "kategori_id" TEXT NOT NULL,
    "parent_kategori_id" TEXT,
    "nama_kategori" VARCHAR(100) NOT NULL,
    "deskripsi" TEXT,
    "level" INTEGER,
    "urutan" INTEGER,
    "status" "KategoriStatus" NOT NULL DEFAULT 'aktif',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kategori_pkey" PRIMARY KEY ("kategori_id")
);

-- CreateTable
CREATE TABLE "promo_diskon" (
    "promo_id" TEXT NOT NULL,
    "nama_promo" VARCHAR(100) NOT NULL,
    "kode_promo" VARCHAR(50) NOT NULL,
    "tipe_diskon" "TipeDiskon" NOT NULL,
    "nilai_diskon" DECIMAL(15,2) NOT NULL,
    "min_pembelian" DECIMAL(15,2),
    "max_diskon" DECIMAL(15,2),
    "tanggal_mulai" DATE,
    "tanggal_berakhir" DATE,
    "limit_penggunaan" INTEGER,
    "kategori_id" TEXT,
    "produk_id" TEXT,
    "cabang_id" TEXT,
    "status" "PromoDiskonStatus" NOT NULL DEFAULT 'aktif',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_diskon_pkey" PRIMARY KEY ("promo_id")
);

-- CreateTable
CREATE TABLE "shift" (
    "shift_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "waktu_mulai" TIMESTAMP(3) NOT NULL,
    "waktu_selesai" TIMESTAMP(3),
    "kas_awal" DECIMAL(15,2) NOT NULL,
    "kas_akhir" DECIMAL(15,2),
    "total_transaksi" INTEGER,
    "total_pendapatan" DECIMAL(15,2),
    "keterangan" TEXT,
    "status" "ShiftStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_pkey" PRIMARY KEY ("shift_id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "supplier_id" TEXT NOT NULL,
    "nama_supplier" VARCHAR(100) NOT NULL,
    "alamat" TEXT,
    "telepon" VARCHAR(20),
    "email" VARCHAR(100),
    "npwp" VARCHAR(50),
    "pic_nama" VARCHAR(100),
    "pic_kontak" VARCHAR(50),
    "status" "SupplierStatus" NOT NULL DEFAULT 'aktif',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("supplier_id")
);

-- CreateTable
CREATE TABLE "pelanggan" (
    "pelanggan_id" TEXT NOT NULL,
    "nama_pelanggan" VARCHAR(100) NOT NULL,
    "alamat" TEXT,
    "telepon" VARCHAR(20),
    "email" VARCHAR(100),
    "tanggal_lahir" DATE,
    "gender" "Gender",
    "poin" INTEGER,
    "segmen" "SegmenPelanggan",
    "status" "PelangganStatus" NOT NULL DEFAULT 'aktif',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pelanggan_pkey" PRIMARY KEY ("pelanggan_id")
);

-- CreateTable
CREATE TABLE "produk_master" (
    "produk_master_id" TEXT NOT NULL,
    "nama_produk" VARCHAR(100) NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "barcode" VARCHAR(50),
    "deskripsi" TEXT,
    "kategori_id" TEXT,
    "brand" VARCHAR(100),
    "satuan" VARCHAR(50),
    "berat" DECIMAL(10,2),
    "dimensi_p" DECIMAL(10,2),
    "dimensi_l" DECIMAL(10,2),
    "dimensi_t" DECIMAL(10,2),
    "is_managed_stock" BOOLEAN,
    "has_expired" BOOLEAN,
    "status" "ProdukMasterStatus" NOT NULL DEFAULT 'aktif',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produk_master_pkey" PRIMARY KEY ("produk_master_id")
);

-- CreateTable
CREATE TABLE "produk" (
    "produk_id" TEXT NOT NULL,
    "produk_master_id" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "harga_beli" DECIMAL(15,2) NOT NULL,
    "harga_jual" DECIMAL(15,2) NOT NULL,
    "harga_grosir" DECIMAL(15,2),
    "stok" INTEGER,
    "min_stok" INTEGER,
    "max_stok" INTEGER,
    "lokasi_rak" VARCHAR(50),
    "status" "ProdukStatus" NOT NULL DEFAULT 'tersedia',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produk_pkey" PRIMARY KEY ("produk_id")
);

-- CreateTable
CREATE TABLE "produk_supplier" (
    "produk_supplier_id" TEXT NOT NULL,
    "produk_master_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "harga_beli" DECIMAL(15,2) NOT NULL,
    "min_pembelian" INTEGER,
    "lead_time" INTEGER,
    "kode_produk_supplier" VARCHAR(100),
    "status" "SupplierStatus" NOT NULL DEFAULT 'aktif',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produk_supplier_pkey" PRIMARY KEY ("produk_supplier_id")
);

-- CreateTable
CREATE TABLE "produk_price_history" (
    "history_id" TEXT NOT NULL,
    "produk_id" TEXT NOT NULL,
    "tipe_harga" "TipeHarga" NOT NULL,
    "harga_lama" DECIMAL(15,2) NOT NULL,
    "harga_baru" DECIMAL(15,2) NOT NULL,
    "tanggal_perubahan" TIMESTAMP(3) NOT NULL,
    "alasan_perubahan" TEXT,
    "supplier_id" TEXT,
    "dokumen_referensi" VARCHAR(100),
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produk_price_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateTable
CREATE TABLE "produk_image" (
    "image_id" TEXT NOT NULL,
    "produk_master_id" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(255) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "urutan" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produk_image_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "inventory_movement" (
    "movement_id" TEXT NOT NULL,
    "produk_id" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "reference_type" "ReferenceType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "batch_number" VARCHAR(100),
    "expired_date" DATE,
    "keterangan" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movement_pkey" PRIMARY KEY ("movement_id")
);

-- CreateTable
CREATE TABLE "stock_transfer" (
    "transfer_id" TEXT NOT NULL,
    "nomor_transfer" VARCHAR(50) NOT NULL,
    "cabang_asal_id" TEXT NOT NULL,
    "cabang_tujuan_id" TEXT NOT NULL,
    "tanggal_kirim" TIMESTAMP(3),
    "tanggal_terima" TIMESTAMP(3),
    "status" "StockTransferStatus" NOT NULL DEFAULT 'draft',
    "keterangan" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transfer_pkey" PRIMARY KEY ("transfer_id")
);

-- CreateTable
CREATE TABLE "stock_transfer_detail" (
    "transfer_detail_id" TEXT NOT NULL,
    "transfer_id" TEXT NOT NULL,
    "produk_id" TEXT NOT NULL,
    "jumlah_kirim" INTEGER NOT NULL,
    "jumlah_terima" INTEGER,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transfer_detail_pkey" PRIMARY KEY ("transfer_detail_id")
);

-- CreateTable
CREATE TABLE "transaksi" (
    "transaksi_id" VARCHAR(36) NOT NULL,
    "cabang_id" VARCHAR(36),
    "nomor_transaksi" VARCHAR(50) NOT NULL,
    "jenis_transaksi" "JenisTransaksi" NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "pelanggan_id" VARCHAR(36),
    "supplier_id" VARCHAR(36),
    "user_id" VARCHAR(36),
    "shift_id" VARCHAR(36),
    "promo_id" VARCHAR(36),
    "subtotal" DECIMAL(15,2) NOT NULL,
    "diskon" DECIMAL(15,2) NOT NULL,
    "pajak" DECIMAL(15,2) NOT NULL,
    "biaya_tambahan" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "status_pembayaran" "StatusPembayaran" NOT NULL,
    "keterangan" TEXT,
    "deleted_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "transaksi_pkey" PRIMARY KEY ("transaksi_id")
);

-- CreateTable
CREATE TABLE "pembayaran" (
    "pembayaran_id" VARCHAR(36) NOT NULL,
    "transaksi_id" VARCHAR(36) NOT NULL,
    "metode_pembayaran" "MetodePembayaran" NOT NULL,
    "provider" VARCHAR(50),
    "nomor_referensi" VARCHAR(100),
    "jumlah_bayar" DECIMAL(15,2) NOT NULL,
    "jumlah_kembali" DECIMAL(15,2) NOT NULL,
    "tanggal_pembayaran" TIMESTAMP(3) NOT NULL,
    "bukti_bayar_url" VARCHAR(255),
    "user_id" VARCHAR(36),
    "status" "StatusPembayaranProvider" NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "pembayaran_pkey" PRIMARY KEY ("pembayaran_id")
);

-- CreateTable
CREATE TABLE "transaksi_detail" (
    "transaksi_detail_id" VARCHAR(36) NOT NULL,
    "transaksi_id" VARCHAR(36) NOT NULL,
    "produk_id" VARCHAR(36) NOT NULL,
    "batch_number" VARCHAR(100),
    "expired_date" DATE,
    "jumlah" INTEGER NOT NULL,
    "harga_satuan" DECIMAL(15,2) NOT NULL,
    "diskon_persen" DECIMAL(5,2) NOT NULL,
    "diskon_nominal" DECIMAL(15,2) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "pajak_persen" DECIMAL(5,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "transaksi_detail_pkey" PRIMARY KEY ("transaksi_detail_id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "log_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36),
    "ip_address" VARCHAR(45),
    "action" VARCHAR(100) NOT NULL,
    "table_name" VARCHAR(100) NOT NULL,
    "record_id" VARCHAR(36),
    "old_values" TEXT,
    "new_values" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "sales_target" (
    "target_id" VARCHAR(36) NOT NULL,
    "cabang_id" VARCHAR(36),
    "user_id" VARCHAR(36),
    "kategori_id" VARCHAR(36),
    "produk_id" VARCHAR(36),
    "periode_bulan" INTEGER NOT NULL,
    "periode_tahun" INTEGER NOT NULL,
    "target_penjualan" DECIMAL(15,2) NOT NULL,
    "target_keuntungan" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "sales_target_pkey" PRIMARY KEY ("target_id")
);

-- CreateTable
CREATE TABLE "report_cache" (
    "cache_id" VARCHAR(36) NOT NULL,
    "report_name" VARCHAR(100) NOT NULL,
    "params" TEXT,
    "data_json" TEXT,
    "cabang_id" VARCHAR(36),
    "periode_from" DATE,
    "periode_to" DATE,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expired_at" TIMESTAMP,

    CONSTRAINT "report_cache_pkey" PRIMARY KEY ("cache_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nama_role_key" ON "roles"("nama_role");

-- CreateIndex
CREATE UNIQUE INDEX "permission_nama_permission_key" ON "permission"("nama_permission");

-- CreateIndex
CREATE UNIQUE INDEX "permission_kode_permission_key" ON "permission"("kode_permission");

-- CreateIndex
CREATE UNIQUE INDEX "kategori_nama_kategori_key" ON "kategori"("nama_kategori");

-- CreateIndex
CREATE UNIQUE INDEX "promo_diskon_kode_promo_key" ON "promo_diskon"("kode_promo");

-- CreateIndex
CREATE UNIQUE INDEX "produk_master_sku_key" ON "produk_master"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfer_nomor_transfer_key" ON "stock_transfer"("nomor_transfer");

-- CreateIndex
CREATE UNIQUE INDEX "transaksi_nomor_transaksi_key" ON "transaksi"("nomor_transaksi");

-- AddForeignKey
ALTER TABLE "user_cabang" ADD CONSTRAINT "user_cabang_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_cabang" ADD CONSTRAINT "user_cabang_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("permission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kategori" ADD CONSTRAINT "kategori_parent_kategori_id_fkey" FOREIGN KEY ("parent_kategori_id") REFERENCES "kategori"("kategori_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_diskon" ADD CONSTRAINT "promo_diskon_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("kategori_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_diskon" ADD CONSTRAINT "promo_diskon_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk_master"("produk_master_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_diskon" ADD CONSTRAINT "promo_diskon_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift" ADD CONSTRAINT "shift_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift" ADD CONSTRAINT "shift_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_master" ADD CONSTRAINT "produk_master_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("kategori_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk" ADD CONSTRAINT "produk_produk_master_id_fkey" FOREIGN KEY ("produk_master_id") REFERENCES "produk_master"("produk_master_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk" ADD CONSTRAINT "produk_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_supplier" ADD CONSTRAINT "produk_supplier_produk_master_id_fkey" FOREIGN KEY ("produk_master_id") REFERENCES "produk_master"("produk_master_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_supplier" ADD CONSTRAINT "produk_supplier_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("supplier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_price_history" ADD CONSTRAINT "produk_price_history_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("produk_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_price_history" ADD CONSTRAINT "produk_price_history_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("supplier_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_price_history" ADD CONSTRAINT "produk_price_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_image" ADD CONSTRAINT "produk_image_produk_master_id_fkey" FOREIGN KEY ("produk_master_id") REFERENCES "produk_master"("produk_master_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("produk_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_cabang_asal_id_fkey" FOREIGN KEY ("cabang_asal_id") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_cabang_tujuan_id_fkey" FOREIGN KEY ("cabang_tujuan_id") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_detail" ADD CONSTRAINT "stock_transfer_detail_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "stock_transfer"("transfer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_detail" ADD CONSTRAINT "stock_transfer_detail_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("produk_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_pelanggan_id_fkey" FOREIGN KEY ("pelanggan_id") REFERENCES "pelanggan"("pelanggan_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("supplier_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shift"("shift_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_promo_id_fkey" FOREIGN KEY ("promo_id") REFERENCES "promo_diskon"("promo_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "transaksi"("transaksi_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi_detail" ADD CONSTRAINT "transaksi_detail_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "transaksi"("transaksi_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi_detail" ADD CONSTRAINT "transaksi_detail_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("produk_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_target" ADD CONSTRAINT "sales_target_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_target" ADD CONSTRAINT "sales_target_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_target" ADD CONSTRAINT "sales_target_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("kategori_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_target" ADD CONSTRAINT "sales_target_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("produk_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cache" ADD CONSTRAINT "report_cache_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE SET NULL ON UPDATE CASCADE;
