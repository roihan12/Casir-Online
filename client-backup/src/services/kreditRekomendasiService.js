import axios from "axios";
import api from "./api";

// Service untuk mendapatkan rekomendasi kredit berdasarkan ID pelanggan
export const getCustomerCreditScore = async (pelangganId) => {
  const response = await api.get(`/kredit-rekomendasi/score/${pelangganId}`);
  return response.data;
};

// Service untuk mendapatkan rekomendasi pembayaran kredit untuk transaksi
export const getKreditPaymentRecommendation = async (transaksiId) => {
  const response = await api.get(`/transaksi/${transaksiId}/kredit-recommendation`);
  return response.data;
};

// Service untuk membuat rekomendasi kredit
export const createKreditRekomendasi = async (data) => {
  const response = await api.post(`/kredit-rekomendasi`, data);
  return response.data;
};

// Service untuk mendapatkan rekomendasi kredit berdasarkan ID
export const getKreditRekomendasiById = async (id) => {
  const response = await api.get(`/kredit-rekomendasi/${id}`);
  return response.data;
};

// Service untuk mendapatkan rekomendasi kredit berdasarkan ID pelanggan
export const getKreditRekomendasiByPelanggan = async (pelangganId) => {
  const response = await api.get(`/kredit-rekomendasi/pelanggan/${pelangganId}`);
  return response.data;
};

// Service untuk menyetujui atau menolak rekomendasi kredit
export const approveKreditRekomendasi = async (id, data) => {
  const response = await api.put(`/kredit-rekomendasi/${id}/approve`, data);
  return response.data;
};

// Service untuk mendapatkan daftar rekomendasi kredit dengan filter
export const getKreditRekomendasiList = async (params) => {
  const response = await api.get(`/kredit-rekomendasi`, { params });
  return response.data;
};

// Service untuk membuat transaksi kredit
export const createKreditTransaction = async (data) => {
  const response = await api.post(`/transaksi/kredit`, data);
  return response.data;
};
