import React, { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Info,
  AlertTriangle,
  Search,
  Building,
  User,
  ShoppingBag,
  Package,
  Grid,
  List,
  Filter,
} from "lucide-react";
import {
  useSupplierById,
  useSupplierList,
} from "../../suppliers/hooks/useSupplierQueries";
import { useSupplierProducts } from "../../suppliers/hooks/useSupplierProducts";
import { useCreateTransaksi } from "../../transactions/hooks/useTransaksiQueries";
import { useCabang } from "../../../features/cabang/hooks/useCabang";
import Spinner from "../../../features/common/Spinner";
import { toast } from "react-hot-toast";

// Validation schema
const purchaseItemSchema = z.object({
  produkId: z.string().min(1, "Produk harus dipilih"),
  produkSupplier: z.object({
    hargaBeli: z.number().min(1, "Harga beli harus diisi"),
    id: z.string(),
    kodeProdukSupplier: z.string().optional(),
    namaProduk: z.string(),
  }),
  quantity: z.number().min(1, "Quantity minimal 1"),
  hargaSatuan: z.number().min(1, "Harga satuan harus diisi"),
  subtotal: z.number().min(0),
  diskon: z.number().min(0).optional(),
  keterangan: z.string().optional(),
});

const purchaseSchema = z.object({
  tanggal: z.string().min(1, "Tanggal harus diisi"),
  jenisTransaksi: z.literal("PEMBELIAN"),
  supplierId: z.string().min(1, "Supplier harus dipilih"),
  items: z.array(purchaseItemSchema).min(1, "Minimal 1 item"),
  metodePembayaran: z.enum(["TUNAI", "TRANSFER", "HUTANG"]),
  totalBayar: z.number().min(0),
  catatan: z.string().optional(),
});

