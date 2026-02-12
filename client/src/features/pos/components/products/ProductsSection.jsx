import { MdInventory, MdStar, MdAdd, MdTag, MdStore } from "react-icons/md";
import { HiOutlineBadgeCheck } from "react-icons/hi";

// Utility function to format currency
const formatCurrency = (amount) => {
  const numAmount = parseFloat(amount) || 0;
  return `Rp${numAmount.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const ProductsSection = ({
  products,
  addToCart,
  loading,
  categories,
  categoryColors,
  isFrequentProductsView = false,
}) => {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-80">
          <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium">Memuat katalog produk...</p>
        </div>
      ) : products?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 text-gray-400 text-center">
          {isFrequentProductsView ? (
            <>
              <MdStar size={48} className="mb-4 mx-auto opacity-20 text-yellow-400" />
              <p className="text-lg font-semibold text-gray-600">Belum ada favorit</p>
              <p className="text-sm mt-1 max-w-xs mx-auto">
                Produk yang sering Anda transaksikan akan muncul secara otomatis di sini.
              </p>
            </>
          ) : (
            <>
              <MdInventory size={48} className="mb-4 mx-auto opacity-20 text-indigo-400" />
              <p className="text-lg font-semibold text-gray-600">Produk tidak ditemukan</p>
              <p className="text-sm mt-1">Coba gunakan kata kunci lain atau pilih kategori</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {products.map((product) => {
            const categoryId = product.produkMaster?.kategori?.id;
            const categoryColor = categoryId
              ? categoryColors[categoryId % categoryColors.length]
              : "bg-gray-500";
            const productImage = product.produkMaster?.produkImage?.[0]?.url;

            return (
              <div
                key={product.id}
                className="group bg-white rounded-xl border border-gray-100 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer flex flex-col h-full overflow-hidden relative"
                onClick={() => addToCart(product)}
              >
                {/* Product Image / Icon */}
                <div className="h-32 bg-gray-50 flex items-center justify-center relative overflow-hidden group-hover:bg-indigo-50/30 transition-colors">
                  {productImage ? (
                    <img
                      src={productImage}
                      alt={product.produkMaster.namaProduk}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="p-4 flex items-center justify-center text-gray-300 group-hover:text-indigo-200 transition-colors">
                      <MdInventory size={40} />
                    </div>
                  )}
                  
                  {/* Stock Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1 ${
                      product.stok <= (product.minStok || 0) 
                        ? "bg-red-500/90 text-white shadow-sm" 
                        : product.stok <= 10
                        ? "bg-orange-400/90 text-white shadow-sm"
                        : "bg-white/90 text-gray-700 shadow-sm border border-gray-200"
                    }`}>
                      <MdInventory size={10} />
                      {product.stok <= (product.minStok || 0) ? "Empty" : `${product.stok} ${product.produkMaster?.satuan || "pcs"}`}
                    </span>
                  </div>

                  {/* SKU/Barcode Badge */}
                  {product.produkMaster?.sku && (
                    <div className="absolute bottom-2 left-2 transition-transform duration-300 group-hover:translate-x-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-white font-mono backdrop-blur-sm flex items-center gap-1">
                        <MdTag size={8} />
                        {product.produkMaster.sku}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-3 flex flex-col flex-1">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {product.produkMaster?.kategori && (
                      <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-black text-white bg-indigo-500`}>
                        {product.produkMaster.kategori.namaKategori}
                      </span>
                    )}
                    {product.produkMaster?.brand && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded uppercase font-black text-gray-500 bg-gray-100 border border-gray-200 flex items-center gap-0.5">
                        <MdStore size={8} />
                        {product.produkMaster.brand}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight flex-1 mb-2 group-hover:text-indigo-600 transition-colors">
                    {product.produkMaster?.namaProduk || "Unnamed Product"}
                  </h3>
                  
                  <div className="mt-auto space-y-1">
                    <div className="flex flex-col gap-0.5">
                       <div className="text-[13px] font-black text-indigo-600 flex items-center gap-1">
                        {formatCurrency(product.hargaJual)}
                        {product.produkMaster?.satuan && (
                          <span className="text-[9px] text-gray-400 font-normal">/{product.produkMaster.satuan}</span>
                        )}
                      </div>
                      
                      {product.hargaGrosir && (
                        <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded w-fit">
                          <HiOutlineBadgeCheck size={10} />
                          Grosir: {formatCurrency(product.hargaGrosir)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Hover Add Overlay */}
                <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                   <div className="bg-indigo-600 text-white p-2.5 rounded-full shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                     <MdAdd size={22} strokeWidth={2} />
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductsSection;