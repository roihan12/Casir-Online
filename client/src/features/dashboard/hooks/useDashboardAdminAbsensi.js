import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

const fetchHariIni = async (cabangId, date) => {
  const params = date ? { date } : {};
  const { data } = await api.get(`/dashboard-absensi-admin/hari-ini/${cabangId}`, { params });
  return data.data;
};

const fetchBelumAbsen = async (cabangId, date) => {
  const params = date ? { date } : {};
  const { data } = await api.get(`/dashboard-absensi-admin/belum-absen/${cabangId}`, { params });
  return data.data;
};

const fetchTren = async (cabangId, periode) => {
  const params = periode ? { periode } : {};
  const { data } = await api.get(`/dashboard-absensi-admin/tren/${cabangId}`, { params });
  return data.data;
};

const fetchTopTerlambat = async (cabangId, month, year) => {
  const params = { month, year };
  const { data } = await api.get(`/dashboard-absensi-admin/top-terlambat/${cabangId}`, { params });
  return data.data;
};

const fetchRekapLembur = async (cabangId, month, year) => {
  const params = { month, year };
  const { data } = await api.get(`/dashboard-absensi-admin/rekap-lembur/${cabangId}`, { params });
  return data.data;
};

const fetchPendingApproval = async (cabangId) => {
  const { data } = await api.get(`/dashboard-absensi-admin/pending/${cabangId}`);
  return data.data;
};

// Hooks
export const useHariIni = (cabangId, date) => {
  return useQuery({
    queryKey: ['dashboard-admin', 'hari-ini', cabangId, date],
    queryFn: () => fetchHariIni(cabangId, date),
    enabled: !!cabangId,
  });
};

export const useBelumAbsen = (cabangId, date) => {
  return useQuery({
    queryKey: ['dashboard-admin', 'belum-absen', cabangId, date],
    queryFn: () => fetchBelumAbsen(cabangId, date),
    enabled: !!cabangId,
  });
};

export const useTren = (cabangId, periode) => {
  return useQuery({
    queryKey: ['dashboard-admin', 'tren', cabangId, periode],
    queryFn: () => fetchTren(cabangId, periode),
    enabled: !!cabangId,
  });
};

export const useTopTerlambat = (cabangId, month, year) => {
  return useQuery({
    queryKey: ['dashboard-admin', 'top-terlambat', cabangId, month, year],
    queryFn: () => fetchTopTerlambat(cabangId, month, year),
    enabled: !!cabangId,
  });
};

export const useRekapLembur = (cabangId, month, year) => {
  return useQuery({
    queryKey: ['dashboard-admin', 'rekap-lembur', cabangId, month, year],
    queryFn: () => fetchRekapLembur(cabangId, month, year),
    enabled: !!cabangId,
  });
};

export const usePendingApproval = (cabangId) => {
  return useQuery({
    queryKey: ['dashboard-admin', 'pending', cabangId],
    queryFn: () => fetchPendingApproval(cabangId),
    enabled: !!cabangId,
    refetchInterval: 60000, // Refresh every minute
  });
};
