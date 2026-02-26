import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Navigation, RefreshCw, AlertCircle, CheckCircle, Users, User } from 'lucide-react';
import AttendanceStatus from '../components/AttendanceStatus';
import ClockInButton from '../components/ClockInButton';
import ClockOutButton from '../components/ClockOutButton';
import TeamAttendanceToday from '../components/TeamAttendanceToday';
import AttendanceMap from '../components/AttendanceMap';
import MyAttendanceHistory from '../components/MyAttendanceHistory';
import MyWorkSchedule from '../components/MyWorkSchedule';
import { getTodayAttendance } from '../services/attendanceService';
import { useAuth } from '../../../common/hooks/useAuth';
import { FileText } from 'lucide-react';

/**
 * MyAttendancePage Component
 * Employee's personal attendance page and Admin's Team Overview
 */
const MyAttendancePage = () => {
  const { hasPermission, isSuperAdmin } = useAuth();
  const isAdmin = hasPermission('absensi:read') || isSuperAdmin();

  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'team'
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchAttendance = useCallback(async () => {
    try {
      setError(null);
      const data = await getTodayAttendance();
      setAttendance(data);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
      setError(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAttendance();
  };

  const handleSuccess = (message = 'Operation successful') => {
    setNotification({ type: 'success', message });
    fetchAttendance();
    setTimeout(() => setNotification(null), 5000);
  };

  const handleError = (message) => {
    setNotification({ type: 'error', message });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    if (activeTab === 'my') {
      fetchAttendance();
    }
  }, [fetchAttendance, activeTab]);

  const canClockIn = !attendance || !attendance.waktuMasuk;
  const canClockOut = attendance && attendance.waktuMasuk && !attendance.waktuKeluar;

  const renderMyAttendance = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Action Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clock In */}
          {canClockIn && (
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Mulai Shift</h3>
                  <p className="text-sm text-gray-500">Catat waktu masuk Anda</p>
                </div>
              </div>
              <ClockInButton
                onSuccess={() => handleSuccess('Berhasil absen masuk!')}
                onError={handleError}
                className="w-full"
              />
            </div>
          )}

          {/* Clock Out */}
          {canClockOut && (
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                  <Navigation className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Akhiri Shift</h3>
                  <p className="text-sm text-gray-500">Catat waktu keluar Anda</p>
                </div>
              </div>
              <ClockOutButton
                attendanceRecord={attendance}
                onSuccess={() => handleSuccess('Berhasil absen keluar! Selamat beristirahat!')}
                onError={handleError}
                className="w-full"
              />
            </div>
          )}
          
          {/* Completed state card */}
          {attendance?.waktuMasuk && attendance?.waktuKeluar && (
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-lg shadow-emerald-200 col-span-1 md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Shift Selesai</h3>
                  <p className="text-emerald-50 mt-1 opacity-90">Kerja bagus hari ini! Sampai jumpa di shift berikutnya.</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/20 text-center w-full sm:w-auto">
                <p className="text-sm text-emerald-100 mb-1">Total Waktu</p>
                <p className="text-3xl font-bold tracking-tight">{attendance.jamKerja}h{attendance.isLembur && <span className="text-sm ml-2 bg-white/20 px-2 py-0.5 rounded font-medium">+{attendance.jamLembur}h</span>}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Details */}
      <AttendanceStatus attendance={attendance} loading={loading} />
      
      {/* Live Map with Radius Checking */}
      <AttendanceMap />
      
      {/* Help Section */}
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col sm:flex-row gap-6 items-start">
        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
          <span className="text-slate-600 font-bold text-xl">?</span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 mb-2">Butuh Bantuan?</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
              <span className="truncate">Pastikan lokasi akurat</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
              <span className="truncate">Izinkan akses kamera</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
              <span className="truncate">Posisi wajah terlihat jelas</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
              <span className="truncate">Butuh pencahayaan baik</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] py-8 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Absensi</h1>
            <p className="text-slate-500 mt-1 font-medium bg-slate-100 w-fit px-3 py-1 rounded-full text-sm">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          {activeTab === 'my' && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-all font-medium text-slate-700 w-fit"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Segarkan
            </button>
          )}
        </div>

        {/* Global Notifications */}
        {notification && (
          <div className={`mb-8 p-4 rounded-2xl flex items-start gap-3 shadow-sm border ${
            notification.type === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            )}
            <p className={`flex-1 text-sm font-medium ${notification.type === 'success' ? 'text-emerald-900' : 'text-rose-900'}`}>
              {notification.message}
            </p>
            <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
        )}

        {/* Global Error */}
        {error && !loading && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <p className="flex-1 text-sm font-medium text-rose-900">{error}</p>
            <button
              onClick={fetchAttendance}
              className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors shadow-sm shadow-rose-200"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="w-full mb-8">
          <div className="flex p-1 bg-slate-100/80 backdrop-blur-sm rounded-2xl w-max sm:w-fit border border-slate-200/50 overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setActiveTab('my')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'my'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <User className="w-4 h-4" />
              Absensi Saya
            </button>
            
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'schedule'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Jadwal Kerja Saya
            </button>
            
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'history'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Riwayat Kehadiran
            </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('team')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'team'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Users className="w-4 h-4" />
              Absensi Tim Hari Ini
            </button>
          )}
          </div>
        </div>


        {/* Tab Content */}
        <div className="mt-2 text-slate-800 animate-fade-in">
          {activeTab === 'my' && renderMyAttendance()}
          {activeTab === 'schedule' && <MyWorkSchedule />}
          {activeTab === 'history' && <MyAttendanceHistory />}
          {activeTab === 'team' && isAdmin && <TeamAttendanceToday />}
        </div>
      </div>
    </div>
  );
};

export default MyAttendancePage;
