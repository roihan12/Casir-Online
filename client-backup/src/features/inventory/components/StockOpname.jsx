import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ClipboardCheck,
  Search,
  Filter,
  RefreshCw,
  Package,
  Save,
  FileCheck,
  ChevronDown,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Clipboard,
  Download,
} from "lucide-react";
import Spinner from "../../../features/common/Spinner";
import Pagination from "../../../features/common/Pagination";
import { useCabangList } from "../../../features/cabang/hooks/useCabangQueries";
import useInventoryQueries from "../../../hooks/useInventoryQueries";
import { toast } from "react-hot-toast";
import api from "../../../services/api";
import useProdukQueries from "../../../hooks/useProdukQueries";
import { useCategories } from "../../../hooks/useCategories";

// Validasi form stok opname
const opnameItemSchema = z.object({
  productId: z.string().nonempty("ID Produk harus diisi"),
  physicalStock: z.number().min(0, "Stok fisik harus minimal 0"),
  note: z.string().optional(),
});

const opnameSchema = z.object({
  cabangId: z.string().nonempty("Cabang harus dipilih"),
  items: z.array(opnameItemSchema),
  notes: z.string().optional(),
});

const filterSchema = z.object({
  cabangId: z.string().nonempty("Cabang harus dipilih"),
  category: z.string().optional(),
  searchTerm: z.string().optional(),
});

