-- View: view_inventory_health_score
-- Description: Calculates an inventory health score based on multiple factors:
--   1. Stock Level Health: How well stock levels are maintained within min/max thresholds
--   2. Expiration Health: Status of products approaching or past expiration dates
--   3. Movement Health: How actively products are moving (turnover rate)
--   4. Financial Health: Value of inventory vs sales performance
--
-- The overall score is calculated on a scale of 0-100, with higher scores indicating healthier inventory

CREATE OR REPLACE VIEW view_inventory_health_score AS
WITH 
-- Calculate stock level health
stock_level_health AS (
  SELECT
    p.cabang_id,
    pm.id AS produk_master_id,
    p.id AS produk_id,
    pm.nama_produk,
    p.stok,
    p.stok_minimum,
    p.stok_maksimum,
    -- Calculate individual stock level health on scale of 0-100
    CASE
      -- No stock but minimum required = 0 score
      WHEN p.stok = 0 AND p.stok_minimum > 0 THEN 0
      -- Below minimum stock level (score based on how close to minimum)
      WHEN p.stok < p.stok_minimum AND p.stok_minimum > 0 THEN 
        GREATEST(0, 50 * (p.stok::float / p.stok_minimum::float))
      -- Above maximum stock level (score inversely proportional to excess)
      WHEN p.stok > p.stok_maksimum AND p.stok_maksimum > 0 THEN 
        GREATEST(50, 100 - (50 * ((p.stok - p.stok_maksimum)::float / p.stok_maksimum::float)))
      -- Within ideal range
      WHEN p.stok_minimum <= p.stok AND p.stok <= p.stok_maksimum THEN 100
      -- Default case for items without proper min/max settings
      ELSE 75
    END AS stock_level_score
  FROM 
    "produk" p
    JOIN "produk_master" pm ON p.produk_master_id = pm.id
  WHERE 
    p.deleted_at IS NULL
    AND pm.deleted_at IS NULL
),

-- Calculate expiration health
expiration_health AS (
  SELECT
    p.cabang_id,
    p.id AS produk_id,
    -- Calculate expiration health on scale of 0-100
    CASE
      -- Expired products
      WHEN p.tanggal_kadaluarsa < CURRENT_DATE THEN 0
      -- Products expiring within 30 days
      WHEN p.tanggal_kadaluarsa BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days') THEN
        (EXTRACT(DAY FROM (p.tanggal_kadaluarsa - CURRENT_DATE)) / 30) * 100
      -- Products expiring within 31-90 days
      WHEN p.tanggal_kadaluarsa BETWEEN (CURRENT_DATE + INTERVAL '31 days') AND (CURRENT_DATE + INTERVAL '90 days') THEN 75
      -- Products with ample time before expiration
      WHEN p.tanggal_kadaluarsa > (CURRENT_DATE + INTERVAL '90 days') THEN 100
      -- Products without expiration date
      ELSE 100
    END AS expiration_score
  FROM 
    "produk" p
  WHERE 
    p.deleted_at IS NULL
    AND p.tanggal_kadaluarsa IS NOT NULL
),

-- Calculate movement health (turnover)
movement_health AS (
  SELECT
    p.cabang_id,
    p.id AS produk_id,
    -- Count movements in the last 90 days
    COUNT(im.id) AS movement_count_90d,
    -- Calculate movement health on scale of 0-100
    CASE
      -- No movement in 90 days is bad for non-seasonal items
      WHEN COUNT(im.id) = 0 THEN 
        CASE 
          WHEN pm.is_seasonal = true THEN 75  -- Less penalty for seasonal items
          ELSE 25                            -- Major penalty for regular items
        END
      -- Low movement (1-5 in 90 days)
      WHEN COUNT(im.id) BETWEEN 1 AND 5 THEN 50
      -- Moderate movement (6-20 in 90 days)
      WHEN COUNT(im.id) BETWEEN 6 AND 20 THEN 75
      -- High movement (>20 in 90 days)
      ELSE 100
    END AS movement_score
  FROM 
    "produk" p
    JOIN "produk_master" pm ON p.produk_master_id = pm.id
    LEFT JOIN "inventory_movement" im ON p.id = im.produk_id 
      AND im.created_at >= (CURRENT_DATE - INTERVAL '90 days')
  WHERE 
    p.deleted_at IS NULL
  GROUP BY 
    p.cabang_id, p.id, pm.is_seasonal
),

