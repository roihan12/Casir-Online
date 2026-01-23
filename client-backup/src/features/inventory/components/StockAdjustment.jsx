import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stockAdjustmentFormSchema } from "../../../schemas/inventorySchemas";
import { useInventoryAdjustment } from "@common/hooks/useInventoryAdjustment";
import { useCabangList } from "../../../features/cabang/hooks/useCabangQueries";
import {
  Database,
  Edit3,
  Plus,
  Minus,
  Info,
  Calendar,
  CheckCircle,
  X,
  ArrowLeftRight,
  BarChart2,
} from "lucide-react";
import Spinner from "../../common/Spinner";
import { toast } from "react-hot-toast";

const StockAdjustment = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Get branch data
  const { data: cabangListData, isLoading: isCabangLoading } = useCabangList();
  const [branches, setBranches] = useState([]);

  // Set up form with zod validation
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(stockAdjustmentFormSchema),
    defaultValues: {
      cabangId: "",
      produkId: "",
      currentStock: 0,
      adjustmentType: "add",
      quantity: 1,
      reason: "correction",
      notes: "",
      batchNumber: "",
      expiryDate: "",
    },
  });

  // Get adjustment mutation
  const { createAdjustment } = useInventoryAdjustment();

  // Update branches when cabangListData is loaded
  useEffect(() => {
    if (cabangListData?.data) {
      const branchesData = cabangListData.data.map((cabang) => ({
        id: cabang.id || cabang.cabang_id,
        namaCabang: cabang.namaCabang || cabang.nama_cabang,
      }));
      setBranches(branchesData);
    }
  }, [cabangListData]);

  // Watch for cabangId changes to load products
  const selectedCabangId = watch("cabangId");
  const adjustmentType = watch("adjustmentType");

  useEffect(() => {
    const loadProducts = async () => {
      if (!selectedCabangId) return;

      setIsProductLoading(true);
      try {
        // In a real app, you'd call an API to get products for the selected branch
        // For now, we'll use mock data
        setTimeout(() => {
          const mockProducts = [
            {
              id: "1",
              name: "Laptop ASUS TUF Gaming A15",
              sku: "LP-ASUS-TUF-001",
              stock: 15,
            },
            {
              id: "2",
              name: "Smartphone Samsung Galaxy S21",
              sku: "SP-SAMS-S21-001",
              stock: 3,
            },
            {
              id: "3",
              name: "Susu Ultra Milk 1L",
              sku: "GR-ULTM-1L-001",
              stock: 0,
            },
            {
              id: "4",
              name: "Biskuit Oreo Original 137g",
              sku: "GR-OREO-137-001",
              stock: 25,
            },
            {
              id: "5",
              name: "Minyak Goreng Bimoli 2L",
              sku: "GR-BIML-2L-001",
              stock: 8,
            },
          ];
          setProducts(mockProducts);
          setIsProductLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error loading products:", error);
        toast.error("Gagal memuat data produk");
        setIsProductLoading(false);
      }
    };

    loadProducts();
  }, [selectedCabangId]);

  // Handle product selection
  const handleProductChange = (e) => {
    const productId = e.target.value;
    setValue("produkId", productId);

    if (productId) {
      const product = products.find((p) => p.id === productId);
      setSelectedProduct(product);
      setValue("currentStock", product.stock);
    } else {
      setSelectedProduct(null);
      setValue("currentStock", 0);
    }
  };

  // Handle form submission
  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      // Calculate final stock based on adjustment type
      let finalStock = data.currentStock;

      switch (data.adjustmentType) {
        case "add":
          finalStock += data.quantity;
          break;
        case "subtract":
          finalStock -= data.quantity;
          if (finalStock < 0) {
            toast.error("Stok tidak dapat kurang dari 0");
            setIsSubmitting(false);
            return;
          }
          break;
        case "set":
          finalStock = data.quantity;
          break;
        default:
          break;
      }

      // Prepare adjustment data
      const adjustmentData = {
        cabangId: data.cabangId,
        produkId: data.produkId,
        adjustmentType: data.adjustmentType,
        quantity: data.quantity,
        finalStock,
        reason: data.reason,
        notes: data.notes,
        batchNumber: data.batchNumber || null,
        expiryDate: data.expiryDate || null,
      };

      // Call adjustment mutation
      const result = await createAdjustment.mutateAsync(adjustmentData);

      // Record movement for tracking
      try {
        const movementData = {
          cabangId: data.cabangId,
          produkId: data.produkId,
          type: "adjustment",
          quantity:
            data.adjustmentType === "subtract" ? -data.quantity : data.quantity,
          stockBefore: data.currentStock,
          stockAfter: finalStock,
          reason: data.reason,
          batchNumber: data.batchNumber || null,
          reference: `ADJ-${new Date().getTime()}`,
        };

        // This would call the recordMovement mutation if imported
        // For now, we'll rely on the backend to record this automatically when adjustment is made
        console.log("Movement data recorded:", movementData);
      } catch (movementError) {
        console.error("Error recording movement:", movementError);
        // Don't show error to user, as the adjustment was successful
      }

      // Reset form on success
      reset({
        ...data,
        produkId: "",
        currentStock: 0,
        quantity: 1,
        notes: "",
        batchNumber: "",
        expiryDate: "",
      });

      setSelectedProduct(null);
    } catch (error) {
      console.error("Error submitting adjustment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle product search
  const filteredProducts = searchTerm
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  return (
    <div className="pb-6">
      {/* Page Header */}
      <div className="flex flex-col items-center justify-center bg-indigo-600 text-white py-8 mb-6">
        <h1 className="text-2xl font-bold mb-2">Penyesuaian Stok</h1>
        <div className="flex items-center">
          <ArrowLeftRight size={24} className="mr-2" />
          <span>Menambah, mengurangi, atau mengatur ulang stok produk</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center mb-6">
            <div className="bg-indigo-100 p-3 rounded-full mr-4">
              <Edit3 className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Form Penyesuaian Stok
              </h2>
              <p className="text-sm text-gray-500">
                Isi form berikut untuk melakukan penyesuaian stok produk
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Branch Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cabang
              </label>
              <select
                {...register("cabangId")}
                className={`w-full rounded-md border ${
                  errors.cabangId ? "border-red-500" : "border-gray-300"
                } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                disabled={isCabangLoading || isSubmitting}
              >
                <option value="">Pilih Cabang</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.namaCabang}
                  </option>
                ))}
              </select>
              {errors.cabangId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.cabangId.message}
                </p>
              )}
            </div>

            {/* Product Search & Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produk
              </label>
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Cari produk (nama atau SKU)..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={
                    !selectedCabangId || isProductLoading || isSubmitting
                  }
                />
              </div>
              <select
                value={watch("produkId")}
                onChange={handleProductChange}
                className={`w-full rounded-md border ${
                  errors.produkId ? "border-red-500" : "border-gray-300"
                } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                disabled={!selectedCabangId || isProductLoading || isSubmitting}
              >
                <option value="">Pilih Produk</option>
                {filteredProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.sku} (Stok: {product.stock})
                  </option>
                ))}
              </select>
              {errors.produkId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.produkId.message}
                </p>
              )}
            </div>

            {/* Current Stock */}
            {selectedProduct && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <Database className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    Stok Saat Ini: {selectedProduct.stock}
                  </span>
                </div>
              </div>
            )}

            {/* Adjustment Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe Penyesuaian
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label
                  className={`flex items-center justify-center p-3 rounded-md border cursor-pointer ${
                    adjustmentType === "add"
                      ? "bg-green-50 border-green-500"
                      : "border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    value="add"
                    {...register("adjustmentType")}
                    className="sr-only"
                  />
                  <Plus
                    className={`h-5 w-5 mr-2 ${
                      adjustmentType === "add"
                        ? "text-green-500"
                        : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      adjustmentType === "add"
                        ? "text-green-700"
                        : "text-gray-500"
                    }`}
                  >
                    Tambah Stok
                  </span>
                </label>

                <label
                  className={`flex items-center justify-center p-3 rounded-md border cursor-pointer ${
                    adjustmentType === "subtract"
                      ? "bg-orange-50 border-orange-500"
                      : "border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    value="subtract"
                    {...register("adjustmentType")}
                    className="sr-only"
                  />
                  <Minus
                    className={`h-5 w-5 mr-2 ${
                      adjustmentType === "subtract"
                        ? "text-orange-500"
                        : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      adjustmentType === "subtract"
                        ? "text-orange-700"
                        : "text-gray-500"
                    }`}
                  >
                    Kurangi Stok
                  </span>
                </label>

                <label
                  className={`flex items-center justify-center p-3 rounded-md border cursor-pointer ${
                    adjustmentType === "set"
                      ? "bg-blue-50 border-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    value="set"
                    {...register("adjustmentType")}
                    className="sr-only"
                  />
                  <BarChart2
                    className={`h-5 w-5 mr-2 ${
                      adjustmentType === "set"
                        ? "text-blue-500"
                        : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      adjustmentType === "set"
                        ? "text-blue-700"
                        : "text-gray-500"
                    }`}
                  >
                    Atur Ulang
                  </span>
                </label>
              </div>
              {errors.adjustmentType && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.adjustmentType.message}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {adjustmentType === "add"
                  ? "Jumlah Penambahan"
                  : adjustmentType === "subtract"
                  ? "Jumlah Pengurangan"
                  : "Jumlah Stok Baru"}
              </label>
              <input
                type="number"
                min="1"
                {...register("quantity", { valueAsNumber: true })}
                className={`w-full rounded-md border ${
                  errors.quantity ? "border-red-500" : "border-gray-300"
                } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                disabled={isSubmitting}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            {/* Reason */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alasan Penyesuaian
              </label>
              <select
                {...register("reason")}
                className={`w-full rounded-md border ${
                  errors.reason ? "border-red-500" : "border-gray-300"
                } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                disabled={isSubmitting}
              >
                <option value="correction">Koreksi Stok</option>
                <option value="damage">Barang Rusak</option>
                <option value="expiry">Barang Kedaluwarsa</option>
                <option value="theft">Pencurian</option>
                <option value="other">Lainnya</option>
              </select>
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.reason.message}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan
              </label>
              <textarea
                {...register("notes")}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Tambahkan detail tentang penyesuaian ini..."
                disabled={isSubmitting}
              />
            </div>

            {/* Batch and Expiry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Batch (opsional)
                </label>
                <input
                  type="text"
                  {...register("batchNumber")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Kedaluwarsa (opsional)
                </label>
                <input
                  type="date"
                  {...register("expiryDate")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="small" className="mr-2" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>Simpan Penyesuaian</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-xl shadow-sm p-6">
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-full mr-4">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-md font-medium text-blue-900 mb-2">
                Tentang Penyesuaian Stok
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start">
                  <Plus className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <span>
                    <strong>Tambah Stok</strong>: Menambahkan jumlah tertentu ke
                    stok yang ada
                  </span>
                </li>
                <li className="flex items-start">
                  <Minus className="h-4 w-4 text-orange-600 mr-2 mt-0.5" />
                  <span>
                    <strong>Kurangi Stok</strong>: Mengurangi jumlah tertentu
                    dari stok yang ada
                  </span>
                </li>
                <li className="flex items-start">
                  <BarChart2 className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                  <span>
                    <strong>Atur Ulang</strong>: Mengatur jumlah stok ke nilai
                    baru, terlepas dari nilai sebelumnya
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustment;
