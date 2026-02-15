import React from 'react';
import { Clock, MapPin, LogOut, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * AttendanceStatus Component
 * Displays today's attendance status
 *
 * @param {Object} props
 * @param {Object} props.attendance - Attendance record
 * @param {boolean} props.loading - Loading state
 */
const AttendanceStatus = ({ attendance, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!attendance) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">No Attendance Today</h3>
        </div>
        <p className="text-gray-600">You haven't clocked in yet today. Please clock in to start tracking your attendance.</p>
      </div>
    );
  }

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'hadir':
        return 'bg-green-100 text-green-800';
      case 'terlambat':
        return 'bg-yellow-100 text-yellow-800';
      case 'lembur':
        return 'bg-blue-100 text-blue-800';
      case 'izin':
      case 'sakit':
      case 'cuti':
        return 'bg-gray-100 text-gray-800';
      case 'tanpa_keterangan':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'hadir':
        return 'On Time';
      case 'terlambat':
        return 'Late';
      case 'lembur':
        return 'Overtime';
      case 'izin':
        return 'Permission';
      case 'sakit':
        return 'Sick';
      case 'cuti':
        return 'Leave';
      case 'tanpa_keterangan':
        return 'Absent';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {attendance.waktuKeluar ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <Clock className="w-6 h-6 text-blue-600" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {attendance.waktuKeluar ? 'Completed' : 'In Progress'}
            </h3>
            <p className="text-sm text-gray-600">{formatDate(attendance.tanggalAbsensi)}</p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(attendance.statusKehadiran)}`}>
          {getStatusLabel(attendance.statusKehadiran)}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Clock In */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-900">Clock In</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mb-1">
            {formatTime(attendance.waktuMasuk)}
          </p>
          {attendance.lokasiAbsensi && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{attendance.lokasiAbsensi.nama}</span>
            </div>
          )}
          {attendance.faceMatchScore && (
            <p className="text-xs text-gray-500 mt-2">
              Face match: {(attendance.faceMatchScore * 100).toFixed(1)}%
            </p>
          )}
        </div>

        {/* Clock Out */}
        {attendance.waktuKeluar ? (
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <LogOut className="w-5 h-5 text-red-600" />
              <span className="font-medium text-gray-900">Clock Out</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900 mb-1">
              {formatTime(attendance.waktuKeluar)}
            </p>
            {attendance.jamKerja && (
              <p className="text-sm text-gray-600 mt-2">
                Total hours: {attendance.jamKerja}h
                {attendance.isLembur && ` (+${attendance.jamLembur}h overtime)`}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <LogOut className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900">Clock Out</span>
            </div>
            <p className="text-gray-500">Not yet clocked out</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {attendance.keterangan && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <span className="font-medium">Note:</span> {attendance.keterangan}
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceStatus;
