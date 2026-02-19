import { useQuery } from "@tanstack/react-query";
import masterShiftService from "../services/masterShiftService";

// Keys for React Query
export const masterShiftKeys = {
  all: ["masterShift"],
  lists: () => [...masterShiftKeys.all, "list"],
  list: (filters) => [...masterShiftKeys.lists(), { ...filters }],
  details: () => [...masterShiftKeys.all, "detail"],
  detail: (id) => [...masterShiftKeys.details(), id],
};

// Hook to fetch master shift list
export const useMasterShiftList = (params = {}) => {
  return useQuery({
    queryKey: masterShiftKeys.list(params),
    queryFn: () => masterShiftService.getAllMasterShifts(params),
    keepPreviousData: true,
  });
};

// Hook to fetch master shift detail
export const useMasterShiftDetail = (id) => {
  return useQuery({
    queryKey: masterShiftKeys.detail(id),
    queryFn: () => masterShiftService.getMasterShiftById(id),
    enabled: !!id,
  });
};
