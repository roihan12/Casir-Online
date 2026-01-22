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
} from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth.js";
import { toast } from "react-hot-toast";
import pelangganService from "../../services/pelangganService";
import Modal from "../../features/common/Modal.jsx";
import Table from "../../features/common/Table.jsx";

const CustomerManagement = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole("super_admin");

  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load customer list from API
  useEffect(() => {
    loadCustomerList();
  }, [currentPage, itemsPerPage, searchQuery]);

  const loadCustomerList = async () => {
    try {
      setIsLoading(true);
      const response = await pelangganService.getAllPelanggan(
        searchQuery,
        currentPage,
        itemsPerPage
      );

      // Ensure data is an array
      const customerData = Array.isArray(response.data) ? response.data : [];

      setCustomers(customerData);
      setFilteredCustomers(customerData);
      setTotalItems(response.total || customerData.length);
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
  };

  // Filter customer list when filters change
  useEffect(() => {
    const filterCustomerList = () => {
      let filtered = customers;

      // Apply segment filter
      if (segmentFilter !== "all") {
        filtered = filtered.filter(
          (customer) => customer.segmen === segmentFilter
        );
      }

      // Apply status filter
      if (statusFilter !== "all") {
        filtered = filtered.filter(
          (customer) => customer.status === statusFilter
        );
      }

      setFilteredCustomers(filtered);
      // Reset to first page when filters change
      setCurrentPage(1);
    };

    filterCustomerList();
  }, [customers, segmentFilter, statusFilter]);

  // Handle add new customer
  const handleAddCustomer = () => {
    navigate("/superadmin/customers/create");
  };

  // Handle edit customer
  const handleEditCustomer = (customer) => {
    navigate(`/superadmin/customers/edit/${customer.id}`);
  };

  // Handle view customer details
  const handleViewCustomer = (customer) => {
    navigate(`/superadmin/customers/${customer.id}`);
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
      accessor: "cabang.namaCabang",
      cell: (row) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
          <span>{row.cabang?.namaCabang || "Kantor Pusat"}</span>
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
          >
            <Users size={18} />
          </button>
          <button
            onClick={() => handleEditCustomer(row)}
            className="p-1 text-amber-600 hover:text-amber-800"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleDeleteCustomer(row)}
            className="p-1 text-red-600 hover:text-red-800"
          >
            <Trash size={18} />
          </button>
        </div>
      ),
    },
  ];

  // Get segment display and counts safely
  const getVipCount = () => {
    return Array.isArray(customers)
      ? customers.filter((c) => c.segmen === "vip").length
      : 0;
  };

  const getGrosirCount = () => {
    return Array.isArray(customers)
      ? customers.filter((c) => c.segmen === "grosir").length
      : 0;
  };

  const getNonaktifCount = () => {
    return Array.isArray(customers)
      ? customers.filter((c) => c.status === "nonaktif").length
      : 0;
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Manajemen Pelanggan
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Kelola data pelanggan dari semua cabang
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Pelanggan
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {totalItems}
              </p>
            </div>
            <Users className="h-10 w-10 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pelanggan VIP</p>
              <p className="text-2xl font-semibold text-purple-600">
                {getVipCount()}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Heart className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Pelanggan Grosir
              </p>
              <p className="text-2xl font-semibold text-blue-600">
                {getGrosirCount()}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Pelanggan Nonaktif
              </p>
              <p className="text-2xl font-semibold text-red-600">
                {getNonaktifCount()}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Cari pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <label
                htmlFor="segmentFilter"
                className="mr-2 text-sm text-gray-600"
              >
                Segmen:
              </label>
              <select
                id="segmentFilter"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
              >
                <option value="all">Semua</option>
                <option value="retail">Retail</option>
                <option value="grosir">Grosir</option>
                <option value="vip">VIP</option>
              </select>
            </div>

            <div className="flex items-center">
              <label
                htmlFor="statusFilter"
                className="mr-2 text-sm text-gray-600"
              >
                Status:
              </label>
              <select
                id="statusFilter"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Semua</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>

            <button
              onClick={handleRefresh}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isRefreshing ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Muat Ulang
            </button>

            <button
              onClick={() => navigate("/superadmin/customers/segments")}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Segmentasi
            </button>

            <button
              onClick={() => navigate("/superadmin/customers/loyalty")}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Heart className="h-4 w-4 mr-2" />
              Loyalitas
            </button>

            <button
              onClick={handleAddCustomer}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Tambah Pelanggan
            </button>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredCustomers}
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

export default CustomerManagement;
