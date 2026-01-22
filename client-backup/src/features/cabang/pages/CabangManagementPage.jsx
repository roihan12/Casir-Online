import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash,
  Search,
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Eye,
} from "lucide-react";
import CabangForm from "../components/CabangForm";
import Modal from "../../common/Modal";
import Table from "../../common/Table";
import CabangImportExport from "../components/CabangImportExport";
import CabangDashboard from "../components/CabangDashboard";
import {
  useCabangList,
  useCreateCabang,
  useUpdateCabang,
  useDeleteCabang,
} from "../hooks/useCabangQueries";
import { useQueryErrorHandler } from "../../../hooks/useQueryErrorHandler"; // Should check if this exists or if generic
import { useMutationHandler } from "../../../hooks/useMutationHandler"; // Should check if this exists or if generic
import { toast } from "react-hot-toast";

const CabangManagementPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [selectedCabang, setSelectedCabang] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDashboard, setShowDashboard] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
  });

  // React Query hooks
  const {
    data: cabangData,
    isLoading,
    error,
  } = useCabangList(pagination.currentPage, pagination.itemsPerPage);
  const createCabangMutation = useCreateCabang();
  const updateCabangMutation = useUpdateCabang();
  const deleteCabangMutation = useDeleteCabang();

  // Error handling for queries
  useQueryErrorHandler(error, isLoading, {
    showLoadingToast: true,
    errorMessage: "Gagal memuat data cabang. Silakan coba lagi.",
  });

  // Mutation handlers
  const createCabangHandler = useMutationHandler(createCabangMutation, {
    successMessage: "Cabang berhasil ditambahkan",
    errorMessage: "Gagal menambahkan cabang. Silakan coba lagi.",
  });

  const updateCabangHandler = useMutationHandler(updateCabangMutation, {
    successMessage: "Cabang berhasil diperbarui",
    errorMessage: "Gagal memperbarui cabang. Silakan coba lagi.",
  });

  const deleteCabangHandler = useMutationHandler(deleteCabangMutation, {
    successMessage: "Cabang berhasil dihapus",
    errorMessage: "Gagal menghapus cabang. Silakan coba lagi.",
  });

  const cabangList = cabangData?.data || [];
  const filteredCabangList = cabangList.filter((cabang) => {
    const matchesSearch =
      !searchQuery ||
      cabang.namaCabang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cabang.alamat &&
        cabang.alamat.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cabang.telepon && cabang.telepon.includes(searchQuery));

    const matchesStatus =
      statusFilter === "all" || cabang.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle add new cabang
  const handleAddCabang = () => {
    setSelectedCabang(null);
    setShowAddModal(true);
  };

  // Handle edit cabang
  const handleEditCabang = (cabang) => {
    setSelectedCabang(cabang);
    setShowEditModal(true);
  };

  // Handle view cabang details
  const handleViewCabang = (cabang) => {
    if (cabang && cabang.id) {
      navigate(`/superadmin/cabang/${cabang.id}`);
    } else {
      setShowDashboard(false);
    }
  };

  // Handle delete cabang
  const handleDeleteCabang = (cabang) => {
    setSelectedCabang(cabang);
    setShowDeleteModal(true);
  };

  // Confirm delete cabang
  const confirmDeleteCabang = async () => {
    try {
      await deleteCabangHandler.execute(selectedCabang.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting cabang:", error);
    }
  };

  // Handle form submit for add/edit
  const handleFormSubmit = async (operationType) => {
    // Close the appropriate modal
    setShowAddModal(false);
    setShowEditModal(false);

    // Show success message based on operation type
    if (operationType === "create") {
      toast.success("Cabang berhasil ditambahkan");
    } else if (operationType === "update") {
      toast.success("Cabang berhasil diperbarui");
    }
  };

  // Handle page change from pagination
  const handlePageChange = (page) => {
    setPagination((prev) => ({
      ...prev,
      currentPage: page,
    }));
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = Number(e.target.value);
    setPagination({
      currentPage: 1, // Reset to first page when changing items per page
      itemsPerPage: newItemsPerPage,
    });
  };

  // Handle import
  const handleImport = (file, preview) => {
    console.log("Importing file:", file, preview);
    setShowImportExportModal(false);
  };

  // Handle export
  const handleExport = (options) => {
    console.log("Exporting with options:", options);
    setShowImportExportModal(false);
  };

  // Toggle dashboard view
  const toggleDashboard = () => {
    setShowDashboard(!showDashboard);
  };

  // Table columns definition
  const columns = [
    {
      header: "Nama Cabang",
      accessor: "namaCabang",
      cell: (row) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="ml-3">
            <p className="font-medium text-gray-900">{row.namaCabang}</p>
            {row.alamat && (
              <p className="text-xs text-gray-500 truncate max-w-xs">
                {row.alamat}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Telepon",
      accessor: "telepon",
      cell: (row) => (
        <div className="flex items-center">
          {row.telepon ? (
            <>
              <Phone className="h-4 w-4 text-gray-400 mr-2" />
              <span>{row.telepon}</span>
            </>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      header: "Geolokasi",
      accessor: "latitude",
      cell: (row) =>
        row.latitude && row.longitude ? (
          <div className="flex items-center">
            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
            <span>
              {parseFloat(row.latitude).toFixed(6)},{" "}
              {parseFloat(row.longitude).toFixed(6)}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">Tidak diatur</span>
        ),
    },
    {
      header: "Radius Geofence",
      accessor: "radiusGeofence",
      cell: (row) =>
        row.radiusGeofence ? (
          <span>{row.radiusGeofence} meter</span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => (
        <div
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.status === "aktif"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.status === "aktif" ? (
            <CheckCircle className="h-3 w-3 mr-1" />
          ) : (
            <XCircle className="h-3 w-3 mr-1" />
          )}
          {row.status === "aktif" ? "Aktif" : "Nonaktif"}
        </div>
      ),
    },
    {
      header: "Aksi",
      accessor: "actions",
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewCabang(row)}
            className="p-1 text-gray-600 hover:text-indigo-800 rounded-full hover:bg-indigo-100"
            title="Lihat Detail"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEditCabang(row)}
            className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteCabang(row)}
            className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"
            title="Hapus"
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Manajemen Cabang
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowImportExportModal(true)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center hover:bg-gray-200"
            >
              <Download className="h-5 w-5 mr-2" />
              Impor/Ekspor
            </button>
            <button
              onClick={handleAddCabang}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Tambah Cabang
            </button>
          </div>
        </div>

        {/* Dashboard Section */}
        {showDashboard && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Dashboard Cabang
              </h2>
              <button
                onClick={toggleDashboard}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {showDashboard ? "Sembunyikan" : "Tampilkan"} Dashboard
              </button>
            </div>
            <CabangDashboard
              totalCabang={cabangData?.pagination?.totalItems}
              cabangList={cabangList}
              onViewCabang={handleViewCabang}
            />
          </div>
        )}

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
                placeholder="Cari cabang..."
                className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="text-gray-400" size={18} />
                <select
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Semua Status</option>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Tampilkan:</span>
                <select
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={pagination.itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {!showDashboard && (
                <button
                  onClick={toggleDashboard}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Tampilkan Dashboard
                </button>
              )}
            </div>
          </div>

          <Table
            columns={columns}
            data={filteredCabangList}
            isLoading={isLoading}
            emptyMessage="Tidak ada data cabang yang tersedia"
            pagination={cabangData?.pagination}
            usePagination={true}
            onPageChange={handlePageChange}
            currentPage={pagination.currentPage}
            itemsPerPage={pagination.itemsPerPage}
          />
        </div>
      </div>

      {/* Add Cabang Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah Cabang Baru"
      >
        <CabangForm
          cabangList={cabangList}
          onSubmitSuccess={handleFormSubmit}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Cabang Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Cabang"
      >
        <CabangForm
          cabangList={cabangList}
          cabang={selectedCabang}
          onSubmitSuccess={handleFormSubmit}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Konfirmasi Hapus"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Apakah Anda yakin ingin menghapus cabang "
            {selectedCabang?.namaCabang}"? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
              title="Batal"
            >
              Batal
            </button>
            <button
              onClick={confirmDeleteCabang}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              title="Hapus"
            >
              Hapus
            </button>
          </div>
        </div>
      </Modal>

      {/* Import/Export Modal */}
      <CabangImportExport
        isOpen={showImportExportModal}
        onClose={() => setShowImportExportModal(false)}
        onImport={handleImport}
        onExport={handleExport}
        cabangList={cabangList}
      />
    </div>
  );
};

export default CabangManagementPage;
