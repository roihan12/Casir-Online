import React, { useState, useEffect } from "react";
import {
  Calendar,
  Filter,
  Download,
  Eye,
  Clock,
  Search,
  Database,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useCabang } from "../../../features/cabang/hooks/useCabang";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const AuditLog = () => {
  const { selectedCabang } = useCabang();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
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

  // Fetch audit logs when page loads or filters change
  useEffect(() => {
    if (selectedCabang?.id) {
      fetchAuditLogs();
    }
  }, [selectedCabang, currentPage, pageSize]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        cabangId: selectedCabang.id,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        ),
      });

      const response = await axios.get(`/api/audit-logs?${queryParams}`);

      if (response.data.success) {
        setLogs(response.data.data);
        setTotalLogs(response.data.total);
      } else {
        toast.error("Gagal memuat audit log");
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Gagal memuat audit log");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchAuditLogs();
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      user: "",
      action: "",
      table: "",
    });
    setCurrentPage(1);
    fetchAuditLogs();
    setShowFilters(false);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= Math.ceil(totalLogs / pageSize)) {
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
      const queryParams = new URLSearchParams({
        cabangId: selectedCabang.id,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        ),
      });

      const response = await axios.get(
        `/api/audit-logs/export?${queryParams}`,
        {
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `audit_log_${format(new Date(), "yyyyMMdd")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

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
    if (!oldValues || !newValues) return null;

    try {
      const oldData =
        typeof oldValues === "string" ? JSON.parse(oldValues) : oldValues;
      const newData =
        typeof newValues === "string" ? JSON.parse(newValues) : newValues;

      const changedKeys = Object.keys({ ...oldData, ...newData }).filter(
        (key) => JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])
      );

      return (
        <div className="space-y-2 mt-2">
          <h4 className="font-medium text-gray-700">Perubahan:</h4>
          {changedKeys.length > 0 ? (
            <div className="space-y-2">
              {changedKeys.map((key) => (
                <div key={key} className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium">{key}</div>
                  <div className="text-red-600 line-through">
                    {oldData[key] !== undefined
                      ? JSON.stringify(oldData[key])
                      : "—"}
                  </div>
                  <div className="text-green-600">
                    {newData[key] !== undefined
                      ? JSON.stringify(newData[key])
                      : "—"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Tidak ada perubahan yang signifikan
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Audit Log</h1>
        <div className="flex space-x-2">
          <button
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} className="mr-2" />
            <span>{showFilters ? "Sembunyikan Filter" : "Filter"}</span>
          </button>
          <button
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            onClick={exportLogs}
          >
            <Download size={18} className="mr-2" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-700 mb-4">
            Filter Audit Log
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tanggal Mulai
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tanggal Akhir
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label
                htmlFor="user"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                User
              </label>
              <input
                type="text"
                id="user"
                name="user"
                value={filters.user}
                onChange={handleFilterChange}
                placeholder="Masukkan username"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label
                htmlFor="action"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Aksi
              </label>
              <select
                id="action"
                name="action"
                value={filters.action}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Semua Aksi</option>
                {actionTypes.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="table"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tabel
              </label>
              <select
                id="table"
                name="table"
                value={filters.table}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Semua Tabel</option>
                {tableTypes.map((table) => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <button
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              onClick={resetFilters}
            >
              Reset
            </button>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              onClick={applyFilters}
            >
              Terapkan Filter
            </button>
          </div>
        </div>
      )}

      {/* Log Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : logs.length > 0 ? (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tabel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waktu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getActionIcon(log.action)}
                        <span className="ml-2 text-sm text-gray-900">
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.user
                        ? log.user.namaLengkap || log.user.username
                        : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.table_name}
                      {log.record_id && (
                        <span className="text-gray-500 text-xs ml-1">
                          #{log.record_id.substring(0, 8)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatLogTime(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.ip_address || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetail(log)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end"
                      >
                        <Eye size={16} className="mr-1" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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

                    {Array.from(
                      { length: Math.min(5, Math.ceil(totalLogs / pageSize)) },
                      (_, i) => {
                        const pageNumber = i + 1;
                        return (
                          <button
                            key={i}
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
                    )}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === Math.ceil(totalLogs / pageSize)}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === Math.ceil(totalLogs / pageSize)
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
          <div className="flex flex-col items-center justify-center h-64">
            <Database className="h-12 w-12 text-gray-300 mb-2" />
            <h3 className="text-lg font-medium text-gray-500">
              Tidak ada data audit log
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Coba ubah filter atau periksa kembali nanti
            </p>
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
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Detail Audit Log
                      </h3>
                      <button
                        onClick={closeDetail}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        {getActionIcon(logDetail.action)}
                        <span className="font-semibold ml-2">
                          {logDetail.action}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <p className="text-gray-500 text-xs">User</p>
                          <p className="font-medium">
                            {logDetail.user
                              ? logDetail.user.namaLengkap ||
                                logDetail.user.username
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Waktu</p>
                          <div className="flex items-center">
                            <Clock size={14} className="text-gray-400 mr-1" />
                            <p>{formatLogTime(logDetail.created_at)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Tabel</p>
                          <p className="font-medium">{logDetail.table_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">ID Record</p>
                          <p className="font-medium">
                            {logDetail.record_id || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">IP Address</p>
                          <p className="font-medium">
                            {logDetail.ip_address || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Cabang</p>
                          <p className="font-medium">
                            {logDetail.cabang
                              ? logDetail.cabang.namaCabang
                              : "Global"}
                          </p>
                        </div>
                      </div>

                      {(logDetail.old_values || logDetail.new_values) &&
                        renderValueChanges(
                          logDetail.old_values,
                          logDetail.new_values
                        )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeDetail}
                >
                  Tutup
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
