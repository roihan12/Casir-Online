import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Save,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Percent,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Plus,
  Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import discountConfigService from "../../../services/discountConfigService";
import { useCabang } from "../../../features/cabang/hooks/useCabang";
import api from "../../../services/api";

const DiscountConfigPage = () => {
  const queryClient = useQueryClient();
  const { selectedCabang } = useCabang();
  const [editingId, setEditingId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    cabangId: null,
    enableMemberDiscount: true,
    memberDiscountType: "PERCENTAGE",
    discountSegmen: { vip: 10, grosir: 5, member: 3, retail: 0 },
    maxManualDiscountPersen: 50,
    maxManualDiscountNominal: 500000,
    minTransactionForDiscount: 100000,
    allowCombineWithPromo: false,
    isActive: true,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);

  // Fetch all discount configs
  const { data: configsData, isLoading } = useQuery({
    queryKey: ["discount-configs"],
    queryFn: async () => {
      const response = await discountConfigService.getAllDiscountConfigs();
      return response.data || [];
    },
    staleTime: 30000,
  });

  // Fetch cabang list for dropdown
  const { data: cabangList } = useQuery({
    queryKey: ["cabang-list"],
    queryFn: async () => {
      const response = await api.get("/cabang");
      return response.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const configs = configsData || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => discountConfigService.createDiscountConfig(data),
    onSuccess: () => {
      toast.success("Konfigurasi diskon berhasil dibuat");
      setShowCreateForm(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["discount-configs"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal membuat konfigurasi");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) =>
      discountConfigService.updateDiscountConfig(id, data),
    onSuccess: () => {
      toast.success("Konfigurasi berhasil diperbarui");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["discount-configs"] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Gagal memperbarui konfigurasi"
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => discountConfigService.deleteDiscountConfig(id),
    onSuccess: () => {
      toast.success("Konfigurasi berhasil dihapus");
      setShowDeleteModal(false);
      setSelectedConfig(null);
      queryClient.invalidateQueries({ queryKey: ["discount-configs"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal menghapus konfigurasi");
    },
  });

  const resetForm = () => {
    setFormData({
      cabangId: null,
      enableMemberDiscount: true,
      memberDiscountType: "PERCENTAGE",
      discountSegmen: { vip: 10, grosir: 5, member: 3, retail: 0 },
      maxManualDiscountPersen: 50,
      maxManualDiscountNominal: 500000,
      minTransactionForDiscount: 100000,
      allowCombineWithPromo: false,
      isActive: true,
    });
  };

  const handleEdit = (config) => {
    setEditingId(config.id);
    setFormData({
      cabangId: config.cabangId,
      enableMemberDiscount: config.enableMemberDiscount,
      memberDiscountType: config.memberDiscountType,
      discountSegmen: config.discountSegmen || {
        vip: 10,
        grosir: 5,
        member: 3,
        retail: 0,
      },
      maxManualDiscountPersen: config.maxManualDiscountPersen || 50,
      maxManualDiscountNominal: config.maxManualDiscountNominal || 500000,
      minTransactionForDiscount: config.minTransactionForDiscount || 100000,
      allowCombineWithPromo: config.allowCombineWithPromo,
      isActive: config.isActive,
    });
  };

  const handleSave = async (configId = null) => {
    if (configId) {
      updateMutation.mutate({ id: configId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleSegmenChange = (segmen, value) => {
    setFormData((prev) => ({
      ...prev,
      discountSegmen: {
        ...prev.discountSegmen,
        [segmen]: parseFloat(value) || 0,
      },
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const confirmDelete = (config) => {
    setSelectedConfig(config);
    setShowDeleteModal(true);
  };

  const segmenLabels = {
    vip: { label: "VIP", color: "bg-yellow-500" },
    grosir: { label: "Grosir", color: "bg-blue-500" },
    member: { label: "Member", color: "bg-green-500" },
    retail: { label: "Retail", color: "bg-gray-500" },
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="text-indigo-600" />
            Konfigurasi Diskon Member
          </h1>
          <p className="text-gray-500 mt-1">
            Atur diskon berdasarkan segmen pelanggan dan batasan manual
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateForm(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Tambah Konfigurasi
        </button>
      </div>

      {/* Create Form Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Buat Konfigurasi Baru</h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Cabang Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cabang (kosongkan untuk konfigurasi global)
                  </label>
                  <select
                    value={formData.cabangId || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cabangId: e.target.value || null,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Global (Semua Cabang)</option>
                    {cabangList?.map((cabang) => (
                      <option key={cabang.cabangId} value={cabang.cabangId}>
                        {cabang.namaCabang}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Enable Member Discount */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">Aktifkan Diskon Member</h3>
                    <p className="text-sm text-gray-500">
                      Berikan diskon otomatis berdasarkan segmen pelanggan
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        enableMemberDiscount: !prev.enableMemberDiscount,
                      }))
                    }
                    className={`p-2 rounded-lg transition-colors ${
                      formData.enableMemberDiscount
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {formData.enableMemberDiscount ? (
                      <ToggleRight size={24} />
                    ) : (
                      <ToggleLeft size={24} />
                    )}
                  </button>
                </div>

                {/* Discount Segmen */}
                {formData.enableMemberDiscount && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Users className="inline mr-2" size={16} />
                      Diskon per Segmen (%)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(segmenLabels).map(([key, { label, color }]) => (
                        <div
                          key={key}
                          className="relative bg-white border rounded-lg p-3"
                        >
                          <div
                            className={`absolute top-0 left-0 w-full h-1 ${color} rounded-t-lg`}
                          ></div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            {label}
                          </label>
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={formData.discountSegmen[key] || 0}
                              onChange={(e) =>
                                handleSegmenChange(key, e.target.value)
                              }
                              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-gray-500">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Discount Limits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Percent className="inline mr-2" size={16} />
                      Maks. Diskon Manual (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.maxManualDiscountPersen}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maxManualDiscountPersen:
                            parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="inline mr-2" size={16} />
                      Maks. Diskon Manual (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxManualDiscountNominal}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maxManualDiscountNominal:
                            parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                {/* Min Transaction */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min. Transaksi untuk Diskon Member (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minTransactionForDiscount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minTransactionForDiscount:
                          parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                {/* Allow Combine With Promo */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">Gabungkan dengan Promo</h3>
                    <p className="text-sm text-gray-500">
                      Izinkan diskon member digabung dengan promo lain
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        allowCombineWithPromo: !prev.allowCombineWithPromo,
                      }))
                    }
                    className={`p-2 rounded-lg transition-colors ${
                      formData.allowCombineWithPromo
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {formData.allowCombineWithPromo ? (
                      <ToggleRight size={24} />
                    ) : (
                      <ToggleLeft size={24} />
                    )}
                  </button>
                </div>

                {/* Is Active */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">Status Aktif</h3>
                    <p className="text-sm text-gray-500">
                      Konfigurasi ini akan digunakan saat transaksi
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: !prev.isActive,
                      }))
                    }
                    className={`p-2 rounded-lg transition-colors ${
                      formData.isActive
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {formData.isActive ? (
                      <ToggleRight size={24} />
                    ) : (
                      <ToggleLeft size={24} />
                    )}
                  </button>
                </div>
              </div>
              <div className="p-6 border-t flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleSave()}
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  {createMutation.isPending ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Config Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={40} className="animate-spin text-indigo-500" />
        </div>
      ) : configs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <Settings size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">
            Belum ada konfigurasi
          </h3>
          <p className="text-gray-500 mt-2">
            Klik tombol "Tambah Konfigurasi" untuk membuat konfigurasi pertama
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {configs.map((config) => (
            <motion.div
              key={config.id}
              layout
              className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${
                config.isActive ? "border-green-200" : "border-gray-200"
              }`}
            >
              {/* Card Header */}
              <div
                className={`p-4 ${
                  config.cabangId ? "bg-blue-50" : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2
                      size={20}
                      className={config.cabangId ? "text-blue-600" : ""}
                    />
                    <h3
                      className={`font-semibold ${
                        config.cabangId ? "text-gray-800" : ""
                      }`}
                    >
                      {config.cabangId
                        ? config.namaCabang || "Cabang"
                        : "Konfigurasi Global"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        config.isActive
                          ? config.cabangId
                            ? "bg-green-100 text-green-800"
                            : "bg-white text-green-600"
                          : config.cabangId
                            ? "bg-red-100 text-red-800"
                            : "bg-white/20 text-white"
                      }`}
                    >
                      {config.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                    <button
                      onClick={() => handleEdit(config)}
                      className={`p-1 rounded hover:bg-white/20 ${
                        config.cabangId
                          ? "text-blue-600 hover:bg-blue-100"
                          : ""
                      }`}
                    >
                      <Edit2 size={16} />
                    </button>
                    {config.cabangId && (
                      <button
                        onClick={() => confirmDelete(config)}
                        className="p-1 rounded text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                {editingId === config.id ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    {/* Enable Member Discount */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Diskon Member</span>
                      <button
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            enableMemberDiscount: !prev.enableMemberDiscount,
                          }))
                        }
                        className={`p-1 rounded ${
                          formData.enableMemberDiscount
                            ? "bg-green-500 text-white"
                            : "bg-gray-300"
                        }`}
                      >
                        {formData.enableMemberDiscount ? (
                          <ToggleRight size={20} />
                        ) : (
                          <ToggleLeft size={20} />
                        )}
                      </button>
                    </div>

                    {/* Discount Segmen */}
                    {formData.enableMemberDiscount && (
                      <div className="grid grid-cols-4 gap-2">
                        {Object.entries(segmenLabels).map(
                          ([key, { label, color }]) => (
                            <div key={key} className="text-center">
                              <div
                                className={`w-full h-1 ${color} rounded-t mb-1`}
                              ></div>
                              <label className="text-xs text-gray-600">
                                {label}
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.discountSegmen[key] || 0}
                                onChange={(e) =>
                                  handleSegmenChange(key, e.target.value)
                                }
                                className="w-full text-center border rounded px-1 py-1 text-sm"
                              />
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* Limits */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">
                          Max Diskon (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.maxManualDiscountPersen}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              maxManualDiscountPersen:
                                parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-full border rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">
                          Max Diskon (Rp)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.maxManualDiscountNominal}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              maxManualDiscountNominal:
                                parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-full border rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>

                    {/* Min Transaction */}
                    <div>
                      <label className="text-xs text-gray-600">
                        Min. Transaksi (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.minTransactionForDiscount}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            minTransactionForDiscount:
                              parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>

                    {/* Toggles */}
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.allowCombineWithPromo}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              allowCombineWithPromo: e.target.checked,
                            }))
                          }
                          className="rounded"
                        />
                        Gabung Promo
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              isActive: e.target.checked,
                            }))
                          }
                          className="rounded"
                        />
                        Aktif
                      </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <button
                        onClick={() => {
                          setEditingId(null);
                          resetForm();
                        }}
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleSave(config.id)}
                        disabled={updateMutation.isPending}
                        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="space-y-3">
                    {/* Member Discount Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Diskon Member
                      </span>
                      <span
                        className={`flex items-center gap-1 text-sm font-medium ${
                          config.enableMemberDiscount
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {config.enableMemberDiscount ? (
                          <>
                            <CheckCircle size={14} /> Aktif
                          </>
                        ) : (
                          <>
                            <XCircle size={14} /> Nonaktif
                          </>
                        )}
                      </span>
                    </div>

                    {/* Segmen Discounts */}
                    {config.enableMemberDiscount && config.discountSegmen && (
                      <div className="flex gap-2">
                        {Object.entries(segmenLabels).map(
                          ([key, { label, color }]) => (
                            <div
                              key={key}
                              className="flex-1 text-center border rounded-lg p-2"
                            >
                              <div
                                className={`w-full h-1 ${color} rounded-t -mt-2 mb-2`}
                              ></div>
                              <span className="text-xs text-gray-500 block">
                                {label}
                              </span>
                              <span className="font-semibold text-indigo-600">
                                {config.discountSegmen[key] || 0}%
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* Limits */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <span className="text-gray-500 block text-xs">
                          Max Manual (%)
                        </span>
                        <span className="font-medium">
                          {config.maxManualDiscountPersen}%
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <span className="text-gray-500 block text-xs">
                          Max Manual (Rp)
                        </span>
                        <span className="font-medium">
                          {formatCurrency(config.maxManualDiscountNominal || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Min Transaction */}
                    <div className="bg-gray-50 rounded-lg p-2 text-sm">
                      <span className="text-gray-500 block text-xs">
                        Min. Transaksi
                      </span>
                      <span className="font-medium">
                        {formatCurrency(config.minTransactionForDiscount || 0)}
                      </span>
                    </div>

                    {/* Flags */}
                    <div className="flex gap-3 text-xs">
                      <span
                        className={`px-2 py-1 rounded ${
                          config.allowCombineWithPromo
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {config.allowCombineWithPromo
                          ? "✓ Gabung Promo"
                          : "✗ Gabung Promo"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex items-center mb-4 text-red-600">
                <AlertCircle size={24} className="mr-2" />
                <h3 className="text-lg font-semibold">Konfirmasi Hapus</h3>
              </div>
              <p className="mb-6">
                Apakah Anda yakin ingin menghapus konfigurasi untuk{" "}
                <span className="font-semibold">
                  {selectedConfig?.namaCabang || "cabang ini"}
                </span>
                ?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedConfig(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => deleteMutation.mutate(selectedConfig.id)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiscountConfigPage;
