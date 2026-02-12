import React from "react";
import { X, Package, DollarSign, Check, AlertTriangle } from "lucide-react";
import Modal from "../../common/Modal";
import formatRupiah from "@common/utils/formatCurrency";

/**
 * ProductPreviewModal - Modal preview ringkasan produk sebelum submit
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close modal handler
 * @param {Function} props.onConfirm - Confirm submit handler
 * @param {Array} props.products - Selected products array
 * @param {Object} props.productPrices - Product prices mapping {productId: hargaBeli}
 * @param {number} props.marginPercentage - Margin percentage for jual price calculation
 * @param {string} props.branchName - Target branch name
 * @param {boolean} props.isSubmitting - Submit loading state
 */
const ProductPreviewModal = ({
  isOpen,
  onClose,
  onConfirm,
  products = [],
  productPrices = {},
  marginPercentage = 0,
  branchName = "",
  isSubmitting = false,
}) => {
  // Calculate totals
  const calculateHargaJual = (hargaBeli) => {
    return hargaBeli + (hargaBeli * marginPercentage) / 100;
  };

  const totalHargaBeli = products.reduce((sum, product) => {
    return sum + (Number(productPrices[product.id]) || 0);
  }, 0);

  const totalHargaJual = products.reduce((sum, product) => {
    const hargaBeli = Number(productPrices[product.id]) || 0;
    return sum + calculateHargaJual(hargaBeli);
  }, 0);

  const totalMargin = totalHargaJual - totalHargaBeli;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Preview Produk</h2>
              <p className="text-blue-100 text-sm">
                Review sebelum menambahkan ke {branchName || "cabang"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Package className="h-4 w-4" />
                Total Produk
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {products.length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <DollarSign className="h-4 w-4" />
                Total Harga Beli
              </div>
              <p className="text-lg font-bold text-gray-800">
                {formatRupiah(totalHargaBeli)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <DollarSign className="h-4 w-4" />
                Total Harga Jual
              </div>
              <p className="text-lg font-bold text-blue-600">
                {formatRupiah(totalHargaJual)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                Margin ({marginPercentage}%)
              </div>
              <p className="text-lg font-bold text-green-600">
                +{formatRupiah(totalMargin)}
              </p>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 rounded-l-lg">
                  Produk
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                  Harga Beli
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 rounded-r-lg">
                  Harga Jual
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product, index) => {
                const hargaBeli = Number(productPrices[product.id]) || 0;
                const hargaJual = calculateHargaJual(hargaBeli);

                return (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-800">
                            {product.namaProduk}
                          </p>
                          <p className="text-xs text-gray-500">
                            SKU: {product.sku || "-"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-gray-700">
                        {formatRupiah(hargaBeli)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-medium text-blue-600">
                        {formatRupiah(hargaJual)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t rounded-b-xl">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Konfirmasi Simpan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductPreviewModal;
