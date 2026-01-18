/*
  Warnings:

  - Changed the type of `reference_type` on the `inventory_movement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "inventory_movement" DROP COLUMN "reference_type",
ADD COLUMN     "reference_type" VARCHAR NOT NULL;

-- AlterTable
ALTER TABLE "transaksi" ALTER COLUMN "jenis_transaksi" SET DATA TYPE VARCHAR;
