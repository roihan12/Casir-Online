import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Database, Box, PlusCircle, Search, AlertTriangle, Calendar,
  FileText, Trash2, Edit, Eye, ChevronDown, Filter, Download,
  Upload, RefreshCw, Truck, BarChart2, Package, AlertCircle,
  ArrowUpDown, MessageSquare, Repeat, Clock, Clipboard, X,
} from "lucide-react";

import GlobalStatsCard from "../../common/components/GlobalStatsCard";
import Spinner from "../../../features/common/Spinner";
import Pagination from "../../../features/common/Pagination";
import ConfirmationDialog from "../../../features/common/ConfirmationDialog";

import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stockAdjustmentSchema } from "../validation/InventoryValidation";
import useInventoryMutations from "../hooks/useInventoryMutations";
import { useInventoryAdjustment } from "../hooks/useInventoryAdjustment";
import { useCabangList } from "../../../features/cabang/hooks/useCabangQueries";
import useAuthStore from "../../../app/store/useAuthStore";
import reportService from "../../reports/services/reportService";
import useInventoryQueries from "../hooks/useInventoryQueries";

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------
const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value ?? 0);

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
  };
};

const STATUS_CONFIG = {
  low_stock:    { badge: "bg-orange-100 text-orange-800", bar: "bg-orange-500", label: "Stok Rendah" },
  out_of_stock: { badge: "bg-red-100 text-red-800",    bar: "bg-red-500",    label: "Habis Stok"  },
  expiring_soon:{ badge: "bg-yellow-100 text-yellow-800", bar: "bg-yellow-500", label: "Kedaluwarsa" },
  normal:       { badge: "bg-green-100 text-green-800",  bar: "bg-green-500",  label: "Normal"     },
};

const getStatusConfig = (status) => STATUS_CONFIG[status] ?? STATUS_CONFIG.normal;

const deriveStatus = (item) => {
  if (item.stok <= 0) return "out_of_stock";
  if (item.is_low_stock || item.stok <= item.stok_minimum) return "low_stock";
  return "normal";
};

