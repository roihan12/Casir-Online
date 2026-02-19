import { useQuery } from "@tanstack/react-query";
import reguService from "../../../services/reguService";

// Keys for React Query
export const reguKeys = {
  all: ["regu"],
  lists: () => [...reguKeys.all, "list"],
  list: (filters) => [...reguKeys.lists(), { ...filters }],
  details: () => [...reguKeys.all, "detail"],
  detail: (id) => [...reguKeys.details(), id],
};

// Hook to fetch regu list
export const useReguList = (params = {}) => {
  return useQuery({
    queryKey: reguKeys.list(params),
    queryFn: () => reguService.getAllRegu(params),
    keepPreviousData: true,
  });
};

// Hook to fetch regu detail
export const useReguDetail = (id) => {
  return useQuery({
    queryKey: reguKeys.detail(id),
    queryFn: () => reguService.getReguById(id),
    enabled: !!id,
  });
};
