-- Test cases for create_transaksi function
-- This script demonstrates sample calls for both PENJUALAN (sales) and PEMBELIAN (purchase) transactions

-- ==========================================
-- TEST CASE 1: PENJUALAN (SALES TRANSACTION)
-- ==========================================

-- Variables for PENJUALAN test
DO $$
DECLARE
    v_cabang_id VARCHAR := '0b094b3c-1b5a-4e6e-9d42-519fc0bff3f0'; -- Replace with actual cabang_id
    v_pelanggan_id VARCHAR := 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; -- Replace with actual pelanggan_id (optional)
    v_shift_id VARCHAR := '9e27e01c-c1e5-4a4f-a846-0b24f1df933d'; -- Replace with actual shift_id
    v_user_id VARCHAR := 'd2a57081-faa5-45b3-877d-874cd172136f'; -- Replace with actual user_id
    v_user_name VARCHAR := 'Kasir Test';
    v_ip_address VARCHAR := '127.0.0.1';
    v_transaksi_id UUID;
    v_details JSONB;
BEGIN
    -- Sample product details for PENJUALAN
    v_details := '[
        {
            "produk_id": "3a7e4050-d67a-4e4a-b3f8-756dc82cf35a",
            "jumlah": 2,
            "harga_satuan": 50000,
            "diskon_persen": 0,
            "batch_number": "BATCH123"
        },
        {
            "produk_id": "9c6a5f8e-1b3d-4c0a-8f6b-91e87d5b1c5d",
            "jumlah": 1,
            "harga_satuan": 75000,
            "diskon_persen": 10,
            "batch_number": "BATCH456"
        }
    ]';

    -- Execute the PENJUALAN transaction using positional parameters
    SELECT create_transaksi(
        v_cabang_id,             -- p_cabang_id
        'PENJUALAN',             -- p_jenis_transaksi
        NOW(),                   -- p_tanggal
        v_pelanggan_id,          -- p_pelanggan_id
        NULL,                    -- p_supplier_id
        v_shift_id,              -- p_shift_id
        NULL,                    -- p_promo_id
        v_details,               -- p_details
        5000,                    -- p_biaya_tambahan (Delivery fee, service charge, etc.)
        'Test penjualan dengan create_transaksi function', -- p_keterangan
        '{"nama":"Customer Walk-in", "telepon":"081234567890"}'::jsonb, -- p_customer_info
        v_user_id,               -- p_user_id
        v_ip_address,            -- p_ip_address
        v_user_name,             -- p_user_name
        'TUNAI'                  -- p_metode_pembayaran
    ) INTO v_transaksi_id;

    RAISE NOTICE 'PENJUALAN transaksi created with ID: %', v_transaksi_id;

END $$;

-- ==========================================
-- TEST CASE 2: PEMBELIAN (PURCHASE TRANSACTION)
-- ==========================================

-- Variables for PEMBELIAN test
DO $$
DECLARE
    v_cabang_id VARCHAR := '0b094b3c-1b5a-4e6e-9d42-519fc0bff3f0'; -- Replace with actual cabang_id
    v_supplier_id VARCHAR := '21f7f8de-8051-4938-8d8a-0f98672d06ex'; -- Replace with actual supplier_id
    v_user_id VARCHAR := 'd2a57081-faa5-45b3-877d-874cd172136f'; -- Replace with actual user_id
    v_user_name VARCHAR := 'Admin Pembelian';
    v_ip_address VARCHAR := '127.0.0.1';
    v_transaksi_id UUID;
    v_details JSONB;
BEGIN
    -- Sample product details for PEMBELIAN
    v_details := '[
        {
            "produk_id": "3a7e4050-d67a-4e4a-b3f8-756dc82cf35a",
            "produk_supplier_id": "f12e6a3b-28c0-4a60-94b2-6f0e43a28c01",
            "jumlah": 10,
            "harga_satuan": 30000,
            "diskon_nominal": 10000,
            "batch_number": "SUP-BATCH123",
            "expired_date": "2024-12-31"
        },
        {
            "produk_id": "9c6a5f8e-1b3d-4c0a-8f6b-91e87d5b1c5d",
            "produk_supplier_id": "7f8a3e42-5d91-4b67-ae3c-18c6b542d9a7",
            "jumlah": 15,
            "harga_satuan": 45000,
            "diskon_persen": 5,
            "batch_number": "SUP-BATCH456",
            "expired_date": "2025-06-30"
        }
    ]';

    -- Execute the PEMBELIAN transaction using positional parameters
    SELECT create_transaksi(
        v_cabang_id,             -- p_cabang_id
        'PEMBELIAN',             -- p_jenis_transaksi
        NOW(),                   -- p_tanggal
        NULL,                    -- p_pelanggan_id
        v_supplier_id,           -- p_supplier_id
        NULL,                    -- p_shift_id
        NULL,                    -- p_promo_id
        v_details,               -- p_details
        20000,                   -- p_biaya_tambahan (Additional fees like shipping, etc.)
        'Test pembelian dengan create_transaksi function', -- p_keterangan
        NULL,                    -- p_customer_info
        v_user_id,               -- p_user_id
        v_ip_address,            -- p_ip_address
        v_user_name,             -- p_user_name
        'HUTANG'                 -- p_metode_pembayaran
    ) INTO v_transaksi_id;

    RAISE NOTICE 'PEMBELIAN transaksi created with ID: %', v_transaksi_id;

END $$;

-- ==========================================
-- TEST CASE 3: RETUR_PENJUALAN (SALES RETURN)
-- ==========================================

