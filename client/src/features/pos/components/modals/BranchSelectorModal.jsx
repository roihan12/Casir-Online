import React, { useState, useEffect } from "react";
import { X, Search, MapPin, Check } from "lucide-react";

const BranchSelectorModal = ({
  show,
  onClose,
  branches = [],
  selectedBranch,
  onSelectBranch,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBranches, setFilteredBranches] = useState(branches);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBranches(branches);
    } else {
      const filtered = branches.filter(
        (branch) =>
          branch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBranches(filtered);
    }
  }, [searchQuery, branches]);

  const handleSelectBranch = (branch) => {
    onSelectBranch(branch);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">Pilih Cabang</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Cari cabang (nama, alamat, kota)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg pr-10"
          />
          <Search size={20} className="absolute right-3 top-3.5 text-gray-400" />
        </div>

        {/* Branches List */}
        <div className="flex-1 overflow-y-auto">
          {filteredBranches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBranches.map((branch) => (
                <div
                  key={branch.id}
                  onClick={() => handleSelectBranch(branch)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    selectedBranch?.id === branch.id
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <MapPin size={18} className="text-indigo-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {branch.name}
                        </h4>
                        <p className="text-sm text-gray-600">{branch.city}</p>
                      </div>
                    </div>
                    {selectedBranch?.id === branch.id && (
                      <Check size={20} className="text-indigo-600 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{branch.address}</p>
                    <p>
                      <span className="font-medium">Phone:</span> {branch.phone}
                    </p>
                    {branch.openingHours && (
                      <p>
                        <span className="font-medium">Jam:</span>{" "}
                        {branch.openingHours}
                      </p>
                    )}
                  </div>

                  {branch.status && (
                    <div className="mt-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          branch.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {branch.status === "active" ? "Buka" : "Tutup"}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium">Cabang tidak ditemukan</p>
              <p className="text-sm mt-2">
                Coba kata kunci pencarian lainnya
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedBranch && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600 text-center">
              Cabang yang dipilih:{" "}
              <span className="font-semibold text-indigo-600">
                {selectedBranch.name}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchSelectorModal;