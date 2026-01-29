-- Buat fungsi untuk menambahkan poin loyalitas
DECLARE
    v_point_sebelumnya INTEGER;
    v_point_didapatkan INTEGER;
    v_point_akhir INTEGER;
    v_loyalty_config RECORD;
BEGIN
    -- Ambil konfigurasi loyalty point (misalnya dari tabel konfigurasi)
    -- Asumsikan ada tabel loyalty_config dengan field point_rate
    SELECT point_rate INTO v_loyalty_config 
    FROM loyalty_config 
    LIMIT 1;
    
    -- Default point rate jika tidak ditemukan
    IF NOT FOUND THEN
        v_loyalty_config.point_rate := 10000; -- Default: 1 point per 10,000 unit
    END IF;
    
    -- Hitung point yang didapatkan (dibulatkan ke bawah)
    v_point_didapatkan := FLOOR(p_total / v_loyalty_config.point_rate);
    
    -- Jika poin yang didapatkan lebih dari 0
    IF v_point_didapatkan > 0 THEN
        -- Ambil poin pelanggan saat ini
        SELECT COALESCE(poin, 0) INTO v_point_sebelumnya
        FROM pelanggan
        WHERE id = p_pelanggan_id;
        
        -- Hitung poin akhir
        v_point_akhir := v_point_sebelumnya + v_point_didapatkan;
        
        -- Update poin pelanggan
        UPDATE pelanggan
        SET poin = v_point_akhir
        WHERE id = p_pelanggan_id;
        
        -- Catat history poin
        INSERT INTO loyalty_point_history (
            pelanggan_id, 
            transaksi_id, 
            point_sebelumnya, 
            point_didapatkan, 
            point_akhir, 
            keterangan
        ) VALUES (
            p_pelanggan_id,
            p_transaksi_id,
            v_point_sebelumnya,
            v_point_didapatkan,
            v_point_akhir,
            'Poin dari transaksi #' || p_transaksi_id
        );
        
        -- Tambahkan log audit jika diperlukan
        INSERT INTO audit_log (
            user_id, 
            ip_address, 
            action, 
            table_name, 
            record_id, 
            new_values
        ) VALUES (
            p_user_id,
            p_ip_address,
            'ADD_LOYALTY_POINTS',
            'pelanggan',
            p_pelanggan_id,
            jsonb_build_object(
                'transaksi_id', p_transaksi_id,
                'point_sebelumnya', v_point_sebelumnya,
                'point_didapatkan', v_point_didapatkan,
                'point_akhir', v_point_akhir
            )
        );
    END IF;
END;




-- Fungsi create_transaksi dengan UUID sebagai tipe ID
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
    
    -- Validasi entity terkait dalam satu query
    IF p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN') AND p_pelanggan_id IS NOT NULL THEN
        PERFORM 1 FROM pelanggan WHERE id = p_pelanggan_id AND status = 'aktif';
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Pelanggan tidak ditemukan atau tidak aktif';
        END IF;
    ELSIF p_jenis_transaksi IN ('PEMBELIAN', 'RETUR_PEMBELIAN') THEN
        IF p_supplier_id IS NULL THEN
            RAISE EXCEPTION 'Supplier ID diperlukan untuk transaksi pembelian';
        END IF;
        
        PERFORM 1 FROM supplier WHERE id = p_supplier_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Supplier tidak ditemukan';
        END IF;
    END IF;
    
    -- Validasi shift
    IF p_shift_id IS NOT NULL THEN
        PERFORM 1 FROM shift WHERE shift_id = p_shift_id AND status = 'dibuka';
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
        v_jumlah := (v_detail->>'jumlah')::INTEGER;
        v_harga_satuan := (v_detail->>'harga_satuan')::DECIMAL;
        v_diskon_persen := COALESCE((v_detail->>'diskon_persen')::DECIMAL, 0);
        v_pajak_persen := COALESCE((v_detail->>'pajak_persen')::DECIMAL, v_tax_percentage);
        v_batch_number := v_detail->>'batch_number';
        v_expired_date := (v_detail->>'expired_date')::DATE;
        
        -- Validasi produk
        DECLARE
            v_stok INTEGER;
            v_harga_jual_db DECIMAL;
        BEGIN
            SELECT stok, harga_jual INTO v_stok, v_harga_jual_db FROM produk 
            WHERE produk_id = v_produk_id AND cabang_id = p_cabang_id;
            
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Produk dengan ID % tidak ditemukan di cabang ini', v_produk_id;
            END IF;

            IF v_harga_satuan <> v_harga_jual_db THEN
                RAISE EXCEPTION 'Harga satuan tidak sesuai dengan harga di sistem. Harga yang benar adalah %', v_harga_jual_db;
            END IF;
            
            -- Validasi stok
            IF p_jenis_transaksi = 'PENJUALAN' AND v_stok < v_jumlah THEN
                RAISE EXCEPTION 'Stok tidak mencukupi. Stok tersedia: %, Diminta: %', v_stok, v_jumlah;
            END IF;
        END;
        
        -- Hitung diskon
        v_diskon_nominal := (v_harga_satuan * v_jumlah * v_diskon_persen) / 100;
        
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
        pelanggan_id, supplier_id, user_id, shift_id, promo_id,
        subtotal, diskon, pajak, biaya_tambahan, total,
        status_pembayaran, keterangan, updated_at
    ) VALUES (
        v_transaksi_id, v_nomor_transaksi, p_cabang_id, p_jenis_transaksi, p_tanggal,
        p_pelanggan_id, p_supplier_id, p_user_id, p_shift_id, p_promo_id,
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
        v_jumlah := (v_detail->>'jumlah')::INTEGER;
        v_harga_satuan := (v_detail->>'harga_satuan')::DECIMAL;
        v_diskon_persen := COALESCE((v_detail->>'diskon_persen')::DECIMAL, 0);
        v_pajak_persen := COALESCE((v_detail->>'pajak_persen')::DECIMAL, v_tax_percentage);
        v_batch_number := v_detail->>'batch_number';
        v_expired_date := (v_detail->>'expired_date')::DATE;
        
        -- Hitung ulang nilai-nilai (bisa dioptimasi dengan menyimpan hasil dari loop sebelumnya)
        v_diskon_nominal := (v_harga_satuan * v_jumlah * v_diskon_persen) / 100;
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
        ) VALUES (gen_random_uuid (),
            v_transaksi_id, v_produk_id, v_batch_number, v_expired_date,
            v_jumlah, v_harga_satuan, v_diskon_persen, v_diskon_nominal,
            v_item_subtotal, v_pajak_persen, v_item_total, now()
        );
        
        -- Update stok produk
        UPDATE produk SET 
            stok = stok + CASE 
                WHEN p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PEMBELIAN') THEN -v_jumlah
                ELSE v_jumlah
            END
        WHERE produk_id = v_produk_id;
        
        -- Insert inventory movement
        INSERT INTO inventory_movement (movement_id,
            produk_id, cabang_id, reference_id, reference_type,
            quantity, batch_number, expired_date, keterangan, user_id
        ) VALUES (
            gen_random_uuid (),v_produk_id, p_cabang_id, v_transaksi_id, v_reference_type,
            CASE 
                WHEN p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PEMBELIAN') THEN -v_jumlah
                ELSE v_jumlah
            END,
            v_batch_number, v_expired_date,
            p_jenis_transaksi || ' #' || v_nomor_transaksi,
            p_user_id
        );
    END LOOP;
    
    -- Buat audit log
    INSERT INTO audit_log (log_id,
        user_id, ip_address, action, table_name, record_id, new_values
    ) VALUES (gen_random_uuid (),
        p_user_id, p_ip_address, 'CREATE_TRANSAKSI', 'transaksi', v_transaksi_id,
        jsonb_build_object(
            'transaksi_id', v_transaksi_id,
            'nomor_transaksi', v_nomor_transaksi,
            'jenis_transaksi', p_jenis_transaksi,
            'customer_info', p_customer_info
        )
    );
    
    -- Add loyalty points if applicable
    IF p_pelanggan_id IS NOT NULL AND p_jenis_transaksi = 'PENJUALAN' THEN
        PERFORM add_loyalty_points(p_pelanggan_id, v_transaksi_id, v_total, p_user_id, p_ip_address);
    END IF;
    
    RETURN v_transaksi_id;
