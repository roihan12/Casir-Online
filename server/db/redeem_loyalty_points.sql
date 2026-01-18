-- Create function to redeem loyalty points
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(
    p_pelanggan_id character varying,
    p_points_to_redeem integer,
    p_transaksi_id character varying,
    p_user_id character varying,
    p_ip_address character varying
)
RETURNS TABLE(
    success boolean,
    message text,
    discount_amount numeric(15,2)
)
LANGUAGE plpgsql
AS $function$
DECLARE
    v_current_points INTEGER;
    v_point_value DECIMAL(15,2);
    v_redeem_rules JSONB;
    v_loyalty_config RECORD;
    v_cabang_id VARCHAR;
    v_discount_amount DECIMAL(15,2);
BEGIN
    -- Get customer's current points
    SELECT COALESCE(poin, 0) INTO v_current_points
    FROM pelanggan
    WHERE id = p_pelanggan_id;
    
    -- Check if customer has enough points
    IF v_current_points < p_points_to_redeem THEN
        RETURN QUERY SELECT 
            FALSE as success,
            'Poin tidak mencukupi' as message,
            0::DECIMAL(15,2) as discount_amount;
        RETURN;
    END IF;
    
    -- Get cabang_id from transaction
    SELECT cabang_id INTO v_cabang_id
    FROM transaksi
    WHERE transaksi_id = p_transaksi_id;
    
    -- Get loyalty configuration
    IF v_cabang_id IS NOT NULL THEN
        SELECT point_rate, redeem_rules INTO v_loyalty_config 
        FROM loyalty_config 
        WHERE cabang_id = v_cabang_id AND is_active = TRUE
        LIMIT 1;
    END IF;
    
    -- If no specific config found, get default
    IF v_loyalty_config.point_rate IS NULL THEN
        SELECT point_rate, redeem_rules INTO v_loyalty_config 
        FROM loyalty_config 
        WHERE is_active = TRUE
        LIMIT 1;
    END IF;
    
    -- Default redemption value if not found (1 point = Rp 100)
    IF v_loyalty_config.redeem_rules IS NULL THEN
        v_point_value := 100;
    ELSE
        -- Extract point value from redeem rules
        v_point_value := COALESCE((v_loyalty_config.redeem_rules->>'point_value')::DECIMAL(15,2), 100);
    END IF;
    
    -- Calculate discount amount
    v_discount_amount := p_points_to_redeem * v_point_value;
    
    -- Update customer points (subtract redeemed points)
    UPDATE pelanggan
    SET poin = poin - p_points_to_redeem
    WHERE id = p_pelanggan_id;
    
    -- Record point history
    INSERT INTO loyalty_point_history (
        pelanggan_id, 
        transaksi_id, 
        point_sebelumnya, 
        point_didapatkan, -- Use negative for redemption
        point_akhir, 
        keterangan
    ) VALUES (
        p_pelanggan_id,
        p_transaksi_id,
        v_current_points,
        -p_points_to_redeem,
        v_current_points - p_points_to_redeem,
        'Penukaran poin untuk diskon pada transaksi #' || p_transaksi_id
    );
    
    -- Add audit log
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
        'REDEEM_LOYALTY_POINTS',
        'pelanggan',
        p_pelanggan_id,
        jsonb_build_object(
            'transaksi_id', p_transaksi_id,
            'points_redeemed', p_points_to_redeem,
            'discount_amount', v_discount_amount
        )
    );
    
    -- Return success result with discount amount
    RETURN QUERY SELECT 
        TRUE as success,
        'Penukaran poin berhasil' as message,
        v_discount_amount as discount_amount;
END;
$function$;

-- Example of how to call this function:
/*
SELECT * FROM redeem_loyalty_points(
    'pelanggan_id_here',
    50, -- points to redeem
    'transaksi_id_here',
    'user_id_here',
    '127.0.0.1'
);
*/ 