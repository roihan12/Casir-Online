import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash,
  Search,
  Filter,
  ChevronDown,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  BarChart2,
  Package,
  Calendar,
  MessageSquare,
  Clipboard,
} from "lucide-react";
// import productRequestService from "../../../services/productRequestService";
import Modal from "@features/common/Modal";
import Table from "@features/common/Table";
// FIXME: Component doesn't exist - needs to be created
// import ProductRequestForm from "../../../components/superadmin/ProductRequestForm";
// import ProductRequestDetails from "../../../components/superadmin/ProductRequestDetails";

const ProductRequestManagement = () => {
  const navigate = useNavigate();
  const [requestList, setRequestList] = useState([]);
  const [filteredRequestList, setFilteredRequestList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [branchList, setBranchList] = useState([]);
  const [userList, setUserList] = useState([]);

  // Load request list from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [requests, branches, users] = await Promise.all([
          productRequestService.getRequestList(),
          productRequestService.getBranchList(),
          productRequestService.getUserList(),
        ]);

        setRequestList(requests);
        setFilteredRequestList(requests);
        setBranchList(branches);
        setUserList(users);
      } catch (error) {
        console.error("Error loading request list:", error);
        // In a real application, show a toast or notification here
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter request list when search query or filters change
  useEffect(() => {
    const filterRequestList = () => {
      let filtered = requestList;

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (request) =>
            request.id.toLowerCase().includes(query) ||
            getBranchName(request.cabangId).toLowerCase().includes(query) ||
            getUserName(request.requestById).toLowerCase().includes(query) ||
            (request.alasan && request.alasan.toLowerCase().includes(query))
        );
      }

      // Apply type filter
      if (typeFilter !== "all") {
        filtered = filtered.filter(
          (request) => request.requestType === typeFilter
        );
      }

      // Apply status filter
      if (statusFilter !== "all") {
        filtered = filtered.filter(
          (request) => request.status === statusFilter
        );
      }

      // Apply priority filter
      if (priorityFilter !== "all") {
        filtered = filtered.filter(
          (request) => request.prioritas === priorityFilter
        );
      }

      setFilteredRequestList(filtered);
      // Reset to first page when filters change
      setCurrentPage(1);
    };

    filterRequestList();
  }, [requestList, searchQuery, typeFilter, statusFilter, priorityFilter]);

  // Handle add new request
  const handleAddRequest = () => {
    setSelectedRequest(null);
    setShowAddModal(true);
  };

  // Handle view request details
  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  // Handle delete request
  const handleDeleteRequest = (request) => {
    setSelectedRequest(request);
    setShowDeleteModal(true);
  };

  // Confirm delete request
  const confirmDeleteRequest = async () => {
    try {
      await productRequestService.deleteRequest(selectedRequest.id);
      setRequestList(requestList.filter((r) => r.id !== selectedRequest.id));
      setShowDeleteModal(false);
      // Show success notification
    } catch (error) {
      console.error("Error deleting request:", error);
      // Show error notification
    }
  };

  // Handle form submit for add
  const handleFormSubmit = (updatedRequestList) => {
    setRequestList(updatedRequestList);
    setShowAddModal(false);
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

  // Helper function to get branch name by id
  const getBranchName = (branchId) => {
    const branch = branchList.find((b) => b.id === branchId);
    return branch ? branch.name : "Unknown Branch";
  };

  // Helper function to get user name by id
  const getUserName = (userId) => {
    const user = userList.find((u) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
  };

  // Get request type display
  const getRequestTypeDisplay = (type) => {
    switch (type) {
      case "new_product":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Plus className="h-3 w-3 mr-1" />
            Produk Baru
          </span>
        );
      case "restock":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Package className="h-3 w-3 mr-1" />
            Restock
          </span>
        );
      default:
        return type;
    }
  };

  // Get status display
  const getStatusDisplay = (status) => {
    switch (status) {
      case "draft":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FileText className="h-3 w-3 mr-1" />
            Draft
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Disetujui
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Ditolak
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Disetujui Sebagian
          </span>
        );
      default:
        return status;
    }
  };

  // Get priority display
  const getPriorityDisplay = (priority) => {
    switch (priority) {
      case "low":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Rendah
          </span>
        );
      case "normal":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Normal
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Tinggi
          </span>
        );
      case "urgent":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Urgent
          </span>
        );
      default:
        return priority;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  // Table columns definition
  const columns = [
    {
      header: "ID Request",
      accessor: "id",
      cell: (row) => (
        <div className="text-sm text-gray-900 font-medium">
          {row.id.substring(0, 8)}
        </div>
      ),
    },
    {
      header: "Tipe",
      accessor: "requestType",
      cell: (row) => getRequestTypeDisplay(row.requestType),
    },
    {
      header: "Cabang",
      accessor: "cabangId",
      cell: (row) => (
        <div className="text-sm text-gray-900">
          {getBranchName(row.cabangId)}
        </div>
      ),
    },
    {
      header: "Requester",
      accessor: "requestById",
      cell: (row) => (
        <div className="text-sm text-gray-900">
          {getUserName(row.requestById)}
        </div>
      ),
    },
    {
      header: "Prioritas",
      accessor: "prioritas",
      cell: (row) => getPriorityDisplay(row.prioritas),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => getStatusDisplay(row.status),
    },
    {
      header: "Tanggal",
      accessor: "createdAt",
      cell: (row) => (
        <div className="text-sm text-gray-500">{formatDate(row.createdAt)}</div>
      ),
    },
    {
      header: "Aksi",
      accessor: "actions",
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewRequest(row)}
            className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100"
            title="Lihat Detail"
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.status === "draft" && (
            <button
              onClick={() => handleDeleteRequest(row)}
              className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"
              title="Hapus"
            >
              <Trash className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Manajemen Request Produk
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate("/products")}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center hover:bg-gray-200"
            >
              <Package className="h-5 w-5 mr-2" />
              Produk
            </button>
            <button
              onClick={handleAddRequest}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Buat Request
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Request
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requestList.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requestList.filter((r) => r.status === "pending").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Disetujui</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requestList.filter((r) => r.status === "approved").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Urgent</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {
                    requestList.filter(
                      (r) =>
                        r.prioritas === "urgent" &&
                        r.status !== "approved" &&
                        r.status !== "rejected"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Cari request..."
                className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="text-gray-400" size={18} />
                <select
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">Semua Tipe</option>
                  <option value="new_product">Produk Baru</option>
                  <option value="restock">Restock</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Semua Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Disetujui</option>
                  <option value="rejected">Ditolak</option>
                  <option value="partial">Disetujui Sebagian</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">Semua Prioritas</option>
                  <option value="low">Rendah</option>
                  <option value="normal">Normal</option>
                  <option value="high">Tinggi</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Tampilkan:</span>
                <select
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          <Table
            columns={columns}
            data={filteredRequestList}
            isLoading={isLoading}
            emptyMessage="Tidak ada data request yang tersedia"
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Add Request Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Buat Request Produk"
        size="lg"
      >
        <ProductRequestForm
          requestList={requestList}
          branchList={branchList}
          userList={userList}
          onSubmitSuccess={handleFormSubmit}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Detail Request ${selectedRequest?.id?.substring(0, 8) || ""}`}
        size="xl"
      >
        {selectedRequest && (
          <ProductRequestDetails
            request={selectedRequest}
            branchList={branchList}
            userList={userList}
            onClose={() => setShowDetailsModal(false)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Konfirmasi Hapus"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Apakah Anda yakin ingin menghapus request ini? Tindakan ini tidak
            dapat dibatalkan.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              onClick={confirmDeleteRequest}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductRequestManagement;
