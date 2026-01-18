-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('new_product', 'restock');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'completed');

-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('normal', 'urgent', 'critical');

-- CreateEnum
CREATE TYPE "RequestItemStatus" AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- CreateTable
CREATE TABLE "produk_request" (
    "produk_request_id" TEXT NOT NULL,
    "request_type" "RequestType" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'draft',
    "cabang_id" TEXT NOT NULL,
    "request_by_id" TEXT NOT NULL,
    "prioritas" "RequestPriority" NOT NULL DEFAULT 'normal',
    "alasan" TEXT,
    "catatan" TEXT,
    "approved_at" TIMESTAMP(3),
    "approved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produk_request_pkey" PRIMARY KEY ("produk_request_id")
);

-- CreateTable
CREATE TABLE "produk_request_item" (
    "produk_request_item_id" TEXT NOT NULL,
    "produk_request_id" TEXT NOT NULL,
    "produk_master_id" TEXT,
    "nama_produk" VARCHAR(100),
    "sku" VARCHAR(50),
    "barcode" VARCHAR(50),
    "deskripsi" TEXT,
    "kategori_id" TEXT,
    "brand" VARCHAR(100),
    "satuan" VARCHAR(50),
    "berat" DECIMAL(10,2),
    "dimensi_p" DECIMAL(10,2),
    "dimensi_l" DECIMAL(10,2),
    "dimensi_t" DECIMAL(10,2),
    "is_managed_stock" BOOLEAN,
    "has_expired" BOOLEAN,
    "harga_beli" DECIMAL(15,2),
    "harga_jual" DECIMAL(15,2),
    "harga_grosir" DECIMAL(15,2),
    "jumlah_diminta" INTEGER NOT NULL,
    "status_item" "RequestItemStatus" NOT NULL DEFAULT 'pending',
    "jumlah_disetujui" INTEGER,
    "catatan" TEXT,
    "generated_produk_master_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produk_request_item_pkey" PRIMARY KEY ("produk_request_item_id")
);

-- CreateTable
CREATE TABLE "produk_request_attachment" (
    "produk_request_attachment_id" TEXT NOT NULL,
    "produk_request_id" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(255) NOT NULL,
    "is_referensi" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produk_request_attachment_pkey" PRIMARY KEY ("produk_request_attachment_id")
);

-- AddForeignKey
ALTER TABLE "produk_request" ADD CONSTRAINT "produk_request_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_request" ADD CONSTRAINT "produk_request_request_by_id_fkey" FOREIGN KEY ("request_by_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_request" ADD CONSTRAINT "produk_request_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_request_item" ADD CONSTRAINT "produk_request_item_produk_request_id_fkey" FOREIGN KEY ("produk_request_id") REFERENCES "produk_request"("produk_request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_request_item" ADD CONSTRAINT "produk_request_item_produk_master_id_fkey" FOREIGN KEY ("produk_master_id") REFERENCES "produk_master"("produk_master_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_request_item" ADD CONSTRAINT "produk_request_item_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("kategori_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_request_item" ADD CONSTRAINT "produk_request_item_generated_produk_master_id_fkey" FOREIGN KEY ("generated_produk_master_id") REFERENCES "produk_master"("produk_master_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_request_attachment" ADD CONSTRAINT "produk_request_attachment_produk_request_id_fkey" FOREIGN KEY ("produk_request_id") REFERENCES "produk_request"("produk_request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_request_attachment" ADD CONSTRAINT "produk_request_attachment_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
