import { useQuery, useMutation } from "@tanstack/react-query";
import catalogService from "../../../services/catalogService";
import checkoutClientService from "../../../services/checkoutClientService";

// === Catalog Hooks ===

export const useActiveBranches = () => {
  return useQuery({
    queryKey: ["active-branches"],
    queryFn: () => catalogService.getActiveBranches(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCatalogProducts = (cabangId, params = {}) => {
  return useQuery({
    queryKey: ["catalog-products", cabangId, params],
    queryFn: () => catalogService.getProducts(cabangId, params),
    enabled: !!cabangId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCatalogCategories = (cabangId) => {
  return useQuery({
    queryKey: ["catalog-categories", cabangId],
    queryFn: () => catalogService.getCategories(cabangId),
    enabled: !!cabangId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCabangInfo = (cabangId) => {
  return useQuery({
    queryKey: ["cabang-info", cabangId],
    queryFn: () => catalogService.getCabangInfo(cabangId),
    enabled: !!cabangId,
    staleTime: 10 * 60 * 1000,
  });
};

export const useProductDetail = (cabangId, produkId) => {
  return useQuery({
    queryKey: ["product-detail", cabangId, produkId],
    queryFn: () => catalogService.getProductDetail(cabangId, produkId),
    enabled: !!cabangId && !!produkId,
  });
};

export const useVerifyPromo = (cabangId) => {
  return useMutation({
    mutationFn: (data) => catalogService.verifyPromo(cabangId, data),
  });
};

export const useEligiblePromos = (cabangId) => {
  return useMutation({
    mutationFn: (data) => catalogService.getEligiblePromos(cabangId, data),
  });
};

// === Checkout Hooks ===

export const useCreateOrder = () => {
  return useMutation({
    mutationFn: (data) => checkoutClientService.createOrder(data),
  });
};

export const useOrderStatus = (transaksiId, cabangId) => {
  return useQuery({
    queryKey: ["order-status", transaksiId],
    queryFn: () => checkoutClientService.getOrderStatus(transaksiId, cabangId),
    enabled: !!transaksiId && !!cabangId,
    refetchInterval: 10000,
  });
};

export const useCancelOrder = () => {
  return useMutation({
    mutationFn: ({ transaksiId, alasan, cabangId }) =>
      checkoutClientService.cancelOrder(transaksiId, alasan, cabangId),
  });
};

export const useDeliveryTracking = (transaksiId) => {
  return useQuery({
    queryKey: ["delivery-tracking", transaksiId],
    queryFn: () => checkoutClientService.getDeliveryTracking(transaksiId),
    enabled: !!transaksiId,
    refetchInterval: 30000,
  });
};
