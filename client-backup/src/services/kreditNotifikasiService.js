import api from './api';

/**
 * Service untuk mengelola notifikasi kredit
 */
const kreditNotifikasiService = {
  /**
   * Membuat notifikasi kredit baru
   * @param {Object} data - Data notifikasi kredit
   * @returns {Promise<Object>} - Response dari API
   */
  createKreditNotifikasi: async (data) => {
    try {
      const response = await api.post('/kredit-notifikasi', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Mendapatkan daftar notifikasi kredit dengan filter
   * @param {Object} filters - Filter untuk notifikasi kredit
   * @returns {Promise<Object>} - Response dari API
   */
  getKreditNotifikasi: async (filters = {}) => {
    try {
      const response = await api.get('/kredit-notifikasi', { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Mengirim notifikasi kredit
   * @param {string} id - ID notifikasi kredit
   * @returns {Promise<Object>} - Response dari API
   */
  sendKreditNotifikasi: async (id) => {
    try {
      const response = await api.post(`/kredit-notifikasi/${id}/send`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Menandai notifikasi kredit telah dibaca
   * @param {string} id - ID notifikasi kredit
   * @returns {Promise<Object>} - Response dari API
   */
  markNotifikasiRead: async (id) => {
    try {
      const response = await api.patch(`/kredit-notifikasi/${id}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Membatalkan notifikasi kredit
   * @param {string} id - ID notifikasi kredit
   * @returns {Promise<Object>} - Response dari API
   */
  cancelKreditNotifikasi: async (id) => {
    try {
      const response = await api.patch(`/kredit-notifikasi/${id}/cancel`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Membuat notifikasi pengingat pembayaran kredit otomatis
   * @param {Object} options - Opsi untuk pembuatan notifikasi pengingat
   * @returns {Promise<Object>} - Response dari API
   */
  createPaymentReminderNotifications: async (options = {}) => {
    try {
      const response = await api.post('/kredit-notifikasi/create-reminders', options);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Mengirim semua notifikasi kredit yang belum dikirim
   * @returns {Promise<Object>} - Response dari API
   */
  sendPendingNotifications: async () => {
    try {
      const response = await api.post('/kredit-notifikasi/send-pending');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default kreditNotifikasiService;
