import { useQuery } from "@tanstack/react-query";
import pelangganService from "../services/pelangganService";

export const useGetCustomerLoyaltyHistory = (id) => {
  return useQuery({
    queryKey: ["customerLoyaltyHistory", id],
    queryFn: () => pelangganService.getLoyaltyPointHistory(id),
    enabled: !!id,
  });
};
