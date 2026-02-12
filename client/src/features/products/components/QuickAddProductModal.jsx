import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { 
  Search, 
  Plus, 
  X, 
  Package, 
  DollarSign, 
  Percent,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import Modal from "../../common/Modal";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCabang } from "../../cabang/hooks/useCabang";
import useProdukQueries from "../hooks/useProdukQueries";
import { useProdukMasterList } from "../hooks/useProdukMasterQueries";

// Validation schema
const quickAddSchema = z.object({
  produkMasterId: z.string().min(1, "Produk harus dipilih"),
  cabangId: z.string().min(1, "Cabang harus dipilih"),
  hargaBeli: z
    .string()
    .min(1, "Harga beli harus diisi")
    .transform((val) => Number(val))
    .refine((val) => val > 0, "Harga beli harus lebih dari 0"),
  marginPercentage: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => val >= 0, "Margin tidak boleh negatif")
    .refine((val) => val <= 100, "Margin maksimal 100%"),
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
  status: z.enum(["tersedia", "tidak_tersedia"]),
});

const QuickAddProductModal = ({ isOpen, onClose, onSuccess }) => {
  const { isSuperAdmin } = useAuth();
  const { cabangList, selectedCabang } = useCabang();
  const { useCreateProduct, useProductRecommendations } = useProdukQueries();
  
  const adminMode = isSuperAdmin();
  
  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Form setup
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      produkMasterId: "",
      cabangId: adminMode ? "" : (selectedCabang?.id || ""),
      hargaBeli: "",
      marginPercentage: "20",
      stok: "0",
      minStok: "5",
      maxStok: "50",
      status: "tersedia",
    },
  });
  
  const watchCabangId = watch("cabangId");
  const watchHargaBeli = watch("hargaBeli");
  const watchMargin = watch("marginPercentage");
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Fetch recommendations (produk master not yet in selected branch)
  const { data: recommendations, isLoading: isLoadingRecommendations } = 
    useProductRecommendations(watchCabangId, { 
      search: debouncedSearch,
      page: 1, 
      limit: 10 
    });
  
  // Create mutation
  const createMutation = useCreateProduct();
  
  // Calculate selling price
  const calculatedHargaJual = useMemo(() => {
    const hargaBeli = Number(watchHargaBeli) || 0;
    const margin = Number(watchMargin) || 0;
    return hargaBeli + (hargaBeli * margin) / 100;
  }, [watchHargaBeli, watchMargin]);
  
  // Format currency
  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };
  
  // Handle product selection
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setValue("produkMasterId", product.id);
    setSearchQuery(product.namaProduk);
    setShowDropdown(false);
  };
  
  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedProduct(null);
    setValue("produkMasterId", "");
    setSearchQuery("");
  };
  
  // Handle form submit
  const onSubmit = async (data) => {
    try {
      const payload = {
        produkMasterId: data.produkMasterId,
        cabangId: data.cabangId,
        hargaBeli: Number(data.hargaBeli),
        hargaJual: calculatedHargaJual,
        stok: Number(data.stok),
        minStok: Number(data.minStok),
        maxStok: Number(data.maxStok),
        status: data.status,
      };
      
      await createMutation.mutateAsync(payload);
      
      toast.success(`Produk "${selectedProduct?.namaProduk}" berhasil ditambahkan!`);
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error(error?.response?.data?.message || "Gagal menambahkan produk");
    }
  };
  
  // Handle close
  const handleClose = () => {
    reset();
    setSelectedProduct(null);
    setSearchQuery("");
    setShowDropdown(false);
    onClose();
  };
  
  // Set default cabangId for non-admin
  useEffect(() => {
    if (!adminMode && selectedCabang?.id) {
      setValue("cabangId", selectedCabang.id);
    }
  }, [adminMode, selectedCabang, setValue]);
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tambah Produk Cepat"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Branch Selection for Admin */}
        {adminMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cabang <span className="text-red-500">*</span>
            </label>
            <select
              {...register("cabangId")}
              className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.cabangId ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">-- Pilih Cabang --</option>
              {cabangList.filter(c => c.id !== "global").map((cabang) => (
                <option key={cabang.id} value={cabang.id}>
                  {cabang.namaCabang}
                </option>
              ))}
            </select>
            {errors.cabangId && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.cabangId.message}
              </p>
            )}
          </div>
        )}
        
        {/* Product Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cari Produk <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            {selectedProduct ? (
              <div className="flex items-center justify-between p-2.5 border border-green-300 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedProduct.namaProduk}</p>
                    <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder={watchCabangId ? "Ketik nama produk, SKU, atau barcode..." : "Pilih cabang terlebih dahulu"}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    disabled={!watchCabangId}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.produkMasterId ? "border-red-500" : "border-gray-300"
                    } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  />
                  {isLoadingRecommendations && watchCabangId && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-indigo-500 animate-spin" />
                  )}
                </div>
                
                {/* Dropdown Results */}
                {showDropdown && watchCabangId && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {isLoadingRecommendations ? (
                      <div className="p-4 text-center text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                        Mencari produk...
                      </div>
                    ) : recommendations?.data?.length > 0 ? (
                      recommendations.data.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleSelectProduct(product)}
                          className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                              {product.gambar ? (
                                <img 
                                  src={product.gambar} 
                                  alt={product.namaProduk}
                                  className="h-full w-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{product.namaProduk}</p>
                              <p className="text-sm text-gray-500">
                                SKU: {product.sku} • {product.satuan}
                                {product.kategori && ` • ${product.kategori.namaKategori}`}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        {debouncedSearch ? "Tidak ada produk ditemukan" : "Ketik untuk mencari produk"}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            <input type="hidden" {...register("produkMasterId")} />
            {errors.produkMasterId && !selectedProduct && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.produkMasterId.message}
              </p>
            )}
          </div>
        </div>
        
        {/* Price Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Harga Beli <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
              <input
                type="number"
                {...register("hargaBeli")}
                placeholder="0"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.hargaBeli ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.hargaBeli && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.hargaBeli.message}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Margin
            </label>
            <div className="relative">
              <input
                type="number"
                {...register("marginPercentage")}
                className={`w-full pr-10 pl-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.marginPercentage ? "border-red-500" : "border-gray-300"
                }`}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
            </div>
            {errors.marginPercentage && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.marginPercentage.message}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Harga Jual
            </label>
            <div className="relative">
              <input
                type="text"
                value={formatRupiah(calculatedHargaJual)}
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium"
              />
            </div>
          </div>
        </div>
        
        {/* Stock Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stok Awal
            </label>
            <input
              type="number"
              {...register("stok")}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.stok ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.stok && (
              <p className="mt-1 text-sm text-red-500">{errors.stok.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Stok
            </label>
            <input
              type="number"
              {...register("minStok")}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.minStok ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.minStok && (
              <p className="mt-1 text-sm text-red-500">{errors.minStok.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Stok
            </label>
            <input
              type="number"
              {...register("maxStok")}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.maxStok ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.maxStok && (
              <p className="mt-1 text-sm text-red-500">{errors.maxStok.message}</p>
            )}
          </div>
        </div>
        
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            {...register("status")}
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="tersedia">Tersedia</option>
            <option value="tidak_tersedia">Tidak Tersedia</option>
          </select>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={createMutation.isPending}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || !selectedProduct}
            className={`px-4 py-2.5 bg-indigo-600 text-white rounded-lg flex items-center gap-2 transition-colors ${
              createMutation.isPending || !selectedProduct
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-indigo-700"
            }`}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Tambah Produk
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default QuickAddProductModal;
