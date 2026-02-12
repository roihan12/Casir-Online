import React from "react";
import { User, Search, AlertTriangle, Plus } from "lucide-react";
import Spinner from "../../common/Spinner";

/**
 * SupplierSelector - Reusable component for selecting supplier
 * @param {Object} props
 * @param {Array} props.suppliers - List of suppliers
 * @param {string} props.searchTerm - Current search term
 * @param {Function} props.onSearchChange - Handler for search input change
 * @param {Function} props.onSupplierSelect - Handler when supplier is selected
 * @param {Function} props.onCreateNew - Handler to create new supplier
 * @param {boolean} props.isLoading - Loading state
 */
const SupplierSelector = ({
  suppliers,
  searchTerm,
  onSearchChange,
  onSupplierSelect,
  onCreateNew,
  isLoading,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-medium mb-4 flex items-center">
        <User size={20} className="mr-2 text-indigo-600" />
        Pilih Supplier
      </h2>

      {/* Search */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Cari supplier..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Loading/Content */}
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Spinner size="md" />
        </div>
      ) : (
        <>
          {suppliers.length === 0 ? (
            <div className="bg-gray-50 p-8 text-center rounded-lg">
              <AlertTriangle
                size={40}
                className="mx-auto text-amber-500 mb-2"
              />
              <h4 className="text-gray-700 font-medium">
                Supplier tidak ditemukan
              </h4>
              <p className="text-gray-500 mt-1 mb-4">
                Tidak ada supplier yang sesuai dengan pencarian atau untuk
                cabang ini
              </p>
              <button
                onClick={onCreateNew}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Buat Supplier Baru
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  onClick={() => onSupplierSelect(supplier.id)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-indigo-600">
                        {supplier.namaSupplier}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {supplier.alamat || "Tidak ada alamat"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-sm font-medium">
                        {supplier.telepon || "Tidak ada nomor telepon"}
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs mt-2 ${
                          supplier.status === "aktif"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {supplier.status === "aktif" ? "Aktif" : "Nonaktif"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-center mt-4">
                <button
                  onClick={onCreateNew}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Buat Supplier Baru
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SupplierSelector;
