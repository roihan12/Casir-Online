-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StockTransferStatus" ADD VALUE 'pending_approval';
ALTER TYPE "StockTransferStatus" ADD VALUE 'approved';
ALTER TYPE "StockTransferStatus" ADD VALUE 'rejected';

-- AlterTable
ALTER TABLE "produk" ADD COLUMN     "tanggal_kedaluwarsa" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "stock_transfer" ADD COLUMN     "alasan_reject" TEXT,
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by_id" TEXT,
ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
