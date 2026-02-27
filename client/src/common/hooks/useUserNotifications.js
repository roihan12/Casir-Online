import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import userNotificationService from "../services/userNotificationService";
import { toast } from "react-hot-toast";

export const useUserNotifications = () => {
  const queryClient = useQueryClient();

  // Get all notifications with filtering and pagination
  const useNotifications = (filters = {}, page = 1, limit = 10) => {
    return useQuery({
      queryKey: ["userNotifications", filters, page, limit],
      queryFn: () => 
        userNotificationService.getNotifications({
          ...filters,
          page,
          limit,
        }),
      keepPreviousData: true,
      refetchInterval: 60000, // optionally refetch every minute
    });
  };

  // Mark notification as read
  const useMarkAsRead = () => {
    return useMutation({
      mutationFn: (notificationId) => 
        userNotificationService.markAsRead(notificationId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["userNotifications"] });
      },
      onError: (error) => {
        console.error("Failed to mark notification as read", error);
      },
    });
  };

  // Mark all notifications as read
  const useMarkAllAsRead = () => {
    return useMutation({
      mutationFn: () => 
        userNotificationService.markAllAsRead(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["userNotifications"] });
        toast.success("Semua notifikasi ditandai telah dibaca");
      },
      onError: (error) => {
        toast.error(error.message || "Gagal menandai semua notifikasi");
      },
    });
  };

  return {
    useNotifications,
    useMarkAsRead,
    useMarkAllAsRead,
  };
};

export default useUserNotifications;