const PurchaseCreate = () => {
  const { id: supplierId } = useParams();
  const navigate = useNavigate();
  const {
    selectedCabang,
    cabangList: branches,
    setSelectedCabang,
  } = useCabang();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  // Log the supplier ID from params to help with debugging
  useEffect(() => {
    console.log("Supplier ID from params:", supplierId);
  }, [supplierId]);

  // State untuk tampilan dan pencarian produk
  const [searchProductQuery, setSearchProductQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showProductGrid, setShowProductGrid] = useState(true);

  // Local selected branch state to avoid context navigation side effects
  const [localSelectedBranch, setLocalSelectedBranch] =
    useState(selectedCabang);

  // Update local branch when context branch changes
  useEffect(() => {
    if (selectedCabang) {
      // If selectedCabang is global and we have branches, use the first non-global branch
      if (selectedCabang.id === "global" && branches?.length > 0) {
        const firstNonGlobalBranch = branches.find(
          (branch) => branch.id !== "global"
        );
        if (firstNonGlobalBranch) {
          setLocalSelectedBranch(firstNonGlobalBranch);
        } else {
          setLocalSelectedBranch(selectedCabang);
        }
      } else {
        setLocalSelectedBranch(selectedCabang);
      }
    }
  }, [selectedCabang, branches]);

  // State to track if we're in supplier selection mode
  const [selectingSupplier, setSelectingSupplier] = useState(!supplierId);

  // Query hooks
  const {
    data: supplier,
    isLoading: isLoadingSupplier,
    error: supplierError,
  } = useSupplierById(supplierId);
  const { supplierProducts: products, isLoadingSupplierProducts } =
    useSupplierProducts({
      supplierId,
      queryParams: { limit: 100 },
      branchId:
        localSelectedBranch?.id !== "global"
          ? localSelectedBranch?.id
          : undefined,
    });

  // Fetch suppliers list for selection
  const { data: suppliersData, isLoading: isLoadingSuppliers } =
    useSupplierList({
      cabangId: selectedCabang?.id,
      search: searchTerm,
      status: "aktif",
      page: 1,
      limit: 10,
    });

  // Mutation for creating purchase
  const createTransaksiMutation = useCreateTransaksi();

  // Determine if we should preselect products
  const preselectProducts =
    new URLSearchParams(location.search).get("preselect") === "true";

  // Extract branch ID from URL if available
  useEffect(() => {
    const branchId = new URLSearchParams(location.search).get("branchId");
    if (branchId && branches?.length > 0) {
      const selectedBranch = branches.find((branch) => branch.id === branchId);
      if (selectedBranch) {
        console.log("Setting branch from URL parameter:", selectedBranch);
        setLocalSelectedBranch(selectedBranch);
      }
    }
  }, [location.search, branches]);

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      tanggal: new Date().toISOString().split("T")[0],
      jenisTransaksi: "PEMBELIAN",
      supplierId,
      items: [],
      metodePembayaran: "TUNAI",
      totalBayar: 0,
      catatan: "",
    },
  });

  // Field array for items
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Watch for changes to recalculate total
  const watchItems = watch("items");

  // Calculate totals when items change
  useEffect(() => {
    if (watchItems) {
      const totalBayar = watchItems.reduce((acc, item) => {
        const subtotal = item.quantity * item.hargaSatuan;
        const diskon = item.diskon || 0;
        return acc + (subtotal - diskon);
      }, 0);

      setValue("totalBayar", totalBayar);

      // Update subtotals for each item
      watchItems.forEach((item, index) => {
        if (item.quantity && item.hargaSatuan) {
          const subtotal = item.quantity * item.hargaSatuan;
          setValue(`items.${index}.subtotal`, subtotal);
        }
      });
    }
  }, [watchItems, setValue]);

  // Populate form with products if preselect is true
  useEffect(() => {
    if (preselectProducts && products?.length > 0 && fields.length === 0) {
      products.forEach((product) => {
        if (product.status === "aktif") {
          append({
            produkId: product.produkMasterId,
            produkSupplier: {
              id: product.id,
              hargaBeli: product.hargaBeli,
              kodeProdukSupplier: product.kodeProdukSupplier,
              namaProduk: product.produkMaster?.namaProduk || "Produk",
            },
            quantity: 1,
            hargaSatuan: product.hargaBeli,
            subtotal: product.hargaBeli,
            diskon: 0,
            keterangan: "",
          });
        }
      });
    }
  }, [products, preselectProducts, append, fields.length]);

  // Filter suppliers based on search term
  const filteredSuppliers = suppliersData?.data || suppliersData?.items || [];

  // Filter produk berdasarkan pencarian dan kategori
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    console.log("Products in filteredProducts:", products);

    return products.filter((product) => {
      // Improve search to check for partial matches in product name, SKU, and supplier codes
      const productName = product.produkMaster?.namaProduk?.toLowerCase() || "";
      const productSku = product.produkMaster?.sku?.toLowerCase() || "";
      const supplierCode = product.kodeProdukSupplier?.toLowerCase() || "";
      const searchLower = searchProductQuery.toLowerCase();

      const matchesSearch =
        !searchProductQuery ||
        productName.includes(searchLower) ||
        productSku.includes(searchLower) ||
        supplierCode.includes(searchLower);

      const matchesCategory =
        !categoryFilter ||
        product.produkMaster?.kategori?.id === categoryFilter;

      // Hanya tampilkan produk aktif
      const isActive = product.status === "aktif";

      return matchesSearch && matchesCategory && isActive;
    });
  }, [products, searchProductQuery, categoryFilter]);

  // Add debug useEffect to track product data
  useEffect(() => {
    console.log("Products array:", products);
    console.log("Filtered products:", filteredProducts);
    console.log("Current branch:", localSelectedBranch);
  }, [products, filteredProducts, localSelectedBranch]);

  // Get unique categories from products
  const productCategories = useMemo(() => {
    if (!products) return [];

    const categories = products
      .filter((p) => p.produkMaster?.kategori)
      .map((p) => p.produkMaster.kategori)
      .filter(
        (category, index, self) =>
          category && index === self.findIndex((c) => c.id === category.id)
      );

    return categories;
  }, [products]);

  // Handle supplier selection
  const handleSelectSupplier = (selectedSupplierId) => {
    navigate(`/superadmin/suppliers/${selectedSupplierId}/purchase/create`);
    setSelectingSupplier(false);
  };

  // Handle add product to form
  const handleAddProduct = (product) => {
    // Check if product already exists in form
    const existingItemIndex = watchItems.findIndex(
      (item) => item.produkId === product.produkMasterId
    );

    // Get the actual product ID from the produk array
    const actualProductId =
      product.produkMaster?.produk?.[0]?.id || product.produkMasterId;

    if (existingItemIndex >= 0) {
      // If exists, increment quantity
      const newQuantity = (watchItems[existingItemIndex].quantity || 0) + 1;
      setValue(`items.${existingItemIndex}.quantity`, newQuantity);

      // Recalculate subtotal
      const hargaSatuan = watchItems[existingItemIndex].hargaSatuan;
      setValue(
        `items.${existingItemIndex}.subtotal`,
        newQuantity * hargaSatuan
      );

      // Make sure we have the actual product ID stored
      setValue(`items.${existingItemIndex}.actualProductId`, actualProductId);

      toast.success(`Jumlah ${product.produkMaster?.namaProduk} ditambah`);
    } else {
      // Parse hargaBeli as float to ensure proper calculations
      const hargaBeli = parseFloat(product.hargaBeli);

      // If new, add to form
      append({
        produkId: product.produkMasterId,
        actualProductId,
        produkSupplier: {
          id: product.id,
          hargaBeli: hargaBeli,
          kodeProdukSupplier: product.kodeProdukSupplier,
          namaProduk: product.produkMaster?.namaProduk || "Produk",
        },
        quantity: 1,
        hargaSatuan: hargaBeli,
        subtotal: hargaBeli,
        diskon: 0,
        keterangan: "",
      });

      toast.success(
        `${product.produkMaster?.namaProduk || "Produk"} ditambahkan`
      );
    }
  };

  // Create new supplier
  const handleCreateNewSupplier = () => {
    navigate("/superadmin/suppliers/create");
  };

  // Change branch locally without triggering navigation
  const handleChangeBranch = (branchId) => {
    if (branchId) {
      const branch = branches.find((b) => b.id === branchId);
      if (branch) {
        setLocalSelectedBranch(branch);
      }
    }
  };

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      console.log("Current branch state:", localSelectedBranch);
      console.log("Form data to submit:", data);

      // Ensure we have a cabangId
      if (!localSelectedBranch?.id) {
        toast.error("Harap pilih cabang terlebih dahulu");
        return;
      }

      // Skip if global view is selected for super admin
      if (localSelectedBranch?.id === "global") {
        toast.error("Harap pilih cabang spesifik untuk pembelian");
        return;
      }

      // Additional check for supplier ID
      if (!data.supplierId) {
        console.error("No supplier ID in form data");
        toast.error(
          "Data supplier tidak tersedia, silakan pilih supplier terlebih dahulu"
        );
        return;
      }

      // Check for items
      if (!data.items || data.items.length === 0) {
        toast.error("Harap tambahkan minimal 1 item produk");
        return;
      }

      console.log("Data items:", data.items);
      console.log("Local selected branch:", localSelectedBranch);
      console.log("Supplier data:", supplier);

      // Try to get the cabangId from the first product's data
      // This should be the most accurate as it comes directly from the API
      const productCabangId =
        products?.[0]?.cabangId || products?.[0]?.cabang?.id;

      console.log("Branch IDs for comparison:");
      console.log("- Product cabangId:", productCabangId);
      console.log("- Supplier cabangId:", supplier?.cabangId);
      console.log("- Selected branch ID:", localSelectedBranch?.id);

      // Transform data to match backend validation schema (snake_case)
      const purchaseData = {
        // Use cabangId from: 1. Product data, 2. Supplier data, 3. Selected branch
        cabang_id:
          productCabangId || supplier?.cabangId || localSelectedBranch.id,
        jenis_transaksi: "PEMBELIAN",
        tanggal: data.tanggal,
        supplier_id: data.supplierId,
        pelanggan_id: null,
        shift_id: null,
        promo_id: null,
        details: data.items.map((item) => {
          // Find product ID from produk array in the selected product
          const productItem = products.find(
            (product) => product.produkMasterId === item.produkId
          );

          // Get the product ID from the first item in the produk array
          const actualProductId =
            productItem?.produkMaster?.produk?.[0]?.id || item.produkId;

          return {
            produk_id: actualProductId,
            batch_number: "", // Empty string as it's not in the form
            expired_date: null, // Null as it's not in the form
            jumlah:
              typeof item.quantity === "string"
                ? parseInt(item.quantity, 10)
                : item.quantity,
            harga_satuan:
              typeof item.hargaSatuan === "string"
                ? parseFloat(item.hargaSatuan)
                : item.hargaSatuan,
            diskon_persen: 0, // Default to 0 as the form uses direct amount
            pajak_persen: 0, // Default to 0 as it's not in the form
          };
        }),
        biaya_tambahan: 0, // Default to 0 as it's not in the form
        keterangan: data.catatan || "",
      };

      console.log("Submitting purchase data:", purchaseData);

      // Submit purchase
      const result = await createTransaksiMutation.mutateAsync(purchaseData);
      console.log("Purchase created successfully:", result);

      // Show success message
      toast.success("Pembelian berhasil dibuat");

      // Redirect back to supplier detail
      navigate(`/superadmin/suppliers/${supplierId}`);
    } catch (error) {
      console.error("Error creating purchase:", error);
      console.error("Current branch state during error:", localSelectedBranch);
      toast.error(
        `Gagal membuat pembelian: ${error.message || "Terjadi kesalahan"}`
      );
    }
  };

  // Add new item to form
  const addItem = () => {
    append({
      produkId: "",
      produkSupplier: {
        id: "",
        hargaBeli: 0,
        kodeProdukSupplier: "",
        namaProduk: "",
      },
      quantity: 1,
      hargaSatuan: 0,
      subtotal: 0,
      diskon: 0,
      keterangan: "",
    });
  };

  // Handle product selection in the form items
  const handleProductSelect = (e, index) => {
    const selectedProductId = e.target.value;

    console.log("Selected product ID:", selectedProductId);
    console.log("Products array:", products);

    const selectedProduct = products.find(
      (product) => product.produkMasterId === selectedProductId
    );

    if (selectedProduct) {
      console.log("Selected product:", selectedProduct);

      // Get the actual product ID from the produk array
      const actualProductId =
        selectedProduct.produkMaster?.produk?.[0]?.id ||
        selectedProduct.produkMasterId;

      // Parse hargaBeli as float
      const hargaBeli = parseFloat(selectedProduct.hargaBeli);

      setValue(`items.${index}.produkId`, selectedProductId);
      setValue(`items.${index}.actualProductId`, actualProductId);
      setValue(`items.${index}.produkSupplier`, {
        id: selectedProduct.id,
        hargaBeli: hargaBeli,
        kodeProdukSupplier: selectedProduct.kodeProdukSupplier,
        namaProduk: selectedProduct.produkMaster?.namaProduk || "Produk",
      });
      setValue(`items.${index}.hargaSatuan`, hargaBeli);

      // Recalculate subtotal
      const quantity = watchItems[index]?.quantity || 1;
      setValue(`items.${index}.subtotal`, quantity * hargaBeli);
    }
  };

  // Determine if page is loading
  const isLoading = isLoadingSupplier || isLoadingSupplierProducts;

  // If we're in supplier selection mode, show the supplier selection UI
  if (selectingSupplier) {
    return (
      <div className="pb-8">
        {/* Header */}
        <div className="bg-indigo-600 text-white py-6">
          <div className="mx-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-indigo-100 hover:text-white mb-4"
            >
              <ArrowLeft size={16} className="mr-1" />
              <span>Kembali</span>
            </button>
            <h1 className="text-2xl font-bold">
              Pilih Supplier untuk Pembelian
            </h1>
            <div className="flex items-center mt-2">
              <Info size={18} className="mr-2" />
              <span className="text-indigo-100">
                Pilih supplier terlebih dahulu untuk melanjutkan
              </span>
            </div>
          </div>
        </div>

        {/* Branch Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <Building size={20} className="mr-2 text-indigo-600" />
            Pilih Cabang
            {localSelectedBranch && localSelectedBranch.id !== "global" && (
              <span className="ml-2 text-sm text-gray-500">
                (Cabang terpilih: {localSelectedBranch.namaCabang})
              </span>
            )}
          </h2>

          {branches && branches.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {branches
                  .filter((branch) => branch.id !== "global")
                  .map((branch) => (
                    <div
                      key={branch.id}
                      onClick={() => handleChangeBranch(branch.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors duration-200 ${
                        localSelectedBranch?.id === branch.id
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium">{branch.namaCabang}</div>
                      <div className="text-sm text-gray-500 mt-1 truncate">
                        {branch.alamat || "Tidak ada alamat"}
                      </div>
                      {localSelectedBranch?.id === branch.id && (
                        <div className="mt-2 text-xs font-medium text-indigo-600">
                          ✓ Cabang terpilih
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Only show the update context button if the local branch is different from the context branch */}
              {localSelectedBranch &&
                localSelectedBranch.id !== selectedCabang?.id && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCabang(localSelectedBranch);
                        toast.success(
                          `Cabang berhasil diubah ke ${localSelectedBranch.namaCabang}`
                        );
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                    >
                      <Building size={14} className="mr-2" />
                      Simpan Pilihan Cabang
                    </button>
                  </div>
                )}
            </>
          ) : (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-start">
                <AlertTriangle
                  size={20}
                  className="text-amber-500 mt-0.5 mr-2 flex-shrink-0"
                />
                <div>
                  <p className="text-amber-800 font-medium">
                    Tidak ada cabang tersedia
                  </p>
                  <p className="text-amber-700 text-sm mt-1">
                    Anda tidak memiliki akses ke cabang manapun atau belum ada
                    cabang yang dibuat.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Supplier Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <User size={20} className="mr-2 text-indigo-600" />
            Pilih Supplier
          </h2>

          {/* Search */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Cari supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoadingSuppliers ? (
            <div className="flex justify-center items-center h-32">
              <Spinner size="md" />
            </div>
          ) : (
            <>
              {filteredSuppliers.length === 0 ? (
                <div className="bg-gray-50 p-8 text-center rounded-lg">
                  <AlertTriangle
                    size={40}
                    className="mx-auto text-amber-500 mb-2"
                  />
                  <h4 className="text-gray-700 font-medium">
                    Supplier tidak ditemukan
                  </h4>
                  <p className="text-gray-500 mt-1 mb-4">
                    Tidak ada supplier yang sesuai dengan pencarian atau untuk
                    cabang ini
                  </p>
                  <button
                    onClick={handleCreateNewSupplier}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Buat Supplier Baru
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      onClick={() => handleSelectSupplier(supplier.id)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-indigo-600">
                            {supplier.namaSupplier}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {supplier.alamat || "Tidak ada alamat"}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-sm font-medium">
                            {supplier.telepon || "Tidak ada nomor telepon"}
                          </div>
                          <div
                            className={`px-2 py-1 rounded-full text-xs mt-2 ${
                              supplier.status === "aktif"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {supplier.status === "aktif" ? "Aktif" : "Nonaktif"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-center mt-4">
                    <button
                      onClick={handleCreateNewSupplier}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
                    >
                      <Plus size={16} className="mr-1" />
                      Buat Supplier Baru
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="mx-6 mt-6 p-6 bg-white shadow-sm rounded-xl">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Data supplier tidak ditemukan
          </h3>
          <p className="text-gray-500 mb-6">
            Supplier dengan ID ini tidak tersedia atau tidak dapat diakses dari
            cabang saat ini
          </p>

          <div className="flex flex-col space-y-4 items-center justify-center">
            <button
              onClick={() => setSelectingSupplier(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
            >
              <Search size={16} className="mr-2" />
              Pilih Supplier Lain
            </button>

            <button
              onClick={handleCreateNewSupplier}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Buat Supplier Baru
            </button>

            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center"
            >
              <ArrowLeft size={16} className="mr-2" />
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="bg-indigo-600 text-white py-6">
        <div className="mx-6">
          <button
            onClick={() => navigate(`/superadmin/suppliers/${supplierId}`)}
            className="flex items-center text-indigo-100 hover:text-white mb-4"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span>Kembali ke Detail Supplier</span>
          </button>
          <h1 className="text-2xl font-bold">Tambah Pembelian Baru</h1>
          <div className="flex items-center mt-2">
            <Info size={18} className="mr-2" />
            <span className="text-indigo-100">
              Supplier: {supplier.namaSupplier}
              {localSelectedBranch && localSelectedBranch.id !== "global" && (
                <> • Cabang: {localSelectedBranch.namaCabang}</>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mx-6 mt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Purchase Info Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">Informasi Pembelian</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Pembelian
                </label>
                <input
                  type="date"
                  {...register("tanggal")}
                  className="w-full border border-gray-300 rounded-md py-2 px-3"
                />
                {errors.tanggal && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.tanggal.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  {...register("metodePembayaran")}
                  className="w-full border border-gray-300 rounded-md py-2 px-3"
                >
                  <option value="TUNAI">Tunai</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="HUTANG">Hutang</option>
                </select>
                {errors.metodePembayaran && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.metodePembayaran.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan
              </label>
              <textarea
                {...register("catatan")}
                rows={3}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
                placeholder="Catatan tambahan untuk pembelian ini..."
              ></textarea>
            </div>
          </div>

          {/* Product Selection Section */}
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
                  value={searchProductQuery}
                  onChange={(e) => setSearchProductQuery(e.target.value)}
                />
              </div>

              <select
                className="border border-gray-300 rounded-md py-2 px-3"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Semua Kategori</option>
                {productCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.namaKategori}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowProductGrid(!showProductGrid)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md flex items-center"
              >
                {showProductGrid ? (
                  <List size={16} className="mr-2" />
                ) : (
                  <Grid size={16} className="mr-2" />
                )}
                {showProductGrid ? "Tampilan List" : "Tampilan Grid"}
              </button>
            </div>

            {/* Loading State */}
            {isLoadingSupplierProducts ? (
              <div className="flex justify-center items-center h-32">
                <Spinner size="md" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-gray-50 p-8 text-center rounded-lg">
                <Package size={40} className="mx-auto text-gray-400 mb-2" />
                <h4 className="text-gray-500 font-medium">Tidak ada produk</h4>
                <p className="text-gray-400 mt-1">
                  Tidak ada produk yang tersedia atau sesuai dengan filter
                </p>
              </div>
            ) : showProductGrid ? (
              /* Grid View */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition duration-150"
                  >
                    <div className="font-medium text-indigo-600 truncate">
                      {product.produkMaster?.namaProduk || "Produk"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex justify-between">
                      <span>{product.produkMaster?.sku || "-"}</span>
                     
                    </div>
                    <div className="mt-2 text-sm font-medium">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(parseFloat(product.hargaBeli))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {product.produkMaster?.kategori?.namaKategori ||
                        "Tanpa Kategori"} - <span>{product.produkMaster.satuan || "-"}</span>
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
                    {filteredProducts.map((product) => (
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
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(parseFloat(product.hargaBeli))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => handleAddProduct(product)}
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

          {/* Items Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Daftar Item Pembelian</h2>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1 bg-indigo-600 text-white rounded-md flex items-center text-sm"
              >
                <Plus size={14} className="mr-1" />
                Tambah Item Manual
              </button>
            </div>

            {fields.length === 0 ? (
              <div className="bg-gray-50 p-6 text-center rounded-lg">
                <p className="text-gray-500">
                  Belum ada item. Klik "Tambah Item" untuk menambahkan produk.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Items header on larger screens */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 text-sm font-medium text-gray-500 px-4">
                  <div className="col-span-5">Produk</div>
                  <div className="col-span-2">Harga Satuan</div>
                  <div className="col-span-1">Qty</div>
                  <div className="col-span-2">Diskon</div>
                  <div className="col-span-2">Subtotal</div>
                </div>

                {/* Items */}
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                  >
                    {/* Product selection */}
                    <div className="col-span-1 md:col-span-5 space-y-1">
                      <label className="block text-sm font-medium text-gray-700 md:hidden">
                        Produk
                      </label>
                      <select
                        {...register(`items.${index}.produkId`)}
                        onChange={(e) => handleProductSelect(e, index)}
                        className="w-full border border-gray-300 rounded-md py-2 px-3"
                      >
                        <option value="">Pilih Produk</option>
                        {filteredProducts.map((product) => (
                          <option
                            key={product.id}
                            value={product.produkMasterId}
                          >
                            {product.produkMaster?.namaProduk || "Produk"} (
                            {product.produkMaster?.sku || "-"}) -{" "}
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              minimumFractionDigits: 0,
                            }).format(parseFloat(product.hargaBeli))}
                          </option>
                        ))}
                      </select>
                      {errors.items?.[index]?.produkId && (
                        <p className="text-red-500 text-xs">
                          {errors.items[index].produkId.message}
                        </p>
                      )}
                    </div>

                    {/* Price per unit */}
                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="block text-sm font-medium text-gray-700 md:hidden">
                        Harga Satuan
                      </label>
                      <Controller
                        control={control}
                        name={`items.${index}.hargaSatuan`}
                        render={({ field }) => (
                          <input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value) || 0);
                            }}
                            className="w-full border border-gray-300 rounded-md py-2 px-3"
                          />
                        )}
                      />
                      {errors.items?.[index]?.hargaSatuan && (
                        <p className="text-red-500 text-xs">
                          {errors.items[index].hargaSatuan.message}
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1 md:col-span-1 space-y-1">
                      <label className="block text-sm font-medium text-gray-700 md:hidden">
                        Quantity
                      </label>
                      <Controller
                        control={control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseInt(e.target.value) || 0);
                            }}
                            className="w-full border border-gray-300 rounded-md py-2 px-3"
                          />
                        )}
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="text-red-500 text-xs">
                          {errors.items[index].quantity.message}
                        </p>
                      )}
                    </div>

                    {/* Discount */}
                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="block text-sm font-medium text-gray-700 md:hidden">
                        Diskon
                      </label>
                      <Controller
                        control={control}
                        name={`items.${index}.diskon`}
                        render={({ field }) => (
                          <input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value) || 0);
                            }}
                            className="w-full border border-gray-300 rounded-md py-2 px-3"
                          />
                        )}
                      />
                    </div>

                    {/* Subtotal */}
                    <div className="col-span-1 md:col-span-2 space-y-1 flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 md:hidden">
                          Subtotal
                        </label>
                        <div className="text-gray-900 font-medium">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(watchItems[index]?.subtotal || 0)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="mt-6 flex justify-end">
              <div className="bg-gray-50 p-4 rounded-lg w-full md:w-1/3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Total:</span>
                  <span className="text-indigo-600 text-xl font-semibold">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(watch("totalBayar"))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate(`/superadmin/suppliers/${supplierId}`)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createTransaksiMutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              {isSubmitting || createTransaksiMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Pembelian"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseCreate;
