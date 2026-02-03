import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus, Trash, RefreshCcw } from "lucide-react";
import { useCabang } from "@features/cabang/hooks/useCabang";
import toast from "react-hot-toast";
import api from "@common/utils/api";
import { useCreateRetur } from "../hooks/useReturQueries";

const GlobalReturnCreate = () => {
  const navigate = useNavigate();
  const { selectedCabang, cabangList = [] } = useCabang();
  const createReturMutation = useCreateRetur();

  // State for the form
  const [formData, setFormData] = useState({
    cabangId: selectedCabang || "",
    jenisRetur: "RETUR_PENJUALAN", // Default to retur penjualan
    nomorTransaksiAsli: "",
    alasanRetur: "",
    keterangan: "",
    items: [],
  });

  const [searchingTransaction, setSearchingTransaction] = useState(false);
  const [foundTransaction, setFoundTransaction] = useState(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Search for original transaction
  const searchTransaction = async () => {
    if (!formData.nomorTransaksiAsli) {
      toast.error("Masukkan nomor transaksi asli");
      return;
    }

    setSearchingTransaction(true);

    try {
      // Search for the original transaction by number
      const expectedType = formData.jenisRetur === "RETUR_PENJUALAN" ? "PENJUALAN" : "PEMBELIAN";
      const response = await api.get("/transaksi", {
        params: {
          search: formData.nomorTransaksiAsli,
          jenisTransaksi: expectedType,
          limit: 10,
        },
      });

      const transactions = response.data?.data || [];
      
      // Find exact match by nomor_transaksi
      const matchedTransaction = transactions.find(
        (t) => t.nomor_transaksi.toLowerCase() === formData.nomorTransaksiAsli.toLowerCase()
      );

      console.log(matchedTransaction);

      if (!matchedTransaction) {
        toast.error("Transaksi tidak ditemukan");
        setSearchingTransaction(false);
        return;
      }

      // Fetch full transaction detail
      const detailResponse = await api.get(`/transaksi/${matchedTransaction.transaksi_id}`);
      const fullTransaction = detailResponse.data?.data;

      if (!fullTransaction) {
        toast.error("Gagal mengambil detail transaksi");
        setSearchingTransaction(false);
        return;
      }

      setFoundTransaction(fullTransaction);
      setSearchingTransaction(false);

      // Prepopulate items from the transaction
      const transactionItems = fullTransaction.transaksi_detail || [];
      setFormData({
        ...formData,
        pelangganId: fullTransaction.pelanggan_id,
        supplierId: fullTransaction.supplier_id,
        transaksiAsliId: fullTransaction.transaksi_id,
        items: transactionItems.map((item) => ({
          produk_id: item.produk_id,
          namaProduk: item.produk?.produkMaster?.namaProduk || "Unknown",
          sku: item.produk?.produkMaster?.sku || "-",
          jumlahAsli: item.jumlah,
          jumlahRetur: 0,
          harga_satuan: item.harga_satuan,
          subtotal: 0,
          alasan: "",
          kondisi: "Baik",
        })),
      });

      toast.success("Transaksi ditemukan");
    } catch (error) {
      console.error("Error searching transaction:", error);
      toast.error(error.response?.data?.message || "Gagal mencari transaksi");
      setSearchingTransaction(false);
    }
  };

  // Update returned item quantity
  const updateItemQuantity = (index, value) => {
    const newItems = [...formData.items];
    const qty = parseInt(value, 10) || 0;

    // Ensure quantity doesn't exceed original quantity
    if (qty > newItems[index].jumlahAsli) {
      toast.error("Jumlah retur tidak dapat melebihi jumlah asli");
      return;
    }

    newItems[index].jumlahRetur = qty;
    newItems[index].subtotal = qty * newItems[index].harga_satuan;

    setFormData({
      ...formData,
      items: newItems,
    });
  };

  // Update item reason
  const updateItemReason = (index, value) => {
    const newItems = [...formData.items];
    newItems[index].alasan = value;
    setFormData({
      ...formData,
      items: newItems,
    });
  };

  // Update item condition
  const updateItemCondition = (index, value) => {
    const newItems = [...formData.items];
    newItems[index].kondisi = value;
    setFormData({
      ...formData,
      items: newItems,
    });
  };

  // Calculate total
  const calculateTotal = () => {
    return formData.items.reduce((total, item) => total + item.subtotal, 0);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.cabangId) {
      toast.error("Pilih cabang");
      return;
    }

    if (!foundTransaction) {
      toast.error("Cari transaksi asli terlebih dahulu");
      return;
    }

    if (!formData.alasanRetur) {
      toast.error("Masukkan alasan retur");
      return;
    }

    if (formData.items.every((item) => item.jumlahRetur === 0)) {
      toast.error("Masukkan jumlah item yang diretur");
      return;
    }

    if (formData.items.some((item) => item.jumlahRetur > 0 && !item.alasan)) {
      toast.error("Masukkan alasan untuk setiap item yang diretur");
      return;
    }

    try {
      await createReturMutation.mutateAsync(formData);
      navigate("/returns");
    } catch (error) {
      // Error is already handled in the mutation hook
      console.error("Error creating return:", error);
    }
  };

  // Go back
  const handleBack = () => {
    navigate("/returns");
  };

  return (
    <div className="w-full p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Buat Retur Baru
        </h1>
        <p className="text-sm text-gray-600">
          Formulir pembuatan transaksi retur
        </p>
      </div>

      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm"
        >
          <ArrowLeft size={16} className="mr-2" />
          Kembali
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Informasi Retur</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Cabang */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cabang
                </label>
                <select
                  name="cabangId"
                  value={formData.cabangId}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Pilih Cabang</option>
                  {cabangList.map((cabang) => (
                    <option key={cabang.id} value={cabang.id}>
                      {cabang.namaCabang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jenis Retur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Retur
                </label>
                <select
                  name="jenisRetur"
                  value={formData.jenisRetur}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="RETUR_PENJUALAN">Retur Penjualan</option>
                  <option value="RETUR_PEMBELIAN">Retur Pembelian</option>
                </select>
              </div>
            </div>

            {/* Transaction Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Transaksi Asli
              </label>
              <div className="flex">
                <input
                  type="text"
                  name="nomorTransaksiAsli"
                  value={formData.nomorTransaksiAsli}
                  onChange={handleInputChange}
                  placeholder="Masukkan nomor transaksi"
                  className="flex-1 rounded-l-md border border-gray-300 bg-white py-2 px-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={searchTransaction}
                  disabled={searchingTransaction}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {searchingTransaction ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2">Cari</span>
                </button>
              </div>
            </div>

            {foundTransaction && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Informasi Transaksi
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Nomor Transaksi</p>
                    <p className="text-sm font-medium">
                      {foundTransaction.nomor_transaksi}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Jenis Transaksi</p>
                    <p className="text-sm font-medium">
                      {foundTransaction.jenis_transaksi}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      {formData.jenisRetur === "RETUR_PENJUALAN"
                        ? "Pelanggan"
                        : "Supplier"}
                    </p>
                    <p className="text-sm font-medium">
                      {formData.jenisRetur === "RETUR_PENJUALAN"
                        ? foundTransaction.pelanggan?.namaPelanggan || "-"
                        : foundTransaction.supplier?.namaSupplier || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-sm font-medium">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(foundTransaction.total)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Alasan Retur */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alasan Retur
              </label>
              <textarea
                name="alasanRetur"
                value={formData.alasanRetur}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="Masukkan alasan retur secara umum"
              />
            </div>

            {/* Keterangan */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keterangan Tambahan (Opsional)
              </label>
              <textarea
                name="keterangan"
                value={formData.keterangan}
                onChange={handleInputChange}
                rows={2}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="Masukkan keterangan tambahan jika ada"
              />
            </div>

            {/* Item List */}
            {formData.items.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <RefreshCcw className="h-4 w-4 mr-1 text-amber-600" />
                  Item yang Diretur
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Produk
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          SKU
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Jumlah Asli
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Jumlah Retur
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Kondisi
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Alasan
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <tr key={item.produk_id}>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.namaProduk}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {item.sku}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                            {item.jumlahAsli}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              max={item.jumlahAsli}
                              value={item.jumlahRetur}
                              onChange={(e) =>
                                updateItemQuantity(index, e.target.value)
                              }
                              className="w-16 rounded-md border border-gray-300 bg-white py-1 px-2 text-center focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                            />
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <select
                              value={item.kondisi}
                              onChange={(e) =>
                                updateItemCondition(index, e.target.value)
                              }
                              className="rounded-md border border-gray-300 bg-white py-1 px-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="Baik">Baik</option>
                              <option value="Rusak">Rusak</option>
                              <option value="Cacat">Cacat</option>
                            </select>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={item.alasan}
                              onChange={(e) =>
                                updateItemReason(index, e.target.value)
                              }
                              placeholder="Alasan retur"
                              className="w-full rounded-md border border-gray-300 bg-white py-1 px-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                            />
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              minimumFractionDigits: 0,
                            }).format(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-4 text-sm text-gray-700 text-right font-medium"
                        >
                          Total
                        </td>
                        <td className="px-3 py-4 text-right text-sm text-gray-900 font-bold">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(calculateTotal())}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createReturMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createReturMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Buat Retur
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GlobalReturnCreate;
