import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import invoiceOcrService from "../services/invoiceOcrService";
import { toast } from "react-hot-toast";

/**
 * Custom hook for extracting invoice data from image using OCR
 * @returns {Object} Mutation object for OCR extraction
 */
export const useExtractInvoiceData = () => {
  return useMutation({
    mutationFn: (imageData) => invoiceOcrService.extractInvoiceData(imageData),
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to extract data from invoice"
      );
    },
  });
};

/**
 * Custom hook for validating OCR data
 * @returns {Object} Mutation object for OCR validation
 */
export const useValidateOcrData = () => {
  return useMutation({
    mutationFn: (invoiceData) => invoiceOcrService.validateOcrData(invoiceData),
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to validate invoice data"
      );
    },
  });
};

/**
 * Custom hook for submitting processed invoice data to create purchase
 * @returns {Object} Mutation object for submitting purchase
 */
export const useSubmitInvoicePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (purchaseData) =>
      invoiceOcrService.submitPurchase(purchaseData),
    onSuccess: () => {
      toast.success("Purchase transaction created successfully");
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to create purchase transaction"
      );
    },
  });
};

/**
 * Custom hook for getting supplier suggestions from OCR data
 * @param {string} supplierInfo - Text containing supplier information
 * @returns {Object} Query result containing supplier suggestions
 */
export const useSupplierSuggestionsFromOcr = (supplierInfo) => {
  return useQuery({
    queryKey: ["supplierOcrSuggestions", supplierInfo],
    queryFn: () => invoiceOcrService.getSupplierSuggestions(supplierInfo),
    enabled: !!supplierInfo && supplierInfo.length > 5,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Custom hook for getting product suggestions from OCR data
 * @param {Object} productOcrData - Product information from OCR
 * @returns {Object} Query result containing product suggestions
 */
export const useProductSuggestionsFromOcr = (productOcrData) => {
  return useQuery({
    queryKey: ["productOcrSuggestions", JSON.stringify(productOcrData)],
    queryFn: () => invoiceOcrService.getProductSuggestions(productOcrData),
    enabled: !!productOcrData && Object.keys(productOcrData).length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Custom hook for processing invoice OCR
 * @param {File} invoiceFile - The invoice file to process
 * @returns {Object} Query result containing OCR data
 */
export const useInvoiceOcr = (invoiceFile) => {
  return useQuery({
    queryKey: ["invoiceOcr", invoiceFile?.name],
    queryFn: async () => {
      const formData = new FormData();
      formData.append("invoice", invoiceFile);
      return invoiceOcrService.processInvoice(formData);
    },
    enabled: !!invoiceFile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
