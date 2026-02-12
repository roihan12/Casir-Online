-- DROP FUNCTION public.create_transaksi(varchar, varchar, timestamp, varchar, varchar, varchar, varchar, jsonb, float8, text, jsonb, varchar, varchar, varchar, varchar);

CREATE OR REPLACE FUNCTION public.create_transaksi(p_cabang_id character varying, p_jenis_transaksi character varying, p_tanggal timestamp without time zone, p_pelanggan_id character varying, p_supplier_id character varying, p_shift_id character varying, p_promo_id character varying, p_details jsonb, p_biaya_tambahan double precision, p_keterangan text, p_customer_info jsonb, p_user_id character varying, p_ip_address character varying, p_user_name character varying, p_metode_pembayaran character varying DEFAULT NULL::character varying)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_nomor_transaksi VARCHAR;
    v_transaksi_id VARCHAR(36);
    v_subtotal DECIMAL := 0;
    v_total_pajak DECIMAL := 0;
    v_total_diskon DECIMAL := 0;
    v_total DECIMAL := 0;
    v_tax_percentage DECIMAL;
    v_is_tax_included BOOLEAN;
    v_detail JSONB;
    v_produk_id VARCHAR(36);
    v_produk_supplier_id VARCHAR(36);
    v_jumlah INTEGER;
    v_harga_satuan DECIMAL;
    v_diskon_persen DECIMAL;
    v_pajak_persen DECIMAL;
    v_diskon_nominal DECIMAL;
    v_item_subtotal DECIMAL;
    v_pajak_nominal DECIMAL;
    v_item_total DECIMAL;
    v_batch_number VARCHAR;
    v_expired_date DATE;
    v_reference_type VARCHAR;
    v_harga_db DECIMAL;
    v_harga_jual_db DECIMAL;
    v_stok INTEGER;
    v_produk_master_id VARCHAR(36);
    v_new_harga_jual DECIMAL;
    v_margin_percentage DECIMAL := 10; -- Default margin percentage
