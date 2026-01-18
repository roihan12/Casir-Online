/*
  Warnings:

  - You are about to drop the column `isi` on the `produk_master` table. All the data in the column will be lost.
  - You are about to drop the column `short_description` on the `produk_master` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "produk_master" DROP COLUMN "isi",
DROP COLUMN "short_description";
