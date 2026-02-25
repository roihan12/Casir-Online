import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileImage, Loader2 } from "lucide-react";
import ocrService from "../../../services/ocrService";
import { toast } from "react-hot-toast";

const OcrInvoiceUploader = ({ onExtractSuccess }) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  const handleExtract = async () => {
    if (!selectedFile) return;

    try {
      setIsExtracting(true);
      const response = await ocrService.extractInvoice(selectedFile);
      
      if (response.data && response.data.status) {
        toast.success("Berhasil mengekstrak data dari invoice");
        onExtractSuccess(response.data.data);
      } else {
        throw new Error(response.data?.message || "Gagal mengekstrak data");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      toast.error(error.response?.data?.message || error.message || "Gagal menghubungi service OCR");
    } finally {
      setIsExtracting(false);
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-800">Scan & Autocreate (AI OCR)</h2>
        <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">BETA</span>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Unggah foto nota atau invoice pembelian Anda. AI akan mencoba membaca dan mengisi form secara otomatis.
      </p>

      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ease-in-out ${
            isDragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:bg-gray-50"
          } ${isDragReject ? "border-red-500 bg-red-50" : ""}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-3">
            <Upload className={`w-10 h-10 ${isDragActive ? "text-indigo-500" : "text-gray-400"}`} />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Pilih atau drag & drop file gambar kesini
              </p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG atau WEBP (Maksimal 5MB)</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <FileImage className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="truncate max-w-[200px] md:max-w-xs">
                <p className="text-sm font-medium text-gray-700 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            
            {!isExtracting && (
              <button
                type="button"
                onClick={clearFile}
                className="text-gray-400 hover:text-red-500 p-1"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          <button
            type="button"
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={handleExtract}
            disabled={isExtracting}
          >
            {isExtracting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                <span>AI sedang membaca nota...</span>
              </>
            ) : (
              "Mulai Ekstract Data"
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default OcrInvoiceUploader;
