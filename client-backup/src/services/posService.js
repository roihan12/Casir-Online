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
  getCustomers: async (query = "") => {
    const response = await api.get(`/pelanggan?search=${query}`);
    return response.data.data;
  },

  // Transaksi
  createTransaction: async (transactionData) => {
    const response = await api.post(`/transaksi`, transactionData);
    return response.data.data;
  },

  // Pembayaran
  addPayment: async (paymentData) => {
    const response = await api.post(`/transaksi/payment`, paymentData);
    return response.data.data;
  },

  // QRIS
  generateQrisPayment: async (qrisData) => {
    const response = await api.post(`/transaksi/payment/qris`, qrisData);
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
