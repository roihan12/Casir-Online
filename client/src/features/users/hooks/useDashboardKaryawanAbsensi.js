import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

const fetchMe = async (date) => {
  const params = date ? { date } : {};
  const { data } = await api.get('/dashboard-absensi-karyawan/me', { params });
  return data.data;
};

const fetchRekapBulan = async (periode) => {
  const params = periode ? { periode } : {};
  const { data } = await api.get('/dashboard-absensi-karyawan/rekap-bulan', { params });
  return data.data;
};

const fetchSaldoCuti = async () => {
  const { data } = await api.get('/dashboard-absensi-karyawan/saldo-cuti');
  return data.data;
};

const fetchSlipTerbaru = async () => {
  const { data } = await api.get('/dashboard-absensi-karyawan/slip-terbaru');
  return data.data;
};

const fetchJadwalMingguIni = async (date) => {
  const params = date ? { date } : {};
  const { data } = await api.get('/dashboard-absensi-karyawan/jadwal-minggu-ini', { params });
  return data.data;
};

export const useMyAbsensiHariIni = (date) => {
  return useQuery({
    queryKey: ['dashboard-karyawan', 'me', date],
    queryFn: () => fetchMe(date),
  });
};

export const useRekapBulan = (periode) => {
  return useQuery({
    queryKey: ['dashboard-karyawan', 'rekap-bulan', periode],
    queryFn: () => fetchRekapBulan(periode),
  });
};

export const useSaldoCuti = () => {
  return useQuery({
    queryKey: ['dashboard-karyawan', 'saldo-cuti'],
    queryFn: () => fetchSaldoCuti(),
  });
};

export const useSlipTerbaru = () => {
  return useQuery({
    queryKey: ['dashboard-karyawan', 'slip-terbaru'],
    queryFn: () => fetchSlipTerbaru(),
  });
};

export const useJadwalMingguIni = (date) => {
  return useQuery({
    queryKey: ['dashboard-karyawan', 'jadwal-minggu', date],
    queryFn: () => fetchJadwalMingguIni(date),
  });
};
