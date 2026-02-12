import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import productRequestService from "../services/productRequestService";
import { toast } from "react-hot-toast";

export const useProductRequests = (filters) => {
  return useQuery({
    queryKey: ["product-requests", filters],
    queryFn: () => productRequestService.getRequestList(filters),
  });
};

export const useProductRequest = (id) => {
  return useQuery({
    queryKey: ["product-request", id],
    queryFn: () => productRequestService.getProdukRequestById(id),
    enabled: !!id,
  });
};

export const useCreateProductRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => productRequestService.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-requests"] });
      toast.success("Request produk berhasil dibuat sebagai draft");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal membuat request produk");
    },
  });
};

export const useUpdateProductRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => productRequestService.updateRequest(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-requests"] });
      queryClient.invalidateQueries({ queryKey: ["product-request", variables.id] });
      toast.success("Request produk berhasil diperbarui");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal memperbarui request produk");
    },
  });
};

export const useSubmitProductRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => productRequestService.submitRequest(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["product-requests"] });
      queryClient.invalidateQueries({ queryKey: ["product-request", id] });
      toast.success("Request produk telah dikirim");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal mengirim request produk");
    },
  });
};

export const useProcessProductRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isApproved, catatan }) => 
      productRequestService.processRequest(id, { isApproved, catatan }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-requests"] });
      queryClient.invalidateQueries({ queryKey: ["product-request", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["produk-master"] }); // Invalidate products as they might be created/updated
      
      if (variables.isApproved) {
        toast.success("Request produk telah disetujui");
      } else {
        toast.error("Request produk telah ditolak");
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal memproses request produk");
    },
  });
};

export const useCompleteProductRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => productRequestService.completeRequest(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["product-requests"] });
      queryClient.invalidateQueries({ queryKey: ["product-request", id] });
      toast.success("Request produk telah ditandai selesai");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal memproses request produk");
    },
  });
};

export const useDeleteProductRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => productRequestService.deleteRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-requests"] });
      toast.success("Request produk telah dihapus");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal menghapus request produk");
    },
  });
};

export const useProductRequestAnalytics = (params) => {
  return useQuery({
    queryKey: ["product-request-analytics", params],
    queryFn: () => productRequestService.getAnalytics(params),
  });
};
