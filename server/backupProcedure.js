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