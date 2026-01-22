import React from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * LoadingDashboard - Loading state component for the dashboard.
 * Shows a spinner with loading message.
 */
const LoadingDashboard = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 min-h-[400px]">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-pulse" />
        <RefreshCw 
          size={32} 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-500 animate-spin" 
        />
      </div>
      <p className="mt-4 text-gray-600 font-medium">Memuat data dashboard...</p>
      <p className="text-sm text-gray-400 mt-1">Harap tunggu sebentar</p>
    </div>
  );
};

export default LoadingDashboard;
