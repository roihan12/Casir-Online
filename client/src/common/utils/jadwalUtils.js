import { SHIFT_CONFIG } from "../../app/constants/jadwalConfig";

export function resolveShift(schedule) {

  if (!schedule) return { label: "-", cellClass: "bg-gray-50/50 hover:bg-gray-100/80 border-transparent text-gray-400" };

  const { tipe_jadwal, jamMasuk } = schedule;

  console.log("tipe_jadwal", tipe_jadwal);
  console.log("jamMasuk", jamMasuk);

  if (tipe_jadwal === "libur") return SHIFT_CONFIG.libur;
  if (tipe_jadwal === "wfh")   return SHIFT_CONFIG.wfh;
  if (tipe_jadwal === "reguler") return SHIFT_CONFIG.reguler;

  const startHour = jamMasuk ? parseInt(jamMasuk.split(":")[0], 10) : 0;

  if (startHour >= SHIFT_CONFIG.pagi.hourMin && startHour < SHIFT_CONFIG.pagi.hourMax)
    return SHIFT_CONFIG.pagi;
  if (startHour >= SHIFT_CONFIG.siang.hourMin && startHour < SHIFT_CONFIG.siang.hourMax)
    return SHIFT_CONFIG.siang;

  return SHIFT_CONFIG.malam;
}



export function computeTodaySummary(users, scheduleMap, todayStr) {

  console.log("users 1", users);
  console.log("scheduleMap 1", scheduleMap);
  console.log("todayStr 1", todayStr);

  const summary = { pagi: [], siang: [], malam: [], libur: [], reguler: [] };
  for (const user of users) {
    console.log("user", user.id);
    const schedule = scheduleMap[user?.id]?.[todayStr] ?? null;

    console.log("schedule2", schedule);
  
    const key  = resolveShift(schedule);

    console.log("schedule", schedule);
    console.log("key", key);

    if (key.label === "P")                        summary.pagi.push(user);
    else if (key.label === "S")                  summary.siang.push(user);
    else if (key.label === "M")                  summary.malam.push(user);
    else if (key.label === "LB" || key.label === "WFH") summary.libur.push(user);
    else if (key.label === "R")                summary.reguler.push(user);

    // key === null → belum ada jadwal hari ini, tidak muncul di kartu
  }
  return summary;
}

/** Menghitung { pagi, siang, malam, libur } count untuk sekelompok user */
export function computeGroupTodayStats(users, scheduleMap, todayStr) {
  const stats = { pagi: 0, siang: 0, malam: 0, libur: 0 };
  for (const user of users) {
    const key = resolveShift(scheduleMap[user.id]?.[todayStr] ?? null);
    if (key.label === "P")                        stats.pagi++;
    else if (key.label === "S")                  stats.siang++;
    else if (key.label === "M")                  stats.malam++;
    else if (key.label === "LB" || key.label === "WFH") stats.libur++;
  }
  return stats;
}

/**
 * Mengelompokkan users berdasarkan reguId.
 * Return: [{ regu, users, todayStats }]
 *
 * ⚠️  Sesuaikan nama field reguId dengan struktur API:
 *     user.reguId | user.regu_id | user.regu?.id
 */
export function groupUsersByRegu(users, reguList, scheduleMap, todayStr) {
  const userReguMap = {};
  const reguMap     = Object.fromEntries((reguList ?? []).map((r) => [r.id, r]));
  const groupMap    = {};
  const ungrouped   = [];

  // Step 1: bangun userId → reguId dari regu_member
  for (const regu of reguList ?? []) {
    for (const member of regu.regu_member ?? []) {
      const uid = member.user?.id;
      if (uid) userReguMap[uid] = regu.id;
    }
  }

  // Step 2: kelompokkan users ke groupMap menggunakan userReguMap
  // ← INI YANG HILANG di kode kamu
  for (const user of users) {
    const reguId = userReguMap[user.id] ?? null;
    if (!reguId) { ungrouped.push(user); continue; }
    if (!groupMap[reguId]) groupMap[reguId] = [];
    groupMap[reguId].push(user);
  }

  const groups = Object.entries(groupMap).map(([reguId, reguUsers]) => ({
    regu: reguMap[reguId] ?? { id: reguId, nama_regu: `Regu ${reguId}` },
    users: reguUsers,
    todayStats: computeGroupTodayStats(reguUsers, scheduleMap, todayStr),
  }));

  groups.sort((a, b) => a.regu.nama_regu.localeCompare(b.regu.nama_regu));

  if (ungrouped.length > 0) {
    groups.push({
      regu: { id: "__ungrouped__", nama_regu: "Tanpa Regu" },
      users: ungrouped,
      todayStats: computeGroupTodayStats(ungrouped, scheduleMap, todayStr),
    });
  }

  return groups;
}