import { useMutation, useQueryClient } from "@tanstack/react-query";
import importProdukService from "../services/importProdukService";
import { toast } from "react-hot-toast";

/**
 * Hook untuk download template Excel Produk
 */
export const useDownloadProdukTemplate = () => {
  return useMutation({
    mutationFn: () => importProdukService.downloadTemplate(),
    onSuccess: () => {
      toast.success("Template berhasil diunduh");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Gagal mengunduh template");
    },
  });
};

/**
 * Hook untuk preview import Produk (dry-run)
 */
export const usePreviewImportProduk = () => {
  return useMutation({
    mutationFn: ({ file, cabangId }) =>
      importProdukService.previewImport(file, cabangId),
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Gagal memproses file");
    },
  });
};

/**
 * Hook untuk eksekusi import Produk
 */
export const useImportProduk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, cabangId }) =>
      importProdukService.importProduk(file, cabangId),
    onSuccess: (data) => {
      toast.success(
        `Import selesai: ${data.berhasil} berhasil, ${data.dilewati} dilewati, ${data.gagal} gagal`
      );
      // Invalidate produk lists
      queryClient.invalidateQueries({ queryKey: ["produk"] });
      queryClient.invalidateQueries({ queryKey: ["produk-list"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Gagal mengimport data");
    },
  });
};
