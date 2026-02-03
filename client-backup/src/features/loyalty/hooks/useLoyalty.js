import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLoyaltyConfig,
  createLoyaltyConfig,
  updateLoyaltyConfig,
  getAllTiers,
  createTier,
  updateTier,
  deleteTier,
  getAllRewards,
  createReward,
  updateReward,
  deleteReward,
  getCustomerLoyaltyInfo,
  getAvailableRewards,
  getPointsHistory,
  redeemReward,
  getLoyaltyStats
} from "@services/loyaltyService";
import toast from "react-hot-toast";

// ================================================================
// CONFIG HOOKS
// ================================================================

export const useLoyaltyConfig = (cabangId) => {
  return useQuery({
    queryKey: ["loyaltyConfig", cabangId],
    queryFn: () => getLoyaltyConfig(cabangId)
  });
};

export const useCreateLoyaltyConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLoyaltyConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyaltyConfig"] });
      toast.success("Konfigurasi loyalty berhasil dibuat");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal membuat konfigurasi");
    }
  });
};

export const useUpdateLoyaltyConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateLoyaltyConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyaltyConfig"] });
      toast.success("Konfigurasi loyalty berhasil diperbarui");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal memperbarui konfigurasi");
    }
  });
};

// ================================================================
// TIER HOOKS
// ================================================================

export const useLoyaltyTiers = () => {
  return useQuery({
    queryKey: ["loyaltyTiers"],
    queryFn: getAllTiers
  });
};

export const useCreateTier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyaltyTiers"] });
      toast.success("Tier berhasil dibuat");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal membuat tier");
    }
  });
};

export const useUpdateTier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateTier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyaltyTiers"] });
      toast.success("Tier berhasil diperbarui");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal memperbarui tier");
    }
  });
};

export const useDeleteTier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyaltyTiers"] });
      toast.success("Tier berhasil dihapus");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal menghapus tier");
    }
  });
};

// ================================================================
// REWARD HOOKS
// ================================================================

export const useLoyaltyRewards = (onlyActive = true) => {
  return useQuery({
    queryKey: ["loyaltyRewards", onlyActive],
    queryFn: () => getAllRewards(onlyActive)
  });
};

export const useCreateReward = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyaltyRewards"] });
      toast.success("Reward berhasil dibuat");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal membuat reward");
    }
  });
};

export const useUpdateReward = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateReward(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyaltyRewards"] });
      toast.success("Reward berhasil diperbarui");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal memperbarui reward");
    }
  });
};

export const useDeleteReward = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyaltyRewards"] });
      toast.success("Reward berhasil dihapus");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal menghapus reward");
    }
  });
};

// ================================================================
// CUSTOMER LOYALTY HOOKS
// ================================================================

export const useCustomerLoyaltyInfo = (pelangganId) => {
  return useQuery({
    queryKey: ["customerLoyalty", pelangganId],
    queryFn: () => getCustomerLoyaltyInfo(pelangganId),
    enabled: !!pelangganId
  });
};

export const useAvailableRewards = (pelangganId) => {
  return useQuery({
    queryKey: ["availableRewards", pelangganId],
    queryFn: () => getAvailableRewards(pelangganId),
    enabled: !!pelangganId
  });
};

export const usePointsHistory = (pelangganId, limit = 50, offset = 0) => {
  return useQuery({
    queryKey: ["pointsHistory", pelangganId, limit, offset],
    queryFn: () => getPointsHistory(pelangganId, limit, offset),
    enabled: !!pelangganId
  });
};

export const useRedeemReward = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pelangganId, rewardId, transaksiId }) => 
      redeemReward(pelangganId, rewardId, transaksiId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customerLoyalty", variables.pelangganId] });
      queryClient.invalidateQueries({ queryKey: ["availableRewards", variables.pelangganId] });
      queryClient.invalidateQueries({ queryKey: ["pointsHistory", variables.pelangganId] });
      queryClient.invalidateQueries({ queryKey: ["loyaltyRewards"] });
      toast.success("Reward berhasil ditukar!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal menukar reward");
    }
  });
};

// ================================================================
// STATISTICS HOOKS
// ================================================================

export const useLoyaltyStats = (cabangId) => {
  return useQuery({
    queryKey: ["loyaltyStats", cabangId],
    queryFn: () => getLoyaltyStats(cabangId)
  });
};
