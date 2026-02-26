import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  subMonths, 
  isSameDay, 
  isSameMonth, 
  isToday 
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { getAttendanceHistory } from '../services/attendanceService';
import { useAuth } from '../../../common/hooks/useAuth';

/**
 * MyAttendanceHistory Component
 * Displays a calendar view of the user's personal attendance history
 */
const MyAttendanceHistory = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      
      // Fetch history for the current user and month
      // We pass userId to ensure we only get this user's data (though the backend should already filter for non-admins)
      // Limit to 100 to make sure we get the whole month
      const data = await getAttendanceHistory({
        startDate,
        endDate,
        userId: user?.id,
        limit: 100 
      });
      
      setAttendanceData(data.data || []);
    } catch (err) {
      console.error('Failed to fetch attendance history:', err);
      // Don't show critical error, just empty state if failed
      setError('Gagal memuat riwayat absen bulan ini');
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, user?.id]);

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Calendar logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = monthStart;
  const endDate = monthEnd;
  const dateFormat = 'd';
  const rows = [];
  
  // Calculate summary stats
  const stats = useMemo(() => {
    const s = { hadir: 0, terlambat: 0, izin: 0, sakit: 0, cuti: 0, tanpa_keterangan: 0 };
    attendanceData.forEach(record => {
      const status = record.statusKehadiran?.toLowerCase();
      if (s[status] !== undefined) {
        s[status]++;
      }
    });
    return s;
  }, [attendanceData]);

  // Map attendance by date string (yyyy-MM-dd)
  const attendanceMap = useMemo(() => {
    const map = {};
    attendanceData.forEach(record => {
      if (record.tanggalAbsensi) {
        // Assume tanggalAbsensi is ISO string
        const dateStr = format(new Date(record.tanggalAbsensi), 'yyyy-MM-dd');
        map[dateStr] = record;
      }
    });
    return map;
  }, [attendanceData]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'hadir': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'hadir_terlambat': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'terlambat': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'lembur': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'izin': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'sakit': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'cuti': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'tanpa_keterangan': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      hadir: 'Hadir', hadir_terlambat: 'Hadir Terlambat', terlambat: 'Terlambat', lembur: 'Lembur',
      izin: 'Izin', sakit: 'Sakit', cuti: 'Cuti', tanpa_keterangan: 'Alpa'
    };
    return labels[status?.toLowerCase()] || status || '-';
  };

  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  // Generate calendar grid
  let daysInGrid = [];
  let day = startDate;
  
  // Find the first Monday of the calendar view
  let startDay = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
  const calendarStart = new Date(startDate);
  calendarStart.setDate(calendarStart.getDate() - startDay);

  let currentCalDate = new Date(calendarStart);
  while (daysInGrid.length < 42) { // 6 rows max
    const cloneDay = new Date(currentCalDate);
    const dateStr = format(cloneDay, 'yyyy-MM-dd');
    const record = attendanceMap[dateStr];
    
    daysInGrid.push({
      date: cloneDay,
      record: record,
      isCurrentMonth: isSameMonth(cloneDay, monthStart),
      isToday: isToday(cloneDay),
      isWeekend: cloneDay.getDay() === 0 || cloneDay.getDay() === 6
    });
    currentCalDate.setDate(currentCalDate.getDate() + 1);
  }

  // Split into rows of 7
  for (let i = 0; i < daysInGrid.length; i += 7) {
    rows.push(daysInGrid.slice(i, i + 7));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            {format(currentDate, 'MMMM yyyy', { locale: localeId })}
          </h2>
        </div>
        
        <div className="flex items-center gap-2 border bg-gray-50 rounded-xl p-1">
          <button 
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-600 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={handleToday}
            className="px-3 py-1.5 text-sm font-semibold hover:bg-white rounded-lg transition-colors text-slate-700 shadow-sm"
          >
            Bulan Ini
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-600 shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Hadir</p>
            <p className="text-2xl font-black text-emerald-600">{stats.hadir}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Terlambat</p>
            <p className="text-2xl font-black text-amber-600">{stats.terlambat}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
             <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Iizin / Cuti</p>
            <p className="text-2xl font-black text-blue-600">{stats.izin + stats.cuti + stats.sakit}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
            <FileText className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Alpa</p>
            <p className="text-2xl font-black text-rose-600">{stats.tanpa_keterangan}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 pb-2">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {days.map((day, i) => (
            <div key={i} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Days Grid */}
        <div className="flex flex-col relative">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-7 border-b border-slate-50 last:border-none">
              {row.map((dayInfo, j) => (
                <div 
                  key={j} 
                  className={`min-h-[100px] border-r border-slate-50 last:border-none p-2 ${
                    !dayInfo.isCurrentMonth ? 'bg-slate-50/50 opacity-50' : 
                    dayInfo.isWeekend ? 'bg-slate-50/30' : 'bg-white'
                  } ${dayInfo.isToday ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-semibold ${
                      dayInfo.isToday ? 'bg-blue-600 text-white shadow-md' : 
                      dayInfo.isWeekend ? 'text-rose-500' : 'text-slate-700'
                    }`}>
                      {format(dayInfo.date, dateFormat)}
                    </span>
                    
                    {dayInfo.record && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase truncate max-w-[50px] border ${getStatusColor(dayInfo.record.status_kehadiran)}`}>
                         {getStatusLabel(dayInfo.record.status_kehadiran)}
                      </span>
                    )}
                  </div>

                  {dayInfo.record ? (
                     <div className="space-y-1 mt-1">
                        {dayInfo.record.waktuMasuk && (
                          <div className="flex items-center gap-1 text-xs text-slate-600 font-medium bg-slate-50 p-1 rounded">
                            <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="truncate">{format(new Date(dayInfo.record.waktuMasuk), 'HH:mm')}</span>
                          </div>
                        )}
                        {dayInfo.record.waktuKeluar && (
                          <div className="flex items-center gap-1 text-xs text-slate-600 font-medium bg-slate-50 p-1 rounded">
                            <Clock className="w-3 h-3 text-rose-500 shrink-0" />
                            <span className="truncate">{format(new Date(dayInfo.record.waktuKeluar), 'HH:mm')}</span>
                          </div>
                        )}
                     </div>
                  ) : dayInfo.isCurrentMonth && dayInfo.date < new Date() && !dayInfo.isWeekend ? (
                     <div className="mt-2 text-[10px] text-slate-400 font-medium italic text-center">
                       -
                     </div>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyAttendanceHistory;
