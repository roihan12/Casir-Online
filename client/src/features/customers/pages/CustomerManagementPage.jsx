import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash,
  Search,
  Filter,
  RefreshCw,
  Users,
  UserPlus,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  Heart,
  AlertTriangle,
  ShoppingBag,
  Building2,
} from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { toast } from "react-hot-toast";
import pelangganService from "../services/pelangganService";
import Modal from "../../common/Modal.jsx";
import Table from "../../common/Table.jsx";
import { useCabang } from "../../cabang/context/CabangContext";
import useDebounce from "../../../common/hooks/useDebounce";

const CustomerManagementPage = () => {
  const navigate = useNavigate();
  const { hasRole, hasPermission, isSuperAdmin } = useAuth();
  const { cabangList, selectedCabang, allCabang } = useCabang();
  
  // Permission checks
  const canCreate = hasPermission("pelanggan:create");
  const canRead = hasPermission("pelanggan:read");
  const canUpdate = hasPermission("pelanggan:update");
  const canDelete = hasPermission("pelanggan:delete");
  const canManage = hasPermission("pelanggan:manage");
  const adminMode = isSuperAdmin();

  // Branch filter state
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const availableBranches = adminMode ? allCabang : cabangList.filter(c => c.id !== "global");
  const hasSingleBranch = availableBranches.length === 1;

  // Set default branch if single branch
  useEffect(() => {
    if (hasSingleBranch && availableBranches.length > 0) {
      setSelectedBranchId(availableBranches[0].id);
    }
  }, [hasSingleBranch, availableBranches]);

  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    vip: 0,
    grosir: 0,
    retail: 0,
    active: 0,
    inactive: 0,
  });

  // Load customer list from API
  useEffect(() => {
    loadCustomerList();
    loadStats();
  }, [currentPage, itemsPerPage, debouncedSearch, selectedBranchId, segmentFilter, statusFilter]);

  const loadStats = async () => {
    try {
      const statsData = await pelangganService.getCustomerStats(selectedBranchId);


      setStats(statsData.data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadCustomerList = async () => {
    try {
      setIsLoading(true);
      const response = await pelangganService.getAllPelanggan(
        debouncedSearch,
        currentPage,
        itemsPerPage,
        selectedBranchId,
        segmentFilter,
        statusFilter
      );

      console.log(response);
      // Ensure data is an array
      const customerData = Array.isArray(response.data.data) ? response.data.data : [];

      console.log(customerData);

      setCustomers(customerData);
      setTotalItems(response.pagination?.totalItems || 0);
    } catch (error) {
      console.error("Error loading customer list:", error);
      toast.error("Gagal memuat data pelanggan");
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle refresh customer list
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCustomerList();
    loadStats();
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [segmentFilter, statusFilter, debouncedSearch, selectedBranchId]);

  // Handle add new customer
  const handleAddCustomer = () => {
    navigate("/customers/create");
  };

  // Handle edit customer
  const handleEditCustomer = (customer) => {
    navigate(`/customers/edit/${customer.id}`);
  };

  // Handle view customer details
  const handleViewCustomer = (customer) => {
    navigate(`/customers/${customer.id}`);
  };

  // Handle delete customer
  const handleDeleteCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  // Confirm delete customer
  const confirmDeleteCustomer = async () => {
    try {
      await pelangganService.deletePelanggan(selectedCustomer.id);
      await loadCustomerList(); // Reload the list after deletion
      setShowDeleteModal(false);
      toast.success("Pelanggan berhasil dihapus");
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Gagal menghapus pelanggan");
    }
  };

  // Handle page change from pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  // Get gender display
  const getGenderDisplay = (gender) => {
    switch (gender) {
      case "pria":
        return "Pria";
      case "wanita":
        return "Wanita";
      case "lainnya":
        return "Lainnya";
      default:
        return "-";
    }
  };

  // Get segment display
  const getSegmentDisplay = (segment) => {
    switch (segment) {
      case "retail":
        return "Retail";
      case "grosir":
        return "Grosir";
      case "vip":
        return "VIP";
      default:
        return "-";
    }
  };

  // Get segment badge class
  const getSegmentBadgeClass = (segment) => {
    switch (segment) {
      case "retail":
        return "bg-gray-100 text-gray-800";
      case "grosir":
        return "bg-blue-100 text-blue-800";
      case "vip":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "aktif":
        return "bg-green-100 text-green-800";
      case "nonaktif":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Table columns definition
  const columns = [
    {
      header: "Pelanggan",
      accessor: "namaPelanggan",
      cell: (row) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-full flex items-center justify-center">
              <User className="h-6 w-6 text-gray-400" />
            </div>
          </div>
          <div className="ml-3">
            <p className="font-medium text-gray-900">{row.namaPelanggan}</p>
            <p className="text-xs text-gray-500">
              {row.gender ? getGenderDisplay(row.gender) : "-"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Cabang",
      accessor: "cabang_id",
      cell: (row) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
          <span>{row.cabang_id || "Kantor Pusat"}</span>
        </div>
      ),
    },
    {
      header: "Kontak",
      accessor: "telepon",
      cell: (row) => (
        <div>
          {row.telepon && (
            <div className="flex items-center text-sm mb-1">
              <Phone className="h-4 w-4 text-gray-400 mr-1" />
              <span>{row.telepon}</span>
            </div>
          )}
          {row.email && (
            <div className="flex items-center text-sm">
              <Mail className="h-4 w-4 text-gray-400 mr-1" />
              <span>{row.email}</span>
            </div>
          )}
          {!row.telepon && !row.email && (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      header: "Segmen",
      accessor: "segmen",
      cell: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSegmentBadgeClass(
            row.segmen
          )}`}
        >
          {getSegmentDisplay(row.segmen)}
        </span>
      ),
    },
    {
      header: "Poin",
      accessor: "poin",
      cell: (row) => (
        <div className="flex items-center">
          <Heart className="h-4 w-4 text-red-400 mr-1" />
          <span>{row.poin || 0}</span>
        </div>
      ),
    },
    {
      header: "Tanggal Lahir",
      accessor: "tanggalLahir",
      cell: (row) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
          <span>{formatDate(row.tanggalLahir)}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
            row.status
          )}`}
        >
          {row.status === "aktif" ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    {
      header: "Aksi",
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewCustomer(row)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Lihat Detail"
          >
            <Users size={18} />
          </button>
          {canUpdate && (
            <button
              onClick={() => handleEditCustomer(row)}
              className="p-1 text-amber-600 hover:text-amber-800"
              title="Edit"
            >
              <Edit size={18} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDeleteCustomer(row)}
              className="p-1 text-red-600 hover:text-red-800"
              title="Hapus"
            >
              <Trash size={18} />
            </button>
          )}
        </div>
      ),
    },
  ];


  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Manajemen Pelanggan
        </h1>
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-700">
          Kelola data pelanggan dari semua cabang
        </p>
      </div>

      {/* Branch Filter Section */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center text-sm text-gray-600">
          <Building2 className="h-4 w-4 mr-2 text-indigo-500" />
          <span className="font-medium">Filter Cabang:</span>
        </div>
        <select
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
          value={selectedBranchId || (hasSingleBranch && availableBranches[0]?.id) || "all"}
          onChange={(e) => setSelectedBranchId(e.target.value === "all" ? null : e.target.value)}
          disabled={!adminMode && hasSingleBranch}
        >
          {!hasSingleBranch && <option value="all">Semua Cabang</option>}
          {availableBranches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.namaCabang}
            </option>
          ))}
        </select>
      </div>

      {/* Single branch indicator */}
      {hasSingleBranch && availableBranches.length === 1 && (
        <div className="bg-indigo-50 rounded-lg p-3 mb-4 flex items-center text-xs sm:text-sm">
          <Building2 className="h-4 w-4 mr-2 text-indigo-500" />
          <span className="text-indigo-700">
            Data: <strong>{availableBranches[0]?.namaCabang}</strong>
          </span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-5 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] sm:text-sm font-medium text-gray-500">
                Total
              </p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                {stats.total}
              </p>
            </div>
            <Users className="h-5 w-5 sm:h-8 sm:w-8 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-5 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] sm:text-sm font-medium text-gray-500">VIP</p>
              <p className="text-lg sm:text-2xl font-semibold text-purple-600">
                {stats.vip}
              </p>
            </div>
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Heart className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-5 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] sm:text-sm font-medium text-gray-500">
                Grosir
              </p>
              <p className="text-lg sm:text-2xl font-semibold text-blue-600">
                {stats.grosir}
              </p>
            </div>
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-5 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] sm:text-sm font-medium text-gray-500">
                Nonaktif
              </p>
              <p className="text-lg sm:text-2xl font-semibold text-red-600">
                {stats.inactive}
              </p>
            </div>
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border">
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Cari pelanggan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-4">
              <div className="flex items-center">
                <select
                  id="segmentFilter"
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm h-10"
                  value={segmentFilter}
                  onChange={(e) => setSegmentFilter(e.target.value)}
                >
                  <option value="all">Semua Segmen</option>
                  <option value="retail">Retail</option>
                  <option value="grosir">Grosir</option>
                  <option value="vip">VIP</option>
                </select>
              </div>

              <div className="flex items-center">
                <select
                  id="statusFilter"
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm h-10"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Semua Status</option>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-2 border-t lg:border-t-0 lg:pt-0">
            <button
              onClick={handleRefresh}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isRefreshing ? "opacity-50 cursor-not-allowed" : ""
              } h-10`}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 sm:mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="ml-2 sm:ml-0">Muat Ulang</span>
            </button>

            {canManage && (
              <button
                onClick={() => navigate("/customers/segments")}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-10"
              >
                <Filter className="h-4 w-4 sm:mr-2" />
                <span className="ml-2 sm:ml-0">Segmentasi</span>
              </button>
            )}

            {canManage && (
              <button
                onClick={() => navigate("/customers/loyalty")}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-10"
              >
                <Heart className="h-4 w-4 sm:mr-2 text-red-500" />
                <span className="ml-2 sm:ml-0">Loyalitas</span>
              </button>
            )}

            {canCreate && (
              <button
                onClick={handleAddCustomer}
                className="col-span-2 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pelanggan
              </button>
            )}
          </div>
        </div>

        <Table
          columns={columns}
          data={customers}
          isLoading={isLoading}
          pagination={{
            currentPage,
            itemsPerPage,
            totalItems,
            onPageChange: handlePageChange,
            onItemsPerPageChange: handleItemsPerPageChange,
          }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Hapus Pelanggan"
      >
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Apakah Anda yakin ingin menghapus pelanggan{" "}
            <span className="font-semibold">
              {selectedCustomer?.namaPelanggan}
            </span>
            ? Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
        <div className="mt-4 flex justify-end space-x-3">
          <button
            type="button"
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => setShowDeleteModal(false)}
          >
            Batal
          </button>
          <button
            type="button"
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={confirmDeleteCustomer}
          >
            Hapus
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerManagementPage;
