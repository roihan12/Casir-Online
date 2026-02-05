import React, { useState, useRef, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, FileDown, Loader2 } from "lucide-react";
import { useExportReport } from "../hooks/useReports";
import toast from "react-hot-toast";

/**
 * Export Dropdown Component
 * Provides export options for reports in Excel, PDF, and CSV formats
 */
const ExportDropdown = ({ reportType, params, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const exportMutation = useExportReport({
    onSuccess: (data) => {
      toast.success(`Berhasil mengunduh ${data.filename}`);
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal mengunduh laporan");
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = (format) => {
    if (!params.startDate || !params.endDate) {
      toast.error("Silakan pilih periode tanggal terlebih dahulu");
      return;
    }

    exportMutation.mutate({
      reportType,
      format,
      params,
    });
  };

  const exportOptions = [
    {
      format: "excel",
      label: "Export ke Excel",
      icon: FileSpreadsheet,
      description: "Format .xlsx",
      color: "text-green-600",
    },
    {
      format: "pdf",
      label: "Export ke PDF",
      icon: FileText,
      description: "Format .pdf",
      color: "text-red-600",
    },
    {
      format: "csv",
      label: "Export ke CSV",
      icon: FileDown,
      description: "Format .csv",
      color: "text-blue-600",
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || exportMutation.isPending}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
          transition-all duration-200 ease-in-out
          ${
            disabled || exportMutation.isPending
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg"
          }
        `}
      >
        {exportMutation.isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Mengunduh...</span>
          </>
        ) : (
          <>
            <Download size={16} />
            <span>Export</span>
          </>
        )}
      </button>

      {isOpen && !exportMutation.isPending && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeIn">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pilih Format Export
            </p>
          </div>
          
          {exportOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.format}
                onClick={() => handleExport(option.format)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className={`p-2 rounded-lg bg-gray-50 ${option.color}`}>
                  <IconComponent size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">
                    {option.label}
                  </p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;