END;





DECLARE
    v_prefix VARCHAR;
    v_date_part VARCHAR;
    v_sequence_number INTEGER;
    v_transaction_number VARCHAR;
    v_sequence_name VARCHAR;
BEGIN
    -- Set prefix berdasarkan jenis transaksi
    CASE p_jenis_transaksi
        WHEN 'PENJUALAN' THEN v_prefix := 'INV';
        WHEN 'PEMBELIAN' THEN v_prefix := 'PO';
        WHEN 'RETUR_PENJUALAN' THEN v_prefix := 'RJ';
        WHEN 'RETUR_PEMBELIAN' THEN v_prefix := 'RB';
        ELSE v_prefix := 'TRX';
    END CASE;
    
    -- Format tanggal YYYYMMDD
    v_date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- Buat sequence name berdasarkan jenis transaksi dan tanggal
    v_sequence_name := 'seq_' || LOWER(p_jenis_transaksi) || '_' || v_date_part;
    
    -- Cek apakah sequence sudah ada, jika belum buat baru
    PERFORM 1 FROM pg_class WHERE relname = v_sequence_name;
    
    IF NOT FOUND THEN
        EXECUTE 'CREATE SEQUENCE ' || v_sequence_name || ' START 1';
    END IF;
    
    -- Dapatkan nomor urut berikutnya dari sequence
    EXECUTE 'SELECT nextval(''' || v_sequence_name || ''')' INTO v_sequence_number;
    
    -- Format nomor transaksi: PREFIX-YYYYMMDD-SEQUENCE_NUMBER
    v_transaction_number := v_prefix || '-' || v_date_part || '-' || LPAD(v_sequence_number::TEXT, 4, '0');
    
    RETURN v_transaction_number;
END;
















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
    v_harga_grosir_db DECIMAL;
    v_stok INTEGER;
    v_produk_master_id VARCHAR(36);
    v_new_harga_jual DECIMAL;
    v_margin_percentage DECIMAL := 10;
    v_pelanggan_segmen VARCHAR;
    v_is_grosir BOOLEAN := false;
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
    
    -- Check customer segment for wholesale pricing
    IF p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN') AND p_pelanggan_id IS NOT NULL THEN
        SELECT segmen INTO v_pelanggan_segmen
        FROM pelanggan 
        WHERE pelanggan_id = p_pelanggan_id AND status = 'aktif';
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Pelanggan tidak ditemukan atau tidak aktif';
        END IF;
        
        -- Set flag if customer is wholesale
        IF v_pelanggan_segmen = 'grosir' THEN
            v_is_grosir := true;
        END IF;
    ELSIF p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN') AND p_pelanggan_id IS NULL THEN
        -- For walk-in customers without ID, default to retail
        v_is_grosir := false;
    END IF;
    
    -- Validasi entity terkait
    IF p_jenis_transaksi IN ('PEMBELIAN', 'RETUR_PEMBELIAN') THEN
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
        WHEN 'RETUR_PEMBELIAN' THEN v_reference_type := 'retur';
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
        SELECT stok, produk_master_id, harga_jual, harga_grosir 
        INTO v_stok, v_produk_master_id, v_harga_jual_db, v_harga_grosir_db
        FROM produk 
        WHERE produk_id = v_produk_id AND cabang_id = p_cabang_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produk dengan ID % tidak ditemukan di cabang ini', v_produk_id;
        END IF;
        
        -- Validasi produk based on transaction type
        IF p_jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN') THEN
            -- Determine correct price based on customer segment
            IF v_is_grosir THEN
                -- Check if wholesale price is set
                IF v_harga_grosir_db IS NULL OR v_harga_grosir_db = 0 THEN
                    RAISE EXCEPTION 'Harga grosir belum diset untuk produk ini. Silakan set harga grosir terlebih dahulu';
                END IF;
                v_harga_db := v_harga_grosir_db;
            ELSE
                v_harga_db := v_harga_jual_db;
            END IF;
            
            -- Validate price for sales only (not for returns)
            IF p_jenis_transaksi = 'PENJUALAN' AND v_harga_satuan <> v_harga_db THEN
                IF v_is_grosir THEN
                    RAISE EXCEPTION 'Harga grosir tidak sesuai dengan harga di sistem. Harga grosir yang benar adalah %', v_harga_db;
                ELSE
                    RAISE EXCEPTION 'Harga jual tidak sesuai dengan harga di sistem. Harga yang benar adalah %', v_harga_db;
                END IF;
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
            'customer_info', p_customer_info,
            'metode_pembayaran', p_metode_pembayaran,
            'is_grosir', v_is_grosir,
            'segmen_pelanggan', v_pelanggan_segmen
        ),
        p_cabang_id
    );
    
    -- Add loyalty points if applicable
    IF p_pelanggan_id IS NOT NULL AND p_jenis_transaksi = 'PENJUALAN' THEN
        PERFORM add_loyalty_points(p_pelanggan_id, v_transaksi_id, v_total, p_user_id, p_ip_address);
    END IF;
    
    RETURN v_transaksi_id;
END;
$function$
;





































-- DROP FUNCTION public.add_pembayaran(varchar, varchar, varchar, varchar, numeric, timestamp, varchar, text, varchar, varchar, varchar);

CREATE OR REPLACE FUNCTION public.add_pembayaran(p_transaksi_id character varying, p_metode_pembayaran character varying, p_provider character varying, p_nomor_referensi character varying, p_jumlah_bayar numeric, p_tanggal_pembayaran timestamp without time zone, p_bukti_bayar_url character varying, p_keterangan text, p_user_id character varying, p_ip_address character varying, p_user_name character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$DECLARE
    v_transaksi RECORD;
    v_total_dibayar DECIMAL(15,2) := 0;
    v_sisa_pembayaran DECIMAL(15,2);
    v_jumlah_kembali DECIMAL(15,2) := 0;
    v_is_fully_paid BOOLEAN := FALSE;
    v_pembayaran_id UUID;
    v_total_terbayar DECIMAL(15,2);
    v_current_shift RECORD;
    v_result JSONB;
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
    
    -- Begin transaction
    BEGIN
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
            SET 
                status_pembayaran = 'LUNAS',
                tanggal_lunas = NOW(),
                updated_at = NOW()
            WHERE transaksi_id = p_transaksi_id;
            
            -- Check and update shift data if transaction has shift_id
            IF v_transaksi.shift_id IS NOT NULL THEN
                -- Get current shift data
                SELECT * INTO v_current_shift
                FROM shift
                WHERE shift_id = v_transaksi.shift_id;
                
                -- If shift exists, update its data
                IF FOUND THEN
                    UPDATE shift
                    SET 
                        total_transaksi = COALESCE(v_current_shift.total_transaksi, 0) + 1,
                        total_pendapatan = COALESCE(v_current_shift.total_pendapatan, 0) + v_transaksi.total,
                        updated_at = NOW()
                    WHERE shift_id = v_transaksi.shift_id;
                END IF;
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
            v_pembayaran_id,
            jsonb_build_object(
                'jumlah_bayar', p_jumlah_bayar,
                'jumlah_kembali', v_jumlah_kembali,
                'total_transaksi', v_transaksi.total,
                'sisa_pembayaran', GREATEST(0, v_sisa_pembayaran)
            )::text,
            NOW(),
            v_transaksi.cabang_id
        );
    END;
    
    -- Get the result data for response
    WITH payment_info AS (
        SELECT 
            *
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
            (SELECT row_to_json(sh.*) FROM shift sh WHERE sh.shift_id = t.shift_id) AS shift
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
            'sisa_pembayaran', GREATEST(0, v_sisa_pembayaran - p_jumlah_bayar + v_jumlah_kembali),
            'is_fully_paid', v_is_fully_paid,
            'pembayaran_id', v_pembayaran_id
        )
    ) INTO v_result
    FROM transaction_info;
    
    
    -- Return the result
    RETURN v_result;
END;$function$
;















