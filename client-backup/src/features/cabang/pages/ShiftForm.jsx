import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { useAuth } from "@features/auth/hooks/useAuth.js";
import api from "@common/utils/api";
import CabangIndicator from "@features/cabang/components/CabangIndicator";
import formatCurrency from "@common/utils/formatCurrency";
import formatDate from "@common/utils/formatDate";

const ShiftForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // If we have an ID, it's for closing a shift
  const { selectedCabang } = useCabang();
  const { user } = useAuth();

  const isClosingShift = !!id;

  // Form state
  const [formData, setFormData] = useState({
    userId: user?.id || "",
    cabangId: selectedCabang?.id || "",
    kasAwal: "",
    kasAkhir: "",
    keterangan: "",
  });

  // Additional state
  const [shift, setShift] = useState(null);
  const [isLoading, setIsLoading] = useState(isClosingShift);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeShifts, setActiveShifts] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalTransaksi: 0,
    totalPendapatan: 0,
    expectedCash: 0,
  });

  // Fetch shift data if closing a shift
  useEffect(() => {
    if (!isClosingShift || !selectedCabang?.id) return;

    const fetchShiftData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/shifts/${id}`);
        const shiftData = response.data.data;

        setShift(shiftData);
        setSummaryData({
          totalTransaksi: shiftData.totalTransaksi || 0,
          totalPendapatan: shiftData.totalPendapatan || 0,
          expectedCash: shiftData.kasAwal + (shiftData.totalPendapatan || 0),
        });

        setFormData((prev) => ({
          ...prev,
          userId: shiftData.userId,
          cabangId: shiftData.cabangId,
          kasAwal: shiftData.kasAwal,
          kasAkhir: summaryData.expectedCash,
        }));

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching shift:", error);
        setIsLoading(false);
      }
    };

    fetchShiftData();
  }, [id, selectedCabang?.id, isClosingShift]);

  // Check for active shifts when opening a new one
  useEffect(() => {
    if (isClosingShift || !selectedCabang?.id) return;

    const fetchActiveShifts = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/shifts/active`, {
          params: {
            cabangId: selectedCabang.id,
            limit: 100,
          },
        });

        setActiveShifts(response.data.data || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching active shifts:", error);
        setIsLoading(false);
      }
    };

    fetchActiveShifts();
  }, [selectedCabang?.id, isClosingShift]);

  const validateForm = () => {
    const newErrors = {};

    // Validation for opening shift
    if (!isClosingShift) {
      if (!formData.kasAwal || formData.kasAwal <= 0) {
        newErrors.kasAwal = "Kas awal harus diisi dengan nilai lebih dari 0";
      }

      if (
        activeShifts.some(
          (shift) => shift.userId === user?.id && shift.status === "dibuka"
        )
      ) {
        newErrors.general =
          "Anda sudah memiliki shift aktif yang belum ditutup";
      }
    }

    // Validation for closing shift
    if (isClosingShift) {
      if (!formData.kasAkhir || formData.kasAkhir < 0) {
        newErrors.kasAkhir = "Kas akhir harus diisi dengan nilai valid";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "kasAwal" || name === "kasAkhir") {
      // Only allow numbers and decimals
      const numericValue = value.replace(/[^0-9.]/g, "");
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let response;

      if (isClosingShift) {
        // Close shift
        response = await api.post(`/shifts/${id}/close`, {
          kasAkhir: parseFloat(formData.kasAkhir),
          keterangan: formData.keterangan,
        });
      } else {
        // Open new shift
        response = await api.post("/shifts", {
          userId: formData.userId,
          cabangId: formData.cabangId,
          kasAwal: parseFloat(formData.kasAwal),
          keterangan: formData.keterangan,
        });
      }

      // Navigate back to shift management
      navigate("/admincabang/shifts/active");
    } catch (error) {
      console.error("Error submitting shift:", error);
      setErrors({
        general:
          error.response?.data?.message ||
          "Terjadi kesalahan. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

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
              {isClosingShift ? "Tutup Shift" : "Buka Shift Baru"}
            </h1>
            <p className="text-sm text-gray-500">
              {isClosingShift
                ? `Tutup shift yang dimulai pada ${formatDate(
                    shift?.waktuMulai
                  )}`
                : `Buka shift baru di ${
                    selectedCabang?.namaCabang || "cabang"
                  }`}
            </p>
          </div>
        </div>
        <CabangIndicator size="lg" />
      </div>

      {errors.general && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>{errors.general}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <Calendar size={18} className="text-indigo-500 mr-2" />
              <h2 className="text-lg font-medium">
                {isClosingShift ? "Informasi Shift" : "Detail Shift Baru"}
              </h2>
            </div>
          </div>

          <div className="p-6">
            {isClosingShift && (
              <>
                {/* Shift Info for Closing */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Kasir
                        </h3>
                        <p className="text-base flex items-center">
                          <User size={16} className="mr-2 text-gray-500" />
                          {shift?.user?.namaLengkap ||
                            user?.namaLengkap ||
                            "Tidak tersedia"}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Waktu Mulai
                        </h3>
                        <p className="text-base flex items-center">
                          <Clock size={16} className="mr-2 text-green-500" />
                          {formatDate(shift?.waktuMulai)}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Durasi
                        </h3>
                        <p className="text-base flex items-center">
                          <Clock size={16} className="mr-2 text-gray-500" />
                          {shift?.waktuMulai
                            ? calculateDuration(shift.waktuMulai, new Date())
                            : "Tidak tersedia"}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Kas Awal
                        </h3>
                        <p className="text-base flex items-center">
                          <DollarSign
                            size={16}
                            className="mr-2 text-gray-500"
                          />
                          {formatCurrency(shift?.kasAwal || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-l border-gray-200 pl-6">
                    <h3 className="font-medium text-gray-700 mb-4">
                      Ringkasan Transaksi
                    </h3>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Transaksi</span>
                        <div className="flex items-center">
                          <ShoppingCart
                            size={16}
                            className="mr-2 text-indigo-500"
                          />
                          <span className="font-medium">
                            {summaryData.totalTransaksi}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Pendapatan</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(summaryData.totalPendapatan)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-gray-600">Kas Awal</span>
                        <span className="font-medium">
                          {formatCurrency(shift?.kasAwal || 0)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          Total Kas Seharusnya
                        </span>
                        <span className="font-medium">
                          {formatCurrency(summaryData.expectedCash)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-4">
              {!isClosingShift && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kas Awal <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={16} className="text-gray-500" />
                    </div>
                    <input
                      type="text"
                      name="kasAwal"
                      value={formData.kasAwal}
                      onChange={handleInputChange}
                      className={`pl-10 w-full px-3 py-2 border ${
                        errors.kasAwal ? "border-red-300" : "border-gray-300"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.kasAwal && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.kasAwal}
                    </p>
                  )}
                </div>
              )}

              {isClosingShift && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kas Akhir Aktual <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={16} className="text-gray-500" />
                    </div>
                    <input
                      type="text"
                      name="kasAkhir"
                      value={formData.kasAkhir}
                      onChange={handleInputChange}
                      className={`pl-10 w-full px-3 py-2 border ${
                        errors.kasAkhir ? "border-red-300" : "border-gray-300"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.kasAkhir && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.kasAkhir}
                    </p>
                  )}

                  {isClosingShift && formData.kasAkhir && (
                    <div className="mt-2">
                      <p className="text-sm flex items-center">
                        <span className="mr-2">Selisih:</span>
                        <span
                          className={`font-medium ${
                            parseFloat(formData.kasAkhir) >
                            summaryData.expectedCash
                              ? "text-green-600"
                              : parseFloat(formData.kasAkhir) <
                                summaryData.expectedCash
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {parseFloat(formData.kasAkhir) -
                            summaryData.expectedCash >
                          0
                            ? "+"
                            : ""}
                          {formatCurrency(
                            parseFloat(formData.kasAkhir) -
                              summaryData.expectedCash
                          )}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keterangan
                </label>
                <textarea
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={
                    isClosingShift
                      ? "Masukkan keterangan atau alasan selisih kas (jika ada)"
                      : "Masukkan catatan tambahan (opsional)"
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
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 flex items-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Memproses...</span>
              </div>
            ) : (
              <>
                {isClosingShift ? (
                  <CheckSquare size={16} className="mr-2" />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                {isClosingShift ? "Tutup Shift" : "Buka Shift"}
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
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffInMs = Math.abs(end - start);

  const hours = Math.floor(diffInMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours} jam ${minutes} menit`;
};

export default ShiftForm;
