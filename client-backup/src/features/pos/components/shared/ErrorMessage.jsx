import React from "react";
import { AlertCircle, X, RefreshCw, Home } from "lucide-react";

const ErrorMessage = ({
  title,
  message,
  onRetry,
  onDismiss,
  type = "error",
  showIcon = true,
  className = "",
}) => {
  const typeStyles = {
    error: {
      container: "bg-red-50 border-red-200",
      icon: "text-red-600",
      title: "text-red-800",
    },
    warning: {
      container: "bg-yellow-50 border-yellow-200",
      icon: "text-yellow-600",
      title: "text-yellow-800",
    },
    info: {
      container: "bg-blue-50 border-blue-200",
      icon: "text-blue-600",
      title: "text-blue-800",
    },
  };

  const style = typeStyles[type] || typeStyles.error;

  return (
    <div className={`rounded-lg border p-4 ${style.container} ${className}`}>
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0 mr-3">
            <AlertCircle size={20} className={style.icon} />
          </div>
        )}
        
        <div className="flex-1">
          <h3 className={`font-semibold mb-1 ${style.title}`}>
            {title}
          </h3>
          <p className="text-gray-700 text-sm">{message}</p>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <RefreshCw size={14} className="mr-1" />
              Coba Lagi
            </button>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

// Full page error component
export const FullPageError = ({
  title = "Terjadi Kesalahan",
  message = "Gagal memuat halaman. Silakan coba lagi nanti.",
  onRetry,
  onGoHome,
  type = "error",
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={48} className="text-red-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {title}
        </h1>
        
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center space-x-2"
            >
              <RefreshCw size={18} />
              <span>Coba Lagi</span>
            </button>
          )}
          
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="w-full px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center space-x-2"
            >
              <Home size={18} />
              <span>Kembali ke Beranda</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;