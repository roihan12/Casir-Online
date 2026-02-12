import api from "./api";

const OPERATIONAL_HOURS_ENDPOINT = "/operational-hours";

export const getOperationalHours = async (cabangId) => {
  try {
    const response = await api.get(`${OPERATIONAL_HOURS_ENDPOINT}/${cabangId}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const updateOperationalHours = async (cabangId, hours) => {
  try {
    const response = await api.put(
      `${OPERATIONAL_HOURS_ENDPOINT}/${cabangId}`,
      hours
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};
