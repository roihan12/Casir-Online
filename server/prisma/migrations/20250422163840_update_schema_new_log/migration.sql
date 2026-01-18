/*
  Warnings:

  - You are about to drop the column `user_id` on the `pembayaran` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `produk_price_history` table. All the data in the column will be lost.
  - You are about to drop the column `request_by_id` on the `produk_request` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `stock_transfer` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `transaksi` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('whatsapp', 'instagram', 'facebook', 'email', 'sms', 'other');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('post', 'story', 'message', 'advertisement', 'video', 'carousel');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'approved', 'scheduled', 'published', 'rejected');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('view', 'click', 'share', 'comment', 'message', 'conversion');

-- CreateEnum
CREATE TYPE "JenisHutang" AS ENUM ('supplier', 'pelanggan', 'lainnya');

-- CreateEnum
CREATE TYPE "StatusHutang" AS ENUM ('aktif', 'lunas', 'hapus');

-- CreateEnum
CREATE TYPE "StatusKredit" AS ENUM ('aktif', 'nonaktif', 'diblokir');

-- CreateEnum
CREATE TYPE "StatusKreditTransaksi" AS ENUM ('aktif', 'lunas', 'terlambat', 'macet');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('pickup', 'delivery');

-- CreateEnum
CREATE TYPE "PlatformType" AS ENUM ('whatsapp', 'telegram', 'messenger');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('welcome', 'catalog', 'product', 'cart', 'checkout', 'order_confirmation', 'payment', 'delivery', 'custom');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'document', 'location', 'contact', 'interactive', 'template', 'button');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('active', 'idle', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'processing', 'completed', 'cancelled', 'failed');

-- DropForeignKey
ALTER TABLE "pembayaran" DROP CONSTRAINT "pembayaran_user_id_fkey";

-- DropForeignKey
ALTER TABLE "produk_price_history" DROP CONSTRAINT "produk_price_history_user_id_fkey";

-- DropForeignKey
ALTER TABLE "produk_request" DROP CONSTRAINT "produk_request_request_by_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_transfer" DROP CONSTRAINT "stock_transfer_user_id_fkey";

-- DropForeignKey
ALTER TABLE "transaksi" DROP CONSTRAINT "transaksi_user_id_fkey";

-- AlterTable
ALTER TABLE "audit_log" ADD COLUMN     "created_by" VARCHAR(36);

-- AlterTable
ALTER TABLE "kategori" ADD COLUMN     "created_by" VARCHAR(36),
ADD COLUMN     "created_by_user_id" VARCHAR(36),
ADD COLUMN     "deleted_by" VARCHAR(36),
ADD COLUMN     "deleted_by_user_id" VARCHAR(36),
ADD COLUMN     "updated_by" VARCHAR(36),
ADD COLUMN     "updated_by_user_id" VARCHAR(36);

-- AlterTable
ALTER TABLE "pelanggan" ADD COLUMN     "created_by" VARCHAR(36),
ADD COLUMN     "created_by_user_id" VARCHAR(36),
ADD COLUMN     "deleted_by" VARCHAR(36),
ADD COLUMN     "deleted_by_user_id" VARCHAR(36),
ADD COLUMN     "updated_by" VARCHAR(36),
ADD COLUMN     "updated_by_user_id" VARCHAR(36);

-- AlterTable
ALTER TABLE "pembayaran" DROP COLUMN "user_id",
ADD COLUMN     "created_by" VARCHAR(36),
ADD COLUMN     "created_by_user_id" VARCHAR(36),
ADD COLUMN     "deleted_by" VARCHAR(36),
ADD COLUMN     "deleted_by_user_id" VARCHAR(36),
ADD COLUMN     "updated_by" VARCHAR(36),
ADD COLUMN     "updated_by_user_id" VARCHAR(36);

-- AlterTable
ALTER TABLE "produk" ADD COLUMN     "created_by" VARCHAR(36),
ADD COLUMN     "created_by_user_id" VARCHAR(36),
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" VARCHAR(36),
ADD COLUMN     "deleted_by_user_id" VARCHAR(36),
ADD COLUMN     "updated_by" VARCHAR(36),
ADD COLUMN     "updated_by_user_id" VARCHAR(36);

-- AlterTable
ALTER TABLE "produk_master" ADD COLUMN     "created_by" VARCHAR(36),
ADD COLUMN     "created_by_user_id" VARCHAR(36),
ADD COLUMN     "deleted_by" VARCHAR(36),
ADD COLUMN     "deleted_by_user_id" VARCHAR(36),
ADD COLUMN     "updated_by" VARCHAR(36),
ADD COLUMN     "updated_by_user_id" VARCHAR(36);

-- AlterTable
ALTER TABLE "produk_price_history" DROP COLUMN "user_id",
ADD COLUMN     "created_by" VARCHAR(36),
ADD COLUMN     "created_by_user_id" VARCHAR(36),
ADD COLUMN     "deleted_by" VARCHAR(36),
ADD COLUMN     "deleted_by_user_id" VARCHAR(36),
ADD COLUMN     "updated_by" VARCHAR(36),
ADD COLUMN     "updated_by_user_id" VARCHAR(36);

-- AlterTable
ALTER TABLE "produk_request" DROP COLUMN "request_by_id",
ADD COLUMN     "created_by" VARCHAR(36),
ADD COLUMN     "created_by_user_id" VARCHAR(36),
ADD COLUMN     "deleted_by" VARCHAR(36),
ADD COLUMN     "deleted_by_user_id" VARCHAR(36),
ADD COLUMN     "updated_by" VARCHAR(36),
ADD COLUMN     "updated_by_user_id" VARCHAR(36);

-- AlterTable
ALTER TABLE "produk_supplier" ADD COLUMN     "created_by" VARCHAR(36),
ADD COLUMN     "created_by_user_id" VARCHAR(36),
ADD COLUMN     "deleted_by" VARCHAR(36),
ADD COLUMN     "deleted_by_user_id" VARCHAR(36),
ADD COLUMN     "updated_by" VARCHAR(36),
ADD COLUMN     "updated_by_user_id" VARCHAR(36);

-- AlterTable
ALTER TABLE "promo_diskon" ADD COLUMN     "created_by" VARCHAR(36),
ADD COLUMN     "created_by_user_id" VARCHAR(36),
ADD COLUMN     "deleted_by" VARCHAR(36),
ADD COLUMN     "deleted_by_user_id" VARCHAR(36),
ADD COLUMN     "updated_by" VARCHAR(36),
ADD COLUMN     "updated_by_user_id" VARCHAR(36);

-- AlterTable
ALTER TABLE "shift" ADD COLUMN     "created_by" VARCHAR(36),
ADD COLUMN     "created_by_user_id" VARCHAR(36),
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" VARCHAR(36),
ADD COLUMN     "deleted_by_user_id" VARCHAR(36),
ADD COLUMN     "updated_by" VARCHAR(36),
ADD COLUMN     "updated_by_user_id" VARCHAR(36);

-- AlterTable
ALTER TABLE "stock_transfer" DROP COLUMN "user_id",
ADD COLUMN     "created_by" VARCHAR(36),
ADD COLUMN     "created_by_user_id" VARCHAR(36),
ADD COLUMN     "deleted_by" VARCHAR(36),
ADD COLUMN     "deleted_by_user_id" VARCHAR(36),
ADD COLUMN     "updated_by" VARCHAR(36),
ADD COLUMN     "updated_by_user_id" VARCHAR(36);

-- AlterTable
ALTER TABLE "supplier" ADD COLUMN     "created_by" VARCHAR(36),
ADD COLUMN     "created_by_user_id" VARCHAR(36),
ADD COLUMN     "deleted_by" VARCHAR(36),
ADD COLUMN     "deleted_by_user_id" VARCHAR(36),
ADD COLUMN     "updated_by" VARCHAR(36),
ADD COLUMN     "updated_by_user_id" VARCHAR(36);

-- AlterTable
ALTER TABLE "transaksi" DROP COLUMN "user_id",
ADD COLUMN     "campaign_id" TEXT,
ADD COLUMN     "created_by" VARCHAR(36),
ADD COLUMN     "created_by_user_id" VARCHAR(36),
ADD COLUMN     "deleted_by" VARCHAR(36),
ADD COLUMN     "deleted_by_user_id" VARCHAR(36),
ADD COLUMN     "updated_by" VARCHAR(36),
ADD COLUMN     "updated_by_user_id" VARCHAR(36);

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "last_login" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "marketing_campaign" (
    "campaign_id" TEXT NOT NULL,
    "nama_campaign" VARCHAR(100) NOT NULL,
    "deskripsi" TEXT,
    "tanggal_mulai" TIMESTAMP(3) NOT NULL,
    "tanggal_selesai" TIMESTAMP(3),
    "budget" DECIMAL(15,2),
    "budget_terpakai" DECIMAL(15,2),
    "target_audience" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "cabang_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(36),
    "updated_by" VARCHAR(36),
    "deleted_by" VARCHAR(36),
    "deleted_by_user_id" VARCHAR(36),
    "created_by_user_id" VARCHAR(36),
    "updated_by_user_id" VARCHAR(36),

    CONSTRAINT "marketing_campaign_pkey" PRIMARY KEY ("campaign_id")
);

-- CreateTable
CREATE TABLE "marketing_channel" (
    "channel_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "tipeChannel" "ChannelType" NOT NULL,
    "nama_channel" VARCHAR(100) NOT NULL,
    "account_info" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expiry" TIMESTAMP(3),
    "metrics" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_channel_pkey" PRIMARY KEY ("channel_id")
);

-- CreateTable
CREATE TABLE "marketing_content" (
    "content_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "judul" VARCHAR(200),
    "konten" TEXT,
    "image_url" TEXT,
    "video_url" TEXT,
    "content_type" "ContentType" NOT NULL,
    "jadwal_publish" TIMESTAMP(3),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "external_content_id" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(36),
    "updated_by" VARCHAR(36),
    "deleted_by" VARCHAR(36),
    "deleted_by_user_id" VARCHAR(36),
    "created_by_user_id" VARCHAR(36),
    "updated_by_user_id" VARCHAR(36),

    CONSTRAINT "marketing_content_pkey" PRIMARY KEY ("content_id")
);

-- CreateTable
CREATE TABLE "campaign_analytics" (
    "analytics_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "conversions" INTEGER,
    "revenue" DECIMAL(15,2),
    "cost" DECIMAL(15,2),
    "roi" DECIMAL(10,2),
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_analytics_pkey" PRIMARY KEY ("analytics_id")
);

-- CreateTable
CREATE TABLE "content_analytics" (
    "content_analytics_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "shares" INTEGER,
    "comments" INTEGER,
    "reactions" INTEGER,
    "conversion_rate" DECIMAL(5,2),
    "record_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_analytics_pkey" PRIMARY KEY ("content_analytics_id")
);

-- CreateTable
CREATE TABLE "customer_campaign_interaction" (
    "interaction_id" TEXT NOT NULL,
    "pelanggan_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "interaction_type" "InteractionType" NOT NULL,
    "interaction_data" JSONB,
    "interaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lead_to_sale" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_campaign_interaction_pkey" PRIMARY KEY ("interaction_id")
);

-- CreateTable
CREATE TABLE "hutang" (
    "hutang_id" TEXT NOT NULL,
    "transaksi_id" TEXT,
    "nomor_referensi" VARCHAR(50) NOT NULL,
    "tanggal_hutang" TIMESTAMP(3) NOT NULL,
    "jatuh_tempo" TIMESTAMP(3) NOT NULL,
    "jumlah_total" DECIMAL(15,2) NOT NULL,
    "jumlah_bayar" DECIMAL(15,2) NOT NULL,
    "sisa_hutang" DECIMAL(15,2) NOT NULL,
    "jenisHutang" "JenisHutang" NOT NULL,
    "statusHutang" "StatusHutang" NOT NULL DEFAULT 'aktif',
    "keterangan" TEXT,
    "cabang_id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "pelanggan_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(36),
    "updated_by" VARCHAR(36),
    "deleted_by" VARCHAR(36),
    "deleted_by_user_id" VARCHAR(36),
    "created_by_user_id" VARCHAR(36),
    "updated_by_user_id" VARCHAR(36),

    CONSTRAINT "hutang_pkey" PRIMARY KEY ("hutang_id")
);

-- CreateTable
CREATE TABLE "pembayaran_hutang" (
    "pembayaran_hutang_id" TEXT NOT NULL,
    "hutang_id" TEXT NOT NULL,
    "tanggal_bayar" TIMESTAMP(3) NOT NULL,
    "jumlah_bayar" DECIMAL(15,2) NOT NULL,
    "metodePembayaran" "MetodePembayaran" NOT NULL,
    "nomor_referensi" VARCHAR(50),
    "bukti_url" TEXT,
    "keterangan" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(36),
    "updated_by" VARCHAR(36),
    "deleted_by" VARCHAR(36),
    "deleted_by_user_id" VARCHAR(36),
    "created_by_user_id" VARCHAR(36),
    "updated_by_user_id" VARCHAR(36),

    CONSTRAINT "pembayaran_hutang_pkey" PRIMARY KEY ("pembayaran_hutang_id")
);

-- CreateTable
CREATE TABLE "kredit_setting" (
    "kredit_setting_id" TEXT NOT NULL,
    "pelanggan_id" TEXT NOT NULL,
    "limit_kredit" DECIMAL(15,2) NOT NULL,
    "tenor_maksimal" INTEGER NOT NULL,
    "bunga_per_bulan" DECIMAL(5,2),
    "biaya_admin" DECIMAL(15,2),
    "statusKredit" "StatusKredit" NOT NULL DEFAULT 'aktif',
    "disetujui_oleh" TEXT,
    "tanggal_disetujui" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(36),
    "updated_by" VARCHAR(36),
    "deleted_by" VARCHAR(36),
    "deleted_by_user_id" VARCHAR(36),
    "created_by_user_id" VARCHAR(36),
    "updated_by_user_id" VARCHAR(36),

    CONSTRAINT "kredit_setting_pkey" PRIMARY KEY ("kredit_setting_id")
);

-- CreateTable
CREATE TABLE "kredit_transaksi" (
    "kredit_transaksi_id" TEXT NOT NULL,
    "transaksi_id" TEXT NOT NULL,
    "kredit_setting_id" TEXT NOT NULL,
    "jumlah_kredit" DECIMAL(15,2) NOT NULL,
    "tenor" INTEGER NOT NULL,
    "bunga" DECIMAL(15,2),
    "biaya_admin" DECIMAL(15,2),
    "total_bayar" DECIMAL(15,2) NOT NULL,
    "angsuran_per_bulan" DECIMAL(15,2) NOT NULL,
    "tanggal_mulai" TIMESTAMP(3) NOT NULL,
    "tanggal_jatuh_tempo" TIMESTAMP(3) NOT NULL,
    "statusKredit" "StatusKreditTransaksi" NOT NULL DEFAULT 'aktif',
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(36),
    "updated_by" VARCHAR(36),
    "deleted_by" VARCHAR(36),
    "deleted_by_user_id" VARCHAR(36),
    "created_by_user_id" VARCHAR(36),
    "updated_by_user_id" VARCHAR(36),

    CONSTRAINT "kredit_transaksi_pkey" PRIMARY KEY ("kredit_transaksi_id")
);

-- CreateTable
CREATE TABLE "pembayaran_kredit" (
    "pembayaran_kredit_id" TEXT NOT NULL,
    "kredit_transaksi_id" TEXT NOT NULL,
    "angsuran_ke" INTEGER NOT NULL,
    "jumlah_bayar" DECIMAL(15,2) NOT NULL,
    "tanggal_bayar" TIMESTAMP(3) NOT NULL,
    "metodePembayaran" "MetodePembayaran" NOT NULL,
    "nomor_referensi" VARCHAR(50),
    "bukti_url" TEXT,
    "denda" DECIMAL(15,2),
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(36),
    "updated_by" VARCHAR(36),
    "deleted_by" VARCHAR(36),
    "deleted_by_user_id" VARCHAR(36),
    "created_by_user_id" VARCHAR(36),
    "updated_by_user_id" VARCHAR(36),

    CONSTRAINT "pembayaran_kredit_pkey" PRIMARY KEY ("pembayaran_kredit_id")
);

-- CreateTable
CREATE TABLE "operational_hours" (
    "id" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "open_time" TEXT NOT NULL,
    "close_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_order" (
    "bot_order_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "bot_config_id" TEXT NOT NULL,
    "transaksi_id" TEXT,
    "order_status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "order_data" JSONB NOT NULL,
    "delivery_method" "DeliveryMethod" NOT NULL DEFAULT 'pickup',
    "delivery_address" TEXT,
    "delivery_notes" TEXT,
    "delivery_fee" DECIMAL(10,2),
    "delivery_distance" DECIMAL(10,2),
    "scheduled_time" TIMESTAMP(3),
    "estimated_arrival" TIMESTAMP(3),
    "courier_name" VARCHAR(100),
    "courier_phone" VARCHAR(20),
    "courier_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_order_pkey" PRIMARY KEY ("bot_order_id")
);

-- CreateTable
CREATE TABLE "bot_config" (
    "bot_config_id" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "platform_type" "PlatformType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "api_key" VARCHAR(255),
    "api_secret" VARCHAR(255),
    "phone_number" VARCHAR(20),
    "webhook_url" VARCHAR(255),
    "welcome_message" TEXT,
    "catalog_message" TEXT,
    "order_message" TEXT,
    "thank_you_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_config_pkey" PRIMARY KEY ("bot_config_id")
);

-- CreateTable
CREATE TABLE "bot_template" (
    "template_id" TEXT NOT NULL,
    "bot_config_id" TEXT NOT NULL,
    "template_name" VARCHAR(100) NOT NULL,
    "template_content" TEXT NOT NULL,
    "template_type" "TemplateType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_template_pkey" PRIMARY KEY ("template_id")
);

-- CreateTable
CREATE TABLE "bot_session" (
    "session_id" TEXT NOT NULL,
    "bot_config_id" TEXT NOT NULL,
    "pelanggan_id" TEXT,
    "platform_user_id" VARCHAR(100) NOT NULL,
    "session_data" JSONB,
    "cart_data" JSONB,
    "last_interaction" TIMESTAMP(3) NOT NULL,
    "session_status" "SessionStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_session_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "bot_message" (
    "message_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "message_type" "MessageType" NOT NULL,
    "message_content" TEXT NOT NULL,
    "media_url" VARCHAR(255),
    "is_from_bot" BOOLEAN NOT NULL DEFAULT true,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_message_pkey" PRIMARY KEY ("message_id")
);

-- AddForeignKey
ALTER TABLE "kategori" ADD CONSTRAINT "kategori_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kategori" ADD CONSTRAINT "kategori_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kategori" ADD CONSTRAINT "kategori_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_diskon" ADD CONSTRAINT "promo_diskon_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_diskon" ADD CONSTRAINT "promo_diskon_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_diskon" ADD CONSTRAINT "promo_diskon_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift" ADD CONSTRAINT "shift_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift" ADD CONSTRAINT "shift_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift" ADD CONSTRAINT "shift_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelanggan" ADD CONSTRAINT "pelanggan_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelanggan" ADD CONSTRAINT "pelanggan_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelanggan" ADD CONSTRAINT "pelanggan_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_master" ADD CONSTRAINT "produk_master_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_master" ADD CONSTRAINT "produk_master_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_master" ADD CONSTRAINT "produk_master_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk" ADD CONSTRAINT "produk_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk" ADD CONSTRAINT "produk_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk" ADD CONSTRAINT "produk_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_supplier" ADD CONSTRAINT "produk_supplier_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_supplier" ADD CONSTRAINT "produk_supplier_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_supplier" ADD CONSTRAINT "produk_supplier_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_price_history" ADD CONSTRAINT "produk_price_history_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_price_history" ADD CONSTRAINT "produk_price_history_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_price_history" ADD CONSTRAINT "produk_price_history_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaign"("campaign_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_request" ADD CONSTRAINT "produk_request_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_request" ADD CONSTRAINT "produk_request_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_request" ADD CONSTRAINT "produk_request_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaign" ADD CONSTRAINT "marketing_campaign_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaign" ADD CONSTRAINT "marketing_campaign_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaign" ADD CONSTRAINT "marketing_campaign_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaign" ADD CONSTRAINT "marketing_campaign_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_channel" ADD CONSTRAINT "marketing_channel_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaign"("campaign_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_content" ADD CONSTRAINT "marketing_content_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_content" ADD CONSTRAINT "marketing_content_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_content" ADD CONSTRAINT "marketing_content_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_content" ADD CONSTRAINT "marketing_content_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaign"("campaign_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_content" ADD CONSTRAINT "marketing_content_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "marketing_channel"("channel_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_analytics" ADD CONSTRAINT "campaign_analytics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaign"("campaign_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_analytics" ADD CONSTRAINT "content_analytics_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "marketing_content"("content_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_campaign_interaction" ADD CONSTRAINT "customer_campaign_interaction_pelanggan_id_fkey" FOREIGN KEY ("pelanggan_id") REFERENCES "pelanggan"("pelanggan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_campaign_interaction" ADD CONSTRAINT "customer_campaign_interaction_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaign"("campaign_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hutang" ADD CONSTRAINT "hutang_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hutang" ADD CONSTRAINT "hutang_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hutang" ADD CONSTRAINT "hutang_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hutang" ADD CONSTRAINT "hutang_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hutang" ADD CONSTRAINT "hutang_pelanggan_id_fkey" FOREIGN KEY ("pelanggan_id") REFERENCES "pelanggan"("pelanggan_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hutang" ADD CONSTRAINT "hutang_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("supplier_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hutang" ADD CONSTRAINT "hutang_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "transaksi"("transaksi_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran_hutang" ADD CONSTRAINT "pembayaran_hutang_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran_hutang" ADD CONSTRAINT "pembayaran_hutang_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran_hutang" ADD CONSTRAINT "pembayaran_hutang_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran_hutang" ADD CONSTRAINT "pembayaran_hutang_hutang_id_fkey" FOREIGN KEY ("hutang_id") REFERENCES "hutang"("hutang_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran_hutang" ADD CONSTRAINT "pembayaran_hutang_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kredit_setting" ADD CONSTRAINT "kredit_setting_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kredit_setting" ADD CONSTRAINT "kredit_setting_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kredit_setting" ADD CONSTRAINT "kredit_setting_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kredit_setting" ADD CONSTRAINT "kredit_setting_pelanggan_id_fkey" FOREIGN KEY ("pelanggan_id") REFERENCES "pelanggan"("pelanggan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kredit_setting" ADD CONSTRAINT "kredit_setting_disetujui_oleh_fkey" FOREIGN KEY ("disetujui_oleh") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kredit_transaksi" ADD CONSTRAINT "kredit_transaksi_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kredit_transaksi" ADD CONSTRAINT "kredit_transaksi_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kredit_transaksi" ADD CONSTRAINT "kredit_transaksi_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kredit_transaksi" ADD CONSTRAINT "kredit_transaksi_kredit_setting_id_fkey" FOREIGN KEY ("kredit_setting_id") REFERENCES "kredit_setting"("kredit_setting_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kredit_transaksi" ADD CONSTRAINT "kredit_transaksi_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "transaksi"("transaksi_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran_kredit" ADD CONSTRAINT "pembayaran_kredit_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran_kredit" ADD CONSTRAINT "pembayaran_kredit_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran_kredit" ADD CONSTRAINT "pembayaran_kredit_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran_kredit" ADD CONSTRAINT "pembayaran_kredit_kredit_transaksi_id_fkey" FOREIGN KEY ("kredit_transaksi_id") REFERENCES "kredit_transaksi"("kredit_transaksi_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_hours" ADD CONSTRAINT "operational_hours_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_order" ADD CONSTRAINT "bot_order_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "bot_session"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_order" ADD CONSTRAINT "bot_order_bot_config_id_fkey" FOREIGN KEY ("bot_config_id") REFERENCES "bot_config"("bot_config_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_order" ADD CONSTRAINT "bot_order_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "transaksi"("transaksi_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_config" ADD CONSTRAINT "bot_config_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_template" ADD CONSTRAINT "bot_template_bot_config_id_fkey" FOREIGN KEY ("bot_config_id") REFERENCES "bot_config"("bot_config_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_session" ADD CONSTRAINT "bot_session_bot_config_id_fkey" FOREIGN KEY ("bot_config_id") REFERENCES "bot_config"("bot_config_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_session" ADD CONSTRAINT "bot_session_pelanggan_id_fkey" FOREIGN KEY ("pelanggan_id") REFERENCES "pelanggan"("pelanggan_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_message" ADD CONSTRAINT "bot_message_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "bot_session"("session_id") ON DELETE CASCADE ON UPDATE CASCADE;
