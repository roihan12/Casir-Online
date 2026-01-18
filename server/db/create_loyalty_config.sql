-- Create loyalty_config table
CREATE TABLE IF NOT EXISTS loyalty_config (
  loyalty_config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabang_id VARCHAR(36) REFERENCES cabang(cabang_id),
  point_rate INT NOT NULL DEFAULT 10000,
  minimum_transaction DECIMAL(15, 2),
  expiry_days INT,
  is_active BOOLEAN DEFAULT TRUE,
  redeem_rules JSONB,
  tier_rules JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add comment to the table
COMMENT ON TABLE loyalty_config IS 'Configuration for loyalty points system';

-- Add comments to columns
COMMENT ON COLUMN loyalty_config.point_rate IS 'Amount of transaction value needed to get 1 point';
COMMENT ON COLUMN loyalty_config.minimum_transaction IS 'Minimum transaction amount to be eligible for points';
COMMENT ON COLUMN loyalty_config.expiry_days IS 'Number of days until points expire';
COMMENT ON COLUMN loyalty_config.redeem_rules IS 'JSON configuration for redemption rules';
COMMENT ON COLUMN loyalty_config.tier_rules IS 'JSON configuration for loyalty tiers';

-- Insert default configuration
INSERT INTO loyalty_config (point_rate, is_active)
VALUES (10000, TRUE);

-- Update the add_loyalty_points function to use the loyalty_config table
CREATE OR REPLACE FUNCTION public.add_loyalty_points(
    p_pelanggan_id character varying, 
    p_transaksi_id character varying, 
    p_total double precision, 
    p_user_id character varying, 
    p_ip_address character varying
)
RETURNS void
LANGUAGE plpgsql
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
        WHERE id = p_pelanggan_id;
        
        -- Calculate final points
        v_point_akhir := v_point_sebelumnya + v_point_didapatkan;
        
        -- Update customer points
        UPDATE pelanggan
        SET poin = v_point_akhir
        WHERE id = p_pelanggan_id;
        
        -- Record point history
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
        
        -- Add audit log if needed
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
$function$; 