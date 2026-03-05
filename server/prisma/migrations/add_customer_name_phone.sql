-- ========================================
-- Add customer_name and customer_phone to transaksi table
-- ========================================

ALTER TABLE transaksi ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100);
ALTER TABLE transaksi ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
