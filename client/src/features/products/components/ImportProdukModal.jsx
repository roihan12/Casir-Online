import { useState } from "react";
import { FiDownload, FiX, FiUpload } from "react-icons/fi";
import ImportDropzone from "./ImportDropzone";
import ImportPreviewTable from "./ImportPreviewTable";
import ImportResultSummary from "./ImportResultSummary";
import {
  useDownloadProdukTemplate,
  usePreviewImportProduk,
  useImportProduk,
} from "../hooks/useImportProduk";

const STEPS = ["Upload File", "Preview Data", "Hasil Import"];

const PREVIEW_COLUMNS = [
  { key: "sku", label: "SKU" },
  { key: "namaProduk", label: "Nama Produk" },
  { key: "hargaBeli", label: "Harga Beli" },
  { key: "hargaJual", label: "Harga Jual" },
  { key: "stok", label: "Stok" },
  { key: "status", label: "Status" },
];

/**
 * Modal import Produk per Cabang — flow: Upload → Preview → Hasil
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - cabangId: string — cabang aktif (dari context atau URL param)
 *  - namaCabang?: string — untuk display
 *  - onSuccess?: () => void
 */
const ImportProdukModal = ({ isOpen, onClose, cabangId, namaCabang, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const downloadTemplate = useDownloadProdukTemplate();
  const previewMutation = usePreviewImportProduk();
  const importMutation = useImportProduk();

  const handleClose = () => {
    setStep(0);
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
    onClose();
  };

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setPreviewData(null);
  };

  const handlePreview = async () => {
    if (!file || !cabangId) return;
    try {
      const data = await previewMutation.mutateAsync({ file, cabangId });
      setPreviewData(data);
      setStep(1);
    } catch {
      // error handled by hook
    }
  };

  const handleImport = async () => {
    if (!file || !cabangId) return;
    try {
      const result = await importMutation.mutateAsync({ file, cabangId });
      setImportResult(result);
      setStep(2);
      // Call onSuccess only when user explicitly closes the summary via Selesai button
    } catch {
      // error handled by hook
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FiUpload className="text-violet-600" /> Import Produk
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload file Excel atau CSV untuk import produk ke{" "}
              <span className="font-semibold text-violet-600">
                {namaCabang || "cabang"}
              </span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`
                  flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors
                  ${i < step ? "bg-emerald-500 text-white" : i === step ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-400"}
                `}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-medium ${i === step ? "text-violet-600" : "text-gray-400"}`}>
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-8 ${i < step ? "bg-emerald-300" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step 0: Upload */}
          {step === 0 && (
            <div className="space-y-5">
              {/* Cabang badge */}
              {namaCabang && (
                <div className="flex items-center gap-2 p-2.5 bg-violet-50 border border-violet-100 rounded-lg">
                  <span className="text-xs text-violet-700">
                    <span className="font-semibold">Cabang tujuan:</span> {namaCabang}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Upload file sesuai format template. SKU harus sudah terdaftar di Produk Master.
                </p>
                <button
                  type="button"
                  onClick={() => downloadTemplate.mutate()}
                  disabled={downloadTemplate.isPending}
                  className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 border border-violet-200 px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-colors disabled:opacity-50"
                >
                  <FiDownload />
                  {downloadTemplate.isPending ? "Mengunduh..." : "Download Template"}
                </button>
              </div>

              <ImportDropzone
                onFileSelect={handleFileSelect}
                label="Drop file Excel atau CSV di sini, atau klik untuk memilih"
              />

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 space-y-1">
                <p className="font-semibold">📋 Catatan Penting:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-1">
                  <li>SKU harus sudah terdaftar di <strong>Produk Master</strong></li>
                  <li>Kolom <strong>sku</strong>, <strong>hargaBeli</strong>, dan <strong>hargaJual</strong> wajib diisi</li>
                  <li>Produk yang sudah ada di cabang ini akan <strong>dilewati (skip)</strong></li>
                  <li>Harga yang diinput akan otomatis dicatat di riwayat harga</li>
                  <li>Maksimal <strong>1.000 baris</strong> per file</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handlePreview}
                disabled={!file || !cabangId || previewMutation.isPending}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {previewMutation.isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memproses file...
                  </>
                ) : (
                  "Preview Data →"
                )}
              </button>
            </div>
          )}

          {/* Step 1: Preview */}
          {step === 1 && previewData && (
            <ImportPreviewTable
              data={previewData}
              columns={PREVIEW_COLUMNS}
              onConfirm={handleImport}
              onBack={() => setStep(0)}
              isLoading={importMutation.isPending}
            />
          )}

          {/* Step 2: Hasil */}
          {step === 2 && importResult && (
            <ImportResultSummary 
              result={importResult} 
              onClose={() => {
                const hadSuccess = importResult.berhasil > 0;
                handleClose();
                if (hadSuccess) onSuccess?.();
              }} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportProdukModal;
