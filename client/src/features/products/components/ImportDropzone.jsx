import { useRef, useState } from "react";
import { FiUploadCloud, FiFile, FiX } from "react-icons/fi";

const ACCEPTED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];
const MAX_SIZE_MB = 5;

/**
 * Shared drag & drop file uploader untuk import Excel/CSV
 * Props:
 *  - onFileSelect(file: File) => void
 *  - accept?: string (default: xlsx + csv)
 *  - label?: string
 */
const ImportDropzone = ({ onFileSelect, label = "Drop file Excel atau CSV di sini" }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Format tidak didukung. Gunakan file .xlsx atau .csv";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `Ukuran file melebihi ${MAX_SIZE_MB}MB`;
    }
    return null;
  };

  const handleFile = (file) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
      setSelectedFile(null);
      return;
    }
    setError("");
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError("");
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
            ${isDragging
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/40"
            }
          `}
        >
          <FiUploadCloud
            className={`text-4xl mb-2 transition-colors ${isDragging ? "text-indigo-500" : "text-gray-400"}`}
          />
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-xs text-gray-400 mt-1">
            Format: .xlsx, .csv &nbsp;|&nbsp; Maks. {MAX_SIZE_MB}MB &nbsp;|&nbsp; Maks. 1.000 baris
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 border border-indigo-200 bg-indigo-50 rounded-xl">
          <div className="flex-shrink-0 p-2 bg-indigo-100 rounded-lg">
            <FiFile className="text-indigo-600 text-xl" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">{formatSize(selectedFile.size)}</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <FiX className="text-base" />
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
          <span className="font-medium">Error:</span> {error}
        </p>
      )}
    </div>
  );
};

export default ImportDropzone;
