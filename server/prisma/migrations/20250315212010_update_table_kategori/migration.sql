/*
  Warnings:

  - You are about to drop the column `level` on the `kategori` table. All the data in the column will be lost.
  - You are about to drop the column `parent_kategori_id` on the `kategori` table. All the data in the column will be lost.
  - You are about to drop the column `urutan` on the `kategori` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "kategori" DROP CONSTRAINT "kategori_parent_kategori_id_fkey";

-- AlterTable
ALTER TABLE "kategori" DROP COLUMN "level",
DROP COLUMN "parent_kategori_id",
DROP COLUMN "urutan";
