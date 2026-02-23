import { FiCheckCircle, FiAlertCircle, FiSkipForward, FiArrowRight } from "react-icons/fi";

const ACTION_CONFIG = {
  insert: { label: "Tambah", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  skip: { label: "Lewati", color: "text-amber-700 bg-amber-50 border-amber-200" },
  error: { label: "Error", color: "text-red-700 bg-red-50 border-red-200" },
};

/**
 * Tabel preview data import sebelum dikonfirmasi
 * Props:
 *  - data: { summary, rows, cabang? }
 *  - columns: Array<{ key: string, label: string }>
 *  - onConfirm: () => void
 *  - onBack: () => void
 *  - isLoading: boolean
 */
const ImportPreviewTable = ({
  data,
  columns,
  onConfirm,
  onBack,
  isLoading = false,
}) => {
  if (!data) return null;

  const { summary, rows = [] } = data;

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          Total: {summary.total}
        </span>
        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1">
          <FiCheckCircle /> Akan ditambah: {summary.willInsert}
        </span>
        {summary.willSkip > 0 && (
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 flex items-center gap-1">
            <FiSkipForward /> Dilewati: {summary.willSkip}
          </span>
        )}
        {summary.invalid > 0 && (
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 flex items-center gap-1">
            <FiAlertCircle /> Error: {summary.invalid}
          </span>
        )}
      </div>

      {/* Cabang info */}
      {data.cabang && (
        <div className="px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700">
          <span className="font-semibold">Cabang tujuan:</span> {data.cabang.namaCabang}
        </div>
      )}

      {/* Error warning */}
      {summary.invalid > 0 && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <FiAlertCircle className="text-red-500 text-base flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            <span className="font-semibold">{summary.invalid} baris memiliki error</span> dan tidak akan diimport.
            Silakan perbaiki file dan coba lagi, atau lanjutkan untuk mengimport baris yang valid saja.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto max-h-72 rounded-xl border border-gray-200">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600 sticky top-0 bg-gray-50">#</th>
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-2.5 text-left font-semibold text-gray-600 sticky top-0 bg-gray-50 whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600 sticky top-0 bg-gray-50">Status</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600 sticky top-0 bg-gray-50">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => {
              const cfg = ACTION_CONFIG[row.action] || ACTION_CONFIG.insert;
              const hasError = !row.valid;
              const isSkip = row.action === "skip";

              return (
                <tr
                  key={row.rowNumber}
                  className={`transition-colors ${
                    hasError
                      ? "bg-red-50/60 hover:bg-red-50"
                      : isSkip
                      ? "bg-amber-50/40 hover:bg-amber-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-3 py-2 text-gray-500 font-mono">{row.rowNumber}</td>
                  {columns.map((col) => (
                    <td key={col.key} className={`px-3 py-2 ${hasError ? "text-red-700" : "text-gray-700"}`}>
                      {row[col.key] ?? "-"}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-500 max-w-xs">
                    {hasError && row.errors?.length > 0 ? (
                      <span className="text-red-600 text-xs">{row.errors[0]}</span>
                    ) : row.actionNote ? (
                      <span className="text-amber-600 text-xs">{row.actionNote}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Kembali
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading || summary.willInsert === 0}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Mengimport...
            </>
          ) : (
            <>
              Import {summary.willInsert} Data
              <FiArrowRight />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ImportPreviewTable;
