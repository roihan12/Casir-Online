import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash,
  Search,
  Filter,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Package,
} from "lucide-react";

import Modal from "@features/common/Modal";
import Table from "@features/common/Table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@common/components/ui/select";
import ProductRequestForm from "../components/ProductRequestForm";
import ProductRequestDetails from "../components/ProductRequestDetails";
import {
  useProductRequests,
  useDeleteProductRequest,
  useProductRequestAnalytics,
} from "../hooks/useProductRequest";
import { useCabangList } from "../../cabang/hooks/useCabangQueries";
import useUsers from "../../users/hooks/useUsers";
import useAuthStore from "@app/store/useAuthStore";

const ProductRequestManagement = () => {
  const navigate = useNavigate();

  // Get user data and permissions from auth store
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin());
  const userCabang = useAuthStore((state) => state.getUserCabang());
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreateProduct = hasPermission("produk:create");
  const canReadProduct = hasPermission("produk:read");
  const canManageProduct = hasPermission("produk:manage");

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [branchFilter, setBranchFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Auto-select branch if user only has one branch
  useEffect(() => {
    if (!isSuperAdmin && userCabang.length === 1) {
      setBranchFilter(userCabang[0].cabangId);
    } else {
      setBranchFilter("all");
    }
  }, [isSuperAdmin, userCabang]);

  // Debounce search query to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Queries - pass filters including pagination to use server-side filtering
  const { data: requestsData, isLoading: isRequestsLoading } =
    useProductRequests({
      search: debouncedSearchQuery,
      cabangId: branchFilter !== "all" ? branchFilter : undefined,
      requestType: typeFilter !== "all" ? typeFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      prioritas: priorityFilter !== "all" ? priorityFilter : undefined,
      page: currentPage,
      limit: itemsPerPage,
    });
  const { data: analyticsData } = useProductRequestAnalytics();

  // Extract data and pagination from server response
  const requestList = requestsData?.data || [];
  const paginationData = requestsData?.pagination;

  // Fetch branches and users for lookup
  const { data: branchListResponse } = useCabangList(1, 100);
  const branchList = branchListResponse?.data || [];

  const availableBranches = isSuperAdmin
    ? branchList // Super admin can see all branches
    : userCabang.map((c) => ({ id: c.cabangId, namaCabang: c.namaCabang }));

  const { getUsersQuery } = useUsers({ limit: 1000 });
  const { data: userListResponse } = getUsersQuery;
  const userList = userListResponse?.data || [];

  // Mutations
  const deleteMutation = useDeleteProductRequest();

  const isLoading = isRequestsLoading;

  // Use server-side pagination data
  const paginationProps = {
    currentPage: paginationData?.currentPage || 1,
    totalPages: paginationData?.totalPages || 1,
    itemsPerPage: paginationData?.itemsPerPage || 10,
    totalItems: paginationData?.totalItems || 0,
    hasNextPage: paginationData?.hasNextPage || false,
    hasPrevPage: paginationData?.hasPrevPage || false,
  };

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
    if (selectedRequest) {
      deleteMutation.mutate(selectedRequest.id, {
        onSuccess: () => {
          setShowDeleteModal(false);
          setSelectedRequest(null);
        },
      });
    }
  };

  // Handle form submit for add
  const handleFormSubmit = () => {
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
      accessor: "cabang",
      cell: (row) => (
        <div className="text-sm text-gray-900">
          {row.cabang?.namaCabang || "-"}
        </div>
      ),
    },
    {
      header: "Requester",
      accessor: "createdByUser",
      cell: (row) => (
        <div className="text-sm text-gray-900">
          {row.createdByUser?.namaLengkap || "-"}
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
          {row.status === "draft" && canManageProduct && (
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
            {canCreateProduct && (
              <button
                onClick={handleAddRequest}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Buat Request
              </button>
            )}
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
                  {analyticsData?.totalRequests ||
                    (Array.isArray(requestList) ? requestList.length : 0)}
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
                <p className="text-sm font-medium text-gray-500">Draft</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analyticsData?.statusDistribution?.draft ||
                    (Array.isArray(requestList)
                      ? requestList.filter((r) => r.status === "draft").length
                      : 0)}
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
                  {analyticsData?.statusDistribution?.approved ||
                    (Array.isArray(requestList)
                      ? requestList.filter((r) => r.status === "approved")
                          .length
                      : 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <CheckCircle className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Selesai</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analyticsData?.statusDistribution?.completed ||
                    (Array.isArray(requestList)
                      ? requestList.filter((r) => r.status === "completed")
                          .length
                      : 0)}
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
              {/* Branch Filter - Only show if user has multiple branches or is super admin */}
              {(isSuperAdmin || userCabang.length > 1) && (
                <div className="flex items-center space-x-2">
                  <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Semua Cabang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Cabang</SelectItem>
                      {availableBranches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.namaCabang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Filter className="text-gray-400" size={18} />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Semua Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="new_product">Produk Baru</SelectItem>
                    <SelectItem value="restock">Restock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Disetujui</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                    <SelectItem value="partial">Disetujui Sebagian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Semua Prioritas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Prioritas</SelectItem>
                    <SelectItem value="low">Rendah</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Tinggi</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Tampilkan:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(val) =>
                    handleItemsPerPageChange({ target: { value: val } })
                  }
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Table
            columns={columns}
            data={requestList}
            isLoading={isLoading}
            emptyMessage="Tidak ada data request yang tersedia"
            pagination={paginationProps}
            onPageChange={handlePageChange}
            usePagination={true}
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
            requestId={selectedRequest?.id}
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
