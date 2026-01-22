import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Package,
  PlusCircle,
  Search,
  UserX,
  UserCheck,
  FileText,
  Trash2,
  Edit,
  Eye,
  ChevronDown,
  Download,
  RefreshCw,
  AtSign,
  Phone,
  Building,
  UserCircle,
  Store,
} from "lucide-react";

import GlobalStatsCard from "../../../components/superadmin/GlobalStatsCard";
import Table from "../../common/Table";
import ConfirmationDialog from "../../common/ConfirmationDialog";
import withCabangData from "../../cabang/hoc/withCabangData";
import {
  useSupplierList,
  useSupplierStats,
  useDeleteSupplier,
  useChangeSupplierStatus,
} from "../../../hooks/useSupplierQueries";
import { useCabang } from "../../cabang/hooks/useCabang";

const SupplierManagementPage = () => {
  const navigate = useNavigate();

  const { cabangList } = useCabang();

  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cabangFilter, setCabangFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // State for confirmation dialogs
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  // Prepare filters for API request
  const filters = {
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    status: statusFilter,
    cabangId: cabangFilter,
  };

  // Fetch suppliers with TanStack Query
  const {
    data: suppliersData,
    isLoading: isLoadingSuppliers,
    isError: isErrorSuppliers,
    error: suppliersError,
    refetch: refetchSuppliers,
  } = useSupplierList(filters);

  // Fetch supplier stats with TanStack Query
  const { data: statsData, isLoading: isLoadingStats } =
    useSupplierStats(cabangFilter);

  // Setup mutation hooks
  const deleteSupplierMutation = useDeleteSupplier();
  const changeStatusMutation = useChangeSupplierStatus();

  // Extract data from query results
  const suppliers = suppliersData?.data || [];
  const pagination = suppliersData?.pagination || {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: pageSize,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // Prepare stats for display
  const supplierStats = {
    total: statsData?.data?.total?.count || 0,
    active: statsData?.data?.active?.count || 0,
    inactive:
      statsData?.data?.total?.count - (statsData?.data?.active?.count || 0),
    withProducts: statsData?.data?.withProducts?.count || 0,
    withTransactions: statsData?.data?.withTransactions?.count || 0,
    recentlyAdded: statsData?.data?.total?.new || 0,
  };

  // Handle form submission for search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    setPageSize(Number(newSize));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle cabang change
  const handleCabangChange = (e) => {
    if (e.target.value === "global") {
      setCabangFilter(null);
    } else {
      setCabangFilter(e.target.value);
    }
    setCurrentPage(1); // Reset to first page on cabang change
  };

  // Handle delete supplier
  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    await deleteSupplierMutation.mutate(selectedSupplier.id, {
      onSuccess: () => {
        setShowConfirmDelete(false);
        setSelectedSupplier(null);
      },
    });
  };

  // Handle change supplier status
  const handleChangeStatus = async () => {
    if (!selectedSupplier || !newStatus) return;

    await changeStatusMutation.mutate(
      { id: selectedSupplier.id, status: newStatus },
      {
        onSuccess: () => {
          setShowStatusChangeModal(false);
          setSelectedSupplier(null);
          setNewStatus("");
        },
      }
    );
  };

  // Open delete confirmation modal
  const openDeleteModal = (supplier) => {
    setSelectedSupplier(supplier);
    setShowConfirmDelete(true);
  };

  // Open status change modal
  const openStatusChangeModal = (supplier, status) => {
    setSelectedSupplier(supplier);
    setNewStatus(status);
    setShowStatusChangeModal(true);
  };

  // Handle view supplier details
  const handleViewSupplier = (id) => {
    navigate(`/superadmin/suppliers/${id}`);
  };

  // Handle edit supplier
  const handleEditSupplier = (id) => {
    navigate(`/superadmin/suppliers/${id}/edit`);
  };

  // Define table columns
  const columns = [
    {
      header: "Nama Supplier",
      accessor: "namaSupplier",
      cell: (supplier) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <Truck size={20} />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {supplier.namaSupplier}
            </div>
            {supplier.npwp && (
              <div className="text-xs text-gray-500">NPWP: {supplier.npwp}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Kontak",
      accessor: "telepon",
      cell: (supplier) => (
        <div>
          <div className="text-sm text-gray-900 flex items-center">
            <Phone size={14} className="mr-1 text-gray-400" />
            {supplier.telepon || "-"}
          </div>
          <div className="text-sm text-gray-500 flex items-center">
            <AtSign size={14} className="mr-1 text-gray-400" />
            {supplier.email || "-"}
          </div>
        </div>
      ),
    },
    {
      header: "Alamat",
      accessor: "alamat",
      cell: (supplier) => (
        <div className="text-sm text-gray-900 flex items-start">
          <Building
            size={14}
            className="mr-1 mt-1 text-gray-400 flex-shrink-0"
          />
          <span className="line-clamp-2">{supplier.alamat || "-"}</span>
        </div>
      ),
    },
    {
      header: "PIC",
      accessor: "picNama",
      cell: (supplier) => (
        <div>
          <div className="text-sm text-gray-900 flex items-center">
            <UserCircle size={14} className="mr-1 text-gray-400" />
            {supplier.picNama || "-"}
          </div>
          {supplier.picKontak && (
            <div className="text-sm text-gray-500">{supplier.picKontak}</div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (supplier) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            supplier.status === "aktif"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {supplier.status === "aktif" ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    {
      header: "Cabang",
      accessor: "cabang_id",
      cell: (supplier) => (
        <div className="text-sm text-gray-900 flex items-center">
          <Store size={14} className="mr-1 text-gray-400" />
          {supplier.cabang.namaCabang || "-"}
        </div>
      ),
    },
    {
      header: "Tgl Daftar",
      accessor: "createdAt",
      cell: (supplier) => (
        <span className="text-sm text-gray-500">
          {new Date(supplier.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Aksi",
      accessor: "actions",
      cell: (supplier) => (
        <div className="flex justify-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewSupplier(supplier.id);
            }}
            className="text-indigo-600 hover:text-indigo-900"
            title="Lihat detail"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditSupplier(supplier.id);
            }}
            className="text-blue-600 hover:text-blue-900"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          {supplier.status === "aktif" ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openStatusChangeModal(supplier, "nonaktif");
              }}
              className="text-orange-600 hover:text-orange-900"
              title="Nonaktifkan"
            >
              <UserX size={18} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openStatusChangeModal(supplier, "aktif");
              }}
              className="text-green-600 hover:text-green-900"
              title="Aktifkan"
            >
              <UserCheck size={18} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(supplier);
            }}
            className="text-red-600 hover:text-red-900"
            title="Hapus"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="pb-6">
      {/* Dashboard Header */}
      <div className="flex flex-col items-center justify-center bg-indigo-600 text-white py-8 mb-6">
        <h1 className="text-2xl font-bold mb-2">Manajemen Supplier</h1>
        <div className="flex items-center">
          <Truck size={24} className="mr-2" />
          <span>Kelola semua supplier dan relasi bisnis</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mx-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GlobalStatsCard
          title="Total Supplier"
          value={supplierStats.total}
          percentage={`${supplierStats.recentlyAdded} baru bulan ini`}
          isPositive={supplierStats.recentlyAdded > 0}
          icon={Truck}
          isLoading={isLoadingStats}
        />

        <GlobalStatsCard
          title="Supplier Aktif"
          value={supplierStats.active}
          percentage={`${statsData?.data?.active?.percentage || 0}%`}
          isPositive={statsData?.data?.active?.change >= 0}
          changeValue={statsData?.data?.active?.change}
          icon={UserCheck}
          isLoading={isLoadingStats}
        />

        <GlobalStatsCard
          title="Supplier Dengan Produk"
          value={supplierStats.withProducts}
          percentage={`${statsData?.data?.withProducts?.percentage || 0}%`}
          isPositive={statsData?.data?.withProducts?.change >= 0}
          changeValue={statsData?.data?.withProducts?.change}
          icon={Package}
          isLoading={isLoadingStats}
        />

        <GlobalStatsCard
          title="Supplier Dengan Transaksi"
          value={supplierStats.withTransactions}
          percentage={`${statsData?.data?.withTransactions?.percentage || 0}%`}
          isPositive={statsData?.data?.withTransactions?.change >= 0}
          changeValue={statsData?.data?.withTransactions?.change}
          icon={FileText}
          isLoading={isLoadingStats}
        />
      </div>

      {/* Action Bar */}
      <div className="mx-6 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="w-full md:w-auto flex-grow md:max-w-md"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Cari supplier..."
              className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-0 top-0 mt-2 mr-3 text-gray-400 hover:text-indigo-500"
            >
              <Search size={20} />
            </button>
          </div>
        </form>

        {/* Filters & Actions */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Cabang Filter */}
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={cabangFilter}
              onChange={handleCabangChange}
            >
              {cabangList &&
                cabangList.map((cabang) => (
                  <option key={cabang.id} value={cabang.id}>
                    {cabang.namaCabang}
                  </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              {/* <ChevronDown size={16} /> */}
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              {/* <ChevronDown size={16} /> */}
            </div>
          </div>

          {/* Refresh Button */}
          <button
            className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => refetchSuppliers()}
            disabled={isLoadingSuppliers}
          >
            <RefreshCw
              size={16}
              className={`mr-1 ${isLoadingSuppliers ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>

          {/* Export Button */}
          <button className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50">
            <Download size={16} className="mr-1" />
            <span>Export</span>
          </button>

          {/* Add New Supplier Button */}
          <button
            className="flex items-center justify-center px-3 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
            onClick={() => navigate("/superadmin/suppliers/create")}
          >
            <PlusCircle size={16} className="mr-1" />
            <span>Tambah Supplier</span>
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="mx-6">
        <Table
          columns={columns}
          data={suppliers}
          isLoading={isLoadingSuppliers}
          emptyMessage="Tidak ada data supplier yang ditemukan"
          onRowClick={(supplier) => handleViewSupplier(supplier.id)}
          pagination={{
            totalItems: pagination.totalItems,
            totalPages: pagination.totalPages,
            currentPage: pagination.currentPage,
            itemsPerPage: pagination.itemsPerPage,
            hasNextPage: pagination.hasNextPage,
            hasPrevPage: pagination.hasPrevPage,
          }}
          onPageChange={setCurrentPage}
          className="rounded-xl shadow-sm overflow-hidden"
          tableClassName="divide-y divide-gray-200"
        />
      </div>

      {/* Page Size Selector (outside Table component) */}
      {!isLoadingSuppliers && suppliers.length > 0 && (
        <div className="mx-6 mt-4 flex justify-end">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-600">per halaman</span>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showConfirmDelete}
        title="Hapus Supplier"
        message={`Apakah Anda yakin ingin menghapus supplier "${selectedSupplier?.namaSupplier}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        isLoading={deleteSupplierMutation.isPending}
        onConfirm={handleDeleteSupplier}
        onCancel={() => {
          setShowConfirmDelete(false);
          setSelectedSupplier(null);
        }}
        confirmButtonClassName="bg-red-600 hover:bg-red-700"
      />

      <ConfirmationDialog
        isOpen={showStatusChangeModal}
        title={`${newStatus === "aktif" ? "Aktifkan" : "Nonaktifkan"} Supplier`}
        message={`Apakah Anda yakin ingin ${
          newStatus === "aktif" ? "mengaktifkan" : "menonaktifkan"
        } supplier "${selectedSupplier?.namaSupplier}"?`}
        confirmLabel={newStatus === "aktif" ? "Aktifkan" : "Nonaktifkan"}
        cancelLabel="Batal"
        isLoading={changeStatusMutation.isPending}
        onConfirm={handleChangeStatus}
        onCancel={() => {
          setShowStatusChangeModal(false);
          setSelectedSupplier(null);
          setNewStatus("");
        }}
        confirmButtonClassName={
          newStatus === "aktif"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-orange-600 hover:bg-orange-700"
        }
      />
    </div>
  );
};

export default withCabangData(SupplierManagementPage);
