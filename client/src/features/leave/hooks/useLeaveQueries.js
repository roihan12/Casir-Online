import { useQuery } from "@tanstack/react-query";
import { leaveService } from "../services/leaveService";

export const leaveKeys = {
  all: ["leave"],
  hariLibur: () => [...leaveKeys.all, "hari-libur"],
  hariLiburList: (params) => [...leaveKeys.hariLibur(), "list", params],
  hariLiburCheck: (tanggal) => [...leaveKeys.hariLibur(), "check", tanggal],
  
  izinCuti: () => [...leaveKeys.all, "izin-cuti"],
  izinCutiMe: (params) => [...leaveKeys.izinCuti(), "me", params],
  izinCutiPending: (params) => [...leaveKeys.izinCuti(), "pending", params],
  izinCutiAll: (params) => [...leaveKeys.izinCuti(), "all", params],
  izinCutiDetail: (id) => [...leaveKeys.izinCuti(), "detail", id],

  kuotaCuti: () => [...leaveKeys.all, "kuota-cuti"],
  kuotaCutiAll: (params) => [...leaveKeys.kuotaCuti(), "all", params],
  kuotaCutiUser: (userId, params) => [...leaveKeys.kuotaCuti(), "user", userId, params],
};

export const useHariLibur = (params) => {
  return useQuery({
    queryKey: leaveKeys.hariLiburList(params),
    queryFn: () => leaveService.getHariLibur(params),
  });
};

export const useCheckHariLibur = (tanggal) => {
  return useQuery({
    queryKey: leaveKeys.hariLiburCheck(tanggal),
    queryFn: () => leaveService.checkHariLibur(tanggal),
    enabled: !!tanggal,
  });
};

export const useIzinCutiMe = (params) => {
  return useQuery({
    queryKey: leaveKeys.izinCutiMe(params),
    queryFn: () => leaveService.getIzinCutiMe(params),
  });
};

export const useIzinCutiPending = (params) => {
  return useQuery({
    queryKey: leaveKeys.izinCutiPending(params),
    queryFn: () => leaveService.getIzinCutiPending(params),
  });
};

export const useIzinCutiAll = (params) => {
  return useQuery({
    queryKey: leaveKeys.izinCutiAll(params),
    queryFn: () => leaveService.getIzinCutiAll(params),
  });
};

export const useIzinCutiDetail = (id) => {
  return useQuery({
    queryKey: leaveKeys.izinCutiDetail(id),
    queryFn: () => leaveService.getIzinCutiDetail(id),
    enabled: !!id,
  });
};

export const useKuotaCutiAll = (params) => {
  return useQuery({
    queryKey: leaveKeys.kuotaCutiAll(params),
    queryFn: () => leaveService.getKuotaCutiAll(params),
  });
};

export const useKuotaCutiUser = (userId, params) => {
  return useQuery({
    queryKey: leaveKeys.kuotaCutiUser(userId, params),
    queryFn: () => leaveService.getKuotaCutiByUser(userId, params),
    enabled: !!userId,
  });
};
