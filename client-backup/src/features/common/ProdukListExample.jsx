import React, { useState } from "react";
import useProdukQueries from "../../hooks/useProdukQueries";
import { z } from "zod";

// Form validation schema
const FilterFormSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  minHarga: z
    .string()
    .transform((val) => (val ? Number(val) : undefined))
    .optional(),
  maxHarga: z
    .string()
    .transform((val) => (val ? Number(val) : undefined))
    .optional(),
  minStok: z
    .string()
    .transform((val) => (val ? Number(val) : undefined))
    .optional(),
  maxStok: z
    .string()
    .transform((val) => (val ? Number(val) : undefined))
    .optional(),
  kategoriId: z.string().optional(),
  sortBy: z.string().optional().default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

const ProdukListExample = () => {
  // Hooks for filter state
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    minHarga: "",
    maxHarga: "",
    minStok: "",
    maxStok: "",
    kategoriId: "",
    sortBy: "updatedAt",
    sortOrder: "desc",
    page: 1,
    limit: 10,
  });

  // Import hooks from useProdukQueries
  const {
    useAllProducts,
    useProductById,
    useCreateProduct,
    useUpdateProduct,
    useUpdateStock,
    useLowStockProducts,
  } = useProdukQueries();

  // Fetch products with filters
  const {
    data: productData,
    isLoading,
    isError,
    error,
  } = useAllProducts(filters);

  // Get selected product details if needed
  const [selectedProductId, setSelectedProductId] = useState(null);
  const { data: productDetails, isLoading: isLoadingDetails } =
    useProductById(selectedProductId);

  // Setup mutation hooks
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const updateStock = useUpdateStock();

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Apply filters
  const applyFilters = (e) => {
    e.preventDefault();
    try {
      // Validate filters
      const validatedFilters = FilterFormSchema.parse(filters);
      // Reset to page 1 when applying new filters
      setFilters({ ...validatedFilters, page: 1 });
    } catch (error) {
      console.error("Filter validation error:", error);
      // Handle validation errors
    }
  };

  // View product details
  const viewProductDetails = (productId) => {
    setSelectedProductId(productId);
  };

  // Example of creating a new product
  const handleCreateProduct = (productData) => {
    createProduct.mutate(productData, {
      onSuccess: (data) => {
        console.log("Product created successfully", data);
        // Reset form or show success message
      },
      onError: (error) => {
        console.error("Error creating product", error);
        // Show error message
      },
    });
  };

  // Example of updating a product
  const handleUpdateProduct = (id, data) => {
    updateProduct.mutate(
      { id, data },
      {
        onSuccess: (data) => {
          console.log("Product updated successfully", data);
          // Show success message
        },
        onError: (error) => {
          console.error("Error updating product", error);
          // Show error message
        },
      }
    );
  };

  // Example of updating stock
  const handleUpdateStock = (id, quantity, notes) => {
    updateStock.mutate(
      {
        id,
        data: {
          quantity,
          keterangan: notes,
          referenceType: "MANUAL",
        },
      },
      {
        onSuccess: (data) => {
          console.log("Stock updated successfully", data);
          // Show success message
        },
        onError: (error) => {
          console.error("Error updating stock", error);
          // Show error message
        },
      }
    );
  };

  // Render loading state
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading products...</div>;
  }

  // Render error state
  if (isError) {
    return (
      <div className="text-red-500 p-8">
        Error loading products: {error.message}
      </div>
    );
  }

  const products = productData?.data || [];
  const pagination = productData?.pagination || {
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    itemsPerPage: 10,
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Product List Example</h1>

      {/* Filter Form */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filter Products</h2>
        <form
          onSubmit={applyFilters}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              placeholder="Search products..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="tersedia">Available</option>
              <option value="tidak_tersedia">Not Available</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="kategoriId"
              value={filters.kategoriId}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="">All Categories</option>
              {/* Add category options dynamically if you have them */}
              <option value="category1">Category 1</option>
              <option value="category2">Category 2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Price
            </label>
            <input
              type="number"
              name="minHarga"
              value={filters.minHarga}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              placeholder="Min price"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Price
            </label>
            <input
              type="number"
              name="maxHarga"
              value={filters.maxHarga}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              placeholder="Max price"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Stock
            </label>
            <input
              type="number"
              name="minStok"
              value={filters.minStok}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              placeholder="Min stock"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Stock
            </label>
            <input
              type="number"
              name="maxStok"
              value={filters.maxStok}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              placeholder="Max stock"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="updatedAt">Last Updated</option>
              <option value="namaProduk">Product Name</option>
              <option value="hargaJual">Selling Price</option>
              <option value="stok">Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <select
              name="sortOrder"
              value={filters.sortOrder}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length > 0 ? (
              products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full overflow-hidden">
                        {product.produkImage &&
                        product.produkImage.length > 0 ? (
                          <img
                            src={product.produkImage[0].url}
                            alt={product.namaProduk}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.namaProduk}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {product.sku}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.kategori?.namaKategori || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(product.hargaJual)}
                    </div>
                    {product.hargaGrosir && (
                      <div className="text-xs text-gray-500">
                        Wholesale:{" "}
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(product.hargaGrosir)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.stok || 0} units
                    </div>
                    {product.minStok && (
                      <div className="text-xs text-gray-500">
                        Min: {product.minStok}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.status === "tersedia"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.status === "tersedia"
                        ? "Available"
                        : "Not Available"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => viewProductDetails(product.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      View
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateStock(
                          product.id,
                          10,
                          "Manual stock adjustment"
                        )
                      }
                      className="text-green-600 hover:text-green-900"
                    >
                      + Stock
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {products.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.hasPrevPage
                  ? "bg-white text-gray-700 hover:bg-gray-50"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.hasNextPage
                  ? "bg-white text-gray-700 hover:bg-gray-50"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.currentPage * pagination.itemsPerPage,
                    pagination.totalItems
                  )}
                </span>{" "}
                of <span className="font-medium">{pagination.totalItems}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    pagination.hasPrevPage
                      ? "text-gray-500 hover:bg-gray-50"
                      : "text-gray-300 cursor-not-allowed"
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Page numbers */}
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  const isCurrentPage = pageNumber === pagination.currentPage;

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        isCurrentPage
                          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      } text-sm font-medium`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    pagination.hasNextPage
                      ? "text-gray-500 hover:bg-gray-50"
                      : "text-gray-300 cursor-not-allowed"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal (simplified) */}
      {selectedProductId && productDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold">
                  {productDetails.namaProduk}
                </h2>
                <button
                  onClick={() => setSelectedProductId(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-700">
                    Product Details
                  </h3>
                  <ul className="mt-2 space-y-2">
                    <li>
                      <span className="text-gray-500">SKU:</span>{" "}
                      {productDetails.sku}
                    </li>
                    <li>
                      <span className="text-gray-500">Category:</span>{" "}
                      {productDetails.kategori?.namaKategori || "N/A"}
                    </li>
                    <li>
                      <span className="text-gray-500">Status:</span>{" "}
                      {productDetails.status}
                    </li>
                    <li>
                      <span className="text-gray-500">Buy Price:</span>{" "}
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(productDetails.hargaBeli)}
                    </li>
                    <li>
                      <span className="text-gray-500">Sell Price:</span>{" "}
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(productDetails.hargaJual)}
                    </li>
                    {productDetails.hargaGrosir && (
                      <li>
                        <span className="text-gray-500">Wholesale Price:</span>{" "}
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(productDetails.hargaGrosir)}
                      </li>
                    )}
                    <li>
                      <span className="text-gray-500">Stock:</span>{" "}
                      {productDetails.stok || 0} units
                    </li>
                    {productDetails.minStok && (
                      <li>
                        <span className="text-gray-500">Min Stock:</span>{" "}
                        {productDetails.minStok}
                      </li>
                    )}
                    {productDetails.maxStok && (
                      <li>
                        <span className="text-gray-500">Max Stock:</span>{" "}
                        {productDetails.maxStok}
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Product Image</h3>
                  <div className="mt-2 h-48 bg-gray-100 rounded-lg overflow-hidden">
                    {productDetails.produkImage &&
                    productDetails.produkImage.length > 0 ? (
                      <img
                        src={productDetails.produkImage[0].url}
                        alt={productDetails.namaProduk}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-16 w-16"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() =>
                    handleUpdateStock(productDetails.id, 10, "Stock adjustment")
                  }
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Add Stock
                </button>
                <button
                  onClick={() => {
                    setSelectedProductId(null);
                    // Here you could open an edit form instead
                  }}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Edit Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProdukListExample;
