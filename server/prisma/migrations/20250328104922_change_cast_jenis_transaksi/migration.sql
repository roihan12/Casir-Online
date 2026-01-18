/*
  Warnings:

  - Changed the type of `jenis_transaksi` on the `transaksi` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "transaksi" DROP COLUMN "jenis_transaksi",
ADD COLUMN     "jenis_transaksi" VARCHAR(36) NOT NULL;
