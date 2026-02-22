import React from 'react';
import { Clock, MapPin, LogOut, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

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
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-1/3 mb-6" />
        <div className="space-y-4">
          <div className="h-5 bg-gray-200 rounded-lg w-full" />
          <div className="h-5 bg-gray-200 rounded-lg w-2/3" />
        </div>
      </div>
    );
  }

  if (!attendance) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-sm border border-gray-100 p-8 text-center sm:text-left flex flex-col sm:flex-row items-center gap-6">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Absensi Hari Ini</h3>
          <p className="text-gray-500">Anda belum absen masuk hari ini. Silakan absen masuk untuk mulai melacak kehadiran Anda.</p>
        </div>
      </div>
    );
  }

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
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
      case 'hadir': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'terlambat': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'lembur': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'izin': case 'sakit': case 'cuti': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'tanpa_keterangan': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      hadir: 'Tepat Waktu', terlambat: 'Terlambat', lembur: 'Lembur',
      izin: 'Izin', sakit: 'Sakit', cuti: 'Cuti', tanpa_keterangan: 'Tanpa Keterangan'
    };
    return labels[status] || status;
  };

  const isCompleted = attendance.waktuKeluar;

  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      {/* Header Area */}
      <div className={`p-8 border-b ${isCompleted ? 'bg-gradient-to-r from-emerald-50 to-white border-emerald-100' : 'bg-gradient-to-r from-blue-50 to-white border-blue-100'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isCompleted ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-blue-600 text-white shadow-blue-200'} shadow-lg`}>
              {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {isCompleted ? 'Shift Selesai' : 'Shift Sedang Berjalan'}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(attendance.tanggalAbsensi)}</span>
              </div>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide border ${getStatusColor(attendance.statusKehadiran)}`}>
            {getStatusLabel(attendance.statusKehadiran)}
          </span>
        </div>
      </div>

      {/* Details Area */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clock In Card */}
          <div className="relative overflow-hidden bg-gray-50 rounded-2xl p-6 border border-gray-100 group hover:border-blue-200 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full -translate-x-4 -translate-y-8" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
              <span className="font-semibold text-gray-700">Absen Masuk</span>
            </div>
            <p className="text-4xl font-black text-gray-900 tracking-tight mb-2">
              {formatTime(attendance.waktuMasuk)}
            </p>
            {attendance.lokasiAbsensi && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="truncate">{attendance.lokasiAbsensi.nama}</span>
              </div>
            )}
            {attendance.faceMatchScore && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs font-medium text-gray-600">
                <span>Kecocokan Wajah: {(attendance.faceMatchScore * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>

          {/* Clock Out Card */}
          <div className={`relative overflow-hidden rounded-2xl p-6 border transition-colors ${isCompleted ? 'bg-gray-50 border-gray-100 hover:border-emerald-200' : 'bg-gray-50/50 border-dashed border-gray-200'}`}>
            {isCompleted && <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full -translate-x-4 -translate-y-8" />}
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl shadow-sm border ${isCompleted ? 'bg-white border-gray-100 text-emerald-600' : 'bg-transparent border-gray-200 text-gray-400'}`}>
                <LogOut className="w-5 h-5" />
              </div>
              <span className={`font-semibold ${isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>Absen Keluar</span>
            </div>
            
            {isCompleted ? (
              <>
                <p className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                  {formatTime(attendance.waktuKeluar)}
                </p>
                {attendance.jamKerja && (
                  <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
                    <span className="text-gray-500">Total Waktu: </span>
                    <span className="font-bold text-gray-900">{attendance.jamKerja}j</span>
                    {attendance.isLembur && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        +{attendance.jamLembur}j lembur
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col justify-center">
                <p className="text-lg font-medium text-gray-400">Belum absen keluar</p>
                <p className="text-sm text-gray-400 mt-1">Shift Anda masih berlangsung.</p>
              </div>
            )}
          </div>
        </div>

        {/* Notes Section */}
        {attendance.keterangan && (
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
            <div className="text-gray-400 mt-0.5">ℹ️</div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Catatan Tambahan</p>
              <p className="text-sm text-gray-600 mt-1">{attendance.keterangan}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceStatus;
