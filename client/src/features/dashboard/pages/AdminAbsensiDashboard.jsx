import React, { useState } from 'react';
import { useCabang } from '../../cabang/context/CabangContext';
import {
  useHariIni,
  useBelumAbsen,
  useTren,
  useTopTerlambat,
  useRekapLembur,
  usePendingApproval
} from '../hooks/useDashboardAdminAbsensi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { format } from 'date-fns';
import { Users, Clock, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminAbsensiDashboard = () => {
  const { selectedCabang } = useCabang();
  const branchId = selectedCabang?.id;

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [periode, setPeriode] = useState(format(new Date(), 'yyyy-MM'));

  // Data Fetching
  const { data: hariIni, isLoading: loadHariIni } = useHariIni(branchId, date);
  const { data: belumAbsen, isLoading: loadBelumAbsen } = useBelumAbsen(branchId, date);
  const { data: trenData, isLoading: loadTren } = useTren(branchId, periode);
  
  const [year, month] = periode.split('-');
  const { data: topTerlambat } = useTopTerlambat(branchId, month, year);
  const { data: rekapLembur } = useRekapLembur(branchId, month, year);
  const { data: pendingApproval } = usePendingApproval(branchId);

  if (!branchId) {
    return (
      <div className="flex h-64 items-center justify-center bg-white rounded-lg shadow-sm">
        <p className="text-gray-500">Pilih cabang terlebih dahulu untuk melihat dashboard absensi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Absensi</h1>
          <p className="text-sm text-gray-500">Pantau kehadiran, keterlambatan, dan lembur karyawan.</p>
        </div>
        <div className="flex gap-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="month"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Karyawan (Jadwal)</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{hariIni?.totalKaryawan || 0}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Hadir On-Time</p>
            <h3 className="text-2xl font-bold text-green-600 mt-1">{hariIni?.hadir || 0}</h3>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Terlambat</p>
            <h3 className="text-2xl font-bold text-yellow-600 mt-1">{hariIni?.terlambat || 0}</h3>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Approval</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">{pendingApproval?.total || 0}</h3>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Charts & Belum Absen */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tren Kehadiran ({periode})</h3>
            <div className="h-72 w-full">
              {loadTren ? (
                <div className="h-full flex items-center justify-center">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trenData || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" dataKey="hadir" name="Hadir" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="terlambat" name="Terlambat" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="absen" name="Absen" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Belum Absen Hari Ini</h3>
            {loadBelumAbsen ? (
              <p>Loading...</p>
            ) : belumAbsen?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="py-3 px-4 rounded-tl-lg rounded-bl-lg">Nama</th>
                      <th className="py-3 px-4">Shift Mulai</th>
                      <th className="py-3 px-4 rounded-tr-lg rounded-br-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {belumAbsen.map((user, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-medium text-gray-900">{user.nama}</td>
                        <td className="py-3 px-4 text-gray-500">{user.shiftMulai}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Belum Absen
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Semua karyawan sudah absen hari ini.</p>
            )}
          </div>
        </div>

        {/* Right Col: Top Terlambat & Rekap Lembur */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top 5 Karyawan Terlambat</h3>
            <div className="space-y-4">
              {topTerlambat?.length > 0 ? (
                topTerlambat.map((usr, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{usr.nama}</p>
                        <p className="text-xs text-gray-500">{usr.total_menit} Menit Keterlambatan</p>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-red-600 font-mono">
                      {usr.frekuensi}x
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Bagus! Tidak ada keterlambatan bulan ini.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rekap Overtime</h3>
            <div className="space-y-4">
              {rekapLembur?.length > 0 ? (
                rekapLembur.map((usr, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{usr.nama}</p>
                      <p className="text-xs text-gray-500">Total Lembur</p>
                    </div>
                    <div className="text-sm font-bold text-blue-600 font-mono">
                      {usr.total_jam} Jam
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Tidak ada record lembur.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminAbsensiDashboard;
