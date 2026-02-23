import { useMutation, useQueryClient } from "@tanstack/react-query";
import importProdukMasterService from "../services/importProdukMasterService";
import { toast } from "react-hot-toast";

/**
 * Hook untuk download template Excel ProdukMaster
 */
export const useDownloadProdukMasterTemplate = () => {
  return useMutation({
    mutationFn: () => importProdukMasterService.downloadTemplate(),
    onSuccess: () => {
      toast.success("Template berhasil diunduh");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Gagal mengunduh template");
    },
  });
};

/**
 * Hook untuk preview import ProdukMaster (dry-run)
 */
export const usePreviewImportProdukMaster = () => {
  return useMutation({
    mutationFn: (file) => importProdukMasterService.previewImport(file),
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Gagal memproses file");
    },
  });
};

/**
 * Hook untuk eksekusi import ProdukMaster
 */
export const useImportProdukMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file) => importProdukMasterService.importProdukMaster(file),
    onSuccess: (data) => {
      toast.success(
        `Import selesai: ${data.berhasil} berhasil, ${data.dilewati} dilewati, ${data.gagal} gagal`
      );
      // Invalidate produk master list
      queryClient.invalidateQueries({ queryKey: ["produk-master"] });
      queryClient.invalidateQueries({ queryKey: ["produk-master-list"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Gagal mengimport data");
    },
  });
};
