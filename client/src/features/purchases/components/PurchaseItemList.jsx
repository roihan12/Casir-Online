import React from "react";
import { Controller } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

/**
 * PurchaseItemList - Component for managing purchase line items
 * @param {Object} props
 * @param {Array} props.fields - Field array from react-hook-form
 * @param {Object} props.control - Form control from react-hook-form
 * @param {Function} props.register - Register function from react-hook-form
 * @param {Function} props.setValue - setValue function from react-hook-form
 * @param {Object} props.errors - Form errors
 * @param {Array} props.watchItems - Watched items from form
 * @param {Array} props.products - Available products
 * @param {Function} props.onAddItem - Handler to add new item
 * @param {Function} props.onRemoveItem - Handler to remove item
 * @param {Function} props.onProductSelect - Handler when product is selected in dropdown
 * @param {Function} props.onRecalculateTotal - Handler to recalculate total
 */
const PurchaseItemList = ({
  fields,
  control,
  register,
  setValue,
  errors,
  watchItems,
  products,
  onAddItem,
  onRemoveItem,
  onProductSelect,
  onRecalculateTotal,
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (fields.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Daftar Item Pembelian</h2>
          <button
            type="button"
            onClick={onAddItem}
            className="px-3 py-1 bg-indigo-600 text-white rounded-md flex items-center text-sm hover:bg-indigo-700"
          >
            <Plus size={14} className="mr-1" />
            Tambah Item Manual
          </button>
        </div>
        <div className="bg-gray-50 p-6 text-center rounded-lg">
          <p className="text-gray-500">
            Belum ada item. Klik produk di atas atau "Tambah Item Manual".
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Daftar Item Pembelian</h2>
        <button
          type="button"
          onClick={onAddItem}
          className="px-3 py-1 bg-indigo-600 text-white rounded-md flex items-center text-sm hover:bg-indigo-700"
        >
          <Plus size={14} className="mr-1" />
          Tambah Item Manual
        </button>
      </div>

      <div className="space-y-4">
        {/* Header for larger screens */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 text-sm font-medium text-gray-500 px-4">
          <div className="col-span-4">Produk</div>
          <div className="col-span-2">Batch/Exp</div>
          <div className="col-span-2">Harga Satuan</div>
          <div className="col-span-1">Qty</div>
          <div className="col-span-2">Subtotal</div>
          <div className="col-span-1"></div>
        </div>

        {/* Items */}
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start"
          >
            {/* Product selection */}
            <div className="col-span-1 md:col-span-4 space-y-1">
              <label className="block text-sm font-medium text-gray-700 md:hidden">
                Produk
              </label>
              <select
                {...register(`items.${index}.produkId`)}
                onChange={(e) => onProductSelect(e, index)}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
              >
                <option value="">Pilih Produk</option>
                {products.map((product) => (
                  <option key={product.id} value={product.produkMasterId}>
                    {product.produkMaster?.namaProduk || "Produk"} (
                    {product.produkMaster?.sku || "-"}) -{" "}
                    {formatCurrency(parseFloat(product.hargaBeli))}
                  </option>
                ))}
              </select>
              {errors.items?.[index]?.produkId && (
                <p className="text-red-500 text-xs">
                  {errors.items[index].produkId.message}
                </p>
              )}
            </div>

            {/* Batch and Expiry */}
            <div className="col-span-1 md:col-span-2 space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-500 md:hidden">
                  Batch Number
                </label>
                <input
                  type="text"
                  placeholder="Batch No"
                  {...register(`items.${index}.batchNumber`)}
                  className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 md:hidden">
                  Expired Date
                </label>
                <input
                  type="date"
                  {...register(`items.${index}.expiredDate`)}
                  className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm"
                />
              </div>
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
                      const newPrice = parseFloat(e.target.value) || 0;
                      field.onChange(newPrice);
                      
                      // Recalculate subtotal
                      const quantity = watchItems[index]?.quantity || 0;
                      setValue(`items.${index}.subtotal`, quantity * newPrice);
                      
                      // Trigger total recalculation
                      onRecalculateTotal();
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
                Qty
              </label>
              <Controller
                control={control}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <input
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const newQuantity = parseInt(e.target.value) || 0;
                      field.onChange(newQuantity);
                      
                      // Recalculate subtotal
                      const hargaSatuan = watchItems[index]?.hargaSatuan || 0;
                      setValue(`items.${index}.subtotal`, newQuantity * hargaSatuan);
                      
                      // Trigger total recalculation
                      onRecalculateTotal();
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

            {/* Subtotal */}
            <div className="col-span-1 md:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-gray-700 md:hidden">
                Subtotal
              </label>
              <div className="text-gray-900 font-medium py-2">
                {formatCurrency(watchItems[index]?.subtotal || 0)}
              </div>
            </div>

            {/* Delete button */}
            <div className="col-span-1 md:col-span-1 flex md:justify-center">
              <button
                type="button"
                onClick={() => onRemoveItem(index)}
                className="text-red-600 hover:text-red-800 p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PurchaseItemList;
