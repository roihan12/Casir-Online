-- ================================================================
-- LOYALTY FEATURE MIGRATION
-- Version: 1.0
-- Date: 2026-02-03
-- Description: Create loyalty tables and modify transaksi for rewards
-- ================================================================

-- ================================================================
-- 1. CREATE ENUM TYPES
-- ================================================================

DO $$ BEGIN
    CREATE TYPE loyalty_point_type AS ENUM ('EARN', 'REDEEM', 'EXPIRE', 'ADJUSTMENT', 'BONUS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE loyalty_reward_type AS ENUM ('DISCOUNT', 'FREE_PRODUCT', 'CASHBACK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ================================================================
-- 2. CREATE LOYALTY_CONFIG TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS loyalty_config (
    loyalty_config_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    cabang_id VARCHAR(36) REFERENCES cabang(cabang_id) ON DELETE CASCADE,
    
    -- Points earning settings
    points_per_amount DECIMAL(10, 4) DEFAULT 0.01,  -- 1 point per Rp 100 (0.01)
    min_transaction_for_points DECIMAL(15, 2) DEFAULT 10000,  -- Min Rp 10.000
    
    -- Points expiry
    points_expiry_days INT DEFAULT 365,  -- 0 = never expire
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(36),
    updated_by VARCHAR(36),
    
    -- Unique constraint: one config per branch (null = global)
    CONSTRAINT uq_loyalty_config_cabang UNIQUE (cabang_id)
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_loyalty_config_cabang ON loyalty_config(cabang_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_config_active ON loyalty_config(is_active);

-- ================================================================
-- 3. CREATE LOYALTY_TIER TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS loyalty_tier (
    loyalty_tier_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    
    -- Tier info
    name VARCHAR(50) NOT NULL,  -- Regular, Silver, Gold, Platinum
    min_points INT NOT NULL DEFAULT 0,
    max_points INT,  -- NULL = unlimited
    
    -- Benefits
    discount_percent DECIMAL(5, 2) DEFAULT 0,  -- Auto discount for this tier
    benefits JSONB DEFAULT '[]'::JSONB,  -- Array of benefit descriptions
    
    -- Display
    color VARCHAR(20) DEFAULT '#6B7280',  -- Hex color
    icon VARCHAR(50) DEFAULT 'star',  -- Icon name
    badge_url VARCHAR(255),  -- Badge image URL
    
    -- Order
    tier_order INT NOT NULL DEFAULT 0,  -- For sorting
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(36),
    updated_by VARCHAR(36)
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_loyalty_tier_points ON loyalty_tier(min_points, max_points);
CREATE INDEX IF NOT EXISTS idx_loyalty_tier_order ON loyalty_tier(tier_order);
CREATE INDEX IF NOT EXISTS idx_loyalty_tier_active ON loyalty_tier(is_active);

-- ================================================================
-- 4. CREATE LOYALTY_REWARD TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS loyalty_reward (
    loyalty_reward_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    
    -- Reward info
    name VARCHAR(100) NOT NULL,  -- Diskon Rp 5.000
    description TEXT,
    
    -- Points required
    points_required INT NOT NULL,
    
    -- Reward type & value
    reward_type loyalty_reward_type NOT NULL DEFAULT 'DISCOUNT',
    reward_value DECIMAL(15, 2) NOT NULL,  -- Discount amount or product value
    
    -- For FREE_PRODUCT type
    produk_master_id VARCHAR(36) REFERENCES produk_master(produk_master_id),
    
    -- Limits
    max_redeem_per_customer INT DEFAULT NULL,  -- NULL = unlimited
    total_stock INT DEFAULT NULL,  -- NULL = unlimited
    current_redeemed INT DEFAULT 0,
    
    -- Validity
    valid_from DATE,
    valid_until DATE,
    
    -- Minimum tier required (optional)
    min_tier_id VARCHAR(36) REFERENCES loyalty_tier(loyalty_tier_id),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(36),
    updated_by VARCHAR(36)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_reward_points ON loyalty_reward(points_required);
CREATE INDEX IF NOT EXISTS idx_loyalty_reward_type ON loyalty_reward(reward_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_reward_active ON loyalty_reward(is_active);
CREATE INDEX IF NOT EXISTS idx_loyalty_reward_validity ON loyalty_reward(valid_from, valid_until);

-- ================================================================
-- 5. CREATE LOYALTY_POINT_HISTORY TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS loyalty_point_history (
    loyalty_point_history_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    
    -- References
    pelanggan_id VARCHAR(36) NOT NULL REFERENCES pelanggan(pelanggan_id) ON DELETE CASCADE,
    transaksi_id VARCHAR(36) REFERENCES transaksi(transaksi_id),
    reward_id VARCHAR(36) REFERENCES loyalty_reward(loyalty_reward_id),
    
    -- Points
    points INT NOT NULL,  -- Positive for earn, negative for redeem
    points_before INT NOT NULL,  -- Balance before this transaction
    points_after INT NOT NULL,  -- Balance after this transaction
    
    -- Type
    type loyalty_point_type NOT NULL,
    
    -- Description
    description VARCHAR(255),
    
    -- Expiry tracking
    expires_at TIMESTAMP,  -- When these points expire
    is_expired BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(36)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_point_history_pelanggan ON loyalty_point_history(pelanggan_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_point_history_transaksi ON loyalty_point_history(transaksi_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_point_history_type ON loyalty_point_history(type);
CREATE INDEX IF NOT EXISTS idx_loyalty_point_history_created ON loyalty_point_history(created_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_point_history_expires ON loyalty_point_history(expires_at) WHERE NOT is_expired;

-- ================================================================
-- 6. ALTER TRANSAKSI TABLE - Add loyalty columns
-- ================================================================

DO $$ BEGIN
    ALTER TABLE transaksi ADD COLUMN loyalty_reward_id VARCHAR(36) REFERENCES loyalty_reward(loyalty_reward_id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE transaksi ADD COLUMN loyalty_discount DECIMAL(15, 2) DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE transaksi ADD COLUMN points_earned INT DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE transaksi ADD COLUMN points_redeemed INT DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Index for loyalty transactions
CREATE INDEX IF NOT EXISTS idx_transaksi_loyalty_reward ON transaksi(loyalty_reward_id) WHERE loyalty_reward_id IS NOT NULL;

-- ================================================================
-- 7. ALTER PELANGGAN TABLE - Ensure poin column exists
-- ================================================================

-- Add lifetime points tracking
DO $$ BEGIN
    ALTER TABLE pelanggan ADD COLUMN lifetime_points INT DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add current tier reference
DO $$ BEGIN
    ALTER TABLE pelanggan ADD COLUMN loyalty_tier_id VARCHAR(36) REFERENCES loyalty_tier(loyalty_tier_id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Index for tier lookup
CREATE INDEX IF NOT EXISTS idx_pelanggan_tier ON pelanggan(loyalty_tier_id);

-- ================================================================
-- 8. INSERT DEFAULT LOYALTY TIERS
-- ================================================================

INSERT INTO loyalty_tier (loyalty_tier_id, name, min_points, max_points, discount_percent, benefits, color, icon, tier_order, is_active)
VALUES 
    (gen_random_uuid()::VARCHAR, 'Regular', 0, 999, 0, '[]'::JSONB, '#9CA3AF', 'user', 1, TRUE),
    (gen_random_uuid()::VARCHAR, 'Silver', 1000, 4999, 2, '["Birthday voucher", "Exclusive offers"]'::JSONB, '#A1A1AA', 'award', 2, TRUE),
    (gen_random_uuid()::VARCHAR, 'Gold', 5000, 9999, 5, '["Priority checkout", "Free delivery", "Birthday voucher"]'::JSONB, '#F59E0B', 'star', 3, TRUE),
    (gen_random_uuid()::VARCHAR, 'Platinum', 10000, NULL, 10, '["VIP access", "Priority checkout", "Free delivery", "Birthday voucher", "Exclusive events"]'::JSONB, '#8B5CF6', 'crown', 4, TRUE)
ON CONFLICT DO NOTHING;

-- ================================================================
-- 9. INSERT DEFAULT LOYALTY REWARDS
-- ================================================================

INSERT INTO loyalty_reward (loyalty_reward_id, name, description, points_required, reward_type, reward_value, is_active)
VALUES 
    (gen_random_uuid()::VARCHAR, 'Diskon Rp 5.000', 'Tukar 500 poin untuk diskon Rp 5.000', 500, 'DISCOUNT', 5000, TRUE),
    (gen_random_uuid()::VARCHAR, 'Diskon Rp 10.000', 'Tukar 900 poin untuk diskon Rp 10.000', 900, 'DISCOUNT', 10000, TRUE),
    (gen_random_uuid()::VARCHAR, 'Diskon Rp 25.000', 'Tukar 2000 poin untuk diskon Rp 25.000', 2000, 'DISCOUNT', 25000, TRUE),
    (gen_random_uuid()::VARCHAR, 'Diskon Rp 50.000', 'Tukar 3500 poin untuk diskon Rp 50.000', 3500, 'DISCOUNT', 50000, TRUE),
    (gen_random_uuid()::VARCHAR, 'Diskon Rp 100.000', 'Tukar 6500 poin untuk diskon Rp 100.000', 6500, 'DISCOUNT', 100000, TRUE)
ON CONFLICT DO NOTHING;

-- ================================================================
-- 10. CREATE/UPDATE ADD_LOYALTY_POINTS FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION add_loyalty_points(
    p_pelanggan_id VARCHAR,
    p_transaksi_id VARCHAR,
    p_transaction_amount DECIMAL,
    p_user_id VARCHAR,
    p_ip_address VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
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
$function$;

-- ================================================================
-- 11. CREATE REDEEM_LOYALTY_REWARD FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION redeem_loyalty_reward(
    p_pelanggan_id VARCHAR,
    p_reward_id VARCHAR,
    p_transaksi_id VARCHAR,
    p_user_id VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
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
        points, points_before, points_after, type, description, created_by
    ) VALUES (
        gen_random_uuid()::VARCHAR, p_pelanggan_id, p_transaksi_id, p_reward_id,
        -v_reward.points_required, v_points_before, v_points_after, 'REDEEM',
        'Redeem: ' || v_reward.name, p_user_id
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
$function$;

-- ================================================================
-- 12. CREATE GET_CUSTOMER_LOYALTY_INFO FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION get_customer_loyalty_info(p_pelanggan_id VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
    v_result JSONB;
    v_pelanggan RECORD;
    v_tier RECORD;
    v_next_tier RECORD;
    v_points_to_next INT;
BEGIN
    -- Get pelanggan with tier
    SELECT p.*, lt.name as tier_name, lt.discount_percent, lt.benefits,
           lt.color as tier_color, lt.icon as tier_icon, lt.tier_order
    INTO v_pelanggan
    FROM pelanggan p
    LEFT JOIN loyalty_tier lt ON lt.loyalty_tier_id = p.loyalty_tier_id
    WHERE p.pelanggan_id = p_pelanggan_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Pelanggan tidak ditemukan');
    END IF;
    
    -- Calculate next tier
    SELECT * INTO v_next_tier
    FROM loyalty_tier
    WHERE is_active = TRUE
    AND min_points > COALESCE(v_pelanggan.poin, 0)
    ORDER BY min_points
    LIMIT 1;
    
    IF v_next_tier.loyalty_tier_id IS NOT NULL THEN
        v_points_to_next := v_next_tier.min_points - COALESCE(v_pelanggan.poin, 0);
    ELSE
        v_points_to_next := 0;
    END IF;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'pelanggan_id', p_pelanggan_id,
        'nama', v_pelanggan.nama_pelanggan,
        'current_points', COALESCE(v_pelanggan.poin, 0),
        'lifetime_points', COALESCE(v_pelanggan.lifetime_points, 0),
        'tier', jsonb_build_object(
            'id', v_pelanggan.loyalty_tier_id,
            'name', COALESCE(v_pelanggan.tier_name, 'Regular'),
            'discount_percent', COALESCE(v_pelanggan.discount_percent, 0),
            'benefits', COALESCE(v_pelanggan.benefits, '[]'::JSONB),
            'color', COALESCE(v_pelanggan.tier_color, '#9CA3AF'),
            'icon', COALESCE(v_pelanggan.tier_icon, 'user')
        ),
        'next_tier', CASE 
            WHEN v_next_tier.loyalty_tier_id IS NOT NULL THEN
                jsonb_build_object(
                    'id', v_next_tier.loyalty_tier_id,
                    'name', v_next_tier.name,
                    'min_points', v_next_tier.min_points,
                    'points_needed', v_points_to_next
                )
            ELSE NULL
        END
    );
END;
$function$;

-- ================================================================
-- 13. CREATE GET_AVAILABLE_REWARDS FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION get_available_rewards(p_pelanggan_id VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
    v_pelanggan RECORD;
    v_rewards JSONB;
BEGIN
    -- Get pelanggan info
    SELECT poin, loyalty_tier_id INTO v_pelanggan
    FROM pelanggan
    WHERE pelanggan_id = p_pelanggan_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Pelanggan tidak ditemukan');
    END IF;
    
    -- Get all active rewards with eligibility
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', lr.loyalty_reward_id,
            'name', lr.name,
            'description', lr.description,
            'points_required', lr.points_required,
            'reward_type', lr.reward_type,
            'reward_value', lr.reward_value,
            'is_eligible', (COALESCE(v_pelanggan.poin, 0) >= lr.points_required),
            'points_short', CASE 
                WHEN COALESCE(v_pelanggan.poin, 0) >= lr.points_required THEN 0
                ELSE lr.points_required - COALESCE(v_pelanggan.poin, 0)
            END,
            'stock_available', CASE 
                WHEN lr.total_stock IS NULL THEN TRUE
                ELSE lr.current_redeemed < lr.total_stock
            END
        )
        ORDER BY lr.points_required
    ) INTO v_rewards
    FROM loyalty_reward lr
    WHERE lr.is_active = TRUE
    AND (lr.valid_from IS NULL OR CURRENT_DATE >= lr.valid_from)
    AND (lr.valid_until IS NULL OR CURRENT_DATE <= lr.valid_until);
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'current_points', COALESCE(v_pelanggan.poin, 0),
        'rewards', COALESCE(v_rewards, '[]'::JSONB)
    );
END;
$function$;

-- ================================================================
-- 14. GRANT PERMISSIONS (adjust as needed)
-- ================================================================

-- Grant permissions to application user if exists
-- GRANT SELECT, INSERT, UPDATE, DELETE ON loyalty_config TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON loyalty_tier TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON loyalty_reward TO app_user;
-- GRANT SELECT, INSERT ON loyalty_point_history TO app_user;

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================

-- Verify tables created
DO $$
BEGIN
    RAISE NOTICE 'Loyalty migration completed successfully!';
    RAISE NOTICE 'Tables created: loyalty_config, loyalty_tier, loyalty_reward, loyalty_point_history';
    RAISE NOTICE 'Columns added to transaksi: loyalty_reward_id, loyalty_discount, points_earned, points_redeemed';
    RAISE NOTICE 'Columns added to pelanggan: lifetime_points, loyalty_tier_id';
    RAISE NOTICE 'Functions created: add_loyalty_points, redeem_loyalty_reward, get_customer_loyalty_info, get_available_rewards';
END $$;
