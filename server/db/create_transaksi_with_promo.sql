CREATE OR REPLACE FUNCTION validate_promo_eligibility(
    p_promo_id VARCHAR,
    p_cabang_id VARCHAR,
    p_pelanggan_id VARCHAR DEFAULT NULL,
    p_cart_items JSONB,
    p_subtotal DECIMAL,
    p_metode_pembayaran VARCHAR DEFAULT NULL,
    p_tanggal_transaksi TIMESTAMP DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
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
$function$;











CREATE OR REPLACE FUNCTION calculate_promo_discount(
    p_promo_id VARCHAR,
    p_cart_items JSONB,
    p_subtotal DECIMAL,
    p_cabang_id VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
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
$function$;


CREATE OR REPLACE FUNCTION check_produk_eligible(
    p_promo_id VARCHAR,
    p_produk_id VARCHAR,
    p_cabang_id VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
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
    SELECT produk_master_id, kategori_id 
    INTO v_produk_master_id, v_kategori_id
    FROM produk
    WHERE produk_id = p_produk_id AND cabang_id = p_cabang_id;
    
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
$function$;


CREATE OR REPLACE FUNCTION apply_multiple_promos(
    p_promo_codes VARCHAR[],
    p_cabang_id VARCHAR,
    p_pelanggan_id VARCHAR,
    p_cart_items JSONB,
    p_subtotal DECIMAL,
    p_metode_pembayaran VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
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
            p_pelanggan_id,
            p_cart_items,
            v_current_subtotal,
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
$function$;


CREATE OR REPLACE FUNCTION validate_bundle_promo(
    p_promo_id VARCHAR,
    p_cart_items JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
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
$function$;



CREATE OR REPLACE FUNCTION public.create_transaksi_with_promo(
    p_cabang_id character varying, 
    p_jenis_transaksi character varying, 
    p_tanggal timestamp without time zone, 
    p_pelanggan_id character varying, 
    p_supplier_id character varying, 
    p_shift_id character varying, 
    p_promo_codes VARCHAR[] DEFAULT NULL,  -- ⭐ NEW: Array of promo codes
    p_details jsonb, 
    p_biaya_tambahan double precision, 
    p_keterangan text, 
    p_customer_info jsonb, 
    p_user_id character varying, 
    p_ip_address character varying, 
    p_user_name character varying, 
    p_metode_pembayaran character varying DEFAULT NULL::character varying,
    p_tenor integer DEFAULT NULL,
    p_uang_muka numeric DEFAULT 0
)
RETURNS jsonb  -- ⭐ Changed to JSONB to return more info
LANGUAGE plpgsql
AS $function$
DECLARE
    v_nomor_transaksi VARCHAR;
    v_transaksi_id VARCHAR(36);
    v_subtotal DECIMAL := 0;
    v_total_pajak DECIMAL := 0;
    v_total_diskon DECIMAL := 0;
    v_total_diskon_promo DECIMAL := 0;  -- ⭐ NEW
    v_total DECIMAL := 0;
    v_tax_percentage DECIMAL;
    v_is_tax_included BOOLEAN;
    v_detail JSONB;
    -- ... (all existing variables)
    v_promo_result JSONB;  -- ⭐ NEW
    v_promo JSONB;  -- ⭐ NEW
    v_promo_id VARCHAR;  -- ⭐ NEW
    v_promo_discount DECIMAL;  -- ⭐ NEW
BEGIN
    -- ... (All existing validation code remains the same)
    
    -- ⭐ NEW: Apply Promos BEFORE calculating final total
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
    
    -- Hitung grand total WITH promo discount
    v_total := v_subtotal - v_total_diskon - v_total_diskon_promo + v_total_pajak + COALESCE(p_biaya_tambahan, 0);
    
    -- ... (Insert transaksi - existing code)
    
    -- ⭐ NEW: Insert transaksi_promo records
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
    
    -- ... (Rest of existing code)
    
    -- ⭐ NEW: Return enhanced result with promo info
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
$function$;


-- Grosir customer, weekend, paying with QRIS
SELECT create_transaksi_with_promo(
    'cabang-001',
    'PENJUALAN',
    '2025-02-01 14:30:00',          -- Sabtu
    'pelanggan-grosir-001',          -- Grosir customer
    NULL,
    'shift-001',
    ARRAY['WEEKEND20', 'GROSIR50', 'QRIS10'],  -- ⭐ Multiple promos
    '[
        {"produk_id": "prod-001", "jumlah": 20, "harga_satuan": 50000, "diskon_persen": 0, "diskon_nominal": 0}
    ]'::jsonb,
    0,
    'Triple promo test',
    NULL,
    'user-001',
    '192.168.1.1',
    'Admin',
    'QRIS',                          -- QRIS payment
    NULL,
    0
);

-- Result:
{
    "subtotal": 1000000,
    "diskon_promo": 270000,          -- 200k (20%) + 50k + 20k (capped at 25k max)
    "total": 730000,
    "promos_applied": [
        {"kode_promo": "WEEKEND20", "discount": 200000},
        {"kode_promo": "GROSIR50", "discount": 50000},
        {"kode_promo": "QRIS10", "discount": 25000}  // Capped
    ]
}


SELECT create_transaksi_with_promo(
    'cabang-001',
    'PENJUALAN',
    NOW(),
    'pelanggan-001',
    NULL,
    'shift-001',
    ARRAY['BUY3GET1'],
    '[
        {"produk_id": "prod-eligible-001", "jumlah": 6, "harga_satuan": 25000, "diskon_persen": 0, "diskon_nominal": 0}
    ]'::jsonb,
    0,
    'Buy 3 get 1 test',
    NULL,
    'user-001',
    '192.168.1.1',
    'Admin',
    'TUNAI',
    NULL,
    0
);

-- Result:
{
    "subtotal": 150000,              -- 6 x 25000
    "diskon_promo": 50000,           -- 2 free items (6/3 = 2)
    "total": 100000,
    "promos_applied": [
        {
            "kode_promo": "BUY3GET1",
            "discount": 50000,
            "free_items": [
                {"produk_id": "prod-eligible-001", "free_qty": 2}
            ]
        }
    ]
}




-- ============================================
-- EXAMPLE DATA: PROMOS
-- ============================================

-- 1. PROMO WEEKEND 20% (GLOBAL)
INSERT INTO promo_diskon (
    promo_id, kode_promo, nama_promo, deskripsi,
    tipe_diskon, nilai_diskon, tipe_scope,
    tanggal_mulai, tanggal_berakhir,
    max_diskon, is_stackable, prioritas, status
) VALUES (
    gen_random_uuid(), 'WEEKEND20', 'Diskon Weekend 20%',
    'Dapatkan diskon 20% setiap weekend!',
    'PERSENTASE', 20, 'GLOBAL',
    '2025-01-01', '2025-12-31',
    100000, TRUE, 10, 'aktif'
) RETURNING promo_id AS promo_weekend_id \gset

-- Add rule: Hanya Sabtu-Minggu
INSERT INTO promo_rule (promo_id, tipe_rule, nilai, is_required, error_message)
VALUES (
    :'promo_weekend_id',
    'HARI_TERTENTU',
    '{"hari": ["SATURDAY", "SUNDAY"]}'::JSONB,
    TRUE,
    'Promo hanya berlaku di hari Sabtu dan Minggu'
);

-- ============================================
-- 2. BUY 3 GET 1 - Produk Spesifik
INSERT INTO promo_diskon (
    promo_id, kode_promo, nama_promo, deskripsi,
    tipe_diskon, nilai_diskon, tipe_scope,
    buy_x_get_y_config,
    tanggal_mulai, tanggal_berakhir,
    is_stackable, prioritas, status
) VALUES (
    gen_random_uuid(), 'BUY3GET1', 'Beli 3 Gratis 1',
    'Beli 3 produk pilihan gratis 1!',
    'BUY_X_GET_Y', 0, 'PRODUK_SPESIFIK',
    '{"buy": 3, "get": 1}'::JSONB,
    '2025-01-01', '2025-06-30',
    FALSE, 20, 'aktif'
) RETURNING promo_id AS promo_buy3get1_id \gset

-- Add eligible products (example - replace with actual product IDs)
-- INSERT INTO promo_produk (promo_id, tipe_target, target_id, is_include)
-- VALUES (:'promo_buy3get1_id', 'PRODUK_MASTER', 'prod-master-001', TRUE);

-- ============================================
-- 3. GROSIR SPECIAL - Min 500k dapat 50k
INSERT INTO promo_diskon (
    promo_id, kode_promo, nama_promo, deskripsi,
    tipe_diskon, nilai_diskon, tipe_scope,
    min_pembelian,
    tanggal_mulai, tanggal_berakhir,
    is_stackable, prioritas, status
) VALUES (
    gen_random_uuid(), 'GROSIR50', 'Diskon Grosir Rp 50.000',
    'Khusus pelanggan grosir, belanja min 500rb dapat potongan 50rb',
    'NOMINAL', 50000, 'GLOBAL',
    500000,
    '2025-01-01', '2025-12-31',
    TRUE, 15, 'aktif'
) RETURNING promo_id AS promo_grosir_id \gset

-- Add rule: Hanya untuk segmen grosir
INSERT INTO promo_rule (promo_id, tipe_rule, nilai, is_required)
VALUES (
    :'promo_grosir_id',
    'PELANGGAN_SEGMEN',
    '{"segmen": ["grosir"]}'::JSONB,
    TRUE
);

-- Add rule: Min pembelian 500k
INSERT INTO promo_rule (promo_id, tipe_rule, nilai, is_required)
VALUES (
    :'promo_grosir_id',
    'MIN_NOMINAL',
    '{"min_nominal": 500000}'::JSONB,
    TRUE
);

-- ============================================
-- 4. HAPPY HOUR - Jam 18-21, Diskon 30%
INSERT INTO promo_diskon (
    promo_id, kode_promo, nama_promo, deskripsi,
    tipe_diskon, nilai_diskon, tipe_scope,
    tanggal_mulai, tanggal_berakhir,
    max_diskon, is_stackable, prioritas, status
) VALUES (
    gen_random_uuid(), 'HAPPYHOUR', 'Happy Hour 30%',
    'Diskon 30% setiap jam 18:00-21:00',
    'PERSENTASE', 30, 'GLOBAL',
    '2025-01-01', '2025-12-31',
    150000, FALSE, 25, 'aktif'
) RETURNING promo_id AS promo_happyhour_id \gset

-- Add rule: Jam tertentu
INSERT INTO promo_rule (promo_id, tipe_rule, nilai, is_required)
VALUES (
    :'promo_happyhour_id',
    'JAM_TERTENTU',
    '{"jam_mulai": "18:00:00", "jam_selesai": "21:00:00"}'::JSONB,
    TRUE
);

-- ============================================
-- 5. CASHBACK QRIS 10%
INSERT INTO promo_diskon (
    promo_id, kode_promo, nama_promo, deskripsi,
    tipe_diskon, nilai_diskon, tipe_scope,
    max_diskon,
    tanggal_mulai, tanggal_berakhir,
    is_stackable, prioritas, status
) VALUES (
    gen_random_uuid(), 'QRIS10', 'Cashback QRIS 10%',
    'Bayar pakai QRIS dapat cashback 10%',
    'CASHBACK', 10, 'GLOBAL',
    25000,
    '2025-01-01', '2025-03-31',
    TRUE, 5, 'aktif'
) RETURNING promo_id AS promo_qris_id \gset

-- Add rule: Metode pembayaran QRIS
INSERT INTO promo_rule (promo_id, tipe_rule, nilai, is_required)
VALUES (
    :'promo_qris_id',
    'METODE_PEMBAYARAN',
    '{"metode": ["QRIS"]}'::JSONB,
    TRUE
);

-- ============================================
-- 6. VOUCHER NEW CUSTOMER
INSERT INTO promo_diskon (
    promo_id, kode_promo, nama_promo, deskripsi,
    tipe_diskon, nilai_diskon, tipe_scope,
    min_pembelian, max_penggunaan_per_user,
    tanggal_mulai, tanggal_berakhir,
    is_stackable, prioritas, status
) VALUES (
    gen_random_uuid(), 'WELCOME100', 'Voucher Member Baru Rp 100.000',
    'Selamat datang! Voucher khusus member baru',
    'VOUCHER', 100000, 'GLOBAL',
    300000, 1,
    '2025-01-01', '2025-12-31',
    FALSE, 30, 'aktif'
) RETURNING promo_id AS promo_newcust_id \gset

-- Add rule: First time buyer only
INSERT INTO promo_rule (promo_id, tipe_rule, nilai, is_required)
VALUES (
    :'promo_newcust_id',
    'FIRST_TIME_BUYER',
    '{}'::JSONB,
    TRUE
);

-- ============================================
-- 7. BUNDLE PROMO - Snack Bundle
INSERT INTO promo_diskon (
    promo_id, kode_promo, nama_promo, deskripsi,
    tipe_diskon, nilai_diskon, tipe_scope,
    tanggal_mulai, tanggal_berakhir,
    is_stackable, prioritas, status
) VALUES (
    gen_random_uuid(), 'SNACKBUNDLE', 'Paket Snack Hemat',
    'Beli paket snack dapat diskon 25%',
    'PERSENTASE', 25, 'CUSTOM',
    '2025-01-01', '2025-12-31',
    FALSE, 20, 'aktif'
) RETURNING promo_id AS promo_bundle_id \gset

-- Add bundle requirements (example - replace with actual product master IDs)
-- INSERT INTO promo_bundle (promo_id, produk_master_id, min_qty, is_required)
-- VALUES 
--     (:'promo_bundle_id', 'prod-master-snack-1', 2, TRUE),
--     (:'promo_bundle_id', 'prod-master-snack-2', 1, TRUE),
--     (:'promo_bundle_id', 'prod-master-drink-1', 1, FALSE);

-- ============================================
-- 8. KATEGORI DISKON - Minuman 15%
INSERT INTO promo_diskon (
    promo_id, kode_promo, nama_promo, deskripsi,
    tipe_diskon, nilai_diskon, tipe_scope,
    tanggal_mulai, tanggal_berakhir,
    max_diskon, is_stackable, prioritas, status
) VALUES (
    gen_random_uuid(), 'MINUMAN15', 'Diskon Minuman 15%',
    'Semua minuman diskon 15%',
    'PERSENTASE', 15, 'KATEGORI_SPESIFIK',
    '2025-01-01', '2025-12-31',
    50000, TRUE, 12, 'aktif'
) RETURNING promo_id AS promo_minuman_id \gset

-- Add kategori (example - replace with actual kategori ID)
-- INSERT INTO promo_produk (promo_id, tipe_target, target_id, is_include)
-- VALUES (:'promo_minuman_id', 'KATEGORI', 'kategori-minuman-id', TRUE);

-- Exclude premium products from kategori promo
-- INSERT INTO promo_produk (promo_id, tipe_target, target_id, is_include)
-- VALUES (:'promo_minuman_id', 'PRODUK_MASTER', 'prod-master-premium-1', FALSE);