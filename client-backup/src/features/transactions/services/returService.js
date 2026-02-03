import api from "@common/utils/api";

const returService = {
  // Get list of returns with filters
  getReturList: async (filters = {}) => {
    // Pass through filters - jenisTransaksi is already set correctly
    const params = { ...filters };
    
    const response = await api.get("/transaksi", { params });
    return response.data;
  },

  // Get return detail by ID
  getReturById: async (id) => {
    const response = await api.get(`/transaksi/${id}`);
    return response.data;
  },

  // Search original transaction for return
  searchTransaksiAsli: async (nomorTransaksi, jenisTransaksi) => {
    const params = {
      search: nomorTransaksi,
      jenisTransaksi: jenisTransaksi === "RETUR_PENJUALAN" ? "PENJUALAN" : "PEMBELIAN",
      limit: 1,
    };
    const response = await api.get("/transaksi", { params });
    return response.data;
  },

  // Create return transaction
  createRetur: async (data) => {
    // Build keterangan with return info
    const keterangan = [
      `Alasan: ${data.alasanRetur}`,
      data.transaksiAsliId ? `Transaksi Asli: ${data.transaksiAsliId}` : null,
      data.keterangan ? data.keterangan : null,
    ].filter(Boolean).join(' | ');

    // Map return data to transaction format matching backend expectations
    const transactionData = {
      cabang_id: data.cabangId,
      jenis_transaksi: data.jenisRetur,
      pelanggan_id: data.jenisRetur === "RETUR_PENJUALAN" ? data.pelangganId || null : null,
      supplier_id: data.jenisRetur === "RETUR_PEMBELIAN" ? data.supplierId || null : null,
      keterangan: keterangan,
      // For returns, we typically mark as TUNAI (refund) or based on actual method
      metode_pembayaran: "TUNAI",
      details: data.items
        .filter(item => item.jumlahRetur > 0)
        .map(item => ({
          produk_id: item.produk_id,
          jumlah: item.jumlahRetur,
          harga_satuan: item.harga_satuan,
          diskon_persen: 0,
          pajak_persen: 0, // Let backend calculate from tax config
        })),
    };

    const response = await api.post("/transaksi", transactionData);
    return response.data;
  },
};

export default returService;
