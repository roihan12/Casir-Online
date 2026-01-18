/*
  Warnings:

  - You are about to drop the `permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `report_cache` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sales_target` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "report_cache" DROP CONSTRAINT "report_cache_cabang_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permission" DROP CONSTRAINT "role_permission_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permission" DROP CONSTRAINT "role_permission_role_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_target" DROP CONSTRAINT "sales_target_cabang_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_target" DROP CONSTRAINT "sales_target_kategori_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_target" DROP CONSTRAINT "sales_target_produk_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_target" DROP CONSTRAINT "sales_target_user_id_fkey";

-- DropTable
DROP TABLE "permission";

-- DropTable
DROP TABLE "report_cache";

-- DropTable
DROP TABLE "role_permission";

-- DropTable
DROP TABLE "sales_target";
