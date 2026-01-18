-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LOW_STOCK', 'EXPIRING_STOCK', 'STOCK_OUT', 'OVERSTOCK');

-- CreateTable
CREATE TABLE "notification_config" (
    "config_id" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "low_stock_threshold_days" INTEGER NOT NULL DEFAULT 7,
    "expiry_threshold_days" INTEGER NOT NULL DEFAULT 30,
    "enable_email_notification" BOOLEAN NOT NULL DEFAULT true,
    "enable_app_notification" BOOLEAN NOT NULL DEFAULT true,
    "email_recipients" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_config_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "stock_notification" (
    "notification_id" TEXT NOT NULL,
    "config_id" TEXT NOT NULL,
    "produk_id" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "stock_notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "receipt_config" (
    "id" TEXT NOT NULL,
    "cabangId" TEXT NOT NULL,
    "headerText" TEXT NOT NULL,
    "footerText" TEXT NOT NULL,
    "showTaxDetails" BOOLEAN NOT NULL DEFAULT true,
    "showCashierName" BOOLEAN NOT NULL DEFAULT true,
    "printPaperWidth" INTEGER NOT NULL DEFAULT 80,
    "printAutomatically" BOOLEAN NOT NULL DEFAULT false,
    "thankYouMessage" TEXT,
    "address" TEXT,
    "phoneNumber" TEXT,
    "showQrCode" BOOLEAN NOT NULL DEFAULT true,
    "logoUrl" TEXT,
    "customCss" TEXT,
    "fontSize" INTEGER DEFAULT 12,
    "language" TEXT DEFAULT 'id',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_config_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notification_config" ADD CONSTRAINT "notification_config_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_notification" ADD CONSTRAINT "stock_notification_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "notification_config"("config_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_notification" ADD CONSTRAINT "stock_notification_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("produk_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_notification" ADD CONSTRAINT "stock_notification_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_config" ADD CONSTRAINT "receipt_config_cabangId_fkey" FOREIGN KEY ("cabangId") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;
