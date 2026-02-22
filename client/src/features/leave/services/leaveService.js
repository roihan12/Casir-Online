import api from "@/common/utils/api";

export const leaveService = {
  // --- HARI LIBUR ---
  getHariLibur: async (params) => {
    const response = await api.get("/hari-libur", { params });
    return response.data;
  },
  createHariLibur: async (data) => {
    const response = await api.post("/hari-libur", data);
    return response.data;
  },
  importHariLibur: async (data) => {
    const response = await api.post("/hari-libur/import", data);
    return response.data;
  },
  deleteHariLibur: async (id) => {
    const response = await api.delete(`/hari-libur/${id}`);
    return response.data;
  },
  checkHariLibur: async (tanggal) => {
    const response = await api.get(`/hari-libur/check`, { params: { tanggal } });
    return response.data;
  },
  hitungHariKerja: async (params) => { // dari, sampai
    const response = await api.get(`/hari-libur/hitung-hari-kerja`, { params });
    return response.data;
  },

  // --- IZIN & CUTI ---
  createIzin: async (data) => {
    // Handling form data if there's a file, but simple application/json for now
    const response = await api.post("/izin-cuti/izin", data);
    return response.data;
  },
  createCuti: async (data) => {
    const response = await api.post("/izin-cuti/cuti", data);
    return response.data;
  },
  getIzinCutiMe: async (params) => {
    const response = await api.get("/izin-cuti/me", { params });
    return response.data;
  },
  getIzinCutiPending: async (params) => {
    const response = await api.get("/izin-cuti/pending", { params });
    return response.data;
  },
  getIzinCutiAll: async (params) => {
    const response = await api.get("/izin-cuti", { params });
    return response.data;
  },
  getIzinCutiDetail: async (id) => {
    const response = await api.get(`/izin-cuti/${id}`);
    return response.data;
  },
  approveIzinCuti: async (id, data) => {
    const response = await api.put(`/izin-cuti/${id}/approve`, data);
    return response.data;
  },
  rejectIzinCuti: async (id, data) => {
    const response = await api.put(`/izin-cuti/${id}/reject`, data);
    return response.data;
  },
  cancelIzinCuti: async (id) => {
    const response = await api.delete(`/izin-cuti/${id}`);
    return response.data;
  },

  // --- KUOTA CUTI ---
  generateKuotaCuti: async (data) => {
    const response = await api.post("/kuota-cuti/generate", data);
    return response.data;
  },
  getKuotaCutiAll: async (params) => {
    const response = await api.get("/kuota-cuti", { params });
    return response.data;
  },
  getKuotaCutiByUser: async (userId, params) => {
    const response = await api.get(`/kuota-cuti/${userId}`, { params });
    return response.data;
  },
  adjustKuotaCuti: async (id, data) => {
    const response = await api.put(`/kuota-cuti/${id}`, data);
    return response.data;
  }
};
