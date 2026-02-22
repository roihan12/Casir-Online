import api from "@/common/utils/api";

export const payrollService = {
  // --- KOMPONEN GAJI ---
  getKomponen: async (params) => {
    const response = await api.get("/penggajian/komponen", { params });
    return response.data;
  },
  createKomponen: async (data) => {
    const response = await api.post("/penggajian/komponen", data);
    return response.data;
  },
  getKomponenDetail: async (id) => {
    const response = await api.get(`/penggajian/komponen/${id}`);
    return response.data;
  },
  updateKomponen: async (id, data) => {
    const response = await api.put(`/penggajian/komponen/${id}`, data);
    return response.data;
  },
  deleteKomponen: async (id) => {
    const response = await api.delete(`/penggajian/komponen/${id}`);
    return response.data;
  },

  // --- TUNJANGAN PEGAWAI ---
  getTunjangan: async (params) => {
    const response = await api.get("/penggajian/tunjangan", { params });
    return response.data;
  },
  createTunjangan: async (data) => {
    const response = await api.post("/penggajian/tunjangan", data);
    return response.data;
  },
  updateTunjangan: async (id, data) => {
    const response = await api.put(`/penggajian/tunjangan/${id}`, data);
    return response.data;
  },
  deleteTunjangan: async (id) => {
    const response = await api.delete(`/penggajian/tunjangan/${id}`);
    return response.data;
  },

  // --- GAJI & RIWAYAT ---
  getGajiKaryawan: async (userId) => {
    const response = await api.get(`/penggajian/gaji/${userId}`);
    return response.data; // Includes active tunjangan
  },
  updateGajiKaryawan: async (userId, data) => {
    const response = await api.put(`/penggajian/gaji/${userId}`, data);
    return response.data;
  },
  getRiwayatGaji: async (userId, params) => {
    const response = await api.get(`/penggajian/gaji/${userId}/riwayat`, { params });
    return response.data;
  },

  // --- SLIP GAJI ---
  generateSlip: async (data) => {
    const response = await api.post("/penggajian/slip/generate", data);
    return response.data;
  },
  getSlip: async (params) => {
    const response = await api.get("/penggajian/slip", { params });
    return response.data;
  },
  getSlipMe: async (params) => {
    const response = await api.get("/penggajian/slip/me", { params });
    return response.data;
  },
  getSlipDetail: async (id) => {
    const response = await api.get(`/penggajian/slip/${id}`);
    return response.data;
  },
  finalizeSlip: async (id, data) => {
    const response = await api.put(`/penggajian/slip/${id}/finalize`, data);
    return response.data; // data can be { catatan }
  },
  batchFinalizeSlip: async (data) => {
    const response = await api.post("/penggajian/slip/batch-finalize", data);
    return response.data;
  },
  deleteSlip: async (id) => {
    const response = await api.delete(`/penggajian/slip/${id}`);
    return response.data;
  }
};
