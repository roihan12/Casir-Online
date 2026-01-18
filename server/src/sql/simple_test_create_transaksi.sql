-- public.inventory_dashboard_view source

CREATE MATERIALIZED VIEW public.inventory_dashboard_view
TABLESPACE pg_default
AS WITH inventory_summary AS (
         SELECT p.cabang_id,
            count(p.produk_id) AS total_products,
            count(
                CASE
                    WHEN p.stok <= p.min_stok AND p.stok > 0 THEN 1
                    ELSE NULL::integer
                END) AS low_stock_count,
            count(
                CASE
                    WHEN p.stok = 0 THEN 1
                    ELSE NULL::integer
                END) AS out_of_stock_count,
            sum(p.stok) AS total_stock,
            sum(p.harga_beli * p.stok::numeric) AS total_value
           FROM produk p
          WHERE p.status = 'tersedia'::"ProdukStatus"
          GROUP BY p.cabang_id
        ), stock_movements_30d AS (
         SELECT im.cabang_id,
            count(*) AS movement_count,
            sum(
                CASE
                    WHEN im.quantity > 0 THEN im.quantity
                    ELSE 0
                END) AS stock_in,
            sum(
                CASE
                    WHEN im.quantity < 0 THEN abs(im.quantity)
                    ELSE 0
                END) AS stock_out
           FROM inventory_movement im
          WHERE im.created_at >= (now() - '30 days'::interval)
          GROUP BY im.cabang_id
        ), stock_movements_60d_30d AS (
         SELECT im.cabang_id,
            count(*) AS movement_count,
            sum(
                CASE
                    WHEN im.quantity > 0 THEN im.quantity
                    ELSE 0
                END) AS stock_in,
            sum(
                CASE
                    WHEN im.quantity < 0 THEN abs(im.quantity)
                    ELSE 0
                END) AS stock_out
           FROM inventory_movement im
          WHERE im.created_at >= (now() - '60 days'::interval) AND im.created_at < (now() - '30 days'::interval)
          GROUP BY im.cabang_id
        ), branch_transfers_30d AS (
         SELECT c_1.cabang_id,
            count(DISTINCT st.transfer_id) AS transfer_count,
            count(DISTINCT
                CASE
                    WHEN st.cabang_asal_id = c_1.cabang_id THEN st.cabang_tujuan_id
                    ELSE st.cabang_asal_id
                END) AS branch_count
           FROM cabang c_1
             LEFT JOIN stock_transfer st ON st.cabang_asal_id = c_1.cabang_id OR st.cabang_tujuan_id = c_1.cabang_id
          WHERE st.created_at >= (now() - '30 days'::interval)
          GROUP BY c_1.cabang_id
        ), expiring_products_30d AS (
         SELECT p.cabang_id,
            count(p.produk_id) AS expiring_count
           FROM produk p
          WHERE p.tanggal_kedaluwarsa IS NOT NULL AND p.tanggal_kedaluwarsa <= (now() + '30 days'::interval) AND p.tanggal_kedaluwarsa > now() AND p.status = 'tersedia'::"ProdukStatus"
          GROUP BY p.cabang_id
        )
 SELECT c.cabang_id,
    c.nama_cabang,
    COALESCE(inv_summary.total_products, 0::bigint) AS total_products,
    COALESCE(inv_summary.low_stock_count, 0::bigint) AS low_stock_count,
    COALESCE(inv_summary.out_of_stock_count, 0::bigint) AS out_of_stock_count,
    COALESCE(exp.expiring_count, 0::bigint) AS expiring_soon_count,
    COALESCE(inv_summary.total_stock, 0::bigint) AS total_stock,
    COALESCE(inv_summary.total_value, 0::numeric) AS total_value,
    COALESCE(sm30.movement_count, 0::bigint) AS movement_count_30d,
    COALESCE(sm30.stock_in, 0::bigint) AS stock_in_30d,
    COALESCE(sm30.stock_out, 0::bigint) AS stock_out_30d,
    COALESCE(sm60.movement_count, 0::bigint) AS movement_count_60d_30d,
    COALESCE(sm60.stock_in, 0::bigint) AS stock_in_60d_30d,
    COALESCE(sm60.stock_out, 0::bigint) AS stock_out_60d_30d,
        CASE
            WHEN COALESCE(sm60.movement_count, 0::bigint) = 0 THEN 0::numeric
            ELSE round((COALESCE(sm30.movement_count, 0::bigint) - COALESCE(sm60.movement_count, 0::bigint))::numeric * 100.0 / NULLIF(COALESCE(sm60.movement_count, 0::bigint), 0)::numeric, 2)
        END AS movement_change_pct,
        CASE
            WHEN COALESCE(sm60.stock_in, 0::bigint) = 0 THEN 0::numeric
            ELSE round((COALESCE(sm30.stock_in, 0::bigint) - COALESCE(sm60.stock_in, 0::bigint))::numeric * 100.0 / NULLIF(COALESCE(sm60.stock_in, 0::bigint), 0)::numeric, 2)
        END AS stock_in_change_pct,
        CASE
            WHEN COALESCE(sm60.stock_out, 0::bigint) = 0 THEN 0::numeric
            ELSE round((COALESCE(sm30.stock_out, 0::bigint) - COALESCE(sm60.stock_out, 0::bigint))::numeric * 100.0 / NULLIF(COALESCE(sm60.stock_out, 0::bigint), 0)::numeric, 2)
        END AS stock_out_change_pct,
        CASE
            WHEN (( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.created_at >= (now() - '60 days'::interval) AND p.created_at < (now() - '30 days'::interval))) = 0 THEN 0::numeric
            ELSE round(((( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.created_at >= (now() - '30 days'::interval))) - (( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.created_at >= (now() - '60 days'::interval) AND p.created_at < (now() - '30 days'::interval))))::numeric * 100.0 / NULLIF(( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.created_at >= (now() - '60 days'::interval) AND p.created_at < (now() - '30 days'::interval)), 0)::numeric, 2)
        END AS total_products_change_pct,
        CASE
            WHEN (( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.stok <= p.min_stok AND p.stok > 0 AND p.status = 'tersedia'::"ProdukStatus" AND p.updated_at >= (now() - '60 days'::interval) AND p.updated_at < (now() - '30 days'::interval))) = 0 THEN 0::numeric
            ELSE round((COALESCE(inv_summary.low_stock_count, 0::bigint) - (( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.stok <= p.min_stok AND p.stok > 0 AND p.status = 'tersedia'::"ProdukStatus" AND p.updated_at >= (now() - '60 days'::interval) AND p.updated_at < (now() - '30 days'::interval))))::numeric * 100.0 / NULLIF(( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.stok <= p.min_stok AND p.stok > 0 AND p.status = 'tersedia'::"ProdukStatus" AND p.updated_at >= (now() - '60 days'::interval) AND p.updated_at < (now() - '30 days'::interval)), 0)::numeric, 2)
        END AS low_stock_change_pct,
        CASE
            WHEN (( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.stok = 0 AND p.status = 'tersedia'::"ProdukStatus" AND p.updated_at >= (now() - '60 days'::interval) AND p.updated_at < (now() - '30 days'::interval))) = 0 THEN 0::numeric
            ELSE round((COALESCE(inv_summary.out_of_stock_count, 0::bigint) - (( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.stok = 0 AND p.status = 'tersedia'::"ProdukStatus" AND p.updated_at >= (now() - '60 days'::interval) AND p.updated_at < (now() - '30 days'::interval))))::numeric * 100.0 / NULLIF(( SELECT COALESCE(count(p.produk_id), 0::bigint) AS "coalesce"
               FROM produk p
              WHERE p.cabang_id = c.cabang_id AND p.stok = 0 AND p.status = 'tersedia'::"ProdukStatus" AND p.updated_at >= (now() - '60 days'::interval) AND p.updated_at < (now() - '30 days'::interval)), 0)::numeric, 2)
        END AS out_of_stock_change_pct,
    COALESCE(bt.transfer_count, 0::bigint) AS branch_transfer_count,
    COALESCE(bt.branch_count, 0::bigint) AS branch_count,
    now() AS last_refreshed
   FROM cabang c
     LEFT JOIN inventory_summary inv_summary ON c.cabang_id = inv_summary.cabang_id
     LEFT JOIN stock_movements_30d sm30 ON c.cabang_id = sm30.cabang_id
     LEFT JOIN stock_movements_60d_30d sm60 ON c.cabang_id = sm60.cabang_id
     LEFT JOIN branch_transfers_30d bt ON c.cabang_id = bt.cabang_id
     LEFT JOIN expiring_products_30d exp ON c.cabang_id = exp.cabang_id
  WHERE c.status = 'aktif'::"CabangStatus"
WITH DATA;

-- View indexes:
CREATE UNIQUE INDEX inventory_dashboard_view_cabang_id_idx ON public.inventory_dashboard_view USING btree (cabang_id);