DO $$
DECLARE
    v_cabang_id VARCHAR := '0b094b3c-1b5a-4e6e-9d42-519fc0bff3f0'; -- Replace with actual cabang_id
    v_pelanggan_id VARCHAR := 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; -- Replace with actual pelanggan_id
    v_user_id VARCHAR := 'd2a57081-faa5-45b3-877d-874cd172136f'; -- Replace with actual user_id
    v_user_name VARCHAR := 'Admin Retur';
    v_ip_address VARCHAR := '127.0.0.1';
    v_transaksi_id UUID;
    v_details JSONB;
BEGIN
    -- Sample product details for RETUR_PENJUALAN
    v_details := '[
        {
            "produk_id": "3a7e4050-d67a-4e4a-b3f8-756dc82cf35a",
            "jumlah": 1,
            "harga_satuan": 50000,
            "diskon_persen": 0,
            "batch_number": "BATCH123"
        }
    ]';

    -- Execute the RETUR_PENJUALAN transaction using positional parameters
    SELECT create_transaksi(
        v_cabang_id,             -- p_cabang_id
        'RETUR_PENJUALAN',       -- p_jenis_transaksi
        NOW(),                   -- p_tanggal
        v_pelanggan_id,          -- p_pelanggan_id
        NULL,                    -- p_supplier_id
        NULL,                    -- p_shift_id
        NULL,                    -- p_promo_id
        v_details,               -- p_details
        0,                       -- p_biaya_tambahan
        'Test retur penjualan - Barang rusak', -- p_keterangan
        NULL,                    -- p_customer_info
        v_user_id,               -- p_user_id
        v_ip_address,            -- p_ip_address
        v_user_name,             -- p_user_name
        'TUNAI'                  -- p_metode_pembayaran
    ) INTO v_transaksi_id;

    RAISE NOTICE 'RETUR_PENJUALAN transaksi created with ID: %', v_transaksi_id;

END $$;

-- ==========================================
-- TEST CASE 4: RETUR_PEMBELIAN (PURCHASE RETURN)
-- ==========================================

DO $$
DECLARE
    v_cabang_id VARCHAR := '0b094b3c-1b5a-4e6e-9d42-519fc0bff3f0'; -- Replace with actual cabang_id
    v_supplier_id VARCHAR := '21f7f8de-8051-4938-8d8a-0f98672d06ex'; -- Replace with actual supplier_id
    v_user_id VARCHAR := 'd2a57081-faa5-45b3-877d-874cd172136f'; -- Replace with actual user_id
    v_user_name VARCHAR := 'Admin Retur';
    v_ip_address VARCHAR := '127.0.0.1';
    v_transaksi_id UUID;
    v_details JSONB;
BEGIN
    -- Sample product details for RETUR_PEMBELIAN
    v_details := '[
        {
            "produk_id": "3a7e4050-d67a-4e4a-b3f8-756dc82cf35a",
            "produk_supplier_id": "f12e6a3b-28c0-4a60-94b2-6f0e43a28c01",
            "jumlah": 2,
            "harga_satuan": 30000,
            "diskon_nominal": 0,
            "batch_number": "SUP-BATCH123"
        }
    ]';

    -- Execute the RETUR_PEMBELIAN transaction using positional parameters
    SELECT create_transaksi(
        v_cabang_id,             -- p_cabang_id
        'RETUR_PEMBELIAN',       -- p_jenis_transaksi
        NOW(),                   -- p_tanggal
        NULL,                    -- p_pelanggan_id
        v_supplier_id,           -- p_supplier_id
        NULL,                    -- p_shift_id
        NULL,                    -- p_promo_id
        v_details,               -- p_details
        0,                       -- p_biaya_tambahan
        'Test retur pembelian - Kualitas tidak sesuai', -- p_keterangan
        NULL,                    -- p_customer_info
        v_user_id,               -- p_user_id
        v_ip_address,            -- p_ip_address
        v_user_name,             -- p_user_name
        'TRANSFER'               -- p_metode_pembayaran
    ) INTO v_transaksi_id;

    RAISE NOTICE 'RETUR_PEMBELIAN transaksi created with ID: %', v_transaksi_id;

END $$;

-- ==========================================
-- TEST CASE 5: Simple single-line examples
-- ==========================================

-- Simple example of PENJUALAN (sales) in one line for quick testing
-- SELECT create_transaksi('0b094b3c-1b5a-4e6e-9d42-519fc0bff3f0', 'PENJUALAN', NOW(), NULL, NULL, NULL, NULL, 
--    '[{"produk_id":"3a7e4050-d67a-4e4a-b3f8-756dc82cf35a", "jumlah":1, "harga_satuan":50000, "diskon_persen":0}]'::jsonb, 
--    0, 'Simple test sale', NULL, 'd2a57081-faa5-45b3-877d-874cd172136f', '127.0.0.1', 'Test User', 'TUNAI');

-- Simple example of PEMBELIAN (purchase) in one line for quick testing
-- SELECT create_transaksi('0b094b3c-1b5a-4e6e-9d42-519fc0bff3f0', 'PEMBELIAN', NOW(), NULL, '21f7f8de-8051-4938-8d8a-0f98672d06ex', NULL, NULL, 
--    '[{"produk_id":"3a7e4050-d67a-4e4a-b3f8-756dc82cf35a", "jumlah":5, "harga_satuan":30000, "diskon_nominal":0}]'::jsonb, 
--    0, 'Simple test purchase', NULL, 'd2a57081-faa5-45b3-877d-874cd172136f', '127.0.0.1', 'Test User', 'TRANSFER');

-- Note: Before running these test cases:
-- 1. Replace the UUIDs with actual valid IDs from your database
-- 2. Ensure the products exist and have sufficient stock for sales/returns
-- 3. Make sure the specified cabang, pelanggan, supplier, and user exist
-- 4. Run each test case individually or adjust as needed 
-- 5. If you still get errors, try uncommenting and using one of the simplified examples 