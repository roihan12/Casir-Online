import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Navigation, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import AttendanceStatus from '../components/AttendanceStatus';
import ClockInButton from '../components/ClockInButton';
import ClockOutButton from '../components/ClockOutButton';
import { getTodayAttendance } from '../services/attendanceService';

/**
 * MyAttendancePage Component
 * Employee's personal attendance page with clock in/out and status display
 */
const MyAttendancePage = () => {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  /**
   * Fetch today's attendance
   */
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

  /**
   * Refresh attendance data
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAttendance();
  };

  /**
   * Handle successful clock in/out
   */
  const handleSuccess = (message = 'Operation successful') => {
    setNotification({ type: 'success', message });
    fetchAttendance();
    setTimeout(() => setNotification(null), 5000);
  };

  /**
   * Handle clock in/out error
   */
   const handleError = (message) => {
    setNotification({ type: 'error', message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Load attendance on mount
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const canClockIn = !attendance || !attendance.waktuMasuk;
  const canClockOut = attendance && attendance.waktuMasuk && !attendance.waktuKeluar;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
              <p className="text-gray-600 mt-1">
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50 transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`text-sm ${
                  notification.type === 'success' ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className={`${
                notification.type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'
              }`}
            >
              ×
            </button>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-900">{error}</p>
            </div>
            <button
              onClick={fetchAttendance}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Attendance Status */}
        <div className="mb-8">
          <AttendanceStatus attendance={attendance} loading={loading} />
        </div>

        {/* Actions */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Clock In Button */}
            {canClockIn && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Clock In</h3>
                    <p className="text-sm text-gray-600">Start your work day</p>
                  </div>
                </div>
                <ClockInButton
                  onSuccess={() => handleSuccess('Clocked in successfully!')}
                  onError={handleError}
                  className="w-full"
                />
              </div>
            )}

            {/* Clock Out Button */}
            {canClockOut && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Navigation className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Clock Out</h3>
                    <p className="text-sm text-gray-600">End your work day</p>
                  </div>
                </div>
                <ClockOutButton
                  attendanceRecord={attendance}
                  onSuccess={() => handleSuccess('Clocked out successfully! Have a nice rest!')}
                  onError={handleError}
                  className="w-full"
                />
              </div>
            )}

            {/* Information Cards */}
            {attendance?.waktuMasuk && attendance?.waktuKeluar && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Completed</h3>
                    <p className="text-sm text-gray-600">See you tomorrow!</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm">
                    You have completed your attendance for today. Total hours: <span className="font-semibold">{attendance.jamKerja}h</span>
                    {attendance.isLembur && (
                      <span className="text-blue-600"> (+{attendance.jamLembur}h overtime)</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Need Help?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Make sure you're at your assigned location before clocking in/out</li>
            <li>• Allow camera and location permissions when prompted</li>
            <li>• Position your face clearly in the camera frame</li>
            <li>• Ensure good lighting for accurate face recognition</li>
            <li>• Contact your administrator if you cannot access any locations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MyAttendancePage;
