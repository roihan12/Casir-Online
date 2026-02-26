import React, { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  isToday 
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle
} from 'lucide-react';
import { useMyJadwal } from '../../work-schedule/hooks/useJadwal';
import { resolveShift } from '../../../common/utils/jadwalUtils';

/**
 * MyWorkSchedule Component
 * Displays a calendar view of the user's personal future/current work schedule
 */
const MyWorkSchedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  const startDateStr = format(monthStart, 'yyyy-MM-dd');
  const endDateStr = format(monthEnd, 'yyyy-MM-dd');

  const { data: jadwalResponse, isLoading, error } = useMyJadwal({
    tanggalMulai: startDateStr,
    tanggalSelesai: endDateStr
  });

  const jadwalData = jadwalResponse?.data || [];

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Map schedule by date string (yyyy-MM-dd)
  const scheduleMap = useMemo(() => {
    const map = {};
    jadwalData.forEach(record => {
      if (record.tanggalMulai) {
        // Assume tanggalMulai is ISO string
        const dateStr = format(new Date(record.tanggalMulai), 'yyyy-MM-dd');
        map[dateStr] = record;
      }
    });
    return map;
  }, [jadwalData]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const s = { shift: 0, reguler: 0, liburUtama: 0, wfh: 0, cutiIzin: 0 };
    jadwalData.forEach(record => {
      const type = record.tipe_jadwal?.toLowerCase();
      if (type === 'shift') s.shift++;
      else if (type === 'reguler') s.reguler++;
      else if (type === 'libur') s.liburUtama++;
      else if (type === 'wfh') s.wfh++;
      else if (type === 'cuti' || type === 'izin') s.cutiIzin++;
    });
    return s;
  }, [jadwalData]);


  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  
  // Generate calendar grid
  const rows = [];
  let daysInGrid = [];
  
  // Find the first Monday of the calendar view
  let startDay = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - startDay);

  let currentCalDate = new Date(calendarStart);
  while (daysInGrid.length < 42) { // 6 rows max
    const cloneDay = new Date(currentCalDate);
    const dateStr = format(cloneDay, 'yyyy-MM-dd');
    const record = scheduleMap[dateStr];
    
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
            Jadwal: {format(currentDate, 'MMMM yyyy', { locale: localeId })}
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Shift</p>
            <p className="text-xl font-black text-blue-600">{stats.shift}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Reguler</p>
            <p className="text-xl font-black text-emerald-600">{stats.reguler}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">WFH</p>
            <p className="text-xl font-black text-indigo-600">{stats.wfh}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
             <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Libur</p>
            <p className="text-xl font-black text-rose-500">{stats.liburUtama}</p>
        </div>
        <div className="bg-white p-3 col-span-2 md:col-span-4 lg:col-span-1 border border-gray-100 shadow-sm rounded-2xl flex flex-col items-center justify-center">
            <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Cuti / Izin</p>
            <p className="text-xl font-black text-amber-500">{stats.cutiIzin}</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">Gagal memuat jadwal: {error.message || 'Error occurred'}</p>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 pb-2 relative min-h-[400px]">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {days.map((day, i) => (
            <div key={i} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center pt-10">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
             <span className="text-sm text-slate-500 font-medium">Memuat jadwal...</span>
          </div>
        )}

        {/* Days Grid */}
        <div className="flex flex-col relative">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-7 border-b border-slate-50 last:border-none">
              {row.map((dayInfo, j) => {
                const shiftInfo = resolveShift(dayInfo.record);

                return (
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
                        {format(dayInfo.date, 'd')}
                      </span>
                    </div>

                    {dayInfo.record ? (
                      <div className="flex flex-col space-y-1 mt-1 animate-fade-in">
                        <div className={`text-[10px] sm:text-xs font-bold border rounded px-1.5 py-1 text-center truncate ${shiftInfo.cellClass}`}>
                          {shiftInfo.label}
                        </div>
                        {['shift', 'reguler'].includes(dayInfo.record.tipe_jadwal) && (
                          <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] text-slate-500 font-medium bg-slate-50 p-1 rounded border border-slate-100">
                             <Clock className="w-3 h-3 text-slate-400 shrink-0 hidden sm:block" />
                             <span className="truncate">{dayInfo.record.jamMasuk.substring(0, 5)} - {dayInfo.record.jamKeluar.substring(0, 5)}</span>
                          </div>
                        )}
                      </div>
                    ) : dayInfo.isCurrentMonth ? (
                      <div className="mt-4 text-[10px] text-slate-400 font-medium italic text-center">
                        -
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyWorkSchedule;
