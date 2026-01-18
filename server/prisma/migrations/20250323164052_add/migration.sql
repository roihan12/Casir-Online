-- CreateTable
CREATE TABLE "tax_config" (
    "tax_config_id" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "is_tax_enabled" BOOLEAN NOT NULL DEFAULT false,
    "tax_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax_name" TEXT NOT NULL DEFAULT 'PPN',
    "tax_number" TEXT NOT NULL DEFAULT '',
    "is_tax_included" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_config_pkey" PRIMARY KEY ("tax_config_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tax_config_cabang_id_key" ON "tax_config"("cabang_id");

-- AddForeignKey
ALTER TABLE "tax_config" ADD CONSTRAINT "tax_config_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("cabang_id") ON DELETE RESTRICT ON UPDATE CASCADE;
