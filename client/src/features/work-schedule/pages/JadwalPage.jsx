import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  format, startOfMonth, endOfMonth,
  eachDayOfInterval, addMonths, subMonths, isToday,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ChevronLeft, ChevronRight, Plus,
  Calendar as CalendarIcon, ChevronDown, ChevronRight as ChevronRightIcon, Users,
} from "lucide-react";

import { useJadwalList } from "../hooks/useJadwal";
import { useReguList }   from "../hooks/useRegu";
import { useCabang }     from "../../cabang/context/CabangContext";
import { useUsers }      from "../../users/hooks/useUsers";

import { Button } from "../../../common/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../common/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../common/components/ui/select";
import JadwalForm from "../components/JadwalForm";
import { computeTodaySummary, groupUsersByRegu, resolveShift } from "../../../common/utils/jadwalUtils";
import { DISPLAY_LIMIT, LEGEND_ITEMS, TODAY_CARD_CONFIG } from "../../../app/constants/jadwalConfig";

// ─────────────────────────────────────────────────────────────────────────────
// TodaySummaryPanel
// ─────────────────────────────────────────────────────────────────────────────

const TodaySummaryCard = ({ config, users }) => {
  const { label, time, bg, border, text, dot } = config;
  const visible = users.slice(0, DISPLAY_LIMIT);
  const hidden  = users.length - visible.length;

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${bg} ${border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${text}`}>{label}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{time}</p>
        </div>
        <span className={`text-3xl font-bold tabular-nums leading-none ${text}`}>{users.length}</span>
      </div>

      <div className="min-h-[56px] space-y-1">
        {users.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Tidak ada karyawan</p>
        ) : (
          <>
            {visible.map((u) => (
              <div key={u.id} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                <span
                  className="text-xs text-gray-700 truncate leading-tight"
                  title={u.namaLengkap || u.email}
                >
                  {u.namaLengkap || u.email}
                </span>
              </div>
            ))}
            {hidden > 0 && (
              <p className={`text-xs font-medium ${text} opacity-60`}>+{hidden} lainnya…</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const TodaySummaryPanel = ({ todaySummary, todayLabel, isLoading }) => (
  <div className="space-y-3">
    <div>
      <h2 className="text-sm font-semibold text-gray-700">Ringkasan Hari Ini</h2>
      <p className="text-xs text-muted-foreground capitalize">{todayLabel}</p>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {isLoading
        ? [...Array(4)].map((_, i) => (
            <div key={i} className="h-[148px] rounded-xl border bg-gray-50 animate-pulse" />
          ))
        : TODAY_CARD_CONFIG.map((config) => (
            <TodaySummaryCard
              key={config.key}
              config={config}
              users={todaySummary[config.key] ?? []}
            />
          ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Tabel — komponen atomik
// ─────────────────────────────────────────────────────────────────────────────

const ScheduleCell = React.memo(({ day, schedule, onClick }) => {
  const { label, cellClass } = resolveShift(schedule);
  return (
    <td
      className={`p-1 border-r last:border-r-0 text-center cursor-pointer transition-colors ${
        isToday(day) ? "bg-blue-50/30" : ""
      }`}
      onClick={onClick}
    >
      <div
        className={`w-full h-9 flex items-center justify-center rounded-md text-xs font-bold border
          transition-all hover:scale-105 active:scale-95 ${cellClass}`}
      >
        {label}
      </div>
    </td>
  );
});

const UserRow = React.memo(({ user, days, scheduleMap, onCellClick }) => (
  <tr className="border-b last:border-0 hover:bg-gray-50/40 transition-colors">
    <td className="px-4 py-2.5 sticky left-0 bg-white z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.07)]">
      <div className="flex flex-col overflow-hidden">
        <span
          className="truncate text-gray-900 text-sm font-medium"
          title={user.nama_lengkap || user.email}
        >
          {user.nama_lengkap || user.email}
        </span>
        <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>
      </div>
    </td>
    {days.map((day) => {
      const key      = format(day, "yyyy-MM-dd");
      const schedule = scheduleMap[user.id]?.[key] ?? null;
      return (
        <ScheduleCell
          key={key}
          day={day}
          schedule={schedule}
          onClick={() => onCellClick(user, day, schedule)}
        />
      );
    })}
  </tr>
));

// ─────────────────────────────────────────────────────────────────────────────
// ReguGroupHeader
// ─────────────────────────────────────────────────────────────────────────────

const StatBadge = ({ label, count, colorClass }) =>
  count > 0 ? (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${colorClass}`}>
      {label} <span className="font-bold tabular-nums">{count}</span>
    </span>
  ) : null;