const StockOpname = () => {
  // State
  const [selectedBranchId, setSelectedBranchId] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [products, setProducts] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [opnameMode, setOpnameMode] = useState(false);
  const [opnameItems, setOpnameItems] = useState([]);
  const [opnameDate, setOpnameDate] = useState(new Date());

  const { useAllProducts } = useProdukQueries();
  const { getCategories } = useCategories();

  // Queries
  const { data: cabangListData, isLoading: isCabangLoading } = useCabangList();
  const { data: categoriesData, isLoading: isCategoriesLoading } = getCategories;
  const {
    data: inventoryData,
    isLoading: isInventoryLoading,
    error: inventoryError,
    refetch: refetchInventory,
  } = useAllProducts({
    cabangId: selectedBranchId,
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    kategoriId: selectedCategory
  });

  console.log("inventoryData",inventoryData);
  // Forms
  const {
    register: registerFilter,
    handleSubmit: handleSubmitFilter,
    formState: { errors: filterErrors },
  } = useForm({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      cabangId: selectedBranchId,
      category: selectedCategory,
      searchTerm: searchTerm,
    },
  });

  const {
    register: registerOpname,
    handleSubmit: handleSubmitOpname,
    reset: resetOpname,
    formState: { errors: opnameErrors },
  } = useForm({
    resolver: zodResolver(opnameSchema),
    defaultValues: {
      cabangId: selectedBranchId,
      items: [],
      notes: "",
    },
  });

  // Effects
  useEffect(() => {
    if (inventoryData?.data) {
      setProducts(inventoryData.data);
      setTotalItems(inventoryData.pagination.totalItems || inventoryData.data.length);
      setTotalPages(
        inventoryData.pagination.totalPages ||
          Math.ceil(inventoryData.data.length / pageSize)
      );
    }
  }, [inventoryData, pageSize]);
  
  // Effect to refetch data when branch or category changes
  useEffect(() => {
    if (selectedBranchId || selectedCategory) {
      refetchInventory();
    }
  }, [selectedBranchId, selectedCategory, refetchInventory]);

  // Start opname mode
  const startOpname = () => {
    if (!selectedBranchId) {
      toast.error("Pilih cabang terlebih dahulu");
      return;
    }

    // Initialize opname items from current inventory
    const initialOpnameItems = products.map((product) => ({
      productId: product.id,
      productName: product.produkMaster.namaProduk,
      systemStock: product.stok,
      physicalStock: product.stok, // Default to system stock
      difference: 0,
      note: "",
    }));

    setOpnameItems(initialOpnameItems);
    setOpnameMode(true);
  };

  // Cancel opname mode
  const cancelOpname = () => {
    if (
      opnameItems.some((item) => item.systemStock !== item.physicalStock) &&
      !window.confirm(
        "Anda memiliki perubahan yang belum disimpan. Yakin ingin membatalkan?"
      )
    ) {
      return;
    }
    setOpnameMode(false);
    setOpnameItems([]);
  };

  // Update physical stock for an item
  const updatePhysicalStock = (index, value) => {
    const newValue = parseInt(value) || 0;
    const updatedItems = [...opnameItems];
    updatedItems[index] = {
      ...updatedItems[index],
      physicalStock: newValue,
      difference: newValue - updatedItems[index].systemStock,
    };
    setOpnameItems(updatedItems);
  };

  // Update note for an item
  const updateNote = (index, value) => {
    const updatedItems = [...opnameItems];
    updatedItems[index] = {
      ...updatedItems[index],
      note: value,
    };
    setOpnameItems(updatedItems);
  };

  // Submit opname
  const submitOpname = async () => {
    try {
      setIsSubmitting(true);

      // Only include items with differences
      const itemsWithDifference = opnameItems.filter(
        (item) => item.physicalStock !== item.systemStock
      );

      if (itemsWithDifference.length === 0) {
        toast.error("Tidak ada perbedaan stok yang perlu disesuaikan");
        setIsSubmitting(false);
        return;
      }

      // Get product details for each item
      const productsWithDetails = itemsWithDifference.map(item => {
        const productDetail = products.find(p => p.id === item.productId);
        return {
          ...item,
          batchNumber: productDetail?.batchNumber || "",
          expiredDate: productDetail?.tanggalKedaluwarsa || null
        };
      });

      // Format data for API with the new payload structure
      const opnameData = {
        cabangId: selectedBranchId,
        tanggalOpname: opnameDate.toISOString().split('T')[0],
        products: productsWithDetails.map((item) => ({
          produkId: item.productId,
          stokSistem: item.systemStock,
          stokFisik: item.physicalStock,
          selisih: item.physicalStock - item.systemStock,
          batchNumber: item.batchNumber || "",
          expiredDate: item.expiredDate ? new Date(item.expiredDate).toISOString().split('T')[0] : null,
          keterangan: item.note || ""
        })),
        keteranganOpname: "Stock opname " + new Date().toLocaleDateString("id-ID", { month: 'long', year: 'numeric' })
      };

      console.log("Submitting opname data:", opnameData);

      // Submit to API
      const response = await api.post("/inventory/opname", opnameData);

      toast.success("Stok opname berhasil disimpan");
      setOpnameMode(false);
      setOpnameItems([]);
      refetchInventory();
    } catch (error) {
      console.error("Error submitting stock opname:", error);
      toast.error(
        error.response?.data?.message || "Gagal menyimpan stok opname"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter inventory
  const onSubmitFilter = (data) => {
    setSelectedBranchId(data.cabangId);
    setSelectedCategory(data.category || "");
    setSearchTerm(data.searchTerm || "");
    setCurrentPage(1);
  };

  // Export opname result
  const exportOpnameResult = () => {
    // Implementation for exporting opname result
    toast.success("Fitur export sedang dalam pengembangan");
  };

  return (
    <div className="pb-6">
      {/* Page Header */}
      <div className="flex flex-col items-center justify-center bg-indigo-600 text-white py-8 mb-6">
        <h1 className="text-2xl font-bold mb-2">Stock Opname</h1>
        <div className="flex items-center">
          <ClipboardCheck size={24} className="mr-2" />
          <span>Verifikasi stok fisik dengan data sistem</span>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mx-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-100 p-3 rounded-full mr-4">
              <Filter className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Filter Produk
              </h2>
              <p className="text-sm text-gray-500">
                Pilih cabang dan filter produk untuk stock opname
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitFilter(onSubmitFilter)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Branch Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cabang
                </label>
                {isCabangLoading ? (
                  <div className="flex items-center py-2">
                    <Spinner size="small" />
                    <span className="ml-2 text-sm text-gray-500">
                      Memuat data cabang...
                    </span>
                  </div>
                ) : (
                  <select
                    {...registerFilter("cabangId")}
                    disabled={opnameMode}
                    className={`w-full rounded-md border ${
                      filterErrors.cabangId
                        ? "border-red-500"
                        : "border-gray-300"
                    } shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                  >
                    <option value="">Pilih Cabang</option>
                    {cabangListData?.data?.map((cabang) => (
                      <option key={cabang.id} value={cabang.id}>
                        {cabang.namaCabang || cabang.nama_cabang}
                      </option>
                    ))}
                  </select>
                )}
                {filterErrors.cabangId && (
                  <p className="mt-1 text-xs text-red-600">
                    {filterErrors.cabangId.message}
                  </p>
                )}
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori (Opsional)
                </label>
                <select
                  id="category"
                  {...registerFilter("category")}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    // Form will be updated but we don't need to manually trigger refetch
                    // as the useEffect will handle it
                  }}
                  value={selectedCategory}
                >
                  <option value="">Semua Kategori</option>
                  {isCategoriesLoading ? (
                    <option value="" disabled>Loading categories...</option>
                  ) : categoriesData?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.namaKategori}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Term */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pencarian (Opsional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    {...registerFilter("searchTerm")}
                    disabled={opnameMode}
                    placeholder="Cari nama atau SKU produk"
                    className="w-full rounded-md border border-gray-300 shadow-sm py-2 pl-10 pr-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => refetchInventory()}
                disabled={opnameMode || isInventoryLoading}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <RefreshCw
                  size={16}
                  className={`mr-2 ${isInventoryLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                type="submit"
                disabled={opnameMode || !selectedBranchId}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Filter size={16} className="mr-2" />
                Terapkan Filter
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mx-6 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="text-xl font-semibold text-gray-800 flex items-center">
          {opnameMode ? (
            <>
              <FileCheck size={24} className="mr-2 text-indigo-600" />
              Stock Opname Aktif
            </>
          ) : (
            <>
              <Package size={24} className="mr-2 text-gray-700" />
              Daftar Produk
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {opnameMode ? (
            <>
              <button
                className="flex items-center justify-center px-4 py-2 border border-red-300 rounded-lg text-red-700 bg-white hover:bg-red-50"
                onClick={cancelOpname}
              >
                <XCircle size={16} className="mr-1" />
                <span>Batalkan</span>
              </button>
              <button
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
                onClick={submitOpname}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="small" className="mr-1" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-1" />
                    <span>Simpan Opname</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
                onClick={startOpname}
                disabled={
                  !selectedBranchId ||
                  isInventoryLoading ||
                  products.length === 0
                }
              >
                <ClipboardCheck size={16} className="mr-1" />
                <span>Mulai Stock Opname</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stock Opname Date (only in opname mode) */}
      {opnameMode && (
        <div className="mx-6 mb-6">
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex items-center mb-2 md:mb-0">
                <Calendar size={20} className="text-indigo-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  Tanggal Stock Opname:
                </span>
              </div>
              <div className="flex items-center">
                <input
                  type="date"
                  value={opnameDate.toISOString().split("T")[0]}
                  onChange={(e) => setOpnameDate(new Date(e.target.value))}
                  className="rounded-md border border-gray-300 shadow-sm py-1 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                <Clock size={16} className="ml-2 text-gray-500" />
                <span className="text-sm text-gray-500 ml-1">
                  {opnameDate.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="mx-6 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Produk
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Kategori
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {opnameMode ? "Stok Sistem" : "Stok Saat Ini"}
                </th>
                {opnameMode && (
                  <>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Stok Fisik
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Selisih
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Catatan
                    </th>
                  </>
                )}
                {!opnameMode && (
                  <>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Satuan
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Kadaluarsa
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Harga
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isInventoryLoading || isCabangLoading ? (
                <tr>
                  <td
                    colSpan={opnameMode ? 6 : 6}
                    className="px-6 py-4 text-center"
                  >
                    <Spinner />
                  </td>
                </tr>
              ) : inventoryError ? (
                <tr>
                  <td
                    colSpan={opnameMode ? 6 : 6}
                    className="px-6 py-4 text-center text-red-500"
                  >
                    Error: {inventoryError.message}
                  </td>
                </tr>
              ) : !selectedBranchId ? (
                <tr>
                  <td
                    colSpan={opnameMode ? 6 : 6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Silakan pilih cabang terlebih dahulu
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={opnameMode ? 6 : 6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Tidak ada produk yang ditemukan
                  </td>
                </tr>
              ) : opnameMode ? (
                // Opname mode table rows
                opnameItems.map((item, index) => (
                  <tr key={item.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                          <Package size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.productName}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {item.productId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {products.find((p) => p.id === item.productId)?.produkMaster?.kategori?.namaKategori}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.systemStock}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        value={item.physicalStock}
                        onChange={(e) =>
                          updatePhysicalStock(index, e.target.value)
                        }
                        className="rounded-md border border-gray-300 shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm w-20"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.difference > 0
                            ? "bg-green-100 text-green-800"
                            : item.difference < 0
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.difference > 0 && "+"}
                        {item.difference}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={item.note || ""}
                        onChange={(e) => updateNote(index, e.target.value)}
                        placeholder="Alasan penyesuaian"
                        className="rounded-md border border-gray-300 shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full max-w-xs"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                // Normal mode table rows
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                          <Package size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.produkMaster.namaProduk}
                          </div>
                          <div className="text-xs text-gray-500">
                            SKU: {product.produkMaster.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.produkMaster.kategori.namaKategori}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {product.stok}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {product.minStok} | Max:{" "}
                        {product.maxStok || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.produkMaster.satuan || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.tanggalKedaluwarsa
                        ? new Date(product.tanggalKedaluwarsa).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.hargaJual
                        ? new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          }).format(product.hargaJual)
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isInventoryLoading &&
          !inventoryError &&
          selectedBranchId &&
          products.length > 0 &&
          !opnameMode && (
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between items-center">
                <p className="text-sm text-gray-700">
                  Menampilkan{" "}
                  <span className="font-medium">{products.length}</span> dari{" "}
                  <span className="font-medium">{totalItems}</span> produk
                </p>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    <span>Tampilkan per halaman:</span>
                    <select
                      className="ml-2 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default StockOpname;
