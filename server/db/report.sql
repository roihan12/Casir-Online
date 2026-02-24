-- Standard Parameters
p_cabang_id VARCHAR DEFAULT NULL     -- NULL = semua cabang (consolidated)
p_tanggal_mulai DATE
p_tanggal_akhir DATE
p_page INTEGER DEFAULT 1
p_limit INTEGER DEFAULT 50

-- Standard Return
RETURNS JSONB
{
    "data": [...],          -- Row data
    "summary": {...},       -- Totals/aggregates
    "meta": {               -- Pagination & filter info
        "total_rows": 100,
        "page": 1,
        "limit": 50,
        "total_pages": 2,
        "cabang_mode": "CONSOLIDATED/PER_BRANCH",
        "period": "2025-01-01 to 2025-01-31"
    }
}






CREATE OR REPLACE FUNCTION fn_report_daily_sales(
    p_tanggal_mulai DATE,
    p_tanggal_akhir DATE,
    p_cabang_id VARCHAR DEFAULT NULL,
    p_shift_id VARCHAR DEFAULT NULL,
    p_user_id VARCHAR DEFAULT NULL,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
    v_offset INTEGER;
    v_total_rows INTEGER;
    v_data JSONB;
    v_summary JSONB;
    v_cabang_mode VARCHAR;
BEGIN
    v_offset := (p_page - 1) * p_limit;
    v_cabang_mode := CASE WHEN p_cabang_id IS NULL THEN 'CONSOLIDATED' ELSE 'PER_BRANCH' END;

    -- ============================================
    -- MAIN DATA: Per hari per cabang
    -- ============================================
    WITH daily_sales AS (
        SELECT
            DATE(t.tanggal) AS tanggal,
            c.cabang_id,
            c.nama_cabang,
            -- Transaction counts
            COUNT(t.transaksi_id) AS total_transaksi,
            COUNT(DISTINCT t.pelanggan_id) AS total_pelanggan,
            -- Revenue
            SUM(t.subtotal) AS gross_sales,
            SUM(t.total_diskon_final) AS total_diskon,
            SUM(t.pajak) AS total_pajak,
            SUM(t.biaya_tambahan) AS total_biaya_tambahan,
            SUM(t.total) AS net_sales,
            -- Averages
            ROUND(AVG(t.total), 2) AS avg_transaction_value,
            -- Payment status
            COUNT(CASE WHEN t.status_pembayaran = 'LUNAS' THEN 1 END) AS total_lunas,
            COUNT(CASE WHEN t.status_pembayaran = 'BELUM_LUNAS' THEN 1 END) AS total_belum_lunas,
            -- By type
            SUM(CASE WHEN t.jenis_transaksi = 'PENJUALAN' THEN t.total ELSE 0 END) AS total_penjualan,
            SUM(CASE WHEN t.jenis_transaksi = 'RETUR_PENJUALAN' THEN t.total ELSE 0 END) AS total_retur
        FROM transaksi t
        JOIN cabang c ON t.cabang_id = c.cabang_id
        WHERE DATE(t.tanggal) BETWEEN p_tanggal_mulai AND p_tanggal_akhir
        AND t.jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN')
        AND (p_cabang_id IS NULL OR t.cabang_id = p_cabang_id)
        AND (p_shift_id IS NULL OR t.shift_id = p_shift_id)
        AND (p_user_id IS NULL OR t.created_by_user_id = p_user_id)
        GROUP BY DATE(t.tanggal), c.cabang_id, c.nama_cabang
    ),

    -- Top products per day (top 3 per day)
    top_products AS (
        SELECT
            DATE(t.tanggal) AS tanggal,
            t.cabang_id,
            jsonb_agg(
                jsonb_build_object(
                    'produk', pm.nama_produk,
                    'qty', total_qty,
                    'revenue', total_revenue
                ) ORDER BY total_revenue DESC
            ) FILTER (WHERE rn <= 3) AS top_products
        FROM (
            SELECT
                t.tanggal,
                t.cabang_id,
                pm.nama_produk,
                SUM(td.jumlah) AS total_qty,
                SUM(td.total) AS total_revenue,
                ROW_NUMBER() OVER (
                    PARTITION BY DATE(t.tanggal), t.cabang_id 
                    ORDER BY SUM(td.total) DESC
                ) AS rn
            FROM transaksi t
            JOIN transaksi_detail td ON t.transaksi_id = td.transaksi_id
            JOIN produk p ON td.produk_id = p.produk_id
            JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
            WHERE DATE(t.tanggal) BETWEEN p_tanggal_mulai AND p_tanggal_akhir
            AND t.jenis_transaksi = 'PENJUALAN'
            AND (p_cabang_id IS NULL OR t.cabang_id = p_cabang_id)
            GROUP BY DATE(t.tanggal), t.cabang_id, pm.nama_produk
        ) t
        GROUP BY DATE(t.tanggal), t.cabang_id
    ),

    -- Payment method breakdown per day
    payment_breakdown AS (
        SELECT
            DATE(t.tanggal) AS tanggal,
            t.cabang_id,
            jsonb_object_agg(
                COALESCE(t.metode_pembayaran, 'UNKNOWN'),
                total_per_method
            ) AS payment_methods
        FROM (
            SELECT
                DATE(t.tanggal) AS tanggal,
                t.cabang_id,
                t.metode_pembayaran,
                SUM(t.total) AS total_per_method
            FROM transaksi t
            WHERE DATE(t.tanggal) BETWEEN p_tanggal_mulai AND p_tanggal_akhir
            AND t.jenis_transaksi = 'PENJUALAN'
            AND t.status_pembayaran = 'LUNAS'
            AND (p_cabang_id IS NULL OR t.cabang_id = p_cabang_id)
            GROUP BY DATE(t.tanggal), t.cabang_id, t.metode_pembayaran
        ) t
        GROUP BY DATE(t.tanggal), t.cabang_id
    ),

    -- Pagination
    counted AS (
        SELECT COUNT(*) AS total FROM daily_sales
    ),

    paginated AS (
        SELECT ds.*,
            tp.top_products,
            pb.payment_methods
        FROM daily_sales ds
        LEFT JOIN top_products tp ON ds.tanggal = tp.tanggal AND ds.cabang_id = tp.cabang_id
        LEFT JOIN payment_breakdown pb ON ds.tanggal = pb.tanggal AND ds.cabang_id = pb.cabang_id
        ORDER BY ds.tanggal DESC, ds.cabang_id
        LIMIT p_limit OFFSET v_offset
    )

    SELECT
        jsonb_build_object(
            'data', COALESCE(jsonb_agg(
                jsonb_build_object(
                    'tanggal', p.tanggal,
                    'cabang_id', p.cabang_id,
                    'nama_cabang', p.nama_cabang,
                    'total_transaksi', p.total_transaksi,
                    'total_pelanggan', p.total_pelanggan,
                    'gross_sales', p.gross_sales,
                    'total_diskon', p.total_diskon,
                    'total_pajak', p.total_pajak,
                    'net_sales', p.net_sales,
                    'avg_transaction_value', p.avg_transaction_value,
                    'total_lunas', p.total_lunas,
                    'total_belum_lunas', p.total_belum_lunas,
                    'total_penjualan', p.total_penjualan,
                    'total_retur', p.total_retur,
                    'top_products', COALESCE(p.top_products, '[]'),
                    'payment_methods', COALESCE(p.payment_methods, '{}')
                )
            ), '[]'),
            'total_rows', (SELECT total FROM counted)
        )
    INTO v_data
    FROM paginated p;

    -- ============================================
    -- SUMMARY
    -- ============================================
    SELECT jsonb_build_object(
        'total_transaksi', COUNT(t.transaksi_id),
        'total_pelanggan', COUNT(DISTINCT t.pelanggan_id),
        'gross_sales', SUM(t.subtotal),
        'total_diskon', SUM(t.total_diskon_final),
        'total_pajak', SUM(t.pajak),
        'net_sales', SUM(t.total),
        'avg_transaction_value', ROUND(AVG(t.total), 2),
        'total_lunas', COUNT(CASE WHEN t.status_pembayaran = 'LUNAS' THEN 1 END),
        'total_belum_lunas', COUNT(CASE WHEN t.status_pembayaran = 'BELUM_LUNAS' THEN 1 END),
        'best_day', (
            SELECT DATE(t2.tanggal)
            FROM transaksi t2
            WHERE DATE(t2.tanggal) BETWEEN p_tanggal_mulai AND p_tanggal_akhir
            AND t2.jenis_transaksi = 'PENJUALAN'
            AND (p_cabang_id IS NULL OR t2.cabang_id = p_cabang_id)
            GROUP BY DATE(t2.tanggal)
            ORDER BY SUM(t2.total) DESC
            LIMIT 1
        )
    )
    INTO v_summary
    FROM transaksi t
    WHERE DATE(t.tanggal) BETWEEN p_tanggal_mulai AND p_tanggal_akhir
    AND t.jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN')
    AND (p_cabang_id IS NULL OR t.cabang_id = p_cabang_id);

    RETURN jsonb_build_object(
        'data', v_data->'data',
        'summary', v_summary,
        'meta', jsonb_build_object(
            'total_rows', (v_data->>'total_rows')::INTEGER,
            'page', p_page,
            'limit', p_limit,
            'total_pages', CEIL((v_data->>'total_rows')::DECIMAL / p_limit),
            'cabang_mode', v_cabang_mode,
            'period', format('%s to %s', p_tanggal_mulai, p_tanggal_akhir)
        )
    );
END;
$function$;










CREATE OR REPLACE FUNCTION fn_report_stock_movement(
    p_tanggal_mulai DATE,
    p_tanggal_akhir DATE,
    p_cabang_id VARCHAR DEFAULT NULL,
    p_kategori_id VARCHAR DEFAULT NULL,
    p_produk_master_id VARCHAR DEFAULT NULL,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
    v_offset INTEGER;
    v_data JSONB;
    v_summary JSONB;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    WITH stock_movement AS (
        SELECT
            p.produk_id,
            pm.produk_master_id,
            pm.nama_produk,
            pm.sku,
            k.nama_kategori,
            c.cabang_id,
            c.nama_cabang,
            -- Opening stock (stock at start of period)
            (
                SELECT COALESCE(p2.stok, 0) +
                    COALESCE(SUM(
                        CASE
                            WHEN im2.quantity > 0 THEN -im2.quantity
                            ELSE ABS(im2.quantity)
                        END
                    ), 0)
                FROM produk p2
                LEFT JOIN inventory_movement im2 ON p2.produk_id = im2.produk_id
                    AND im2.created_at::DATE >= p_tanggal_mulai
                    AND im2.created_at::DATE <= p_tanggal_akhir
                WHERE p2.produk_id = p.produk_id
                GROUP BY p2.stok
            ) AS opening_stock,
            -- Pembelian (IN)
            COALESCE(SUM(
                CASE WHEN im.reference_type = 'pembelian' THEN im.quantity ELSE 0 END
            ), 0) AS total_pembelian,
            -- Penjualan (OUT)
            COALESCE(ABS(SUM(
                CASE WHEN im.reference_type = 'penjualan' THEN im.quantity ELSE 0 END
            )), 0) AS total_penjualan,
            -- Retur masuk (IN)
            COALESCE(SUM(
                CASE WHEN im.reference_type = 'retur' AND im.quantity > 0 THEN im.quantity ELSE 0 END
            ), 0) AS total_retur_masuk,
            -- Retur keluar (OUT)
            COALESCE(ABS(SUM(
                CASE WHEN im.reference_type = 'retur' AND im.quantity < 0 THEN im.quantity ELSE 0 END
            )), 0) AS total_retur_keluar,
            -- Closing stock (current)
            p.stok AS closing_stock,
            -- Values
            p.harga_beli,
            p.harga_jual,
            (p.stok * p.harga_beli) AS stock_value_at_cost,
            (p.stok * p.harga_jual) AS stock_value_at_sell
        FROM produk p
        JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
        JOIN kategori k ON pm.kategori_id = k.kategori_id
        JOIN cabang c ON p.cabang_id = c.cabang_id
        LEFT JOIN inventory_movement im ON p.produk_id = im.produk_id
            AND im.created_at::DATE BETWEEN p_tanggal_mulai AND p_tanggal_akhir
        WHERE (p_cabang_id IS NULL OR p.cabang_id = p_cabang_id)
        AND (p_kategori_id IS NULL OR pm.kategori_id = p_kategori_id)
        AND (p_produk_master_id IS NULL OR pm.produk_master_id = p_produk_master_id)
        GROUP BY p.produk_id, pm.produk_master_id, pm.nama_produk, pm.sku,
                 k.nama_kategori, c.cabang_id, c.nama_cabang,
                 p.stok, p.harga_beli, p.harga_jual
    ),

    counted AS (SELECT COUNT(*) AS total FROM stock_movement)

    SELECT jsonb_build_object(
        'data', COALESCE(jsonb_agg(
            jsonb_build_object(
                'produk_id', sm.produk_id,
                'nama_produk', sm.nama_produk,
                'sku', sm.sku,
                'kategori', sm.nama_kategori,
                'cabang', sm.nama_cabang,
                'opening_stock', sm.opening_stock,
                'total_pembelian', sm.total_pembelian,
                'total_retur_masuk', sm.total_retur_masuk,
                'total_penjualan', sm.total_penjualan,
                'total_retur_keluar', sm.total_retur_keluar,
                'closing_stock', sm.closing_stock,
                'harga_beli', sm.harga_beli,
                'harga_jual', sm.harga_jual,
                'stock_value_at_cost', sm.stock_value_at_cost,
                'stock_value_at_sell', sm.stock_value_at_sell
            ) ORDER BY sm.nama_cabang, sm.nama_kategori, sm.nama_produk
        ), '[]'),
        'total_rows', (SELECT total FROM counted)
    )
    INTO v_data
    FROM (
        SELECT * FROM stock_movement
        ORDER BY nama_cabang, nama_kategori, nama_produk
        LIMIT p_limit OFFSET v_offset
    ) sm;

    -- Summary
    SELECT jsonb_build_object(
        'total_produk', COUNT(*),
        'total_pembelian_value', SUM(sm.total_pembelian * sm.harga_beli),
        'total_penjualan_value', SUM(sm.total_penjualan * sm.harga_jual),
        'total_stock_value_at_cost', SUM(sm.stock_value_at_cost),
        'total_stock_value_at_sell', SUM(sm.stock_value_at_sell),
        'potential_profit', SUM(sm.stock_value_at_sell - sm.stock_value_at_cost)
    )
    INTO v_summary
    FROM stock_movement sm;

    RETURN jsonb_build_object(
        'data', v_data->'data',
        'summary', v_summary,
        'meta', jsonb_build_object(
            'total_rows', (v_data->>'total_rows')::INTEGER,
            'page', p_page,
            'limit', p_limit,
            'total_pages', CEIL((v_data->>'total_rows')::DECIMAL / p_limit),
            'cabang_mode', CASE WHEN p_cabang_id IS NULL THEN 'CONSOLIDATED' ELSE 'PER_BRANCH' END,
            'period', format('%s to %s', p_tanggal_mulai, p_tanggal_akhir)
        )
    );
END;
$function$;








CREATE OR REPLACE FUNCTION fn_report_shift(
    p_tanggal_mulai DATE,
    p_tanggal_akhir DATE,
    p_cabang_id VARCHAR DEFAULT NULL,
    p_user_id VARCHAR DEFAULT NULL,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
    v_offset INTEGER;
    v_data JSONB;
    v_summary JSONB;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    WITH shift_data AS (
        SELECT
            s.shift_id,
            s.nama_shift,
            s.tanggal_buka,
            s.tanggal_tutup,
            s.status,
            c.nama_cabang,
            u.name AS nama_kasir,
            -- Duration
            EXTRACT(EPOCH FROM (
                COALESCE(s.tanggal_tutup, NOW()) - s.tanggal_buka
            )) / 3600 AS durasi_jam,
            -- Cash
            s.modal_awal,
            s.total_pendapatan,
            -- Transaksi stats
            s.total_transaksi,
            -- Breakdown per payment method
            COALESCE((
                SELECT jsonb_object_agg(
                    t.metode_pembayaran,
                    SUM(t.total)
                )
                FROM transaksi t
                WHERE t.shift_id = s.shift_id
                AND t.status_pembayaran = 'LUNAS'
                AND t.jenis_transaksi = 'PENJUALAN'
                GROUP BY t.shift_id
            ), '{}') AS payment_breakdown,
            -- Discounts given in shift
            COALESCE((
                SELECT SUM(t.total_diskon_final)
                FROM transaksi t
                WHERE t.shift_id = s.shift_id
            ), 0) AS total_diskon,
            -- Returns in shift
            COALESCE((
                SELECT COUNT(*)
                FROM transaksi t
                WHERE t.shift_id = s.shift_id
                AND t.jenis_transaksi = 'RETUR_PENJUALAN'
            ), 0) AS total_retur,
            -- Void transactions
            COALESCE((
                SELECT COUNT(*)
                FROM transaksi t
                WHERE t.shift_id = s.shift_id
                AND t.status_pembayaran = 'DIBATALKAN'
            ), 0) AS total_void,
            -- Expected cash (modal_awal + cash_sales)
            s.modal_awal + COALESCE((
                SELECT SUM(t.total)
                FROM transaksi t
                WHERE t.shift_id = s.shift_id
                AND t.metode_pembayaran IN ('TUNAI', 'CASH')
                AND t.status_pembayaran = 'LUNAS'
            ), 0) AS expected_cash,
            s.total_cash_aktual AS actual_cash
        FROM shift s
        JOIN cabang c ON s.cabang_id = c.cabang_id
        JOIN "user" u ON s.user_id = u.user_id
        WHERE DATE(s.tanggal_buka) BETWEEN p_tanggal_mulai AND p_tanggal_akhir
        AND (p_cabang_id IS NULL OR s.cabang_id = p_cabang_id)
        AND (p_user_id IS NULL OR s.user_id = p_user_id)
    ),

    counted AS (SELECT COUNT(*) AS total FROM shift_data)

    SELECT jsonb_build_object(
        'data', COALESCE(jsonb_agg(
            jsonb_build_object(
                'shift_id', sd.shift_id,
                'nama_shift', sd.nama_shift,
                'nama_kasir', sd.nama_kasir,
                'nama_cabang', sd.nama_cabang,
                'tanggal_buka', sd.tanggal_buka,
                'tanggal_tutup', sd.tanggal_tutup,
                'durasi_jam', ROUND(sd.durasi_jam::DECIMAL, 2),
                'status', sd.status,
                'modal_awal', sd.modal_awal,
                'total_transaksi', sd.total_transaksi,
                'total_pendapatan', sd.total_pendapatan,
                'total_diskon', sd.total_diskon,
                'total_retur', sd.total_retur,
                'total_void', sd.total_void,
                'expected_cash', sd.expected_cash,
                'actual_cash', sd.actual_cash,
                'variance_cash', COALESCE(sd.actual_cash - sd.expected_cash, 0),
                'payment_breakdown', sd.payment_breakdown,
                'avg_transaction', CASE
                    WHEN sd.total_transaksi > 0
                    THEN ROUND(sd.total_pendapatan / sd.total_transaksi, 2)
                    ELSE 0
                END
            ) ORDER BY sd.tanggal_buka DESC
        ), '[]'),
        'total_rows', (SELECT total FROM counted)
    )
    INTO v_data
    FROM (
        SELECT * FROM shift_data
        ORDER BY tanggal_buka DESC
        LIMIT p_limit OFFSET v_offset
    ) sd;

    -- Summary
    SELECT jsonb_build_object(
        'total_shift', COUNT(*),
        'total_transaksi', SUM(sd.total_transaksi),
        'total_pendapatan', SUM(sd.total_pendapatan),
        'total_diskon', SUM(sd.total_diskon),
        'total_retur', SUM(sd.total_retur),
        'avg_pendapatan_per_shift', ROUND(AVG(sd.total_pendapatan), 2),
        'total_variance_cash', SUM(COALESCE(sd.actual_cash - sd.expected_cash, 0)),
        'shift_dengan_selisih', COUNT(
            CASE WHEN ABS(COALESCE(sd.actual_cash - sd.expected_cash, 0)) > 0 THEN 1 END
        )
    )
    INTO v_summary
    FROM shift_data sd;

    RETURN jsonb_build_object(
        'data', v_data->'data',
        'summary', v_summary,
        'meta', jsonb_build_object(
            'total_rows', (v_data->>'total_rows')::INTEGER,
            'page', p_page,
            'limit', p_limit,
            'total_pages', CEIL((v_data->>'total_rows')::DECIMAL / p_limit),
            'cabang_mode', CASE WHEN p_cabang_id IS NULL THEN 'CONSOLIDATED' ELSE 'PER_BRANCH' END,
            'period', format('%s to %s', p_tanggal_mulai, p_tanggal_akhir)
        )
    );
END;
$function$;















CREATE OR REPLACE FUNCTION fn_report_piutang(
    p_cabang_id VARCHAR DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL,  -- 'aktif', 'lunas', 'semua'
    p_pelanggan_id VARCHAR DEFAULT NULL,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
    v_offset INTEGER;
    v_data JSONB;
    v_summary JSONB;
    v_today DATE := CURRENT_DATE;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    WITH piutang_data AS (
        SELECT
            h.hutang_id,
            h.nomor_referensi,
            h.tanggal_hutang,
            h.jatuh_tempo,
            pl.nama AS nama_pelanggan,
            pl.no_hp AS telepon_pelanggan,
            pl.segmen,
            c.nama_cabang,
            h.jumlah_total,
            h.jumlah_bayar,
            h.sisa_hutang,
            h.status_hutang,
            -- Aging
            (v_today - h.jatuh_tempo::DATE) AS days_overdue,
            CASE
                WHEN h.status_hutang = 'lunas' THEN 'LUNAS'
                WHEN v_today <= h.jatuh_tempo::DATE THEN 'CURRENT'
                WHEN (v_today - h.jatuh_tempo::DATE) <= 30 THEN '1-30 HARI'
                WHEN (v_today - h.jatuh_tempo::DATE) <= 60 THEN '31-60 HARI'
                WHEN (v_today - h.jatuh_tempo::DATE) <= 90 THEN '61-90 HARI'
                ELSE '>90 HARI'
            END AS aging_bucket,
            -- Payment history count
            (
                SELECT COUNT(*)
                FROM pembayaran_hutang ph
                WHERE ph.hutang_id = h.hutang_id
            ) AS total_pembayaran,
            -- Last payment date
            (
                SELECT MAX(ph.tanggal_bayar)
                FROM pembayaran_hutang ph
                WHERE ph.hutang_id = h.hutang_id
            ) AS last_payment_date
        FROM hutang h
        JOIN pelanggan pl ON h.pelanggan_id = pl.pelanggan_id
        JOIN cabang c ON h.cabang_id = c.cabang_id
        WHERE h.jenis_hutang = 'pelanggan'
        AND (p_cabang_id IS NULL OR h.cabang_id = p_cabang_id)
        AND (p_pelanggan_id IS NULL OR h.pelanggan_id = p_pelanggan_id)
        AND (
            p_status IS NULL OR
            p_status = 'semua' OR
            h.status_hutang = p_status
        )
    ),

    counted AS (SELECT COUNT(*) AS total FROM piutang_data)

    SELECT jsonb_build_object(
        'data', COALESCE(jsonb_agg(
            jsonb_build_object(
                'hutang_id', pd.hutang_id,
                'nomor_referensi', pd.nomor_referensi,
                'tanggal_hutang', pd.tanggal_hutang,
                'jatuh_tempo', pd.jatuh_tempo,
                'nama_pelanggan', pd.nama_pelanggan,
                'telepon_pelanggan', pd.telepon_pelanggan,
                'segmen', pd.segmen,
                'nama_cabang', pd.nama_cabang,
                'jumlah_total', pd.jumlah_total,
                'jumlah_bayar', pd.jumlah_bayar,
                'sisa_hutang', pd.sisa_hutang,
                'status_hutang', pd.status_hutang,
                'days_overdue', GREATEST(pd.days_overdue, 0),
                'aging_bucket', pd.aging_bucket,
                'total_pembayaran', pd.total_pembayaran,
                'last_payment_date', pd.last_payment_date
            ) ORDER BY pd.days_overdue DESC NULLS LAST
        ), '[]'),
        'total_rows', (SELECT total FROM counted)
    )
    INTO v_data
    FROM (
        SELECT * FROM piutang_data
        ORDER BY days_overdue DESC NULLS LAST
        LIMIT p_limit OFFSET v_offset
    ) pd;

    -- Summary with aging breakdown
    SELECT jsonb_build_object(
        'total_piutang', COUNT(*),
        'total_nilai', SUM(pd.jumlah_total),
        'total_terbayar', SUM(pd.jumlah_bayar),
        'total_outstanding', SUM(pd.sisa_hutang),
        'total_overdue', SUM(
            CASE WHEN pd.status_hutang = 'aktif'
            AND v_today > pd.jatuh_tempo::DATE
            THEN pd.sisa_hutang ELSE 0 END
        ),
        'aging_breakdown', jsonb_build_object(
            'current', SUM(CASE WHEN pd.aging_bucket = 'CURRENT' THEN pd.sisa_hutang ELSE 0 END),
            '1_30_hari', SUM(CASE WHEN pd.aging_bucket = '1-30 HARI' THEN pd.sisa_hutang ELSE 0 END),
            '31_60_hari', SUM(CASE WHEN pd.aging_bucket = '31-60 HARI' THEN pd.sisa_hutang ELSE 0 END),
            '61_90_hari', SUM(CASE WHEN pd.aging_bucket = '61-90 HARI' THEN pd.sisa_hutang ELSE 0 END),
            'over_90_hari', SUM(CASE WHEN pd.aging_bucket = '>90 HARI' THEN pd.sisa_hutang ELSE 0 END)
        ),
        'collection_rate', CASE
            WHEN SUM(pd.jumlah_total) > 0
            THEN ROUND((SUM(pd.jumlah_bayar) / SUM(pd.jumlah_total)) * 100, 2)
            ELSE 0
        END
    )
    INTO v_summary
    FROM piutang_data pd;

    RETURN jsonb_build_object(
        'data', v_data->'data',
        'summary', v_summary,
        'meta', jsonb_build_object(
            'total_rows', (v_data->>'total_rows')::INTEGER,
            'page', p_page,
            'limit', p_limit,
            'total_pages', CEIL((v_data->>'total_rows')::DECIMAL / p_limit),
            'cabang_mode', CASE WHEN p_cabang_id IS NULL THEN 'CONSOLIDATED' ELSE 'PER_BRANCH' END,
            'as_of_date', v_today
        )
    );
END;
$function$;











CREATE OR REPLACE FUNCTION fn_report_payment_method(
    p_tanggal_mulai DATE,
    p_tanggal_akhir DATE,
    p_cabang_id VARCHAR DEFAULT NULL,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
    v_data JSONB;
    v_summary JSONB;
BEGIN
    WITH payment_data AS (
        SELECT
            c.cabang_id,
            c.nama_cabang,
            t.metode_pembayaran,
            COUNT(t.transaksi_id) AS total_transaksi,
            SUM(t.total) AS total_nilai,
            ROUND(AVG(t.total), 2) AS avg_nilai,
            MIN(t.total) AS min_nilai,
            MAX(t.total) AS max_nilai,
            -- Percentage of total
            SUM(t.total) * 100.0 / SUM(SUM(t.total)) OVER (
                PARTITION BY c.cabang_id
            ) AS persen_dari_total
        FROM transaksi t
        JOIN cabang c ON t.cabang_id = c.cabang_id
        WHERE DATE(t.tanggal) BETWEEN p_tanggal_mulai AND p_tanggal_akhir
        AND t.jenis_transaksi = 'PENJUALAN'
        AND t.status_pembayaran = 'LUNAS'
        AND (p_cabang_id IS NULL OR t.cabang_id = p_cabang_id)
        GROUP BY c.cabang_id, c.nama_cabang, t.metode_pembayaran
    ),

    -- Daily trend per payment method
    daily_trend AS (
        SELECT
            t.metode_pembayaran,
            DATE(t.tanggal) AS tanggal,
            SUM(t.total) AS daily_total
        FROM transaksi t
        WHERE DATE(t.tanggal) BETWEEN p_tanggal_mulai AND p_tanggal_akhir
        AND t.jenis_transaksi = 'PENJUALAN'
        AND t.status_pembayaran = 'LUNAS'
        AND (p_cabang_id IS NULL OR t.cabang_id = p_cabang_id)
        GROUP BY t.metode_pembayaran, DATE(t.tanggal)
    )

    SELECT jsonb_build_object(
        'by_cabang', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'cabang_id', pd.cabang_id,
                    'nama_cabang', pd.nama_cabang,
                    'metode_pembayaran', pd.metode_pembayaran,
                    'total_transaksi', pd.total_transaksi,
                    'total_nilai', pd.total_nilai,
                    'avg_nilai', pd.avg_nilai,
                    'min_nilai', pd.min_nilai,
                    'max_nilai', pd.max_nilai,
                    'persen_dari_total', ROUND(pd.persen_dari_total, 2)
                ) ORDER BY pd.nama_cabang, pd.total_nilai DESC
            )
            FROM payment_data pd
            LIMIT p_limit OFFSET (p_page - 1) * p_limit
        ), '[]'),
        'by_method_consolidated', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'metode_pembayaran', pd2.metode_pembayaran,
                    'total_transaksi', SUM(pd2.total_transaksi),
                    'total_nilai', SUM(pd2.total_nilai),
                    'persen_dari_total', ROUND(
                        SUM(pd2.total_nilai) * 100.0 / NULLIF(
                            SUM(SUM(pd2.total_nilai)) OVER (), 0
                        ), 2
                    )
                ) ORDER BY SUM(pd2.total_nilai) DESC
            )
            FROM payment_data pd2
            GROUP BY pd2.metode_pembayaran
        ), '[]')
    )
    INTO v_data;

    -- Summary
    SELECT jsonb_build_object(
        'total_nilai', SUM(t.total),
        'total_transaksi', COUNT(t.transaksi_id),
        'metode_terbanyak', (
            SELECT t2.metode_pembayaran
            FROM transaksi t2
            WHERE DATE(t2.tanggal) BETWEEN p_tanggal_mulai AND p_tanggal_akhir
            AND t2.jenis_transaksi = 'PENJUALAN'
            AND t2.status_pembayaran = 'LUNAS'
            AND (p_cabang_id IS NULL OR t2.cabang_id = p_cabang_id)
            GROUP BY t2.metode_pembayaran
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ),
        'metode_tertinggi_nilai', (
            SELECT t3.metode_pembayaran
            FROM transaksi t3
            WHERE DATE(t3.tanggal) BETWEEN p_tanggal_mulai AND p_tanggal_akhir
            AND t3.jenis_transaksi = 'PENJUALAN'
            AND t3.status_pembayaran = 'LUNAS'
            AND (p_cabang_id IS NULL OR t3.cabang_id = p_cabang_id)
            GROUP BY t3.metode_pembayaran
            ORDER BY SUM(t3.total) DESC
            LIMIT 1
        )
    )
    INTO v_summary
    FROM transaksi t
    WHERE DATE(t.tanggal) BETWEEN p_tanggal_mulai AND p_tanggal_akhir
    AND t.jenis_transaksi = 'PENJUALAN'
    AND t.status_pembayaran = 'LUNAS'
    AND (p_cabang_id IS NULL OR t.cabang_id = p_cabang_id);

    RETURN jsonb_build_object(
        'data', v_data,
        'summary', v_summary,
        'meta', jsonb_build_object(
            'cabang_mode', CASE WHEN p_cabang_id IS NULL THEN 'CONSOLIDATED' ELSE 'PER_BRANCH' END,
            'period', format('%s to %s', p_tanggal_mulai, p_tanggal_akhir)
        )
    );
