import React from "react";
import { Package, Search, Grid, List } from "lucide-react";
import Spinner from "../../common/Spinner";

/**
 * ProductSelector - Component for selecting products with grid/list view
 * @param {Object} props
 * @param {Array} props.products - List of products
 * @param {Array} props.categories - List of product categories
 * @param {string} props.searchQuery - Search query
 * @param {string} props.categoryFilter - Selected category filter
 * @param {boolean} props.showGrid - Whether to show grid view (true) or list view (false)
 * @param {Function} props.onSearchChange - Handler for search change
 * @param {Function} props.onCategoryChange - Handler for category filter change
 * @param {Function} props.onViewToggle - Handler for view toggle
 * @param {Function} props.onProductSelect - Handler when product is selected
 * @param {boolean} props.isLoading - Loading state
 */
const ProductSelector = ({
  products,
  categories,
  searchQuery,
  categoryFilter,
  showGrid,
  onSearchChange,
  onCategoryChange,
  onViewToggle,
  onProductSelect,
  isLoading,
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-medium mb-4 flex items-center">
        <Package size={20} className="mr-2 text-indigo-600" />
        Pilih Produk
      </h2>

      {/* Search and Filter */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <select
          className="border border-gray-300 rounded-md py-2 px-3"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">Semua Kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.namaKategori}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onViewToggle}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md flex items-center hover:bg-gray-200"
        >
          {showGrid ? (
            <>
              <List size={16} className="mr-2" />
              Tampilan List
            </>
          ) : (
            <>
              <Grid size={16} className="mr-2" />
              Tampilan Grid
            </>
          )}
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Spinner size="md" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-gray-50 p-8 text-center rounded-lg">
          <Package size={40} className="mx-auto text-gray-400 mb-2" />
          <h4 className="text-gray-500 font-medium">Tidak ada produk</h4>
          <p className="text-gray-400 mt-1">
            Tidak ada produk yang tersedia atau sesuai dengan filter
          </p>
        </div>
      ) : showGrid ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => onProductSelect(product)}
              className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition duration-150"
            >
              <div className="font-medium text-indigo-600 truncate">
                {product.produkMaster?.namaProduk || "Produk"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {product.produkMaster?.sku || "-"}
              </div>
              <div className="mt-2 text-sm font-medium">
                {formatCurrency(product.hargaBeli)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {product.produkMaster?.kategori?.namaKategori ||
                  "Tanpa Kategori"}{" "}
                - <span>{product.produkMaster?.satuan || "-"}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Produk
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Kode
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Kategori
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Harga Beli
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.produkMaster?.namaProduk || "Produk"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span>SKU: {product.produkMaster?.sku || "-"}</span>
                      <span className="text-xs">
                        Supp: {product.kodeProdukSupplier || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.produkMaster?.kategori?.namaKategori || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(product.hargaBeli)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => onProductSelect(product)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Tambahkan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductSelector;
