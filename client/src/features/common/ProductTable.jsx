import { Box, ChevronRight, MoreHorizontal } from "lucide-react";
import formatCurrency from "@common/utils/formatCurrency";

const ProductTable = ({
  isGlobalView,
  cabang,
  topProducts = [],
  title = null,
}) => {
  // Default values if no products are available
  const products = topProducts.length > 0 ? topProducts : [];

  // Debug logs
  console.log("ProductTable props received:", {
    isGlobalView,
    cabang,
    topProductsLength: topProducts?.length,
    title,
  });

  // Ensure cabang has a fallback value
  const displayCabang = cabang || "Cabang";

  return (
    <div className="mx-2 sm:mx-6 bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b gap-4 sm:gap-0">
        <h3 className="text-base font-medium">
          {title ||
            (isGlobalView
              ? "Produk Terlaris (Semua Cabang)"
              : `Produk Terlaris (${displayCabang})`)}
        </h3>
        <div className="flex items-center justify-between w-full sm:w-auto">
          <span className="text-sm text-gray-500">{products.length} item</span>
          <button className="ml-4 text-sm text-indigo-600 flex items-center hover:underline whitespace-nowrap">
            <span>Lihat Semua</span>
            <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="w-full">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Produk</th>
                  <th className="px-6 py-4 font-medium">Terjual</th>
                  <th className="px-6 py-4 font-medium">Pendapatan</th>
                  <th className="px-6 py-4 font-medium">Kategori</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.slice(0, 5).map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <Box size={18} className="text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            SKU: {product.sku || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {product.quantitySold || 0} unit
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        {product.category || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <MoreHorizontal size={18} className="text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-gray-100">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Box size={18} className="text-indigo-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        SKU: {product.sku || "N/A"}
                      </div>
                    </div>
                  </div>
                  <button className="p-1 -mr-1">
                    <MoreHorizontal size={18} className="text-gray-500" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-[10px] uppercase text-gray-500 font-medium">Terjual</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {product.quantitySold || 0} unit
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-[10px] uppercase text-gray-500 font-medium">Pendapatan</div>
                    <div className="text-sm font-semibold text-indigo-600">
                      {formatCurrency(product.revenue)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] uppercase text-gray-500 font-medium">Kategori</span>
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full italic">
                    {product.category || "General"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-gray-500">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Box size={32} className="text-gray-300" />
          </div>
          <p className="font-medium text-gray-900">Belum ada data</p>
          <p className="text-sm mt-1 text-gray-500">Silahkan pilih periode atau filter lain.</p>
        </div>
      )}
    </div>
  );
};

export default ProductTable;
