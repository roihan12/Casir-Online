-- AlterTable
ALTER TABLE "pelanggan" ADD COLUMN     "cabang_id" VARCHAR(36);

-- AlterTable
ALTER TABLE "supplier" ADD COLUMN     "cabang_id" VARCHAR(36);

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelanggan" ADD CONSTRAINT "pelanggan_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE SET NULL ON UPDATE CASCADE;
