/*
  Warnings:

  - You are about to drop the column `lokasi_rak` on the `produk` table. All the data in the column will be lost.
  - Added the required column `cabang_id` to the `inventory_movement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cabang_id` to the `produk_price_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "inventory_movement" ADD COLUMN     "cabang_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "produk" DROP COLUMN "lokasi_rak";

-- AlterTable
ALTER TABLE "produk_price_history" ADD COLUMN     "cabang_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "produk_price_history" ADD CONSTRAINT "produk_price_history_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;
