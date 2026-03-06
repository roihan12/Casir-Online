import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

const fetchPreviewLaporan = async (params) => {
  const { data } = await api.get('/laporan-kehadiran', { params });
  return data.data;
};

export const usePreviewLaporan = (params) => {
  return useQuery({
    queryKey: ['laporan-kehadiran', params],
    queryFn: () => fetchPreviewLaporan(params),
    enabled: !!params.cabangId && !!params.startDate && !!params.endDate,
  });
};

export const downloadExcel = (cabangId, startDate, endDate, status) => {
  let url = `${import.meta.env.VITE_API_URL}/api/laporan-kehadiran/export?cabangId=${cabangId}&startDate=${startDate}&endDate=${endDate}`;
  if (status) url += `&status=${status}`;
  window.open(url, '_blank');
};

export const downloadPDF = (cabangId, startDate, endDate, status) => {
  let url = `${import.meta.env.VITE_API_URL}/api/laporan-kehadiran/export-pdf?cabangId=${cabangId}&startDate=${startDate}&endDate=${endDate}`;
  if (status) url += `&status=${status}`;
  window.open(url, '_blank');
};
