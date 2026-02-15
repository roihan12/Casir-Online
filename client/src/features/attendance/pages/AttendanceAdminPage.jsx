import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Calendar, Clock, TrendingUp, Download, Filter,
  Loader2, CheckCircle, XCircle, AlertCircle, Search
} from 'lucide-react';
import {
  getAttendanceStatistics,
  getAttendanceHistory
} from '../services/attendanceService';

/**
 * AttendanceAdminPage Component
 * Admin dashboard for attendance statistics and history
 */
const AttendanceAdminPage = () => {
  const [statistics, setStatistics] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Filters
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: '',
    userId: '',
    page: 1,
    limit: 20
  });

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const data = await getAttendanceStatistics({
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      setStatistics(data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  }, [filters]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAttendanceHistory(filters);
      setHistory(data);
    } catch (err) {
      setError(err.message || 'Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load data on mount and tab/filter change
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStatistics();
    } else {
      fetchHistory();
    }
  }, [activeTab, fetchStatistics, fetchHistory]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'hadir': return 'bg-green-100 text-green-800';
      case 'terlambat': return 'bg-yellow-100 text-yellow-800';
      case 'lembur': return 'bg-blue-100 text-blue-800';
      case 'izin': return 'bg-gray-100 text-gray-800';
      case 'sakit': return 'bg-purple-100 text-purple-800';
      case 'cuti': return 'bg-indigo-100 text-indigo-800';
      case 'tanpa_keterangan': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      hadir: 'On Time',
      terlambat: 'Late',
      lembur: 'Overtime',
      izin: 'Permission',
      sakit: 'Sick',
      cuti: 'Leave',
      tanpa_keterangan: 'Absent'
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Attendance Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage employee attendance</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                History
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <OverviewTab
            statistics={statistics}
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <HistoryTab
            history={history}
            loading={loading}
            error={error}
            filters={filters}
            onFiltersChange={setFilters}
            onRefresh={fetchHistory}
            getStatusColor={getStatusColor}
            getStatusLabel={getStatusLabel}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Overview Tab Component
 */
const OverviewTab = ({ statistics, filters, onFiltersChange }) => {
  const stats = statistics?.statistics || {};
  const summary = statistics?.summary || {};

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Records"
            value={summary.totalRecords || 0}
            icon={Calendar}
            color="blue"
          />
          <SummaryCard
            title="Present"
            value={summary.totalPresent || 0}
            icon={CheckCircle}
            color="green"
          />
          <SummaryCard
            title="Absent"
            value={summary.totalAbsent || 0}
            icon={XCircle}
            color="red"
          />
          <SummaryCard
            title="Attendance Rate"
            value={`${summary.attendanceRate?.toFixed(1) || 0}%`}
            icon={TrendingUp}
            color="purple"
          />
        </div>
      )}

      {/* Detailed Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Attendance Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatItem label="On Time" value={stats.hadir} color="green" />
          <StatItem label="Late" value={stats.terlambat} color="yellow" />
          <StatItem label="Overtime" value={stats.lembur} color="blue" />
          <StatItem label="Permission" value={stats.izin} color="gray" />
          <StatItem label="Sick" value={stats.sakit} color="purple" />
          <StatItem label="Leave" value={stats.cuti} color="indigo" />
          <StatItem label="Absent" value={stats.tanpa_keterangan} color="red" />
        </div>
      </div>
    </div>
  );
};

/**
 * History Tab Component
 */
const HistoryTab = ({ history, loading, error, filters, onFiltersChange, onRefresh, getStatusColor, getStatusLabel }) => {
  const records = history?.data || [];
  const pagination = history?.pagination || {};

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="hadir">On Time</option>
              <option value="terlambat">Late</option>
              <option value="lembur">Overtime</option>
              <option value="izin">Permission</option>
              <option value="sakit">Sick</option>
              <option value="cuti">Leave</option>
              <option value="tanpa_keterangan">Absent</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={onRefresh}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-900">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Records Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 text-sm font-medium">
                            {record.user?.nama?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.user?.nama}</div>
                          <div className="text-xs text-gray-500">{record.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.tanggalAbsensi).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.waktuMasuk ? new Date(record.waktuMasuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.waktuKeluar ? new Date(record.waktuKeluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.lokasiAbsensi?.nama || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.statusKehadiran)}`}>
                        {getStatusLabel(record.statusKehadiran)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.jamKerja || '-'}h
                      {record.isLembur && <span className="text-blue-600 ml-1">(+{record.jamLembur}h)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onFiltersChange({ ...filters, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                <button
                  onClick={() => onFiltersChange({ ...filters, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Summary Card Component
 */
const SummaryCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

/**
 * Stat Item Component
 */
const StatItem = ({ label, value, color }) => {
  const colors = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    red: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <p className="text-2xl font-bold">{value || 0}</p>
      <p className="text-sm mt-1">{label}</p>
    </div>
  );
};

export default AttendanceAdminPage;