-- Calculate financial health
financial_health AS (
  SELECT
    p.cabang_id,
    p.id AS produk_id,
    p.harga_beli,
    p.stok,
    (p.harga_beli * p.stok) AS inventory_value,
    COALESCE(SUM(td.subtotal), 0) AS sales_90d,
    -- Calculate financial health on scale of 0-100
    CASE
      -- No sales but has inventory value
      WHEN COALESCE(SUM(td.subtotal), 0) = 0 AND (p.harga_beli * p.stok) > 0 THEN 25
      -- Low sales relative to inventory value
      WHEN COALESCE(SUM(td.subtotal), 0) < (p.harga_beli * p.stok * 0.5) AND (p.harga_beli * p.stok) > 0 THEN 50
      -- Moderate sales relative to inventory value
      WHEN COALESCE(SUM(td.subtotal), 0) < (p.harga_beli * p.stok * 2) AND (p.harga_beli * p.stok) > 0 THEN 75
      -- High sales relative to inventory value
      WHEN COALESCE(SUM(td.subtotal), 0) >= (p.harga_beli * p.stok * 2) AND (p.harga_beli * p.stok) > 0 THEN 100
      -- No inventory value (unusual case)
      ELSE 50
    END AS financial_score
  FROM 
    "produk" p
    LEFT JOIN "transaksi_detail" td ON p.id = td.produk_id
    LEFT JOIN "transaksi" t ON td.transaksi_id = t.id 
      AND t.tanggal >= (CURRENT_DATE - INTERVAL '90 days')
      AND t.status_transaksi = 'SELESAI'
  WHERE 
    p.deleted_at IS NULL
  GROUP BY 
    p.cabang_id, p.id, p.harga_beli, p.stok
)

-- Combine all health dimensions and calculate overall score
SELECT
  c.id AS cabang_id,
  c.nama_cabang,
  p.id AS produk_id,
  pm.id AS produk_master_id,
  pm.nama_produk,
  pm.sku,
  p.stok,
  p.stok_minimum,
  p.stok_maksimum,
  p.tanggal_kadaluarsa,
  COALESCE(slh.stock_level_score, 50) AS stock_level_score,
  COALESCE(eh.expiration_score, 100) AS expiration_score,
  COALESCE(mh.movement_score, 50) AS movement_score,
  COALESCE(fh.financial_score, 50) AS financial_score,
  
  -- Calculate weighted overall score
  ROUND(
    (
      COALESCE(slh.stock_level_score, 50) * 0.30 +  -- 30% weight for stock levels
      COALESCE(eh.expiration_score, 100) * 0.25 +   -- 25% weight for expiration
      COALESCE(mh.movement_score, 50) * 0.25 +      -- 25% weight for movement
      COALESCE(fh.financial_score, 50) * 0.20       -- 20% weight for financial health
    )::numeric, 
    1
  ) AS overall_health_score,
  
  -- Provide a textual health status
  CASE
    WHEN (
      COALESCE(slh.stock_level_score, 50) * 0.30 +
      COALESCE(eh.expiration_score, 100) * 0.25 +
      COALESCE(mh.movement_score, 50) * 0.25 +
      COALESCE(fh.financial_score, 50) * 0.20
    ) >= 80 THEN 'Excellent'
    WHEN (
      COALESCE(slh.stock_level_score, 50) * 0.30 +
      COALESCE(eh.expiration_score, 100) * 0.25 +
      COALESCE(mh.movement_score, 50) * 0.25 +
      COALESCE(fh.financial_score, 50) * 0.20
    ) >= 60 THEN 'Good'
    WHEN (
      COALESCE(slh.stock_level_score, 50) * 0.30 +
      COALESCE(eh.expiration_score, 100) * 0.25 +
      COALESCE(mh.movement_score, 50) * 0.25 +
      COALESCE(fh.financial_score, 50) * 0.20
    ) >= 40 THEN 'Fair'
    ELSE 'Poor'
  END AS health_status
FROM 
  "produk" p
  JOIN "produk_master" pm ON p.produk_master_id = pm.id
  JOIN "cabang" c ON p.cabang_id = c.id
  LEFT JOIN stock_level_health slh ON p.id = slh.produk_id
  LEFT JOIN expiration_health eh ON p.id = eh.produk_id
  LEFT JOIN movement_health mh ON p.id = mh.produk_id
  LEFT JOIN financial_health fh ON p.id = fh.produk_id
WHERE 
  p.deleted_at IS NULL
  AND pm.deleted_at IS NULL
  AND c.deleted_at IS NULL;

-- Create an additional aggregate view to get branch-level health scores
CREATE OR REPLACE VIEW view_branch_inventory_health_score AS
SELECT
  cabang_id,
  nama_cabang,
  COUNT(produk_id) AS total_products,
  ROUND(AVG(stock_level_score)::numeric, 1) AS avg_stock_level_score,
  ROUND(AVG(expiration_score)::numeric, 1) AS avg_expiration_score,
  ROUND(AVG(movement_score)::numeric, 1) AS avg_movement_score,
  ROUND(AVG(financial_score)::numeric, 1) AS avg_financial_score,
  ROUND(AVG(overall_health_score)::numeric, 1) AS avg_overall_health_score,
  
  -- Branch-level health status
  CASE
    WHEN AVG(overall_health_score) >= 80 THEN 'Excellent'
    WHEN AVG(overall_health_score) >= 60 THEN 'Good'
    WHEN AVG(overall_health_score) >= 40 THEN 'Fair'
    ELSE 'Poor'
  END AS branch_health_status,
  
  -- Products needing attention (count of products with poor health)
  SUM(CASE WHEN overall_health_score < 40 THEN 1 ELSE 0 END) AS products_needing_attention,
  
  -- Percentage of healthy products
  ROUND(
    (SUM(CASE WHEN overall_health_score >= 60 THEN 1 ELSE 0 END)::float / 
     COUNT(produk_id)::float * 100)::numeric, 
    1
  ) AS healthy_products_percentage
FROM 
  view_inventory_health_score
GROUP BY 
  cabang_id, nama_cabang;

















  