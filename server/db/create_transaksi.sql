-- DROP FUNCTION public.create_transaksi(varchar, varchar, timestamp, varchar, varchar, varchar, varchar, jsonb, float8, text, jsonb, varchar, varchar, varchar, varchar, int4, numeric);

CREATE OR REPLACE FUNCTION public.create_transaksi(p_cabang_id character varying, p_jenis_transaksi character varying, p_tanggal timestamp without time zone, p_pelanggan_id character varying, p_supplier_id character varying, p_shift_id character varying, p_promo_id character varying, p_details jsonb, p_biaya_tambahan double precision, p_keterangan text, p_customer_info jsonb, p_user_id character varying, p_ip_address character varying, p_user_name character varying, p_metode_pembayaran character varying DEFAULT NULL::character varying, p_tenor integer DEFAULT NULL::integer, p_uang_muka numeric DEFAULT 0)
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
    v_harga_beli_db DECIMAL;
    v_harga_jual_db DECIMAL;
    v_harga_grosir_db DECIMAL;
    v_stok INTEGER;
    v_produk_master_id VARCHAR(36);
    v_new_harga_jual DECIMAL;
    v_margin_percentage DECIMAL := 10;
    v_pelanggan_segmen VARCHAR;
    v_is_grosir BOOLEAN := false;
    v_status_pembayaran VARCHAR;
    v_kredit_setting_id VARCHAR(36);
    v_limit_kredit DECIMAL;
    v_total_hutang_aktif DECIMAL;
    v_tenor_maksimal INTEGER;
    v_bunga_per_bulan DECIMAL;
    v_biaya_admin DECIMAL;
    v_jumlah_kredit DECIMAL;
    v_total_bunga DECIMAL;
    v_total_bayar_kredit DECIMAL;
    v_angsuran_per_bulan DECIMAL;
    v_jatuh_tempo DATE;
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
    
    -- Determine payment status based on payment method
    CASE 
        WHEN p_metode_pembayaran IN ('KREDIT_PELANGGAN', 'TEMPO') THEN
            v_status_pembayaran := 'BELUM_LUNAS';
        WHEN p_metode_pembayaran = 'KREDIT' THEN
            v_status_pembayaran := 'BELUM_LUNAS';
        WHEN p_metode_pembayaran = 'HUTANG' THEN
            v_status_pembayaran := 'BELUM_LUNAS';
        ELSE
            v_status_pembayaran := 'BELUM_LUNAS';
    END CASE;
    
    -- Check customer segment for wholesale pricing
    IF p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN') AND p_pelanggan_id IS NOT NULL THEN
        SELECT segmen INTO v_pelanggan_segmen
        FROM pelanggan 
        WHERE pelanggan_id = p_pelanggan_id AND status = 'aktif';
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Pelanggan tidak ditemukan atau tidak aktif';
        END IF;
        
        IF v_pelanggan_segmen = 'grosir' THEN
            v_is_grosir := true;
        END IF;
        
        IF p_metode_pembayaran IN ('KREDIT_PELANGGAN', 'TEMPO') THEN
            SELECT COALESCE(SUM(sisa_hutang), 0) INTO v_total_hutang_aktif
            FROM hutang
            WHERE pelanggan_id = p_pelanggan_id
            AND jenis_hutang = 'pelanggan'
            AND status_hutang = 'aktif';
            
        ELSIF p_metode_pembayaran = 'KREDIT' THEN
            IF p_tenor IS NULL OR p_tenor <= 0 THEN
                RAISE EXCEPTION 'Tenor harus diisi untuk metode pembayaran kredit cicilan';
            END IF;
            
            SELECT 
                kredit_setting_id,
                limit_kredit,
                tenor_maksimal,
                bunga_per_bulan,
                biaya_admin
            INTO 
                v_kredit_setting_id,
                v_limit_kredit,
                v_tenor_maksimal,
                v_bunga_per_bulan,
                v_biaya_admin
            FROM kredit_setting
            WHERE pelanggan_id = p_pelanggan_id
            AND status_kredit = 'aktif';
            
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Pengaturan kredit belum disetup untuk pelanggan ini';
            END IF;
            
            IF p_tenor > v_tenor_maksimal THEN
                RAISE EXCEPTION 'Tenor melebihi batas maksimal. Maksimal: % bulan', v_tenor_maksimal;
            END IF;
            
            SELECT COALESCE(SUM(jumlah_kredit - COALESCE(
                (SELECT SUM(jumlah_bayar) 
                 FROM pembayaran_kredit 
                 WHERE kredit_transaksi_id = kredit_transaksi.kredit_transaksi_id), 0
            )), 0) INTO v_total_hutang_aktif
            FROM kredit_transaksi
            WHERE kredit_setting_id = v_kredit_setting_id
            AND status_kredit IN ('aktif', 'terlambat');
            
            v_jumlah_kredit := v_total - COALESCE(p_uang_muka, 0);
            
            IF (v_total_hutang_aktif + v_jumlah_kredit) > v_limit_kredit THEN
                RAISE EXCEPTION 'Limit kredit terlampaui. Limit: %, Kredit aktif: %, Baru: %', 
                    v_limit_kredit, v_total_hutang_aktif, v_jumlah_kredit;
            END IF;
            
            v_total_bunga := (v_jumlah_kredit * COALESCE(v_bunga_per_bulan, 0) * p_tenor) / 100;
            v_total_bayar_kredit := v_jumlah_kredit + v_total_bunga + COALESCE(v_biaya_admin, 0);
            v_angsuran_per_bulan := v_total_bayar_kredit / p_tenor;
        END IF;
        
    ELSIF p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN') AND p_pelanggan_id IS NULL THEN
        v_is_grosir := false;
        
        IF p_metode_pembayaran IN ('KREDIT_PELANGGAN', 'TEMPO', 'KREDIT') THEN
            RAISE EXCEPTION 'Metode pembayaran kredit hanya untuk pelanggan terdaftar';
        END IF;
    END IF;
    
    IF p_jenis_transaksi IN ('PEMBELIAN', 'RETUR_PEMBELIAN') THEN
        IF p_supplier_id IS NULL THEN
            RAISE EXCEPTION 'Supplier ID diperlukan untuk transaksi pembelian';
        END IF;
        
        PERFORM 1 FROM supplier WHERE supplier_id = p_supplier_id AND status = 'aktif';
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Supplier tidak ditemukan atau tidak aktif';
        END IF;
    END IF;
    
    IF p_shift_id IS NOT NULL THEN
        PERFORM 1 FROM shift WHERE shift_id = p_shift_id AND status = 'dibuka' AND cabang_id = p_cabang_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Shift tidak ditemukan atau sudah ditutup';
        END IF;
    END IF;
    
    IF p_promo_id IS NOT NULL THEN
        PERFORM 1 FROM promo_diskon WHERE promo_id = p_promo_id AND status = 'aktif';
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Promo tidak ditemukan atau tidak aktif';
        END IF;
    END IF;
    
    CASE p_jenis_transaksi
        WHEN 'PENJUALAN' THEN v_reference_type := 'penjualan';
        WHEN 'PEMBELIAN' THEN v_reference_type := 'pembelian';
        WHEN 'RETUR_PENJUALAN' THEN v_reference_type := 'retur';
        WHEN 'RETUR_PEMBELIAN' THEN v_reference_type := 'retur';
    END CASE;

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

        IF v_diskon_persen > 0 AND v_diskon_nominal = 0 THEN
            v_diskon_nominal := (v_harga_satuan * v_jumlah * v_diskon_persen) / 100;
        END IF;
        
        SELECT stok, produk_master_id, harga_jual, harga_grosir 
        INTO v_stok, v_produk_master_id, v_harga_jual_db, v_harga_grosir_db
        FROM produk 
        WHERE produk_id = v_produk_id AND cabang_id = p_cabang_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produk dengan ID % tidak ditemukan di cabang ini', v_produk_id;
        END IF;
        
        IF p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN') THEN
            IF v_is_grosir THEN
                IF v_harga_grosir_db IS NULL OR v_harga_grosir_db = 0 THEN
                    RAISE EXCEPTION 'Harga grosir belum diset untuk produk ini';
                END IF;
                v_harga_db := v_harga_grosir_db;
            ELSE
                v_harga_db := v_harga_jual_db;
            END IF;
            
            IF p_jenis_transaksi = 'PENJUALAN' AND v_harga_satuan <> v_harga_db THEN
                IF v_is_grosir THEN
                    RAISE EXCEPTION 'Harga grosir tidak sesuai. Harga: %', v_harga_db;
                ELSE
                    RAISE EXCEPTION 'Harga jual tidak sesuai. Harga: %', v_harga_db;
                END IF;
            END IF;
            
            IF p_jenis_transaksi = 'PENJUALAN' AND v_stok < v_jumlah THEN
                RAISE EXCEPTION 'Stok tidak cukup. Tersedia: %, Diminta: %', v_stok, v_jumlah;
            END IF;
            
        ELSIF p_jenis_transaksi = 'PEMBELIAN' THEN
            IF v_produk_supplier_id IS NOT NULL THEN
                SELECT harga_beli INTO v_harga_db
                FROM produk_supplier
                WHERE produk_supplier_id = v_produk_supplier_id 
                AND supplier_id = p_supplier_id
                AND status = 'aktif';
                
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'Data supplier produk tidak ditemukan';
                END IF;
                
                IF ABS(v_harga_satuan - v_harga_db) > (v_harga_db * 0.1) THEN
                    RAISE NOTICE 'Harga berbeda. Terdaftar: %, Digunakan: %', v_harga_db, v_harga_satuan;
                END IF;
            END IF;
        ELSIF p_jenis_transaksi = 'RETUR_PEMBELIAN' THEN
            IF v_stok < v_jumlah THEN
                RAISE EXCEPTION 'Stok tidak cukup. Tersedia: %, Diminta: %', v_stok, v_jumlah;
            END IF;
        END IF;
        
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
        
        v_subtotal := v_subtotal + (v_harga_satuan * v_jumlah);
        v_total_diskon := v_total_diskon + v_diskon_nominal;
        v_total_pajak := v_total_pajak + v_pajak_nominal;
    END LOOP;
    
    v_total := v_subtotal - v_total_diskon + v_total_pajak + COALESCE(p_biaya_tambahan, 0);
    
    INSERT INTO transaksi (
        transaksi_id, nomor_transaksi, cabang_id, jenis_transaksi, tanggal,
        pelanggan_id, supplier_id, created_by_user_id, created_by, shift_id, promo_id,
        subtotal, diskon, pajak, biaya_tambahan, total,
        status_pembayaran, keterangan, updated_at
    ) VALUES (
        v_transaksi_id, v_nomor_transaksi, p_cabang_id, p_jenis_transaksi, p_tanggal,
        p_pelanggan_id, p_supplier_id, p_user_id, p_user_name, p_shift_id, p_promo_id,
        v_subtotal, v_total_diskon, v_total_pajak, COALESCE(p_biaya_tambahan, 0), v_total,
        v_status_pembayaran,
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
        
        SELECT produk_master_id, harga_beli, harga_jual 
        INTO v_produk_master_id, v_harga_beli_db, v_harga_jual_db 
        FROM produk 
        WHERE produk_id = v_produk_id;
        
        IF v_diskon_persen > 0 AND v_diskon_nominal = 0 THEN
            v_diskon_nominal := (v_harga_satuan * v_jumlah * v_diskon_persen) / 100;
        END IF;
        
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
        
        INSERT INTO transaksi_detail (
            transaksi_detail_id,
            transaksi_id, produk_id, batch_number, expired_date,
            jumlah, harga_satuan, diskon_persen, diskon_nominal,
            subtotal, pajak_persen, total, updated_at
        ) VALUES (
            gen_random_uuid(),
            v_transaksi_id, v_produk_id, v_batch_number, v_expired_date,
            v_jumlah, v_harga_satuan, v_diskon_persen, v_diskon_nominal,
            v_item_subtotal, v_pajak_persen, v_item_total, now()
        );
        
        IF p_jenis_transaksi = 'PEMBELIAN' THEN
            IF v_harga_beli_db <> v_harga_satuan THEN
                INSERT INTO produk_price_history (
                    history_id, produk_id, tipe_harga, harga_lama, harga_baru,
                    tanggal_perubahan, alasan_perubahan, supplier_id, 
                    dokumen_referensi, cabang_id, created_by_user_id, created_at
                ) VALUES (
                    gen_random_uuid(), v_produk_id, 'beli', v_harga_beli_db, v_harga_satuan,
                    p_tanggal, 'Pembelian dari supplier', p_supplier_id,
                    v_nomor_transaksi, p_cabang_id, p_user_id, now()
                );
                
                v_new_harga_jual := ROUND(v_harga_satuan * (1 + (v_margin_percentage / 100)) * 100) / 100;
                
                IF v_harga_jual_db <> v_new_harga_jual THEN
                    INSERT INTO produk_price_history (
                        history_id, produk_id, tipe_harga, harga_lama, harga_baru,
                        tanggal_perubahan, alasan_perubahan, supplier_id, 
                        dokumen_referensi, cabang_id, created_by_user_id, created_at
                    ) VALUES (
                        gen_random_uuid(), v_produk_id, 'jual', v_harga_jual_db, v_new_harga_jual,
                        p_tanggal, 'Penyesuaian margin', p_supplier_id,
                        v_nomor_transaksi, p_cabang_id, p_user_id, now()
                    );
                END IF;
            END IF;
        END IF;
        
        IF p_jenis_transaksi = 'PEMBELIAN' THEN
            UPDATE produk SET 
                stok = stok + v_jumlah,
                harga_beli = v_harga_satuan,
                harga_jual = ROUND(v_harga_satuan * (1 + (v_margin_percentage / 100)) * 100) / 100
            WHERE produk_id = v_produk_id;
        ELSE
            UPDATE produk SET 
                stok = stok + CASE 
                    WHEN p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PEMBELIAN') THEN -v_jumlah
                    ELSE v_jumlah
                END
            WHERE produk_id = v_produk_id;
        END IF;
        
        IF p_jenis_transaksi = 'PEMBELIAN' THEN
            IF v_produk_supplier_id IS NOT NULL THEN
                UPDATE produk_supplier
                SET harga_beli = v_harga_satuan,
                    updated_at = now(),
                    updated_by = p_user_name,
                    updated_by_user_id = p_user_id
                WHERE produk_supplier_id = v_produk_supplier_id;
            ELSE
                PERFORM 1 FROM produk_supplier
                WHERE produk_master_id = v_produk_master_id
                AND supplier_id = p_supplier_id
                AND cabang_id = p_cabang_id;
                
                IF NOT FOUND THEN
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
        
        INSERT INTO inventory_movement (
            movement_id,
            produk_id, cabang_id, reference_id, reference_type,
            quantity, batch_number, expired_date, keterangan, user_id
        ) VALUES (
            gen_random_uuid(), 
            v_produk_id, p_cabang_id, v_transaksi_id, v_reference_type,
            CASE 
                WHEN p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PEMBELIAN') THEN -v_jumlah
                ELSE v_jumlah
            END,
            v_batch_number, v_expired_date,
            p_jenis_transaksi || ' #' || v_nomor_transaksi,
            p_user_id
        );
    END LOOP;
    
    IF p_jenis_transaksi = 'PEMBELIAN' AND p_metode_pembayaran = 'HUTANG' AND p_supplier_id IS NOT NULL THEN
        INSERT INTO hutang (
            hutang_id, transaksi_id, nomor_referensi, tanggal_hutang, 
            jatuh_tempo, jumlah_total, jumlah_bayar, sisa_hutang,
            jenis_hutang, status_hutang, keterangan, 
            cabang_id, supplier_id, created_by_user_id, created_by, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_transaksi_id, v_nomor_transaksi, p_tanggal,
            p_tanggal + interval '30 day', v_total, 0, v_total,
            'supplier', 'aktif', 'Hutang pembelian #' || v_nomor_transaksi,
            p_cabang_id, p_supplier_id, p_user_id, p_user_name, now(), now()
        );
    END IF;
    
    IF p_jenis_transaksi = 'PENJUALAN' AND 
       p_metode_pembayaran IN ('KREDIT_PELANGGAN', 'TEMPO') AND 
       p_pelanggan_id IS NOT NULL THEN
        
        v_jatuh_tempo := p_tanggal::DATE + interval '30 day';
        
        INSERT INTO hutang (
            hutang_id, transaksi_id, nomor_referensi, tanggal_hutang, 
            jatuh_tempo, jumlah_total, jumlah_bayar, sisa_hutang,
            jenis_hutang, status_hutang, keterangan, 
            cabang_id, pelanggan_id, created_by_user_id, created_by, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_transaksi_id, v_nomor_transaksi, p_tanggal,
            v_jatuh_tempo, v_total, 0, v_total,
            'pelanggan', 'aktif', 'Hutang penjualan #' || v_nomor_transaksi,
            p_cabang_id, p_pelanggan_id, p_user_id, p_user_name, now(), now()
        );
    END IF;
    
    IF p_jenis_transaksi = 'PENJUALAN' AND 
       p_metode_pembayaran = 'KREDIT' AND 
       p_pelanggan_id IS NOT NULL AND
       v_kredit_setting_id IS NOT NULL THEN
        
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
            p_user_id, p_user_name, now(), now()
        );
        
        IF p_uang_muka > 0 THEN
            INSERT INTO pembayaran_kredit (
                pembayaran_kredit_id, kredit_transaksi_id, angsuran_ke,
                jumlah_bayar, tanggal_bayar, metode_pembayaran,
                nomor_referensi, keterangan,
                created_by_user_id, created_by, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), 
                (SELECT kredit_transaksi_id FROM kredit_transaksi WHERE transaksi_id = v_transaksi_id),
                0,
                p_uang_muka, p_tanggal, 
                COALESCE(p_metode_pembayaran, 'TUNAI'),
                'DP-' || v_nomor_transaksi,
                'Uang muka #' || v_nomor_transaksi,
                p_user_id, p_user_name, now(), now()
            );
        END IF;
    END IF;
    
    INSERT INTO audit_log (
        log_id,
        user_id, created_by, ip_address, action, table_name, record_id, new_values, cabang_id
    ) VALUES (
        gen_random_uuid(),
        p_user_id, p_user_name, p_ip_address, 'CREATE_TRANSAKSI', 'transaksi', v_transaksi_id,
        jsonb_build_object(
            'transaksi_id', v_transaksi_id,
            'nomor_transaksi', v_nomor_transaksi,
            'jenis_transaksi', p_jenis_transaksi,
            'metode_pembayaran', p_metode_pembayaran,
            'status_pembayaran', v_status_pembayaran,
            'is_grosir', v_is_grosir,
            'tenor', p_tenor,
            'uang_muka', p_uang_muka
        ),
        p_cabang_id
    );
    
    IF p_pelanggan_id IS NOT NULL AND 
       p_jenis_transaksi = 'PENJUALAN' AND 
       p_metode_pembayaran = 'TUNAI' THEN
        PERFORM add_loyalty_points(p_pelanggan_id, v_transaksi_id, v_total, p_user_id, p_ip_address);
    END IF;
    
    RETURN v_transaksi_id;
