-- DROP FUNCTION public.apply_multiple_promos(varchar[], varchar, varchar, jsonb, decimal, varchar);

CREATE OR REPLACE FUNCTION public.apply_multiple_promos(
    p_promo_codes VARCHAR[],
    p_cabang_id VARCHAR,
    p_pelanggan_id VARCHAR,
    p_details JSONB,
    p_subtotal DECIMAL,
    p_metode_pembayaran VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
    v_promo_code VARCHAR;
    v_promo RECORD;
    v_result JSONB := jsonb_build_object(
        'applicable_promos', '[]'::JSONB,
        'total_discount', 0,
        'errors', '[]'::JSONB
    );
    v_applicable_promos JSONB := '[]'::JSONB;
    v_errors JSONB := '[]'::JSONB;
    v_total_discount DECIMAL := 0;
    v_promo_discount DECIMAL;
    v_promo_metadata JSONB;
    v_error_message TEXT;
    v_is_applicable BOOLEAN;
    v_current_date DATE := CURRENT_DATE;
    v_current_time TIME := CURRENT_TIME;
    v_day_of_week INTEGER := EXTRACT(DOW FROM CURRENT_DATE);
    v_pelanggan_segmen VARCHAR;
    v_is_first_time_buyer BOOLEAN := FALSE;
    v_min_qty DECIMAL;
    v_min_nominal DECIMAL;
    v_allowed_hours VARCHAR[];
    v_allowed_days VARCHAR[];
    v_allowed_segments VARCHAR[];
    v_allowed_payment_methods VARCHAR[];
    v_usage_count INT;
    v_user_usage_count INT;
    v_item_count INT := 0;
    v_promo_produk RECORD;
    v_produk_in_promo BOOLEAN;
    v_kategori_in_promo BOOLEAN;
    v_discount_value DECIMAL;
    v_max_discount DECIMAL;
    v_buy_x_qty INT;
    v_get_y_qty INT;
    v_item_produk_id VARCHAR;
    v_item_kategori_id VARCHAR;
BEGIN
    -- Get customer segment if customer exists
    IF p_pelanggan_id IS NOT NULL THEN
        SELECT segmen INTO v_pelanggan_segmen
        FROM pelanggan
        WHERE pelanggan_id = p_pelanggan_id AND status = 'aktif';

        -- Check if first time buyer
        SELECT COUNT(*) INTO v_usage_count
        FROM transaksi
        WHERE pelanggan_id = p_pelanggan_id
        AND jenis_transaksi = 'PENJUALAN'
        AND status_pembayaran IN ('LUNAS', 'BELUM_LUNAS');

        v_is_first_time_buyer := (v_usage_count = 0);
    END IF;

    -- Count total items in cart
    SELECT COALESCE(SUM((item->>'jumlah')::INT), 0) INTO v_item_count
    FROM jsonb_array_elements(p_details) AS item;

    -- Process each promo code
    IF p_promo_codes IS NOT NULL AND array_length(p_promo_codes, 1) > 0 THEN
        FOREACH v_promo_code IN ARRAY p_promo_codes
        LOOP
            v_is_applicable := TRUE;
            v_error_message := NULL;
            v_promo_discount := 0;
            v_promo_metadata := NULL;

            -- Get promo data
            SELECT * INTO v_promo
            FROM promo_diskon
            WHERE kode_promo = v_promo_code
            AND status = 'aktif'
            AND deleted_at IS NULL;

            -- Check 1: Promo exists and is active
            IF NOT FOUND THEN
                v_is_applicable := FALSE;
                v_error_message := 'Kode promo tidak ditemukan atau tidak aktif';
            ELSE
                -- Check 2: Date range
                IF v_promo.tanggal_mulai IS NOT NULL AND v_current_date < v_promo.tanggal_mulai THEN
                    v_is_applicable := FALSE;
                    v_error_message := 'Promo belum dimulai';
                ELSIF v_promo.tanggal_berakhir IS NOT NULL AND v_current_date > v_promo.tanggal_berakhir THEN
                    v_is_applicable := FALSE;
                    v_error_message := 'Promo sudah berakhir';
                END IF;

                -- Check 3: Usage limit (total)
                IF v_is_applicable AND v_promo.max_penggunaan_total IS NOT NULL THEN
                    IF v_promo.current_usage >= v_promo.max_penggunaan_total THEN
                        v_is_applicable := FALSE;
                        v_error_message := 'Batas penggunaan promo sudah tercapai';
                    END IF;
                END IF;

                -- Check 4: Usage limit per user
                IF v_is_applicable AND v_promo.max_penggunaan_per_user IS NOT NULL AND p_pelanggan_id IS NOT NULL THEN
                    SELECT COUNT(*) INTO v_user_usage_count
                    FROM voucher_usage
                    WHERE promo_id = v_promo.promo_id
                    AND pelanggan_id = p_pelanggan_id;

                    IF v_user_usage_count >= v_promo.max_penggunaan_per_user THEN
                        v_is_applicable := FALSE;
                        v_error_message := 'Anda sudah mencapai batas penggunaan promo ini';
                    END IF;
                END IF;

                -- Check 5: Minimum purchase
                IF v_is_applicable AND v_promo.min_pembelian IS NOT NULL THEN
                    IF p_subtotal < v_promo.min_pembelian THEN
                        v_is_applicable := FALSE;
                        v_error_message := 'Minimum pembelian Rp' || v_promo.min_pembelian || ' belum tercapai';
                    END IF;
                END IF;

                -- Check 6: Branch scope
                IF v_is_applicable AND v_promo.tipe_scope = 'CABANG_SPESIFIK' THEN
                    IF v_promo.cabangId IS NOT NULL AND v_promo.cabangId != p_cabang_id THEN
                        v_is_applicable := FALSE;
                        v_error_message := 'Promo tidak berlaku untuk cabang ini';
                    ELSE
                        -- Check promo_cabang table for multi-branch promos
                        PERFORM 1 FROM promo_cabang
                        WHERE promo_id = v_promo.promo_id
                        AND cabang_id = p_cabang_id
                        AND is_active = TRUE;

                        IF NOT FOUND THEN
                            v_is_applicable := FALSE;
                            v_error_message := 'Promo tidak berlaku untuk cabang ini';
                        END IF;
                    END IF;
                END IF;

                -- Check 7: Product scope
                IF v_is_applicable AND v_promo.tipe_scope IN ('PRODUK_SPESIFIK', 'KATEGORI_SPESIFIK') THEN
                    IF v_promo.tipe_scope = 'PRODUK_SPESIFIK' AND v_promo.produkId IS NOT NULL THEN
                        -- Check if cart contains the specific product
                        v_produk_in_promo := FALSE;
                        FOR v_item_produk_id IN
                            SELECT (item->>'produk_id')::VARCHAR
                            FROM jsonb_array_elements(p_details) AS item
                        LOOP
                            IF v_item_produk_id = v_promo.produkId THEN
                                v_produk_in_promo := TRUE;
                                EXIT;
                            END IF;
                        END LOOP;

                        IF NOT v_produk_in_promo THEN
                            v_is_applicable := FALSE;
                            v_error_message := 'Promo hanya berlaku untuk produk tertentu';
                        END IF;
                    ELSIF v_promo.tipe_scope = 'KATEGORI_SPESIFIK' AND v_promo.kategoriId IS NOT NULL THEN
                        -- Check if cart contains products from the category
                        v_kategori_in_promo := FALSE;
                        FOR v_item_produk_id IN
                            SELECT (item->>'produk_id')::VARCHAR
                            FROM jsonb_array_elements(p_details) AS item
                        LOOP
                            SELECT COUNT(*) INTO v_usage_count
                            FROM produk p
                            INNER JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
                            WHERE p.produk_id = v_item_produk_id
                            AND pm.kategoriId = v_promo.kategoriId;

                            IF v_usage_count > 0 THEN
                                v_kategori_in_promo := TRUE;
                                EXIT;
                            END IF;
                        END LOOP;

                        IF NOT v_kategori_in_promo THEN
                            v_is_applicable := FALSE;
                            v_error_message := 'Promo hanya berlaku untuk kategori produk tertentu';
                        END IF;
                    END IF;
                END IF;

                -- Check 8: Promo Rules
                IF v_is_applicable THEN
                    -- Check MIN_QTY rule
                    SELECT pr.nilai->>'qty' INTO v_min_qty
                    FROM promo_rule pr
                    WHERE pr.promo_id = v_promo.promo_id
                    AND pr.tipe_rule = 'MIN_QTY'
                    AND pr.is_required = TRUE
                    LIMIT 1;

                    IF v_min_qty IS NOT NULL AND v_item_count < v_min_qty::INT THEN
                        v_is_applicable := FALSE;
                        v_error_message := 'Minimal jumlah pembelian ' || v_min_qty || ' item';
                    END IF;

                    -- Check MIN_NOMINAL rule
                    SELECT pr.nilai->>'nominal' INTO v_min_nominal
                    FROM promo_rule pr
                    WHERE pr.promo_id = v_promo.promo_id
                    AND pr.tipe_rule = 'MIN_NOMINAL'
                    AND pr.is_required = TRUE
                    LIMIT 1;

                    IF v_min_nominal IS NOT NULL AND p_subtotal < v_min_nominal::DECIMAL THEN
                        v_is_applicable := FALSE;
                        v_error_message := 'Minimal nominal pembelian Rp' || v_min_nominal;
                    END IF;

                    -- Check HARI_TERTENTU rule
                    SELECT pr.nilai->>'days' INTO v_allowed_days
                    FROM promo_rule pr
                    WHERE pr.promo_id = v_promo.promo_id
                    AND pr.tipe_rule = 'HARI_TERTENTU'
                    AND pr.is_required = TRUE
                    LIMIT 1;

                    IF v_allowed_days IS NOT NULL THEN
                        -- Convert day_of_week (0=Sunday, 1=Monday, etc.) to array
                        -- v_allowed_days should be like '[0,1,2]' for Sun, Mon, Tue
                        IF NOT (v_allowed_days::JSONB ? v_day_of_week::TEXT) THEN
                            v_is_applicable := FALSE;
                            v_error_message := 'Promo hanya berlaku pada hari tertentu';
                        END IF;
                    END IF;

                    -- Check JAM_TERTENTU rule
                    SELECT pr.nilai->>'hours' INTO v_allowed_hours
                    FROM promo_rule pr
                    WHERE pr.promo_id = v_promo.promo_id
                    AND pr.tipe_rule = 'JAM_TERTENTU'
                    AND pr.is_required = TRUE
                    LIMIT 1;

                    IF v_allowed_hours IS NOT NULL THEN
                        -- Check if current hour is in allowed hours
                        IF NOT (v_allowed_hours::JSONB ? EXTRACT(HOUR FROM CURRENT_TIME)::TEXT) THEN
                            v_is_applicable := FALSE;
                            v_error_message := 'Promo hanya berlaku pada jam tertentu';
                        END IF;
                    END IF;

                    -- Check PELANGGAN_SEGMEN rule
                    SELECT pr.nilai->>'segments' INTO v_allowed_segments
                    FROM promo_rule pr
                    WHERE pr.promo_id = v_promo.promo_id
                    AND pr.tipe_rule = 'PELANGGAN_SEGMEN'
                    AND pr.is_required = TRUE
                    LIMIT 1;

                    IF v_allowed_segments IS NOT NULL AND v_pelanggan_segmen IS NOT NULL THEN
                        IF NOT (v_allowed_segments::JSONB ? v_pelanggan_segmen) THEN
                            v_is_applicable := FALSE;
                            v_error_message := 'Promo hanya berlaku untuk segmen pelanggan tertentu';
                        END IF;
                    END IF;

                    -- Check METODE_PEMBAYARAN rule
                    SELECT pr.nilai->>'methods' INTO v_allowed_payment_methods
                    FROM promo_rule pr
                    WHERE pr.promo_id = v_promo.promo_id
                    AND pr.tipe_rule = 'METODE_PEMBAYARAN'
                    AND pr.is_required = TRUE
                    LIMIT 1;

                    IF v_allowed_payment_methods IS NOT NULL AND p_metode_pembayaran IS NOT NULL THEN
                        IF NOT (v_allowed_payment_methods::JSONB ? p_metode_pembayaran) THEN
                            v_is_applicable := FALSE;
                            v_error_message := 'Promo hanya berlaku untuk metode pembayaran tertentu';
                        END IF;
                    END IF;

                    -- Check FIRST_TIME_BUYER rule
                    PERFORM 1 FROM promo_rule pr
                    WHERE pr.promo_id = v_promo.promo_id
                    AND pr.tipe_rule = 'FIRST_TIME_BUYER'
                    AND pr.is_required = TRUE
                    LIMIT 1;

                    IF FOUND AND NOT v_is_first_time_buyer THEN
                        v_is_applicable := FALSE;
                        v_error_message := 'Promo hanya berlaku untuk pembelian pertama';
                    END IF;
                END IF;

                -- Calculate discount if applicable
                IF v_is_applicable THEN
                    CASE v_promo.tipe_diskon
                        WHEN 'PERSENTASE' THEN
                            v_discount_value := (p_subtotal * v_promo.nilai_diskon) / 100;
                            v_promo_discount := LEAST(v_discount_value, COALESCE(v_promo.max_diskon, v_discount_value));

                        WHEN 'NOMINAL' THEN
                            v_promo_discount := LEAST(v_promo.nilai_diskon, p_subtotal);

                        WHEN 'HARGA_SPESIAL' THEN
                            -- For special price, discount is calculated per item
                            -- This is a simplified version - actual implementation may vary
                            v_promo_discount := v_promo.nilai_diskon;

                        WHEN 'CASHBACK' THEN
                            v_promo_discount := v_promo.nilai_diskon;

                        WHEN 'BUY_X_GET_Y' THEN
                            -- Extract buy_x_get_y config
                            IF v_promo.buyXgetYConfig IS NOT NULL THEN
                                v_buy_x_qty := COALESCE((v_promo.buyXgetYConfig->>'buy_qty')::INT, 1);
                                v_get_y_qty := COALESCE((v_promo.buyXgetYConfig->>'get_qty')::INT, 1);

                                -- Calculate how many free items based on quantity
                                IF v_item_count >= v_buy_x_qty THEN
                                    v_promo_discount := (v_item_count / v_buy_x_qty) * v_get_y_qty * v_promo.nilai_diskon;
                                ELSE
                                    v_is_applicable := FALSE;
                                    v_error_message := 'Belum memenuhi syarat Buy ' || v_buy_x_qty || ' Get ' || v_get_y_qty;
                                END IF;
                            END IF;

                        WHEN 'VOUCHER' THEN
                            v_discount_value := (p_subtotal * v_promo.nilai_diskon) / 100;
                            v_promo_discount := LEAST(v_discount_value, COALESCE(v_promo.max_diskon, v_discount_value));

                        ELSE
                            v_promo_discount := 0;
                    END CASE;

                    -- Ensure discount doesn't exceed subtotal
                    v_promo_discount := LEAST(v_promo_discount, p_subtotal);

                    -- Build metadata
                    v_promo_metadata := jsonb_build_object(
                        'promo_id', v_promo.promo_id,
                        'kode_promo', v_promo.kode_promo,
                        'nama_promo', v_promo.nama_promo,
                        'deskripsi', v_promo.deskripsi,
                        'tipe_diskon', v_promo.tipe_diskon,
                        'nilai_diskon', v_promo.nilai_diskon,
                        'tipe_scope', v_promo.tipe_scope
                    );

                    -- Add to applicable promos
                    v_applicable_promos := v_applicable_promos || jsonb_build_object(
                        'promo_id', v_promo.promo_id,
                        'kode_promo', v_promo.kode_promo,
                        'nama_promo', v_promo.nama_promo,
                        'tipe_diskon', v_promo.tipe_diskon,
                        'discount', v_promo_discount,
                        'metadata', v_promo_metadata
                    );

                    v_total_discount := v_total_discount + v_promo_discount;
                END IF;
            END IF;

            -- Add error if not applicable
            IF NOT v_is_applicable AND v_error_message IS NOT NULL THEN
                v_errors := v_errors || jsonb_build_object(
                    'kode_promo', v_promo_code,
                    'message', v_error_message
                );
            END IF;
        END LOOP;
    END IF;

    -- Build final result
    v_result := jsonb_build_object(
        'applicable_promos', v_applicable_promos,
        'total_discount', v_total_discount,
        'errors', v_errors
    );

    RETURN v_result;
END;
$function$
;
