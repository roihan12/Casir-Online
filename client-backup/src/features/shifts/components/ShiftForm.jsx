import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  DollarSign,
  Clock,
  CheckSquare,
  User,
  Calendar,
  ShoppingCart,
} from "lucide-react";
import { useCabang } from "@features/cabang/hooks/useCabang";
import { useAuth } from "@features/auth/hooks/useAuth";
import { 
  useOpenShift, 
  useCloseShift, 
  useShiftDetail, 
  useActiveShift,
  useAdjustShift
} from "../hooks/useShiftQueries";
import { openShiftSchema, closeShiftSchema } from "../validation/shiftSchema";
import CabangIndicator from "@features/cabang/components/CabangIndicator";
import formatCurrency from "@common/utils/formatCurrency";
import formatDate from "@common/utils/formatDate";

const ShiftForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user } = useAuth();
  const { selectedCabang } = useCabang();

  const isClosingShift = !!id && location.pathname.includes("/close");
  const isAdjustingShift = !!id && location.pathname.includes("/adjust");

  // Mutations
  const { mutate: openShift, isPending: isOpening } = useOpenShift();
  const { mutate: closeShift, isPending: isClosing } = useCloseShift();
  const { mutate: adjustShift, isPending: isAdjusting } = useAdjustShift();

  // Queries
  const { data: shiftDetail, isLoading: isLoadingDetail } = useShiftDetail(id);
  const { data: activeShiftData } = useActiveShift(user?.id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isClosingShift || isAdjustingShift ? closeShiftSchema : openShiftSchema),
    defaultValues: {
      userId: user?.id || "",
      cabangId: selectedCabang?.id || "",
      kasAwal: 0,
      kasAkhir: 0,
      keterangan: "",
    },
  });

  const kasAkhirProgress = watch("kasAkhir");

  // Populate form if closing shift
  useEffect(() => {
    if ((isClosingShift || isAdjustingShift) && shiftDetail?.data) {
      const shiftData = shiftDetail.data;
      const expected = Number(shiftData.kasAwal) + (Number(shiftData.totalPendapatan) || 0);
      setValue("kasAkhir", expected);
      setValue("keterangan", shiftData.keterangan || "");
    }
  }, [isClosingShift, shiftDetail, setValue]);

  // Handle errors and pre-checks
  const hasAlreadyActiveShift = !isClosingShift && activeShiftData?.data;

  const onFormSubmit = (data) => {
    if (isClosingShift) {
      closeShift(
        { shiftId: id, ...data },
        {
          onSuccess: () => navigate("/shifts/active"),
        }
      );
    } else if (isAdjustingShift) {
      adjustShift(
        { shiftId: id, ...data },
        {
          onSuccess: () => navigate(`/shifts/detail/${id}`),
        }
      );
    } else {
      openShift(
        { ...data, cabangId: selectedCabang.id, userId: user.id },
        {
          onSuccess: () => navigate("/shifts/active"),
        }
      );
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const isLoading = (isClosingShift || isAdjustingShift) && isLoadingDetail;
  const isSubmitting = isOpening || isClosing || isAdjusting;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  const shift = shiftDetail?.data;
  const expectedCash = shift ? Number(shift.kasAwal) + (Number(shift.totalPendapatan) || 0) : 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={handleCancel}
            className="mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              {isClosingShift ? "Tutup Shift" : isAdjustingShift ? "Sesuaikan Shift" : "Buka Shift Baru"}
            </h1>
            <p className="text-sm text-gray-500">
              {isClosingShift
                ? `Tutup shift yang dimulai pada ${formatDate(shift?.waktuMulai)}`
                : isAdjustingShift
                ? `Sesuaikan laporan kas untuk shift ${formatDate(shift?.waktuMulai)}`
                : `Buka shift baru di ${selectedCabang?.namaCabang || "cabang"}`}
            </p>
          </div>
        </div>
        <CabangIndicator size="lg" />
      </div>

      {hasAlreadyActiveShift && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>Anda sudah memiliki shift aktif yang sedang berjalan. Tutup shift tersebut terlebih dahulu jika ingin membuka yang baru.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <Calendar size={18} className="text-indigo-500 mr-2" />
              <h2 className="text-lg font-medium">
                {(isClosingShift || isAdjustingShift) ? "Informasi Lacak Kas" : "Detail Shift Baru"}
              </h2>
            </div>
          </div>

          <div className="p-6">
            {(isClosingShift || isAdjustingShift) && shift && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-b border-gray-100 pb-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Kasir</h3>
                    <p className="text-base flex items-center">
                      <User size={16} className="mr-2 text-gray-500" />
                      {shift.user?.namaLengkap || "Tidak tersedia"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        {isAdjustingShift ? "Waktu Selesai" : "Waktu Mulai"}
                      </h3>
                      <p className="text-base flex items-center">
                        <Clock size={16} className="mr-2 text-green-500" />
                        {isAdjustingShift ? formatDate(shift.waktuSelesai) : formatDate(shift.waktuMulai)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Durasi</h3>
                      <p className="text-base flex items-center">
                        <Clock size={16} className="mr-2 text-gray-500" />
                        {calculateDuration(shift.waktuMulai, new Date())}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <DollarSign size={16} className="mr-2 text-indigo-500" />
                    Ringkasan Kas
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kas Awal</span>
                      <span className="font-medium">{formatCurrency(shift.kasAwal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">
                        Total Penjualan Selama Shift ({shift.totalTransaksi || 0} txn)
                      </span>
                      <span className="font-bold text-green-600">+{formatCurrency(shift.totalPendapatan || 0)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                      <span className="text-gray-900 font-bold">Harus Ada di Kas</span>
                      <span className="text-lg font-bold text-indigo-600">{formatCurrency(expectedCash)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="max-w-xl space-y-6">
              {!isClosingShift && !isAdjustingShift && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Kas Awal <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      {...register("kasAwal")}
                      className={`pl-10 w-full px-4 py-2.5 border ${
                        errors.kasAwal ? "border-red-300 ring-red-50" : "border-gray-300 focus:ring-indigo-50"
                      } rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all`}
                    />
                  </div>
                  {errors.kasAwal && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" /> {errors.kasAwal.message}
                    </p>
                  )}
                </div>
              )}
              {(isClosingShift || isAdjustingShift) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Kas Akhir (Aktual) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      {...register("kasAkhir")}
                      className={`pl-10 w-full px-4 py-2.5 border ${
                        errors.kasAkhir ? "border-red-300 ring-red-50" : "border-gray-300 focus:ring-indigo-50"
                      } rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all`}
                    />
                  </div>
                  {errors.kasAkhir && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" /> {errors.kasAkhir.message}
                    </p>
                  )}

                  <div className="mt-3 p-3 rounded-lg bg-indigo-50/50 flex items-center justify-between text-sm">
                    <span className="text-indigo-700 font-medium">Selisih Kas:</span>
                    <span className={`font-bold ${
                      Number(kasAkhirProgress) > expectedCash 
                        ? "text-green-600" 
                        : Number(kasAkhirProgress) < expectedCash 
                        ? "text-red-600" 
                        : "text-indigo-600"
                    }`}>
                      {Number(kasAkhirProgress) - expectedCash > 0 ? "+" : ""}
                      {formatCurrency(Number(kasAkhirProgress) - expectedCash)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keterangan {isClosingShift && "(Opsional)"}
                </label>
                <textarea
                  {...register("keterangan")}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  placeholder={
                    isClosingShift
                      ? "Jelaskan jika ada selisih kas atau catatan penutupan lainnya..."
                      : "Catatan awal shift (misal: kondisi laci kas)"
                  }
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-8 py-2.5 bg-indigo-600 rounded-xl text-sm font-semibold text-white hover:bg-indigo-700 flex items-center shadow-lg shadow-indigo-200 disabled:opacity-70 transition-all"
            disabled={isSubmitting || (hasAlreadyActiveShift)}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                {isClosingShift || isAdjustingShift ? (
                  <CheckSquare size={18} className="mr-2" />
                ) : (
                  <Save size={18} className="mr-2" />
                )}
                {isClosingShift ? "Konfirmasi & Tutup" : isAdjustingShift ? "Simpan Perubahan" : "Mulai Shift"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Helper function to calculate duration
const calculateDuration = (startDate, endDate) => {
  if (!startDate) return "-";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffInMs = Math.abs(end - start);

  const hours = Math.floor(diffInMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours} jam ${minutes} menit`;
};

export default ShiftForm;
