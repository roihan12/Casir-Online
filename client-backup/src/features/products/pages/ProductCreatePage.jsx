import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import formatRupiah from "../../../utils/formatCurrency";
import { useAuth } from "../../../features/auth/hooks/useAuth.js";
import api from "../../../services/api.js"
import Pagination from "../../../features/common/Pagination.jsx";

// Form validation schema with Zod
const productFormSchema = z.object({
  marginPercentage: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => val >= 0, "Margin tidak boleh negatif")
    .refine((val) => val <= 100, "Margin tidak boleh lebih dari 100%"),
  stok: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => val >= 0, "Stok tidak boleh negatif"),
  minStok: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => val >= 0, "Stok minimum tidak boleh negatif"),
  maxStok: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => val >= 0, "Stok maksimum tidak boleh negatif"),
  status: z.string(),
});

const ProductCreate = () => {
  const { cabangId } = useParams();
  const navigate = useNavigate();
  const { getUserRole } = useAuth();
  const queryClient = useQueryClient();

  const userRole = getUserRole();

  // Add state for branches and selected branch
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(
    userRole === "super_admin" ? "" : cabangId
  );

  // State for selected products and template
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // State for individual product prices
  const [productPrices, setProductPrices] = useState({});

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      marginPercentage: "20",
      stok: "0",
      minStok: "5",
      maxStok: "50",
      status: "tersedia",
    },
  });

  // React Query hooks
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["templates", selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) {
        return [];
      }
      const response = await api.get(
        `/produk/new/templates?cabangId=${selectedBranchId}`
      );
      return response.data.data;
    },
    enabled: !!selectedBranchId,
  });

  // Add query for fetching branches for super admin
  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const response = await api.get("/cabang");
      return response.data.data;
    },
    enabled: userRole === "super_admin", // Only fetch if user is super admin
  });

  // Update branches state when data is loaded
  useEffect(() => {
    if (branchesData) {
      setBranches(branchesData);
    }
  }, [branchesData]);

  // Add handler for branch change
  const handleBranchChange = (e) => {
    const newBranchId = e.target.value;
    setSelectedBranchId(newBranchId);

    // Reset selections when branch changes
    setSelectedProducts([]);
    setProductPrices({});
    setSelectedTemplate(null);
  };

  // Update React Query hooks with pagination
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery(
    {
      queryKey: [
        "recommendations",
        selectedBranchId,
        currentPage,
        itemsPerPage,
      ],
      queryFn: async () => {
        if (!selectedBranchId) {
          return { data: [], pagination: { totalPages: 1 } };
        }

        // Note: Backend endpoint needs to be updated to support pagination
        // Make sure the API returns data in the format:
        // { data: [...products], pagination: { totalPages, currentPage, totalItems, etc. } }
        const response = await api.get(
          `/produk/recommendations/${selectedBranchId}?page=${currentPage}&limit=${itemsPerPage}`
        );

        // Update total pages from response pagination
        if (response.data.pagination && response.data.pagination.totalPages) {
          setTotalPages(response.data.pagination.totalPages);
        }

        return response.data;
      },
      enabled: !!selectedBranchId,
    }
  );

  // Handler for page changes
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const addProductsMutation = useMutation({
    mutationFn: async (data) => {
      return await api.post(`/produk/bulk/${selectedBranchId}`, data);
    },
    onSuccess: (response) => {
      toast.success(
        `Berhasil menambahkan ${response.data.data.addedProducts} produk ke cabang`
      );
      queryClient.invalidateQueries({
        queryKey: ["products", selectedBranchId],
      });
      setTimeout(() => {
        navigate(`/superadmin/products`);
      }, 2000);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Gagal menambahkan produk ke cabang"
      );
    },
  });

  // Watch form values
  const watchMarginPercentage = watch("marginPercentage");

  // Handle template selection
  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    if (!templateId) {
      setSelectedTemplate(null);
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    setSelectedTemplate(template);

    // Update form values with template defaults
    if (template) {
      setValue(
        "marginPercentage",
        template.defaultValues.marginPercentage.toString()
      );
      setValue("minStok", template.defaultValues.minStok.toString());
      setValue("maxStok", template.defaultValues.maxStok.toString());
      setValue("status", template.defaultValues.status);
    }
  };

  // Handle product selection
  const handleProductSelect = (product) => {
    // Check if product is already selected
    if (selectedProducts.some((p) => p.id === product.id)) {
      return;
    }

    // Add product with default price
    setSelectedProducts([...selectedProducts, product]);

    // Initialize price for this product
    setProductPrices((prev) => ({
      ...prev,
      [product.id]: "",
    }));
  };

  // Handle product removal
  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));

    // Remove price for this product
    setProductPrices((prev) => {
      const newPrices = { ...prev };
      delete newPrices[productId];
      return newPrices;
    });
  };

  // Handle price change for a specific product
  const handlePriceChange = (productId, price) => {
    setProductPrices((prev) => ({
      ...prev,
      [productId]: price,
    }));
  };

  // Calculate selling price based on purchase price and margin
  const calculateSellingPrice = (price) => {
    if (!price || !watchMarginPercentage) return 0;
    return (
      Number(price) + (Number(price) * Number(watchMarginPercentage)) / 100
    );
  };

  // Validate all product prices are set
  const validateProductPrices = () => {
    const missingPrices = selectedProducts.filter(
      (product) =>
        !productPrices[product.id] || Number(productPrices[product.id]) <= 0
    );

    if (missingPrices.length > 0) {
      toast.error(
        `Harga beli untuk ${missingPrices.length} produk belum diisi dengan benar`
      );
      return false;
    }

    return true;
  };

  // Form submission handler
  const onSubmit = (formData) => {
    if (selectedProducts.length === 0) {
      toast.error("Pilih minimal satu produk untuk ditambahkan");
      return;
    }

    // Validate all products have prices set
    if (!validateProductPrices()) {
      return;
    }

    // Prepare products data with individual prices
    const productsData = selectedProducts.map((product) => {
      const hargaBeli = Number(productPrices[product.id]);
      const hargaJual =
        hargaBeli + (hargaBeli * Number(formData.marginPercentage)) / 100;

      return {
        produkMasterId: product.id,
        hargaBeli,
        hargaJual,
        marginPercentage: Number(formData.marginPercentage),
        stok: Number(formData.stok),
        minStok: Number(formData.minStok),
        maxStok: Number(formData.maxStok),
        status: formData.status,
      };
    });

    // Prepare request payload with individual product data
    const payload = {
      products: productsData,
    };

    addProductsMutation.mutate(payload);
  };

  // Perbaiki isLoading khusus untuk button submit
  const isSubmitting = addProductsMutation.isPending;

  // Tetap pertahankan isLoading untuk keseluruhan halaman
  const isLoading =
    templatesLoading ||
    recommendationsLoading ||
    addProductsMutation.isPending ||
    branchesLoading;

  return (
    <div className="container px-4 mx-auto">
      {/* Breadcrumb */}
      <nav className="flex mb-5" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <a href="/" className="text-gray-700 hover:text-blue-600">
              Dashboard
            </a>
          </li>
          <li>
            <div className="flex items-center">
              <svg
                className="w-3 h-3 text-gray-400 mx-1"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 6 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 9 4-4-4-4"
                />
              </svg>
              <a
                href="/cabang"
                className="text-gray-700 hover:text-blue-600 ml-1 md:ml-2"
              >
                Cabang
              </a>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <svg
                className="w-3 h-3 text-gray-400 mx-1"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 6 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 9 4-4-4-4"
                />
              </svg>
              <a
                href={`/cabang/${selectedBranchId}/products`}
                className="text-gray-700 hover:text-blue-600 ml-1 md:ml-2"
              >
                Produk
              </a>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg
                className="w-3 h-3 text-gray-400 mx-1"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 6 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 9 4-4-4-4"
                />
              </svg>
              <span className="text-gray-500 ml-1 md:ml-2">Tambah Massal</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Tambah Produk Massal
        </h1>
        <button
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
          onClick={() => navigate(`/cabang/${selectedBranchId}/products`)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Kembali
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Add Branch Selection for Super Admin */}
        {userRole === "super_admin" && (
          <div className="lg:col-span-12">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-50 py-3 px-4 border-b border-blue-100">
                <h2 className="text-lg font-semibold text-blue-800">
                  Pilih Cabang
                </h2>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-500 mb-3">
                  Pilih cabang untuk menambahkan produk
                </p>

                <div className="mb-4">
                  <label
                    htmlFor="branch"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Cabang
                  </label>
                  <select
                    id="branch"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                    value={selectedBranchId}
                    onChange={handleBranchChange}
                    disabled={branchesLoading}
                  >
                    <option value="">-- Pilih Cabang --</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.namaCabang} - {branch.alamat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* After branch selection section, add conditional for super admin without branch selection */}
        {userRole === "super_admin" && !selectedBranchId && (
          <div className="lg:col-span-12">
            <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md border border-yellow-200">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">
                  Silahkan pilih cabang terlebih dahulu untuk melihat produk
                  rekomendasi.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Template Selection - Only show when branch selected for super admin */}
        {(userRole !== "super_admin" ||
          (userRole === "super_admin" && selectedBranchId)) && (
          <div className="lg:col-span-12">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-50 py-3 px-4 border-b border-blue-100">
                <h2 className="text-lg font-semibold text-blue-800">
                  Pilih Template
                </h2>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-500 mb-3">
                  Template akan mengisi nilai default untuk semua produk yang
                  dipilih
                </p>

                <div className="mb-4">
                  <label
                    htmlFor="template"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Template
                  </label>
                  <select
                    id="template"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                    value={selectedTemplate?.id || ""}
                    onChange={handleTemplateChange}
                    disabled={templatesLoading}
                  >
                    <option value="">-- Pilih Template --</option>
                    {templates?.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.description}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTemplate && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <h6 className="font-medium text-gray-700">
                      Nilai Default Template:
                    </h6>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      <div>
                        <p className="text-sm">
                          <span className="text-gray-500">Margin:</span>{" "}
                          <span className="font-medium">
                            {selectedTemplate.defaultValues.marginPercentage}%
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="text-gray-500">Min Stok:</span>{" "}
                          <span className="font-medium">
                            {selectedTemplate.defaultValues.minStok}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="text-gray-500">Max Stok:</span>{" "}
                          <span className="font-medium">
                            {selectedTemplate.defaultValues.maxStok}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="text-gray-500">Status:</span>{" "}
                          <span className="font-medium">
                            {selectedTemplate.defaultValues.status}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Product Selection - Only show when branch selected for super admin */}
        {(userRole !== "super_admin" ||
          (userRole === "super_admin" && selectedBranchId)) && (
          <div className="lg:col-span-7">
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
              <div className="bg-blue-50 py-3 px-4 border-b border-blue-100">
                <h2 className="text-lg font-semibold text-blue-800">
                  Rekomendasi Produk
                </h2>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-500 mb-3">
                  Produk yang populer di cabang lain dan belum ada di cabang ini
                </p>

                {recommendationsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <svg
                      className="animate-spin h-8 w-8 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                ) : recommendations?.data?.length === 0 ? (
                  <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-md">
                    Tidak ada rekomendasi produk saat ini
                  </div>
                ) : (
                  <>
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
                              Kategori
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Satuan
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
                          {recommendations?.data?.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {product.gambar && (
                                    <img
                                      src={product.gambar}
                                      alt={product.namaProduk}
                                      className="h-10 w-10 rounded-full mr-3 object-cover"
                                    />
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {product.namaProduk}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {product.sku}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {product.kategori?.namaKategori || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {product.satuan}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <button
                                  className={`px-3 py-1 text-sm rounded-full ${
                                    selectedProducts.some(
                                      (p) => p.id === product.id
                                    )
                                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                  }`}
                                  onClick={() => handleProductSelect(product)}
                                  disabled={selectedProducts.some(
                                    (p) => p.id === product.id
                                  )}
                                >
                                  {selectedProducts.some(
                                    (p) => p.id === product.id
                                  ) ? (
                                    "Terpilih"
                                  ) : (
                                    <>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 inline-block mr-1"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      Pilih
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={
                          recommendations?.pagination?.totalPages || totalPages
                        }
                        onPageChange={handlePageChange}
                        align="center"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form and Selected Products - Only show when branch selected for super admin */}
        {(userRole !== "super_admin" ||
          (userRole === "super_admin" && selectedBranchId)) && (
          <div className="lg:col-span-5">
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
              <div className="bg-blue-50 py-3 px-4 border-b border-blue-100">
                <h2 className="text-lg font-semibold text-blue-800">
                  Produk Terpilih ({selectedProducts.length})
                </h2>
              </div>
              <div className="p-4">
                {selectedProducts.length === 0 ? (
                  <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-md mb-4">
                    Belum ada produk yang dipilih
                  </div>
                ) : (
                  <div className="mb-4 max-h-96 overflow-y-auto">
                    {selectedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex flex-col p-3 mb-3 border border-gray-200 rounded-md hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            {product.gambar && (
                              <img
                                src={product.gambar}
                                alt={product.namaProduk}
                                className="h-8 w-8 rounded-full mr-2 object-cover"
                              />
                            )}
                            <span className="text-sm font-medium text-gray-700 max-w-[180px] truncate">
                              {product.namaProduk}
                            </span>
                          </div>
                          <button
                            className="text-red-500 hover:text-red-700 p-1"
                            onClick={() => handleRemoveProduct(product.id)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Harga Beli
                            </label>
                            <div className="relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-xs">
                                  Rp
                                </span>
                              </div>
                              <input
                                type="number"
                                value={productPrices[product.id] || ""}
                                onChange={(e) =>
                                  handlePriceChange(product.id, e.target.value)
                                }
                                className={`pl-9 block w-full py-1 text-sm rounded-md focus:ring focus:ring-opacity-50 
                                  ${
                                    !productPrices[product.id] ||
                                    Number(productPrices[product.id]) <= 0
                                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                  }`}
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Harga Jual
                            </label>
                            <input
                              type="text"
                              value={formatRupiah(
                                calculateSellingPrice(productPrices[product.id])
                              )}
                              disabled
                              className="block w-full py-1 text-sm rounded-md border-gray-300 bg-gray-50 text-gray-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-700 mb-4">
                    Pengaturan Umum Produk
                  </h3>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label
                        htmlFor="marginPercentage"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Margin (%)
                      </label>
                      <input
                        type="number"
                        id="marginPercentage"
                        {...register("marginPercentage")}
                        className={`block w-full rounded-md focus:ring focus:ring-opacity-50 ${
                          errors.marginPercentage
                            ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                      />
                      {errors.marginPercentage && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.marginPercentage.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label
                          htmlFor="stok"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Stok Awal
                        </label>
                        <input
                          type="number"
                          id="stok"
                          {...register("stok")}
                          className={`block w-full rounded-md focus:ring focus:ring-opacity-50 ${
                            errors.stok
                              ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                          }`}
                        />
                        {errors.stok && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.stok.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="minStok"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Min Stok
                        </label>
                        <input
                          type="number"
                          id="minStok"
                          {...register("minStok")}
                          className={`block w-full rounded-md focus:ring focus:ring-opacity-50 ${
                            errors.minStok
                              ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                          }`}
                        />
                        {errors.minStok && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.minStok.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="maxStok"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Max Stok
                        </label>
                        <input
                          type="number"
                          id="maxStok"
                          {...register("maxStok")}
                          className={`block w-full rounded-md focus:ring focus:ring-opacity-50 ${
                            errors.maxStok
                              ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                          }`}
                        />
                        {errors.maxStok && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.maxStok.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="status"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Status
                      </label>
                      <select
                        id="status"
                        {...register("status")}
                        className="block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 focus:ring focus:ring-opacity-50"
                      >
                        <option value="tersedia">Tersedia</option>
                        <option value="kosong">Kosong</option>
                        <option value="nonaktif">Nonaktif</option>
                      </select>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                        onClick={() =>
                          navigate(`/cabang/${selectedBranchId}/products`)
                        }
                        disabled={isSubmitting}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || selectedProducts.length === 0}
                        className={`px-4 py-2 bg-blue-600 text-white rounded-md flex items-center ${
                          isSubmitting || selectedProducts.length === 0
                            ? "opacity-70 cursor-not-allowed"
                            : "hover:bg-blue-700 transition-colors"
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Memproses...
                          </>
                        ) : (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Tambah Produk
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCreate;
