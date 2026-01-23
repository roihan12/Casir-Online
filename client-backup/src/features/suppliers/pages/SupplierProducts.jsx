import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Search,
  SlidersHorizontal,
  Truck,
  Package,
  Trash2,
  Edit,
  Eye,
  X,
  CheckCircle,
  ShoppingCart,
  Barcode,
  Save,
  Filter,
  MapPin,
} from "lucide-react";
import {
  useSupplierProducts,
  useAvailableProductsForSupplier,
} from "../hooks/useSupplierProducts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import ConfirmationDialog from "../../common/ConfirmationDialog";
import Spinner from "../../common/Spinner";
import Pagination from "../../common/Pagination";
import EmptyState from "../../common/EmptyState";
import { formatCurrency } from "@common/utils/format";
import { useCabang } from "../../cabang/hooks/useCabang";
import { useQuery } from "@tanstack/react-query";
import produkSupplierService from "../../../services/produkSupplierService";
import Modal from "../../common/Modal";
import { toast } from "react-hot-toast";

// Schema for adding/editing product-supplier relationship
const productSupplierSchema = z.object({
  produkMasterId: z.string().min(1, "Produk harus dipilih"),
  hargaBeli: z.number().min(0.01, "Harga beli harus lebih besar dari 0"),
  minPembelian: z
    .number()
    .int("Minimum pembelian harus berupa bilangan bulat")
    .min(1, "Minimum pembelian harus minimal 1")
    .nullable()
    .optional(),
  leadTime: z
    .number()
    .int("Lead time harus berupa bilangan bulat")
    .min(0, "Lead time tidak boleh negatif")
    .nullable()
    .optional(),
  kodeProdukSupplier: z
    .string()
    .max(100, "Kode produk supplier maksimal 100 karakter")
    .nullable()
    .optional(),
  status: z.enum(["aktif", "tidak_aktif"], {
    errorMap: () => ({ message: "Status harus aktif atau tidak_aktif" }),
  }),
  isPrimary: z.boolean().default(false).optional(),
});

