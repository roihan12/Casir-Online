import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Info, AlertTriangle, Search, Plus } from "lucide-react";
import { useSupplierById, useSupplierList } from "../../suppliers/hooks/useSupplierQueries";
import { useSupplierProducts } from "../../suppliers/hooks/useSupplierProducts";
import { useCreateTransaksi } from "../../transactions/hooks/useTransaksiQueries";
import { useCabang } from "../../cabang/hooks/useCabang";
import Spinner from "../../common/Spinner";
import { toast } from "react-hot-toast";

// Imported components
import BranchSelector from "../components/BranchSelector";
import SupplierSelector from "../components/SupplierSelector";
import ProductSelector from "../components/ProductSelector";
import PurchaseItemList from "../components/PurchaseItemList";

// Validation schemas
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
  batchNumber: z.string().optional(),
  expiredDate: z.string().optional(),
});

const purchaseSchema = z.object({
  tanggal: z.string().min(1, "Tanggal harus diisi"),
  jatuhTempo: z.string().optional(),
  jenisTransaksi: z.literal("PEMBELIAN"),
  supplierId: z.string().min(1, "Supplier harus dipilih"),
  items: z.array(purchaseItemSchema).min(1, "Minimal 1 item"),
  metodePembayaran: z.enum(["TUNAI", "TRANSFER", "HUTANG"]),
  totalBayar: z.number().min(0),
  catatan: z.string().optional(),
}).refine((data) => {
  if (data.metodePembayaran === "HUTANG" && !data.jatuhTempo) {
    return false;
  }
  return true;
}, {
  message: "Tanggal jatuh tempo harus diisi untuk pembayaran hutang",
  path: ["jatuhTempo"],
});

