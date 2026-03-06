import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

const fetchPreviewPayroll = async (params) => {
  const { data } = await api.get('/laporan-payroll', { params });
  return data.data;
};

export const usePreviewPayroll = (params) => {
  return useQuery({
    queryKey: ['laporan-payroll', params],
    queryFn: () => fetchPreviewPayroll(params),
    enabled: !!params.cabangId && !!params.periode,
  });
};

export const downloadExcelPayroll = (cabangId, periode) => {
  let url = `${import.meta.env.VITE_API_URL}/api/laporan-payroll/export?cabangId=${cabangId}&periode=${periode}`;
  window.open(url, '_blank');
};
