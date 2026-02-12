import { useQuery, useMutation } from "@tanstack/react-query";
import inventoryService from "../services/inventoryService";
import { toast } from "react-hot-toast";

/**
 * Custom hook for getting the current stock report
 * @param {string} cabangId - Branch ID
 * @returns {UseQueryResult} Query result
 */
export const useCurrentStockReport = (cabangId) => {
  return useQuery({
    queryKey: ["currentStockReport", cabangId],
    queryFn: () => inventoryService.getCurrentStockReport(cabangId),
    enabled: !!cabangId && cabangId !== "all", // Only run if a specific cabangId is provided
  });
};

/**
 * Custom hook for getting inventory value report
 * @param {string} cabangId - Branch ID
 * @returns {UseQueryResult} Query result
 */
export const useInventoryValueReport = (cabangId) => {
  return useQuery({
    queryKey: ["inventoryValueReport", cabangId],
    queryFn: () => inventoryService.getStockValue(cabangId),
    enabled: !!cabangId, // Run for all cabangId including 'all'
  });
};

/**
 * Custom hook for getting inventory movement report
 * @param {string} cabangId - Branch ID
 * @param {number} period - Time period in days
 * @returns {UseQueryResult} Query result
 */
export const useInventoryMovementReport = (cabangId, period = 30) => {
  return useQuery({
    queryKey: ["inventoryMovementReport", cabangId, period],
    queryFn: () => inventoryService.getStockMovementData(cabangId, period),
    enabled: !!cabangId, // Run for all cabangId including 'all'
  });
};

/**
 * Custom hook for getting branch transfer report
 * @param {string} cabangId - Branch ID
 * @param {number} period - Time period in days
 * @returns {UseQueryResult} Query result
 */
export const useBranchTransferReport = (cabangId, period = 30) => {
  return useQuery({
    queryKey: ["branchTransferReport", cabangId, period],
    queryFn: () => inventoryService.getBranchTransferData(cabangId, period),
    enabled: !!cabangId, // Run for all cabangId including 'all'
  });
};

/**
 * Custom hook for generating reports for inventory movements in various formats
 * @returns {Object} Mutation object for generating reports
 */
export const useGenerateMovementReport = () => {
  return useMutation({
    mutationFn: (params) => inventoryService.generateMovementReport(params),
    onSuccess: (data, variables) => {
      // Get the output type from the variables or default to PDF
      const outputType = variables.outputType || "pdf";

      // Set appropriate MIME type and file extension based on output type
      let mimeType;
      let fileExtension;

      switch (outputType) {
        case "excel":
          mimeType =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
          fileExtension = "xlsx";
          break;
        case "csv":
          mimeType = "text/csv";
          fileExtension = "csv";
          break;
        case "pdf":
        default:
          mimeType = "application/pdf";
          fileExtension = "pdf";
          break;
      }

      // Create and download the file
      const url = window.URL.createObjectURL(
        new Blob([data], { type: mimeType })
      );
      const link = document.createElement("a");
      link.href = url;

      // Set appropriate filename based on format and report type
      const reportType = variables.format || "detailed";
      link.setAttribute(
        "download",
        `inventory-movement-${reportType}-${
          new Date().toISOString().split("T")[0]
        }.${fileExtension}`
      );

      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Laporan pergerakan stok berhasil diunduh");
    },
    onError: (error) => {
      console.error("Error generating movement report:", error);
      toast.error("Gagal mengunduh laporan pergerakan stok");
    },
  });
};

/**
 * Group of hooks for inventory reporting
 */
const useInventoryReports = {
  useCurrentStockReport,
  useInventoryValueReport,
  useInventoryMovementReport,
  useBranchTransferReport,
  useGenerateMovementReport,
};

export default useInventoryReports;