END;
$function$
;







-- DROP FUNCTION public.add_pembayaran(varchar, varchar, varchar, varchar, numeric, timestamp, varchar, text, varchar, varchar, varchar, int4);

CREATE OR REPLACE FUNCTION public.add_pembayaran(p_transaksi_id character varying, p_metode_pembayaran character varying, p_provider character varying, p_nomor_referensi character varying, p_jumlah_bayar numeric, p_tanggal_pembayaran timestamp without time zone, p_bukti_bayar_url character varying, p_keterangan text, p_user_id character varying, p_ip_address character varying, p_user_name character varying, p_angsuran_ke integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_transaksi RECORD;
    v_total_dibayar DECIMAL(15,2) := 0;
    v_sisa_pembayaran DECIMAL(15,2);
    v_jumlah_kembali DECIMAL(15,2) := 0;
    v_is_fully_paid BOOLEAN := FALSE;
    v_pembayaran_id VARCHAR(36);
    v_pembayaran_kredit_id VARCHAR(36);
	v_pembayaran_hutang_id VARCHAR(36);
    v_total_terbayar DECIMAL(15,2);
    v_current_shift RECORD;
    v_result JSONB;
    v_hutang_id VARCHAR(36);
    v_hutang RECORD;
    v_kredit_transaksi RECORD;
    v_kredit_transaksi_id VARCHAR(36);
    v_total_bayar_kredit DECIMAL(15,2);
    v_sisa_kredit DECIMAL(15,2);
    v_denda DECIMAL(15,2) := 0;
    v_jatuh_tempo_angsuran DATE;
    v_is_terlambat BOOLEAN := FALSE;
BEGIN
    -- Check if transaction exists
    SELECT * INTO v_transaksi 
    FROM transaksi 
    WHERE transaksi_id = p_transaksi_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaksi tidak ditemukan';
    END IF;

    IF v_transaksi.status_pembayaran = 'LUNAS' THEN
        RAISE EXCEPTION 'Transaksi sudah dibayar lunas';
    END IF;
    
    -- Determine payment type based on metode_pembayaran in transaction
    IF p_metode_pembayaran = 'KREDIT' THEN
        -- === PEMBAYARAN KREDIT CICILAN ===
        
        -- Get kredit_transaksi data
        SELECT * INTO v_kredit_transaksi
        FROM kredit_transaksi
        WHERE transaksi_id = p_transaksi_id
        AND status_kredit IN ('aktif', 'terlambat');
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Data kredit tidak ditemukan untuk transaksi ini';
        END IF;
        
        v_kredit_transaksi_id := v_kredit_transaksi.kredit_transaksi_id;
        
        -- Validate angsuran_ke
        IF p_angsuran_ke IS NULL OR p_angsuran_ke <= 0 THEN
            RAISE EXCEPTION 'Angsuran ke- harus diisi untuk pembayaran kredit cicilan';
        END IF;
        
        IF p_angsuran_ke > v_kredit_transaksi.tenor THEN
            RAISE EXCEPTION 'Angsuran ke-% melebihi tenor maksimal %', p_angsuran_ke, v_kredit_transaksi.tenor;
        END IF;
        
        -- Check if angsuran already paid
        PERFORM 1 FROM pembayaran_kredit
        WHERE kredit_transaksi_id = v_kredit_transaksi_id
        AND angsuran_ke = p_angsuran_ke;
        
        IF FOUND THEN
            RAISE EXCEPTION 'Angsuran ke-% sudah dibayar', p_angsuran_ke;
        END IF;
        
        -- Calculate expected due date for this installment
        v_jatuh_tempo_angsuran := v_kredit_transaksi.tanggal_mulai::DATE + (p_angsuran_ke || ' month')::INTERVAL;
        
        -- Check if payment is late and calculate penalty
        IF p_tanggal_pembayaran::DATE > v_jatuh_tempo_angsuran THEN
            v_is_terlambat := TRUE;
            -- Calculate penalty: 2% of installment amount per month late (example)
            v_denda := (v_kredit_transaksi.angsuran_per_bulan * 0.02) * 
                       EXTRACT(DAY FROM p_tanggal_pembayaran::DATE - v_jatuh_tempo_angsuran) / 30;
            v_denda := ROUND(v_denda, 2);
        END IF;
        
        -- Validate payment amount (must be at least angsuran + denda)
        IF p_jumlah_bayar < (v_kredit_transaksi.angsuran_per_bulan + v_denda) THEN
            RAISE EXCEPTION 'Jumlah pembayaran kurang. Minimal: % (Angsuran: % + Denda: %)', 
                ROUND(v_kredit_transaksi.angsuran_per_bulan + v_denda, 2),
                ROUND(v_kredit_transaksi.angsuran_per_bulan, 2),
                ROUND(v_denda, 2);
        END IF;
        
        -- Calculate change if overpayment
        IF p_jumlah_bayar > (v_kredit_transaksi.angsuran_per_bulan + v_denda) THEN
            v_jumlah_kembali := p_jumlah_bayar - (v_kredit_transaksi.angsuran_per_bulan + v_denda);
        END IF;

       v_pembayaran_kredit_id =  gen_random_uuid();
        
        -- Insert pembayaran_kredit
        INSERT INTO pembayaran_kredit (
            pembayaran_kredit_id,
            kredit_transaksi_id,
            angsuran_ke,
            jumlah_bayar,
            tanggal_bayar,
            metode_pembayaran,
            nomor_referensi,
            bukti_url,
            denda,
            keterangan,
            created_by_user_id,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            v_pembayaran_kredit_id,
            v_kredit_transaksi_id,
            p_angsuran_ke,
            v_kredit_transaksi.angsuran_per_bulan,
            p_tanggal_pembayaran,
            p_metode_pembayaran,
            p_nomor_referensi,
            p_bukti_bayar_url,
            v_denda,
            p_keterangan,
            p_user_id,
            p_user_name,
            NOW(),
            NOW()
        );
        
        -- Calculate total paid and remaining
        SELECT COALESCE(SUM(jumlah_bayar), 0) INTO v_total_bayar_kredit
        FROM pembayaran_kredit
        WHERE kredit_transaksi_id = v_kredit_transaksi_id;
        
        v_sisa_kredit := v_kredit_transaksi.total_bayar - v_total_bayar_kredit;
        
        -- Check if fully paid
        IF v_sisa_kredit <= 0.01 THEN
            v_is_fully_paid := TRUE;
            
            -- Update kredit_transaksi status
            UPDATE kredit_transaksi
            SET status_kredit = 'lunas',
                updated_at = NOW()
            WHERE kredit_transaksi_id = v_kredit_transaksi_id;
            
            -- Update transaction status
            UPDATE transaksi
            SET status_pembayaran = 'LUNAS',
                tanggal_lunas = NOW(),
                updated_at = NOW()
            WHERE transaksi_id = p_transaksi_id;
            
        ELSIF v_is_terlambat THEN
            -- Update to terlambat if not already
            UPDATE kredit_transaksi
            SET status_kredit = 'terlambat',
                updated_at = NOW()
            WHERE kredit_transaksi_id = v_kredit_transaksi_id
            AND status_kredit = 'aktif';
        END IF;
        
        v_sisa_pembayaran := v_sisa_kredit;
        
    ELSIF p_metode_pembayaran IN ('KREDIT_PELANGGAN', 'TEMPO', 'HUTANG') THEN
        -- === PEMBAYARAN HUTANG/PIUTANG ===
        
        -- Get hutang data
        SELECT * INTO v_hutang
        FROM hutang
        WHERE transaksi_id = p_transaksi_id
        AND status_hutang = 'aktif';
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Data hutang tidak ditemukan untuk transaksi ini';
        END IF;
        
        v_hutang_id := v_hutang.hutang_id;
        v_sisa_pembayaran := v_hutang.sisa_hutang;
        
        -- Validate payment amount
        IF p_jumlah_bayar <= 0 THEN
            RAISE EXCEPTION 'Jumlah pembayaran harus lebih dari 0';
        END IF;
        
        -- Allow partial payment for hutang
        IF p_jumlah_bayar > v_sisa_pembayaran THEN
            v_jumlah_kembali := p_jumlah_bayar - v_sisa_pembayaran;
        END IF;
        
        -- Calculate effective payment
        v_total_terbayar := LEAST(p_jumlah_bayar, v_sisa_pembayaran);

        v_pembayaran_hutang_id =  gen_random_uuid();
        
        -- Insert pembayaran_hutang
        INSERT INTO pembayaran_hutang (
            pembayaran_hutang_id,
            hutang_id,
            tanggal_bayar,
            jumlah_bayar,
            metode_pembayaran,
            nomor_referensi,
            bukti_url,
            keterangan,
            user_id,
            created_by_user_id,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            v_pembayaran_hutang_id,
            v_hutang_id,
            p_tanggal_pembayaran,
            v_total_terbayar,
            p_metode_pembayaran,
            p_nomor_referensi,
            p_bukti_bayar_url,
            p_keterangan,
            p_user_id,
            p_user_id,
            p_user_name,
            NOW(),
            NOW()
        );
        
        -- Update hutang record
        UPDATE hutang
        SET jumlah_bayar = jumlah_bayar + v_total_terbayar,
            sisa_hutang = sisa_hutang - v_total_terbayar,
            status_hutang = CASE 
                WHEN (sisa_hutang - v_total_terbayar) <= 0.01 THEN 'lunas'
                ELSE 'aktif'
            END,
            updated_at = NOW()
        WHERE hutang_id = v_hutang_id;
        
        -- Check if fully paid
        IF (v_hutang.sisa_hutang - v_total_terbayar) <= 0.01 THEN
            v_is_fully_paid := TRUE;
            
            -- Update transaction status
            UPDATE transaksi
            SET status_pembayaran = 'LUNAS',
                tanggal_lunas = NOW(),
                updated_at = NOW()
            WHERE transaksi_id = p_transaksi_id;
        END IF;
        
        v_sisa_pembayaran := v_hutang.sisa_hutang - v_total_terbayar;
        
    ELSE
        -- === PEMBAYARAN TUNAI/LANGSUNG ===
        
        -- Calculate total already paid
        SELECT COALESCE(SUM(jumlah_bayar - jumlah_kembali), 0) INTO v_total_dibayar
        FROM pembayaran
        WHERE transaksi_id = p_transaksi_id;
        
        -- Calculate remaining payment
        v_sisa_pembayaran := v_transaksi.total - v_total_dibayar;
        
        IF v_sisa_pembayaran <= 0 THEN
            RAISE EXCEPTION 'Transaksi sudah dibayar lunas. Sisa pembayaran: %', ROUND(v_sisa_pembayaran, 2);
        END IF;

        -- Validate payment amount
        IF p_jumlah_bayar < v_sisa_pembayaran THEN
            RAISE EXCEPTION 'Jumlah pembayaran tidak mencukupi. Sisa tagihan: %', ROUND(v_sisa_pembayaran, 2);
        END IF;
        
        -- Calculate change amount
        IF p_jumlah_bayar > v_sisa_pembayaran THEN
            v_jumlah_kembali := p_jumlah_bayar - v_sisa_pembayaran;
        END IF;
        
        -- Create payment
        v_pembayaran_id := gen_random_uuid();
        
        INSERT INTO pembayaran (
            pembayaran_id, 
            transaksi_id, 
            metode_pembayaran, 
            provider, 
            nomor_referensi, 
            jumlah_bayar, 
            jumlah_kembali, 
            tanggal_pembayaran, 
            bukti_bayar_url, 
            created_by_user_id,
            created_by,
            updated_by_user_id,
            updated_by,
            status, 
            keterangan, 
            created_at, 
            updated_at
        ) VALUES (
            v_pembayaran_id,
            p_transaksi_id,
            p_metode_pembayaran,
            p_provider,
            p_nomor_referensi,
            p_jumlah_bayar,
            v_jumlah_kembali,
            COALESCE(p_tanggal_pembayaran, NOW()),
            p_bukti_bayar_url,
            p_user_id,
            p_user_name,
            p_user_id,
            p_user_name,
            'SUKSES',
            p_keterangan,
            NOW(),
            NOW()
        );
        
        -- Calculate if fully paid
        v_total_terbayar := v_total_dibayar + (p_jumlah_bayar - v_jumlah_kembali);
        v_is_fully_paid := v_total_terbayar >= (v_transaksi.total - 0.01);
        
        -- Update transaction status if fully paid
        IF v_is_fully_paid THEN
            UPDATE transaksi
            SET status_pembayaran = 'LUNAS',
                tanggal_lunas = NOW(),
                updated_at = NOW()
            WHERE transaksi_id = p_transaksi_id;
        END IF;
        
        v_sisa_pembayaran := v_transaksi.total - v_total_terbayar;
    END IF;
    
    -- Update shift data if transaction has shift_id and is fully paid
    IF v_is_fully_paid AND v_transaksi.shift_id IS NOT NULL THEN
        SELECT * INTO v_current_shift
        FROM shift
        WHERE shift_id = v_transaksi.shift_id;
        
        IF FOUND THEN
            UPDATE shift
            SET total_transaksi = COALESCE(v_current_shift.total_transaksi, 0) + 1,
                total_pendapatan = COALESCE(v_current_shift.total_pendapatan, 0) + v_transaksi.total,
                updated_at = NOW()
            WHERE shift_id = v_transaksi.shift_id;
        END IF;
    END IF;
    
    -- Add audit log
    INSERT INTO audit_log (
        log_id,
        user_id,
        created_by,
        ip_address,
        action,
        table_name,
        record_id,
        new_values,
        created_at,
        cabang_id
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        p_user_name,
        p_ip_address,
        'ADD_PEMBAYARAN',
        'pembayaran',
        COALESCE(v_pembayaran_id::text, v_hutang_id, v_kredit_transaksi_id),
        jsonb_build_object(
            'transaksi_id', p_transaksi_id,
            'metode_pembayaran', p_metode_pembayaran,
            'tipe_pembayaran', p_metode_pembayaran,
            'jumlah_bayar', p_jumlah_bayar,
            'jumlah_kembali', v_jumlah_kembali,
            'denda', v_denda,
            'angsuran_ke', p_angsuran_ke,
            'total_transaksi', v_transaksi.total,
            'sisa_pembayaran', GREATEST(0, v_sisa_pembayaran),
            'is_fully_paid', v_is_fully_paid
        )::text,
        NOW(),
        v_transaksi.cabang_id
    );
    
    
    -- Get the result data for response
    WITH payment_info AS (
        SELECT 
            p.*,
            CASE 
                WHEN p_metode_pembayaran = 'KREDIT' THEN 
                    (SELECT row_to_json(pk.*) FROM pembayaran_kredit pk 
                     WHERE pk.kredit_transaksi_id = v_kredit_transaksi_id 
                     AND pk.angsuran_ke = p_angsuran_ke)
                WHEN p_metode_pembayaran IN ('KREDIT_PELANGGAN', 'TEMPO', 'HUTANG') THEN
                    (SELECT row_to_json(ph.*) FROM pembayaran_hutang ph 
                     WHERE ph.hutang_id = v_hutang_id 
                     ORDER BY ph.created_at DESC LIMIT 1)
                ELSE
                    (SELECT row_to_json(pb.*) FROM pembayaran pb 
                     WHERE pb.pembayaran_id = v_pembayaran_id)
            END as detail_pembayaran
        FROM pembayaran p
        WHERE p.transaksi_id = p_transaksi_id
    ),
    transaction_info AS (
        SELECT 
            t.*,
            json_agg(td.*) AS transaksi_detail,
            (SELECT row_to_json(pl.*) FROM pelanggan pl WHERE pl.pelanggan_id = t.pelanggan_id) AS pelanggan,
            (SELECT row_to_json(s.*) FROM supplier s WHERE s.supplier_id = t.supplier_id) AS supplier,
            (SELECT row_to_json(c.*) FROM cabang c WHERE c.cabang_id = t.cabang_id) AS cabang,
            (SELECT row_to_json(sh.*) FROM shift sh WHERE sh.shift_id = t.shift_id) AS shift,
            CASE 
                WHEN p_metode_pembayaran = 'KREDIT' THEN
                    (SELECT row_to_json(kt.*) FROM kredit_transaksi kt WHERE kt.transaksi_id = t.transaksi_id)
                WHEN p_metode_pembayaran IN ('KREDIT_PELANGGAN', 'TEMPO', 'HUTANG') THEN
                    (SELECT row_to_json(h.*) FROM hutang h WHERE h.transaksi_id = t.transaksi_id)
                ELSE NULL
            END as detail_kredit_hutang
        FROM transaksi t
        LEFT JOIN transaksi_detail td ON t.transaksi_id = td.transaksi_id
        WHERE t.transaksi_id = p_transaksi_id
        GROUP BY t.transaksi_id
    )
    SELECT jsonb_build_object(
        'transaction', row_to_json(transaction_info)::jsonb,
        'payment_info', jsonb_build_object(
            'jumlah_bayar', p_jumlah_bayar,
            'jumlah_kembali', v_jumlah_kembali,
            'denda', v_denda,
            'angsuran_ke', p_angsuran_ke,
            'sisa_pembayaran', GREATEST(0, v_sisa_pembayaran),
            'is_fully_paid', v_is_fully_paid,
            'pembayaran_id', COALESCE(v_pembayaran_id::text, v_hutang_id, v_kredit_transaksi_id),
            'tipe_pembayaran', p_metode_pembayaran
        )
    ) INTO v_result
    FROM transaction_info;
    
    -- Return the result
    RETURN v_result;
END;
$function$
;



















-- DROP FUNCTION public.create_transaksi(varchar, varchar, timestamp, varchar, varchar, varchar, varchar, jsonb, float8, text, jsonb, varchar, varchar, varchar, varchar, int4, numeric);

CREATE OR REPLACE FUNCTION public.create_transaksi_with_promo(p_cabang_id character varying, p_jenis_transaksi character varying, p_tanggal timestamp without time zone, p_pelanggan_id character varying, p_supplier_id character varying, p_shift_id character varying,  p_details jsonb, p_biaya_tambahan double precision, p_keterangan text, p_customer_info jsonb, p_user_id character varying, p_ip_address character varying, p_user_name character varying, p_promo_codes VARCHAR[] DEFAULT null, p_metode_pembayaran character varying DEFAULT NULL::character varying, p_tenor integer DEFAULT NULL::integer, p_uang_muka numeric DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_nomor_transaksi VARCHAR;
    v_transaksi_id VARCHAR(36);
    v_subtotal DECIMAL := 0;
    v_total_pajak DECIMAL := 0;
    v_total_diskon DECIMAL := 0;
    v_total_diskon_promo DECIMAL := 0;
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
    v_harga_beli_db DECIMAL;
    v_harga_jual_db DECIMAL;
    v_harga_grosir_db DECIMAL;
    v_stok INTEGER;
    v_produk_master_id VARCHAR(36);
    v_new_harga_jual DECIMAL;
    v_margin_percentage DECIMAL := 10;
    v_pelanggan_segmen VARCHAR;
    v_is_grosir BOOLEAN := false;
    v_status_pembayaran VARCHAR;
    v_kredit_setting_id VARCHAR(36);
    v_limit_kredit DECIMAL;
    v_total_hutang_aktif DECIMAL;
    v_tenor_maksimal INTEGER;
    v_bunga_per_bulan DECIMAL;
    v_biaya_admin DECIMAL;
    v_jumlah_kredit DECIMAL;
    v_total_bunga DECIMAL;
    v_total_bayar_kredit DECIMAL;
    v_angsuran_per_bulan DECIMAL;
    v_jatuh_tempo DATE;
    v_promo_result JSONB;  -- ⭐ NEW
    v_promo JSONB;  -- ⭐ NEW
    v_promo_id VARCHAR;  -- ⭐ NEW
    v_promo_discount DECIMAL;  -- ⭐ NEW
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
    
    -- Determine payment status based on payment method
    CASE 
        WHEN p_metode_pembayaran IN ('KREDIT_PELANGGAN', 'TEMPO') THEN
            v_status_pembayaran := 'BELUM_LUNAS';
        WHEN p_metode_pembayaran = 'KREDIT' THEN
            v_status_pembayaran := 'BELUM_LUNAS';
        WHEN p_metode_pembayaran = 'HUTANG' THEN
            v_status_pembayaran := 'BELUM_LUNAS';
        ELSE
            v_status_pembayaran := 'BELUM_LUNAS';
    END CASE;
    
    -- Check customer segment for wholesale pricing
    IF p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN') AND p_pelanggan_id IS NOT NULL THEN
        SELECT segmen INTO v_pelanggan_segmen
        FROM pelanggan 
        WHERE pelanggan_id = p_pelanggan_id AND status = 'aktif';
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Pelanggan tidak ditemukan atau tidak aktif';
        END IF;
        
        IF v_pelanggan_segmen = 'grosir' THEN
            v_is_grosir := true;
        END IF;
        
        IF p_metode_pembayaran IN ('KREDIT_PELANGGAN', 'TEMPO') THEN
            SELECT COALESCE(SUM(sisa_hutang), 0) INTO v_total_hutang_aktif
            FROM hutang
            WHERE pelanggan_id = p_pelanggan_id
            AND jenis_hutang = 'pelanggan'
            AND status_hutang = 'aktif';
            
        ELSIF p_metode_pembayaran = 'KREDIT' THEN
            IF p_tenor IS NULL OR p_tenor <= 0 THEN
                RAISE EXCEPTION 'Tenor harus diisi untuk metode pembayaran kredit cicilan';
            END IF;
            
            SELECT 
                kredit_setting_id,
                limit_kredit,
                tenor_maksimal,
                bunga_per_bulan,
                biaya_admin
            INTO 
                v_kredit_setting_id,
                v_limit_kredit,
                v_tenor_maksimal,
                v_bunga_per_bulan,
                v_biaya_admin
            FROM kredit_setting
            WHERE pelanggan_id = p_pelanggan_id
            AND status_kredit = 'aktif';
            
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Pengaturan kredit belum disetup untuk pelanggan ini';
            END IF;
            
            IF p_tenor > v_tenor_maksimal THEN
                RAISE EXCEPTION 'Tenor melebihi batas maksimal. Maksimal: % bulan', v_tenor_maksimal;
            END IF;
            
            SELECT COALESCE(SUM(jumlah_kredit - COALESCE(
                (SELECT SUM(jumlah_bayar) 
                 FROM pembayaran_kredit 
                 WHERE kredit_transaksi_id = kredit_transaksi.kredit_transaksi_id), 0
            )), 0) INTO v_total_hutang_aktif
            FROM kredit_transaksi
            WHERE kredit_setting_id = v_kredit_setting_id
            AND status_kredit IN ('aktif', 'terlambat');
            
            v_jumlah_kredit := v_total - COALESCE(p_uang_muka, 0);
            
            IF (v_total_hutang_aktif + v_jumlah_kredit) > v_limit_kredit THEN
                RAISE EXCEPTION 'Limit kredit terlampaui. Limit: %, Kredit aktif: %, Baru: %', 
                    v_limit_kredit, v_total_hutang_aktif, v_jumlah_kredit;
            END IF;
            
            v_total_bunga := (v_jumlah_kredit * COALESCE(v_bunga_per_bulan, 0) * p_tenor) / 100;
            v_total_bayar_kredit := v_jumlah_kredit + v_total_bunga + COALESCE(v_biaya_admin, 0);
            v_angsuran_per_bulan := v_total_bayar_kredit / p_tenor;
        END IF;
        
    ELSIF p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN') AND p_pelanggan_id IS NULL THEN
        v_is_grosir := false;
        
        IF p_metode_pembayaran IN ('KREDIT_PELANGGAN', 'TEMPO', 'KREDIT') THEN
            RAISE EXCEPTION 'Metode pembayaran kredit hanya untuk pelanggan terdaftar';
        END IF;
    END IF;
    
    IF p_jenis_transaksi IN ('PEMBELIAN', 'RETUR_PEMBELIAN') THEN
        IF p_supplier_id IS NULL THEN
            RAISE EXCEPTION 'Supplier ID diperlukan untuk transaksi pembelian';
        END IF;
        
        PERFORM 1 FROM supplier WHERE supplier_id = p_supplier_id AND status = 'aktif';
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Supplier tidak ditemukan atau tidak aktif';
        END IF;
    END IF;
    
    IF p_shift_id IS NOT NULL THEN
        PERFORM 1 FROM shift WHERE shift_id = p_shift_id AND status = 'dibuka' AND cabang_id = p_cabang_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Shift tidak ditemukan atau sudah ditutup';
        END IF;
    END IF;
    
    IF p_promo_codes IS NOT NULL AND array_length(p_promo_codes, 1) > 0 THEN
        v_promo_result := apply_multiple_promos(
            p_promo_codes,
            p_cabang_id,
            p_pelanggan_id,
            p_details,
            v_subtotal,
            p_metode_pembayaran
        );
        
        v_total_diskon_promo := (v_promo_result->>'total_discount')::DECIMAL;
    END IF;
    
    CASE p_jenis_transaksi
        WHEN 'PENJUALAN' THEN v_reference_type := 'penjualan';
        WHEN 'PEMBELIAN' THEN v_reference_type := 'pembelian';
        WHEN 'RETUR_PENJUALAN' THEN v_reference_type := 'retur';
        WHEN 'RETUR_PEMBELIAN' THEN v_reference_type := 'retur';
    END CASE;

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

        IF v_diskon_persen > 0 AND v_diskon_nominal = 0 THEN
            v_diskon_nominal := (v_harga_satuan * v_jumlah * v_diskon_persen) / 100;
        END IF;
        
        SELECT stok, produk_master_id, harga_jual, harga_grosir 
        INTO v_stok, v_produk_master_id, v_harga_jual_db, v_harga_grosir_db
        FROM produk 
        WHERE produk_id = v_produk_id AND cabang_id = p_cabang_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produk dengan ID % tidak ditemukan di cabang ini', v_produk_id;
        END IF;
        
        IF p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN') THEN
            IF v_is_grosir THEN
                IF v_harga_grosir_db IS NULL OR v_harga_grosir_db = 0 THEN
                    RAISE EXCEPTION 'Harga grosir belum diset untuk produk ini';
                END IF;
                v_harga_db := v_harga_grosir_db;
            ELSE
                v_harga_db := v_harga_jual_db;
            END IF;
            
            IF p_jenis_transaksi = 'PENJUALAN' AND v_harga_satuan <> v_harga_db THEN
                IF v_is_grosir THEN
                    RAISE EXCEPTION 'Harga grosir tidak sesuai. Harga: %', v_harga_db;
                ELSE
                    RAISE EXCEPTION 'Harga jual tidak sesuai. Harga: %', v_harga_db;
                END IF;
            END IF;
            
            IF p_jenis_transaksi = 'PENJUALAN' AND v_stok < v_jumlah THEN
                RAISE EXCEPTION 'Stok tidak cukup. Tersedia: %, Diminta: %', v_stok, v_jumlah;
            END IF;
            
        ELSIF p_jenis_transaksi = 'PEMBELIAN' THEN
            IF v_produk_supplier_id IS NOT NULL THEN
                SELECT harga_beli INTO v_harga_db
                FROM produk_supplier
                WHERE produk_supplier_id = v_produk_supplier_id 
                AND supplier_id = p_supplier_id
                AND status = 'aktif';
                
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'Data supplier produk tidak ditemukan';
                END IF;
                
                IF ABS(v_harga_satuan - v_harga_db) > (v_harga_db * 0.1) THEN
                    RAISE NOTICE 'Harga berbeda. Terdaftar: %, Digunakan: %', v_harga_db, v_harga_satuan;
                END IF;
            END IF;
        ELSIF p_jenis_transaksi = 'RETUR_PEMBELIAN' THEN
            IF v_stok < v_jumlah THEN
                RAISE EXCEPTION 'Stok tidak cukup. Tersedia: %, Diminta: %', v_stok, v_jumlah;
            END IF;
        END IF;
        
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
        
        v_subtotal := v_subtotal + (v_harga_satuan * v_jumlah);
        v_total_diskon := v_total_diskon + v_diskon_nominal;
        v_total_pajak := v_total_pajak + v_pajak_nominal;
    END LOOP;
    
    v_total := v_subtotal - v_total_diskon - v_total_diskon_promo + v_total_pajak + COALESCE(p_biaya_tambahan, 0);
    
    INSERT INTO transaksi (
        transaksi_id, nomor_transaksi, cabang_id, jenis_transaksi, tanggal,
        pelanggan_id, supplier_id, created_by_user_id, created_by, shift_id, promo_id,
        subtotal, diskon, pajak, biaya_tambahan, total,
        status_pembayaran, keterangan, updated_at
    ) VALUES (
        v_transaksi_id, v_nomor_transaksi, p_cabang_id, p_jenis_transaksi, p_tanggal,
        p_pelanggan_id, p_supplier_id, p_user_id, p_user_name, p_shift_id, p_promo_id,
        v_subtotal, v_total_diskon, v_total_pajak, COALESCE(p_biaya_tambahan, 0), v_total,
        v_status_pembayaran,
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


IF v_promo_result IS NOT NULL THEN
        FOR v_promo IN SELECT * FROM jsonb_array_elements(v_promo_result->'applicable_promos')
        LOOP
            v_promo_id := v_promo->>'promo_id';
            v_promo_discount := (v_promo->>'discount')::DECIMAL;
            
            INSERT INTO transaksi_promo (
                transaksi_promo_id,
                transaksi_id,
                promo_id,
                total_diskon,
                is_applied,
                metadata,
                created_at
            ) VALUES (
                gen_random_uuid(),
                v_transaksi_id,
                v_promo_id,
                v_promo_discount,
                TRUE,
                v_promo,
                NOW()
            );
            
            -- Update promo usage counter
            UPDATE promo_diskon
            SET current_usage = current_usage + 1
            WHERE promo_id = v_promo_id;
            
            -- Insert voucher usage if applicable
            IF p_pelanggan_id IS NOT NULL THEN
                INSERT INTO voucher_usage (
                    voucher_usage_id,
                    promo_id,
                    pelanggan_id,
                    transaksi_id,
                    kode_voucher,
                    tanggal_digunakan,
                    nilai_diskon
                ) VALUES (
                    gen_random_uuid(),
                    v_promo_id,
                    p_pelanggan_id,
                    v_transaksi_id,
                    v_promo->>'kode_promo',
                    NOW(),
                    v_promo_discount
                );
            END IF;
        END LOOP;
    END IF;
    
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
        
        SELECT produk_master_id, harga_beli, harga_jual 
        INTO v_produk_master_id, v_harga_beli_db, v_harga_jual_db 
        FROM produk 
        WHERE produk_id = v_produk_id;
        
        IF v_diskon_persen > 0 AND v_diskon_nominal = 0 THEN
            v_diskon_nominal := (v_harga_satuan * v_jumlah * v_diskon_persen) / 100;
        END IF;
        
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
        
        INSERT INTO transaksi_detail (
            transaksi_detail_id,
            transaksi_id, produk_id, batch_number, expired_date,
            jumlah, harga_satuan, diskon_persen, diskon_nominal,
            subtotal, pajak_persen, total, updated_at
        ) VALUES (
            gen_random_uuid(),
            v_transaksi_id, v_produk_id, v_batch_number, v_expired_date,
            v_jumlah, v_harga_satuan, v_diskon_persen, v_diskon_nominal,
            v_item_subtotal, v_pajak_persen, v_item_total, now()
        );
        
        IF p_jenis_transaksi = 'PEMBELIAN' THEN
            IF v_harga_beli_db <> v_harga_satuan THEN
                INSERT INTO produk_price_history (
                    history_id, produk_id, tipe_harga, harga_lama, harga_baru,
                    tanggal_perubahan, alasan_perubahan, supplier_id, 
                    dokumen_referensi, cabang_id, created_by_user_id, created_at
                ) VALUES (
                    gen_random_uuid(), v_produk_id, 'beli', v_harga_beli_db, v_harga_satuan,
                    p_tanggal, 'Pembelian dari supplier', p_supplier_id,
                    v_nomor_transaksi, p_cabang_id, p_user_id, now()
                );
                
                v_new_harga_jual := ROUND(v_harga_satuan * (1 + (v_margin_percentage / 100)) * 100) / 100;
                
                IF v_harga_jual_db <> v_new_harga_jual THEN
                    INSERT INTO produk_price_history (
                        history_id, produk_id, tipe_harga, harga_lama, harga_baru,
                        tanggal_perubahan, alasan_perubahan, supplier_id, 
                        dokumen_referensi, cabang_id, created_by_user_id, created_at
                    ) VALUES (
                        gen_random_uuid(), v_produk_id, 'jual', v_harga_jual_db, v_new_harga_jual,
                        p_tanggal, 'Penyesuaian margin', p_supplier_id,
                        v_nomor_transaksi, p_cabang_id, p_user_id, now()
                    );
                END IF;
            END IF;
        END IF;
        
        IF p_jenis_transaksi = 'PEMBELIAN' THEN
            UPDATE produk SET 
                stok = stok + v_jumlah,
                harga_beli = v_harga_satuan,
                harga_jual = ROUND(v_harga_satuan * (1 + (v_margin_percentage / 100)) * 100) / 100
            WHERE produk_id = v_produk_id;
        ELSE
            UPDATE produk SET 
                stok = stok + CASE 
                    WHEN p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PEMBELIAN') THEN -v_jumlah
                    ELSE v_jumlah
                END
            WHERE produk_id = v_produk_id;
        END IF;
        
        IF p_jenis_transaksi = 'PEMBELIAN' THEN
            IF v_produk_supplier_id IS NOT NULL THEN
                UPDATE produk_supplier
                SET harga_beli = v_harga_satuan,
                    updated_at = now(),
                    updated_by = p_user_name,
                    updated_by_user_id = p_user_id
                WHERE produk_supplier_id = v_produk_supplier_id;
            ELSE
                PERFORM 1 FROM produk_supplier
                WHERE produk_master_id = v_produk_master_id
                AND supplier_id = p_supplier_id
                AND cabang_id = p_cabang_id;
                
                IF NOT FOUND THEN
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
        
        INSERT INTO inventory_movement (
            movement_id,
            produk_id, cabang_id, reference_id, reference_type,
            quantity, batch_number, expired_date, keterangan, user_id
        ) VALUES (
            gen_random_uuid(), 
            v_produk_id, p_cabang_id, v_transaksi_id, v_reference_type,
            CASE 
                WHEN p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PEMBELIAN') THEN -v_jumlah
                ELSE v_jumlah
            END,
            v_batch_number, v_expired_date,
            p_jenis_transaksi || ' #' || v_nomor_transaksi,
            p_user_id
        );
    END LOOP;
    
    IF p_jenis_transaksi = 'PEMBELIAN' AND p_metode_pembayaran = 'HUTANG' AND p_supplier_id IS NOT NULL THEN
        INSERT INTO hutang (
            hutang_id, transaksi_id, nomor_referensi, tanggal_hutang, 
            jatuh_tempo, jumlah_total, jumlah_bayar, sisa_hutang,
            jenis_hutang, status_hutang, keterangan, 
            cabang_id, supplier_id, created_by_user_id, created_by, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_transaksi_id, v_nomor_transaksi, p_tanggal,
            p_tanggal + interval '30 day', v_total, 0, v_total,
            'supplier', 'aktif', 'Hutang pembelian #' || v_nomor_transaksi,
            p_cabang_id, p_supplier_id, p_user_id, p_user_name, now(), now()
        );
    END IF;
    
    IF p_jenis_transaksi = 'PENJUALAN' AND 
       p_metode_pembayaran IN ('KREDIT_PELANGGAN', 'TEMPO') AND 
       p_pelanggan_id IS NOT NULL THEN
        
        v_jatuh_tempo := p_tanggal::DATE + interval '30 day';
        
        INSERT INTO hutang (
            hutang_id, transaksi_id, nomor_referensi, tanggal_hutang, 
            jatuh_tempo, jumlah_total, jumlah_bayar, sisa_hutang,
            jenis_hutang, status_hutang, keterangan, 
            cabang_id, pelanggan_id, created_by_user_id, created_by, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_transaksi_id, v_nomor_transaksi, p_tanggal,
            v_jatuh_tempo, v_total, 0, v_total,
            'pelanggan', 'aktif', 'Hutang penjualan #' || v_nomor_transaksi,
            p_cabang_id, p_pelanggan_id, p_user_id, p_user_name, now(), now()
        );
    END IF;
    
    IF p_jenis_transaksi = 'PENJUALAN' AND 
       p_metode_pembayaran = 'KREDIT' AND 
       p_pelanggan_id IS NOT NULL AND
       v_kredit_setting_id IS NOT NULL THEN
        
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
            p_user_id, p_user_name, now(), now()
        );
        
        IF p_uang_muka > 0 THEN
            INSERT INTO pembayaran_kredit (
                pembayaran_kredit_id, kredit_transaksi_id, angsuran_ke,
                jumlah_bayar, tanggal_bayar, metode_pembayaran,
                nomor_referensi, keterangan,
                created_by_user_id, created_by, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), 
                (SELECT kredit_transaksi_id FROM kredit_transaksi WHERE transaksi_id = v_transaksi_id),
                0,
                p_uang_muka, p_tanggal, 
                COALESCE(p_metode_pembayaran, 'TUNAI'),
                'DP-' || v_nomor_transaksi,
                'Uang muka #' || v_nomor_transaksi,
                p_user_id, p_user_name, now(), now()
            );
        END IF;
    END IF;
    
    INSERT INTO audit_log (
        log_id,
        user_id, created_by, ip_address, action, table_name, record_id, new_values, cabang_id
    ) VALUES (
        gen_random_uuid(),
        p_user_id, p_user_name, p_ip_address, 'CREATE_TRANSAKSI', 'transaksi', v_transaksi_id,
        jsonb_build_object(
            'transaksi_id', v_transaksi_id,
            'nomor_transaksi', v_nomor_transaksi,
            'jenis_transaksi', p_jenis_transaksi,
            'metode_pembayaran', p_metode_pembayaran,
            'status_pembayaran', v_status_pembayaran,
            'is_grosir', v_is_grosir,
            'tenor', p_tenor,
            'uang_muka', p_uang_muka
        ),
        p_cabang_id
    );
    
    IF p_pelanggan_id IS NOT NULL AND 
       p_jenis_transaksi = 'PENJUALAN' AND 
       p_metode_pembayaran = 'TUNAI' THEN
        PERFORM add_loyalty_points(p_pelanggan_id, v_transaksi_id, v_total, p_user_id, p_ip_address);
    END IF;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'transaksi_id', v_transaksi_id,
        'nomor_transaksi', v_nomor_transaksi,
        'subtotal', v_subtotal,
        'diskon_item', v_total_diskon,
        'diskon_promo', v_total_diskon_promo,
        'pajak', v_total_pajak,
        'biaya_tambahan', COALESCE(p_biaya_tambahan, 0),
        'total', v_total,
        'promos_applied', v_promo_result->'applicable_promos',
        'promo_errors', v_promo_result->'errors'
    );
END;
$function$
;
