-- DROP FUNCTION public.add_pembayaran(varchar, varchar, varchar, varchar, numeric, timestamp, varchar, text, varchar, varchar, varchar, int4);

CREATE OR REPLACE FUNCTION public.add_pembayaran(p_transaksi_id character varying, p_metode_pembayaran character varying, p_provider character varying, p_nomor_referensi character varying, p_jumlah_bayar numeric, p_tanggal_pembayaran timestamp without time zone, p_bukti_bayar_url character varying, p_keterangan text, p_user_id character varying, p_ip_address character varying, p_user_name character varying, p_angsuran_ke integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
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

       v_pembayaran_kredit_id :=  gen_random_uuid();
        
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

        v_pembayaran_hutang_id :=  gen_random_uuid();
        
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
	
	IF v_is_fully_paid AND v_transaksi.pelanggan_id IS NOT NULL 
   AND v_transaksi.jenis_transaksi = 'PENJUALAN' THEN
    
    -- Check if points already given (from direct payment)
    IF NOT EXISTS (
        SELECT 1 FROM loyalty_point_history 
        WHERE transaksi_id = p_transaksi_id 
        AND type = 'EARN'
    ) THEN
        PERFORM add_loyalty_points(
            v_transaksi.pelanggan_id,
            p_transaksi_id,
            v_transaksi.total,
            p_user_id,
            p_ip_address
        );
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


-- DROP FUNCTION public.add_loyalty_points(varchar, varchar, float8, varchar, varchar);

CREATE OR REPLACE FUNCTION public.add_loyalty_points(p_pelanggan_id character varying, p_transaksi_id character varying, p_total double precision, p_user_id character varying, p_ip_address character varying)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_point_sebelumnya INTEGER;
    v_point_didapatkan INTEGER;
    v_point_akhir INTEGER;
    v_loyalty_config RECORD;
    v_cabang_id VARCHAR;
BEGIN
    -- Get cabang_id from transaksi
    SELECT cabang_id INTO v_cabang_id
    FROM transaksi
    WHERE transaksi_id = p_transaksi_id;
    
    -- Get loyalty configuration for the specific cabang or default
    IF v_cabang_id IS NOT NULL THEN
        SELECT point_rate, minimum_transaction INTO v_loyalty_config 
        FROM loyalty_config 
        WHERE cabang_id = v_cabang_id AND is_active = TRUE
        LIMIT 1;
    END IF;
    
    -- If no specific config found, get the default one
    IF v_loyalty_config.point_rate IS NULL THEN
        SELECT point_rate, minimum_transaction INTO v_loyalty_config 
        FROM loyalty_config 
        WHERE is_active = TRUE
        LIMIT 1;
    END IF;
    
    -- Default point rate if still not found
    IF v_loyalty_config.point_rate IS NULL THEN
        v_loyalty_config.point_rate := 10000; -- Default: 1 point per 10,000 unit
        v_loyalty_config.minimum_transaction := 0; -- No minimum by default
    END IF;
    
    -- Check if transaction meets minimum requirement
    IF v_loyalty_config.minimum_transaction IS NOT NULL AND p_total < v_loyalty_config.minimum_transaction THEN
        RETURN; -- Exit if below minimum transaction
    END IF;
    
    -- Calculate points earned (rounded down)
    v_point_didapatkan := FLOOR(p_total / v_loyalty_config.point_rate);
    
    -- If points earned > 0
    IF v_point_didapatkan > 0 THEN
        -- Get customer's current points
        SELECT COALESCE(poin, 0) INTO v_point_sebelumnya
        FROM pelanggan
        WHERE pelanggan_id = p_pelanggan_id;
        
        -- Calculate final points
        v_point_akhir := v_point_sebelumnya + v_point_didapatkan;
        
        -- Update customer points
        UPDATE pelanggan
        SET poin = v_point_akhir
        WHERE pelanggan_id = p_pelanggan_id;
        
        -- Record point history
        INSERT INTO loyalty_point_history (
			loyalty_point_history_id,
            pelanggan_id, 
            transaksi_id, 
            point_sebelumnya, 
            point_didapatkan, 
            point_akhir, 
            keterangan
        ) VALUES (
			gen_random_uuid(),
            p_pelanggan_id,
            p_transaksi_id,
            v_point_sebelumnya,
            v_point_didapatkan,
            v_point_akhir,
            'Poin dari transaksi #' || p_transaksi_id
        );
        
        -- Add audit log if needed
        INSERT INTO audit_log (
			log_id,
            user_id, 
            ip_address, 
            action, 
            table_name, 
            record_id, 
            new_values
        ) VALUES (
			gen_random_uuid(),
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
$function$
;


-- DROP FUNCTION public.add_loyalty_points2(varchar, varchar, numeric, varchar, varchar);

CREATE OR REPLACE FUNCTION public.add_loyalty_points2(p_pelanggan_id character varying, p_transaksi_id character varying, p_transaction_amount numeric, p_user_id character varying, p_ip_address character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_config RECORD;
    v_pelanggan RECORD;
    v_points_earned INT;
    v_points_before INT;
    v_points_after INT;
    v_expires_at TIMESTAMP;
    v_new_tier_id VARCHAR(36);
BEGIN
    -- Get loyalty config (branch-specific or global)
    SELECT * INTO v_config
    FROM loyalty_config
    WHERE (cabang_id = (SELECT cabang_id FROM transaksi WHERE transaksi_id = p_transaksi_id)
           OR cabang_id IS NULL)
    AND is_active = TRUE
    ORDER BY cabang_id NULLS LAST
    LIMIT 1;
    
    -- If no config, use defaults
    IF NOT FOUND THEN
        v_config.points_per_amount := 0.01;
        v_config.min_transaction_for_points := 10000;
        v_config.points_expiry_days := 365;
    END IF;
    
    -- Check minimum transaction
    IF p_transaction_amount < v_config.min_transaction_for_points THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Transaction below minimum for points'
        );
    END IF;
    
    -- Calculate points (1 point per configured amount)
    v_points_earned := FLOOR(p_transaction_amount * v_config.points_per_amount);
    
    IF v_points_earned <= 0 THEN
        RETURN jsonb_build_object('success', FALSE, 'message', 'No points earned');
    END IF;
    
    -- Lock and get pelanggan
    SELECT poin, lifetime_points INTO v_pelanggan
    FROM pelanggan
    WHERE pelanggan_id = p_pelanggan_id
    FOR UPDATE;
    
    v_points_before := COALESCE(v_pelanggan.poin, 0);
    v_points_after := v_points_before + v_points_earned;
    
    -- Calculate expiry date
    IF v_config.points_expiry_days > 0 THEN
        v_expires_at := NOW() + (v_config.points_expiry_days || ' days')::INTERVAL;
    ELSE
        v_expires_at := NULL;
    END IF;
    
    -- Update pelanggan points
    UPDATE pelanggan
    SET poin = v_points_after,
        lifetime_points = COALESCE(lifetime_points, 0) + v_points_earned,
        updated_at = NOW()
    WHERE pelanggan_id = p_pelanggan_id;
    
    -- Insert history
    INSERT INTO loyalty_point_history (
        loyalty_point_history_id, pelanggan_id, transaksi_id,
        points, points_before, points_after, type, description,
        expires_at, created_by
    ) VALUES (
        gen_random_uuid()::VARCHAR, p_pelanggan_id, p_transaksi_id,
        v_points_earned, v_points_before, v_points_after, 'EARN',
        'Poin dari transaksi Rp ' || p_transaction_amount,
        v_expires_at, p_user_id
    );
    
    -- Update transaksi with points earned
    UPDATE transaksi
    SET points_earned = v_points_earned
    WHERE transaksi_id = p_transaksi_id;
    
    -- Check and update tier
    SELECT loyalty_tier_id INTO v_new_tier_id
    FROM loyalty_tier
    WHERE is_active = TRUE
    AND v_points_after >= min_points
    AND (max_points IS NULL OR v_points_after <= max_points)
    ORDER BY tier_order DESC
    LIMIT 1;
    
    IF v_new_tier_id IS NOT NULL THEN
        UPDATE pelanggan
        SET loyalty_tier_id = v_new_tier_id
        WHERE pelanggan_id = p_pelanggan_id
        AND (loyalty_tier_id IS NULL OR loyalty_tier_id <> v_new_tier_id);
    END IF;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'points_earned', v_points_earned,
        'points_before', v_points_before,
        'points_after', v_points_after,
        'expires_at', v_expires_at,
        'new_tier_id', v_new_tier_id
    );
END;
$function$
;


-- DROP FUNCTION public.app_current_user_id();

CREATE OR REPLACE FUNCTION public.app_current_user_id()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN current_setting('app.current_user_id', true);
END;
$function$
;


-- DROP FUNCTION public.app_is_super_admin();

CREATE OR REPLACE FUNCTION public.app_is_super_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.role_id = ur.role_id
    WHERE ur.user_id = current_setting('app.current_user_id', true)
      AND r.nama_role = 'super_admin'
  ) INTO is_admin;
  
  RETURN COALESCE(is_admin, false);
