import React, { useState, useEffect } from "react";
import {
  Filter,
  Download,
  Eye,
  Clock,
  Database,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Search,
  Building,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useCabang } from "../../../features/cabang/hooks/useCabang";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useAuditLogs } from "../hooks/useAuditLogs";
import auditService from "../services/auditService";

const AuditLog = () => {
  const { selectedCabang, cabangList } = useCabang();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [logDetail, setLogDetail] = useState(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    user: "",
    action: "",
    table: "",
    cabangId: "",
  });
  
  // Debounce filter application state
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: "",
    endDate: "",
    user: "",
    action: "",
    table: "",
    cabangId: "",
  });

  const actionTypes = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "LOGIN",
    "LOGOUT",
    "PASSWORD_RESET",
    "DATA_EXPORT",
  ];

  const tableTypes = [
    "cabang",
    "user",
    "produk",
    "kategori",
    "supplier",
    "pelanggan",
    "transaksi",
    "pembayaran",
    "shift",
    "inventory",
  ];

  // Initialize filter with selectedCabang when component mounts or selectedCabang changes
  useEffect(() => {
    if (selectedCabang?.id && !appliedFilters.cabangId) {
      setFilters(prev => ({ ...prev, cabangId: selectedCabang.id }));
      setAppliedFilters(prev => ({ ...prev, cabangId: selectedCabang.id }));
    }
  }, [selectedCabang]);

  // Prepare query params for hook
  const queryParams = {
    page: currentPage,
    limit: pageSize,
    // Default to selectedCabang if no filter is applied, but filter takes precedence
    cabangId: appliedFilters.cabangId || selectedCabang?.id, 
    ...Object.fromEntries(
      Object.entries(appliedFilters).filter(([key, v]) => key !== "cabangId" && v !== "")
    ),
  };

  // Fetch audit logs using hook
  const {
    data: auditData,
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useAuditLogs(queryParams, {
    enabled: !!(appliedFilters.cabangId || selectedCabang?.id),
  });

  const logs = auditData?.data || [];
  const pagination = auditData?.pagination || {};
  const totalLogs = pagination.totalItems || 0;

  useEffect(() => {
    if (isError) {
      console.error("Error fetching audit logs:", error);
      toast.error("Gagal memuat audit log");
    }
  }, [isError, error]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = () => {
    setCurrentPage(1);
    setAppliedFilters(filters);
    setShowFilters(false);
  };

  const resetFilters = () => {
    const emptyFilters = {
      startDate: "",
      endDate: "",
      user: "",
      action: "",
      table: "",
      cabangId: selectedCabang?.id || "",
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleViewDetail = (log) => {
    setLogDetail(log);
  };

  const closeDetail = () => {
    setLogDetail(null);
  };

  const exportLogs = async () => {
    try {
      const exportParams = {
        cabangId: appliedFilters.cabangId || selectedCabang?.id,
        ...Object.fromEntries(
          Object.entries(appliedFilters).filter(([key, v]) => key !== "cabangId" && v !== "")
        ),
      };

      const blob = await auditService.exportAuditLogs(exportParams);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `audit_log_${format(new Date(), "yyyyMMdd")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Export berhasil");
    } catch (error) {
      console.error("Error exporting logs:", error);
      toast.error("Gagal export audit log");
    }
  };

  const formatLogTime = (dateString) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm:ss", {
        locale: id,
      });
    } catch (error) {
      return dateString;
    }
  };

  const getActionIcon = (action) => {
    if (!action) return <Database className="text-gray-500" size={18} />;
    
    if (action.includes("CREATE"))
      return <Database className="text-green-500" size={18} />;
    if (action.includes("UPDATE"))
      return <RefreshCw className="text-blue-500" size={18} />;
    if (action.includes("DELETE"))
      return <Activity className="text-red-500" size={18} />;
    if (action.includes("LOGIN") || action.includes("LOGOUT"))
      return <User className="text-indigo-500" size={18} />;
    return <Database className="text-gray-500" size={18} />;
  };

  const renderValueChanges = (oldValues, newValues) => {
    if (!oldValues && !newValues) return null;

    try {
      // Data is already parsed by backend service or if passed directly as object
      const oldData = typeof oldValues === "string" ? JSON.parse(oldValues) : (oldValues || {});
      const newData = typeof newValues === "string" ? JSON.parse(newValues) : (newValues || {});

      const allKeys = [...new Set([...Object.keys(oldData), ...Object.keys(newData)])];
      
      const changedKeys = allKeys.filter(
        (key) => JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])
      );

      return (
        <div className="space-y-2 mt-2">
          <h4 className="font-medium text-gray-700">Perubahan:</h4>
          {changedKeys.length > 0 ? (
            <div className="space-y-2">
              {changedKeys.map((key) => (
                <div key={key} className="grid grid-cols-3 gap-2 text-sm border-b border-gray-100 pb-1">
                  <div className="font-medium text-gray-600 self-center">{key}</div>
                  <div className="text-red-500 line-through bg-red-50 p-1 rounded break-all">
                    {oldData[key] !== undefined
                      ? (typeof oldData[key] === 'object' ? JSON.stringify(oldData[key]) : String(oldData[key]))
                      : "—"}
                  </div>
                  <div className="text-green-600 bg-green-50 p-1 rounded break-all">
                    {newData[key] !== undefined
                      ? (typeof newData[key] === 'object' ? JSON.stringify(newData[key]) : String(newData[key]))
                      : "—"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              Tidak ada perubahan data yang terdeteksi
            </p>
          )}
        </div>
      );
    } catch (error) {
      console.error("Error parsing values:", error);
      return (
        <div className="mt-2">
          <p className="text-gray-500 text-sm">
            Format data tidak valid untuk ditampilkan
          </p>
        </div>
      );
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Audit Log</h1>
           <p className="text-gray-500 text-sm mt-1">
             Memantau aktivitas sistem {cabangList?.find(c => c.id === appliedFilters.cabangId)?.namaCabang || selectedCabang?.namaCabang || ""}
           </p>
        </div>
        
        <div className="flex space-x-2 w-full sm:w-auto">
          <button
            className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors flex-1 sm:flex-none ${
              showFilters 
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200" 
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} className="mr-2" />
            <span>Filter</span>
          </button>
          <button
            className="flex items-center justify-center px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none"
            onClick={exportLogs}
            disabled={loading || logs.length === 0}
          >
            <Download size={18} className="mr-2" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 bg-white p-5 rounded-lg shadow-sm border border-gray-200 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">
              Filter Audit Log
            </h2>
            <button 
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cabangList && cabangList.length > 1 && (
              <div>
                <label
                  htmlFor="cabangId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Cabang
                </label>
                <div className="relative">
                  <select
                    id="cabangId"
                    name="cabangId"
                    value={filters.cabangId}
                    onChange={handleFilterChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow appearance-none"
                  >
                    {cabangList.map((cabang) => (
                      <option key={cabang.id} value={cabang.id}>
                        {cabang.namaCabang}
                      </option>
                    ))}
                  </select>
                  <Building className="absolute left-3 top-2.5 text-gray-400" size={16} />
                </div>
              </div>
            )}
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tanggal Mulai
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow"
                />
                <Clock className="absolute left-3 top-2.5 text-gray-400" size={16} />
              </div>
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tanggal Akhir
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  min={filters.startDate}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow"
                />
                <Clock className="absolute left-3 top-2.5 text-gray-400" size={16} />
              </div>
            </div>
            <div>
              <label
                htmlFor="user"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                User (Username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="user"
                  name="user"
                  value={filters.user}
                  onChange={handleFilterChange}
                  placeholder="Cari username..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow"
                />
                <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
              </div>
            </div>
            <div>
              <label
                htmlFor="action"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Aksi
              </label>
              <div className="relative">
                <select
                  id="action"
                  name="action"
                  value={filters.action}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow appearance-none"
                >
                  <option value="">Semua Aksi</option>
                  {actionTypes.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
                <Activity className="absolute left-3 top-2.5 text-gray-400" size={16} />
              </div>
            </div>
            <div>
              <label
                htmlFor="table"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tabel / Modul
              </label>
              <div className="relative">
                <select
                  id="table"
                  name="table"
                  value={filters.table}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow appearance-none"
                >
                  <option value="">Semua Tabel</option>
                  {tableTypes.map((table) => (
                    <option key={table} value={table}>
                      {table}
                    </option>
                  ))}
                </select>
                <Database className="absolute left-3 top-2.5 text-gray-400" size={16} />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6 space-x-3 pt-4 border-t border-gray-100">
            <button
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
              onClick={resetFilters}
            >
              Reset
            </button>
            <button
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center"
              onClick={applyFilters}
            >
              <Search size={18} className="mr-2" />
              Terapkan Filter
            </button>
          </div>
        </div>
      )}

      {/* Log Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
             <p className="text-gray-500">Memuat data audit log...</p>
          </div>
        ) : logs.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Target (Tabel)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Waktu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-1.5 rounded-full bg-gray-50 mr-3">
                            {getActionIcon(log.action)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {log.action}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {log.user?.namaLengkap || log.user?.username || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.user?.email || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                          {log.table_name}
                        </span>
                        {log.record_id && (
                          <span className="text-gray-400 text-xs ml-2 font-mono">
                            #{log.record_id.substring(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatLogTime(log.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell font-mono">
                        {log.ip_address || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetail(log)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition-colors"
                        >
                          <div className="flex items-center">
                            <Eye size={16} className="mr-1.5" />
                            <span>Lihat</span>
                          </div>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Menampilkan{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * pageSize + 1}
                    </span>{" "}
                    sampai{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, totalLogs)}
                    </span>{" "}
                    dari <span className="font-medium">{totalLogs}</span> data
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {/* Simple pagination logic for demonstration */}
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages || 0) },
                      (_, i) => {
                        // Logic to center current page can be added here
                        // For simplicity, showing first 5 or adjusting based on current page
                        let pageNumber = i + 1;
                         if (pagination.totalPages > 5 && currentPage > 3) {
                             pageNumber = currentPage - 2 + i;
                             // Ensure we don't exceed total pages
                             if (pageNumber > pagination.totalPages) return null;
                         }

                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNumber === currentPage
                                ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      }
                    ).filter(Boolean)}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages || pagination.totalPages === 0}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === pagination.totalPages || pagination.totalPages === 0
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50">
            <div className="p-4 bg-white rounded-full shadow-sm mb-3">
               <Database className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Tidak ada data audit log
            </h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm text-center">
              Belum ada aktivitas yang tercatat sesuai dengan filter yang Anda terapkan. Coba ubah filter atau periksa kembali nanti.
            </p>
            <button 
               onClick={resetFilters}
               className="mt-4 px-4 py-2 text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {logDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={closeDetail}
            >
              <div className="absolute inset-0 bg-gray-900 opacity-60 backdrop-blur-sm"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-100">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl leading-6 font-semibold text-gray-900 flex items-center">
                        <Activity className="mr-2 text-indigo-500" size={20} />
                        Detail Aktivitas
                      </h3>
                      <button
                        onClick={closeDetail}
                        className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1 rounded-full transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                      <div className="flex items-center mb-4 pb-4 border-b border-blue-200 border-dashed">
                        {getActionIcon(logDetail.action)}
                        <span className="font-bold ml-2 text-lg text-gray-800">
                          {logDetail.action}
                        </span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-600 font-medium">{logDetail.table_name}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-blue-500 text-xs font-semibold uppercase tracking-wide">User</p>
                          <p className="font-medium text-gray-700 mt-0.5">
                            {logDetail.user?.namaLengkap || logDetail.user?.username || "—"}
                          </p>
                          <p className="text-xs text-gray-500">{logDetail.user?.email}</p>
                        </div>
                        <div>
                          <p className="text-blue-500 text-xs font-semibold uppercase tracking-wide">Waktu</p>
                          <div className="flex items-center mt-0.5">
                            <Clock size={14} className="text-gray-400 mr-1" />
                            <p className="font-medium text-gray-700">{formatLogTime(logDetail.created_at)}</p>
                          </div>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-blue-500 text-xs font-semibold uppercase tracking-wide">Record ID</p>
                          <p className="font-mono text-sm bg-white px-2 py-1 rounded border border-blue-200 inline-block mt-0.5 text-gray-600">
                            {logDetail.record_id || "—"}
                          </p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-blue-500 text-xs font-semibold uppercase tracking-wide">IP Address</p>
                          <p className="font-mono text-sm text-gray-600 mt-0.5">
                            {logDetail.ip_address || "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Riwayat Perubahan Data</h4>
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-60 overflow-y-auto">
                        {(logDetail.old_values || logDetail.new_values) ? (
                            renderValueChanges(
                              logDetail.old_values,
                              logDetail.new_values
                            )
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            Tidak ada detail perubahan data
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  onClick={closeDetail}
                >
                  Tutup Info
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
