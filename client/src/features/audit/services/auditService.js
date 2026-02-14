import api from "@common/utils/api";

const AUDIT_ENDPOINT = "/audit-logs";

/**
 * Get audit logs with pagination and filtering
 * @param {Object} params - Query parameters (page, limit, startDate, endDate, etc.)
 * @returns {Promise<Object>} - Audit logs response
 */
export const getAuditLogs = async (params) => {
  try {
    const response = await api.get(AUDIT_ENDPOINT, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get audit log detail by ID
 * @param {string} logId - Log ID
 * @returns {Promise<Object>} - Audit log detail response
 */
export const getAuditLogDetail = async (logId) => {
  try {
    const response = await api.get(`${AUDIT_ENDPOINT}/${logId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Export audit logs query string for direct download link
 * @param {Object} params - Query parameters
 * @returns {string} - Export URL
 */
export const getExportAuditLogsUrl = (params) => {
  const queryParams = new URLSearchParams(params).toString();
  return `${api.defaults.baseURL}${AUDIT_ENDPOINT}/export?${queryParams}`;
};

/**
 * Export audit logs (blob)
 * @param {Object} params - Query parameters
 * @returns {Promise<Blob>} - File blob
 */
export const exportAuditLogs = async (params) => {
  try {
    const response = await api.get(`${AUDIT_ENDPOINT}/export`, {
      params,
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const auditService = {
  getAuditLogs,
  getAuditLogDetail,
  getExportAuditLogsUrl,
  exportAuditLogs,
};

export default auditService;
