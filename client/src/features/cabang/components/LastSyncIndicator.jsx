import React, { useMemo } from "react";
import { RefreshCcw, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

/**
 * Last Sync Indicator Component
 * Shows when data was last synchronized and sync status
 * 
 * @param {number} lastUpdated - Timestamp of last update (from React Query dataUpdatedAt)
 * @param {function} onRefresh - Callback to trigger manual refresh
 * @param {boolean} isRefetching - Whether data is currently being refetched
 */
const LastSyncIndicator = ({ 
  lastUpdated, 
  onRefresh, 
  isRefetching = false 
}) => {
  const { timeAgo, status, statusColor, StatusIcon } = useMemo(() => {
    if (!lastUpdated) {
      return {
        timeAgo: "Belum tersinkronisasi",
        status: "unknown",
        statusColor: "text-gray-500",
        StatusIcon: AlertTriangle,
      };
    }

    const now = Date.now();
    const diffMs = now - lastUpdated;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffSeconds = Math.floor(diffMs / 1000);

    let timeAgo;
    if (diffSeconds < 60) {
      timeAgo = "Baru saja";
    } else if (diffMinutes < 60) {
      timeAgo = `${diffMinutes} menit lalu`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      timeAgo = `${hours} jam lalu`;
    }

    // Determine sync status
    let status, statusColor, StatusIcon;
    if (diffMinutes < 5) {
      status = "ok";
      statusColor = "text-green-600";
      StatusIcon = CheckCircle;
    } else if (diffMinutes < 10) {
      status = "delay";
      statusColor = "text-yellow-600";
      StatusIcon = AlertTriangle;
    } else {
      status = "stale";
      statusColor = "text-red-600";
      StatusIcon = XCircle;
    }

    return { timeAgo, status, statusColor, StatusIcon };
  }, [lastUpdated]);

  // Format time for display
  const formattedTime = useMemo(() => {
    if (!lastUpdated) return "";
    const date = new Date(lastUpdated);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  }, [lastUpdated]);

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-3 py-1.5 text-xs">
      {/* Status Icon */}
      <StatusIcon className={`w-3.5 h-3.5 ${statusColor}`} />
      
      {/* Sync Info */}
      <div className="flex flex-col">
        <span className="text-gray-600">Terakhir diperbarui</span>
        <span className="font-medium text-gray-800">
          {formattedTime || timeAgo}
        </span>
      </div>

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={isRefetching}
        className={`ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors ${
          isRefetching ? "opacity-50 cursor-not-allowed" : ""
        }`}
        title="Refresh data"
      >
        <RefreshCcw
          className={`w-4 h-4 text-gray-500 ${
            isRefetching ? "animate-spin" : ""
          }`}
        />
      </button>
    </div>
  );
};

export default LastSyncIndicator;