const ReguGroupHeader = ({ regu, userCount, todayStats, colSpan, isOpen, onToggle }) => (
  <tr
    className="bg-gray-50/80 border-y cursor-pointer select-none group hover:bg-gray-100/60 transition-colors"
    onClick={onToggle}
  >
    {/* Sticky kolom nama regu */}
    <td className="px-4 py-2 sticky left-0 bg-gray-50/90 group-hover:bg-gray-100/80 transition-colors z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2">
        {isOpen
          ? <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 transition-transform" />
          : <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        }
        <span className="font-semibold text-gray-700 text-sm">{regu.nama_regu}</span>
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
          <Users className="h-3 w-3" />{userCount}
        </span>
      </div>
    </td>

    {/* Mini-stats hari ini — span sisa kolom */}
    <td colSpan={colSpan - 1} className="px-3 py-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-gray-400 mr-0.5">Hari ini:</span>
        <StatBadge label="P"  count={todayStats.pagi}  colorClass="bg-emerald-100 text-emerald-700" />
        <StatBadge label="S"  count={todayStats.siang} colorClass="bg-amber-100   text-amber-700"   />
        <StatBadge label="M"  count={todayStats.malam} colorClass="bg-slate-200   text-slate-700"   />
        <StatBadge label="LB" count={todayStats.libur} colorClass="bg-rose-100    text-rose-700"    />
        {todayStats.pagi + todayStats.siang + todayStats.malam + todayStats.libur === 0 && (
          <span className="text-[11px] text-gray-400 italic">belum ada jadwal</span>
        )}
      </div>
    </td>
  </tr>
);

// ─────────────────────────────────────────────────────────────────────────────
// ReguGroup — header + baris karyawan
// ─────────────────────────────────────────────────────────────────────────────

const ReguGroup = React.memo(({ group, days, scheduleMap, onCellClick, isOpen, onToggle }) => (
  <>
    <ReguGroupHeader
      regu={group.regu}
      userCount={group.users.length}
      todayStats={group.todayStats}
      colSpan={days.length + 1}
      isOpen={isOpen}
      onToggle={onToggle}
    />
    {isOpen &&
      group.users.map((user) => (
        <UserRow
          key={user.id}
          user={user}
          days={days}
          scheduleMap={scheduleMap}
          onCellClick={onCellClick}
        />
      ))}
  </>
));

// ─────────────────────────────────────────────────────────────────────────────
// CalendarLegend
// ─────────────────────────────────────────────────────────────────────────────

