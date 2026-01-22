import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, CreditCard, DollarSign } from "lucide-react";
import { toast } from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import transaksiService from "../../services/transaksiService";
import { formatCurrency } from "../../utils/format";
import Spinner from "../../features/common/Spinner";

// Schema validasi
const paymentFormSchema = z.object({
  metode_pembayaran: z.string().min(1, "Metode pembayaran wajib dipilih"),
  provider: z.string().optional(),
  nomor_referensi: z.string().optional(),
  jumlah_bayar: z.number().positive("Jumlah pembayaran harus lebih dari 0"),
  keterangan: z.string().optional(),
});

const PaymentForm = ({ transactionId, totalAmount, onClose, onSuccess }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      metode_pembayaran: "TUNAI",
      provider: "",
      nomor_referensi: "",
      jumlah_bayar: parseFloat(totalAmount) || 0,
      keterangan: "",
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: (data) => transaksiService.addPayment(data),
    onSuccess: () => {
      toast.success("Pembayaran berhasil ditambahkan");
      queryClient.invalidateQueries(["transaction", transactionId]);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(
        `Gagal menambahkan pembayaran: ${error.message || "Terjadi kesalahan"}`
      );
    },
  });

  const watchMetodePembayaran = watch("metode_pembayaran");
  const needsProvider = ["KARTU_DEBIT", "KARTU_KREDIT", "E_WALLET"].includes(
    watchMetodePembayaran
  );
  const needsReference = [
    "KARTU_DEBIT",
    "KARTU_KREDIT",
    "TRANSFER",
    "QRIS",
    "E_WALLET",
  ].includes(watchMetodePembayaran);

  const onSubmit = (data) => {
    const paymentData = {
      ...data,
      transaksi_id: transactionId,
      tanggal_pembayaran: new Date().toISOString(),
    };

    addPaymentMutation.mutate(paymentData);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-indigo-500" />
              Tambah Pembayaran
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Metode Pembayaran */}
            <div>
              <label
                htmlFor="metode_pembayaran"
                className="block text-sm font-medium text-gray-700"
              >
                Metode Pembayaran <span className="text-red-500">*</span>
              </label>
              <select
                id="metode_pembayaran"
                {...register("metode_pembayaran")}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="TUNAI">Tunai</option>
                <option value="KARTU_DEBIT">Kartu Debit</option>
                <option value="KARTU_KREDIT">Kartu Kredit</option>
                <option value="TRANSFER">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
                <option value="E_WALLET">E-Wallet</option>
              </select>
              {errors.metode_pembayaran && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.metode_pembayaran.message}
                </p>
              )}
            </div>

            {/* Provider (untuk kartu & e-wallet) */}
            {needsProvider && (
              <div>
                <label
                  htmlFor="provider"
                  className="block text-sm font-medium text-gray-700"
                >
                  Provider
                </label>
                <input
                  type="text"
                  id="provider"
                  {...register("provider")}
                  placeholder={
                    watchMetodePembayaran === "KARTU_DEBIT" ||
                    watchMetodePembayaran === "KARTU_KREDIT"
                      ? "Contoh: BCA, Mandiri, BNI"
                      : "Contoh: GoPay, OVO, Dana"
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            )}

            {/* Nomor Referensi */}
            {needsReference && (
              <div>
                <label
                  htmlFor="nomor_referensi"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nomor Referensi
                </label>
                <input
                  type="text"
                  id="nomor_referensi"
                  {...register("nomor_referensi")}
                  placeholder="Nomor referensi transaksi"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            )}

            {/* Jumlah Bayar */}
            <div>
              <label
                htmlFor="jumlah_bayar"
                className="block text-sm font-medium text-gray-700"
              >
                Jumlah Pembayaran <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">Rp</span>
                </div>
                <input
                  type="number"
                  id="jumlah_bayar"
                  {...register("jumlah_bayar", { valueAsNumber: true })}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md py-2"
                  placeholder="0.00"
                />
              </div>
              {errors.jumlah_bayar && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.jumlah_bayar.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Total transaksi: {formatCurrency(totalAmount)}
              </p>
            </div>

            {/* Keterangan */}
            <div>
              <label
                htmlFor="keterangan"
                className="block text-sm font-medium text-gray-700"
              >
                Keterangan (Opsional)
              </label>
              <textarea
                id="keterangan"
                {...register("keterangan")}
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Tambahkan keterangan tentang pembayaran ini"
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="submit"
                disabled={isSubmitting || addPaymentMutation.isLoading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-indigo-300"
              >
                {isSubmitting || addPaymentMutation.isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Proses Pembayaran
                  </>
                )}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                onClick={onClose}
                disabled={isSubmitting || addPaymentMutation.isLoading}
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;
