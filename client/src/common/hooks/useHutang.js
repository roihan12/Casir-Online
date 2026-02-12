import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import hutangService from "../services/hutangService";
import { useCabang } from "../features/cabang/hooks/useCabang";

/**
 * Custom hook for managing hutang (debt) operations
 */
export const useHutang = (options = {}) => {
  const queryClient = useQueryClient();
  const { selectedCabang } = useCabang();
  const { supplierId, hutangId, filterParams = {} } = options;

  // Get hutang list with filters
  const {
    data: hutangList,
    isLoading: isLoadingHutangList,
    error: hutangListError,
    refetch: refetchHutangList,
  } = useQuery({
    queryKey: ["hutang", { ...filterParams, cabangId: selectedCabang?.id }],
    queryFn: () =>
      hutangService.getHutangList({
        ...filterParams,
        cabangId: selectedCabang?.id,
      }),
    enabled: !!selectedCabang?.id,
  });

  // Get single hutang by ID
  const {
    data: hutangDetail,
    isLoading: isLoadingHutangDetail,
    error: hutangDetailError,
    refetch: refetchHutangDetail,
  } = useQuery({
    queryKey: ["hutang", hutangId],
    queryFn: () => hutangService.getHutangById(hutangId),
    enabled: !!hutangId,
  });

  // Get supplier hutang summary
  const {
    data: supplierHutangSummary,
    isLoading: isLoadingSupplierHutangSummary,
    error: supplierHutangSummaryError,
    refetch: refetchSupplierHutangSummary,
  } = useQuery({
    queryKey: ["hutang", "supplier-summary", supplierId, selectedCabang?.id],
    queryFn: () =>
      hutangService.getSupplierHutangSummary(supplierId, {
        cabangId: selectedCabang?.id,
      }),
    enabled: !!supplierId && !!selectedCabang?.id,
  });

  // Get supplier hutang list
  const {
    data: supplierHutangList,
    isLoading: isLoadingSupplierHutangList,
    error: supplierHutangListError,
    refetch: refetchSupplierHutangList,
  } = useQuery({
    queryKey: [
      "hutang",
      "supplier",
      supplierId,
      selectedCabang?.id,
      filterParams,
    ],
    queryFn: () =>
      hutangService.getSupplierHutang(supplierId, {
        ...filterParams,
        cabangId: selectedCabang?.id,
      }),
    enabled: !!supplierId && !!selectedCabang?.id,
  });

  // Get hutang payments
  const {
    data: hutangPayments,
    isLoading: isLoadingHutangPayments,
    error: hutangPaymentsError,
    refetch: refetchHutangPayments,
  } = useQuery({
    queryKey: ["hutang", "payments", hutangId],
    queryFn: () => hutangService.getPayments(hutangId),
    enabled: !!hutangId,
  });

  // Mutation for creating a hutang
  const createHutangMutation = useMutation({
    mutationFn: (data) => hutangService.createHutang(data),
    onSuccess: () => {
      toast.success("Hutang berhasil dibuat");
      queryClient.invalidateQueries(["hutang"]);
    },
    onError: (error) => {
      toast.error(
        `Gagal membuat hutang: ${error.message || "Terjadi kesalahan"}`
      );
    },
  });

  // Mutation for updating a hutang
  const updateHutangMutation = useMutation({
    mutationFn: ({ id, data }) => hutangService.updateHutang(id, data),
    onSuccess: () => {
      toast.success("Hutang berhasil diperbarui");
      queryClient.invalidateQueries(["hutang"]);
    },
    onError: (error) => {
      toast.error(
        `Gagal memperbarui hutang: ${error.message || "Terjadi kesalahan"}`
      );
    },
  });

  // Mutation for deleting a hutang
  const deleteHutangMutation = useMutation({
    mutationFn: (id) => hutangService.deleteHutang(id),
    onSuccess: () => {
      toast.success("Hutang berhasil dihapus");
      queryClient.invalidateQueries(["hutang"]);
    },
    onError: (error) => {
      toast.error(
        `Gagal menghapus hutang: ${error.message || "Terjadi kesalahan"}`
      );
    },
  });

  // Mutation for creating a payment
  const createPaymentMutation = useMutation({
    mutationFn: (data) => hutangService.createPayment(data),
    onSuccess: () => {
      toast.success("Pembayaran berhasil ditambahkan");
      queryClient.invalidateQueries(["hutang"]);
    },
    onError: (error) => {
      toast.error(
        `Gagal menambahkan pembayaran: ${error.message || "Terjadi kesalahan"}`
      );
    },
  });

  // Invalidate related queries
  const invalidateHutangQueries = () => {
    queryClient.invalidateQueries(["hutang"]);
  };

  return {
    // Data
    hutangList: hutangList?.data || [],
    hutangPagination: hutangList?.pagination || {},
    hutangDetail: hutangDetail?.data,
    supplierHutangSummary: supplierHutangSummary?.data,
    supplierHutangList: supplierHutangList?.data || [],
    supplierHutangPagination: supplierHutangList?.pagination || {},
    hutangPayments: hutangPayments?.data || [],

    // Loading states
    isLoadingHutangList,
    isLoadingHutangDetail,
    isLoadingSupplierHutangSummary,
    isLoadingSupplierHutangList,
    isLoadingHutangPayments,
    isCreatingHutang: createHutangMutation.isPending,
    isUpdatingHutang: updateHutangMutation.isPending,
    isDeletingHutang: deleteHutangMutation.isPending,
    isCreatingPayment: createPaymentMutation.isPending,

    // Errors
    hutangListError,
    hutangDetailError,
    supplierHutangSummaryError,
    supplierHutangListError,
    hutangPaymentsError,

    // Actions
    createHutang: createHutangMutation.mutate,
    updateHutang: updateHutangMutation.mutate,
    deleteHutang: deleteHutangMutation.mutate,
    createPayment: createPaymentMutation.mutate,
    invalidateHutangQueries,
    refetchHutangList,
    refetchHutangDetail,
    refetchSupplierHutangSummary,
    refetchSupplierHutangList,
    refetchHutangPayments,
  };
};
