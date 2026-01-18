/*
  Warnings:

  - Changed the type of `status_pembayaran` on the `transaksi` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "transaksi" DROP COLUMN "status_pembayaran",
ADD COLUMN     "status_pembayaran" VARCHAR(50) NOT NULL;

-- CreateTable
CREATE TABLE "loyalty_config" (
    "loyalty_config_id" TEXT NOT NULL,
    "cabang_id" VARCHAR(36),
    "point_rate" INTEGER NOT NULL DEFAULT 10000,
    "minimum_transaction" DECIMAL(15,2),
    "expiry_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "redeem_rules" JSONB,
    "tier_rules" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_config_pkey" PRIMARY KEY ("loyalty_config_id")
);

-- AddForeignKey
ALTER TABLE "loyalty_config" ADD CONSTRAINT "loyalty_config_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE SET NULL ON UPDATE CASCADE;
