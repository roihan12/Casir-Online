import React, { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, XCircle, ChevronRight, X, Search, Loader2 } from "lucide-react";
import { useSaveInvoiceMapping } from "../hooks/useOcrMapping";

const StatusBadge = ({ status }) => {
  if (status === "MAPPED") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" /> Terpetakan
      </span>
    );
  }
  if (status === "SUGGESTED") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertTriangle className="w-3 h-3 mr-1" /> Saran
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
      <XCircle className="w-3 h-3 mr-1" /> Belum Terpetakan
    </span>
  );
};

const OcrMappingModal = ({
  isOpen,
  onClose,
  mappedData,
  products, // from useSupplierProducts
  onApprove,
  supplierId,
  cabangId
}) => {
  const saveMappingMutation = useSaveInvoiceMapping();
  
  // Local state to track item statuses before final approval
  const [items, setItems] = useState([]);
  const [activeMappingIndex, setActiveMappingIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (mappedData?.items) {
      setItems(JSON.parse(JSON.stringify(mappedData.items)));
    }
  }, [mappedData]);

  if (!isOpen || !mappedData) return null;

  const allMapped = items.every(item => item.status === "MAPPED");

  const filteredProducts = products.filter(p => {
    const search = searchQuery.toLowerCase();
    const nama = p.produkMaster?.namaProduk?.toLowerCase() || "";
    const sku = p.produkMaster?.sku?.toLowerCase() || "";
    return nama.includes(search) || sku.includes(search);
  });

  const handleSelectSuggestion = async (index, suggestion) => {
    const item = items[index];
    
    // Attempt saving mapping to database silently
    try {
      await saveMappingMutation.mutateAsync({
        supplierId,
        produkMasterId: suggestion.produk.id,
        namaInvoiceProduk: item.rawInvoiceName,
        hargaBeli: item.rawHargaSatuan || 0
      });
    } catch (e) {
      // It's okay, maybe already mapped by someone else simultaneously
    }

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      status: "MAPPED",
      mappedProduct: suggestion.produk
    };
    setItems(newItems);
  };

  const handleManualMap = async (index, produkSupplierData) => {
    const item = items[index];
    
    try {
      await saveMappingMutation.mutateAsync({
        supplierId,
        produkMasterId: produkSupplierData.produkMasterId,
        namaInvoiceProduk: item.rawInvoiceName,
        hargaBeli: item.rawHargaSatuan || 0
      });
    } catch (e) {}

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      status: "MAPPED",
      mappedProduct: produkSupplierData.produkMaster
    };
    setItems(newItems);
    setActiveMappingIndex(null);
    setSearchQuery("");
  };

  const handleApprove = () => {
    // Return only MAPPED and correctly processed items
    onApprove(items, mappedData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-4xl">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h3 className="text-xl leading-6 font-semibold text-gray-900 flex items-center">
                Review Ekstraksi OCR & Mapping Produk
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start text-sm">
              <div className="text-blue-700">
                <p className="font-semibold mb-1">Informasi Invoice (Terdeteksi)</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  <div><strong>Supplier:</strong> {mappedData.rawSupplierName || "Unknown"}</div>
                  <div><strong>Tanggal:</strong> {mappedData.tanggal || "Unknown"}</div>
                  <div><strong>Total:</strong> Rp {mappedData.totalBayar?.toLocaleString('id-ID') || 0}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Left Column: Items */}
              <div className={`flex-1 transition-all ${activeMappingIndex !== null ? 'md:w-1/2' : 'w-full'}`}>
                <h4 className="font-medium text-gray-900 mb-3">Daftar Item ({items.length})</h4>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                  {items.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`border rounded-lg p-3 ${
                        activeMappingIndex === idx ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50' : 
                        item.status === 'UNMAPPED' ? 'border-red-200 bg-red-50' : 
                        item.status === 'SUGGESTED' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-white'
                      } transition-all`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{item.rawInvoiceName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.rawQuantity} x Rp {item.rawHargaSatuan?.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>

                      {item.status === "MAPPED" && (
                        <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-100 flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-gray-700 font-medium">Mapped to:</span>
                          <span className="ml-2 text-gray-900">{item.mappedProduct?.namaProduk}</span>
                        </div>
                      )}

                      {item.status === "SUGGESTED" && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-600 mb-2">Apakah ini produk yang dimaksud?</p>
                          <div className="space-y-2">
                            {item.suggestions?.slice(0, 2).map((sugg, sid) => (
                              <button
                                key={sid}
                                onClick={() => handleSelectSuggestion(idx, sugg)}
                                className="w-full flex justify-between items-center p-2 bg-white border border-yellow-300 rounded hover:bg-yellow-100 transition-colors text-sm text-left"
                              >
                                <span className="font-medium text-gray-800">{sugg.produk.namaProduk}</span>
                                <span className="text-xs text-gray-500 flex items-center">
                                  {sugg.score}% Match <ChevronRight className="w-4 h-4 ml-1" />
                                </span>
                              </button>
                            ))}
                          </div>
                          <div className="mt-2 text-right">
                            <button
                              type="button"
                              onClick={() => setActiveMappingIndex(idx)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                            >
                              Tidak, cari manual
                            </button>
                          </div>
                        </div>
                      )}

                      {item.status === "UNMAPPED" && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => setActiveMappingIndex(idx)}
                            className="w-full flex justify-center items-center p-2 bg-white border border-red-300 shadow-sm text-sm font-medium rounded text-red-700 hover:bg-red-50 transition-colors"
                          >
                            <Search className="w-4 h-4 mr-2" />
                            Pilih Produk Internal...
                          </button>
                        </div>
                      )}

                      {item.status === "MAPPED" && (
                        <div className="mt-2 text-right">
                          <button
                            type="button"
                            onClick={() => setActiveMappingIndex(idx)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Ubah Mapping
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Search product (Only visible when activeMappingIndex is set) */}
              {activeMappingIndex !== null && (
                <div className="flex-1 border-l pl-6 animate-in slide-in-from-right-8 duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Map Manual</h4>
                    <button 
                      onClick={() => setActiveMappingIndex(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      Batal
                    </button>
                  </div>
                  
                  <div className="mb-4 bg-gray-50 p-3 rounded-md border border-gray-200">
                    <p className="text-xs text-gray-500">Mencari produk untuk invoice item:</p>
                    <p className="font-semibold text-gray-900">{items[activeMappingIndex].rawInvoiceName}</p>
                  </div>

                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ketik Nama Produk / SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">Produk tidak ditemukan</p>
                    ) : (
                      filteredProducts.map(p => (
                        <button
                          key={p.id}
                          onClick={() => handleManualMap(activeMappingIndex, p)}
                          className="w-full text-left p-3 border rounded-md hover:bg-indigo-50 hover:border-indigo-300 transition-colors group"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-gray-900 text-sm">{p.produkMaster?.namaProduk}</span>
                            <span className="text-xs text-gray-500 group-hover:text-indigo-600 bg-gray-100 group-hover:bg-indigo-100 px-2 pl-1 rounded">
                              Pilih
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">SKU: {p.produkMaster?.sku}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t">
            <button
              type="button"
              disabled={!allMapped || items.length === 0}
              onClick={handleApprove}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Lanjutkan ({items.filter(i => i.status === 'MAPPED').length}/{items.length})
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Batalkan OCR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OcrMappingModal;