END;
$function$;



















CREATE OR REPLACE FUNCTION fn_report_profit_loss(
    p_tanggal_mulai DATE,
    p_tanggal_akhir DATE,
    p_cabang_id VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
    v_data JSONB;
BEGIN
    WITH
    -- Revenue
    penjualan AS (
        SELECT
            c.cabang_id,
            c.nama_cabang,
            SUM(t.subtotal) AS gross_sales,
            SUM(CASE WHEN t.jenis_transaksi = 'RETUR_PENJUALAN' THEN t.total ELSE 0 END) AS total_retur,
            SUM(t.total_diskon_final) AS total_diskon,
            SUM(t.pajak) AS total_pajak,
            SUM(CASE WHEN t.jenis_transaksi = 'PENJUALAN' THEN t.total ELSE 0 END)
                - SUM(CASE WHEN t.jenis_transaksi = 'RETUR_PENJUALAN' THEN t.total ELSE 0 END)
                AS net_sales
        FROM transaksi t
        JOIN cabang c ON t.cabang_id = c.cabang_id
        WHERE DATE(t.tanggal) BETWEEN p_tanggal_mulai AND p_tanggal_akhir
        AND t.jenis_transaksi IN ('PENJUALAN', 'RETUR_PENJUALAN')
        AND t.status_pembayaran = 'LUNAS'
        AND (p_cabang_id IS NULL OR t.cabang_id = p_cabang_id)
        GROUP BY c.cabang_id, c.nama_cabang
    ),

    -- COGS (Cost of Goods Sold)
    cogs AS (
        SELECT
            t.cabang_id,
            SUM(td.jumlah * p.harga_beli) AS total_cogs
        FROM transaksi t
        JOIN transaksi_detail td ON t.transaksi_id = td.transaksi_id
        JOIN produk p ON td.produk_id = p.produk_id
        WHERE DATE(t.tanggal) BETWEEN p_tanggal_mulai AND p_tanggal_akhir
        AND t.jenis_transaksi = 'PENJUALAN'
        AND t.status_pembayaran = 'LUNAS'
        AND (p_cabang_id IS NULL OR t.cabang_id = p_cabang_id)
        GROUP BY t.cabang_id
    ),

    -- Final P&L
    pl AS (
        SELECT
            COALESCE(pj.cabang_id, 'ALL') AS cabang_id,
            COALESCE(pj.nama_cabang, 'Semua Cabang') AS nama_cabang,
            COALESCE(pj.gross_sales, 0) AS gross_sales,
            COALESCE(pj.total_retur, 0) AS total_retur,
            COALESCE(pj.total_diskon, 0) AS total_diskon,
            COALESCE(pj.total_pajak, 0) AS total_pajak,
            COALESCE(pj.net_sales, 0) AS net_sales,
            COALESCE(cg.total_cogs, 0) AS cogs,
            COALESCE(pj.net_sales, 0) - COALESCE(cg.total_cogs, 0) AS gross_profit,
            CASE
                WHEN COALESCE(pj.net_sales, 0) > 0
                THEN ROUND(
                    (COALESCE(pj.net_sales, 0) - COALESCE(cg.total_cogs, 0))
                    / pj.net_sales * 100, 2
                )
                ELSE 0
            END AS gross_margin_pct
        FROM penjualan pj
        LEFT JOIN cogs cg ON pj.cabang_id = cg.cabang_id
    )

    SELECT jsonb_build_object(
        'by_cabang', COALESCE(jsonb_agg(
            jsonb_build_object(
                'cabang_id', pl.cabang_id,
                'nama_cabang', pl.nama_cabang,

                'revenue_section', jsonb_build_object(
                    'label', 'PENDAPATAN',
                    'gross_sales', pl.gross_sales,
                    'less_retur', pl.total_retur,
                    'less_diskon', pl.total_diskon,
                    'net_sales', pl.net_sales
                ),

                'cogs_section', jsonb_build_object(
                    'label', 'HARGA POKOK PENJUALAN',
                    'total_cogs', pl.cogs
                ),

                'profit_section', jsonb_build_object(
                    'label', 'LABA KOTOR',
                    'gross_profit', pl.gross_profit,
                    'gross_margin_pct', pl.gross_margin_pct
                ),

                'tax_section', jsonb_build_object(
                    'label', 'PAJAK',
                    'total_pajak', pl.total_pajak
                ),

                'net_profit', pl.gross_profit - pl.total_pajak,
                'net_margin_pct', CASE
                    WHEN pl.net_sales > 0
                    THEN ROUND((pl.gross_profit - pl.total_pajak) / pl.net_sales * 100, 2)
                    ELSE 0
                END
            ) ORDER BY pl.gross_profit DESC
        ), '[]'),

        'consolidated', (
            SELECT jsonb_build_object(
                'gross_sales', SUM(pl2.gross_sales),
                'total_retur', SUM(pl2.total_retur),
                'total_diskon', SUM(pl2.total_diskon),
                'net_sales', SUM(pl2.net_sales),
                'cogs', SUM(pl2.cogs),
                'gross_profit', SUM(pl2.gross_profit),
                'gross_margin_pct', CASE
                    WHEN SUM(pl2.net_sales) > 0
                    THEN ROUND(SUM(pl2.gross_profit) / SUM(pl2.net_sales) * 100, 2)
                    ELSE 0
                END,
                'total_pajak', SUM(pl2.total_pajak),
                'net_profit', SUM(pl2.gross_profit) - SUM(pl2.total_pajak),
                'net_margin_pct', CASE
                    WHEN SUM(pl2.net_sales) > 0
                    THEN ROUND(
                        (SUM(pl2.gross_profit) - SUM(pl2.total_pajak))
                        / SUM(pl2.net_sales) * 100, 2
                    )
                    ELSE 0
                END
            )
            FROM pl pl2
        )
    )
    INTO v_data
    FROM pl;

    RETURN jsonb_build_object(
        'data', v_data,
        'meta', jsonb_build_object(
            'cabang_mode', CASE WHEN p_cabang_id IS NULL THEN 'CONSOLIDATED' ELSE 'PER_BRANCH' END,
            'period', format('%s to %s', p_tanggal_mulai, p_tanggal_akhir)
        )
    );
END;
$function$;




CREATE OR REPLACE FUNCTION fn_report_low_stock(
    p_cabang_id VARCHAR DEFAULT NULL,
    p_kategori_id VARCHAR DEFAULT NULL,
    p_alert_level VARCHAR DEFAULT 'ALL',
    -- 'CRITICAL', 'WARNING', 'WATCH', 'ALL'
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
    v_offset INTEGER;
    v_data JSONB;
    v_summary JSONB;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    WITH low_stock AS (
        SELECT
            p.produk_id,
            pm.produk_master_id,
            pm.nama_produk,
            pm.sku,
            k.nama_kategori,
            c.cabang_id,
            c.nama_cabang,
            p.stok AS current_stock,
            pm.stok_minimum,
            pm.stok_maksimum,
            -- Alert level
            CASE
                WHEN p.stok = 0 THEN 'OUT_OF_STOCK'
                WHEN p.stok <= (pm.stok_minimum * 0.25) THEN 'CRITICAL'
                WHEN p.stok <= (pm.stok_minimum * 0.50) THEN 'WARNING'
                WHEN p.stok <= pm.stok_minimum THEN 'WATCH'
                ELSE 'OK'
            END AS alert_level,
            -- Reorder quantity recommendation
            GREATEST(pm.stok_maksimum - p.stok, 0) AS reorder_qty,
            -- Estimated reorder cost
            GREATEST(pm.stok_maksimum - p.stok, 0) * p.harga_beli AS estimated_cost,
            -- Days of stock remaining (based on avg sales last 30 days)
            CASE
                WHEN COALESCE((
                    SELECT AVG(daily_sales)
                    FROM (
                        SELECT DATE(t.tanggal), SUM(td.jumlah) AS daily_sales
                        FROM transaksi t
                        JOIN transaksi_detail td ON t.transaksi_id = td.transaksi_id
                        WHERE td.produk_id = p.produk_id
                        AND t.jenis_transaksi = 'PENJUALAN'
                        AND t.tanggal >= NOW() - INTERVAL '30 days'
                        GROUP BY DATE(t.tanggal)
                    ) ds
                ), 0) > 0
                THEN ROUND(p.stok / (
                    SELECT AVG(daily_sales)
                    FROM (
                        SELECT DATE(t.tanggal), SUM(td.jumlah) AS daily_sales
                        FROM transaksi t
                        JOIN transaksi_detail td ON t.transaksi_id = td.transaksi_id
                        WHERE td.produk_id = p.produk_id
                        AND t.jenis_transaksi = 'PENJUALAN'
                        AND t.tanggal >= NOW() - INTERVAL '30 days'
                        GROUP BY DATE(t.tanggal)
                    ) ds
                ))
                ELSE NULL
            END AS days_of_stock,
            -- Primary supplier
            (
                SELECT s.nama_supplier
                FROM produk_supplier ps
                JOIN supplier s ON ps.supplier_id = s.supplier_id
                WHERE ps.produk_master_id = pm.produk_master_id
                AND ps.is_primary = TRUE
                AND ps.cabang_id = p.cabang_id
                LIMIT 1
            ) AS primary_supplier,
            p.harga_beli,
            p.harga_jual
        FROM produk p
        JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
        JOIN kategori k ON pm.kategori_id = k.kategori_id
        JOIN cabang c ON p.cabang_id = c.cabang_id
        WHERE p.stok <= pm.stok_minimum
        AND pm.stok_minimum IS NOT NULL
        AND (p_cabang_id IS NULL OR p.cabang_id = p_cabang_id)
        AND (p_kategori_id IS NULL OR pm.kategori_id = p_kategori_id)
        AND (
            p_alert_level = 'ALL' OR
            CASE
                WHEN p.stok = 0 THEN 'OUT_OF_STOCK'
                WHEN p.stok <= (pm.stok_minimum * 0.25) THEN 'CRITICAL'
                WHEN p.stok <= (pm.stok_minimum * 0.50) THEN 'WARNING'
                WHEN p.stok <= pm.stok_minimum THEN 'WATCH'
                ELSE 'OK'
            END = p_alert_level
        )
    ),

    counted AS (SELECT COUNT(*) AS total FROM low_stock)

    SELECT jsonb_build_object(
        'data', COALESCE(jsonb_agg(
            jsonb_build_object(
                'produk_id', ls.produk_id,
                'nama_produk', ls.nama_produk,
                'sku', ls.sku,
                'kategori', ls.nama_kategori,
                'cabang', ls.nama_cabang,
                'current_stock', ls.current_stock,
                'stok_minimum', ls.stok_minimum,
                'stok_maksimum', ls.stok_maksimum,
                'alert_level', ls.alert_level,
                'reorder_qty', ls.reorder_qty,
                'estimated_cost', ls.estimated_cost,
                'days_of_stock', ls.days_of_stock,
                'primary_supplier', ls.primary_supplier,
                'harga_beli', ls.harga_beli
            ) ORDER BY
                CASE ls.alert_level
                    WHEN 'OUT_OF_STOCK' THEN 1
                    WHEN 'CRITICAL' THEN 2
                    WHEN 'WARNING' THEN 3
                    WHEN 'WATCH' THEN 4
                END,
                ls.nama_cabang, ls.nama_produk
        ), '[]'),
        'total_rows', (SELECT total FROM counted)
    )
    INTO v_data
    FROM (
        SELECT * FROM low_stock
        ORDER BY
            CASE alert_level
                WHEN 'OUT_OF_STOCK' THEN 1
                WHEN 'CRITICAL' THEN 2
                WHEN 'WARNING' THEN 3
                WHEN 'WATCH' THEN 4
            END
        LIMIT p_limit OFFSET v_offset
    ) ls;

    -- Summary
    SELECT jsonb_build_object(
        'total_low_stock', COUNT(*),
        'out_of_stock', COUNT(CASE WHEN ls.alert_level = 'OUT_OF_STOCK' THEN 1 END),
        'critical', COUNT(CASE WHEN ls.alert_level = 'CRITICAL' THEN 1 END),
        'warning', COUNT(CASE WHEN ls.alert_level = 'WARNING' THEN 1 END),
        'watch', COUNT(CASE WHEN ls.alert_level = 'WATCH' THEN 1 END),
        'total_reorder_cost', SUM(ls.estimated_cost)
    )
    INTO v_summary
    FROM low_stock ls;

    RETURN jsonb_build_object(
        'data', v_data->'data',
        'summary', v_summary,
        'meta', jsonb_build_object(
            'total_rows', (v_data->>'total_rows')::INTEGER,
            'page', p_page,
            'limit', p_limit,
            'total_pages', CEIL((v_data->>'total_rows')::DECIMAL / p_limit),
            'cabang_mode', CASE WHEN p_cabang_id IS NULL THEN 'CONSOLIDATED' ELSE 'PER_BRANCH' END,
            'as_of_date', CURRENT_DATE
        )
    );
END;
$function$;






-- Function untuk get raw data dalam format flat (mudah diexport ke Excel)
CREATE OR REPLACE FUNCTION fn_report_excel_format(
    p_report_type VARCHAR,
    p_tanggal_mulai DATE,
    p_tanggal_akhir DATE,
    p_cabang_id VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    row_data JSONB
)
LANGUAGE plpgsql
AS $function$
BEGIN
    CASE p_report_type
        WHEN 'daily_sales' THEN
            RETURN QUERY
            SELECT row_to_json(t)::JSONB
            FROM (
                SELECT
                    DATE(tr.tanggal) AS tanggal,
                    c.nama_cabang,
                    COUNT(tr.transaksi_id) AS total_transaksi,
                    SUM(tr.subtotal) AS gross_sales,
                    SUM(tr.total_diskon_final) AS total_diskon,
                    SUM(tr.pajak) AS pajak,
                    SUM(tr.total) AS net_sales,
                    ROUND(AVG(tr.total), 2) AS avg_transaksi
                FROM transaksi tr
                JOIN cabang c ON tr.cabang_id = c.cabang_id
                WHERE DATE(tr.tanggal) BETWEEN p_tanggal_mulai AND p_tanggal_akhir
                AND tr.jenis_transaksi = 'PENJUALAN'
                AND (p_cabang_id IS NULL OR tr.cabang_id = p_cabang_id)
                GROUP BY DATE(tr.tanggal), c.nama_cabang
                ORDER BY DATE(tr.tanggal) DESC, c.nama_cabang
            ) t;

        WHEN 'low_stock' THEN
            RETURN QUERY
            SELECT row_to_json(t)::JSONB
            FROM (
                SELECT
                    c.nama_cabang,
                    k.nama_kategori,
                    pm.sku,
                    pm.nama_produk,
                    p.stok AS stok_sekarang,
                    pm.stok_minimum,
                    GREATEST(pm.stok_maksimum - p.stok, 0) AS perlu_restock,
                    p.harga_beli,
                    GREATEST(pm.stok_maksimum - p.stok, 0) * p.harga_beli AS estimasi_biaya
                FROM produk p
                JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
                JOIN kategori k ON pm.kategori_id = k.kategori_id
                JOIN cabang c ON p.cabang_id = c.cabang_id
                WHERE p.stok <= pm.stok_minimum
                AND (p_cabang_id IS NULL OR p.cabang_id = p_cabang_id)
                ORDER BY p.stok ASC
            ) t;

        WHEN 'piutang' THEN
            RETURN QUERY
            SELECT row_to_json(t)::JSONB
            FROM (
                SELECT
                    c.nama_cabang,
                    pl.nama AS nama_pelanggan,
                    pl.no_hp,
                    h.nomor_referensi,
                    h.tanggal_hutang,
                    h.jatuh_tempo,
                    h.jumlah_total,
                    h.jumlah_bayar,
                    h.sisa_hutang,
                    h.status_hutang,
                    (CURRENT_DATE - h.jatuh_tempo::DATE) AS hari_overdue
                FROM hutang h
                JOIN pelanggan pl ON h.pelanggan_id = pl.pelanggan_id
                JOIN cabang c ON h.cabang_id = c.cabang_id
                WHERE h.jenis_hutang = 'pelanggan'
                AND (p_cabang_id IS NULL OR h.cabang_id = p_cabang_id)
                ORDER BY h.jatuh_tempo ASC
            ) t;
    END CASE;
END;
$function$;


