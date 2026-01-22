import { Box, ChevronRight, MoreHorizontal } from "lucide-react";
import formatCurrency from "../../utils/formatCurrency";

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
    <div className="mx-6 bg-white rounded-xl shadow-sm mb-6">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-base font-medium">
          {title ||
            (isGlobalView
              ? "Produk Terlaris (Semua Cabang)"
              : `Produk Terlaris (${displayCabang})`)}
        </h3>
        <div className="flex items-center">
          <span className="text-sm text-gray-500">{products.length} item</span>
          <button className="ml-4 text-sm text-indigo-600 flex items-center">
            <span>Lihat Semua</span>
            <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      </div>

      {products.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-500 text-sm border-b">
              <th className="px-4 py-3 font-medium">PRODUK</th>
              <th className="px-4 py-3 font-medium">TERJUAL</th>
              <th className="px-4 py-3 font-medium">PENDAPATAN</th>
              <th className="px-4 py-3 font-medium">KATEGORI</th>
              <th className="px-4 py-3 font-medium">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {products.slice(0, 5).map((product) => (
              <tr key={product.id} className="border-b">
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Box size={18} className="text-indigo-600" />
                    </div>
                    <div className="ml-3">
                      <span className="text-sm font-medium">
                        {product.name}
                      </span>
                      <div className="text-xs text-gray-500">
                        SKU: {product.sku || "N/A"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {product.quantitySold || 0} unit
                </td>
                <td className="px-4 py-3 text-sm">
                  {formatCurrency(product.revenue)}
                </td>
                <td className="px-4 py-3 text-sm">
                  {product.category || "Uncategorized"}
                </td>
                <td className="px-4 py-3">
                  <button>
                    <MoreHorizontal size={18} className="text-gray-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="p-8 text-center text-gray-500">
          <Box size={40} className="mx-auto mb-4 text-gray-300" />
          <p>Belum ada data produk tersedia.</p>
        </div>
      )}
    </div>
  );
};

export default ProductTable;