END;
$function$
;


-- DROP FUNCTION public.app_user_cabang_ids();

CREATE OR REPLACE FUNCTION public.app_user_cabang_ids()
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  raw_val TEXT;
BEGIN
  -- Ambil dari session variable yang di-set oleh Prisma middleware
  raw_val := current_setting('app.current_cabang_ids', true);
  
  -- Jika kosong/null, return array kosong (block semua)
  IF raw_val IS NULL OR raw_val = '' THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  
  -- Split comma-separated string jadi array
  RETURN string_to_array(raw_val, ',');
END;
$function$
;


-- DROP FUNCTION public.apply_all_discounts(varchar, numeric, varchar, numeric, numeric, varchar, bool, numeric);

CREATE OR REPLACE FUNCTION public.apply_all_discounts(p_pelanggan_id character varying, p_subtotal numeric, p_cabang_id character varying, p_manual_discount_persen numeric DEFAULT NULL::numeric, p_manual_discount_nominal numeric DEFAULT 0, p_manual_discount_alasan character varying DEFAULT NULL::character varying, p_has_promo boolean DEFAULT false, p_promo_discount numeric DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
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
$function$
;


-- DROP FUNCTION public.apply_multiple_promos(_varchar, varchar, varchar, jsonb, numeric, varchar);

CREATE OR REPLACE FUNCTION public.apply_multiple_promos(p_promo_codes character varying[], p_cabang_id character varying, p_pelanggan_id character varying, p_cart_items jsonb, p_subtotal numeric, p_metode_pembayaran character varying DEFAULT NULL::character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_promo_code VARCHAR;
    v_promo RECORD;
    v_validation_result JSONB;
    v_discount_result JSONB;
    v_applicable_promos JSONB := '[]'::JSONB;
    v_total_discount DECIMAL := 0;
    v_current_subtotal DECIMAL := p_subtotal;
    v_error_messages JSONB := '[]'::JSONB;
BEGIN
    -- Process each promo code
    FOREACH v_promo_code IN ARRAY p_promo_codes
    LOOP
        -- Get promo by code
        SELECT * INTO v_promo
        FROM promo_diskon
        WHERE kode_promo = v_promo_code
        AND status = 'aktif';
        
        IF NOT FOUND THEN
            v_error_messages := v_error_messages || jsonb_build_object(
                'promo_code', v_promo_code,
                'error', 'Kode promo tidak valid'
            );
            CONTINUE;
        END IF;
        
        -- Validate eligibility
        v_validation_result := validate_promo_eligibility(
            v_promo.promo_id,
            p_cabang_id,
            p_cart_items,
            v_current_subtotal,
			p_pelanggan_id,
            p_metode_pembayaran
        );
        
        IF (v_validation_result->>'is_eligible')::BOOLEAN THEN
            -- Calculate discount
            v_discount_result := calculate_promo_discount(
                v_promo.promo_id,
                p_cart_items,
                v_current_subtotal,
                p_cabang_id
            );
            
            v_total_discount := v_total_discount + 
                (v_discount_result->>'total_discount')::DECIMAL;
            
            -- If not stackable, reduce subtotal for next promo calculation
            IF NOT v_promo.is_stackable THEN
                v_current_subtotal := v_current_subtotal - 
                    (v_discount_result->>'total_discount')::DECIMAL;
            END IF;
            
            v_applicable_promos := v_applicable_promos || jsonb_build_object(
                'promo_id', v_promo.promo_id,
                'kode_promo', v_promo.kode_promo,
                'nama_promo', v_promo.nama_promo,
                'tipe_diskon', v_promo.tipe_diskon,
                'discount', v_discount_result->>'total_discount',
                'items', v_discount_result->'items',
                'free_items', v_discount_result->'free_items'
            );
        ELSE
            v_error_messages := v_error_messages || jsonb_build_object(
                'promo_code', v_promo_code,
                'error', v_validation_result->'errors'
            );
        END IF;
    END LOOP;
    
    -- Sort by priority (highest first) if multiple promos
    -- This ensures proper application order
    
    RETURN jsonb_build_object(
        'applicable_promos', v_applicable_promos,
        'total_discount', ROUND(v_total_discount, 2),
        'final_subtotal', ROUND(p_subtotal - v_total_discount, 2),
        'errors', v_error_messages
    );
END;
$function$
;


-- DROP FUNCTION public.calculate_member_discount(varchar, numeric, varchar);

CREATE OR REPLACE FUNCTION public.calculate_member_discount(p_pelanggan_id character varying, p_subtotal numeric, p_cabang_id character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
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
            IF v_config.discount_segmen IS NOT NULL AND v_pelanggan.segmen IS NOT NULL THEN
                -- Cast enum to text for JSONB access
                v_discount_persen := COALESCE(
                    (v_config.discount_segmen->>(v_pelanggan.segmen::TEXT))::DECIMAL, 
                    0
                );
            ELSE
                -- No segmen set for customer, no discount
                v_discount_persen := 0;
            END IF;
            v_discount_nominal := (p_subtotal * v_discount_persen) / 100;
            v_tipe_discount := COALESCE(v_pelanggan.segmen::TEXT, 'NO_SEGMEN') || '_AUTO';
            
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
$function$
;


-- DROP FUNCTION public.calculate_promo_discount(varchar, jsonb, numeric, varchar);

CREATE OR REPLACE FUNCTION public.calculate_promo_discount(p_promo_id character varying, p_cart_items jsonb, p_subtotal numeric, p_cabang_id character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_promo RECORD;
    v_item JSONB;
    v_discount_total DECIMAL := 0;
    v_discount_per_item JSONB := '[]'::JSONB;
    v_item_discount DECIMAL;
    v_item_eligible BOOLEAN;
    v_produk_id VARCHAR;
    v_produk_master_id VARCHAR;
    v_kategori_id VARCHAR;
    v_quantity INTEGER;
    v_price DECIMAL;
    v_item_subtotal DECIMAL;
    v_free_items JSONB := '[]'::JSONB;
    v_buy_count INTEGER;
    v_get_count INTEGER;
    v_free_qty INTEGER;
BEGIN
    -- Get promo
    SELECT * INTO v_promo FROM promo_diskon WHERE promo_id = p_promo_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('total_discount', 0, 'items', '[]'::JSONB);
    END IF;
    
    -- Handle different discount types
    CASE v_promo.tipe_diskon
        WHEN 'PERSENTASE' THEN
            -- Calculate percentage discount
            FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
            LOOP
                v_produk_id := v_item->>'produk_id';
                v_quantity := (v_item->>'jumlah')::INTEGER;
                v_price := (v_item->>'harga_satuan')::DECIMAL;
                v_item_subtotal := v_price * v_quantity;
                
                -- Check if item is eligible
                v_item_eligible := check_produk_eligible(p_promo_id, v_produk_id, p_cabang_id);
                
                IF v_item_eligible THEN
                    v_item_discount := (v_item_subtotal * v_promo.nilai_diskon / 100);
                    v_discount_total := v_discount_total + v_item_discount;
                    
                    v_discount_per_item := v_discount_per_item || jsonb_build_object(
                        'produk_id', v_produk_id,
                        'quantity', v_quantity,
                        'discount', v_item_discount
                    );
                END IF;
            END LOOP;
            
        WHEN 'NOMINAL' THEN
            -- Nominal discount applied to total
            v_discount_total := v_promo.nilai_diskon;
            
            -- Distribute proportionally to eligible items
            FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
            LOOP
                v_produk_id := v_item->>'produk_id';
                v_quantity := (v_item->>'jumlah')::INTEGER;
                v_price := (v_item->>'harga_satuan')::DECIMAL;
                v_item_subtotal := v_price * v_quantity;
                
                v_item_eligible := check_produk_eligible(p_promo_id, v_produk_id, p_cabang_id);
                
                IF v_item_eligible THEN
                    v_item_discount := (v_item_subtotal / p_subtotal) * v_discount_total;
                    
                    v_discount_per_item := v_discount_per_item || jsonb_build_object(
                        'produk_id', v_produk_id,
                        'quantity', v_quantity,
                        'discount', v_item_discount
                    );
                END IF;
            END LOOP;
            
        WHEN 'BUY_X_GET_Y' THEN
            -- Buy X Get Y logic
            v_buy_count := (v_promo.buy_x_get_y_config->>'buy')::INTEGER;
            v_get_count := (v_promo.buy_x_get_y_config->>'get')::INTEGER;
            
            FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
            LOOP
                v_produk_id := v_item->>'produk_id';
                v_quantity := (v_item->>'jumlah')::INTEGER;
                v_price := (v_item->>'harga_satuan')::DECIMAL;
                
                v_item_eligible := check_produk_eligible(p_promo_id, v_produk_id, p_cabang_id);
                
                IF v_item_eligible AND v_quantity >= v_buy_count THEN
                    -- Calculate how many free items
                    v_free_qty := (v_quantity / v_buy_count) * v_get_count;
                    v_item_discount := v_free_qty * v_price;
                    v_discount_total := v_discount_total + v_item_discount;
                    
                    v_discount_per_item := v_discount_per_item || jsonb_build_object(
                        'produk_id', v_produk_id,
                        'quantity', v_quantity,
                        'discount', v_item_discount,
                        'free_qty', v_free_qty
                    );
                    
                    v_free_items := v_free_items || jsonb_build_object(
                        'produk_id', v_produk_id,
                        'free_qty', v_free_qty
                    );
                END IF;
            END LOOP;
            
        WHEN 'HARGA_SPESIAL' THEN
            -- Special price for specific products
            FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
            LOOP
                v_produk_id := v_item->>'produk_id';
                v_quantity := (v_item->>'jumlah')::INTEGER;
                v_price := (v_item->>'harga_satuan')::DECIMAL;
                
                v_item_eligible := check_produk_eligible(p_promo_id, v_produk_id, p_cabang_id);
                
                IF v_item_eligible THEN
                    -- Discount is difference between normal price and special price
                    v_item_discount := (v_price - v_promo.nilai_diskon) * v_quantity;
                    v_discount_total := v_discount_total + v_item_discount;
                    
                    v_discount_per_item := v_discount_per_item || jsonb_build_object(
                        'produk_id', v_produk_id,
                        'quantity', v_quantity,
                        'discount', v_item_discount,
                        'special_price', v_promo.nilai_diskon
                    );
                END IF;
            END LOOP;
            
        WHEN 'CASHBACK' THEN
            -- Cashback is treated like nominal discount but flagged differently
            v_discount_total := LEAST(
                v_promo.nilai_diskon,
                COALESCE(v_promo.max_diskon, v_promo.nilai_diskon)
            );
            
        WHEN 'VOUCHER' THEN
            -- Voucher discount
            v_discount_total := v_promo.nilai_diskon;
    END CASE;
    
    -- Apply max discount limit
    IF v_promo.max_diskon IS NOT NULL AND v_discount_total > v_promo.max_diskon THEN
        v_discount_total := v_promo.max_diskon;
    END IF;
    
    -- Return result
    RETURN jsonb_build_object(
        'total_discount', ROUND(v_discount_total, 2),
        'items', v_discount_per_item,
        'free_items', v_free_items,
        'tipe_diskon', v_promo.tipe_diskon
    );
END;
$function$
;


-- DROP FUNCTION public.check_produk_eligible(varchar, varchar, varchar);

CREATE OR REPLACE FUNCTION public.check_produk_eligible(p_promo_id character varying, p_produk_id character varying, p_cabang_id character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_promo RECORD;
    v_produk_master_id VARCHAR;
    v_kategori_id VARCHAR;
    v_is_eligible BOOLEAN := TRUE;
BEGIN
    -- Get promo
    SELECT * INTO v_promo FROM promo_diskon WHERE promo_id = p_promo_id;
    
    -- If GLOBAL, all products eligible
    IF v_promo.tipe_scope = 'GLOBAL' THEN
        RETURN TRUE;
    END IF;
    
    -- Get produk details
     SELECT 
        p.produk_master_id,
        pm.kategori_id
    INTO 
        v_produk_master_id, 
        v_kategori_id
    FROM produk p
    INNER JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
    WHERE p.produk_id = p_produk_id 
    AND p.cabang_id = p_cabang_id;

  -- If product not found, return false
    IF v_produk_master_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- If PRODUK_SPESIFIK or KATEGORI_SPESIFIK, check promo_produk
    IF v_promo.tipe_scope IN ('PRODUK_SPESIFIK', 'KATEGORI_SPESIFIK') THEN
        -- Check if explicitly included
        PERFORM 1 FROM promo_produk
        WHERE promo_id = p_promo_id
        AND (
            (tipe_target = 'PRODUK_MASTER' AND target_id = v_produk_master_id) OR
            (tipe_target = 'PRODUK_CABANG' AND target_id = p_produk_id) OR
            (tipe_target = 'KATEGORI' AND target_id = v_kategori_id)
        )
        AND is_include = TRUE
        AND is_active = TRUE;
        
        IF FOUND THEN
            v_is_eligible := TRUE;
        ELSE
            v_is_eligible := FALSE;
        END IF;
        
        -- Check if explicitly excluded
        PERFORM 1 FROM promo_produk
        WHERE promo_id = p_promo_id
        AND (
            (tipe_target = 'PRODUK_MASTER' AND target_id = v_produk_master_id) OR
            (tipe_target = 'PRODUK_CABANG' AND target_id = p_produk_id) OR
            (tipe_target = 'KATEGORI' AND target_id = v_kategori_id)
        )
        AND is_include = FALSE
        AND is_active = TRUE;
        
        IF FOUND THEN
            v_is_eligible := FALSE;
        END IF;
    END IF;
    
    RETURN v_is_eligible;
END;
$function$
;


-- DROP FUNCTION public.create_transaksi(varchar, varchar, timestamp, varchar, varchar, varchar, varchar, jsonb, float8, text, jsonb, varchar, varchar, varchar, varchar, timestamp, int4, numeric);

CREATE OR REPLACE FUNCTION public.create_transaksi(p_cabang_id character varying, p_jenis_transaksi character varying, p_tanggal timestamp without time zone, p_pelanggan_id character varying, p_supplier_id character varying, p_shift_id character varying, p_promo_id character varying, p_details jsonb, p_biaya_tambahan double precision, p_keterangan text, p_customer_info jsonb, p_user_id character varying, p_ip_address character varying, p_user_name character varying, p_metode_pembayaran character varying DEFAULT NULL::character varying, p_jatuh_tempo timestamp without time zone DEFAULT NULL::timestamp without time zone, p_tenor integer DEFAULT NULL::integer, p_uang_muka numeric DEFAULT 0)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
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
    SELECT generate_transaksi_number(p_jenis_transaksi, p_cabang_id) INTO v_nomor_transaksi;
    
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
            subtotal, pajak_persen, pajak_nominal, total, updated_at
        ) VALUES (
            gen_random_uuid(),
            v_transaksi_id, v_produk_id, v_batch_number, v_expired_date,
            v_jumlah, v_harga_satuan, v_diskon_persen, v_diskon_nominal,
            v_item_subtotal, v_pajak_persen, v_pajak_nominal, v_item_total, now()
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
            COALESCE(p_jatuh_tempo::DATE, p_tanggal::DATE + interval '30 day'), v_total, 0, v_total,
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



-- DROP FUNCTION public.create_transaksi_with_promo_and_discount(varchar, varchar, timestamp, varchar, varchar, varchar, jsonb, float8, text, jsonb, varchar, varchar, varchar, _varchar, varchar, int4, numeric, numeric, numeric, varchar, varchar, numeric, int4);

CREATE OR REPLACE FUNCTION public.create_transaksi_with_promo_and_discount(p_cabang_id character varying, p_jenis_transaksi character varying, p_tanggal timestamp without time zone, p_pelanggan_id character varying, p_supplier_id character varying, p_shift_id character varying, p_details jsonb, p_biaya_tambahan double precision, p_keterangan text, p_customer_info jsonb, p_user_id character varying, p_ip_address character varying, p_user_name character varying, p_promo_codes character varying[] DEFAULT NULL::character varying[], p_metode_pembayaran character varying DEFAULT NULL::character varying, p_tenor integer DEFAULT NULL::integer, p_uang_muka numeric DEFAULT 0, p_manual_discount_persen numeric DEFAULT NULL::numeric, p_manual_discount_nominal numeric DEFAULT 0, p_manual_discount_alasan character varying DEFAULT NULL::character varying, p_loyalty_reward_id character varying DEFAULT NULL::character varying, p_loyalty_discount numeric DEFAULT 0, p_points_redeemed integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
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
 	v_total_diskon_loyalty DECIMAL := 0;
    v_total_diskon_final DECIMAL := 0;
    v_total DECIMAL := 0;
	v_points_earned INT := 0;
    
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
    SELECT generate_transaksi_number(p_jenis_transaksi, p_cabang_id) INTO v_nomor_transaksi;
    
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
            
            
            -- Validations
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
   	
	-- Apply loyalty reward discount
    v_total_diskon_loyalty := COALESCE(p_loyalty_discount, 0);
    
    v_total_diskon_final := v_total_diskon_item + v_total_diskon_promo + 
                            v_total_diskon_member + v_total_diskon_manual + v_total_diskon_loyalty;
    
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
        total_diskon_final,loyalty_reward_id, loyalty_discount, points_redeemed,
        status_pembayaran, keterangan, updated_at
    ) VALUES (
        v_transaksi_id, v_nomor_transaksi, p_cabang_id, p_jenis_transaksi, p_tanggal,
        p_pelanggan_id, p_supplier_id, p_user_id, p_user_name, p_shift_id,
        v_subtotal, v_total_diskon_item, v_total_pajak, COALESCE(p_biaya_tambahan, 0), v_total,
        v_total_diskon_member, p_manual_discount_persen, v_total_diskon_manual, 
        p_manual_discount_alasan, v_total_diskon_final,p_loyalty_reward_id, v_total_diskon_loyalty, COALESCE(p_points_redeemed, 0),
        v_status_pembayaran,
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
           COALESCE(
 		    v_discount_result #>> '{breakdown,0,tipe}',
  		   'UNKNOWN'),
            v_total_diskon_member,
            format('Auto discount %s - Segmen: %s', 
				v_discount_result#>> '{breakdown,0,amount}',
                v_discount_result#>> '{breakdown,0,tipe}'
               ),
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
$function$
;


-- DROP FUNCTION public.generate_transaksi_number(varchar, varchar);

CREATE OR REPLACE FUNCTION public.generate_transaksi_number(p_jenis_transaksi character varying, p_kode_cabang character varying DEFAULT 'PST'::character varying)
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
    v_prefix VARCHAR;
    v_date_part VARCHAR;
    v_sequence_number INTEGER;
    v_transaction_number VARCHAR;
    v_sequence_name VARCHAR;
	v_cabang             VARCHAR;   -- untuk ditampilkan di nomor transaksi
    v_cabang_seq         VARCHAR;   -- untuk penamaan sequence (tanpa karakter khusus)
BEGIN
	
	 -- Normalisasi kode cabang untuk ditampilkan (uppercase, max 10 karakter)
    v_cabang := UPPER(TRIM(COALESCE(p_kode_cabang, 'PST')));
    IF LENGTH(v_cabang) = 0 THEN
        v_cabang := 'PST';
    END IF;
    v_cabang := LEFT(v_cabang, 10);

 -- Sanitasi kode cabang untuk nama sequence:
    -- Ganti karakter selain huruf/angka dengan underscore
    -- Contoh: 'SSO-0001' → 'sso_0001'
    v_cabang_seq := LOWER(REGEXP_REPLACE(v_cabang, '[^a-zA-Z0-9]', '_', 'g'));

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
    
      -- Sequence unik per: jenis transaksi + cabang (sanitized) + tanggal
    -- Contoh: seq_penjualan_sso_0001_20260304
    v_sequence_name := 'seq_'
        || LOWER(REGEXP_REPLACE(p_jenis_transaksi, '[^a-zA-Z0-9]', '_', 'g')) || '_'
        || v_cabang_seq || '_'
        || v_date_part;
    
    -- Buat sequence baru jika belum ada
    PERFORM 1 FROM pg_class WHERE relname = v_sequence_name;
    IF NOT FOUND THEN
        EXECUTE 'CREATE SEQUENCE ' || quote_ident(v_sequence_name) || ' START 1';
    END IF;
    
      -- Ambil nomor urut berikutnya
    EXECUTE 'SELECT nextval(' || quote_literal(v_sequence_name) || ')'
        INTO v_sequence_number;
    
    v_transaction_number := v_prefix
        || '-' || v_cabang
        || '-' || v_date_part
        || '-' || LPAD(v_sequence_number::TEXT, 4, '0');
    
    RETURN v_transaction_number;
END;$function$
;


-- DROP FUNCTION public.redeem_loyalty_reward(varchar, varchar, varchar, varchar);

CREATE OR REPLACE FUNCTION public.redeem_loyalty_reward(p_pelanggan_id character varying, p_reward_id character varying, p_transaksi_id character varying, p_user_id character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_reward RECORD;
    v_pelanggan RECORD;
    v_points_before INT;
    v_points_after INT;
    v_total_redeemed INT;
BEGIN
    -- Lock and get reward
    SELECT * INTO v_reward
    FROM loyalty_reward
    WHERE loyalty_reward_id = p_reward_id
    AND is_active = TRUE
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Reward tidak ditemukan atau tidak aktif');
    END IF;
    
    -- Check validity period
    IF v_reward.valid_from IS NOT NULL AND CURRENT_DATE < v_reward.valid_from THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Reward belum berlaku');
    END IF;
    
    IF v_reward.valid_until IS NOT NULL AND CURRENT_DATE > v_reward.valid_until THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Reward sudah expired');
    END IF;
    
    -- Check stock
    IF v_reward.total_stock IS NOT NULL AND v_reward.current_redeemed >= v_reward.total_stock THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Reward sudah habis');
    END IF;
    
    -- Lock and get pelanggan
    SELECT poin, loyalty_tier_id INTO v_pelanggan
    FROM pelanggan
    WHERE pelanggan_id = p_pelanggan_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Pelanggan tidak ditemukan');
    END IF;
    
    v_points_before := COALESCE(v_pelanggan.poin, 0);
    
    -- Check if enough points
    IF v_points_before < v_reward.points_required THEN
        RETURN jsonb_build_object(
            'success', FALSE, 
            'error', 'Poin tidak cukup. Dibutuhkan: ' || v_reward.points_required || ', Tersedia: ' || v_points_before
        );
    END IF;
    
    -- Check min tier
    IF v_reward.min_tier_id IS NOT NULL THEN
        IF v_pelanggan.loyalty_tier_id IS NULL OR 
           (SELECT tier_order FROM loyalty_tier WHERE loyalty_tier_id = v_pelanggan.loyalty_tier_id) < 
           (SELECT tier_order FROM loyalty_tier WHERE loyalty_tier_id = v_reward.min_tier_id) THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'Tier tidak memenuhi syarat untuk reward ini');
        END IF;
    END IF;
    
    -- Check max redeem per customer
    IF v_reward.max_redeem_per_customer IS NOT NULL THEN
        SELECT COUNT(*) INTO v_total_redeemed
        FROM loyalty_point_history
        WHERE pelanggan_id = p_pelanggan_id
        AND reward_id = p_reward_id
        AND type = 'REDEEM';
        
        IF v_total_redeemed >= v_reward.max_redeem_per_customer THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'Sudah mencapai batas maksimal redeem untuk reward ini');
        END IF;
    END IF;
    
    -- Calculate new points
    v_points_after := v_points_before - v_reward.points_required;
    
    -- Deduct points from pelanggan
    UPDATE pelanggan
    SET poin = v_points_after,
        updated_at = NOW()
    WHERE pelanggan_id = p_pelanggan_id;
    
    -- Insert history
    INSERT INTO loyalty_point_history (
        loyalty_point_history_id, pelanggan_id, transaksi_id, reward_id,
        point_didapatkan, point_sebelumnya, point_akhir, type, description
    ) VALUES (
        gen_random_uuid()::VARCHAR, p_pelanggan_id, p_transaksi_id, p_reward_id,
        -v_reward.points_required, v_points_before, v_points_after, 'REDEEM',
        'Redeem: ' || v_reward.name
    );
    
    -- Update reward redeemed count
    UPDATE loyalty_reward
    SET current_redeemed = current_redeemed + 1,
        updated_at = NOW()
    WHERE loyalty_reward_id = p_reward_id;
    
    -- Update transaksi with loyalty info
    UPDATE transaksi
    SET loyalty_reward_id = p_reward_id,
        loyalty_discount = v_reward.reward_value,
        points_redeemed = v_reward.points_required
    WHERE transaksi_id = p_transaksi_id;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'reward_id', p_reward_id,
        'reward_name', v_reward.name,
        'reward_type', v_reward.reward_type,
        'reward_value', v_reward.reward_value,
        'points_used', v_reward.points_required,
        'points_before', v_points_before,
        'points_after', v_points_after
    );
END;
$function$
;


-- DROP FUNCTION public.validate_bundle_promo(varchar, jsonb);

CREATE OR REPLACE FUNCTION public.validate_bundle_promo(p_promo_id character varying, p_cart_items jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_bundle RECORD;
    v_item JSONB;
    v_produk_master_id VARCHAR;
    v_required_products JSONB := '[]'::JSONB;
    v_cart_products JSONB := '[]'::JSONB;
    v_is_valid BOOLEAN := TRUE;
BEGIN
    -- Get all required bundle products
    FOR v_bundle IN 
        SELECT * FROM promo_bundle 
        WHERE promo_id = p_promo_id AND is_required = TRUE
    LOOP
        v_required_products := v_required_products || jsonb_build_object(
            'produk_master_id', v_bundle.produk_master_id,
            'min_qty', v_bundle.min_qty,
            'found_qty', 0
        );
    END LOOP;
    
    -- Check cart items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
        SELECT produk_master_id INTO v_produk_master_id
        FROM produk
        WHERE produk_id = v_item->>'produk_id';
        
        -- Update found quantity
        v_required_products := (
            SELECT jsonb_agg(
                CASE 
                    WHEN elem->>'produk_master_id' = v_produk_master_id
                    THEN jsonb_set(elem, '{found_qty}', 
                        to_jsonb((elem->>'found_qty')::INTEGER + (v_item->>'jumlah')::INTEGER))
                    ELSE elem
                END
            )
            FROM jsonb_array_elements(v_required_products) AS elem
        );
    END LOOP;
    
    -- Validate all required products met minimum quantity
    FOR v_bundle IN SELECT * FROM jsonb_array_elements(v_required_products)
    LOOP
        IF (v_bundle.value->>'found_qty')::INTEGER < (v_bundle.value->>'min_qty')::INTEGER THEN
            v_is_valid := FALSE;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN v_is_valid;
END;
$function$
;


-- DROP FUNCTION public.validate_manual_discount(numeric, numeric, numeric, varchar, bool);

CREATE OR REPLACE FUNCTION public.validate_manual_discount(p_discount_persen numeric, p_discount_nominal numeric, p_subtotal numeric, p_cabang_id character varying, p_has_promo boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
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
$function$
;


-- DROP FUNCTION public.validate_promo_eligibility(varchar, varchar, jsonb, numeric, varchar, varchar, timestamp);

CREATE OR REPLACE FUNCTION public.validate_promo_eligibility(p_promo_id character varying, p_cabang_id character varying, p_cart_items jsonb, p_subtotal numeric, p_pelanggan_id character varying DEFAULT NULL::character varying, p_metode_pembayaran character varying DEFAULT NULL::character varying, p_tanggal_transaksi timestamp without time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_promo RECORD;
    v_rule RECORD;
    v_result JSONB;
    v_is_eligible BOOLEAN := TRUE;
    v_error_messages TEXT[] := ARRAY[]::TEXT[];
    v_cart_total_qty INTEGER := 0;
    v_pelanggan_segmen VARCHAR;
    v_hari_transaksi VARCHAR;
    v_jam_transaksi TIME;
    v_usage_count INTEGER;
    v_user_usage_count INTEGER;
BEGIN
    -- Get promo data
    SELECT * INTO v_promo
    FROM promo_diskon
    WHERE promo_id = p_promo_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'is_eligible', FALSE,
            'errors', ARRAY['Promo tidak ditemukan']
        );
    END IF;
    
    -- Check status
    IF v_promo.status != 'aktif' THEN
        v_error_messages := array_append(v_error_messages, 'Promo tidak aktif');
        v_is_eligible := FALSE;
    END IF;
    
    -- Check periode
    IF v_promo.tanggal_mulai IS NOT NULL AND p_tanggal_transaksi::DATE < v_promo.tanggal_mulai THEN
        v_error_messages := array_append(v_error_messages, 'Promo belum dimulai');
        v_is_eligible := FALSE;
    END IF;
    
    IF v_promo.tanggal_berakhir IS NOT NULL AND p_tanggal_transaksi::DATE > v_promo.tanggal_berakhir THEN
        v_error_messages := array_append(v_error_messages, 'Promo sudah berakhir');
        v_is_eligible := FALSE;
    END IF;
    
    -- Check quota
    IF v_promo.max_penggunaan_total IS NOT NULL THEN
        IF v_promo.current_usage >= v_promo.max_penggunaan_total THEN
            v_error_messages := array_append(v_error_messages, 'Kuota promo sudah habis');
            v_is_eligible := FALSE;
        END IF;
    END IF;
    
    -- Check user quota
    IF v_promo.max_penggunaan_per_user IS NOT NULL AND p_pelanggan_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_user_usage_count
        FROM voucher_usage
        WHERE promo_id = p_promo_id AND pelanggan_id = p_pelanggan_id;
        
        IF v_user_usage_count >= v_promo.max_penggunaan_per_user THEN
            v_error_messages := array_append(v_error_messages, 'Anda sudah mencapai batas penggunaan promo');
            v_is_eligible := FALSE;
        END IF;
    END IF;
    
    -- Check min pembelian
    IF v_promo.min_pembelian IS NOT NULL AND p_subtotal < v_promo.min_pembelian THEN
        v_error_messages := array_append(v_error_messages, 
            format('Minimal pembelian Rp %s', v_promo.min_pembelian));
        v_is_eligible := FALSE;
    END IF;
    
    -- Check scope cabang
    IF v_promo.tipe_scope = 'CABANG_SPESIFIK' THEN
        PERFORM 1 FROM promo_cabang
        WHERE promo_id = p_promo_id 
        AND cabang_id = p_cabang_id
        AND is_active = TRUE;
        
        IF NOT FOUND THEN
            v_error_messages := array_append(v_error_messages, 'Promo tidak berlaku di cabang ini');
            v_is_eligible := FALSE;
        END IF;
    END IF;
    
    -- Check scope produk
    IF v_promo.tipe_scope IN ('PRODUK_SPESIFIK', 'KATEGORI_SPESIFIK') THEN
        -- Will be validated per item in calculate_discount function
        NULL;
    END IF;
    
    -- Get pelanggan segmen if exists
    IF p_pelanggan_id IS NOT NULL THEN
        SELECT segmen INTO v_pelanggan_segmen
        FROM pelanggan
        WHERE pelanggan_id = p_pelanggan_id;
    END IF;
    
    -- Get hari dan jam transaksi
    v_hari_transaksi := UPPER(TO_CHAR(p_tanggal_transaksi, 'DAY'));
    v_hari_transaksi := TRIM(v_hari_transaksi);
    v_jam_transaksi := p_tanggal_transaksi::TIME;
    
    -- Calculate total quantity
    SELECT SUM((item->>'jumlah')::INTEGER) INTO v_cart_total_qty
    FROM jsonb_array_elements(p_cart_items) AS item;
    
    -- Validate all rules
    FOR v_rule IN 
        SELECT * FROM promo_rule 
        WHERE promo_id = p_promo_id
    LOOP
        CASE v_rule.tipe_rule
            WHEN 'MIN_QTY' THEN
                IF v_cart_total_qty < (v_rule.nilai->>'min_qty')::INTEGER THEN
                    v_error_messages := array_append(v_error_messages, 
                        COALESCE(v_rule.error_message, 
                            format('Minimal pembelian %s item', v_rule.nilai->>'min_qty')));
                    IF v_rule.is_required THEN
                        v_is_eligible := FALSE;
                    END IF;
                END IF;
                
            WHEN 'MIN_NOMINAL' THEN
                IF p_subtotal < (v_rule.nilai->>'min_nominal')::DECIMAL THEN
                    v_error_messages := array_append(v_error_messages,
                        COALESCE(v_rule.error_message,
                            format('Minimal belanja Rp %s', v_rule.nilai->>'min_nominal')));
                    IF v_rule.is_required THEN
                        v_is_eligible := FALSE;
                    END IF;
                END IF;
                
            WHEN 'HARI_TERTENTU' THEN
                IF NOT (v_rule.nilai->'hari' ? v_hari_transaksi) THEN
                    v_error_messages := array_append(v_error_messages,
                        COALESCE(v_rule.error_message, 'Promo tidak berlaku di hari ini'));
                    IF v_rule.is_required THEN
                        v_is_eligible := FALSE;
                    END IF;
                END IF;
                
            WHEN 'JAM_TERTENTU' THEN
                IF v_jam_transaksi < (v_rule.nilai->>'jam_mulai')::TIME OR 
                   v_jam_transaksi > (v_rule.nilai->>'jam_selesai')::TIME THEN
                    v_error_messages := array_append(v_error_messages,
                        COALESCE(v_rule.error_message, 
                            format('Promo hanya berlaku jam %s - %s', 
                                v_rule.nilai->>'jam_mulai', 
                                v_rule.nilai->>'jam_selesai')));
                    IF v_rule.is_required THEN
                        v_is_eligible := FALSE;
                    END IF;
                END IF;
                
            WHEN 'PELANGGAN_SEGMEN' THEN
                IF p_pelanggan_id IS NULL THEN
                    v_error_messages := array_append(v_error_messages,
                        'Promo hanya untuk pelanggan terdaftar');
                    v_is_eligible := FALSE;
                ELSIF NOT (v_rule.nilai->'segmen' ? v_pelanggan_segmen) THEN
                    v_error_messages := array_append(v_error_messages,
                        COALESCE(v_rule.error_message, 'Promo tidak berlaku untuk segmen Anda'));
                    IF v_rule.is_required THEN
                        v_is_eligible := FALSE;
                    END IF;
                END IF;
                
            WHEN 'METODE_PEMBAYARAN' THEN
                IF p_metode_pembayaran IS NULL OR 
                   NOT (v_rule.nilai->'metode' ? p_metode_pembayaran) THEN
                    v_error_messages := array_append(v_error_messages,
                        COALESCE(v_rule.error_message, 'Metode pembayaran tidak eligible'));
                    IF v_rule.is_required THEN
                        v_is_eligible := FALSE;
                    END IF;
                END IF;
                
            WHEN 'FIRST_TIME_BUYER' THEN
                IF p_pelanggan_id IS NOT NULL THEN
                    PERFORM 1 FROM transaksi
                    WHERE pelanggan_id = p_pelanggan_id
                    AND status_pembayaran = 'LUNAS'
                    LIMIT 1;
                    
                    IF FOUND THEN
                        v_error_messages := array_append(v_error_messages,
                            'Promo hanya untuk pembeli pertama kali');
                        v_is_eligible := FALSE;
                    END IF;
                END IF;
        END CASE;
    END LOOP;
    
    -- Build result
    v_result := jsonb_build_object(
        'is_eligible', v_is_eligible,
        'promo_id', p_promo_id,
        'kode_promo', v_promo.kode_promo,
        'nama_promo', v_promo.nama_promo,
        'tipe_diskon', v_promo.tipe_diskon,
        'nilai_diskon', v_promo.nilai_diskon,
        'max_diskon', v_promo.max_diskon,
        'is_stackable', v_promo.is_stackable,
        'prioritas', v_promo.prioritas,
        'errors', v_error_messages
    );
    
    RETURN v_result;
END;
$function$d
;
