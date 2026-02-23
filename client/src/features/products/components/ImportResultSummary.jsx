import { FiCheckCircle, FiAlertCircle, FiSkipForward, FiDownload } from "react-icons/fi";

/**
 * Komponen summary hasil import (setelah proses selesai)
 * Props:
 *  - result: { total, berhasil, dilewati, gagal, errors, skipped }
 *  - onClose: () => void
 */
const ImportResultSummary = ({ result, onClose }) => {
  if (!result) return null;

  const { total, berhasil, dilewati, gagal, errors = [], skipped = [] } = result;

  const downloadErrorReport = () => {
    if (!errors.length) return;
    const csvContent =
      "Baris,Pesan Error\n" +
      errors.map((e) => `${e.row},"${(e.message || "").replace(/"/g, '""')}"`).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `error_report_import_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = [
    {
      label: "Total Baris",
      value: total,
      color: "text-gray-700",
      bg: "bg-gray-100",
      icon: null,
    },
    {
      label: "Berhasil",
      value: berhasil,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      icon: <FiCheckCircle className="text-emerald-500" />,
    },
    {
      label: "Dilewati",
      value: dilewati,
      color: "text-amber-700",
      bg: "bg-amber-50",
      icon: <FiSkipForward className="text-amber-500" />,
    },
    {
      label: "Gagal",
      value: gagal,
      color: "text-red-700",
      bg: "bg-red-50",
      icon: <FiAlertCircle className="text-red-500" />,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl p-4 ${s.bg} flex flex-col items-center gap-1`}
          >
            {s.icon && <span className="text-lg">{s.icon}</span>}
            <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
            <span className="text-xs text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Status message */}
      {gagal === 0 && berhasil > 0 && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <FiCheckCircle className="text-emerald-500 text-lg flex-shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">
            Import berhasil! {berhasil} data telah tersimpan.
          </p>
        </div>
      )}

      {/* Error list */}
      {errors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-red-600 flex items-center gap-1">
              <FiAlertCircle /> Detail Error ({errors.length} baris)
            </h4>
            <button
              onClick={downloadErrorReport}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <FiDownload /> Download Error Report
            </button>
          </div>
          <div className="max-h-44 overflow-y-auto rounded-lg border border-red-100 divide-y divide-red-50">
            {errors.slice(0, 50).map((e, idx) => (
              <div key={idx} className="px-3 py-2 bg-red-50 text-xs text-red-700">
                <span className="font-semibold">Baris {e.row}:</span>{" "}
                {e.message || JSON.stringify(e)}
              </div>
            ))}
            {errors.length > 50 && (
              <div className="px-3 py-2 text-xs text-gray-500 text-center">
                ... dan {errors.length - 50} error lainnya. Download report untuk detail lengkap.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Skipped list */}
      {skipped.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-amber-600 flex items-center gap-1 mb-2">
            <FiSkipForward /> Dilewati ({skipped.length} baris)
          </h4>
          <div className="max-h-32 overflow-y-auto rounded-lg border border-amber-100 divide-y divide-amber-50">
            {skipped.slice(0, 20).map((s, idx) => (
              <div key={idx} className="px-3 py-2 bg-amber-50 text-xs text-amber-700">
                <span className="font-semibold">Baris {s.row}</span>
                {s.sku && ` — SKU: ${s.sku}`}: {s.reason}
              </div>
            ))}
            {skipped.length > 20 && (
              <div className="px-3 py-2 text-xs text-gray-500 text-center">
                ... dan {skipped.length - 20} baris lainnya
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        Selesai
      </button>
    </div>
  );
};

export default ImportResultSummary;
