import React, { useState, useEffect } from "react";
import { Save, Info, AlertTriangle, Check, X, Copy } from "lucide-react";
import { toast } from "react-hot-toast";
import { useCabang } from "@features/cabang/hooks/useCabang";
import {
  useTaxConfig,
  useUpdateTaxConfig,
  useUpdateTaxConfigBulk,
} from "../hooks/useTaxSettings";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GLOBAL_CABANG_ID } from "@features/cabang/context/CabangContext";

// Zod schema for validation
const taxConfigSchema = z.object({
  is_tax_enabled: z.boolean(),
  tax_percentage: z.coerce
    .number()
    .min(0, "Persentase pajak tidak boleh kurang dari 0")
    .max(100, "Persentase pajak tidak boleh lebih dari 100"),
  tax_name: z
    .string()
    .min(1, "Nama pajak harus diisi")
    .max(50, "Nama pajak maksimal 50 karakter"),
  tax_number: z
    .string()
    .max(100, "Nomor pajak maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
  is_tax_included: z.boolean(),
});

const TaxSettings = () => {
  const { cabangList, selectedCabang: globalSelectedCabang, canSwitchCabang } =
    useCabang();
  
  // Local state for selected branch in this page
  // Initialize with global selected branch, but handle global view case
  const [localSelectedCabangId, setLocalSelectedCabangId] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [targetCabangIds, setTargetCabangIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (globalSelectedCabang) {
      // If global view is selected, try to select the first real branch
      if (globalSelectedCabang.id === GLOBAL_CABANG_ID) {
        const firstRealCabang = cabangList.find(
          (c) => c.id !== GLOBAL_CABANG_ID
        );
        if (firstRealCabang) {
          setLocalSelectedCabangId(firstRealCabang.id);
        }
      } else {
        setLocalSelectedCabangId(globalSelectedCabang.id);
      }
    }
  }, [globalSelectedCabang, cabangList]);

  // Derived state for the actual branch object being viewed
  const activeCabang = cabangList.find((c) => c.id === localSelectedCabangId);

  // React Query hooks
  const {
    data: taxConfigData,
    isLoading: loading,
    isError,
    error,
  } = useTaxConfig(localSelectedCabangId);

  const updateTaxConfigMutation = useUpdateTaxConfig();
  const updateTaxConfigBulkMutation = useUpdateTaxConfigBulk();

  // React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(taxConfigSchema),
    defaultValues: {
      is_tax_enabled: false,
      tax_percentage: 0,
      tax_name: "PPN",
      tax_number: "",
      is_tax_included: false,
    },
  });

  // Watch for is_tax_enabled to disable fields
  const isTaxEnabled = watch("is_tax_enabled");

  // Reset form when data is loaded
  useEffect(() => {
    if (taxConfigData) {
      reset(taxConfigData);
    }
  }, [taxConfigData, reset]);

  // Handle Loading & Error states
  if (isError) {
    console.error("Error fetching tax settings:", error);
    toast.error("Gagal mengambil pengaturan pajak");
  }

  const onSubmit = (data) => {
    if (!localSelectedCabangId) return;

    updateTaxConfigMutation.mutate(
      { cabangId: localSelectedCabangId, data },
      {
        onSuccess: () => {
          toast.success("Pengaturan pajak berhasil disimpan");
        },
        onError: (error) => {
          console.error("Error saving tax settings:", error);
          toast.error(
            error.response?.data?.message || "Gagal menyimpan pengaturan pajak"
          );
        },
      }
    );
  };

  const handleBulkUpdate = () => {
    if (targetCabangIds.length === 0) {
      toast.error("Pilih setidaknya satu cabang tujuan");
      return;
    }

    const currentConfig = getValues();

    updateTaxConfigBulkMutation.mutate(
      {
        targetCabangIds,
        config: currentConfig,
      },
      {
        onSuccess: (data) => {
          toast.success(
            `Pengaturan berhasil diterapkan ke ${data.data.length} cabang`
          );
          setShowBulkModal(false);
          setTargetCabangIds([]);
          setSelectAll(false);
        },
        onError: (error) => {
          console.error("Error bulk updating tax settings:", error);
          toast.error(
            error.response?.data?.message ||
              "Gagal menerapkan pengaturan ke cabang lain"
          );
        },
      }
    );
  };

  const toggleCabangSelection = (cabangId) => {
    setTargetCabangIds((prev) => {
      if (prev.includes(cabangId)) {
        return prev.filter((id) => id !== cabangId);
      } else {
        return [...prev, cabangId];
      }
    });
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      // Select all branches except the currently active one and global
      const allIds = cabangList
        .filter(
          (c) => c.id !== localSelectedCabangId && c.id !== GLOBAL_CABANG_ID
        )
        .map((c) => c.id);
      setTargetCabangIds(allIds);
    } else {
      setTargetCabangIds([]);
    }
  };

  // Filter branches for bulk list (exclude current and global)
  const availableBranchesForBulk = cabangList.filter(
    (c) => c.id !== localSelectedCabangId && c.id !== GLOBAL_CABANG_ID
  );

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Pengaturan Pajak</h1>
        
        {/* Branch Selector */}
        {canSwitchCabang && (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Cabang:</span>
            <select
              value={localSelectedCabangId}
              onChange={(e) => setLocalSelectedCabangId(e.target.value)}
              className="border border-gray-300 rounded-md shadow-sm px-3 py-1.5 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled={loading || updateTaxConfigMutation.isPending}
            >
              {cabangList
                .filter((c) => c.id !== GLOBAL_CABANG_ID)
                .map((cabang) => (
                  <option key={cabang.id} value={cabang.id}>
                    {cabang.namaCabang}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
            <Info
              className="text-blue-500 mr-3 mt-0.5 flex-shrink-0"
              size={20}
            />
            <div>
              <h3 className="font-semibold text-blue-700">
                Informasi Pengaturan Pajak
              </h3>
              <p className="text-blue-600 text-sm mt-1">
                Pengaturan ini akan memengaruhi perhitungan pajak pada seluruh
                transaksi di cabang <strong>{activeCabang?.namaCabang}</strong>.
                Pastikan informasi pajak yang dimasukkan sesuai dengan peraturan
                perpajakan yang berlaku.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Enable Tax Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-gray-800 font-medium block">
                    Aktifkan Pajak
                  </label>
                  <p className="text-sm text-gray-500">
                    Pajak akan diterapkan pada setiap transaksi
                  </p>
                </div>
                <div className="relative inline-block w-12 align-middle select-none">
                  <Controller
                    name="is_tax_enabled"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <>
                        <input
                          type="checkbox"
                          id="is_tax_enabled"
                          checked={value}
                          onChange={(e) => onChange(e.target.checked)}
                          className="hidden"
                        />
                        <label
                          htmlFor="is_tax_enabled"
                          className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                            value ? "bg-indigo-500" : ""
                          }`}
                        >
                          <span
                            className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ease-in ${
                              value ? "translate-x-6" : "translate-x-0"
                            }`}
                          ></span>
                        </label>
                      </>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Tax Percentage */}
            <div className="mb-6">
              <label
                htmlFor="tax_percentage"
                className="text-gray-800 font-medium block mb-2"
              >
                Persentase Pajak (%)
              </label>
              <Controller
                name="tax_percentage"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    id="tax_percentage"
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={!isTaxEnabled}
                    className={`w-full border ${
                      !isTaxEnabled
                        ? "bg-gray-100 border-gray-200"
                        : errors.tax_percentage
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400`}
                  />
                )}
              />
              {errors.tax_percentage ? (
                <p className="text-sm text-red-500 mt-1">
                  {errors.tax_percentage.message}
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  Masukkan persentase pajak (e.g., 11 untuk 11%)
                </p>
              )}
            </div>

            {/* Tax Name */}
            <div className="mb-6">
              <label
                htmlFor="tax_name"
                className="text-gray-800 font-medium block mb-2"
              >
                Nama Pajak
              </label>
              <Controller
                name="tax_name"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    id="tax_name"
                    disabled={!isTaxEnabled}
                    className={`w-full border ${
                      !isTaxEnabled
                        ? "bg-gray-100 border-gray-200"
                        : errors.tax_name
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400`}
                    placeholder="Contoh: PPN, PPh, dll."
                  />
                )}
              />
              {errors.tax_name ? (
                <p className="text-sm text-red-500 mt-1">
                  {errors.tax_name.message}
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  Nama pajak yang akan ditampilkan pada struk dan faktur
                </p>
              )}
            </div>

            {/* Tax Number */}
            <div className="mb-6">
              <label
                htmlFor="tax_number"
                className="text-gray-800 font-medium block mb-2"
              >
                Nomor NPWP
              </label>
              <Controller
                name="tax_number"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    id="tax_number"
                    disabled={!isTaxEnabled}
                    className={`w-full border ${
                      !isTaxEnabled
                        ? "bg-gray-100 border-gray-200"
                        : errors.tax_number
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400`}
                    placeholder="Contoh: 01.234.567.8-123.000"
                  />
                )}
              />
              {errors.tax_number ? (
                <p className="text-sm text-red-500 mt-1">
                  {errors.tax_number.message}
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  NPWP yang akan ditampilkan pada faktur pajak
                </p>
              )}
            </div>

            {/* Tax Included Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-gray-800 font-medium block">
                    Harga Sudah Termasuk Pajak
                  </label>
                  <p className="text-sm text-gray-500">
                    Jika diaktifkan, harga yang ditampilkan sudah termasuk pajak
                  </p>
                </div>
                <div className="relative inline-block w-12 align-middle select-none">
                  <Controller
                    name="is_tax_included"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <>
                        <input
                          type="checkbox"
                          id="is_tax_included"
                          checked={value}
                          onChange={(e) => onChange(e.target.checked)}
                          disabled={!isTaxEnabled}
                          className="hidden"
                        />
                        <label
                          htmlFor="is_tax_included"
                          className={`block overflow-hidden h-6 rounded-full ${
                            !isTaxEnabled
                              ? "bg-gray-200 cursor-not-allowed"
                              : "bg-gray-300 cursor-pointer"
                          } ${
                            value && isTaxEnabled ? "bg-indigo-500" : ""
                          }`}
                        >
                          <span
                            className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ease-in ${
                              value && isTaxEnabled
                                ? "translate-x-6"
                                : "translate-x-0"
                            }`}
                          ></span>
                        </label>
                      </>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Warning for tax change */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
              <AlertTriangle
                className="text-yellow-500 mr-3 mt-0.5 flex-shrink-0"
                size={20}
              />
              <div>
                <h3 className="font-semibold text-yellow-700">Perhatian</h3>
                <p className="text-yellow-600 text-sm mt-1">
                  Perubahan pada pengaturan pajak akan memengaruhi seluruh
                  transaksi baru. Transaksi yang sudah ada tidak akan
                  terpengaruh.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              {canSwitchCabang && availableBranchesForBulk.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <Copy className="mr-2" size={18} />
                  Terapkan ke Cabang Lain
                </button>
              )}

              <button
                type="submit"
                disabled={updateTaxConfigMutation.isPending}
                className={`flex items-center px-6 py-2 rounded-lg ${
                  updateTaxConfigMutation.isPending
                    ? "bg-gray-400"
                    : "bg-indigo-600 hover:bg-indigo-700"
                } text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 ml-auto`}
              >
                {updateTaxConfigMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={18} />
                    <span>Simpan Pengaturan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Terapkan Pengaturan ke Cabang Lain
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                Pilih cabang yang ingin Anda terapkan pengaturan pajak yang sama
                seperti cabang <strong>{activeCabang?.namaCabang}</strong>.
              </p>
              
              <div className="flex items-center mb-4 pb-2 border-b border-gray-100">
                <input
                  type="checkbox"
                  id="select_all"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label
                  htmlFor="select_all"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Pilih Semua Cabang
                </label>
              </div>
              
              <div className="space-y-2">
                {availableBranchesForBulk.map((cabang) => (
                  <div key={cabang.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`cabang_${cabang.id}`}
                      checked={targetCabangIds.includes(cabang.id)}
                      onChange={() => toggleCabangSelection(cabang.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <label
                      htmlFor={`cabang_${cabang.id}`}
                      className="ml-2 block text-sm text-gray-700"
                    >
                      {cabang.namaCabang}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Batal
              </button>
              <button
                onClick={handleBulkUpdate}
                disabled={
                  targetCabangIds.length === 0 ||
                  updateTaxConfigBulkMutation.isPending
                }
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  targetCabangIds.length === 0 ||
                  updateTaxConfigBulkMutation.isPending
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {updateTaxConfigBulkMutation.isPending
                  ? "Menerapkan..."
                  : "Terapkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TaxSettings;