BEGIN
    -- Validasi transaksi
    IF jsonb_array_length(p_details) = 0 THEN
        RAISE EXCEPTION 'Transaksi harus memiliki minimal satu produk';
    END IF;

    -- Generate transaksi ID (UUID)
    v_transaksi_id := gen_random_uuid();
    
    -- Generate nomor transaksi
    SELECT generate_transaksi_number(p_jenis_transaksi) INTO v_nomor_transaksi;
    
    -- Get tax config
    SELECT tax_percentage, is_tax_included INTO v_tax_percentage, v_is_tax_included
    FROM tax_config 
    WHERE cabang_id = p_cabang_id;
    
    -- Default to 0 if not found
    IF v_tax_percentage IS NULL THEN
        v_tax_percentage := 0;
        v_is_tax_included := false;
    END IF;
    
    -- Validasi entity terkait dalam satu query
    IF p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN') AND p_pelanggan_id IS NOT NULL THEN
        PERFORM 1 FROM pelanggan WHERE pelanggan_id = p_pelanggan_id AND status = 'aktif';
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Pelanggan tidak ditemukan atau tidak aktif';
        END IF;
    ELSIF p_jenis_transaksi IN ('PEMBELIAN', 'RETUR_PEMBELIAN') THEN
        IF p_supplier_id IS NULL THEN
            RAISE EXCEPTION 'Supplier ID diperlukan untuk transaksi pembelian';
        END IF;
        
        PERFORM 1 FROM supplier WHERE supplier_id = p_supplier_id AND status = 'aktif';
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Supplier tidak ditemukan atau tidak aktif';
        END IF;
    END IF;
    
    -- Validasi shift
    IF p_shift_id IS NOT NULL THEN
        PERFORM 1 FROM shift WHERE shift_id = p_shift_id AND status = 'dibuka' AND cabang_id = p_cabang_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Shift tidak ditemukan atau sudah ditutup';
        END IF;
    END IF;
    
    -- Validasi promo
    IF p_promo_id IS NOT NULL THEN
        PERFORM 1 FROM promo_diskon WHERE promo_id = p_promo_id AND status = 'aktif';
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Promo tidak ditemukan atau tidak aktif';
        END IF;
    END IF;
    
    -- Set reference type untuk inventory movement
    CASE p_jenis_transaksi
        WHEN 'PENJUALAN' THEN v_reference_type := 'penjualan';
        WHEN 'PEMBELIAN' THEN v_reference_type := 'pembelian';
        WHEN 'RETUR_PENJUALAN' THEN v_reference_type := 'retur';
        WHEN 'RETUR_PEMBELIAN' THEN v_reference_type :='retur';
    END CASE;

    -- Process semua detail transaksi
    FOR v_detail IN SELECT * FROM jsonb_array_elements(p_details)
    LOOP
        v_produk_id := (v_detail->>'produk_id')::VARCHAR;
        v_produk_supplier_id := (v_detail->>'produk_supplier_id')::VARCHAR;
        v_jumlah := (v_detail->>'jumlah')::INTEGER;
        v_harga_satuan := (v_detail->>'harga_satuan')::DECIMAL;
        v_diskon_persen := COALESCE((v_detail->>'diskon_persen')::DECIMAL, 0);
        v_diskon_nominal := COALESCE((v_detail->>'diskon_nominal')::DECIMAL, 0);
        v_pajak_persen := COALESCE((v_detail->>'pajak_persen')::DECIMAL, v_tax_percentage);
        v_batch_number := v_detail->>'batch_number';
        v_expired_date := (v_detail->>'expired_date')::DATE;

        -- Calculate discount if only percentage is provided
        IF v_diskon_persen > 0 AND v_diskon_nominal = 0 THEN
            v_diskon_nominal := (v_harga_satuan * v_jumlah * v_diskon_persen) / 100;
        END IF;
        
        -- Get basic produk info first
        SELECT stok, produk_master_id INTO v_stok, v_produk_master_id
        FROM produk 
        WHERE produk_id = v_produk_id AND cabang_id = p_cabang_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produk dengan ID % tidak ditemukan di cabang ini', v_produk_id;
        END IF;
        
        -- Validasi produk based on transaction type
        IF p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN') THEN
            -- For selling transactions, check sales price
            SELECT harga_jual INTO v_harga_db 
            FROM produk
            WHERE produk_id = v_produk_id AND cabang_id = p_cabang_id;
            
            -- Validate price for sales only (not for returns)
            IF p_jenis_transaksi = 'PENJUALAN' AND v_harga_satuan <> v_harga_db THEN
                RAISE EXCEPTION 'Harga jual tidak sesuai dengan harga di sistem. Harga yang benar adalah %', v_harga_db;
            END IF;
            
            -- Validate stock for sales
            IF p_jenis_transaksi = 'PENJUALAN' AND v_stok < v_jumlah THEN
                RAISE EXCEPTION 'Stok tidak mencukupi. Stok tersedia: %, Diminta: %', v_stok, v_jumlah;
            END IF;
            
        ELSIF p_jenis_transaksi = 'PEMBELIAN' THEN
            -- For purchase transactions, check supplier product price if supplier_id is provided
            IF v_produk_supplier_id IS NOT NULL THEN
                -- Validate against produk_supplier if ID is provided
                SELECT harga_beli INTO v_harga_db
                FROM produk_supplier
                WHERE produk_supplier_id = v_produk_supplier_id 
                AND supplier_id = p_supplier_id
                AND status = 'aktif';
                
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'Data supplier produk tidak ditemukan atau tidak aktif';
                END IF;
                
                -- Price warning with tolerance (allow 10% difference)
                IF ABS(v_harga_satuan - v_harga_db) > (v_harga_db * 0.1) THEN
                    RAISE NOTICE 'Harga beli berbeda dari harga supplier terdaftar. Terdaftar: %, Digunakan: %', v_harga_db, v_harga_satuan;
                END IF;
            ELSE
                -- Check if there's any supplier record for this product
                PERFORM 1 
                FROM produk_supplier
                WHERE produk_master_id = v_produk_master_id
                AND supplier_id = p_supplier_id
                AND status = 'aktif';
                
                IF NOT FOUND THEN
                    RAISE NOTICE 'Produk % belum terdaftar untuk supplier ini. Harga akan disimpan untuk referensi berikutnya.', v_produk_id;
                END IF;
            END IF;
        ELSIF p_jenis_transaksi = 'RETUR_PEMBELIAN' THEN
            -- For purchase returns, validate stock
            IF v_stok < v_jumlah THEN
                RAISE EXCEPTION 'Stok tidak mencukupi untuk retur. Stok tersedia: %, Diminta: %', v_stok, v_jumlah;
            END IF;
        END IF;
        
        -- Hitung subtotal per item
        v_item_subtotal := v_harga_satuan * v_jumlah - v_diskon_nominal;
        
        -- Hitung pajak
        IF v_is_tax_included AND v_pajak_persen > 0 THEN
            v_pajak_nominal := v_item_subtotal - (v_item_subtotal / (1 + (v_pajak_persen / 100)));
            v_pajak_nominal := ROUND(v_pajak_nominal * 100) / 100;
        ELSE
            v_pajak_nominal := (v_item_subtotal * v_pajak_persen) / 100;
            v_pajak_nominal := ROUND(v_pajak_nominal * 100) / 100;
        END IF;
        
        -- Hitung total per item
        IF v_is_tax_included THEN
            v_item_total := v_item_subtotal;
        ELSE
            v_item_total := v_item_subtotal + v_pajak_nominal;
        END IF;
        
        -- Akumulasi total
        v_subtotal := v_subtotal + (v_harga_satuan * v_jumlah);
        v_total_diskon := v_total_diskon + v_diskon_nominal;
        v_total_pajak := v_total_pajak + v_pajak_nominal;
    END LOOP;
    
    -- Hitung grand total
    v_total := v_subtotal - v_total_diskon + v_total_pajak + COALESCE(p_biaya_tambahan, 0);
    
    -- Buat transaksi
    INSERT INTO transaksi (
        transaksi_id, nomor_transaksi, cabang_id, jenis_transaksi, tanggal,
        pelanggan_id, supplier_id, created_by_user_id, created_by, shift_id, promo_id,
        subtotal, diskon, pajak, biaya_tambahan, total,
        status_pembayaran, keterangan, updated_at
    ) VALUES (
        v_transaksi_id, v_nomor_transaksi, p_cabang_id, p_jenis_transaksi, p_tanggal,
        p_pelanggan_id, p_supplier_id, p_user_id, p_user_name, p_shift_id, p_promo_id,
        v_subtotal, v_total_diskon, v_total_pajak, COALESCE(p_biaya_tambahan, 0), v_total,
        'BELUM_LUNAS',
        CASE WHEN p_customer_info IS NOT NULL AND p_pelanggan_id IS NULL THEN
            COALESCE(p_keterangan, '') || ' | Pelanggan: ' || 
            COALESCE(p_customer_info->>'nama', 'Tamu') || ', ' ||
            COALESCE(p_customer_info->>'telepon', '-') || ', ' ||
            COALESCE(p_customer_info->>'email', '-')
        ELSE
            p_keterangan
        END,
        now()
    );
    
    -- Buat detail transaksi dan update stok dalam satu loop
    FOR v_detail IN SELECT * FROM jsonb_array_elements(p_details)
    LOOP
        v_produk_id := (v_detail->>'produk_id')::VARCHAR;
        v_produk_supplier_id := (v_detail->>'produk_supplier_id')::VARCHAR;
        v_jumlah := (v_detail->>'jumlah')::INTEGER;
        v_harga_satuan := (v_detail->>'harga_satuan')::DECIMAL;
        v_diskon_persen := COALESCE((v_detail->>'diskon_persen')::DECIMAL, 0);
        v_diskon_nominal := COALESCE((v_detail->>'diskon_nominal')::DECIMAL, 0);
        v_pajak_persen := COALESCE((v_detail->>'pajak_persen')::DECIMAL, v_tax_percentage);
        v_batch_number := v_detail->>'batch_number';
        v_expired_date := (v_detail->>'expired_date')::DATE;
        
        -- Get produk_master_id for this product
        SELECT produk_master_id, harga_beli, harga_jual INTO v_produk_master_id, v_harga_db, v_harga_jual_db 
        FROM produk 
        WHERE produk_id = v_produk_id;
        
        -- Calculate discount if only percentage is provided
        IF v_diskon_persen > 0 AND v_diskon_nominal = 0 THEN
            v_diskon_nominal := (v_harga_satuan * v_jumlah * v_diskon_persen) / 100;
        END IF;
        
        -- Recalculate values
        v_item_subtotal := v_harga_satuan * v_jumlah - v_diskon_nominal;
        
        IF v_is_tax_included AND v_pajak_persen > 0 THEN
            v_pajak_nominal := v_item_subtotal - (v_item_subtotal / (1 + (v_pajak_persen / 100)));
            v_pajak_nominal := ROUND(v_pajak_nominal * 100) / 100;
        ELSE
            v_pajak_nominal := (v_item_subtotal * v_pajak_persen) / 100;
            v_pajak_nominal := ROUND(v_pajak_nominal * 100) / 100;
        END IF;
        
        IF v_is_tax_included THEN
            v_item_total := v_item_subtotal;
        ELSE
            v_item_total := v_item_subtotal + v_pajak_nominal;
        END IF;
        
        -- Insert detail transaksi
        INSERT INTO transaksi_detail (transaksi_detail_id,
            transaksi_id, produk_id, batch_number, expired_date,
            jumlah, harga_satuan, diskon_persen, diskon_nominal,
            subtotal, pajak_persen, total, updated_at
        ) VALUES (gen_random_uuid(),
            v_transaksi_id, v_produk_id, v_batch_number, v_expired_date,
            v_jumlah, v_harga_satuan, v_diskon_persen, v_diskon_nominal,
            v_item_subtotal, v_pajak_persen, v_item_total, now()
        );
        
        -- For purchase transactions, record price history BEFORE updating the product
        IF p_jenis_transaksi = 'PEMBELIAN' THEN
            -- Calculate new selling price with default 10% margin if harga_beli changed
            IF v_harga_db <> v_harga_satuan THEN
                -- Record purchase price history
                INSERT INTO produk_price_history (
                    history_id, produk_id, tipe_harga, harga_lama, harga_baru,
                    tanggal_perubahan, alasan_perubahan, supplier_id, 
                    dokumen_referensi, cabang_id, created_by_user_id, created_at
                ) VALUES (
                    gen_random_uuid(), v_produk_id, 'beli', v_harga_db, v_harga_satuan,
                    p_tanggal, 'Pembelian dari supplier', p_supplier_id,
                    v_nomor_transaksi, p_cabang_id, p_user_id, now()
                );
                
                -- Calculate new selling price with margin
                v_new_harga_jual := ROUND(v_harga_satuan * (1 + (v_margin_percentage / 100)) * 100) / 100;
                
                -- Only record selling price history if it will change
                IF v_harga_jual_db <> v_new_harga_jual THEN
                    INSERT INTO produk_price_history (
                        history_id, produk_id, tipe_harga, harga_lama, harga_baru,
                        tanggal_perubahan, alasan_perubahan, supplier_id, 
                        dokumen_referensi, cabang_id, created_by_user_id, created_at
                    ) VALUES (
                        gen_random_uuid(), v_produk_id, 'jual', v_harga_jual_db, v_new_harga_jual,
                        p_tanggal, 'Penyesuaian margin harga jual', p_supplier_id,
                        v_nomor_transaksi, p_cabang_id, p_user_id, now()
                    );
                END IF;
            END IF;
        END IF;
        
        -- Update stok produk and prices
        IF p_jenis_transaksi = 'PEMBELIAN' THEN
            -- For purchases, update both purchase price and selling price with margin
            UPDATE produk SET 
                stok = stok + v_jumlah,
                harga_beli = v_harga_satuan,
                harga_jual = ROUND(v_harga_satuan * (1 + (v_margin_percentage / 100)) * 100) / 100
            WHERE produk_id = v_produk_id;
        ELSE
            -- For other transaction types, just update stock
            UPDATE produk SET 
                stok = stok + CASE 
                    WHEN p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PEMBELIAN') THEN -v_jumlah
                    ELSE v_jumlah
                END
            WHERE produk_id = v_produk_id;
        END IF;
        
        -- Update or insert produk_supplier record for purchase transactions
        IF p_jenis_transaksi = 'PEMBELIAN' THEN
            -- Check if we already have a produk_supplier record
            IF v_produk_supplier_id IS NOT NULL THEN
                -- Update existing produk_supplier record
                UPDATE produk_supplier
                SET harga_beli = v_harga_satuan,
                    updated_at = now(),
                    updated_by = p_user_name,
                    updated_by_user_id = p_user_id
                WHERE produk_supplier_id = v_produk_supplier_id;
            ELSE
                -- Check if a record exists for this master product and supplier
                PERFORM 1 FROM produk_supplier
                WHERE produk_master_id = v_produk_master_id
                AND supplier_id = p_supplier_id
                AND cabang_id = p_cabang_id;
                
                IF NOT FOUND THEN
                    -- Insert a new produk_supplier record
                    INSERT INTO produk_supplier (
                        produk_supplier_id, produk_master_id, supplier_id, 
                        cabang_id, is_primary, harga_beli, status,
                        created_at, updated_at, created_by, created_by_user_id
                    ) VALUES (
                        gen_random_uuid(), v_produk_master_id, p_supplier_id,
                        p_cabang_id, false, v_harga_satuan, 'aktif',
                        now(), now(), p_user_name, p_user_id
                    );
                ELSE
                    -- Update existing record
                    UPDATE produk_supplier
                    SET harga_beli = v_harga_satuan,
                        updated_at = now(),
                        updated_by = p_user_name,
                        updated_by_user_id = p_user_id
                    WHERE produk_master_id = v_produk_master_id
                    AND supplier_id = p_supplier_id
                    AND cabang_id = p_cabang_id;
                END IF;
            END IF;
        END IF;
        
        -- Insert inventory movement
        INSERT INTO inventory_movement (movement_id,
            produk_id, cabang_id, reference_id, reference_type,
            quantity, batch_number, expired_date, keterangan, user_id
        ) VALUES (
            gen_random_uuid(), v_produk_id, p_cabang_id, v_transaksi_id, v_reference_type,
            CASE 
                WHEN p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PEMBELIAN') THEN -v_jumlah
                ELSE v_jumlah
            END,
            v_batch_number, v_expired_date,
            p_jenis_transaksi || ' #' || v_nomor_transaksi,
            p_user_id
        );
    END LOOP;
    
    -- Create hutang record if applicable (for purchases with HUTANG payment method)
    IF p_jenis_transaksi = 'PEMBELIAN' AND p_metode_pembayaran = 'HUTANG' AND p_supplier_id IS NOT NULL THEN
        INSERT INTO hutang (
            hutang_id, transaksi_id, nomor_referensi, tanggal_hutang, 
            jatuh_tempo, jumlah_total, jumlah_bayar, sisa_hutang,
            jenis_hutang, status_hutang, keterangan, 
            cabang_id, supplier_id, created_by_user_id, created_by, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_transaksi_id, v_nomor_transaksi, p_tanggal,
            p_tanggal + interval '30 day', v_total, 0, v_total,
            'supplier', 'aktif', 'Hutang dari pembelian #' || v_nomor_transaksi,
            p_cabang_id, p_supplier_id, p_user_id, p_user_name, now(), now()
        );
    END IF;
    
    -- Buat audit log
    INSERT INTO audit_log (log_id,
        user_id, created_by, ip_address, action, table_name, record_id, new_values, cabang_id
    ) VALUES (gen_random_uuid(),
        p_user_id, p_user_name, p_ip_address, 'CREATE_TRANSAKSI', 'transaksi', v_transaksi_id,
        jsonb_build_object(
            'transaksi_id', v_transaksi_id,
            'nomor_transaksi', v_nomor_transaksi,
            'jenis_transaksi', p_jenis_transaksi,
            'customer_info', p_customer_info,
            'metode_pembayaran', p_metode_pembayaran
        ),
        p_cabang_id
    );
    
    -- Add loyalty points if applicable
    IF p_pelanggan_id IS NOT NULL AND p_jenis_transaksi = 'PENJUALAN' THEN
        PERFORM add_loyalty_points(p_pelanggan_id, v_transaksi_id, v_total, p_user_id, p_ip_address);
    END IF;
    
    RETURN v_transaksi_id;
END;$function$
;
