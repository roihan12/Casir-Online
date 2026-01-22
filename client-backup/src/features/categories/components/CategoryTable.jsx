import React from "react";
import { Tag, Edit, Trash } from "lucide-react";
import Table from "../../common/Table";

/**
 * CategoryTable - Table component for displaying categories
 * @param {Object} props
 * @param {Array} props.categories - Array of category data
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {number} props.itemsPerPage - Items per page
 * @param {number} props.currentPage - Current page
 * @param {Function} props.onPageChange - Page change handler
 */
const CategoryTable = ({
  categories = [],
  isLoading = false,
  onEdit,
  onDelete,
  itemsPerPage = 10,
  currentPage = 1,
  onPageChange,
}) => {
  // Format date
  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  // Table columns definition
  const columns = [
    {
      header: "Nama Kategori",
      accessor: "namaKategori",
      cell: (row) => (
        <div className="flex items-center">
          <div className="h-8 w-8 flex-shrink-0 bg-indigo-100 rounded-md overflow-hidden mr-3 flex items-center justify-center">
            <Tag className="h-4 w-4 text-indigo-600" />
          </div>
          <span className="font-medium text-gray-900">{row.namaKategori}</span>
        </div>
      ),
    },
    {
      header: "Deskripsi",
      accessor: "deskripsi",
      cell: (row) => (
        <div className="max-w-xs truncate">
          {row.deskripsi || <span className="text-gray-400">-</span>}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => (
        <div>
          {row.status === "aktif" ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Aktif
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Nonaktif
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Tanggal Dibuat",
      accessor: "createdAt",
      cell: (row) => (
        <div className="text-sm text-gray-500">{formatDate(row.createdAt)}</div>
      ),
    },
    {
      header: "Tanggal Diperbarui",
      accessor: "updatedAt",
      cell: (row) => (
        <div className="text-sm text-gray-500">{formatDate(row.updatedAt)}</div>
      ),
    },
    {
      header: "Aksi",
      accessor: "actions",
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(row)}
            className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(row)}
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
    <Table
      columns={columns}
      data={categories}
      isLoading={isLoading}
      emptyMessage="Tidak ada data kategori yang tersedia"
      itemsPerPage={itemsPerPage}
      currentPage={currentPage}
      onPageChange={onPageChange}
    />
  );
};

export default CategoryTable;
