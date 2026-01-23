import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import inventoryNotificationService from "../services/inventoryNotificationService.js";
import { toast } from "react-hot-toast";

export const useInventoryNotifications = () => {
  const queryClient = useQueryClient();

  // Get all notifications with filtering and pagination
  const useNotifications = (filters = {}, page = 1, limit = 10) => {
    return useQuery({
      queryKey: ["inventoryNotifications", filters, page, limit],
      queryFn: () => 
        inventoryNotificationService.getNotifications({
          ...filters,
          page,
          limit,
        }),
      keepPreviousData: true,
    });
  };

  // Get notification statistics
  const useNotificationStats = (cabangId) => {
    return useQuery({
      queryKey: ["inventoryNotificationStats", cabangId],
      queryFn: () => inventoryNotificationService.getNotificationStats(cabangId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Mark notification as read
  const useMarkAsRead = () => {
    return useMutation({
      mutationFn: (notificationId) => 
        inventoryNotificationService.markAsRead(notificationId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["inventoryNotifications"] });
        queryClient.invalidateQueries({ queryKey: ["inventoryNotificationStats"] });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to mark notification as read");
      },
    });
  };

  // Mark all notifications as read
  const useMarkAllAsRead = () => {
    return useMutation({
      mutationFn: (cabangId) => 
        inventoryNotificationService.markAllAsRead(cabangId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["inventoryNotifications"] });
        queryClient.invalidateQueries({ queryKey: ["inventoryNotificationStats"] });
        toast.success("All notifications marked as read");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to mark all notifications as read");
      },
    });
  };

  // Delete notification
  const useDeleteNotification = () => {
    return useMutation({
      mutationFn: (notificationId) => 
        inventoryNotificationService.deleteNotification(notificationId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["inventoryNotifications"] });
        queryClient.invalidateQueries({ queryKey: ["inventoryNotificationStats"] });
        toast.success("Notification deleted successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete notification");
      },
    });
  };

  // Get notification details
  const useNotificationDetails = (notificationId, options = {}) => {
    return useQuery({
      queryKey: ["inventoryNotificationDetail", notificationId],
      queryFn: () => inventoryNotificationService.getNotificationDetails(notificationId),
      enabled: !!notificationId && options.enabled !== false,
      onError: (error) => {
        toast.error(error.message || "Failed to fetch notification details");
      },
    });
  };

  return {
    useNotifications,
    useNotificationStats,
    useMarkAsRead,
    useMarkAllAsRead,
    useDeleteNotification,
    useNotificationDetails,
  };
};

export default useInventoryNotifications;
