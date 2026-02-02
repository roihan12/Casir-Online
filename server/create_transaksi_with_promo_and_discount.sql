CREATE OR REPLACE FUNCTION calculate_member_discount(
    p_pelanggan_id VARCHAR,
    p_subtotal DECIMAL,
    p_cabang_id VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
    v_config RECORD;
    v_pelanggan RECORD;
    v_discount_persen DECIMAL := 0;
    v_discount_nominal DECIMAL := 0;
    v_tipe_discount VARCHAR;
BEGIN
    -- Get discount config
    SELECT * INTO v_config
    FROM discount_config
    WHERE (cabang_id = p_cabang_id OR cabang_id IS NULL)
    AND is_active = TRUE
    ORDER BY cabang_id NULLS LAST
    LIMIT 1;
    
    IF NOT FOUND OR v_config.enable_member_discount = FALSE THEN
        RETURN jsonb_build_object(
            'discount_nominal', 0,
            'discount_persen', 0,
            'tipe', 'NONE'
        );
    END IF;
    
    -- Check minimum transaction
    IF v_config.min_transaction_for_discount IS NOT NULL AND 
       p_subtotal < v_config.min_transaction_for_discount THEN
        RETURN jsonb_build_object(
            'discount_nominal', 0,
            'discount_persen', 0,
            'tipe', 'BELOW_MINIMUM',
            'message', format('Minimal transaksi Rp %s untuk mendapat diskon member', 
                v_config.min_transaction_for_discount)
        );
    END IF;
    
    -- Get pelanggan info
    SELECT segmen, discount_tier INTO v_pelanggan
    FROM pelanggan
    WHERE pelanggan_id = p_pelanggan_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('discount_nominal', 0, 'discount_persen', 0, 'tipe', 'NO_CUSTOMER');
    END IF;
    
    -- Calculate discount based on type
    CASE v_config.member_discount_type
        WHEN 'PERCENTAGE' THEN
            -- Get discount from segmen mapping
            IF v_config.discount_segmen IS NOT NULL THEN
                v_discount_persen := COALESCE(
                    (v_config.discount_segmen->>v_pelanggan.segmen)::DECIMAL, 
                    0
                );
            END IF;
            v_discount_nominal := (p_subtotal * v_discount_persen) / 100;
            v_tipe_discount := 'SEGMEN_AUTO';
            
        WHEN 'TIER_BASED' THEN
            -- Tier-based discount
            -- Tier 0 = 0%, Tier 1 = 5%, Tier 2 = 10%, Tier 3 = 15%
            v_discount_persen := COALESCE(v_pelanggan.discount_tier, 0) * 5;
            v_discount_nominal := (p_subtotal * v_discount_persen) / 100;
            v_tipe_discount := 'TIER_AUTO';
            
        WHEN 'NOMINAL' THEN
            -- Fixed nominal per transaction (could be tier-based too)
            v_discount_nominal := COALESCE(v_pelanggan.discount_tier, 0) * 10000;
            v_tipe_discount := 'NOMINAL_AUTO';
    END CASE;
    
    RETURN jsonb_build_object(
        'discount_nominal', ROUND(v_discount_nominal, 2),
        'discount_persen', v_discount_persen,
        'tipe', v_tipe_discount,
        'segmen', v_pelanggan.segmen,
        'tier', v_pelanggan.discount_tier
    );
END;
$function$;







CREATE OR REPLACE FUNCTION validate_manual_discount(
    p_discount_persen DECIMAL,
    p_discount_nominal DECIMAL,
    p_subtotal DECIMAL,
    p_cabang_id VARCHAR,
    p_has_promo BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
    v_config RECORD;
    v_calculated_persen DECIMAL;
    v_is_valid BOOLEAN := TRUE;
    v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Get config
    SELECT * INTO v_config
    FROM discount_config
    WHERE (cabang_id = p_cabang_id OR cabang_id IS NULL)
    AND is_active = TRUE
    ORDER BY cabang_id NULLS LAST
    LIMIT 1;
    
    IF NOT FOUND THEN
        v_config.max_manual_discount_persen := 50;
        v_config.max_manual_discount_nominal := NULL;
        v_config.allow_combine_with_promo := FALSE;
    END IF;
    
    -- Check if combining with promo
    IF p_has_promo AND NOT v_config.allow_combine_with_promo THEN
        v_is_valid := FALSE;
        v_errors := array_append(v_errors, 'Tidak dapat menggunakan discount manual bersamaan dengan promo');
    END IF;
    
    -- Validate percentage
    IF p_discount_persen IS NOT NULL THEN
        IF p_discount_persen > v_config.max_manual_discount_persen THEN
            v_is_valid := FALSE;
            v_errors := array_append(v_errors, 
                format('Maksimal discount %s%%', v_config.max_manual_discount_persen));
        END IF;
        
        IF p_discount_persen < 0 OR p_discount_persen > 100 THEN
            v_is_valid := FALSE;
            v_errors := array_append(v_errors, 'Persentase discount harus antara 0-100%');
        END IF;
    END IF;
    
    -- Validate nominal
    IF p_discount_nominal > 0 THEN
        -- Calculate equivalent percentage
        v_calculated_persen := (p_discount_nominal / p_subtotal) * 100;
        
        IF v_calculated_persen > v_config.max_manual_discount_persen THEN
            v_is_valid := FALSE;
            v_errors := array_append(v_errors, 
                format('Discount nominal terlalu besar (setara %.2f%%, max %s%%)', 
                    v_calculated_persen, v_config.max_manual_discount_persen));
        END IF;
        
        IF v_config.max_manual_discount_nominal IS NOT NULL AND 
           p_discount_nominal > v_config.max_manual_discount_nominal THEN
            v_is_valid := FALSE;
            v_errors := array_append(v_errors, 
                format('Maksimal discount nominal Rp %s', v_config.max_manual_discount_nominal));
        END IF;
        
        IF p_discount_nominal > p_subtotal THEN
            v_is_valid := FALSE;
            v_errors := array_append(v_errors, 'Discount tidak boleh melebihi subtotal');
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'is_valid', v_is_valid,
        'errors', v_errors,
        'max_persen', v_config.max_manual_discount_persen,
        'max_nominal', v_config.max_manual_discount_nominal,
        'allow_combine_promo', v_config.allow_combine_with_promo
    );
END;
$function$;


CREATE OR REPLACE FUNCTION apply_all_discounts(
    p_pelanggan_id VARCHAR,
    p_subtotal DECIMAL,
    p_cabang_id VARCHAR,
    p_manual_discount_persen DECIMAL DEFAULT NULL,
    p_manual_discount_nominal DECIMAL DEFAULT 0,
    p_manual_discount_alasan VARCHAR DEFAULT NULL,
    p_has_promo BOOLEAN DEFAULT FALSE,
    p_promo_discount DECIMAL DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
    v_member_discount JSONB;
    v_manual_validation JSONB;
    v_total_discount DECIMAL := 0;
    v_discount_member DECIMAL := 0;
    v_discount_manual DECIMAL := 0;
    v_discount_breakdown JSONB := '[]'::JSONB;
    v_config RECORD;
BEGIN
    -- Get config
    SELECT allow_combine_with_promo INTO v_config
    FROM discount_config
    WHERE (cabang_id = p_cabang_id OR cabang_id IS NULL)
    AND is_active = TRUE
    ORDER BY cabang_id NULLS LAST
    LIMIT 1;
    
    -- Rule: Tidak bisa combine promo dengan discount
    IF p_has_promo AND NOT COALESCE(v_config.allow_combine_with_promo, FALSE) THEN
        -- Jika ada promo, skip member & manual discount
        RETURN jsonb_build_object(
            'total_discount', p_promo_discount,
            'discount_member', 0,
            'discount_manual', 0,
            'discount_promo', p_promo_discount,
            'breakdown', jsonb_build_array(
                jsonb_build_object('tipe', 'PROMO', 'amount', p_promo_discount)
            ),
            'message', 'Menggunakan promo, discount member/manual tidak diaplikasikan'
        );
    END IF;
    
    -- Calculate member discount (if no promo or allowed to combine)
    IF p_pelanggan_id IS NOT NULL THEN
        v_member_discount := calculate_member_discount(
            p_pelanggan_id,
            p_subtotal,
            p_cabang_id
        );
        
        v_discount_member := (v_member_discount->>'discount_nominal')::DECIMAL;
        
        IF v_discount_member > 0 THEN
            v_total_discount := v_total_discount + v_discount_member;
            v_discount_breakdown := v_discount_breakdown || jsonb_build_object(
                'tipe', v_member_discount->>'tipe',
                'amount', v_discount_member,
                'persen', v_member_discount->>'discount_persen'
            );
        END IF;
    END IF;
    
    -- Validate and apply manual discount
    IF p_manual_discount_persen IS NOT NULL OR p_manual_discount_nominal > 0 THEN
        -- Calculate nominal from percentage if needed
        IF p_manual_discount_persen IS NOT NULL AND p_manual_discount_nominal = 0 THEN
            p_manual_discount_nominal := (p_subtotal * p_manual_discount_persen) / 100;
        END IF;
        
        -- Validate
        v_manual_validation := validate_manual_discount(
            p_manual_discount_persen,
            p_manual_discount_nominal,
            p_subtotal,
            p_cabang_id,
            p_has_promo
        );
        
        IF (v_manual_validation->>'is_valid')::BOOLEAN THEN
            v_discount_manual := p_manual_discount_nominal;
            v_total_discount := v_total_discount + v_discount_manual;
            
            v_discount_breakdown := v_discount_breakdown || jsonb_build_object(
                'tipe', 'MANUAL',
                'amount', v_discount_manual,
                'persen', p_manual_discount_persen,
                'alasan', p_manual_discount_alasan
            );
        ELSE
            RAISE EXCEPTION 'Manual discount tidak valid: %', v_manual_validation->>'errors';
        END IF;
    END IF;
    
    -- Add promo discount to breakdown if exists
    IF p_promo_discount > 0 THEN
        v_total_discount := v_total_discount + p_promo_discount;
        v_discount_breakdown := v_discount_breakdown || jsonb_build_object(
            'tipe', 'PROMO',
            'amount', p_promo_discount
        );
    END IF;
    
    RETURN jsonb_build_object(
        'total_discount', ROUND(v_total_discount, 2),
        'discount_member', ROUND(v_discount_member, 2),
        'discount_manual', ROUND(v_discount_manual, 2),
        'discount_promo', p_promo_discount,
        'breakdown', v_discount_breakdown
    );
END;
$function$;



CREATE OR REPLACE FUNCTION public.create_transaksi_with_promo_and_discount(
    p_cabang_id VARCHAR, 
    p_jenis_transaksi VARCHAR, 
    p_tanggal TIMESTAMP, 
    p_pelanggan_id VARCHAR, 
    p_supplier_id VARCHAR, 
    p_shift_id VARCHAR, 
    p_details JSONB, 
    p_biaya_tambahan FLOAT8, 
    p_keterangan TEXT, 
    p_customer_info JSONB, 
    p_user_id VARCHAR, 
    p_ip_address VARCHAR, 
    p_user_name VARCHAR, 
    p_promo_codes VARCHAR[] DEFAULT NULL,
    p_metode_pembayaran VARCHAR DEFAULT NULL,
    p_tenor INT DEFAULT NULL,
    p_uang_muka NUMERIC DEFAULT 0,
    p_manual_discount_persen NUMERIC DEFAULT NULL,
    p_manual_discount_nominal NUMERIC DEFAULT 0,
    p_manual_discount_alasan VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
    v_transaksi_id VARCHAR(36);
    v_nomor_transaksi VARCHAR;
    
    -- Totals
    v_subtotal DECIMAL := 0;
    v_total_pajak DECIMAL := 0;
    v_total_diskon_item DECIMAL := 0;
    v_total_diskon_promo DECIMAL := 0;
    v_total_diskon_member DECIMAL := 0;
    v_total_diskon_manual DECIMAL := 0;
    v_total_diskon_final DECIMAL := 0;
    v_total DECIMAL := 0;
    
    -- Config
    v_tax_percentage DECIMAL;
    v_is_tax_included BOOLEAN;
    
    -- Customer
    v_pelanggan_segmen VARCHAR;
    v_is_grosir BOOLEAN := FALSE;
    v_status_pembayaran VARCHAR;
    
    -- Credit
    v_kredit_setting_id VARCHAR(36);
    v_limit_kredit DECIMAL;
    v_total_hutang_aktif DECIMAL;
    v_tenor_maksimal INT;
    v_bunga_per_bulan DECIMAL;
    v_biaya_admin DECIMAL;
    v_jumlah_kredit DECIMAL;
    v_total_bunga DECIMAL;
    v_total_bayar_kredit DECIMAL;
    v_angsuran_per_bulan DECIMAL;
    v_jatuh_tempo DATE;
    
    -- Results
    v_promo_result JSONB;
    v_discount_result JSONB;
    v_has_promo BOOLEAN := FALSE;
    
    -- Temp reference
    v_reference_type VARCHAR;
BEGIN
    -- ================================================================
    -- VALIDATION
    -- ================================================================
    
    IF jsonb_array_length(p_details) = 0 THEN
        RAISE EXCEPTION 'Transaksi harus memiliki minimal satu produk';
    END IF;
    
    v_transaksi_id := gen_random_uuid();
    SELECT generate_transaksi_number(p_jenis_transaksi) INTO v_nomor_transaksi;
    
    -- ================================================================
    -- GET TAX CONFIG (no lock needed - config table)
    -- ================================================================
    
    SELECT tax_percentage, is_tax_included 
    INTO v_tax_percentage, v_is_tax_included
    FROM tax_config 
    WHERE cabang_id = p_cabang_id;
    
    v_tax_percentage := COALESCE(v_tax_percentage, 0);
    v_is_tax_included := COALESCE(v_is_tax_included, FALSE);
    
    -- ================================================================
    -- DETERMINE PAYMENT STATUS
    -- ================================================================
    
    CASE 
        WHEN p_metode_pembayaran IN ('TUNAI', 'CASH', 'DEBIT', 'KARTU_DEBIT', 'KREDIT_KARTU', 'KARTU_KREDIT', 'QRIS', 'TRANSFER', 'E_WALLET', 'EWALLET') THEN
            v_status_pembayaran := 'LUNAS';
        WHEN p_metode_pembayaran IN ('KREDIT_PELANGGAN', 'TEMPO', 'KREDIT', 'HUTANG') THEN
            v_status_pembayaran := 'BELUM_LUNAS';
        ELSE
            v_status_pembayaran := 'BELUM_LUNAS';
    END CASE;
    
    -- ================================================================
    -- REFERENCE TYPE
    -- ================================================================
    
    v_reference_type := CASE p_jenis_transaksi
        WHEN 'PENJUALAN' THEN 'penjualan'
        WHEN 'PEMBELIAN' THEN 'pembelian'
        WHEN 'RETUR_PENJUALAN' THEN 'retur'
        WHEN 'RETUR_PEMBELIAN' THEN 'retur'
    END;
    
    -- ================================================================
    -- VALIDATE CUSTOMER (with lock for credit check)
    -- ================================================================
    
    IF p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN') THEN
        IF p_pelanggan_id IS NOT NULL THEN
            -- 🔒 Lock customer row to prevent concurrent credit violations
            SELECT segmen 
            INTO v_pelanggan_segmen
            FROM pelanggan 
            WHERE pelanggan_id = p_pelanggan_id 
              AND status = 'aktif'
            FOR UPDATE;
            
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Pelanggan tidak ditemukan atau tidak aktif';
            END IF;
            
            v_is_grosir := (v_pelanggan_segmen = 'grosir');
            
            -- Credit validation
            IF p_metode_pembayaran IN ('KREDIT_PELANGGAN', 'TEMPO') THEN
                SELECT COALESCE(SUM(sisa_hutang), 0) 
                INTO v_total_hutang_aktif
                FROM hutang
                WHERE pelanggan_id = p_pelanggan_id
                  AND jenis_hutang = 'pelanggan'
                  AND status_hutang = 'aktif';
                  
            ELSIF p_metode_pembayaran = 'KREDIT' THEN
                IF p_tenor IS NULL OR p_tenor <= 0 THEN
                    RAISE EXCEPTION 'Tenor harus diisi untuk metode pembayaran kredit cicilan';
                END IF;
                
                -- 🔒 Lock credit setting
                SELECT kredit_setting_id, limit_kredit, tenor_maksimal, 
                       bunga_per_bulan, biaya_admin
                INTO v_kredit_setting_id, v_limit_kredit, v_tenor_maksimal, 
                     v_bunga_per_bulan, v_biaya_admin
                FROM kredit_setting
                WHERE pelanggan_id = p_pelanggan_id 
                  AND status_kredit = 'aktif'
                FOR UPDATE;
                
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'Pengaturan kredit belum disetup untuk pelanggan ini';
                END IF;
                
                IF p_tenor > v_tenor_maksimal THEN
                    RAISE EXCEPTION 'Tenor melebihi batas maksimal. Maksimal: % bulan', v_tenor_maksimal;
                END IF;
            END IF;
        ELSE
            -- Guest customer
            IF p_metode_pembayaran IN ('KREDIT_PELANGGAN', 'TEMPO', 'KREDIT') THEN
                RAISE EXCEPTION 'Metode pembayaran kredit hanya untuk pelanggan terdaftar';
            END IF;
        END IF;
    END IF;
    
    -- ================================================================
    -- VALIDATE SUPPLIER (with lock)
    -- ================================================================
    
    IF p_jenis_transaksi IN ('PEMBELIAN', 'RETUR_PEMBELIAN') THEN
        IF p_supplier_id IS NULL THEN
            RAISE EXCEPTION 'Supplier ID diperlukan untuk transaksi pembelian';
        END IF;
        
        -- 🔒 Lock supplier row
        PERFORM 1 
        FROM supplier 
        WHERE supplier_id = p_supplier_id 
          AND status = 'aktif'
        FOR UPDATE;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Supplier tidak ditemukan atau tidak aktif';
        END IF;
    END IF;
    
    -- ================================================================
    -- VALIDATE SHIFT (with lock)
    -- ================================================================
    
    IF p_shift_id IS NOT NULL THEN
        PERFORM 1 
        FROM shift 
        WHERE shift_id = p_shift_id 
          AND status = 'dibuka' 
          AND cabang_id = p_cabang_id
        FOR UPDATE;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Shift tidak ditemukan atau sudah ditutup';
        END IF;
    END IF;
    
    -- ================================================================
    -- 🚀 SET-BASED: VALIDATE & CALCULATE ALL ITEMS AT ONCE
    -- ================================================================
    
    WITH item_calculations AS (
        SELECT 
            d.item->>'produk_id' AS produk_id,
            d.item->>'produk_supplier_id' AS produk_supplier_id,
            (d.item->>'jumlah')::INT AS jumlah,
            (d.item->>'harga_satuan')::DECIMAL AS harga_satuan,
            COALESCE((d.item->>'diskon_persen')::DECIMAL, 0) AS diskon_persen,
            COALESCE((d.item->>'diskon_nominal')::DECIMAL, 0) AS diskon_nominal_input,
            COALESCE((d.item->>'pajak_persen')::DECIMAL, v_tax_percentage) AS pajak_persen,
            d.item->>'batch_number' AS batch_number,
            (d.item->>'expired_date')::DATE AS expired_date,
            d.item->>'diskon_alasan' AS diskon_alasan,
            
            -- 🔒 Lock and get product data
            p.stok,
            p.produk_master_id,
            p.harga_beli,
            p.harga_jual,
            p.harga_grosir,
            
            -- Calculate discount nominal
            CASE 
                WHEN COALESCE((d.item->>'diskon_persen')::DECIMAL, 0) > 0 
                     AND COALESCE((d.item->>'diskon_nominal')::DECIMAL, 0) = 0
                THEN ((d.item->>'harga_satuan')::DECIMAL * (d.item->>'jumlah')::INT * 
                      (d.item->>'diskon_persen')::DECIMAL) / 100
                ELSE COALESCE((d.item->>'diskon_nominal')::DECIMAL, 0)
            END AS diskon_nominal,
            
            -- Calculate effective price
            CASE 
                WHEN p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN') THEN
                    CASE 
                        WHEN v_is_grosir THEN p.harga_grosir
                        ELSE p.harga_jual
                    END
                ELSE (d.item->>'harga_satuan')::DECIMAL
            END AS harga_expected
            
        FROM jsonb_array_elements(p_details) WITH ORDINALITY AS d(item, idx)
        INNER JOIN produk p ON p.produk_id = (d.item->>'produk_id')::VARCHAR
            AND p.cabang_id = p_cabang_id
        -- 🔒 CRITICAL: Lock all products to prevent concurrent stock changes
        FOR UPDATE OF p
    ),
    validation_check AS (
        SELECT 
            ic.*,
            ic.harga_satuan * ic.jumlah AS harga_total,
            ic.harga_satuan * ic.jumlah - ic.diskon_nominal AS item_subtotal_pre_tax,
            
            -- Validations (tax will be calculated after all discounts per Indonesian PPN regulation)
            CASE 
                WHEN p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN') 
                     AND v_is_grosir 
                     AND (ic.harga_grosir IS NULL OR ic.harga_grosir = 0)
                THEN 'Harga grosir belum diset untuk produk: ' || ic.produk_id
                
                WHEN p_jenis_transaksi = 'PENJUALAN' 
                     AND ic.harga_satuan <> ic.harga_expected
                THEN 'Harga tidak sesuai untuk produk: ' || ic.produk_id || 
                     '. Expected: ' || ic.harga_expected
                
                WHEN p_jenis_transaksi = 'PENJUALAN' 
                     AND ic.stok < ic.jumlah
                THEN 'Stok tidak cukup untuk produk: ' || ic.produk_id || 
                     '. Tersedia: ' || ic.stok || ', Diminta: ' || ic.jumlah
                
                ELSE NULL
            END AS error_message
            
        FROM item_calculations ic
    ),
    totals AS (
        SELECT 
            SUM(harga_total) AS subtotal,
            SUM(diskon_nominal) AS total_diskon_item,
            string_agg(error_message, '; ') FILTER (WHERE error_message IS NOT NULL) AS errors
        FROM validation_check
    )
    SELECT subtotal, total_diskon_item, errors
    INTO v_subtotal, v_total_diskon_item, v_reference_type
    FROM totals;
    
    -- Check for validation errors
    IF v_reference_type IS NOT NULL THEN
        RAISE EXCEPTION '%', v_reference_type;
    END IF;
    
    -- Reset reference_type
    v_reference_type := CASE p_jenis_transaksi
        WHEN 'PENJUALAN' THEN 'penjualan'
        WHEN 'PEMBELIAN' THEN 'pembelian'
        WHEN 'RETUR_PENJUALAN' THEN 'retur'
        WHEN 'RETUR_PEMBELIAN' THEN 'retur'
    END;
    
    -- ================================================================
    -- APPLY PROMO (if provided)
    -- ================================================================
    
    IF p_promo_codes IS NOT NULL AND array_length(p_promo_codes, 1) > 0 THEN
        v_promo_result := apply_multiple_promos(
            p_promo_codes,
            p_cabang_id,
            p_pelanggan_id,
            p_details,
            v_subtotal - v_total_diskon_item,
            p_metode_pembayaran
        );
        
        v_total_diskon_promo := COALESCE((v_promo_result->>'total_discount')::DECIMAL, 0);
        v_has_promo := (v_total_diskon_promo > 0);
    END IF;
    
    -- ================================================================
    -- APPLY DISCOUNTS (member + manual)
    -- ================================================================
    
    IF p_jenis_transaksi = 'PENJUALAN' THEN
        v_discount_result := apply_all_discounts(
            p_pelanggan_id,
            v_subtotal - v_total_diskon_item,
            p_cabang_id,
            p_manual_discount_persen,
            p_manual_discount_nominal,
            p_manual_discount_alasan,
            v_has_promo,
            v_total_diskon_promo
        );
        
        v_total_diskon_member := (v_discount_result->>'discount_member')::DECIMAL;
        v_total_diskon_manual := (v_discount_result->>'discount_manual')::DECIMAL;
        v_total_diskon_promo := (v_discount_result->>'discount_promo')::DECIMAL;
    END IF;
    
    -- ================================================================
    -- CALCULATE FINAL TOTALS (Indonesian PPN: tax calculated AFTER all discounts)
    -- ================================================================
    
    v_total_diskon_final := v_total_diskon_item + v_total_diskon_promo + 
                            v_total_diskon_member + v_total_diskon_manual;
    
    -- Calculate tax AFTER all discounts (Indonesian PPN regulation)
    -- Pajak dihitung dari subtotal setelah semua potongan
    IF v_is_tax_included AND v_tax_percentage > 0 THEN
        -- Tax already included in price, extract it
        v_total_pajak := ROUND(
            (v_subtotal - v_total_diskon_final) - 
            ((v_subtotal - v_total_diskon_final) / (1 + (v_tax_percentage / 100))), 2
        );
    ELSE
        -- Tax not included, add on top of discounted subtotal
        v_total_pajak := ROUND(
            ((v_subtotal - v_total_diskon_final) * v_tax_percentage) / 100, 2
        );
    END IF;
    
    v_total := v_subtotal - v_total_diskon_final + v_total_pajak + 
               COALESCE(p_biaya_tambahan, 0);
    
    -- ================================================================
    -- INSERT TRANSAKSI
    -- ================================================================
    
    INSERT INTO transaksi (
        transaksi_id, nomor_transaksi, cabang_id, jenis_transaksi, tanggal,
        pelanggan_id, supplier_id, created_by_user_id, created_by, shift_id,
        subtotal, diskon, pajak, biaya_tambahan, total,
        diskon_member, diskon_manual_persen, diskon_manual_nominal, diskon_manual_alasan,
        total_diskon_final,
        status_pembayaran, metode_pembayaran, keterangan, updated_at
    ) VALUES (
        v_transaksi_id, v_nomor_transaksi, p_cabang_id, p_jenis_transaksi, p_tanggal,
        p_pelanggan_id, p_supplier_id, p_user_id, p_user_name, p_shift_id,
        v_subtotal, v_total_diskon_item, v_total_pajak, COALESCE(p_biaya_tambahan, 0), v_total,
        v_total_diskon_member, p_manual_discount_persen, v_total_diskon_manual, 
        p_manual_discount_alasan, v_total_diskon_final,
        v_status_pembayaran, p_metode_pembayaran,
        CASE 
            WHEN p_customer_info IS NOT NULL AND p_pelanggan_id IS NULL THEN
                COALESCE(p_keterangan, '') || ' | Pelanggan: ' || 
                COALESCE(p_customer_info->>'nama', 'Tamu') || ', ' ||
                COALESCE(p_customer_info->>'telepon', '-') || ', ' ||
                COALESCE(p_customer_info->>'email', '-')
            ELSE p_keterangan
        END,
        NOW()
    );
    
    -- ================================================================
    -- 🚀 SET-BASED: INSERT PROMO RECORDS (if applicable)
    -- ================================================================
    
    IF v_promo_result IS NOT NULL AND v_has_promo THEN
        WITH promo_insert AS (
            INSERT INTO transaksi_promo (
                transaksi_promo_id, transaksi_id, promo_id,
                total_diskon, is_applied, metadata, created_at
            )
            SELECT 
                gen_random_uuid(),
                v_transaksi_id,
                (promo->>'promo_id')::VARCHAR,
                (promo->>'discount')::DECIMAL,
                TRUE,
                promo,
                NOW()
            FROM jsonb_array_elements(v_promo_result->'applicable_promos') AS promo
            RETURNING promo_id, total_diskon
        ),
        promo_update AS (
            UPDATE promo_diskon pd
            SET current_usage = current_usage + 1
            FROM promo_insert pi
            WHERE pd.promo_id = pi.promo_id
            RETURNING pd.promo_id
        )
        INSERT INTO voucher_usage (
            voucher_usage_id, promo_id, pelanggan_id, transaksi_id,
            kode_voucher, tanggal_digunakan, nilai_diskon
        )
        SELECT 
            gen_random_uuid(),
            (promo->>'promo_id')::VARCHAR,
            p_pelanggan_id,
            v_transaksi_id,
            promo->>'kode_promo',
            NOW(),
            (promo->>'discount')::DECIMAL
        FROM jsonb_array_elements(v_promo_result->'applicable_promos') AS promo
        WHERE p_pelanggan_id IS NOT NULL;
    END IF;
    
    -- ================================================================
    -- INSERT DISCOUNT LOGS
    -- ================================================================
    
    IF v_total_diskon_member > 0 THEN
        INSERT INTO discount_log (
            discount_log_id, transaksi_id, tipe_discount,
            discount_nominal, alasan, user_id, pelanggan_id
        ) VALUES (
            gen_random_uuid(), v_transaksi_id,
            v_discount_result->>'tipe',
            v_total_diskon_member,
            format('Auto discount %s - Segmen: %s', 
                v_discount_result->>'tipe',
                v_discount_result->>'segmen'),
            p_user_id, p_pelanggan_id
        );
    END IF;
    
    IF v_total_diskon_manual > 0 THEN
        INSERT INTO discount_log (
            discount_log_id, transaksi_id, tipe_discount,
            discount_persen, discount_nominal, alasan, user_id, pelanggan_id
        ) VALUES (
            gen_random_uuid(), v_transaksi_id, 'MANUAL_TRANSACTION',
            p_manual_discount_persen, v_total_diskon_manual,
            p_manual_discount_alasan, p_user_id, p_pelanggan_id
        );
        
        -- Update user KPI
        UPDATE "user"
        SET total_discount_given = total_discount_given + v_total_diskon_manual
        WHERE user_id = p_user_id;
    END IF;
    
    IF p_pelanggan_id IS NOT NULL AND (v_total_diskon_member + v_total_diskon_manual) > 0 THEN
        UPDATE pelanggan
        SET total_diskon_diterima = total_diskon_diterima + 
                                    v_total_diskon_member + v_total_diskon_manual
        WHERE pelanggan_id = p_pelanggan_id;
    END IF;
    
    -- ================================================================
    -- 🚀 SET-BASED: INSERT DETAIL & UPDATE STOCK
    -- ================================================================
    
    WITH detail_insert AS (
        INSERT INTO transaksi_detail (
            transaksi_detail_id, transaksi_id, produk_id, batch_number, expired_date,
            jumlah, harga_satuan, harga_asli, diskon_persen, diskon_nominal,
            diskon_item_persen, diskon_item_nominal, diskon_item_alasan,
            subtotal, pajak_persen, total, updated_at
        )
        SELECT 
            gen_random_uuid(),
            v_transaksi_id,
            (item->>'produk_id')::VARCHAR,
            item->>'batch_number',
            (item->>'expired_date')::DATE,
            (item->>'jumlah')::INT,
            (item->>'harga_satuan')::DECIMAL,
            (item->>'harga_satuan')::DECIMAL * (item->>'jumlah')::INT,
            COALESCE((item->>'diskon_persen')::DECIMAL, 0),
            CASE 
                WHEN COALESCE((item->>'diskon_persen')::DECIMAL, 0) > 0 
                     AND COALESCE((item->>'diskon_nominal')::DECIMAL, 0) = 0
                THEN ((item->>'harga_satuan')::DECIMAL * (item->>'jumlah')::INT * 
                      (item->>'diskon_persen')::DECIMAL) / 100
                ELSE COALESCE((item->>'diskon_nominal')::DECIMAL, 0)
            END,
            COALESCE((item->>'diskon_persen')::DECIMAL, 0),
            CASE 
                WHEN COALESCE((item->>'diskon_persen')::DECIMAL, 0) > 0 
                     AND COALESCE((item->>'diskon_nominal')::DECIMAL, 0) = 0
                THEN ((item->>'harga_satuan')::DECIMAL * (item->>'jumlah')::INT * 
                      (item->>'diskon_persen')::DECIMAL) / 100
                ELSE COALESCE((item->>'diskon_nominal')::DECIMAL, 0)
            END,
            item->>'diskon_alasan',
            -- subtotal
            (item->>'harga_satuan')::DECIMAL * (item->>'jumlah')::INT - 
            CASE 
                WHEN COALESCE((item->>'diskon_persen')::DECIMAL, 0) > 0 
                     AND COALESCE((item->>'diskon_nominal')::DECIMAL, 0) = 0
                THEN ((item->>'harga_satuan')::DECIMAL * (item->>'jumlah')::INT * 
                      (item->>'diskon_persen')::DECIMAL) / 100
                ELSE COALESCE((item->>'diskon_nominal')::DECIMAL, 0)
            END,
            COALESCE((item->>'pajak_persen')::DECIMAL, v_tax_percentage),
            -- total (with tax)
            CASE 
                WHEN v_is_tax_included THEN
                    (item->>'harga_satuan')::DECIMAL * (item->>'jumlah')::INT - 
                    CASE 
                        WHEN COALESCE((item->>'diskon_persen')::DECIMAL, 0) > 0 
                             AND COALESCE((item->>'diskon_nominal')::DECIMAL, 0) = 0
                        THEN ((item->>'harga_satuan')::DECIMAL * (item->>'jumlah')::INT * 
                              (item->>'diskon_persen')::DECIMAL) / 100
                        ELSE COALESCE((item->>'diskon_nominal')::DECIMAL, 0)
                    END
                ELSE
                    ((item->>'harga_satuan')::DECIMAL * (item->>'jumlah')::INT - 
                    CASE 
                        WHEN COALESCE((item->>'diskon_persen')::DECIMAL, 0) > 0 
                             AND COALESCE((item->>'diskon_nominal')::DECIMAL, 0) = 0
                        THEN ((item->>'harga_satuan')::DECIMAL * (item->>'jumlah')::INT * 
                              (item->>'diskon_persen')::DECIMAL) / 100
                        ELSE COALESCE((item->>'diskon_nominal')::DECIMAL, 0)
                    END) * (1 + COALESCE((item->>'pajak_persen')::DECIMAL, v_tax_percentage) / 100)
            END,
            NOW()
        FROM jsonb_array_elements(p_details) AS item
        RETURNING produk_id, jumlah, harga_satuan, batch_number, expired_date
    ),
    stock_update AS (
        UPDATE produk p
        SET stok = stok + 
            CASE 
                WHEN p_jenis_transaksi = 'PEMBELIAN' THEN di.jumlah
                WHEN p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PEMBELIAN') THEN -di.jumlah
                ELSE di.jumlah
            END,
            harga_beli = CASE 
                WHEN p_jenis_transaksi = 'PEMBELIAN' THEN di.harga_satuan
                ELSE p.harga_beli
            END,
            harga_jual = CASE 
                WHEN p_jenis_transaksi = 'PEMBELIAN' THEN 
                    ROUND(di.harga_satuan * 1.10, 2)
                ELSE p.harga_jual
            END
        FROM detail_insert di
        WHERE p.produk_id = di.produk_id
        RETURNING p.produk_id, p.produk_master_id, p.harga_beli, di.harga_satuan
    ),
    price_history AS (
        INSERT INTO produk_price_history (
            history_id, produk_id, tipe_harga, harga_lama, harga_baru,
            tanggal_perubahan, alasan_perubahan, supplier_id, 
            dokumen_referensi, cabang_id, created_by_user_id, created_at
        )
        SELECT 
            gen_random_uuid(),
            su.produk_id,
            'beli',
            su.harga_beli,
            su.harga_satuan,
            p_tanggal,
            'Pembelian dari supplier',
            p_supplier_id,
            v_nomor_transaksi,
            p_cabang_id,
            p_user_id,
            NOW()
        FROM stock_update su
        WHERE p_jenis_transaksi = 'PEMBELIAN' 
          AND su.harga_beli <> su.harga_satuan
        RETURNING produk_id
    )
    INSERT INTO inventory_movement (
        movement_id, produk_id, cabang_id, reference_id, reference_type,
        quantity, batch_number, expired_date, keterangan, user_id
    )
    SELECT 
        gen_random_uuid(),
        di.produk_id,
        p_cabang_id,
        v_transaksi_id,
        v_reference_type,
        CASE 
            WHEN p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PEMBELIAN') THEN -di.jumlah
            ELSE di.jumlah
        END,
        di.batch_number,
        di.expired_date,
        p_jenis_transaksi || ' #' || v_nomor_transaksi,
        p_user_id
    FROM detail_insert di;
    
    -- ================================================================
    -- CREATE HUTANG/KREDIT RECORDS
    -- ================================================================
    
    IF p_jenis_transaksi = 'PEMBELIAN' 
       AND p_metode_pembayaran = 'HUTANG' 
       AND p_supplier_id IS NOT NULL THEN
        
        INSERT INTO hutang (
            hutang_id, transaksi_id, nomor_referensi, tanggal_hutang, jatuh_tempo,
            jumlah_total, jumlah_bayar, sisa_hutang, jenis_hutang, status_hutang,
            keterangan, cabang_id, supplier_id, 
            created_by_user_id, created_by, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_transaksi_id, v_nomor_transaksi, 
            p_tanggal, p_tanggal + INTERVAL '30 day',
            v_total, 0, v_total, 'supplier', 'aktif',
            'Hutang pembelian #' || v_nomor_transaksi,
            p_cabang_id, p_supplier_id, p_user_id, p_user_name, NOW(), NOW()
        );
    END IF;
    
    IF p_jenis_transaksi = 'PENJUALAN' 
       AND p_metode_pembayaran IN ('KREDIT_PELANGGAN', 'TEMPO') 
       AND p_pelanggan_id IS NOT NULL THEN
        
        INSERT INTO hutang (
            hutang_id, transaksi_id, nomor_referensi, tanggal_hutang, jatuh_tempo,
            jumlah_total, jumlah_bayar, sisa_hutang, jenis_hutang, status_hutang,
            keterangan, cabang_id, pelanggan_id, 
            created_by_user_id, created_by, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_transaksi_id, v_nomor_transaksi, 
            p_tanggal, p_tanggal::DATE + INTERVAL '30 day',
            v_total, 0, v_total, 'pelanggan', 'aktif',
            'Hutang penjualan #' || v_nomor_transaksi,
            p_cabang_id, p_pelanggan_id, p_user_id, p_user_name, NOW(), NOW()
        );
    END IF;
    
    IF p_jenis_transaksi = 'PENJUALAN' 
       AND p_metode_pembayaran = 'KREDIT' 
       AND p_pelanggan_id IS NOT NULL 
       AND v_kredit_setting_id IS NOT NULL THEN
        
        v_jumlah_kredit := v_total - COALESCE(p_uang_muka, 0);
        v_total_bunga := (v_jumlah_kredit * COALESCE(v_bunga_per_bulan, 0) * p_tenor) / 100;
        v_total_bayar_kredit := v_jumlah_kredit + v_total_bunga + COALESCE(v_biaya_admin, 0);
        v_angsuran_per_bulan := v_total_bayar_kredit / p_tenor;
        v_jatuh_tempo := p_tanggal::DATE + (p_tenor || ' month')::INTERVAL;
        
        INSERT INTO kredit_transaksi (
            kredit_transaksi_id, transaksi_id, kredit_setting_id,
            jumlah_kredit, tenor, bunga, biaya_admin, total_bayar, angsuran_per_bulan,
            tanggal_mulai, tanggal_jatuh_tempo, status_kredit, keterangan,
            created_by_user_id, created_by, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_transaksi_id, v_kredit_setting_id,
            v_jumlah_kredit, p_tenor, v_total_bunga, v_biaya_admin, 
            v_total_bayar_kredit, v_angsuran_per_bulan,
            p_tanggal, v_jatuh_tempo, 'aktif',
            'Kredit ' || p_tenor || ' bulan #' || v_nomor_transaksi,
            p_user_id, p_user_name, NOW(), NOW()
        );
        
        IF p_uang_muka > 0 THEN
            INSERT INTO pembayaran_kredit (
                pembayaran_kredit_id, kredit_transaksi_id, angsuran_ke,
                jumlah_bayar, tanggal_bayar, metode_pembayaran,
                nomor_referensi, keterangan,
                created_by_user_id, created_by, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), 
                (SELECT kredit_transaksi_id FROM kredit_transaksi 
                 WHERE transaksi_id = v_transaksi_id),
                0, p_uang_muka, p_tanggal, COALESCE(p_metode_pembayaran, 'TUNAI'),
                'DP-' || v_nomor_transaksi, 'Uang muka #' || v_nomor_transaksi,
                p_user_id, p_user_name, NOW(), NOW()
            );
        END IF;
    END IF;
    
    -- ================================================================
    -- AUDIT LOG
    -- ================================================================
    
    INSERT INTO audit_log (
        log_id, user_id, created_by, ip_address, action, table_name, 
        record_id, new_values, cabang_id
    ) VALUES (
        gen_random_uuid(), p_user_id, p_user_name, p_ip_address, 
        'CREATE_TRANSAKSI', 'transaksi', v_transaksi_id,
        jsonb_build_object(
            'transaksi_id', v_transaksi_id,
            'nomor_transaksi', v_nomor_transaksi,
            'jenis_transaksi', p_jenis_transaksi,
            'metode_pembayaran', p_metode_pembayaran,
            'total_diskon_promo', v_total_diskon_promo,
            'total_diskon_member', v_total_diskon_member,
            'total_diskon_manual', v_total_diskon_manual,
            'total_diskon_final', v_total_diskon_final
        ),
        p_cabang_id
    );
    
    -- ================================================================
    -- LOYALTY POINTS
    -- ================================================================
    
    IF p_pelanggan_id IS NOT NULL 
       AND p_jenis_transaksi = 'PENJUALAN' 
       AND v_status_pembayaran = 'LUNAS' THEN
        
        PERFORM add_loyalty_points(
            p_pelanggan_id, v_transaksi_id, v_total, p_user_id, p_ip_address
        );
    END IF;
    
    -- ================================================================
    -- RETURN RESULT
    -- ================================================================
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'transaksi_id', v_transaksi_id,
        'nomor_transaksi', v_nomor_transaksi,
        'subtotal', v_subtotal,
        'diskon_item', v_total_diskon_item,
        'diskon_promo', v_total_diskon_promo,
        'diskon_member', v_total_diskon_member,
        'diskon_manual', v_total_diskon_manual,
        'total_diskon_final', v_total_diskon_final,
        'pajak', v_total_pajak,
        'biaya_tambahan', COALESCE(p_biaya_tambahan, 0),
        'total', v_total,
        'promos_applied', COALESCE(v_promo_result->'applicable_promos', '[]'::JSONB),
        'discount_breakdown', COALESCE(v_discount_result->'breakdown', '[]'::JSONB),
        'discount_message', v_discount_result->>'message'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error for debugging
        INSERT INTO error_log (
            error_id, error_message, error_detail, 
            function_name, created_at
        ) VALUES (
            gen_random_uuid(),
            SQLERRM,
            SQLSTATE,
            'create_transaksi_with_promo_and_discount',
            NOW()
        );
        
        RAISE;
END;
$function$;