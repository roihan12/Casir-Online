import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  useMyAbsensiHariIni,
  useRekapBulan,
  useSaldoCuti,
  useSlipTerbaru,
  useJadwalMingguIni
} from '../hooks/useDashboardKaryawanAbsensi';
import { Clock, Calendar, Briefcase, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const KaryawanAbsensiDashboard = () => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const periode = format(new Date(), 'yyyy-MM');

  const { data: myAbsen, isLoading: loadMe } = useMyAbsensiHariIni(date);
  const { data: rekap } = useRekapBulan(periode);
  const { data: cuti } = useSaldoCuti();
  const { data: slip } = useSlipTerbaru();
  const { data: jadwal } = useJadwalMingguIni(date);

  if (loadMe) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">Memuat dashboard...</div>;
  }

  const statusText = myAbsen?.status_kehadiran || 'Belum_Absen';
  const isLate = statusText === 'hadir_terlambat';
  const isPresent = statusText === 'hadir' || isLate;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen py-6 md:py-10 pb-24">
      {/* Header Account Info */}
      <div className="bg-blue-600 text-white p-6 md:p-8 rounded-3xl shadow-md mb-8 flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="w-full lg:w-auto z-10 flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold">Halo, Karyawan!</h1>
          <p className="text-blue-100 mt-2 opacity-90 text-sm md:text-base">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
        
        {/* Quick Status Card inside Header Top */}
        <div className="w-full lg:w-auto bg-white rounded-2xl p-5 shadow-lg text-gray-800 flex-1 lg:max-w-sm z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg md:text-base">Status Hari Ini</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isPresent ? (isLate ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700') : 'bg-red-100 text-red-700'
            }`}>
              {statusText.replace('_', ' ')}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-center divide-x divide-gray-100">
            <div className="flex-1 px-2">
              <p className="text-xs text-gray-500 mb-1">Jam Masuk</p>
              <p className="font-mono font-bold text-lg md:text-xl">{myAbsen?.waktu_masuk ? format(new Date(myAbsen.waktu_masuk), 'HH:mm') : '--:--'}</p>
            </div>
            <div className="flex-1 px-2">
              <p className="text-xs text-gray-500 mb-1">Jam Pulang</p>
              <p className="font-mono font-bold text-lg md:text-xl">{myAbsen?.waktu_keluar ? format(new Date(myAbsen.waktu_keluar), 'HH:mm') : '--:--'}</p>
            </div>
          </div>
        </div>

        {/* Decorative Graphic Background using absolute positioning */}
        <div className="absolute left-[-20%] top-[-50%] w-96 h-96 bg-blue-500 rounded-full opacity-50 blur-3xl z-0 pointer-events-none hidden md:block" />
        <div className="absolute right-[-10%] bottom-[-50%] w-72 h-72 bg-blue-700 rounded-full opacity-50 blur-2xl z-0 pointer-events-none hidden md:block" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Primary Views) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Menu Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link to="/attendance/absensi" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:bg-blue-50 hover:border-blue-100 transition-all group">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Buka Absensi</span>
            </Link>

            <Link to="/leave/my-leave" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:bg-purple-50 hover:border-purple-100 transition-all group">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Pengajuan Cuti</span>
            </Link>
          </div>

          {/* Cuti & Rekap Bulanan Grid - Layout Adapts on Screen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden transition-transform hover:-translate-y-1">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Sisa Cuti Tahunan</p>
                  <Briefcase className="w-5 h-5 text-indigo-200" />
                </div>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-5xl font-extrabold shadow-sm drop-shadow-md">{cuti?.sisaCuti || 0}</span>
                  <span className="text-indigo-100 text-lg font-medium">Hari</span>
                </div>
              </div>
              <Briefcase className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10" />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Kehadiran ({format(new Date(), 'MMM yy')})</p>
                <CheckCircle className="w-5 h-5 text-gray-300" />
              </div>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-5xl font-extrabold text-gray-900">{rekap?._sum?.total_hadir || 0}</span>
                <span className="text-gray-500 text-lg font-medium">Hari</span>
              </div>
              {rekap?._sum?.total_terlambat > 0 && (
                <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-red-600 bg-red-50 w-fit px-3 py-1.5 rounded-full">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{rekap?._sum?.total_terlambat} Kali Terlambat</span>
                </div>
              )}
            </div>
          </div>

          {/* Jadwal Shift List */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-5 text-lg">Jadwal Shift Minggu Ini</h3>
            <div className="space-y-3">
              {jadwal?.length > 0 ? (
                jadwal.map((j, i) => {
                  const shiftDate = new Date(j.tanggalMulai);
                  const isToday = format(shiftDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  return (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${isToday ? 'border-blue-200 bg-blue-50/70' : 'border-gray-100 hover:bg-gray-50/80'} transition-colors`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold text-sm ${isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-700'}`}>
                          <span className="text-[10px] uppercase font-semibold">{format(shiftDate, 'MMM')}</span>
                          <span className="text-lg leading-none mt-0.5">{format(shiftDate, 'dd')}</span>
                        </div>
                        <div>
                          <p className={`text-base font-bold ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>{j.shift?.namaShift || 'Shift'}</p>
                          <p className={`text-sm font-medium ${isToday ? 'text-blue-700' : 'text-gray-500'}`}>{j.shift?.jamMasuk} - {j.shift?.jamKeluar}</p>
                        </div>
                      </div>
                      {isToday && (
                        <div className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 shadow-sm hidden sm:block">
                          Sedang Berlangsung
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10">
                  <Calendar className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Belum ada jadwal shift untuk minggu ini.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Slip Gaji & Info Lainnya) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Slip Gaji Component */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-50/80 border border-blue-100 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Slip Gaji Terbaru</h3>
            </div>
            
            {slip ? (
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-inner group">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Periode Bulan</p>
                    <p className="text-lg font-extrabold text-gray-900">{slip.periode}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide ${
                    slip.status === 'terbayar' || slip.status === 'final' ? 'bg-green-100 text-green-700 border border-green-200' :
                    slip.status === 'draft' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {slip.status}
                  </span>
                </div>
                
                <div className="mt-5 pt-5 border-t border-gray-200/80">
                  <Link to={`/payroll/slips/print/${slip.id}`} className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-300 shadow-sm text-sm font-bold text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all">
                    <FileText className="w-4 h-4" /> Buka Detail Slip
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">Belum ada dokumen slip gaji.</p>
              </div>
            )}
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default KaryawanAbsensiDashboard;
