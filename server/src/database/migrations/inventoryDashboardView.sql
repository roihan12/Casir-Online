-- Create materialized view for inventory dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS inventory_dashboard_view AS
WITH inventory_summary AS (
  SELECT
    p.cabang_id,
    COUNT(p.produk_id) AS total_products,
    COUNT(CASE WHEN p.stok <= p.min_stok AND p.stok > 0 THEN 1 END) AS low_stock_count,
    COUNT(CASE WHEN p.stok = 0 THEN 1 END) AS out_of_stock_count,
    SUM(p.stok) AS total_stock,
    SUM(p.harga_beli * p.stok) AS total_value
  FROM
    produk p
  WHERE
    p.status = 'tersedia'
  GROUP BY
    p.cabang_id
),
stock_movements_30d AS (
  SELECT
    im.cabang_id,
    COUNT(*) AS movement_count,
    SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS stock_in,
    SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS stock_out
  FROM
    inventory_movement im
  WHERE
    im.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY
    im.cabang_id
),
stock_movements_60d_30d AS (
  SELECT
    im.cabang_id,
    COUNT(*) AS movement_count,
    SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END) AS stock_in,
    SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END) AS stock_out
  FROM
    inventory_movement im
  WHERE
    im.created_at >= NOW() - INTERVAL '60 days' AND
    im.created_at < NOW() - INTERVAL '30 days'
  GROUP BY
    im.cabang_id
),
branch_transfers_30d AS (
  SELECT
    c.cabang_id,
    COUNT(DISTINCT st.transfer_id) AS transfer_count,
    COUNT(DISTINCT CASE WHEN st.cabang_asal_id = c.cabang_id THEN st.cabang_tujuan_id ELSE st.cabang_asal_id END) AS branch_count
  FROM
    cabang c
  LEFT JOIN
    stock_transfer st ON (st.cabang_asal_id = c.cabang_id OR st.cabang_tujuan_id = c.cabang_id)
  WHERE
    st.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY
    c.cabang_id
)
SELECT
  c.cabang_id,
  c.nama_cabang,
  COALESCE(is.total_products, 0) AS total_products,
  COALESCE(is.low_stock_count, 0) AS low_stock_count,
  COALESCE(is.out_of_stock_count, 0) AS out_of_stock_count,
  COALESCE(is.total_stock, 0) AS total_stock,
  COALESCE(is.total_value, 0) AS total_value,
  COALESCE(sm30.movement_count, 0) AS movement_count_30d,
  COALESCE(sm30.stock_in, 0) AS stock_in_30d,
  COALESCE(sm30.stock_out, 0) AS stock_out_30d,
  COALESCE(sm60.movement_count, 0) AS movement_count_60d_30d,
  COALESCE(sm60.stock_in, 0) AS stock_in_60d_30d,
  COALESCE(sm60.stock_out, 0) AS stock_out_60d_30d,
  CASE
    WHEN COALESCE(sm60.movement_count, 0) = 0 THEN 0
    ELSE ROUND(((COALESCE(sm30.movement_count, 0) - COALESCE(sm60.movement_count, 0)) * 100.0 / NULLIF(COALESCE(sm60.movement_count, 0), 0))::numeric, 2)
  END AS movement_change_pct,
  CASE
    WHEN COALESCE(sm60.stock_in, 0) = 0 THEN 0
    ELSE ROUND(((COALESCE(sm30.stock_in, 0) - COALESCE(sm60.stock_in, 0)) * 100.0 / NULLIF(COALESCE(sm60.stock_in, 0), 0))::numeric, 2)
  END AS stock_in_change_pct,
  CASE
    WHEN COALESCE(sm60.stock_out, 0) = 0 THEN 0
    ELSE ROUND(((COALESCE(sm30.stock_out, 0) - COALESCE(sm60.stock_out, 0)) * 100.0 / NULLIF(COALESCE(sm60.stock_out, 0), 0))::numeric, 2)
  END AS stock_out_change_pct,
  COALESCE(bt.transfer_count, 0) AS branch_transfer_count,
  COALESCE(bt.branch_count, 0) AS branch_count,
  NOW() AS last_refreshed
FROM
  cabang c
LEFT JOIN
  inventory_summary is ON c.cabang_id = is.cabang_id
LEFT JOIN
  stock_movements_30d sm30 ON c.cabang_id = sm30.cabang_id
LEFT JOIN
  stock_movements_60d_30d sm60 ON c.cabang_id = sm60.cabang_id
LEFT JOIN
  branch_transfers_30d bt ON c.cabang_id = bt.cabang_id
WHERE
  c.status = 'aktif';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_inventory_dashboard_cabang_id ON inventory_dashboard_view (cabang_id);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_inventory_dashboard_view()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY inventory_dashboard_view;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh the view when relevant tables are modified
DROP TRIGGER IF EXISTS refresh_inventory_dashboard_produk ON produk;
CREATE TRIGGER refresh_inventory_dashboard_produk
AFTER INSERT OR UPDATE OR DELETE ON produk
FOR EACH STATEMENT EXECUTE FUNCTION refresh_inventory_dashboard_view();

DROP TRIGGER IF EXISTS refresh_inventory_dashboard_inventory_movement ON inventory_movement;
CREATE TRIGGER refresh_inventory_dashboard_inventory_movement
AFTER INSERT OR UPDATE OR DELETE ON inventory_movement
FOR EACH STATEMENT EXECUTE FUNCTION refresh_inventory_dashboard_view();

DROP TRIGGER IF EXISTS refresh_inventory_dashboard_stock_transfer ON stock_transfer;
CREATE TRIGGER refresh_inventory_dashboard_stock_transfer
AFTER INSERT OR UPDATE OR DELETE ON stock_transfer
FOR EACH STATEMENT EXECUTE FUNCTION refresh_inventory_dashboard_view();
