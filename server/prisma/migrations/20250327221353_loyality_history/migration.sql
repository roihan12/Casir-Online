-- CreateTable
CREATE TABLE "loyalty_point_history" (
    "loyalty_point_history_id" TEXT NOT NULL,
    "pelanggan_id" VARCHAR(36) NOT NULL,
    "transaksi_id" VARCHAR(36),
    "point_sebelumnya" INTEGER NOT NULL DEFAULT 0,
    "point_didapatkan" INTEGER NOT NULL DEFAULT 0,
    "point_akhir" INTEGER NOT NULL DEFAULT 0,
    "keterangan" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_point_history_pkey" PRIMARY KEY ("loyalty_point_history_id")
);

-- AddForeignKey
ALTER TABLE "loyalty_point_history" ADD CONSTRAINT "loyalty_point_history_pelanggan_id_fkey" FOREIGN KEY ("pelanggan_id") REFERENCES "pelanggan"("pelanggan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_point_history" ADD CONSTRAINT "loyalty_point_history_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "transaksi"("transaksi_id") ON DELETE SET NULL ON UPDATE CASCADE;
