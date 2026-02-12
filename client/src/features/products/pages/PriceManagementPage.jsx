import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  Package,
  Save,
  TrendingUp,
  History,
  Edit,
  X,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Spinner from "../../../features/common/Spinner";
import Pagination from "../../../features/common/Pagination";
import { useCabangList } from "../../../features/cabang/hooks/useCabangQueries";
import { usePriceManagementQueries } from "../hooks/usePriceManagementQueries";
import { toast } from "react-hot-toast";
import api from "@common/utils/api";

// Price update schema validation
const priceUpdateSchema = z.object({
  tipeHarga: z.string()
    .min(1, "Tipe harga wajib dipilih"),
  hargaBaru: z.string()
    .min(1, "Harga baru wajib diisi")
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, "Harga harus berupa angka positif"),
  alasanPerubahan: z.string()
    .min(3, "Alasan perubahan minimal 3 karakter")
    .max(200, "Alasan perubahan maksimal 200 karakter"),
  supplierId: z.string().optional(),
  dokumenReferensi: z.string().optional(),
});

const PriceManagement = () => {
  // State
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [sortField, setSortField] = useState("nama");
  const [sortDirection, setSortDirection] = useState("asc");

  // React Hook Form
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(priceUpdateSchema),
    defaultValues: {
      tipeHarga: "jual",
      hargaBaru: "",
      alasanPerubahan: "",
      supplierId: "",
      dokumenReferensi: "",
    }
  });

  // Queries
  const { data: cabangListData, isLoading: isCabangLoading } = useCabangList();
  const { useUpdateProductPrice, usePriceHistory } = usePriceManagementQueries();
  const updatePriceMutation = useUpdateProductPrice();
  const { data: priceHistoryData, isLoading: isPriceHistoryLoading } = usePriceHistory(
    selectedProduct?.id,
    { enabled: !!selectedProduct && showHistoryModal }
  );



  // Fetch products
  const fetchProducts = async () => {
    if (!selectedBranchId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("cabangId", selectedBranchId);
      params.append("page", currentPage);
      params.append("limit", pageSize);
      
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      
      params.append("sortBy", sortField);
      params.append("sortOrder", sortDirection);

      const response = await api.get(`/produk?${params}`);
      setProducts(response.data.data);
      setTotalItems(response.data.pagination.totalItems);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Gagal memuat data produk");
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch products when dependencies change
  useEffect(() => {
    if (selectedBranchId) {
      fetchProducts();
    }
  }, [selectedBranchId, currentPage, pageSize, sortField, sortDirection]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  // Handle sort
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle price update
  const handlePriceUpdate = (data) => {
    if (!selectedProduct) return;

    const priceData = {
      produkId: selectedProduct.id,
      cabangId: selectedBranchId,
      tipeHarga: data.tipeHarga,
      hargaBaru: Number(data.hargaBaru),
      alasanPerubahan: data.alasanPerubahan || "",
      supplierId: data.supplierId || null,
      dokumenReferensi: data.dokumenReferensi || ""
    };

    updatePriceMutation.mutate(priceData, {
      onSuccess: () => {
        setShowPriceModal(false);
        reset();
        fetchProducts();
      }
    });
  };

  // Open price update modal
  const openPriceModal = (product) => {
    setSelectedProduct(product);
    reset({
      tipeHarga: "jual",
      hargaBaru: product.hargaJual.toString(),
      alasanPerubahan: "",
      supplierId: "",
      dokumenReferensi: "",
    });
    setShowPriceModal(true);
  };
  
  // Open purchase price update modal
  const openPurchasePriceModal = (product) => {
    setSelectedProduct(product);
    reset({
      tipeHarga: "beli",
      hargaBaru: product.hargaBeli.toString(),
      alasanPerubahan: "",
      supplierId: "",
      dokumenReferensi: "",
    });
    setShowPriceModal(true);
  };

  // Open price history modal
  const openHistoryModal = (product) => {
    setSelectedProduct(product);
    setShowHistoryModal(true);
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Helper function to render price type with appropriate styling
  const renderPriceType = (type) => {
    let label, bgColor, textColor;
    
    switch(type) {
      case 'jual':
        label = 'Harga Jual';
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        break;
      case 'beli':
        label = 'Harga Beli';
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
      case 'grosir':
        label = 'Harga Grosir';
        bgColor = 'bg-purple-100';
        textColor = 'text-purple-800';
        break;
      default:
        label = 'Lainnya';
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
    }
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
        {label}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="pb-6">
      {/* Page Header */}
      <div className="flex flex-col items-center justify-center bg-indigo-600 text-white py-8 mb-6">
        <h1 className="text-2xl font-bold mb-2">Manajemen Harga</h1>
        <div className="flex items-center">
          <DollarSign size={24} className="mr-2" />
          <span>Kelola dan pantau perubahan harga produk</span>
        </div>
      </div>

      <div className="mx-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
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

            <div className="flex-1">
              <form onSubmit={handleSearch}>
                <label htmlFor="searchInput" className="block text-sm font-medium text-gray-700 mb-1">
                  Cari Produk
                </label>
                <div className="relative">
                  <input
                    id="searchInput"
                    type="text"
                    placeholder="Nama atau kode produk"
                    className="w-full border border-gray-300 rounded-lg p-2 pr-10 focus:ring-indigo-500 focus:border-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600"
                  >
                    <Search size={20} />
                  </button>
                </div>
              </form>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => fetchProducts()}
                className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 flex items-center"
                disabled={loading || !selectedBranchId}
              >
                <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {!selectedBranchId ? (
            <div className="p-8 text-center">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Pilih Cabang</h3>
              <p className="text-gray-500">Silakan pilih cabang untuk melihat daftar produk</p>
            </div>
          ) : loading && products.length === 0 ? (
            <div className="p-8 flex justify-center">
              <Spinner />
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak Ada Produk</h3>
              <p className="text-gray-500">Tidak ada produk yang ditemukan dengan filter yang dipilih</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button 
                          className="flex items-center" 
                          onClick={() => handleSort("kode")}
                        >
                          Kode
                          {sortField === "kode" && (
                            sortDirection === "asc" ? 
                              <ArrowUp size={14} className="ml-1" /> : 
                              <ArrowDown size={14} className="ml-1" />
                          )}
                        </button>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button 
                          className="flex items-center" 
                          onClick={() => handleSort("nama")}
                        >
                          Nama Produk
                          {sortField === "nama" && (
                            sortDirection === "asc" ? 
                              <ArrowUp size={14} className="ml-1" /> : 
                              <ArrowDown size={14} className="ml-1" />
                          )}
                        </button>
                      </th>

                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Satuan
                      </th>
                      
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button 
                          className="flex items-center" 
                          onClick={() => handleSort("hargaJual")}
                        >
                          Harga Jual
                          {sortField === "hargaJual" && (
                            sortDirection === "asc" ? 
                              <ArrowUp size={14} className="ml-1" /> : 
                              <ArrowDown size={14} className="ml-1" />
                          )}
                        </button>
                      </th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button 
                          className="flex items-center" 
                          onClick={() => handleSort("hargaGrosir")}
                        >
                          Harga Grosir
                          {sortField === "hargaGrosir" && (
                            sortDirection === "asc" ? 
                              <ArrowUp size={14} className="ml-1" /> : 
                              <ArrowDown size={14} className="ml-1" />
                          )}
                        </button>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button 
                          className="flex items-center" 
                          onClick={() => handleSort("hargaBeli")}
                        >
                          Harga Beli
                          {sortField === "hargaBeli" && (
                            sortDirection === "asc" ? 
                              <ArrowUp size={14} className="ml-1" /> : 
                              <ArrowDown size={14} className="ml-1" />
                          )}
                        </button>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Margin
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button 
                          className="flex items-center" 
                          onClick={() => handleSort("updatedAt")}
                        >
                          Terakhir Diubah
                          {sortField === "updatedAt" && (
                            sortDirection === "asc" ? 
                              <ArrowUp size={14} className="ml-1" /> : 
                              <ArrowDown size={14} className="ml-1" />
                          )}
                        </button>
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => {
                      const margin = product.hargaJual - product.hargaBeli;
                      const marginPercentage = product.hargaBeli > 0 
                        ? (margin / product.hargaBeli) * 100 
                        : 0;
                      
                      return (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.produkMaster.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.produkMaster.namaProduk}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.produkMaster.satuan}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(product.hargaJual)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(product.hargaGrosir)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(product.hargaBeli)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`${marginPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(margin)} ({marginPercentage.toFixed(1)}%)
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(product.updatedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openPriceModal(product)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Update Harga Jual"
                                >
                                  <DollarSign size={16} />
                                </button>
                                <button
                                  onClick={() => openPurchasePriceModal(product)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Update Harga Beli"
                                >
                                  <Edit size={16} />
                                </button>
                              </div>
                              <button
                                onClick={() => openHistoryModal(product)}
                                className="text-gray-600 hover:text-gray-900 bg-gray-50 p-1 rounded-md"
                                title="Riwayat Harga"
                              >
                                <History size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  itemsPerPage={pageSize}
                  onItemsPerPageChange={setPageSize}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Price Update Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-medium">
                {watch("tipeHarga") === "jual" ? "Update Harga Jual" : 
                 watch("tipeHarga") === "beli" ? "Update Harga Beli" : 
                 watch("tipeHarga") === "grosir" ? "Update Harga Grosir" : "Update Harga"}
              </h3>
              <button
                onClick={() => setShowPriceModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Produk</p>
                <p className="font-medium">{selectedProduct.produkMaster.namaProduk}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Kode</p>
                <p className="font-medium">{selectedProduct.produkMaster.sku}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">
                  {watch("tipeHarga") === "jual" ? "Harga Jual Saat Ini" : 
                 watch("tipeHarga") === "beli" ? "Harga Beli Saat Ini" : 
                 watch("tipeHarga") === "grosir" ? "Harga Grosir Saat Ini" : "Harga Jual Saat Ini"}
                </p>
                <p className="font-medium">
                  {formatCurrency(watch("tipeHarga") === "jual" ? selectedProduct.hargaJual : selectedProduct.hargaBeli)}
                </p>
              </div>
              
              <form onSubmit={handleSubmit(handlePriceUpdate)}>
                <div className="mb-4">
                  <label htmlFor="tipeHarga" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipe Harga
                  </label>
                  <select
                    id="tipeHarga"
                    {...register("tipeHarga")}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="jual">Harga Jual</option>
                    <option value="beli">Harga Beli</option>
                    <option value="grosir">Harga Grosir</option>
                  </select>
                  {errors.tipeHarga && (
                    <p className="mt-1 text-sm text-red-600">{errors.tipeHarga.message}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="hargaBaru" className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Baru
                  </label>
                  <input
                    type="text"
                    id="hargaBaru"
                    {...register("hargaBaru")}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Masukkan harga baru"
                  />
                  {errors.hargaBaru && (
                    <p className="mt-1 text-sm text-red-600">{errors.hargaBaru.message}</p>
                  )}
                </div>
                
                {register("tipeHarga").value === "beli" && (
                  <div className="mb-4">
                    <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier
                    </label>
                    <select
                      id="supplierId"
                      {...register("supplierId")}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Pilih Supplier (Opsional)</option>
                      {/* Supplier options would be populated from API */}
                    </select>
                  </div>
                )}
                
                {register("tipeHarga").value === "beli" && (
                  <div className="mb-4">
                    <label htmlFor="dokumenReferensi" className="block text-sm font-medium text-gray-700 mb-1">
                      Dokumen Referensi
                    </label>
                    <input
                      type="text"
                      id="dokumenReferensi"
                      {...register("dokumenReferensi")}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="No. Invoice/PO (Opsional)"
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="alasanPerubahan" className="block text-sm font-medium text-gray-700 mb-1">
                    Alasan Perubahan
                  </label>
                  <textarea
                    id="alasanPerubahan"
                    {...register("alasanPerubahan")}
                    rows="3"
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Masukkan alasan perubahan harga"
                  ></textarea>
                  {errors.alasanPerubahan && (
                    <p className="mt-1 text-sm text-red-600">{errors.alasanPerubahan.message}</p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPriceModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center"
                    disabled={updatePriceMutation.isPending}
                  >
                    {updatePriceMutation.isPending ? (
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      {showHistoryModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-medium">Riwayat Harga Produk</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h4 className="font-medium text-lg">{selectedProduct.produkMaster.namaProduk}</h4>
                <p className="text-gray-500">Kode: {selectedProduct.produkMaster.sku}</p>
              </div>
              
              {isPriceHistoryLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : priceHistoryData?.data?.length === 0 ? (
                <div className="text-center py-8">
                  <History size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak Ada Riwayat</h3>
                  <p className="text-gray-500">Belum ada perubahan harga yang tercatat untuk produk ini</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tanggal
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipe Harga
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Harga Sebelumnya
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Harga Baru
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Perubahan
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Alasan
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Diubah Oleh
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {priceHistoryData?.data?.map((history, index) => {
                        const priceDiff = history.hargaBaru - history.hargaLama;
                        const percentChange = history.hargaLama > 0 
                          ? (priceDiff / history.hargaLama) * 100 
                          : 0;
                        
                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(history.tanggalPerubahan)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {renderPriceType(history.tipeHarga)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(history.hargaLama)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(history.hargaBaru)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`${priceDiff > 0 ? 'text-green-600' : priceDiff < 0 ? 'text-red-600' : 'text-gray-500'} flex items-center`}>
                                {priceDiff > 0 ? <ArrowUp size={14} className="mr-1" /> : priceDiff < 0 ? <ArrowDown size={14} className="mr-1" /> : null}
                                {formatCurrency(Math.abs(priceDiff))} ({percentChange.toFixed(1)}%)
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {history.alasanPerubahan}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {history.created_by || history.diubahOleh}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceManagement;