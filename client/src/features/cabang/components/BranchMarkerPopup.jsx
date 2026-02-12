import React from "react";
import { 
  DollarSign, 
  ShoppingCart, 
  Clock, 
  AlertTriangle,
  ChevronRight 
} from "lucide-react";
import PulseIndicator from "./PulseIndicator";

/**
 * Branch Marker Popup Component
 * Shows branch summary in map marker popup
 * 
 * @param {Object} branch - Branch data from map overview
 * @param {function} onViewDetail - Callback when "Lihat Detail" is clicked
 */
const BranchMarkerPopup = ({ branch, onViewDetail }) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="min-w-[200px] p-1">
      {/* Header with name and pulse */}
      <div className="flex items-center gap-2 mb-2">
        <PulseIndicator 
          lastActivityAt={branch.last_activity_at}
          hasActiveShift={branch.has_active_shift}
          size="md"
        />
        <h3 className="font-semibold text-gray-900 text-sm">
          {branch.name}
        </h3>
      </div>

      {/* Stats */}
      <div className="space-y-1.5 text-xs">
        {/* Revenue */}
        <div className="flex items-center gap-2 text-gray-600">
          <DollarSign className="w-3.5 h-3.5 text-green-600" />
          <span>Omzet Hari Ini:</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(branch.today_revenue)}
          </span>
        </div>

        {/* Transaction count */}
        <div className="flex items-center gap-2 text-gray-600">
          <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
          <span>Transaksi:</span>
          <span className="font-medium text-gray-900">
            {branch.today_transaction_count}
          </span>
        </div>

        {/* Shift status */}
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-3.5 h-3.5 text-purple-600" />
          <span>Shift:</span>
          <span className={`font-medium ${
            branch.has_active_shift ? "text-green-600" : "text-gray-500"
          }`}>
            {branch.has_active_shift ? "Aktif" : "Tidak Aktif"}
          </span>
        </div>

        {/* Alerts */}
        {branch.alert_count > 0 && (
          <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Stok menipis ({branch.alert_count})</span>
          </div>
        )}
      </div>

      {/* View Detail Button */}
      <button
        onClick={onViewDetail}
        className="mt-3 w-full flex items-center justify-center gap-1 bg-indigo-600 text-white text-xs py-1.5 px-3 rounded hover:bg-indigo-700 transition-colors"
      >
        <span>Lihat Detail</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default BranchMarkerPopup;
