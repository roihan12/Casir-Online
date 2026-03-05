-- Migration: Create invoice table
-- Created: 2025-02-04
-- Description: Create invoice table for managing transaction invoices

-- Create invoice table
CREATE TABLE IF NOT EXISTS invoice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_invoice VARCHAR(50) UNIQUE NOT NULL,
    tanggal_invoice TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tanggal_jatuh_tempo TIMESTAMP WITH TIME ZONE,
    total DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'BELUM_LUNAS' CHECK (status IN ('DRAFT', 'BELUM_LUNAS', 'LUNAS', 'BATAL')),
    catatan TEXT,
    transaksi_id VARCHAR(36) UNIQUE NOT NULL,
    cabang_id VARCHAR(36) NOT NULL,
    pelanggan_id VARCHAR(36),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Foreign key constraints
    CONSTRAINT fk_invoice_transaksi
        FOREIGN KEY (transaksi_id)
        REFERENCES transaksi(transaksi_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_invoice_cabang
        FOREIGN KEY (cabang_id)
        REFERENCES cabang(cabang_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_invoice_pelanggan
        FOREIGN KEY (pelanggan_id)
        REFERENCES pelanggan(pelanggan_id)
        ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invoice_cabang_id ON invoice(cabang_id);
CREATE INDEX IF NOT EXISTS idx_invoice_pelanggan_id ON invoice(pelanggan_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoice(status);
CREATE INDEX IF NOT EXISTS idx_invoice_tanggal ON invoice(tanggal_invoice);

-- Create comment for documentation
COMMENT ON TABLE invoice IS 'Table untuk menyimpan invoice/Tagihan transaksi';
COMMENT ON COLUMN invoice.id IS 'Primary key invoice';
COMMENT ON COLUMN invoice.nomor_invoice IS 'Nomor invoice unik (format: INV-YYMMDD-XXX)';
COMMENT ON COLUMN invoice.tanggal_invoice IS 'Tanggal pembuatan invoice';
COMMENT ON COLUMN invoice.tanggal_jatuh_tempo IS 'Tanggal jatuh tempo pembayaran';
COMMENT ON COLUMN invoice.total IS 'Total nilai invoice';
COMMENT ON COLUMN invoice.status IS 'Status invoice: DRAFT, BELUM_LUNAS, LUNAS, BATAL';
COMMENT ON COLUMN invoice.catatan IS 'Catatan tambahan untuk invoice';
COMMENT ON COLUMN invoice.transaksi_id IS 'Foreign key ke transaksi (satu transaksi satu invoice)';
COMMENT ON COLUMN invoice.cabang_id IS 'Foreign key ke cabang';
COMMENT ON COLUMN invoice.pelanggan_id IS 'Foreign key ke pelanggan (opsional)';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_invoice_updated_at
    BEFORE UPDATE ON invoice
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_updated_at();