const PurchaseCreate = () => {
  const { id: supplierId } = useParams();
  const navigate = useNavigate();
  const { selectedCabang, setSelectedCabang, cabangList: branches } = useCabang();

  // Local state
  const [selectingSupplier, setSelectingSupplier] = useState(!supplierId);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchProductQuery, setSearchProductQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showProductGrid, setShowProductGrid] = useState(true);

  // Update selectingSupplier when supplierId changes
  useEffect(() => {
    if (supplierId) {
      setSelectingSupplier(false);
    }
  }, [supplierId]);

  // Queries
  const { data: supplierData, isLoading: isLoadingSupplierById } = useSupplierById(supplierId);
  const supplier = supplierData?.data;

  const {
    supplierProducts: products,
    isLoadingSupplierProducts,
    isLoadingSupplier,
  } = useSupplierProducts({
    supplierId,
    branchId: selectedCabang?.id !== "global" ? selectedCabang?.id : undefined,
    enabled: !!supplierId,
  });

  const createTransaksiMutation = useCreateTransaksi();

  const { data: supplierList, isLoading: isLoadingSuppliers } = useSupplierList({
    cabangId: selectedCabang?.id !== "global" ? selectedCabang?.id : undefined,
  });

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      tanggal: new Date().toISOString().split("T")[0],
      jatuhTempo: "",
      jenisTransaksi: "PEMBELIAN",
      supplierId,
      items: [],
      metodePembayaran: "TUNAI",
      totalBayar: 0,
      catatan: "",
    },
  });

  const metodePembayaran = watch("metodePembayaran");
  const tanggal = watch("tanggal");

  // Auto-set jatuhTempo to 30 days after tanggal when HUTANG is selected
  useEffect(() => {
    if (metodePembayaran === "HUTANG" && tanggal && !watch("jatuhTempo")) {
      const date = new Date(tanggal);
      date.setDate(date.getDate() + 30);
      setValue("jatuhTempo", date.toISOString().split("T")[0]);
    }
  }, [metodePembayaran, tanggal, setValue, watch]);

  // Sync supplierId when it changes (e.g., from route params)
  useEffect(() => {
    if (supplierId) {
      setValue("supplierId", supplierId);
    }
  }, [supplierId, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");

  // Calculate total whenever items change
  useEffect(() => {
    if (!watchItems) return;
    
    // Calculate total from subtotals
    const total = watchItems.reduce((acc, item) => {
      const subtotal = Number(item.subtotal) || 0;
      return acc + subtotal;
    }, 0);
    
    setValue("totalBayar", total);
  }, [watchItems, setValue]);

  // Derived state
  const filteredSuppliers = useMemo(() => {
    if (!supplierList?.data) return [];
    return supplierList.data.filter(
      (s) =>
        s.namaSupplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.kodeSupplier && s.kodeSupplier.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [supplierList?.data, searchTerm]);

  const productCategories = useMemo(() => {
    if (!products) return [];
    const categories = [];
    const seen = new Set();
    products.forEach((p) => {
      const cat = p.produkMaster?.kategori;
      if (cat && !seen.has(cat.id)) {
        seen.add(cat.id);
        categories.push(cat);
      }
    });
    return categories;
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchesSearch =
        !searchProductQuery ||
        (p.produkMaster?.namaProduk || "").toLowerCase().includes(searchProductQuery.toLowerCase()) ||
        (p.produkMaster?.sku || "").toLowerCase().includes(searchProductQuery.toLowerCase());
      const matchesCategory = categoryFilter ? p.produkMaster?.kategori?.id === categoryFilter : true;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchProductQuery, categoryFilter]);

  // Handlers
  const handleCreateNewSupplier = () => navigate("/suppliers/new");

  const handleSelectSupplier = (id) => {
    navigate(`/purchases/create/${id}?cabangId=${selectedCabang?.id}`);
    setSelectingSupplier(false);
  };

  const handleChangeBranch = (branch) => setSelectedCabang(branch);

  const handleAddProduct = (product) => {
    const currentItems = watch("items") || [];
    const exists = currentItems.some((item) => item.produkId === product.produkMasterId);

    if (exists) {
      toast.error("Produk sudah ada dalam daftar");
      return;
    }

    const hargaBeli = parseFloat(product.hargaBeli);

    append({
      produkId: product.produkMasterId,
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
      batchNumber: "",
      expiredDate: "",
    });
    toast.success("Produk ditambahkan ke daftar");
  };

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
      batchNumber: "",
      expiredDate: "",
    });
  };

  const handleProductSelect = (e, index) => {
    const selectedProductId = e.target.value;
    const selectedProduct = products.find((product) => product.produkMasterId === selectedProductId);

    if (selectedProduct) {
      const actualProductId =
        selectedProduct.produkMaster?.produk?.[0]?.id || selectedProduct.produkMasterId;
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

      const quantity = watchItems[index]?.quantity || 1;
      setValue(`items.${index}.subtotal`, quantity * hargaBeli);
      
      // Recalculate total
      recalculateTotal();
    }
  };

  // Function to recalculate total from all items
  const recalculateTotal = () => {
    const items = watch("items");
    const total = items.reduce((acc, item) => {
      const subtotal = Number(item.subtotal) || 0;
      return acc + subtotal;
    }, 0);
    setValue("totalBayar", total);
  };

  const onSubmit = async (data) => {
    try {
      console.log("=== SUBMIT STARTED ===");
      console.log("Form data:", data);
      console.log("Selected cabang:", selectedCabang);
      
      if (!selectedCabang?.id || selectedCabang?.id === "global") {
        toast.error("Harap pilih cabang spesifik untuk pembelian");
        return;
      }

      const purchaseData = {
        cabang_id: selectedCabang.id,
        jenis_transaksi: "PEMBELIAN",
        tanggal: data.tanggal,
        jatuh_tempo: data.metodePembayaran === "HUTANG" ? data.jatuhTempo : null,
        supplier_id: data.supplierId,
        pelanggan_id: null,
        shift_id: null,
        promo_id: null,
        details: data.items.map((item) => {
          console.log("Processing item:", item);
          const productItem = products.find((product) => product.produkMasterId === item.produkId);

          if (!productItem) {
            throw new Error(`Produk dengan ID ${item.produkId} tidak ditemukan`);
          }

          const produkArray = productItem?.produkMaster?.produk;
          const actualProductId =
            Array.isArray(produkArray) && produkArray.length > 0
              ? produkArray[0].id
              : productItem?.produkMaster?.id;

          if (!actualProductId) {
            throw new Error(`ID produk tidak valid untuk produk: ${productItem?.produkMaster?.namaProduk || item.produkId}`);
          }

          return {
            produk_id: actualProductId,
            produk_supplier_id: item.produkSupplier?.id || null,
            batch_number: item.batchNumber || "",
            expired_date: item.expiredDate || null,
            jumlah: typeof item.quantity === "string" ? parseInt(item.quantity, 10) : item.quantity,
            harga_satuan:
              typeof item.hargaSatuan === "string" ? parseFloat(item.hargaSatuan) : item.hargaSatuan,
            diskon_persen: 0,
          };
        }),
        metode_pembayaran: data.metodePembayaran,
        biaya_tambahan: 0,
        keterangan: data.catatan || "",
      };

      console.log("Purchase data to send:", purchaseData);
      
      await createTransaksiMutation.mutateAsync(purchaseData);
      toast.success("Pembelian berhasil dibuat");
      navigate(`/suppliers/${supplierId}`);
    } catch (error) {
      console.error("Error submitting purchase:", error);
      toast.error(`Gagal membuat pembelian: ${error.message || "Terjadi kesalahan"}`);
    }
  };

  const isLoading = isLoadingSupplier || isLoadingSupplierProducts;

  // Supplier selection mode
  if (selectingSupplier) {
    return (
      <div className="pb-8">
        <div className="bg-indigo-600 text-white py-6">
          <div className="mx-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-indigo-100 hover:text-white mb-4"
            >
              <ArrowLeft size={16} className="mr-1" />
              <span>Kembali</span>
            </button>
            <h1 className="text-2xl font-bold">Pilih Supplier untuk Pembelian</h1>
            <div className="flex items-center mt-2">
              <Info size={18} className="mr-2" />
              <span className="text-indigo-100">Pilih supplier terlebih dahulu untuk melanjutkan</span>
            </div>
          </div>
        </div>

        <div className="mx-6 mt-6 space-y-6">
          <BranchSelector
            branches={branches}
            selectedBranch={selectedCabang}
            onBranchChange={handleChangeBranch}
            globalBranch={selectedCabang}
            onSaveToContext={setSelectedCabang}
          />

          <SupplierSelector
            suppliers={filteredSuppliers}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSupplierSelect={handleSelectSupplier}
            onCreateNew={handleCreateNewSupplier}
            isLoading={isLoadingSuppliers}
          />
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Data supplier tidak ditemukan</h3>
          <p className="text-gray-500 mb-6">
            Supplier dengan ID ini tidak tersedia atau tidak dapat diakses
          </p>
          <div className="flex flex-col space-y-4 items-center">
            <button
              onClick={() => setSelectingSupplier(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Pilih Supplier Lain
            </button>
            <button onClick={() => navigate(-1)} className="px-4 py-2 text-gray-600 hover:text-gray-900">
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
            onClick={() => navigate(`/suppliers/${supplierId}`)}
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
              {selectedCabang && selectedCabang.id !== "global" && <> • Cabang: {selectedCabang.namaCabang}</>}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pembelian</label>
                <input
                  type="date"
                  {...register("tanggal")}
                  className="w-full border border-gray-300 rounded-md py-2 px-3"
                />
                {errors.tanggal && <p className="text-red-500 text-xs mt-1">{errors.tanggal.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
                <select {...register("metodePembayaran")} className="w-full border border-gray-300 rounded-md py-2 px-3">
                  <option value="TUNAI">Tunai</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="HUTANG">Hutang</option>
                </select>
                {errors.metodePembayaran && (
                  <p className="text-red-500 text-xs mt-1">{errors.metodePembayaran.message}</p>
                )}
              </div>

              {metodePembayaran === "HUTANG" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    {...register("jatuhTempo")}
                    className="w-full border border-gray-300 rounded-md py-2 px-3"
                  />
                  {errors.jatuhTempo && <p className="text-red-500 text-xs mt-1">{errors.jatuhTempo.message}</p>}
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
              <textarea
                {...register("catatan")}
                rows={3}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
                placeholder="Catatan tambahan untuk pembelian ini..."
              />
            </div>
          </div>

          {/* Product Selection */}
          <ProductSelector
            products={filteredProducts}
            categories={productCategories}
            searchQuery={searchProductQuery}
            categoryFilter={categoryFilter}
            showGrid={showProductGrid}
            onSearchChange={setSearchProductQuery}
            onCategoryChange={setCategoryFilter}
            onViewToggle={() => setShowProductGrid(!showProductGrid)}
            onProductSelect={handleAddProduct}
            isLoading={isLoadingSupplierProducts}
          />

          {/* Items List */}
          <PurchaseItemList
            fields={fields}
            control={control}
            register={register}
            setValue={setValue}
            errors={errors}
            watchItems={watchItems}
            products={filteredProducts}
            onAddItem={addItem}
            onRemoveItem={remove}
            onProductSelect={handleProductSelect}
            onRecalculateTotal={recalculateTotal}
          />

          {/* Summary & Submit */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium">Total Pembelian</span>
              <span className="text-2xl font-bold text-indigo-600">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(watch("totalBayar") || 0)}
              </span>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || fields.length === 0}
                className="flex-1 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Pembelian"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseCreate;