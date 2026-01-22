import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Package,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Plus,
  Save,
  X,
  Clock,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Spinner from "../../../features/common/Spinner";
import Pagination from "../../../features/common/Pagination";
import { useCabangList } from "../../../features/cabang/hooks/useCabangQueries";
import { useBatchManagement } from "../../../hooks/useBatchManagement";
import useProdukQueries from "../../../hooks/useProdukQueries";
import { toast } from "react-hot-toast";
import api from "../../../services/api";

// Batch creation schema validation
const batchSchema = z.object({
  produkId: z.string().min(1, "Produk wajib dipilih"),
  nomorBatch: z.string().min(1, "Nomor batch wajib diisi"),
  tanggalKadaluwarsa: z.string().min(1, "Tanggal kadaluwarsa wajib diisi"),
  jumlah: z.string()
    .min(1, "Jumlah wajib diisi")
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, "Jumlah harus berupa angka positif"),
  catatan: z.string().optional(),
});

// Alert settings schema validation
const alertSettingsSchema = z.object({
  minimumStockThreshold: z.string()
    .min(1, "Batas minimum stok wajib diisi")
    .refine(val => !isNaN(Number(val)) && Number(val) >= 0, "Batas minimum stok harus berupa angka positif"),
  expiryAlertDays: z.string()
    .min(1, "Hari peringatan kadaluwarsa wajib diisi")
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, "Hari peringatan kadaluwarsa harus berupa angka positif"),
  enableEmailAlerts: z.boolean(),
  enableAppAlerts: z.boolean(),
});

const BatchManagement = () => {
  // State for filters and pagination
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [activeTab, setActiveTab] = useState("expiring"); // expiring, minimum, settings
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // React Hook Form for batch creation
  const batchForm = useForm({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      produkId: "",
      nomorBatch: "",
      tanggalKadaluwarsa: "",
      jumlah: "",
      catatan: "",
    }
  });
  
  // React Hook Form for alert settings
  const settingsForm = useForm({
    resolver: zodResolver(alertSettingsSchema),
    defaultValues: {
      minimumStockThreshold: "5",
      expiryAlertDays: "30",
      enableEmailAlerts: true,
      enableAppAlerts: true,
    }
  });
  
const { useAllProducts } = useProdukQueries();

  // Queries
  const { data: cabangListData, isLoading: isCabangLoading } = useCabangList();
  const { useExpiringStock, useMinimumStock, useAddProductBatch, useUpdateStockAlertSettings } = useBatchManagement();
  const { data: productsData, isLoading: isProductsLoading } = useAllProducts(selectedBranchId, { enabled: !!selectedBranchId });
  
  // Fetch expiring stock data
  const { 
    data: expiringStockData, 
    isLoading: isExpiringLoading,
    refetch: refetchExpiringStock 
  } = useExpiringStock(selectedBranchId);
  
  // Fetch minimum stock data
  const { 
    data: minimumStockData, 
    isLoading: isMinimumLoading,
    refetch: refetchMinimumStock 
  } = useMinimumStock(selectedBranchId);
  
  // Mutations
  const addBatchMutation = useAddProductBatch();
  const updateSettingsMutation = useUpdateStockAlertSettings();
  
  // Effect to reset page when branch changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBranchId]);
  
  // Handle form submissions
  const handleAddBatch = (data) => {
    const batchData = {
      ...data,
      cabangId: selectedBranchId,
      jumlah: Number(data.jumlah),
    };
    
    addBatchMutation.mutate(batchData, {
      onSuccess: () => {
        setShowAddBatchModal(false);
        batchForm.reset();
        refetchExpiringStock();
        refetchMinimumStock();
      }
    });
  };
  
  const handleUpdateSettings = (data) => {
    const settingsData = {
      cabangId: selectedBranchId,
      minimumStockThreshold: Number(data.minimumStockThreshold),
      expiryAlertDays: Number(data.expiryAlertDays),
      enableEmailAlerts: data.enableEmailAlerts,
      enableAppAlerts: data.enableAppAlerts,
    };
    
    updateSettingsMutation.mutate(settingsData, {
      onSuccess: () => {
        setShowSettingsModal(false);
      }
    });
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  
  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Get status class based on days until expiry
  const getExpiryStatusClass = (days) => {
    if (days < 0) return "text-red-600 bg-red-50";
    if (days <= 7) return "text-orange-600 bg-orange-50";
    if (days <= 30) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };
  
  // Get status text based on days until expiry
  const getExpiryStatusText = (days) => {
    if (days < 0) return "Kadaluwarsa";
    if (days === 0) return "Hari ini";
    if (days === 1) return "Besok";
    return `${days} hari lagi`;
  };
  
  return (
    <div className="pb-6">
      <div className="flex flex-col items-center justify-center bg-indigo-600 text-white py-8 mb-6">
        <h1 className="text-2xl font-bold mb-2">Manajemen Batch</h1>
        <div className="flex items-center">
          <Calendar size={24} className="mr-2" />
          <span>Kelola batch dan tanggal kadaluarsa produk</span>
        </div>
      </div>

      <div className="mx-6">
        {/* Branch Selection and Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="w-full md:w-1/3">
              <label htmlFor="branchSelect" className="block text-sm font-medium text-gray-700 mb-1">
                Cabang
              </label>
              <select
                id="branchSelect"
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                disabled={isCabangLoading}
              >
                <option value="">Pilih Cabang</option>
                {cabangListData?.data?.map((cabang) => (
                  <option key={cabang.id} value={cabang.id}>
                    {cabang.namaCabang}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end space-x-3">
              <button
                onClick={() => setShowAddBatchModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
                disabled={!selectedBranchId}
              >
                <Plus size={16} className="mr-2" />
                Tambah Batch
              </button>
              
              <button
                onClick={() => setShowSettingsModal(true)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center"
                disabled={!selectedBranchId}
              >
                <Filter size={16} className="mr-2" />
                Pengaturan Alert
              </button>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === 'expiring' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('expiring')}
              >
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2" />
                  Produk Mendekati Kadaluwarsa
                </div>
              </button>
              
              <button
                className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === 'minimum' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('minimum')}
              >
                <div className="flex items-center">
                  <AlertTriangle size={16} className="mr-2" />
                  Produk Stok Minimum
                </div>
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {!selectedBranchId ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Pilih Cabang</h3>
                <p className="text-gray-500">Silakan pilih cabang untuk melihat data batch</p>
              </div>
            ) : activeTab === 'expiring' ? (
              // Expiring Products Tab
              <div>
                {isExpiringLoading ? (
                  <div className="flex justify-center py-12">
                    <Spinner />
                  </div>
                ) : expiringStockData?.data?.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak Ada Produk Mendekati Kadaluwarsa</h3>
                    <p className="text-gray-500">Semua produk masih dalam masa aman</p>
                  </div>
                ) : (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kode
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nama Produk
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nomor Batch
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tanggal Kadaluwarsa
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Stok
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {expiringStockData?.data?.map((item) => {
                            const daysUntilExpiry = getDaysUntilExpiry(item.tanggalKadaluwarsa);
                            const statusClass = getExpiryStatusClass(daysUntilExpiry);
                            const statusText = getExpiryStatusText(daysUntilExpiry);
                            
                            return (
                              <tr key={`${item.produk_id}-${item.barcode}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.sku}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.nama_produk}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.barcode}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(item.tanggal_kedaluwarsa)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}>
                                   {item.hari_tersisa} hari lagi
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.stok} {item.satuan}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination for expiring products */}
                    <div className="mt-4">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil((expiringStockData?.pagination?.totalItems || 0) / pageSize)}
                        onPageChange={setCurrentPage}
                        totalItems={expiringStockData?.pagination?.totalItems || 0}
                        itemsPerPage={pageSize}
                        onItemsPerPageChange={setPageSize}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Minimum Stock Tab
              <div>
                {isMinimumLoading ? (
                  <div className="flex justify-center py-12">
                    <Spinner />
                  </div>
                ) : minimumStockData?.data?.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak Ada Produk Stok Minimum</h3>
                    <p className="text-gray-500">Semua produk memiliki stok di atas batas minimum</p>
                  </div>
                ) : (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kode
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nama Produk
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Stok Saat Ini
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Stok Minimum
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {minimumStockData?.data?.map((item) => {
                            const stockDiff = item.stok - item.minStok;
                            const stockPercentage = item.minStok > 0 
                              ? (item.stok / item.minStok) * 100 
                              : 100;
                            
                            let statusClass = "text-green-600 bg-green-50";
                            if (stockPercentage <= 25) {
                              statusClass = "text-red-600 bg-red-50";
                            } else if (stockPercentage <= 50) {
                              statusClass = "text-orange-600 bg-orange-50";
                            } else if (stockPercentage <= 75) {
                              statusClass = "text-yellow-600 bg-yellow-50";
                            }
                            
                            return (
                              <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.produkMaster.sku}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.produkMaster.namaProduk}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.stok} {item.produkMaster.satuan}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.minStok} {item.produkMaster.satuan}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}>
                                    {stockDiff < 0 ? `Kurang ${Math.abs(stockDiff)}` : `Sisa ${stockDiff}`}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination for minimum stock */}
                    <div className="mt-4">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil((minimumStockData?.pagination?.totalItems || 0) / pageSize)}
                        onPageChange={setCurrentPage}
                        totalItems={minimumStockData?.pagination?.totalItems || 0}
                        itemsPerPage={pageSize}
                        onItemsPerPageChange={setPageSize}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Add Batch Modal */}
      {showAddBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-medium">Tambah Batch Produk</h3>
              <button
                onClick={() => setShowAddBatchModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={batchForm.handleSubmit(handleAddBatch)}>
                <div className="mb-4">
                  <label htmlFor="produkId" className="block text-sm font-medium text-gray-700 mb-1">
                    Produk
                  </label>
                  <select
                    id="produkId"
                    className={`w-full border ${batchForm.formState.errors.produkId ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500`}
                    {...batchForm.register("produkId")}
                  >
                    <option value="">Pilih Produk</option>
                    {productsData?.data?.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.produkMaster.namaProduk} ({product.produkMaster.sku})
                      </option>
                    ))}
                  </select>
                  {batchForm.formState.errors.produkId && (
                    <p className="mt-1 text-sm text-red-600">{batchForm.formState.errors.produkId.message}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="nomorBatch" className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Batch
                  </label>
                  <input
                    id="nomorBatch"
                    type="text"
                    className={`w-full border ${batchForm.formState.errors.nomorBatch ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500`}
                    placeholder="Contoh: B12345"
                    {...batchForm.register("nomorBatch")}
                  />
                  {batchForm.formState.errors.nomorBatch && (
                    <p className="mt-1 text-sm text-red-600">{batchForm.formState.errors.nomorBatch.message}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="tanggalKadaluwarsa" className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Kadaluwarsa
                  </label>
                  <input
                    id="tanggalKadaluwarsa"
                    type="date"
                    className={`w-full border ${batchForm.formState.errors.tanggalKadaluwarsa ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500`}
                    {...batchForm.register("tanggalKadaluwarsa")}
                  />
                  {batchForm.formState.errors.tanggalKadaluwarsa && (
                    <p className="mt-1 text-sm text-red-600">{batchForm.formState.errors.tanggalKadaluwarsa.message}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="jumlah" className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah
                  </label>
                  <input
                    id="jumlah"
                    type="number"
                    min="1"
                    className={`w-full border ${batchForm.formState.errors.jumlah ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500`}
                    {...batchForm.register("jumlah")}
                  />
                  {batchForm.formState.errors.jumlah && (
                    <p className="mt-1 text-sm text-red-600">{batchForm.formState.errors.jumlah.message}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="catatan" className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    id="catatan"
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Catatan tambahan tentang batch ini"
                    {...batchForm.register("catatan")}
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddBatchModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center"
                    disabled={addBatchMutation.isPending}
                  >
                    {addBatchMutation.isPending ? (
                      <>
                        <RefreshCw size={16} className="animate-spin mr-2" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Simpan Batch
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-medium">Pengaturan Alert Stok</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={settingsForm.handleSubmit(handleUpdateSettings)}>
                <div className="mb-4">
                  <label htmlFor="minimumStockThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                    Batas Minimum Stok
                  </label>
                  <input
                    id="minimumStockThreshold"
                    type="number"
                    min="0"
                    className={`w-full border ${settingsForm.formState.errors.minimumStockThreshold ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500`}
                    {...settingsForm.register("minimumStockThreshold")}
                  />
                  {settingsForm.formState.errors.minimumStockThreshold && (
                    <p className="mt-1 text-sm text-red-600">{settingsForm.formState.errors.minimumStockThreshold.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Jumlah minimum stok sebelum notifikasi dikirim</p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="expiryAlertDays" className="block text-sm font-medium text-gray-700 mb-1">
                    Hari Peringatan Kadaluwarsa
                  </label>
                  <input
                    id="expiryAlertDays"
                    type="number"
                    min="1"
                    className={`w-full border ${settingsForm.formState.errors.expiryAlertDays ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500`}
                    {...settingsForm.register("expiryAlertDays")}
                  />
                  {settingsForm.formState.errors.expiryAlertDays && (
                    <p className="mt-1 text-sm text-red-600">{settingsForm.formState.errors.expiryAlertDays.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Jumlah hari sebelum kadaluwarsa untuk mengirim notifikasi</p>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      id="enableAppAlerts"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      {...settingsForm.register("enableAppAlerts")}
                    />
                    <label htmlFor="enableAppAlerts" className="ml-2 block text-sm text-gray-700">
                      Aktifkan notifikasi aplikasi
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 ml-6">Menampilkan notifikasi di dalam aplikasi</p>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      id="enableEmailAlerts"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      {...settingsForm.register("enableEmailAlerts")}
                    />
                    <label htmlFor="enableEmailAlerts" className="ml-2 block text-sm text-gray-700">
                      Aktifkan notifikasi email
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 ml-6">Mengirim notifikasi melalui email</p>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center"
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending ? (
                      <>
                        <RefreshCw size={16} className="animate-spin mr-2" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Simpan Pengaturan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchManagement;
