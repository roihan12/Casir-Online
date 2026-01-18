-- Create or replace the view for stock transfer dashboard statistics
CREATE OR REPLACE VIEW stock_transfer_stats AS
WITH transfer_counts AS (
    SELECT 
        cabang_asal_id,
        COUNT(*) FILTER (WHERE status = 'draft') AS draft_count,
        COUNT(*) FILTER (WHERE status = 'pending_approval') AS pending_approval_count,
        COUNT(*) FILTER (WHERE status = 'approved' AND tanggal_kirim IS NULL) AS approved_pending_shipment,
        COUNT(*) FILTER (WHERE status = 'shipped' AND tanggal_terima IS NULL) AS in_transit_count,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
        COUNT(*) AS total_transfers
    FROM stock_transfer
    GROUP BY cabang_asal_id
),
transfer_items AS (
    SELECT 
        st.cabang_asal_id,
        COUNT(DISTINCT std.produk_id) AS unique_products_transferred,
        SUM(std.jumlah_kirim) AS total_items_transferred,
        COUNT(DISTINCT st.cabang_tujuan_id) AS unique_destinations
    FROM stock_transfer st
    JOIN stock_transfer_detail std ON st.id = std.transfer_id
    WHERE st.status != 'draft' AND st.status != 'rejected'
    GROUP BY st.cabang_asal_id
),
recent_transfers AS (
    SELECT 
        cabang_asal_id,
        json_agg(
            json_build_object(
                'transfer_id', id,
                'nomor_transfer', nomor_transfer,
                'status', status,
                'tanggal_kirim', tanggal_kirim,
                'tanggal_terima', tanggal_terima,
                'cabang_tujuan_id', cabang_tujuan_id,
                'cabang_tujuan', (SELECT nama_cabang FROM cabang WHERE id = cabang_tujuan_id)
            )
            ORDER BY created_at DESC
            LIMIT 5
        ) AS recent_transfers
    FROM stock_transfer
    WHERE status IN ('shipped', 'completed')
    GROUP BY cabang_asal_id
)
SELECT 
    c.id AS cabang_id,
    c.nama_cabang,
    COALESCE(tc.draft_count, 0) AS draft_count,
    COALESCE(tc.pending_approval_count, 0) AS pending_approval_count,
    COALESCE(tc.approved_pending_shipment, 0) AS approved_pending_shipment,
    COALESCE(tc.in_transit_count, 0) AS in_transit_count,
    COALESCE(tc.completed_count, 0) AS completed_count,
    COALESCE(tc.rejected_count, 0) AS rejected_count,
    COALESCE(tc.total_transfers, 0) AS total_transfers,
    COALESCE(ti.unique_products_transferred, 0) AS unique_products_transferred,
    COALESCE(ti.total_items_transferred, 0) AS total_items_transferred,
    COALESCE(ti.unique_destinations, 0) AS unique_destinations,
    COALESCE(rt.recent_transfers, '[]'::json) AS recent_transfers,
    (
        SELECT json_build_object(
            'top_product', (
                SELECT p.nama_produk 
                FROM stock_transfer_detail std
                JOIN produk p ON std.produk_id = p.id
                JOIN stock_transfer st ON std.transfer_id = st.id
                WHERE st.cabang_asal_id = c.id
                AND st.status = 'completed'
                GROUP BY p.id, p.nama_produk
                ORDER BY SUM(std.jumlah_kirim) DESC
                LIMIT 1
            ),
            'top_destination', (
                SELECT cb.nama_cabang
                FROM stock_transfer st2
                JOIN cabang cb ON st2.cabang_tujuan_id = cb.id
                WHERE st2.cabang_asal_id = c.id
                AND st2.status = 'completed'
                GROUP BY st2.cabang_tujuan_id, cb.nama_cabang
                ORDER BY COUNT(*) DESC
                LIMIT 1
            )
        )
    ) AS insights
FROM cabang c
LEFT JOIN transfer_counts tc ON c.id = tc.cabang_asal_id
LEFT JOIN transfer_items ti ON c.id = ti.cabang_asal_id
LEFT JOIN recent_transfers rt ON c.id = rt.cabang_asal_id
WHERE c.deleted_at IS NULL;

-- Add a comment to document the view
COMMENT ON VIEW stock_transfer_stats IS 'Provides comprehensive statistics for the stock transfer dashboard, including transfer counts by status, item metrics, recent transfers, and insights.';
