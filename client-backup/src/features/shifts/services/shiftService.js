import api from "@common/utils/api";

const SHIFT_ENDPOINT = "/shifts";

export const getShifts = async (params) => {
  const response = await api.get(SHIFT_ENDPOINT, { params });
  return response.data;
};

export const getActiveShift = async (userId) => {
  const response = await api.get(`${SHIFT_ENDPOINT}/active`, {
    params: { userId },
  });
  return response.data;
};

export const getShiftById = async (id) => {
  const response = await api.get(`${SHIFT_ENDPOINT}/${id}`);
  return response.data;
};

export const getShiftReport = async (params) => {
  const response = await api.get(`${SHIFT_ENDPOINT}/reports/summary`, {
    params,
  });
  return response.data;
};

export const openShift = async (data) => {
  const response = await api.post(`${SHIFT_ENDPOINT}/open`, data);
  return response.data;
};

export const closeShift = async (data) => {
  const response = await api.post(`${SHIFT_ENDPOINT}/close`, data);
  return response.data;
};

export const adjustShift = async (data) => {
  const response = await api.post(`${SHIFT_ENDPOINT}/adjust`, data);
  return response.data;
};

export default {
  getShifts,
  getActiveShift,
  getShiftById,
  getShiftReport,
  openShift,
  closeShift,
  adjustShift,
};
