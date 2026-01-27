import { MdSearch, MdInventory, MdAdd, MdHistory, MdTag, MdStore } from "react-icons/md";
import { HiOutlineBadgeCheck } from "react-icons/hi";

// Utility function to format currency (reused)
const formatCurrency = (amount) => {
  const numAmount = parseFloat(amount) || 0;
  return `Rp${numAmount.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const SearchBar = ({
  productSearch,
  setProductSearch,
  searchHistory,
  searchResults,
  showAutocomplete,
  setShowAutocomplete,
  showSearchHistory,
  setShowSearchHistory,
  addToCart,
  isLoading,
  clearHistory,
  inputRef,
}) => {
  return (
    <div className="px-6 py-5 bg-white border-b border-gray-100 relative z-[60]">
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-t-indigo-500 rounded-full animate-spin"></div>
          ) : (
            <MdSearch size={22} />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Cari produk dengan nama, SKU, atau Barcode... [F2]"
          className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-400 transition-all text-lg font-medium"
          value={productSearch}
          onChange={(e) => {
            setProductSearch(e.target.value);
            if (e.target.value) {
              setShowAutocomplete(true);
              setShowSearchHistory(false);
            } else {
              setShowAutocomplete(false);
            }
          }}
          onFocus={() => {
            if (!productSearch) {
              setShowSearchHistory(true);
            } else if (productSearch.length > 1) {
              setShowAutocomplete(true);
            }
          }}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
           <kbd className="hidden sm:inline-block px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-gray-400 shadow-sm">
             F2
           </kbd>
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {(showSearchHistory || showAutocomplete) && (
        <div className="absolute z-50 top-full left-6 right-6 mt-2 bg-white rounded-2xl shadow-2xl shadow-indigo-900/10 border border-gray-100 max-h-[450px] overflow-hidden flex flex-col">
          {showSearchHistory && searchHistory.length > 0 && (
            <div className="p-4 border-b border-gray-50 bg-gray-50/50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Riwayat Pencarian
                </h3>
                <button
                  className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                  onClick={() => clearHistory()}
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    className="flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:border-indigo-400 hover:text-indigo-600 transition-all text-sm font-medium text-gray-700 shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductSearch(item);
                      setShowSearchHistory(false);
                      setShowAutocomplete(true);
                    }}
                  >
                    <MdHistory size={14} className="mr-1.5 text-gray-400" />
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showAutocomplete && searchResults && searchResults.length > 0 && (
            <div className="flex-1 overflow-y-auto p-2">
              <div className="px-3 py-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
                Hasil Pencarian
              </div>
              <div className="space-y-1">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    className="w-full flex items-center px-3 py-3 hover:bg-indigo-50 rounded-xl transition-all group text-left"
                    onClick={() => {
                      addToCart(product);
                      setShowAutocomplete(false);
                      setProductSearch("");
                    }}
                  >
                    <div className="w-14 h-14 rounded-xl bg-gray-50 mr-4 overflow-hidden border border-gray-100 flex-shrink-0 relative group-hover:bg-indigo-50 transition-colors">
                      {product.produkMaster?.produkImage?.[0]?.url ? (
                        <img
                          src={product.produkMaster.produkImage[0].url}
                          alt={product.produkMaster.namaProduk}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200 group-hover:text-indigo-200 transition-colors">
                          <MdInventory size={24} />
                        </div>
                      )}
                      
                      {/* SKU Badge on Image for quick identification */}
                      {product.produkMaster?.sku && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-[2px] py-0.5 px-1">
                          <p className="text-[8px] text-white font-mono text-center truncate">
                            {product.produkMaster.sku}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                        {product.produkMaster?.kategori && (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-500 text-white uppercase tracking-wider">
                            {product.produkMaster.kategori.namaKategori}
                          </span>
                        )}
                        {product.produkMaster?.brand && (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-wider flex items-center gap-0.5">
                            <MdStore size={8} />
                            {product.produkMaster.brand}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm font-bold text-gray-800 truncate group-hover:text-indigo-600 transition-colors leading-tight">
                        {product.produkMaster?.namaProduk}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-0.5">
                         <div className="flex flex-col">
                            <div className="text-[13px] font-black text-indigo-600 flex items-center gap-1">
                              {formatCurrency(product.hargaJual)}
                              {product.produkMaster?.satuan && (
                                <span className="text-[9px] text-gray-400 font-normal">/{product.produkMaster.satuan}</span>
                              )}
                            </div>
                            
                            {product.hargaGrosir && (
                              <div className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
                                <HiOutlineBadgeCheck size={9} />
                                Grosir: {formatCurrency(product.hargaGrosir)}
                              </div>
                            )}
                         </div>
                         
                         <div className="h-6 w-[1px] bg-gray-100 mx-1" />
                         
                         <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${
                           product.stok <= (product.minStok || 0)
                            ? "bg-red-50 text-red-600"
                            : "bg-gray-50 text-gray-500"
                         }`}>
                           <MdInventory size={10} className={product.stok <= (product.minStok || 0) ? "text-red-500" : "text-gray-400"} />
                           <span className="text-[10px] font-black">
                             {product.stok} {product.produkMaster?.satuan || "PCs"}
                           </span>
                         </div>
                      </div>
                    </div>
                    <div className="ml-4 flex h-full items-center">
                       <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300">
                          <MdAdd size={18} />
                       </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showAutocomplete &&
            (!searchResults || searchResults.length === 0) &&
            productSearch && (
              <div className="p-12 text-center text-gray-400 bg-gray-50/30">
                <MdSearch size={48} className="mx-auto mb-4 opacity-10 text-indigo-500" />
                <p className="font-bold text-gray-500">Produk tidak ditemukan</p>
                <p className="text-xs mt-1 text-gray-400 italic">Coba kata kunci lain atau periksa koneksi Anda</p>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;