import api from "./api";

// Service untuk POS
const posService = {
  // Produk
  getProductsByBranch: async (branchId) => {
    const response = await api.get(`/produk?cabangId=${branchId}`);
    return response.data;
  },

  // Kategori Produk
  getCategories: async () => {
    const response = await api.get(`/kategori`);
    return response.data.data;
  },

  // Produk berdasarkan kategori
  getProductsByCategory: async (branchId, categoryId) => {
    const response = await api.get(
      `/produk?cabangId=${branchId}&kategoriId=${categoryId}`
    );
    return response.data.data;
  },

  // Produk populer
  getPopularProducts: async (branchId, limit = 10) => {
    const response = await api.get(`/produk/frequent/${branchId}`);
    return response.data.data;
  },

  // Pelanggan
  getCustomers: async (query = "", cabang_id = null) => {
    const params = new URLSearchParams();
    if (query) params.append("search", query);
    if (cabang_id) params.append("cabang_id", cabang_id);
    const response = await api.get(`/pelanggan?${params.toString()}`);
    return response.data.data;
  },

  // Transaksi
  createTransaction: async (transactionData) => {
    // Use create-with-promo endpoint if:
    // 1. promo_codes are present, OR
    // 2. manual discount is present (manual_discount_persen OR manual_discount_nominal), OR
    // 3. pelanggan_id is present (for member discount calculation)
    const hasPromoCodes = transactionData.promo_codes && transactionData.promo_codes.length > 0;
    const hasManualDiscount = (transactionData.manual_discount_persen && transactionData.manual_discount_persen > 0) ||
                              (transactionData.manual_discount_nominal && transactionData.manual_discount_nominal > 0);
    const hasCustomer = !!transactionData.pelanggan_id; // Check for member discount

    const endpoint = (hasPromoCodes || hasManualDiscount || hasCustomer)
      ? `/transaksi/create-with-promo`
      : `/transaksi`;

    const response = await api.post(endpoint, transactionData);
    return response.data.data;
  },

  // Pembayaran
  addPayment: async (paymentData) => {
    const response = await api.post(`/transaksi/payment`, paymentData);
    return response.data.data;
  },

  // QRIS - Generate QR code for existing transaction
  generateQrisPayment: async (qrisData) => {
    const response = await api.post(`/qris`, qrisData);
    return response.data;
  },

  // QRIS - Check payment status
  checkQrisStatus: async (referenceId) => {
    const response = await api.get(`/qris/${referenceId}/status`);
    return response.data;
  },

  // QRIS - Cancel payment
  cancelQrisPayment: async (referenceId) => {
    const response = await api.post(`/qris/${referenceId}/cancel`);
    return response.data;
  },

  // Pencarian produk dengan autocomplete
  searchProducts: async (branchId, query) => {
    const response = await api.get(`/produk/${branchId}/search?query=${query}`);
    return response.data.data;
  },
};

// Local storage untuk menyimpan riwayat pencarian
export const searchHistoryService = {
  // Mendapatkan riwayat pencarian
  getSearchHistory: (branchId) => {
    try {
      const history = localStorage.getItem(`search_history_${branchId}`);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error("Error getting search history:", error);
      return [];
    }
  },

  // Menambahkan pencarian ke riwayat
  addToSearchHistory: (branchId, searchTerm) => {
    try {
      if (!searchTerm.trim()) return;

      const history = searchHistoryService.getSearchHistory(branchId);

      // Hapus jika sudah ada, agar tidak duplikat
      const filteredHistory = history.filter(
        (item) => item.toLowerCase() !== searchTerm.toLowerCase()
      );

      // Tambahkan ke awal array (item terbaru di awal)
      const newHistory = [searchTerm, ...filteredHistory].slice(0, 10); // simpan maksimal 10 item

      localStorage.setItem(
        `search_history_${branchId}`,
        JSON.stringify(newHistory)
      );
      return newHistory;
    } catch (error) {
      console.error("Error adding to search history:", error);
      return [];
    }
  },

  // Menghapus riwayat pencarian
  clearSearchHistory: (branchId) => {
    try {
      localStorage.removeItem(`search_history_${branchId}`);
      return [];
    } catch (error) {
      console.error("Error clearing search history:", error);
      return [];
    }
  },
};

export default posService;
