import { useQuery } from "@tanstack/react-query";
import auditService from "../services/auditService";

export const auditKeys = {
  all: ["audit-logs"],
  lists: () => [...auditKeys.all, "list"],
  list: (filters) => [...auditKeys.lists(), { ...filters }],
  details: () => [...auditKeys.all, "detail"],
  detail: (id) => [...auditKeys.details(), id],
};

/**
 * Hook to fetch audit logs list
 * @param {Object} filters - Filter parameters
 * @param {Object} options - React Query options
 */
export const useAuditLogs = (filters, options = {}) => {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: () => auditService.getAuditLogs(filters),
    keepPreviousData: true,
    ...options,
  });
};

/**
 * Hook to fetch audit log detail
 * @param {string} logId - Log ID
 * @param {Object} options - React Query options
 */
export const useAuditLogDetail = (logId, options = {}) => {
  return useQuery({
    queryKey: auditKeys.detail(logId),
    queryFn: () => auditService.getAuditLogDetail(logId),
    enabled: !!logId,
    ...options,
  });
};
