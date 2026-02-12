import React from "react";
import { Building, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * BranchSelector - Reusable component for selecting branch
 * @param {Object} props
 * @param {Array} props.branches - List of available branches
 * @param {Object} props.selectedBranch - Currently selected branch
 * @param {Function} props.onBranchChange - Callback when branch is selected
 * @param {Object} props.globalBranch - Global context branch
 * @param {Function} props.onSaveToContext - Callback to save branch to global context
 */
const BranchSelector = ({
  branches,
  selectedBranch,
  onBranchChange,
  globalBranch,
  onSaveToContext,
}) => {
  const handleBranchClick = (branchId) => {
    const branch = branches.find((b) => b.id === branchId);
    if (branch) {
      onBranchChange(branch);
    }
  };

  const handleSaveToContext = () => {
    if (selectedBranch) {
      onSaveToContext(selectedBranch);
      toast.success(`Cabang berhasil diubah ke ${selectedBranch.namaCabang}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-lg font-medium mb-4 flex items-center">
        <Building size={20} className="mr-2 text-indigo-600" />
        Pilih Cabang
        {selectedBranch && selectedBranch.id !== "global" && (
          <span className="ml-2 text-sm text-gray-500">
            (Cabang terpilih: {selectedBranch.namaCabang})
          </span>
        )}
      </h2>

      {branches && branches.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {branches
              .filter((branch) => branch.id !== "global")
              .map((branch) => (
                <div
                  key={branch.id}
                  onClick={() => handleBranchClick(branch.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors duration-200 ${
                    selectedBranch?.id === branch.id
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium">{branch.namaCabang}</div>
                  <div className="text-sm text-gray-500 mt-1 truncate">
                    {branch.alamat || "Tidak ada alamat"}
                  </div>
                  {selectedBranch?.id === branch.id && (
                    <div className="mt-2 text-xs font-medium text-indigo-600">
                      ✓ Cabang terpilih
                    </div>
                  )}
                </div>
              ))}
          </div>

          {/* Show save button if local selection differs from global context */}
          {selectedBranch &&
            selectedBranch.id !== globalBranch?.id && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveToContext}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                >
                  <Building size={14} className="mr-2" />
                  Simpan Pilihan Cabang
                </button>
              </div>
            )}
        </>
      ) : (
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="flex items-start">
            <AlertTriangle
              size={20}
              className="text-amber-500 mt-0.5 mr-2 flex-shrink-0"
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
        </div>
      )}
    </div>
  );
};

export default BranchSelector;
