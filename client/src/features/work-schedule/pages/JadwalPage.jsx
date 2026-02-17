import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Filter } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useJadwalList } from "../../../hooks/useJadwal";
import { useReguList } from "../../../hooks/useRegu";
import { useMasterShiftList } from "../../../hooks/useMasterShift";
import { useCabang } from "../../cabang/context/CabangContext";

import { Button } from "../../../common/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../common/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../common/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../common/components/ui/dialog";

import JadwalForm from "../components/JadwalForm";
import useDebounce from "../../../common/hooks/useDebounce";

// Mock user list fetching (since we don't have a dedicated user hook ready or it's complex)
// Ideally we should use a hook to fetch users based on branch.
// For now, I'll assume we can filter schedules and get users from there, or fetch users separately.
// I'll use a simple approach: Get all schedules for the month, and extract unique users from the data,
// OR better: fetch users for the branch.
import { useUsers } from "../../users/hooks/useUsers";

const JadwalPage = () => {
  const { selectedCabang, cabangList } = useCabang();
  const [activeCabangId, setActiveCabangId] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRegu, setSelectedRegu] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Initialize activeCabangId from selectedCabang
  useEffect(() => {
    if (selectedCabang?.id && !activeCabangId) {
      setActiveCabangId(selectedCabang.id);
    }
  }, [selectedCabang, activeCabangId]);

  // Date calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fetch Regu List
  const { data: reguData } = useReguList({ 
    cabangId: activeCabangId || selectedCabang?.id 
  });

  // Fetch Users (Employees)
  const { getUsersQuery } = useUsers({ 
    ...(activeCabangId || selectedCabang?.id === "global" ? {} : { cabangId: activeCabangId || selectedCabang?.id }),
    limit: 100 
  });
  const users = getUsersQuery?.data?.data || [];
  const isLoadingUsers = getUsersQuery?.isLoading;

  // Fetch Jadwal List
  const { data: jadwalData, isLoading: isLoadingJadwal } = useJadwalList({

    ...(activeCabangId || selectedCabang?.id === "global" ? {} : { cabangId: activeCabangId || selectedCabang?.id }),
    tanggalMulai: format(monthStart, "yyyy-MM-dd"),
    tanggalSelesai: format(monthEnd, "yyyy-MM-dd"),
    reguId: selectedRegu === "all" ? undefined : selectedRegu,
  });

  // Helper to get schedule for a specific user and date
  const getScheduleForCell = (userId, date) => {
    if (!jadwalData?.data) return null;
    const dateStr = format(date, "yyyy-MM-dd");
    return jadwalData.data.find(
      (j) => j.userId === userId && format(new Date(j.tanggalMulai), "yyyy-MM-dd") === dateStr
    );
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleCellClick = (user, date, schedule) => {
    setSelectedSlot({
        userId: user.id,
        user: user,
        date: date,
        scheduleId: schedule?.id,
        schedule: schedule
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedSlot(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jadwal Kerja</h1>
          <p className="text-muted-foreground">
            Kelola jadwal shift karyawan per bulan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={handleToday} className="hidden sm:inline-flex">Hari Ini</Button>
            <div className="flex items-center border rounded-md bg-white shadow-sm overflow-hidden">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="rounded-none h-9 w-9 border-r"><ChevronLeft className="h-4 w-4" /></Button>
                <div className="px-3 sm:px-4 font-medium min-w-[120px] sm:min-w-[140px] text-center text-sm sm:text-base">
                    {format(currentDate, "MMMM yyyy", { locale: localeId })}
                </div>
                <Button variant="ghost" size="icon" onClick={handleNextMonth} className="rounded-none h-9 w-9 border-l"><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <Button onClick={() => { setSelectedSlot(null); setIsFormOpen(true); }} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Buat Jadwal
            </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-md">
        <CardHeader className="bg-white pb-4 border-b">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">Overview Jadwal</CardTitle>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                     {cabangList?.length > 1 && (
                        <Select value={activeCabangId} onValueChange={(val) => {
                            setActiveCabangId(val);
                            setSelectedRegu("all"); // Reset regu when branch changes
                        }}>
                            <SelectTrigger className="w-full sm:w-[200px] h-9">
                                <SelectValue placeholder="Pilih Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                {cabangList.map(cabang => (
                                    <SelectItem key={cabang.id} value={cabang.id}>{cabang.namaCabang}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                     )}

                     <Select value={selectedRegu} onValueChange={setSelectedRegu}>
                        <SelectTrigger className="w-full sm:w-[200px] h-9">
                            <SelectValue placeholder="Filter Regu" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Regu</SelectItem>
                            {reguData?.data?.map(regu => (
                                <SelectItem key={regu.id} value={regu.id}>{regu.nama_regu}</SelectItem>
                            ))}
                        </SelectContent>
                     </Select>
                </div>
             </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="relative group">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b">
                            <tr>
                                <th className="px-4 py-4 sticky left-0 bg-white z-20 font-semibold min-w-[200px] border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    Karyawan
                                </th>
                                {daysInMonth.map(day => (
                                    <th key={day.toString()} className={`px-2 py-3 text-center min-w-[50px] border-r transition-colors ${isToday(day) ? "bg-blue-50 text-blue-600 font-bold" : ""}`}>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] font-medium opacity-70">{format(day, "EEE", { locale: localeId })}</span>
                                            <span className="text-lg leading-tight">{format(day, "d")}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoadingJadwal || isLoadingUsers ? (
                                <tr>
                                    <td colSpan={daysInMonth.length + 1} className="text-center py-20 px-4">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <span className="text-muted-foreground animate-pulse">Memuat data jadwal...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={daysInMonth.length + 1} className="text-center py-20 px-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <CalendarIcon className="h-12 w-12 text-gray-200" />
                                            <p className="text-lg font-medium text-gray-400">Belum ada data</p>
                                            <p className="text-sm text-gray-400">Tidak ada karyawan ditemukan untuk cabang ini.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50/30 transition-colors">
                                        <td className="px-4 py-3 font-medium sticky left-0 bg-white z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="truncate text-gray-900" title={user.nama_lengkap || user.email}>{user.nama_lengkap || user.email}</span>
                                                <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>
                                            </div>
                                        </td>
                                        {daysInMonth.map(day => {
                                            const schedule = getScheduleForCell(user.id, day);
                                            let cellClass = "bg-gray-50/50 hover:bg-gray-100/80 border-transparent text-gray-400";
                                            let textClass = "";
                                            let label = "-";

                                            if (schedule) {
                                                if (schedule.tipe_jadwal === 'libur') {
                                                    cellClass = "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 shadow-sm";
                                                    label = "LB";
                                                } else if (schedule.tipe_jadwal === 'wfh') {
                                                    cellClass = "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700 shadow-sm";
                                                    label = "WFH";
                                                } else {
                                                    const startHour = schedule.jamMasuk ? parseInt(schedule.jamMasuk.split(':')[0]) : 0;
                                                    
                                                    if (startHour >= 5 && startHour < 10) {
                                                        cellClass = "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 shadow-sm";
                                                        label = "P";
                                                    } else if (startHour >= 10 && startHour < 18) {
                                                        cellClass = "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 shadow-sm";
                                                        label = "S";
                                                    } else {
                                                        cellClass = "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 shadow-sm";
                                                        label = "M";
                                                    }
                                                }
                                            }

                                            return (
                                                <td 
                                                    key={day.toString()} 
                                                    className={`p-1 border-r last:border-r-0 text-center cursor-pointer transition-colors ${isToday(day) ? "bg-blue-50/20" : ""}`}
                                                    onClick={() => handleCellClick(user, day, schedule)}
                                                >
                                                    <div className={`w-full h-9 flex items-center justify-center rounded-md text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${cellClass}`}>
                                                        {label}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Scroll Hint Shadow */}
                <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent pointer-events-none sm:hidden"></div>
            </div>
            
            <div className="p-4 bg-gray-50/50 border-t flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-emerald-50 border border-emerald-200 rounded-sm"></div>
                    <span>Pagi (06:00 - 10:00)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-amber-50 border border-amber-200 rounded-sm"></div>
                    <span>Siang (10:00 - 18:00)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-slate-100 border border-slate-300 rounded-sm"></div>
                    <span>Malam (18:00+)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-rose-50 border border-rose-200 rounded-sm"></div>
                    <span>Libur</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-indigo-50 border border-indigo-200 rounded-sm"></div>
                    <span>WFH</span>
                </div>
            </div>
        </CardContent>
      </Card>

      <JadwalForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        selectedSlot={selectedSlot}
        onClose={handleCloseForm}
        cabangId={activeCabangId || selectedCabang?.id}
      />
    </div>
  );
};

export default JadwalPage;
