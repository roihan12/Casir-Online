import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, Image as ImageIcon, X, Plus, AlertCircle, Save, RotateCcw } from "lucide-react";
import Input from "../../common/Input";
import produkMasterSchema from "../validation/produkMasterValidation";

const ProductMasterForm = ({ product, categories, isSubmitting, onSubmit, onCancel }) => {
  const isEditMode = !!product;
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState(product?.produkImages || []);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(produkMasterSchema),
    defaultValues: {
      namaProduk: product?.namaProduk || "",
      sku: product?.sku || "",
      barcode: product?.barcode || "",
      deskripsi: product?.deskripsi || "",
      kategoriId: product?.kategoriId || "",
      brand: product?.brand || "",
      satuan: product?.satuan || "",
      berat: product?.berat || 0,
      dimensiP: product?.dimensiP || 0,
      dimensiL: product?.dimensiL || 0,
      dimensiT: product?.dimensiT || 0,
      isManagedStock: product?.isManagedStock || false,
      hasExpired: product?.hasExpired || false,
      status: product?.status || "aktif",
    },
  });

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      reset({
        namaProduk: product.namaProduk,
        sku: product.sku,
        barcode: product.barcode || "",
        deskripsi: product.deskripsi || "",
        kategoriId: product.kategoriId,
        brand: product.brand || "",
        satuan: product.satuan || "",
        berat: product.berat || 0,
        dimensiP: product.dimensiP || 0,
        dimensiL: product.dimensiL || 0,
        dimensiT: product.dimensiT || 0,
        isManagedStock: product.isManagedStock,
        hasExpired: product.hasExpired,
        status: product.status,
      });
      setExistingImages(product.produkImages || []);
    }
  }, [product, reset]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImages((prev) => [...prev, ...files]);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
    setImagesToDelete(prev => [...prev, imageId]);
  };

  const onFormSubmit = (data) => {
    onSubmit({
      data,
      images,
      imagesToDelete
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Package className="mr-2 h-5 w-5 text-indigo-500" />
              Informasi Dasar
            </h3>
            
            <div className="space-y-4">
              <Controller
                name="namaProduk"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Nama Produk"
                    id="namaProduk"
                    placeholder="Contoh: Aqua 600ml"
                    error={errors.namaProduk?.message}
                    {...field}
                  />
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="sku"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="SKU (Stock Keeping Unit)"
                      id="sku"
                      placeholder="Contoh: AQUA-600"
                      error={errors.sku?.message}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name="barcode"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="Barcode (Optional)"
                      id="barcode"
                      placeholder="Contoh: 899000123"
                      error={errors.barcode?.message}
                      {...field}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <Controller
                  name="kategoriId"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.kategoriId ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-indigo-400`}
                    >
                      <option value="">Pilih Kategori</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.namaKategori}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.kategoriId && (
                  <p className="mt-1 text-sm text-red-600">{errors.kategoriId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <Controller
                  name="deskripsi"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="Jelaskan detail produk..."
                    />
                  )}
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Plus className="mr-2 h-5 w-5 text-indigo-500" />
              Spesifikasi & Inventori
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="brand"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Brand"
                    id="brand"
                    placeholder="Contoh: Danone"
                    error={errors.brand?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="satuan"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Satuan"
                    id="satuan"
                    placeholder="Contoh: Pcs, Box, Pack"
                    error={errors.satuan?.message}
                    {...field}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <Controller
                name="berat"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    step="0.01"
                    label="Berat (g)"
                    id="berat"
                    error={errors.berat?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="dimensiP"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    step="0.01"
                    label="P (cm)"
                    id="dimensiP"
                    error={errors.dimensiP?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="dimensiL"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    step="0.01"
                    label="L (cm)"
                    id="dimensiL"
                    error={errors.dimensiL?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="dimensiT"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    step="0.01"
                    label="T (cm)"
                    id="dimensiT"
                    error={errors.dimensiT?.message}
                    {...field}
                  />
                )}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Controller
                  name="isManagedStock"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <input
                      type="checkbox"
                      id="isManagedStock"
                      checked={value}
                      onChange={(e) => onChange(e.target.checked)}
                      className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  )}
                />
                <label htmlFor="isManagedStock" className="text-sm font-medium text-gray-700">
                  Kelola Stok Otomatis
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Controller
                  name="hasExpired"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <input
                      type="checkbox"
                      id="hasExpired"
                      checked={value}
                      onChange={(e) => onChange(e.target.checked)}
                      className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  )}
                />
                <label htmlFor="hasExpired" className="text-sm font-medium text-gray-700">
                  Memiliki Masa Kadaluarsa
                </label>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Images & Status */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <ImageIcon className="mr-2 h-5 w-5 text-indigo-500" />
                Foto Produk
              </h3>
            </div>
            
            <div className="space-y-4">
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border">
                      <img 
                        src={`${import.meta.env.VITE_API_URL || ""}/${img.filePath}`} 
                        alt="Existing" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {img.isPrimary && (
                        <span className="absolute bottom-1 left-1 bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                          Utama
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* New Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border">
                      <img src={preview} alt="New" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Plus className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Tambah Foto</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
              <p className="text-xs text-center text-gray-400 mt-2">
                Format: JPG, PNG. Maks 2MB per foto.
              </p>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Status</h3>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <div className="flex space-x-4">
                  <label className={`flex-1 flex justify-center py-2 px-4 border rounded-lg cursor-pointer transition-all ${
                    field.value === "aktif" 
                      ? "bg-green-50 border-green-500 text-green-700" 
                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}>
                    <input 
                      type="radio" 
                      className="hidden" 
                      checked={field.value === "aktif"}
                      onChange={() => field.onChange("aktif")}
                    />
                    Aktif
                  </label>
                  <label className={`flex-1 flex justify-center py-2 px-4 border rounded-lg cursor-pointer transition-all ${
                    field.value === "nonaktif" 
                      ? "bg-red-50 border-red-500 text-red-700" 
                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}>
                    <input 
                      type="radio" 
                      className="hidden" 
                      checked={field.value === "nonaktif"}
                      onChange={() => field.onChange("nonaktif")}
                    />
                    Non-aktif
                  </label>
                </div>
              )}
            />
          </section>

          <div className="flex flex-col space-y-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-100"
            >
              {isSubmitting ? (
                <>
                  <RotateCcw className="animate-spin mr-2 h-5 w-5" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  {isEditMode ? "Simpan Perubahan" : "Tambah Produk"}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 font-medium">Beberapa input tidak valid:</p>
            <ul className="mt-1 list-disc list-inside text-xs text-red-600">
              {Object.values(errors).map((err, idx) => (
                <li key={idx}>{err.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </form>
  );
};

export default ProductMasterForm;
