import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import Modal from "../../common/Modal";
import { useCategories } from "../hooks/useCategories";
import CategoryForm from "../components/CategoryForm";
import CategoryTable from "../components/CategoryTable";

const CategoryManagementPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Use our custom categories hook
  const { getCategories, createCategory, updateCategory, deleteCategory } =
    useCategories();

  const { data: categories = [], isLoading } = getCategories;

  // Filter categories based on search and status
  const filteredCategories = React.useMemo(() => {
    if (!categories) return [];

    let filtered = [...categories];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (category) =>
          category.namaKategori.toLowerCase().includes(query) ||
          (category.deskripsi &&
            category.deskripsi.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (category) => category.status === statusFilter
      );
    }

    return filtered;
  }, [categories, searchQuery, statusFilter]);

  // Handle add new category
  const handleAddCategory = () => {
    setShowAddModal(true);
  };

  // Handle edit category
  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  // Handle delete category
  const handleDeleteCategory = (category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  // Handle form submit for add
  const handleAddSubmit = (data) => {
    createCategory.mutate(data, {
      onSuccess: () => {
        setShowAddModal(false);
      },
    });
  };

  // Handle form submit for edit
  const handleEditSubmit = (data) => {
    if (selectedCategory?.id) {
      updateCategory.mutate(
        { id: selectedCategory.id, data },
        {
          onSuccess: () => {
            setShowEditModal(false);
          },
        }
      );
    }
  };

  // Confirm delete category
  const confirmDeleteCategory = () => {
    if (selectedCategory?.id) {
      deleteCategory.mutate(selectedCategory.id, {
        onSuccess: () => {
          setShowDeleteModal(false);
        },
      });
    }
  };

  // Handle page change from pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Navigate back to products
  const handleNavigateToProducts = () => {
    navigate("/products");
  };

  return (
    <div>
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              onClick={handleNavigateToProducts}
              className="mr-3 text-gray-600 hover:text-indigo-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">
              Manajemen Kategori
            </h1>
          </div>
          <button
            onClick={handleAddCategory}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Tambah Kategori
          </button>
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
                placeholder="Cari kategori..."
                className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

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

              <span className="ml-4 text-sm text-gray-600">Tampilkan:</span>
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

          <CategoryTable
            categories={filteredCategories}
            isLoading={isLoading}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah Kategori Baru"
      >
        <CategoryForm
          onSubmit={handleAddSubmit}
          onCancel={() => setShowAddModal(false)}
          isLoading={createCategory.isPending}
          submitLabel="Simpan"
        />
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Kategori"
      >
        {selectedCategory && (
          <CategoryForm
            defaultValues={{
              namaKategori: selectedCategory.namaKategori,
              deskripsi: selectedCategory.deskripsi || "",
              status: selectedCategory.status,
            }}
            onSubmit={handleEditSubmit}
            onCancel={() => setShowEditModal(false)}
            isLoading={updateCategory.isPending}
            submitLabel="Simpan Perubahan"
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
          <div className="flex items-center mb-4 text-red-600">
            <AlertCircle className="h-6 w-6 mr-2" />
            <p className="font-medium">Hapus Kategori</p>
          </div>
          <p className="text-gray-700 mb-4">
            Apakah Anda yakin ingin menghapus kategori "
            {selectedCategory?.namaKategori}"? Jika kategori ini digunakan pada
            produk, tindakan ini mungkin memengaruhi data produk terkait.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              onClick={confirmDeleteCategory}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoryManagementPage;
