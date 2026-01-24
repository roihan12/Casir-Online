import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { 
  Package, 
  ArrowLeft, 
  Save, 
  X, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Info,
  Tag,
  Hash,
  Box
} from "lucide-react";
import useProdukQueries from "../hooks/useProdukQueries.js";
import Spinner from "../../common/Spinner";
import Alert from "../../common/Alert";

// Form validation schema with Zod
const productEditSchema = z.object({
  hargaBeli: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => val >= 0, "Harga beli tidak boleh negatif"),
  hargaJual: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => val >= 0, "Harga jual tidak boleh negatif"),
  hargaGrosir: z
    .string()
    .transform((val) => (val === "" ? undefined : Number(val)))
    .optional(),
  minStok: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => val >= 0, "Stok minimum tidak boleh negatif"),
  maxStok: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => val >= 0, "Stok maksimum tidak boleh negatif"),
  status: z.enum(["tersedia", "tidak_tersedia"]),
  alasanPerubahan: z.string().min(3, "Alasan perubahan minimal 3 karakter"),
});

const ProductEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { useProductById, useUpdateProduct } = useProdukQueries();

  const {
    data: productResponse,
    isLoading,
    isError,
    error,
  } = useProductById(id);

  const product = productResponse?.data;
  const updateMutation = useUpdateProduct();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      hargaBeli: "0",
      hargaJual: "0",
      hargaGrosir: "",
      minStok: "0",
      maxStok: "0",
      status: "tersedia",
      alasanPerubahan: "Update rutin data produk",
    },
  });

  // Prefill form when data is loaded
  useEffect(() => {
    if (product) {
      setValue("hargaBeli", product.hargaBeli.toString());
      setValue("hargaJual", product.hargaJual.toString());
      setValue("hargaGrosir", product.hargaGrosir ? product.hargaGrosir.toString() : "");
      setValue("minStok", product.minStok ? product.minStok.toString() : "0");
      setValue("maxStok", product.maxStok ? product.maxStok.toString() : "0");
      setValue("status", product.status);
    }
  }, [product, setValue]);

  const onSubmit = (formData) => {
    updateMutation.mutate(
      { id, data: formData },
      {
        onSuccess: () => {
          toast.success("Produk berhasil diperbarui");
          navigate(`/products/${id}`);
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || "Gagal memperbarui produk");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Alert
          type="error"
          title="Error"
          message={`Gagal memuat data produk: ${error.message}`}
        />
        <button
          onClick={() => navigate("/products")}
          className="mt-4 flex items-center gap-2 text-blue-600 font-medium"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
      </div>
    );
  }

  const productMaster = product?.produkMaster;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <nav className="flex text-xs text-gray-500 mb-1">
                <span>Produk</span>
                <span className="mx-2">/</span>
                <span>Detail</span>
                <span className="mx-2">/</span>
                <span className="text-gray-800 font-medium">Edit</span>
              </nav>
              <h1 className="text-xl font-bold text-gray-900">
                Edit Data Produk
              </h1>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center transition-colors shadow-sm disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Read-only Product Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center">
              <Info className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="font-bold text-gray-800">Detail Master Produk</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                 {productMaster?.produkImage?.[0] ? (
                   <img 
                    src={productMaster.produkImage[0].filePath} 
                    alt={productMaster.namaProduk}
                    className="w-full aspect-square object-contain bg-gray-50 rounded-lg border border-gray-100" 
                  />
                 ) : (
                   <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                     <Package className="h-10 w-10 opacity-20" />
                   </div>
                 )}
              </div>
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Nama Produk</p>
                  <p className="font-bold text-gray-900">{productMaster?.namaProduk}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">SKU</p>
                  <p className="font-mono bg-gray-100 px-2 py-0.5 rounded inline-block text-xs">{productMaster?.sku}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Barcode</p>
                  <p className="font-medium">{productMaster?.barcode || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Kategori</p>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                    {productMaster?.kategori?.namaKategori || "Uncategorized"}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-gray-500 mb-1">Keterangan</p>
                  <p className="text-gray-400 italic text-xs">Informasi master produk tidak dapat diubah di sini. Gunakan halaman Manajemen Master Produk untuk mengubah detail utama.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pricing Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100 flex items-center">
                <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-bold text-gray-800">Pengaturan Harga</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Beli (HPP)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
                    <input
                      type="number"
                      {...register("hargaBeli")}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.hargaBeli ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  </div>
                  {errors.hargaBeli && <p className="text-xs text-red-500 mt-1">{errors.hargaBeli.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual Ritel</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
                    <input
                      type="number"
                      {...register("hargaJual")}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600 transition-all ${errors.hargaJual ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  </div>
                  {errors.hargaJual && <p className="text-xs text-red-500 mt-1">{errors.hargaJual.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual Grosir (Opsional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
                    <input
                      type="number"
                      {...register("hargaGrosir")}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Management Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-amber-50/50 border-b border-amber-100 flex items-center">
                <Box className="h-5 w-5 text-amber-600 mr-2" />
                <h3 className="font-bold text-gray-800">Manajemen Stok & Status</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min. Stok (Alert)</label>
                    <input
                      type="number"
                      {...register("minStok")}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.minStok ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.minStok && <p className="text-xs text-red-500 mt-1">{errors.minStok.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maks. Stok</label>
                    <input
                      type="number"
                      {...register("maxStok")}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.maxStok ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.maxStok && <p className="text-xs text-red-500 mt-1">{errors.maxStok.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status Ketersediaan</label>
                  <select
                    {...register("status")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all bg-white"
                  >
                    <option value="tersedia">Tersedia (Aktif)</option>
                    <option value="tidak_tersedia">Tidak Tersedia (Nonaktif)</option>
                  </select>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-amber-800 text-xs flex items-start">
                  <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                  <p>Perubahan stok fisik dilakukan melalui menu **Inventory Management** atau **Purchase Order** untuk menjaga akurasi histori stok.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Audit / Reason Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center">
              <TrendingUp className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="font-bold text-gray-800">Alasan Perubahan</h3>
            </div>
            <div className="p-6">
              <textarea
                {...register("alasanPerubahan")}
                rows={3}
                placeholder="Contoh: Penyesuaian harga pasar, Update batas stok minimum..."
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none ${errors.alasanPerubahan ? 'border-red-500' : 'border-gray-300'}`}
              ></textarea>
              {errors.alasanPerubahan && <p className="text-xs text-red-500 mt-1">{errors.alasanPerubahan.message}</p>}
              <p className="text-xs text-gray-400 mt-2 italic">Sangat disarankan untuk mencatat alasan perubahan guna keperluan audit log di masa mendatang.</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEditPage;