const mapApiItemToRow = (item, selectedBranchId, branches) => ({
  id:            item.id,
  productName:   item.nama_produk,
  harga_jual:    item.harga_jual,
  harga_beli:    item.harga_beli,
  sku:           item.sku       ?? "N/A",
  barcode:       item.barcode   ?? "N/A",
  currentStock:  item.stok,
  minStock:      item.stok_minimum,
  maxStock:      item.max_stok,
  stokPercentage:item.stok_percentage ?? 0,
  status:        deriveStatus(item),
  stokStatus:    item.stok_status ?? "Normal",
  lastUpdated:   item.updated_at ?? new Date().toISOString(),
  expiryDate:    null,
  batchNumber:   "N/A",
  location:      "Rak Utama",
  value:         (item.harga_beli ?? 0) * (item.stok ?? 0),
  branchId:      item.cabang_id ?? selectedBranchId,
  branchName:    item.nama_cabang ??
    branches.find((b) => b.id === selectedBranchId)?.namaCabang ??
    "Unknown",
});

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Aggregate-mode banner shown when "all branches" is selected */
const AggregateBanner = ({ metadata }) => {
  if (!metadata?.branchCount) return null;
  const { date, time } = metadata?.lastRefreshed
    ? formatDate(metadata.lastRefreshed)
    : {};
  return (
    <div className="mx-4 sm:mx-6 mb-6">
      <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-start gap-3">
        <div className="shrink-0 bg-purple-100 p-2 rounded-lg">
          <Database className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Melihat Data Agregat Seluruh Cabang
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            Ringkasan inventori dari semua {metadata.branchCount} cabang.
            {date && (
              <span className="ml-1">
                Terakhir: {date}, {time}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

/** Per-branch summary table (only visible in "all" mode) */
const BranchSummaryTable = ({ branches, onSelectBranch }) => {
  if (!branches?.length) return null;
  return (
    <div className="mx-4 sm:mx-6 mb-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">Ringkasan per Cabang</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Cabang", "Total Produk", "Stok Rendah", "Habis Stok", "Nilai", ""].map(
                (h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {branches.map((branch) => (
              <tr key={branch.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                      <Database size={13} />
                    </div>
                    <span className="font-medium text-gray-900">{branch.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{branch.totalProducts}</td>
                <td className="px-4 py-3 text-orange-600 font-medium">{branch.lowStock}</td>
                <td className="px-4 py-3 text-red-600 font-medium">{branch.outOfStock}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">
                  {formatCurrency(branch.totalValue)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onSelectBranch(branch.id)}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/** Toolbar: search + filters + action buttons */
const InventoryToolbar = ({
  searchTerm, onSearchChange, onSearch,
  categoryFilter, onCategoryChange,
  statusFilter, onStatusChange,
  batchFilter, onBatchChange,
  onClearFilters, onRefresh, isLoading, onExport,
  onNavigateTransfer, onNavigateNotifications,
}) => (
  <div className="mx-4 sm:mx-6 mb-6 flex flex-col gap-3">
    {/* Row 1: search */}
    <form onSubmit={onSearch} className="w-full">
      <div className="relative">
        <input
          type="text"
          placeholder="Cari produk berdasarkan nama atau SKU..."
          className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500">
          <Search size={18} />
        </button>
      </div>
    </form>

    {/* Row 2: filters + actions */}
    <div className="flex flex-wrap gap-2">
      {/* Category */}
      <div className="relative">
        <select
          className="appearance-none bg-white border border-gray-200 rounded-lg py-2 pl-3 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">Semua Kategori</option>
          {["Elektronik","Makanan","Minuman","Pakaian","Kesehatan","Kecantikan","Rumah Tangga"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
      </div>

      {/* Status */}
      <div className="relative">
        <select
          className="appearance-none bg-white border border-gray-200 rounded-lg py-2 pl-3 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="normal">Normal</option>
          <option value="low_stock">Stok Rendah</option>
          <option value="out_of_stock">Habis Stok</option>
          <option value="expiring_soon">Segera Kedaluwarsa</option>
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
      </div>

      {/* Batch */}
      <input
        type="text"
        placeholder="Filter Batch..."
        className="bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        value={batchFilter}
        onChange={(e) => onBatchChange(e.target.value)}
      />

      <div className="flex gap-2 flex-wrap">
        <ActionButton icon={X} label="Bersihkan" onClick={onClearFilters} />
        <ActionButton icon={RefreshCw} label="Refresh"   onClick={onRefresh} spinning={isLoading} />
        <ActionButton icon={Download} label="Export" onClick={onExport} />
        <ActionButton icon={ArrowUpDown} label="Transfer Stok" onClick={onNavigateTransfer} variant="outlined" />
        <ActionButton icon={MessageSquare} label="Notifikasi" onClick={onNavigateNotifications} variant="primary" />
      </div>
    </div>
  </div>
);

const ActionButton = ({ icon: Icon, label, onClick, variant = "default", spinning = false }) => {
  const base = "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors";
  const variants = {
    default:  "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
    outlined: "border border-indigo-400 text-indigo-600 bg-white hover:bg-indigo-50",
    primary:  "bg-indigo-600 text-white hover:bg-indigo-700",
  };
  return (
    <button className={`${base} ${variants[variant]}`} onClick={onClick}>
      <Icon size={15} className={spinning ? "animate-spin" : ""} />
      <span>{label}</span>
    </button>
  );
};

/** Single inventory table row */
const InventoryRow = ({ item, onAdjust, onViewMovements }) => {
  const navigate = useNavigate();
  const { badge, bar } = getStatusConfig(item.status);
  const { date, time } = formatDate(item.lastUpdated);
  const pct = Math.min(100, item.stokPercentage || 100);

  return (
    <tr className="hover:bg-gray-50/60 transition-colors">
      {/* Product */}
      <td className="px-4 py-4 align-top">
        <div className="flex items-start gap-3">
          <div className="shrink-0 h-9 w-9 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mt-0.5">
            <Package size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug" title={item.productName}>
              {item.productName}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              SKU: <span className="font-medium text-gray-700">{item.sku}</span>
              {item.barcode && item.barcode !== "N/A" && (
                <> &middot; Barcode: <span className="font-medium text-gray-700">{item.barcode}</span></>
              )}
            </p>
          </div>
        </div>
      </td>

      {/* Price — hidden on mobile */}
      <td className="px-4 py-4 align-top hidden sm:table-cell">
        <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
          {formatCurrency(item.harga_jual)}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">
          Beli: {formatCurrency(item.harga_beli)}
        </p>
      </td>

      {/* Stock & Status */}
      <td className="px-4 py-4 align-top w-44">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-bold text-gray-900">{item.currentStock}</span>
          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${badge}`}>
            {item.stokStatus}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>Min: {item.minStock}</span>
          <span>Max: {item.maxStock ?? "-"}</span>
        </div>
      </td>

      {/* Branch — hidden below lg */}
      <td className="px-4 py-4 align-top hidden lg:table-cell">
        <p className="text-sm font-medium text-gray-900">{item.branchName ?? "-"}</p>
        <p className="text-xs text-gray-500 mt-0.5">{item.location ?? "-"}</p>
      </td>

      {/* Last Updated — hidden below md */}
      <td className="px-4 py-4 align-top hidden md:table-cell whitespace-nowrap">
        <p className="text-sm text-gray-900">{date}</p>
        <p className="text-xs text-gray-500 mt-0.5">{time}</p>
      </td>

      {/* Actions */}
      <td className="px-4 py-4 align-top text-center whitespace-nowrap">
        <div className="inline-flex gap-1">
          <IconButton
            icon={Eye}
            color="indigo"
            title="Lihat detail"
            onClick={() => navigate(`/inventory/product/${item.id}`)}
          />
          <IconButton
            icon={Edit}
            color="blue"
            title="Sesuaikan stok"
            onClick={() => onAdjust(item)}
          />
          <IconButton
            icon={Clipboard}
            color="green"
            title="Riwayat pergerakan"
            onClick={() => onViewMovements(item.id)}
          />
        </div>
      </td>
    </tr>
  );
};

const ICON_COLOR = {
  indigo: "text-indigo-600 hover:bg-indigo-50",
  blue:   "text-blue-600 hover:bg-blue-50",
  green:  "text-green-600 hover:bg-green-50",
};

const IconButton = ({ icon: Icon, color, title, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded transition-colors ${ICON_COLOR[color]}`}
  >
    <Icon size={17} />
  </button>
);

/** Stock Adjustment form fields (used inside ConfirmationDialog) */
const StockAdjustmentForm = ({ product, register, errors }) => (
  <div className="mt-4 space-y-4">
    <FormField label="Stok Saat Ini">
      <input
        type="text"
        className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
        value={product?.currentStock ?? 0}
        disabled
      />
    </FormField>

    <FormField label="Cabang">
      <input
        type="text"
        className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
        value={product?.branchName ?? "-"}
        disabled
      />
    </FormField>

    <FormField label="Stok Baru" error={errors.newStock?.message}>
      <input
        type="number"
        className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.newStock ? "border-red-400" : "border-gray-300"}`}
        {...register("newStock", { valueAsNumber: true })}
      />
    </FormField>

    <FormField label="Nomor Batch" error={errors.batchNumber?.message}>
      <input
        type="text"
        placeholder="Masukkan nomor batch"
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        {...register("batchNumber")}
      />
    </FormField>

    <FormField label="Tanggal Kadaluarsa" error={errors.expiryDate?.message}>
      <input
        type="date"
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        {...register("expiryDate")}
      />
    </FormField>

    <FormField label="Alasan Penyesuaian" error={errors.reason?.message}>
      <select
        className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.reason ? "border-red-400" : "border-gray-300"}`}
        {...register("reason")}
      >
        <option value="">Pilih alasan</option>
        <option value="correction">Koreksi Stok</option>
        <option value="damage">Barang Rusak</option>
        <option value="expiry">Barang Kedaluwarsa</option>
        <option value="theft">Pencurian</option>
        <option value="transfer">Transfer Antar Cabang</option>
        <option value="other">Lainnya</option>
      </select>
    </FormField>

    <FormField label="Catatan" error={errors.notes?.message}>
      <textarea
        rows={3}
        placeholder="Tambahkan catatan jika diperlukan"
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        {...register("notes")}
      />
    </FormField>
  </div>
);

const FormField = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const InventoryManagement = ({ cabangData }) => {
  const navigate  = useNavigate();

  /* ── Auth / branch ── */
  const userCabang       = useAuthStore((s) => s.getUserCabang());
  const primaryCabang    = useAuthStore((s) => s.getPrimaryCabang());
  const hasMultipleBranches = userCabang.length > 1;
  const defaultBranchId  = userCabang.length === 1 && primaryCabang
    ? (primaryCabang.id ?? primaryCabang.cabangId ?? primaryCabang.cabang_id)
    : "all";

  /* ── Queries ── */
  const { useDashboardData, useLowStockProducts, useStockMovementData, useBranchTransferData } =
    useInventoryQueries();
  const { createAdjustment } = useInventoryAdjustment();
  const isAdjusting = createAdjustment.isLoading;

  /* ── Cabang list ── */
  const { data: cabangListData, isLoading: isCabangLoading } = useCabangList();

  /* ── Local state ── */
  const [branches,        setBranches       ] = useState([]);
  const [selectedBranchId,setSelectedBranchId] = useState(defaultBranchId);
  const [selectedPeriod,  setSelectedPeriod ] = useState(30);
  const [inventory,       setInventory      ] = useState([]);
  const [totalItems,      setTotalItems     ] = useState(0);
  const [totalPages,      setTotalPages     ] = useState(1);
  const [currentPage,     setCurrentPage    ] = useState(1);
  const [pageSize                           ] = useState(10);

  // Filter state
  const [searchTerm,    setSearchTerm   ] = useState("");
  const [statusFilter,  setStatusFilter ] = useState("");
  const [categoryFilter,setCategoryFilter] = useState("");
  const [batchFilter,   setBatchFilter  ] = useState("");

  // Modal state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  /* ── Form ── */
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: { newStock: 0, reason: "", notes: "", batchNumber: "", expiryDate: "" },
  });

  /* ── Data fetching ── */
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError, refetch: refetchDashboard } =
    useDashboardData(selectedBranchId, selectedPeriod);

  const { data: lowStockData,  isLoading: isLowStockLoading,  error: lowStockError, refetch: refetchLowStock } =
    useLowStockProducts(selectedBranchId, { 
      page: currentPage, 
      limit: pageSize,
      search: searchTerm,
      status: statusFilter,
      kategori: categoryFilter,
      batch: batchFilter
    });

  const { isLoading: isMovementLoading } = useStockMovementData(selectedBranchId, selectedPeriod);
  const { isLoading: isTransferLoading } = useBranchTransferData(selectedBranchId, selectedPeriod);

  const isLoading = isDashboardLoading || isLowStockLoading || isMovementLoading || isTransferLoading || isCabangLoading;

  const handleRefresh = useCallback(() => {
    refetchDashboard();
    refetchLowStock();
  }, [refetchDashboard, refetchLowStock]);

  /* ── Sync cabang list ── */
  useEffect(() => {
    if (!cabangListData?.data) return;
    setBranches(
      cabangListData.data.map((c) => ({
        id: c.id ?? c.cabang_id,
        namaCabang: c.namaCabang ?? c.nama_cabang,
      }))
    );
  }, [cabangListData]);

  /* ── Sync inventory rows from API data ── */
  useEffect(() => {
    if (!dashboardData || !lowStockData?.data) return;
    const rows = lowStockData.data.map((item) => mapApiItemToRow(item, selectedBranchId, branches));
    setInventory(rows);
    if (lowStockData.pagination) {
      setTotalItems(lowStockData.pagination.totalItems);
      setTotalPages(lowStockData.pagination.totalPages);
    } else {
      setTotalItems(rows.length);
      setTotalPages(Math.ceil(rows.length / pageSize));
    }
  }, [dashboardData, lowStockData, selectedBranchId, branches, pageSize]);

  /* ── Refetch on branch change ── */
  useEffect(() => { handleRefresh(); }, [selectedBranchId, handleRefresh]);

  /* ── Handlers ── */
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm(""); setStatusFilter(""); setCategoryFilter(""); setBatchFilter("");
    setCurrentPage(1);
    handleRefresh();
  }, [handleRefresh]);

  const openAdjustModal = useCallback((product) => {
    setSelectedProduct(product);
    setValue("newStock",    product.currentStock);
    setValue("batchNumber", product.batchNumber);
    setValue("expiryDate",  product.expiryDate
      ? new Date(product.expiryDate).toISOString().split("T")[0]
      : "");
    setShowAdjustModal(true);
  }, [setValue]);

  const closeAdjustModal = useCallback(() => {
    setShowAdjustModal(false);
    setSelectedProduct(null);
    reset();
  }, [reset]);

  const handleAdjustStock = useCallback(async (formData) => {
    if (!selectedProduct) return;
    
    // The createAdjustment mutation expects:
    // { produkId, cabangId, quantity, batchNumber, expiredDate, keterangan, referenceType }
    await createAdjustment.mutateAsync({
      produkId: selectedProduct.id,
      cabangId: selectedBranchId === "all" ? selectedProduct.branchId : selectedBranchId,
      quantity: Number(formData.newStock), 
      referenceType: "adjustment",
      keterangan: formData.reason ? `${formData.reason} - ${formData.notes || ''}` : formData.notes || "Penyesuaian stok reguler via dashboard",
      batchNumber: formData.batchNumber || "",
      expiredDate: formData.expiryDate || null,
    });
    closeAdjustModal();
  }, [selectedProduct, createAdjustment, closeAdjustModal, selectedBranchId]);

  /* ── Client-side filtered rows ── */
  // Server handles the filtering now using useLowStockProducts query params!
  const filteredInventory = inventory;

  const handleExport = useCallback(async () => {
    try {
      const start = new Date();
      start.setDate(start.getDate() - selectedPeriod);
      const end = new Date();
      
      const pStartDate = start.toISOString().split("T")[0];
      const pEndDate = end.toISOString().split("T")[0];
      
      toast.loading("Memproses ekspor data...", { id: "export-loading" });
      
      await reportService.exportReport("low-stock", "csv", {
        startDate: pStartDate,
        endDate: pEndDate,
        cabangId: selectedBranchId === "all" ? undefined : selectedBranchId,
      });

      toast.success("Data inventori berhasil diekspor", { id: "export-loading" });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengekspor data", { id: "export-loading" });
    }
  }, [selectedBranchId, selectedPeriod]);

  /* ── Movement stats shorthand ── */
  const mv = dashboardData?.movementData ?? {};

  /* ── Render ── */
  return (
    <div className="pb-10">

      {/* ── Page header ── */}
      <div className="bg-indigo-600 text-white py-7 px-4 mb-6 text-center">
        <h1 className="text-xl sm:text-2xl font-bold mb-1.5">Manajemen Inventori</h1>
        <div className="flex items-center justify-center gap-2 text-indigo-200 text-sm">
          <Database size={16} />
          <span>Kelola stok produk dan pergerakan inventori</span>
        </div>
      </div>

      {/* ── Branch selector ── */}
      {hasMultipleBranches && (
        <div className="mx-4 sm:mx-6 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Pilih Cabang</h2>
                <p className="text-xs text-gray-500 mt-0.5">Filter data inventori berdasarkan cabang</p>
              </div>
              <div className="w-full sm:w-64">
                {isCabangLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Spinner size="small" /> Memuat...
                  </div>
                ) : (
                  <select
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                  >
                    <option value="all">Semua Cabang (Data Agregat)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.namaCabang}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Aggregate banner ── */}
      {selectedBranchId === "all" && (
        <AggregateBanner metadata={dashboardData?.metadata} />
      )}

      {/* ── Summary stats ── */}
      <div className="mx-4 sm:mx-6 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        <GlobalStatsCard title="Total Produk"   value={dashboardData?.summaryData?.totalProduk ?? 0}
          percentage={`${dashboardData?.changeData?.totalProdukPerubahan ?? 0}% dari periode sebelumnya`}
          isPositive={true}  icon={Box}          isLoading={isDashboardLoading} />

        <GlobalStatsCard title="Stok Rendah"    value={dashboardData?.summaryData?.stokRendah ?? 0}
          percentage={`${dashboardData?.changeData?.stokRendahPerubahan ?? 0}% dari periode sebelumnya`}
          isPositive={false} icon={AlertCircle}  isLoading={isDashboardLoading} />

        <GlobalStatsCard title="Habis Stok"     value={dashboardData?.summaryData?.habisStok ?? 0}
          percentage={`${dashboardData?.changeData?.habisStokPerubahan ?? 0}% dari periode sebelumnya`}
          isPositive={false} icon={AlertTriangle} isLoading={isDashboardLoading} />

        <GlobalStatsCard title="Kedaluwarsa"    value={dashboardData?.summaryData?.kadaluwarsa30Hari ?? 0}
          percentage="< 30 Hari"
          isPositive={false} icon={Calendar}     isLoading={isDashboardLoading} />

        <div className="col-span-2 sm:col-span-1">
          <GlobalStatsCard title="Nilai Inventori" value={formatCurrency(dashboardData?.summaryData?.nilaiInventori ?? 0)}
            percentage="Total aset persediaan"
            isPositive={true}  icon={BarChart2}    isLoading={isDashboardLoading} />
        </div>
      </div>

      {/* ── Movement cards ── */}
      <div className="mx-4 sm:mx-6 grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Pergerakan Stok", key: "pergerakanStok", icon: Repeat,     color: "green"  },
          { label: "Stok Masuk",      key: "stokMasuk",      icon: ArrowUpDown, color: "blue"   },
          { label: "Stok Keluar",     key: "stokKeluar",     icon: Package,     color: "orange" },
          { label: "Transfer Cabang", key: "transferCabang", icon: Truck,       color: "purple",
            subKey: "cabangTerlibat", subLabel: "cabang terlibat" },
        ].map(({ label, key, icon: Icon, color, subKey, subLabel }) => {
          const data     = mv[key] ?? {};
          const pct      = data.perubahan ?? 0;
          const positive = pct >= 0;
          const iconBg   = { green: "bg-green-100", blue: "bg-blue-100", orange: "bg-orange-100", purple: "bg-purple-100" }[color];
          const iconClr  = { green: "text-green-600", blue: "text-blue-600", orange: "text-orange-600", purple: "text-purple-600" }[color];
          return (
            <div key={key} className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{selectedPeriod} hari terakhir</p>
                </div>
                <div className={`${iconBg} p-2 rounded-lg shrink-0`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconClr}`} />
                </div>
              </div>
              <div className="mt-3">
                {isDashboardLoading ? <Spinner /> : (
                  <>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{data.total ?? 0}</p>
                    {subKey ? (
                      <p className="text-xs text-gray-500 mt-0.5">
                        <span className={`font-semibold ${iconClr}`}>{data[subKey] ?? 0}</span> {subLabel}
                      </p>
                    ) : (
                      <p className="text-xs mt-0.5">
                        <span className={`font-semibold ${positive ? "text-green-600" : "text-red-600"}`}>
                          {positive ? "+" : ""}{pct}%
                        </span>
                        <span className="text-gray-400 ml-1">dari periode lalu</span>
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Branch summary table (all mode) ── */}
      {selectedBranchId === "all" && (
        <BranchSummaryTable
          branches={dashboardData?.metadata?.branches}
          onSelectBranch={setSelectedBranchId}
        />
      )}

      {/* ── Toolbar ── */}
      <InventoryToolbar
        searchTerm={searchTerm}         onSearchChange={setSearchTerm}    onSearch={handleSearch}
        categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter}
        statusFilter={statusFilter}     onStatusChange={setStatusFilter}
        batchFilter={batchFilter}       onBatchChange={setBatchFilter}
        onClearFilters={clearFilters}   onRefresh={handleRefresh}       isLoading={isLoading}
        onExport={handleExport}
        onNavigateTransfer={()    => navigate("/inventory/transfer")}
        onNavigateNotifications={() => navigate("/inventory/notifications")}
      />

      {/* ── Inventory table ── */}
      <div className="mx-4 sm:mx-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { label: "Produk",             cls: "min-w-[200px]" },
                  { label: "Harga",              cls: "hidden sm:table-cell" },
                  { label: "Stok & Status",      cls: "min-w-[160px]" },
                  { label: "Cabang",             cls: "hidden lg:table-cell" },
                  { label: "Pembaruan Terakhir", cls: "hidden md:table-cell" },
                  { label: "Aksi",               cls: "text-center" },
                ].map(({ label, cls }) => (
                  <th key={label} scope="col"
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${cls}`}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="py-12 text-center"><Spinner /></td></tr>
              ) : dashboardError || lowStockError ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-red-500 text-sm">
                    <AlertTriangle className="inline h-4 w-4 mr-1" />
                    {dashboardError?.message ?? lowStockError?.message ?? "Terjadi kesalahan saat memuat data"}
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400 text-sm">
                    Tidak ada data inventori yang ditemukan
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <InventoryRow
                    key={item.id}
                    item={item}
                    onAdjust={openAdjustModal}
                    onViewMovements={(id) => navigate(`/inventory/movements?productId=${id}`)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filteredInventory.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-gray-900">{filteredInventory.length}</span>{" "}
              dari <span className="font-medium text-gray-900">{totalItems}</span> produk
            </p>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      {/* ── Stock Adjustment Modal ── */}
      <ConfirmationDialog
        isOpen={showAdjustModal}
        title="Sesuaikan Stok Produk"
        message={`Sesuaikan stok untuk "${selectedProduct?.productName}"`}
        confirmLabel="Simpan"
        cancelLabel="Batal"
        isLoading={isAdjusting}
        onConfirm={handleSubmit(handleAdjustStock)}
        onCancel={closeAdjustModal}
        confirmButtonClassName="bg-blue-600 hover:bg-blue-700"
        customContent={
          <StockAdjustmentForm product={selectedProduct} register={register} errors={errors} />
        }
      />
    </div>
  );
};

export default InventoryManagement;