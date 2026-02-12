import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { movementFilterSchema } from "../validation/InventoryValidation";
import {
  Database,
  Search,
  Filter,
  Calendar,
  ArrowUpDown,
  Download,
  RefreshCw,
  Package,
  ArrowUp,
  ArrowDown,
  Edit3,
  TrendingUp,
  Truck,
  X,
  ChevronDown,
  Clock,
  FileText,
} from "lucide-react";
import Spinner from "../../../features/common/Spinner";
import Pagination from "../../../features/common/Pagination";
import { useCabangList } from "../../../features/cabang/hooks/useCabangQueries";
import {
  useInventoryMovements,
  useExportMovements,
} from "../hooks/useInventoryMovements";
import { useGenerateMovementReport } from "../hooks/useInventoryReports";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Export Button Component
const ExportButton = ({ queryParams }) => {
  const { mutate: exportData, isLoading } = useExportMovements();

  const handleExport = () => {
    exportData(queryParams);
  };

  return (
    <button
      className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
      onClick={handleExport}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Spinner size="small" className="mr-1" />
          <span>Memproses...</span>
        </>
      ) : (
        <>
          <Download size={16} className="mr-1" />
          <span>Export CSV</span>
        </>
      )}
    </button>
  );
};

// Report Button Component
const ReportButton = ({ queryParams }) => {
  const { mutate: generateReport, isLoading } = useGenerateMovementReport();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const handleGenerateReport = (format, outputType = "pdf") => {
    // Add format parameter for the report
    generateReport({
      ...queryParams,
      format,
      outputType,
    });
    setShowMenu(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center justify-center px-3 py-2 border border-indigo-500 rounded-lg text-indigo-500 bg-white hover:bg-indigo-50"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Spinner size="small" className="mr-1" />
            <span>Memproses...</span>
          </>
        ) : (
          <>
            <FileText size={16} className="mr-1" />
            <span className="mr-1">Laporan</span>
            <ChevronDown size={14} />
          </>
        )}
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-1 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Format Laporan
            </div>
            <div className="pl-3 pb-1">
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                role="menuitem"
                onClick={() => handleGenerateReport("detailed")}
              >
                <FileText size={14} className="mr-2" />
                <span>Laporan Detail (PDF)</span>
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                role="menuitem"
                onClick={() => handleGenerateReport("summary")}
              >
                <FileText size={14} className="mr-2" />
                <span>Laporan Ringkas (PDF)</span>
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                role="menuitem"
                onClick={() => handleGenerateReport("batch")}
              >
                <FileText size={14} className="mr-2" />
                <span>Laporan Per Batch (PDF)</span>
              </button>
            </div>

            <div className="border-t border-gray-100 my-1"></div>

            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Format Spreadsheet
            </div>
            <div className="pl-3 pb-1">
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                role="menuitem"
                onClick={() => handleGenerateReport("detailed", "excel")}
              >
                <Download size={14} className="mr-2" />
                <span>Export ke Excel</span>
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                role="menuitem"
                onClick={() => handleGenerateReport("detailed", "csv")}
              >
                <Download size={14} className="mr-2" />
                <span>Export ke CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InventoryMovements = () => {
  // Get query parameters
  const [searchParams] = useSearchParams();
  const productIdFromUrl = searchParams.get("productId");

  // State for filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBranchId, setSelectedBranchId] = useState("all");
  const [selectedProductId, setSelectedProductId] = useState(
    productIdFromUrl || ""
  );
  const [selectedMovementType, setSelectedMovementType] = useState("all");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Get branch data
  const { data: cabangListData, isLoading: isCabangLoading } = useCabangList();
  const [branches, setBranches] = useState([]);

  // Set up form with zod validation
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(movementFilterSchema),
    defaultValues: {
      cabangId: selectedBranchId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      produkId: selectedProductId,
      type: selectedMovementType,
      page: currentPage,
      limit: itemsPerPage,
    },
  });

  // Prepare query parameters
  const queryParams = {
    cabangId: selectedBranchId === "all" ? undefined : selectedBranchId,
    produkId: selectedProductId || undefined,
    type: selectedMovementType === "all" ? undefined : selectedMovementType,
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
    page: currentPage,
    limit: itemsPerPage,
  };

  // Use the inventory movements hook
  const {
    data: movementsData,
    isLoading: isMovementsLoading,
    error: movementsError,
    refetch: refetchMovements,
  } = useInventoryMovements(queryParams);

  // Update form values when filters change
  useEffect(() => {
    setValue("cabangId", selectedBranchId);
    setValue("produkId", selectedProductId);
    setValue("type", selectedMovementType);
    setValue(
      "startDate",
      dateRange.startDate ? new Date(dateRange.startDate) : undefined
    );
    setValue(
      "endDate",
      dateRange.endDate ? new Date(dateRange.endDate) : undefined
    );
    setValue("page", currentPage);
    setValue("limit", itemsPerPage);
  }, [
    selectedBranchId,
    selectedProductId,
    selectedMovementType,
    dateRange,
    currentPage,
    itemsPerPage,
    setValue,
  ]);

  // Update branches when cabangListData is loaded
  useEffect(() => {
    if (cabangListData?.data) {
      const branchesData = cabangListData.data.map((cabang) => ({
        id: cabang.id || cabang.cabang_id,
        namaCabang: cabang.namaCabang || cabang.nama_cabang,
      }));
      setBranches(branchesData);
    }
  }, [cabangListData]);

  // Update pagination when data is loaded
  useEffect(() => {
    if (movementsData) {
      setTotalItems(movementsData.metadata?.total || 0);
      setTotalPages(movementsData.metadata?.totalPages || 1);
    }
  }, [movementsData]);

  // Handle filter form submission
  const onSubmitFilter = (data) => {
    setSelectedBranchId(data.cabangId);
    setSelectedProductId(data.produkId || "");
    setSelectedMovementType(data.type || "all");
    setDateRange({
      startDate: data.startDate
        ? format(new Date(data.startDate), "yyyy-MM-dd")
        : "",
      endDate: data.endDate ? format(new Date(data.endDate), "yyyy-MM-dd") : "",
    });
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // In a real app, you might add the search term to your API call
    // For now, we'll just update the local state
    setSearchTerm(e.target.value);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedBranchId("all");
    setSelectedProductId("");
    setSelectedMovementType("all");
    setDateRange({ startDate: "", endDate: "" });
    setSearchTerm("");
    setCurrentPage(1);
    reset({
      cabangId: "all",
      produkId: "",
      type: "all",
      startDate: undefined,
      endDate: undefined,
      page: 1,
      limit: itemsPerPage,
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: id });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Get movement type badge
  const getMovementTypeBadge = (type) => {
    switch (type) {
      case "pembelian":
        return (
          <span className="px-2 py-1 inline-flex items-center text-xs leading-4 font-semibold rounded-full bg-green-100 text-green-800">
            <ArrowUp size={12} className="mr-1" />
            Masuk
          </span>
        );
      case "penjualan":
        return (
          <span className="px-2 py-1 inline-flex items-center text-xs leading-4 font-semibold rounded-full bg-red-100 text-red-800">
            <ArrowDown size={12} className="mr-1" />
            Keluar
          </span>
        );
      case "adjustment":
        return (
          <span className="px-2 py-1 inline-flex items-center text-xs leading-4 font-semibold rounded-full bg-blue-100 text-blue-800">
            <Edit3 size={12} className="mr-1" />
            Penyesuaian
          </span>
        );
      case "transfer":
        return (
          <span className="px-2 py-1 inline-flex items-center text-xs leading-4 font-semibold rounded-full bg-purple-100 text-purple-800">
            <Truck size={12} className="mr-1" />
            Transfer
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 inline-flex items-center text-xs leading-4 font-semibold rounded-full bg-gray-100 text-gray-800">
            <ArrowUpDown size={12} className="mr-1" />
            Lainnya
          </span>
        );
    }
  };

  return (
    <div className="pb-6">
      {/* Page Header */}
      <div className="flex flex-col items-center justify-center bg-indigo-600 text-white py-8 mb-6">
        <h1 className="text-2xl font-bold mb-2">Riwayat Pergerakan Stok</h1>
        <div className="flex items-center">
          <ArrowUpDown size={24} className="mr-2" />
          <span>Pantau pergerakan stok masuk dan keluar dari inventori</span>
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
                Filter Pergerakan
              </h2>
              <p className="text-sm text-gray-500">
                Tentukan filter untuk melihat riwayat pergerakan stok
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmitFilter)}>
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
                    {...register("cabangId")}
                    className={`w-full rounded-md border ${
                      errors.cabangId ? "border-red-500" : "border-gray-300"
                    } shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                  >
                    <option value="all">Semua Cabang</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.namaCabang}
                      </option>
                    ))}
                  </select>
                )}
                {errors.cabangId && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.cabangId.message}
                  </p>
                )}
              </div>

              {/* Movement Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe Pergerakan
                </label>
                <select
                  {...register("type")}
                  className={`w-full rounded-md border ${
                    errors.type ? "border-red-500" : "border-gray-300"
                  } shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                >
                  <option value="all">Semua Tipe</option>
                  <option value="in">Stok Masuk</option>
                  <option value="out">Stok Keluar</option>
                  <option value="adjustment">Penyesuaian</option>
                  <option value="transfer">Transfer</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.type.message}
                  </p>
                )}
              </div>

              {/* Product ID Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Produk (Opsional)
                </label>
                <input
                  type="text"
                  {...register("produkId")}
                  placeholder="Masukkan ID produk"
                  className={`w-full rounded-md border ${
                    errors.produkId ? "border-red-500" : "border-gray-300"
                  } shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                />
                {errors.produkId && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.produkId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    {...register("startDate")}
                    className={`w-full rounded-md border ${
                      errors.startDate ? "border-red-500" : "border-gray-300"
                    } shadow-sm py-2 pl-10 pr-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                  />
                </div>
                {errors.startDate && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Akhir
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    {...register("endDate")}
                    className={`w-full rounded-md border ${
                      errors.endDate ? "border-red-500" : "border-gray-300"
                    } shadow-sm py-2 pl-10 pr-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                  />
                </div>
                {errors.endDate && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <X size={16} className="mr-2" />
                Bersihkan Filter
              </button>
              <button
                type="submit"
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
        {/* Search Bar */}
        <div className="w-full md:w-auto flex-grow md:max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari berdasarkan deskripsi..."
              className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={handleSearch}
            />
            <div className="absolute right-0 top-0 mt-2 mr-3 text-gray-400">
              <Search size={20} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => refetchMovements()}
            disabled={isMovementsLoading}
          >
            <RefreshCw
              size={16}
              className={`mr-1 ${isMovementsLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <ExportButton queryParams={queryParams} />

          <ReportButton queryParams={queryParams} />
        </div>
      </div>

      {/* Movements Table */}
      <div className="mx-6 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tanggal & Waktu
                </th>
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
                  Tipe
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Jumlah
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Sebelum
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Setelah
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Alasan / Referensi
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Cabang
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Pengguna
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isMovementsLoading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center">
                    <Spinner />
                  </td>
                </tr>
              ) : movementsError ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-4 text-center text-red-500"
                  >
                    Error: {movementsError.message}
                  </td>
                </tr>
              ) : movementsData?.data?.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Tidak ada data pergerakan stok yang ditemukan
                  </td>
                </tr>
              ) : (
                movementsData?.data?.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {formatDate(movement.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                          <Package size={16} />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {movement.produk?.produkMaster?.namaProduk || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            SKU: {movement.produk?.produkMaster?.sku || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getMovementTypeBadge(movement.referenceType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          movement.referenceType === "pembelian" ||
                          movement.referenceType === "adjustment"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {movement.referenceType === "pembelian" ||
                        movement.referenceType === "adjustment"
                          ? "+"
                          : ""}
                        {movement.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.produk?.stok}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.produk?.stok + movement.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="max-w-xs truncate">
                        {movement.keterangan || movement.reference || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.cabang?.namaCabang || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.user?.namaLengkap || "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isMovementsLoading &&
          !movementsError &&
          movementsData?.data?.length > 0 && (
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between items-center">
                <p className="text-sm text-gray-700">
                  Menampilkan{" "}
                  <span className="font-medium">
                    {movementsData?.data?.length}
                  </span>{" "}
                  dari <span className="font-medium">{totalItems}</span>{" "}
                  pergerakan stok
                </p>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    <span>Tampilkan per halaman:</span>
                    <select
                      className="ml-2 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
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

export default InventoryMovements;