const CalendarLegend = () => (
  <div className="p-4 bg-gray-50/50 border-t flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-gray-500">
    {LEGEND_ITEMS.map(({ colorClass, label }) => (
      <div key={label} className="flex items-center gap-2">
        <div className={`w-3.5 h-3.5 ${colorClass} border rounded-sm`} />
        <span>{label}</span>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// TablePlaceholder
// ─────────────────────────────────────────────────────────────────────────────

const TablePlaceholder = ({ isLoading, colSpan }) => (
  <tr>
    <td colSpan={colSpan} className="text-center py-20 px-4">
      {isLoading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="text-muted-foreground animate-pulse">Memuat data jadwal…</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <CalendarIcon className="h-12 w-12 text-gray-200" />
          <p className="text-lg font-medium text-gray-400">Belum ada data</p>
          <p className="text-sm text-gray-400">Tidak ada karyawan ditemukan untuk cabang ini.</p>
        </div>
      )}
    </td>
  </tr>
);

// ─────────────────────────────────────────────────────────────────────────────
// MonthNavigator
// ─────────────────────────────────────────────────────────────────────────────

const MonthNavigator = ({ currentDate, onPrev, onNext, onToday }) => (
  <div className="flex flex-wrap items-center gap-3">
    <Button variant="outline" onClick={onToday} className="hidden sm:inline-flex">
      Hari Ini
    </Button>
    <div className="flex items-center border rounded-md bg-white shadow-sm overflow-hidden">
      <Button variant="ghost" size="icon" onClick={onPrev} className="rounded-none h-9 w-9 border-r">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="px-3 sm:px-4 font-medium min-w-[130px] sm:min-w-[150px] text-center text-sm sm:text-base">
        {format(currentDate, "MMMM yyyy", { locale: localeId })}
      </div>
      <Button variant="ghost" size="icon" onClick={onNext} className="rounded-none h-9 w-9 border-l">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// JadwalPage (main)
// ─────────────────────────────────────────────────────────────────────────────

const JadwalPage = () => {
  const { selectedCabang, cabangList } = useCabang();

  // ── State ─────────────────────────────────
  const [activeCabangId, setActiveCabangId]     = useState("");
  const [currentDate, setCurrentDate]           = useState(new Date());
  const [selectedRegu, setSelectedRegu]         = useState("all");
  const [isFormOpen, setIsFormOpen]             = useState(false);
  const [selectedSlot, setSelectedSlot]         = useState(null);
  // Set berisi reguId yang sedang di-collapse (default: semua open)
  const [collapsedReguIds, setCollapsedReguIds] = useState(new Set());

  // Inisialisasi cabang aktif dari context
  useEffect(() => {
    if (selectedCabang?.id && !activeCabangId) {
      setActiveCabangId(selectedCabang.id);
    }
  }, [selectedCabang, activeCabangId]);

  // ── Derived date values ───────────────────
  const monthStart  = startOfMonth(currentDate);
  const monthEnd    = endOfMonth(currentDate);
  const daysInMonth = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monthStart.toISOString()]
  );
  // todayStr & todayLabel tidak berubah dalam satu sesi, aman tanpa dep
  const todayStr   = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const todayLabel = useMemo(() => format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId }), []);

  // ── Helpers ───────────────────────────────
  const effectiveCabangId = activeCabangId || selectedCabang?.id;
  const isGlobal          = effectiveCabangId === "global";
  const cabangFilter      = isGlobal ? {} : { cabangId: effectiveCabangId };

  // ── Data fetching ─────────────────────────
  const { data: reguData } = useReguList({ cabangId: cabangFilter });

  const { getUsersQuery } = useUsers({ ...cabangFilter, limit: 500 });
  const users          = getUsersQuery?.data?.data ?? [];
  const isLoadingUsers = getUsersQuery?.isLoading ?? false;

  const { data: jadwalData, isLoading: isLoadingJadwal } = useJadwalList({
    ...cabangFilter,
    tanggalMulai:   format(monthStart, "yyyy-MM-dd"),
    tanggalSelesai: format(monthEnd,   "yyyy-MM-dd"),
    reguId: selectedRegu === "all" ? undefined : selectedRegu,
  });

  // ── scheduleMap — O(1) lookup per cell ────
  // { [userId]: { [dateStr]: jadwal } }
  const scheduleMap = useMemo(() => {
    const map = {};
    for (const jadwal of jadwalData?.data ?? []) {
      const dateStr = format(new Date(jadwal.tanggalMulai), "yyyy-MM-dd");
      if (!map[jadwal.userId]) map[jadwal.userId] = {};
      map[jadwal.userId][dateStr] = jadwal;
    }
    return map;
  }, [jadwalData]);

  // ── Today summary (agregasi dari scheduleMap) ──
  const todaySummary = useMemo(
    () => computeTodaySummary(users, scheduleMap, todayStr),
    [users, scheduleMap, todayStr]
  );

  console.log("todaySummary 1", todaySummary);

  // ── Regu groups (users dikelompokkan per regu) ──
  const reguGroups = useMemo(
    () => groupUsersByRegu(users, reguData?.data, scheduleMap, todayStr),
    [users, reguData, scheduleMap, todayStr]
  );

  // ── Event handlers ────────────────────────
  const handlePrevMonth = useCallback(() => setCurrentDate((d) => subMonths(d, 1)), []);
  const handleNextMonth = useCallback(() => setCurrentDate((d) => addMonths(d, 1)), []);
  const handleToday     = useCallback(() => setCurrentDate(new Date()), []);

  const handleCellClick = useCallback((user, date, schedule) => {
    setSelectedSlot({ userId: user.id, user, date, scheduleId: schedule?.id, schedule });
    setIsFormOpen(true);
  }, []);

  const handleOpenNewForm = useCallback(() => {
    setSelectedSlot(null);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setSelectedSlot(null);
  }, []);

  const handleCabangChange = useCallback((val) => {
    setActiveCabangId(val);
    setSelectedRegu("all");
    setCollapsedReguIds(new Set()); // reset saat ganti cabang
  }, []);

  const handleToggleRegu = useCallback((reguId) => {
    setCollapsedReguIds((prev) => {
      const next = new Set(prev);
      next.has(reguId) ? next.delete(reguId) : next.add(reguId);
      return next;
    });
  }, []);

  const handleCollapseAll = useCallback(
    () => setCollapsedReguIds(new Set(reguGroups.map((g) => g.regu.id))),
    [reguGroups]
  );
  const handleExpandAll = useCallback(() => setCollapsedReguIds(new Set()), []);

  const isLoading    = isLoadingJadwal || isLoadingUsers;
  const allCollapsed = reguGroups.length > 0 && collapsedReguIds.size === reguGroups.length;

  // ─────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      {/* ══ Page Header ══ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jadwal Kerja</h1>
          <p className="text-muted-foreground">Kelola jadwal shift karyawan per bulan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthNavigator
            currentDate={currentDate}
            onPrev={handlePrevMonth}
            onNext={handleNextMonth}
            onToday={handleToday}
          />
          <Button onClick={handleOpenNewForm} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Buat Jadwal
          </Button>
        </div>
      </div>

      {/* ══ TODAY SUMMARY PANEL ══ */}
      <TodaySummaryPanel
        todaySummary={todaySummary}
        todayLabel={todayLabel}
        isLoading={isLoading}
      />

      {/* ══ Calendar Card ══ */}
      <Card className="overflow-hidden border-none shadow-md">
        <CardHeader className="bg-white pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Judul + tombol expand/collapse all */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Overview Jadwal</CardTitle>
              </div>
              {reguGroups.length > 1 && !isLoading && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-gray-700"
                  onClick={allCollapsed ? handleExpandAll : handleCollapseAll}
                >
                  {allCollapsed ? "Buka Semua" : "Tutup Semua"}
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {cabangList?.length > 1 && (
                <Select value={activeCabangId} onValueChange={handleCabangChange}>
                  <SelectTrigger className="w-full sm:w-[200px] h-9">
                    <SelectValue placeholder="Pilih Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    {cabangList.map((cabang) => (
                      <SelectItem key={cabang.id} value={cabang.id}>
                        {cabang.namaCabang}
                      </SelectItem>
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
                  {reguData?.data?.map((regu) => (
                    <SelectItem key={regu.id} value={regu.id}>
                      {regu.nama_regu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              <table className="w-full text-sm text-left border-collapse">

                {/* ── Thead ── */}
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b">
                  <tr>
                    <th className="px-4 py-4 sticky left-0 bg-gray-50 z-20 font-semibold min-w-[200px] border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                      Karyawan
                    </th>
                    {daysInMonth.map((day) => (
                      <th
                        key={day.toString()}
                        className={`px-2 py-3 text-center min-w-[50px] border-r transition-colors ${
                          isToday(day) ? "bg-blue-50 text-blue-600 font-bold" : ""
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-medium opacity-70">
                            {format(day, "EEE", { locale: localeId })}
                          </span>
                          <span className="text-base leading-tight">{format(day, "d")}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* ── Tbody: regu groups ── */}
                <tbody>
                  {isLoading || users.length === 0 ? (
                    <TablePlaceholder isLoading={isLoading} colSpan={daysInMonth.length + 1} />
                  ) : (
                    reguGroups.map((group) => (
                      <ReguGroup
                        key={group.regu.id}
                        group={group}
                        days={daysInMonth}
                        scheduleMap={scheduleMap}
                        onCellClick={handleCellClick}
                        isOpen={!collapsedReguIds.has(group.regu.id)}
                        onToggle={() => handleToggleRegu(group.regu.id)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile scroll hint */}
            <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent pointer-events-none sm:hidden" />
          </div>

          <CalendarLegend />
        </CardContent>
      </Card>

      {/* ══ Form Dialog ══ */}
      <JadwalForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        selectedSlot={selectedSlot}
        onClose={handleCloseForm}
        cabangId={effectiveCabangId}
      />
    </div>
  );
};

export default JadwalPage;