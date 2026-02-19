export const SHIFT_CONFIG = {
  libur: {
    cellClass: "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 shadow-sm",
    label: "LB",
  },
  wfh: {
    cellClass: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700 shadow-sm",
    label: "WFH",
  },
  pagi: {
    cellClass: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 shadow-sm",
    label: "P",
    hourMin: 5,
    hourMax: 10,
  },
  siang: {
    cellClass: "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 shadow-sm",
    label: "S",
    hourMin: 10,
    hourMax: 18,
  },
  malam: {
    cellClass: "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 shadow-sm",
    label: "M",
  },
  reguler: {
    cellClass: "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 shadow-sm",
    label: "R",
  },
};

export const SHIFT_EMPTY = {
  label: "-",
  cellClass: "bg-gray-50/50 hover:bg-gray-100/80 border-transparent text-gray-400",
  key: null,
};


export const TODAY_CARD_CONFIG = [
  { key: "pagi",  label: "Pagi",       time: "06:00 – 14:00",  bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-400" },
  { key: "siang", label: "Siang",      time: "14:00 – 22:00",  bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-400"   },
  { key: "malam", label: "Malam",      time: "22:00 – 06:00",  bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-700",   dot: "bg-slate-400"   },
  { key: "reguler", label: "Reguler",    time: "08:00 – 17:00",  bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-700",   dot: "bg-slate-400"   },
  { key: "libur", label: "Libur/WFH",  time: "tidak masuk",    bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-700",    dot: "bg-rose-400"    },
];

export const LEGEND_ITEMS = [
  { colorClass: "bg-emerald-50 border-emerald-200", label: "Pagi (06:00 – 14:00)" },
  { colorClass: "bg-amber-50 border-amber-200",    label: "Siang (14:00 – 22:00)" },
  { colorClass: "bg-slate-100 border-slate-300",   label: "Malam (22:00 – 06:00)" },
  { colorClass: "bg-rose-50 border-rose-200",      label: "Libur" },
  { colorClass: "bg-indigo-50 border-indigo-200",  label: "WFH" },
];

export const DISPLAY_LIMIT = 4; // nama yang tampil di kartu sebelum "+N lainnya"