const SupplierProducts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const supplierId = queryParams.get("supplierId");
  const supplierName = queryParams.get("supplierName");

  const { selectedCabang } = useCabang();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
  });

  // State for product search in add modal
  const [productSearchTerm, setProductSearchTerm] = useState("");

  // Initialize supplier products hook
  const {
    supplierProducts,
    supplierProductsPagination,
    isLoadingSupplierProducts,
    createProdukSupplier,
    updateProdukSupplier,
    deleteProdukSupplier,
    isCreatingProdukSupplier,
    isUpdatingProdukSupplier,
    isDeletingProdukSupplier,
    refetchSupplierProducts,
    supplierData,
    supplierCabangId,
    isLoadingSupplier,
  } = useSupplierProducts({
    supplierId,
    queryParams: {
      page,
      limit,
      search: searchTerm,
      status: filters.status !== "all" ? filters.status : undefined,
    },
  });

  // Get available products using the hook
  const {
    data: availableProductsData,
    isLoading: isLoadingAvailableProducts,
    refetch: refetchAvailableProducts,
  } = useAvailableProductsForSupplier({
    supplierId,
    search: productSearchTerm,
    enabled: !!supplierId && showAddModal,
  });

  // Get the actual products array from the response
  const availableProducts = availableProductsData?.data || [];

  // Log to debug API response
  useEffect(() => {
    if (showAddModal) {
      console.log("Available products API response:", availableProductsData);
      console.log("Available products:", availableProducts);
      console.log("Selected cabang ID:", selectedCabang?.id);
    }
  }, [availableProductsData, showAddModal, selectedCabang?.id]);

  // Log selected cabang changes for debugging
  useEffect(() => {
    console.log("Selected cabang:", selectedCabang);
  }, [selectedCabang]);

  // Log supplier data when it's loaded
  useEffect(() => {
    if (supplierData) {
      console.log("Supplier data:", supplierData);
      console.log("Supplier cabangId:", supplierCabangId);
    }
  }, [supplierData, supplierCabangId]);

  // Log supplier products data changes
  useEffect(() => {
    if (supplierProducts && supplierProducts.length > 0) {
      console.log(`Fetched ${supplierProducts.length} supplier products`);
    }
  }, [supplierProducts]);

  // Display the cabang info based on the supplier data
  const getCabangInfo = () => {
    if (isLoadingSupplier) {
      return "Loading supplier info...";
    }

    if (supplierData?.cabang) {
      return `${supplierData.cabang.namaCabang || "N/A"} (ID: ${
        supplierCabangId || "N/A"
      })`;
    } else if (supplierCabangId) {
      return `Cabang ID: ${supplierCabangId}`;
    } else {
      return "Semua Cabang (Global)";
    }
  };

  // Form for adding/editing product-supplier relationship
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSupplierSchema),
    defaultValues: {
      produkMasterId: "",
      hargaBeli: 0,
      minPembelian: null,
      leadTime: null,
      kodeProdukSupplier: "",
      status: "aktif",
      isPrimary: false,
    },
  });

  // Effect to reset form when opening the add modal
  useEffect(() => {
    if (showAddModal) {
      reset({
        produkMasterId: "",
        hargaBeli: 0,
        minPembelian: null,
        leadTime: null,
        kodeProdukSupplier: "",
        status: "aktif",
        isPrimary: false,
      });
    }
  }, [showAddModal, reset]);

  // Effect to set form values when editing a product
  useEffect(() => {
    if (showEditModal && currentProduct) {
      setValue("produkMasterId", currentProduct.produkMaster.id);
      setValue("hargaBeli", parseFloat(currentProduct.hargaBeli));
      setValue("minPembelian", currentProduct.minPembelian);
      setValue("leadTime", currentProduct.leadTime);
      setValue("kodeProdukSupplier", currentProduct.kodeProdukSupplier);
      setValue("status", currentProduct.status);
      setValue("isPrimary", currentProduct.isPrimary);
    }
  }, [showEditModal, currentProduct, setValue]);

  // Handle search input
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // Function to handle product search in add modal
  const handleProductSearch = (e) => {
    setProductSearchTerm(e.target.value);
  };

  // Handle adding a new product to supplier
  const handleAddProduct = (data) => {
    try {
      // Prepare the data for creating a product-supplier relationship
      const produkSupplierData = {
        supplierId,
        produkMasterId: data.produkMasterId,
        hargaBeli: data.hargaBeli,
        minPembelian: data.minPembelian || null,
        leadTime: data.leadTime || null,
        kodeProdukSupplier: data.kodeProdukSupplier || null,
        status: data.status,
        isPrimary: data.isPrimary || false,
      };

      // The cabangId is handled by the useSupplierProducts hook
      // which will prioritize using the supplier's cabangId
      // We don't need to set it here since the hook handles it

      console.log(
        "Creating product-supplier relationship with data:",
        produkSupplierData
      );

      createProdukSupplier(produkSupplierData);
      setShowAddModal(false);
    } catch (error) {
      console.error("Error preparing product supplier data:", error);
      toast.error(
        `Gagal membuat data: ${error.message || "Terjadi kesalahan"}`
      );
    }
  };

  // Handle editing a product-supplier relationship
  const handleEditProduct = (data) => {
    if (!currentProduct) return;

    try {
      const updateData = {
        hargaBeli: data.hargaBeli,
        minPembelian: data.minPembelian || null,
        leadTime: data.leadTime || null,
        kodeProdukSupplier: data.kodeProdukSupplier || null,
        status: data.status,
        isPrimary: data.isPrimary || false,
      };

      console.log("Updating product-supplier with data:", updateData);

      updateProdukSupplier({
        id: currentProduct.id,
        data: updateData,
      });
      setShowEditModal(false);
    } catch (error) {
      console.error("Error preparing update data:", error);
      toast.error(
        `Gagal memperbarui data: ${error.message || "Terjadi kesalahan"}`
      );
    }
  };

  // Handle deleting a product-supplier relationship
  const handleDeleteProduct = () => {
    if (!currentProduct) return;

    deleteProdukSupplier(currentProduct.id);
    setShowDeleteModal(false);
  };

  // Filter handlers
  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setPage(1);

    // Debug log
    console.log(`Filter changed: ${e.target.name} = ${e.target.value}`);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: "all",
    });
    setPage(1);

    // Debug log
    console.log("Filters reset");
  };

  // If supplierId is not provided, redirect to suppliers page
  if (!supplierId) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold mb-2">
            ID Supplier Tidak Ditemukan
          </h2>
          <p className="text-gray-600 mb-4">
            Silakan pilih supplier dari daftar supplier terlebih dahulu.
          </p>
          <button
            onClick={() => navigate("/superadmin/suppliers")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Kembali ke Daftar Supplier
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <button
            onClick={() => navigate(`/superadmin/suppliers/${supplierId}`)}
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-2"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span>Kembali ke Detail Supplier</span>
          </button>
          <h1 className="text-2xl font-bold flex items-center">
            <Package className="mr-2" size={24} />
            Produk Supplier: {supplierName || supplierId}
          </h1>
          {selectedCabang && (
            <div className="mt-1 flex items-center text-sm text-gray-600">
              <MapPin size={14} className="mr-1" />
              <span>Cabang: {getCabangInfo()}</span>
            </div>
          )}
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center hover:bg-indigo-700"
          >
            <Plus size={18} className="mr-1" />
            Tambah Produk
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="px-4 py-2 border border-gray-300 rounded-md flex items-center hover:bg-gray-50"
            >
              <SlidersHorizontal size={18} className="mr-1" />
              Filter
            </button>
          </div>
        </div>

        {/* Filter options */}
        {filterOpen && (
          <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Filter Produk</h3>
              <button
                onClick={resetFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Reset Filter
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="aktif">Aktif</option>
                  <option value="tidak_aktif">Tidak Aktif</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Products List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoadingSupplierProducts ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : supplierProducts.length === 0 ? (
          <EmptyState
            title="Belum Ada Produk"
            description="Supplier ini belum memiliki produk. Tambahkan produk untuk supplier ini."
            icon={<Package size={48} className="text-gray-400" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produk
                    </th>
        
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kode Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cabang
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Harga Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Satuan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stok
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primary
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Harga Jual
                    </th>
                    
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Min. Beli
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supplierProducts.map((product) => {


                    return (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.produkMaster.namaProduk}
                              </div>
                            </div>
                          </div>
                        </td>
    
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.kodeProdukSupplier || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.cabang?.namaCabang || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(product.hargaBeli)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.produkMaster.satuan}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.produkMaster.produk[0]?.stok || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <CheckCircle 
                            size={16} 
                            className={product.isPrimary ? "text-green-500" : "text-gray-300"}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                           {formatCurrency(product.produkMaster.produk[0].hargaJual)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.minPembelian || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.status === "aktif"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.status === "aktif"
                              ? "Aktif"
                              : "Tidak Aktif"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setCurrentProduct(product);
                              setShowEditModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setCurrentProduct(product);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {supplierProductsPagination && (
              <div className="px-6 py-4 border-t border-gray-200">
                <Pagination
                  currentPage={page}
                  totalPages={supplierProductsPagination.totalPages || 1}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddModal}
        title="Tambah Produk ke Supplier"
        onClose={() => setShowAddModal(false)}
      >
        {/* Cabang info notification */}
        <div className="mb-4 bg-blue-50 p-3 rounded-md flex items-start">
          <MapPin
            className="text-blue-500 mt-0.5 mr-2 flex-shrink-0"
            size={16}
          />
          <div>
            <p className="text-sm text-blue-700 font-medium">
              Produk akan ditambahkan untuk cabang: {getCabangInfo()}
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              {isLoadingSupplier
                ? "Memuat informasi supplier..."
                : "Produk yang sudah terhubung dengan supplier di cabang ini tidak akan ditampilkan"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleAddProduct)}>
          <div className="space-y-4">
            {/* Search field for products */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cari Produk
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari produk berdasarkan nama atau kode"
                  className="w-full p-2 border border-gray-300 rounded-md pl-10"
                  value={productSearchTerm}
                  onChange={handleProductSearch}
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ketik untuk mencari produk yang belum terhubung dengan supplier
                ini
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produk <span className="text-red-500">*</span>
              </label>
              {isLoadingAvailableProducts ? (
                <div className="flex items-center justify-center p-4 border border-gray-300 rounded-md bg-gray-50">
                  <Spinner size="sm" className="mr-2" />
                  <span className="text-sm text-gray-500">
                    Memuat produk tersedia...
                  </span>
                </div>
              ) : (
                <>
                  {availableProducts?.length > 0 ? (
                    <select
                      {...register("produkMasterId")}
                      className={`w-full p-2 border rounded-md ${
                        errors.produkMasterId
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Pilih Produk</option>
                      {availableProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.namaProduk ||
                            product.productName ||
                            product.nama ||
                            "Produk"}{" "}
                          - {product.kode || product.code || "No Code"}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 border border-gray-300 rounded-md bg-gray-50">
                      <p className="text-center text-gray-500 text-sm">
                        {productSearchTerm
                          ? "Tidak ada produk yang cocok dengan pencarian Anda"
                          : "Tidak ada produk tersedia untuk ditambahkan"}
                      </p>
                      <p className="text-center text-xs text-indigo-600 mt-1">
                        Coba cari dengan kata kunci lain atau buat produk baru
                      </p>
                    </div>
                  )}
                </>
              )}
              {errors.produkMasterId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.produkMasterId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Harga Beli <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register("hargaBeli", { valueAsNumber: true })}
                className={`w-full p-2 border rounded-md ${
                  errors.hargaBeli ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.hargaBeli && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.hargaBeli.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Pembelian
              </label>
              <input
                type="number"
                {...register("minPembelian", { valueAsNumber: true })}
                className={`w-full p-2 border rounded-md ${
                  errors.minPembelian ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.minPembelian && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.minPembelian.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Time
              </label>
              <input
                type="number"
                {...register("leadTime", { valueAsNumber: true })}
                className={`w-full p-2 border rounded-md ${
                  errors.leadTime ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.leadTime && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.leadTime.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode Produk Supplier
              </label>
              <input
                type="text"
                {...register("kodeProdukSupplier")}
                className={`w-full p-2 border rounded-md ${
                  errors.kodeProdukSupplier
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.kodeProdukSupplier && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.kodeProdukSupplier.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register("status")}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="aktif">Aktif</option>
                <option value="tidak_aktif">Tidak Aktif</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  {...register("isPrimary")}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded mr-2 focus:ring-indigo-500"
                />
                <span>Jadikan Supplier Utama untuk Produk Ini</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={
                isCreatingProdukSupplier || availableProducts?.length === 0
              }
              className={`px-4 py-2 ${
                availableProducts?.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } text-white rounded-md flex items-center`}
            >
              {isCreatingProdukSupplier ? (
                <>
                  <Spinner size="sm" className="mr-2" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" /> Simpan
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={showEditModal}
        title="Edit Produk Supplier"
        onClose={() => setShowEditModal(false)}
      >
        <form onSubmit={handleSubmit(handleEditProduct)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produk
              </label>
              <input
                type="text"
                disabled
                value={
                  currentProduct?.produkMaster?.namaProduk ||
                  "Produk yang dipilih"
                }
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Kode: {currentProduct?.produkMaster?.kode || "Tidak ada kode"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Harga Beli
              </label>
              <input
                type="number"
                {...register("hargaBeli", { valueAsNumber: true })}
                className={`w-full p-2 border rounded-md ${
                  errors.hargaBeli ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.hargaBeli && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.hargaBeli.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Pembelian
              </label>
              <input
                type="number"
                {...register("minPembelian", { valueAsNumber: true })}
                className={`w-full p-2 border rounded-md ${
                  errors.minPembelian ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.minPembelian && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.minPembelian.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Time
              </label>
              <input
                type="number"
                {...register("leadTime", { valueAsNumber: true })}
                className={`w-full p-2 border rounded-md ${
                  errors.leadTime ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.leadTime && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.leadTime.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode Produk Supplier
              </label>
              <input
                type="text"
                {...register("kodeProdukSupplier")}
                className={`w-full p-2 border rounded-md ${
                  errors.kodeProdukSupplier
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.kodeProdukSupplier && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.kodeProdukSupplier.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register("status")}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="aktif">Aktif</option>
                <option value="tidak_aktif">Tidak Aktif</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  {...register("isPrimary")}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded mr-2 focus:ring-indigo-500"
                />
                <span>Jadikan Supplier Utama untuk Produk Ini</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUpdatingProdukSupplier}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
            >
              {isUpdatingProdukSupplier ? (
                <>
                  <Spinner size="sm" className="mr-2" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" /> Simpan
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProduct}
        title="Hapus Produk Supplier"
        message={`Apakah Anda yakin ingin menghapus produk ${currentProduct?.produkMaster?.namaProduk} dari supplier ini?`}
        confirmText="Hapus"
        cancelText="Batal"
        isLoading={isDeletingProdukSupplier}
      />
    </div>
  );
};

export default SupplierProducts;
