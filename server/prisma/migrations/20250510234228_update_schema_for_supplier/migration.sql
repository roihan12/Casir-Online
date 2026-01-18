-- AlterTable
ALTER TABLE "produk_supplier" ADD COLUMN     "cabang_id" TEXT;

-- AddForeignKey
ALTER TABLE "produk_supplier" ADD CONSTRAINT "produk_supplier_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE SET NULL ON UPDATE CASCADE;
