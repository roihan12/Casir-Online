import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import deliveryClientService from "../../../services/deliveryClientService";

// === Driver Hooks ===

export const useDrivers = (params = {}) => {
  return useQuery({
    queryKey: ["drivers", params],
    queryFn: () => deliveryClientService.getDrivers(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useAvailableDrivers = (cabangId) => {
  return useQuery({
    queryKey: ["available-drivers", cabangId],
    queryFn: () => deliveryClientService.getAvailableDrivers(cabangId),
    enabled: !!cabangId,
  });
};

export const useCreateDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => deliveryClientService.createDriver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
};

export const useUpdateDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => deliveryClientService.updateDriver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
};

export const useDeleteDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deliveryClientService.deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
};

export const useToggleDriverStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deliveryClientService.toggleDriverStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["available-drivers"] });
    },
  });
};

// === Delivery Hooks ===

export const useDeliveryOrders = (params = {}) => {
  return useQuery({
    queryKey: ["delivery-orders", params],
    queryFn: () => deliveryClientService.getDeliveryOrders(params),
    refetchInterval: 30000, // Poll every 30s
  });
};

export const useAssignDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transaksiId, driverId }) =>
      deliveryClientService.assignDriver(transaksiId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
      queryClient.invalidateQueries({ queryKey: ["available-drivers"] });
    },
  });
};

export const useUpdateDeliveryStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transaksiId, data }) =>
      deliveryClientService.updateDeliveryStatus(transaksiId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
    },
  });
};

export const useMarkPaymentReceived = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transaksiId, data }) =>
      deliveryClientService.markPaymentReceived(transaksiId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
    },
  });
};

export const useMarkDeliveryFailed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transaksiId, alasan }) =>
      deliveryClientService.markDeliveryFailed(transaksiId, alasan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
    },
  });
};

export const useAddDeliveryLocation = () => {
  return useMutation({
    mutationFn: ({ transaksiId, latitude, longitude }) =>
      deliveryClientService.addDeliveryLocation(transaksiId, { latitude, longitude })
  });
};

export const useDriverActiveDeliveries = (driverId) => {
  return useQuery({
    queryKey: ["driver-active-deliveries", driverId],
    queryFn: () => deliveryClientService.getDriverActiveDeliveries(driverId),
    enabled: !!driverId,
    refetchInterval: 15000, // Poll every 15s
  });
};

export const useDriverDashboard = (driverId) => {
  return useQuery({
    queryKey: ["driver-dashboard", driverId],
    queryFn: () => deliveryClientService.getDriverDashboard(driverId),
    enabled: !!driverId,
  });
};

export const useDriverHistory = (driverId, params = {}) => {
  return useQuery({
    queryKey: ["driver-history", driverId, params],
    queryFn: () => deliveryClientService.getDriverHistory(driverId, params),
    enabled: !!driverId,
  });
};
