import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

/**
 * ErrorDashboard - Error state component for the dashboard.
 * Shows error message with retry functionality.
 * @param {Object} props
 * @param {string} props.error - Error message to display
 * @param {string} props.dashboardError - Alternative error message
 * @param {Function} props.reloadData - Function to retry loading data
 */
const ErrorDashboard = ({ error, dashboardError, reloadData }) => {
  const errorMessage = error || dashboardError || 'Terjadi kesalahan saat memuat dashboard';

  return (
    <div className="mx-6 my-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-1">
              Gagal Memuat Dashboard
            </h3>
            <p className="text-red-700 text-sm">{errorMessage}</p>
            
            {reloadData && (
              <button
                onClick={reloadData}
                className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <RefreshCw size={16} className="mr-2" />
                Coba Lagi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDashboard;
