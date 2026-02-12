import React from "react";
import { 
  ArrowLeft, 
  Info, 
  Building, 
  AlertTriangle, 
  User, 
  Search, 
  Plus 
} from "lucide-react";
import Spinner from "../../common/Spinner";
import PurchaseStepper from "./PurchaseStepper";

const PurchaseSupplierSelect = ({
  navigate,
  branches,
  localSelectedBranch,
  setLocalSelectedBranch,
  selectedCabang,
  setSelectedCabang,
  searchTerm,
  setSearchTerm,
  isLoadingSuppliers,
  filteredSuppliers,
  handleSelectSupplier,
  handleCreateNewSupplier,
}) => {
  return (
    <div className="pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-6 pb-6 mb-6">
        <div className="mx-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Buat Pembelian Baru
            </h1>
            <button
              onClick={() => navigate("/purchases")}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Kembali
            </button>
          </div>
          
          <PurchaseStepper currentStep={1} />
        </div>
      </div>

      <div className="mx-6 max-w-5xl mx-auto space-y-6">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start">
          <Info className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-medium text-blue-900">Langkah 1: Pilih Supplier</h3>
            <p className="text-blue-700 text-sm mt-1">
              Silakan pilih supplier terlebih dahulu sebelum melanjutkan ke pengisian detail pembelian.
              Pastikan cabang terpilih sesuai dengan target restock.
            </p>
          </div>
        </div>

        {/* Branch Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Building size={20} className="mr-2 text-indigo-600" />
            Pilih Cabang (Target Gudang)
          </h2>

          {branches && branches.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {branches
                  .filter((branch) => branch.id !== "global")
                  .map((branch) => (
                    <div
                      key={branch.id}
                      onClick={() => setLocalSelectedBranch(branch)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 relative overflow-hidden group ${
                        localSelectedBranch?.id === branch.id
                          ? "border-indigo-600 bg-indigo-50 shadow-md transform scale-[1.02]"
                          : "border-gray-200 hover:border-indigo-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="font-semibold text-gray-800">{branch.namaCabang}</div>
                      <div className="text-sm text-gray-500 mt-1 truncate">
                        {branch.alamat || "Tidak ada alamat"}
                      </div>
                      
                      {localSelectedBranch?.id === branch.id && (
                        <div className="absolute top-0 right-0 bg-indigo-600 text-white px-2 py-1 text-xs rounded-bl-lg font-medium">
                          ✓ Terpilih
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {localSelectedBranch && localSelectedBranch.id !== "global" && (
                 <div className="text-sm text-gray-500 italic border-t pt-3 mt-2">
                    * Menampilkan supplier untuk cabang: <span className="font-medium text-indigo-600">{localSelectedBranch.namaCabang}</span>
                 </div>
              )}
            </>
          ) : (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start">
              <AlertTriangle
                size={20}
                className="text-amber-500 mt-0.5 mr-3 flex-shrink-0"
              />
              <div>
                <p className="text-amber-800 font-medium">
                  Tidak ada cabang tersedia
                </p>
                <p className="text-amber-700 text-sm mt-1">
                  Anda tidak memiliki akses ke cabang manapun atau belum ada
                  cabang yang dibuat.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Supplier Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <User size={20} className="mr-2 text-indigo-600" />
              Pilih Supplier
            </h2>
            
            <button
              onClick={handleCreateNewSupplier}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-sm text-sm font-medium"
            >
              <Plus size={16} className="mr-2" />
              Buat Supplier Baru
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow shadow-sm"
              placeholder="Cari nama supplier, kode, atau nomor telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          {isLoadingSuppliers ? (
            <div className="flex justify-center items-center h-48 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <Spinner size="md" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSuppliers.length === 0 ? (
                <div className="col-span-full bg-gray-50 p-8 text-center rounded-xl border border-dashed border-gray-300">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                     <Search size={24} className="text-gray-400" />
                  </div>
                  <h4 className="text-gray-900 font-medium text-lg mb-1">
                    Supplier tidak ditemukan
                  </h4>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Tidak ada supplier yang cocok dengan kata kunci "{searchTerm}" untuk cabang yang dipilih.
                  </p>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-indigo-600 font-medium hover:text-indigo-800 hover:underline"
                  >
                    Reset Pencarian
                  </button>
                </div>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    onClick={() => handleSelectSupplier(supplier.id)}
                    className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between h-full"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          {supplier.kodeSupplier || "---"}
                        </div>
                        <div className="font-semibold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
                          {supplier.namaSupplier}
                        </div>
                      </div>
                      <div
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          supplier.status === "aktif"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {supplier.status === "aktif" ? "Aktif" : "Nonaktif"}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-auto pt-3 border-t border-gray-50">
                      <div className="flex items-start text-sm text-gray-600">
                        <Building size={14} className="mr-2 mt-0.5 text-gray-400" />
                        <span className="truncate">{supplier.alamat || "-"}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                         <span className="text-gray-400 mr-2">📞</span>
                         <span>{supplier.telepon || "-"}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseSupplierSelect;
