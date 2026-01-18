/*
  Warnings:

  - Changed the type of `metode_pembayaran` on the `pembayaran` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "pembayaran" DROP COLUMN "metode_pembayaran",
ADD COLUMN     "metode_pembayaran" VARCHAR(50) NOT NULL;
