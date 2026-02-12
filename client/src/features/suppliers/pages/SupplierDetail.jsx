import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Truck,
  Package,
  FileText,
  History,
  Edit,
  Trash2,
  ArrowLeft,
  UserX,
  UserCheck,
  Phone,
  AtSign,
  MapPin,
  FileBarChart,
  User,
  DollarSign,
  Calendar,
  AlertTriangle,
  Plus,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmationDialog from "../../common/ConfirmationDialog";
import Tabs from "../../common/Tabs";
import Spinner from "../../common/Spinner";
import {
  useDeleteSupplier,
  useChangeSupplierStatus,
} from "../hooks/useSupplierQueries";
import { useSupplierPurchase } from "../hooks/useSupplierPurchase";
import formatCurrency from "../../../common/utils/formatCurrency";

const SupplierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Setup query hooks using the integrated useSupplierPurchase hook
  const {
    supplier,
    products,
    purchaseHistory,
    purchaseHistoryPagination,
    selectedBranchId,
    setSelectedBranchId,
    branches,
    isLoadingSupplier,
    isLoadingProducts,
    isLoadingHistory,
    supplierError,
  } = useSupplierPurchase(id);

  console.log(supplier);

  // Mutations for actions
  const deleteSupplierMutation = useDeleteSupplier();
  const changeStatusMutation = useChangeSupplierStatus();

  const [activeTab, setActiveTab] = useState("info");
  const [priceHistory, setPriceHistory] = useState([]);
  const [isLoadingPriceHistory, setIsLoadingPriceHistory] = useState(false);

  // Get transactions from the purchase history data
  const transactions = purchaseHistory || [];

  // States for modals and actions
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  // Load tab data when tab changes
  useEffect(() => {
    const loadTabData = async () => {
      if (!id) return;

      try {
        if (activeTab === "priceHistory") {
          setIsLoadingPriceHistory(true);
          // This needs to be implemented in the service
          const priceHistoryData = { items: [] }; // Placeholder until real data is available
          setPriceHistory(priceHistoryData.items || []);
          setIsLoadingPriceHistory(false);
        }
      } catch (err) {
        console.error(`Error loading ${activeTab} data:`, err);
        toast.error(`Gagal memuat data ${activeTab}`);

        if (activeTab === "priceHistory") setIsLoadingPriceHistory(false);
      }
    };

    loadTabData();
  }, [activeTab, id]);

  // Handle delete supplier
  const handleDeleteSupplier = async () => {
    deleteSupplierMutation.mutate(id, {
      onSuccess: () => {
        navigate("/suppliers");
      },
    });
    setShowDeleteModal(false);
  };

  // Handle change supplier status
  const handleChangeStatus = async () => {
    changeStatusMutation.mutate({ id, status: newStatus });
    setShowStatusModal(false);
  };

  // Open status change modal
  const openStatusChangeModal = (status) => {
    setNewStatus(status);
    setShowStatusModal(true);
  };

  // Determine if data is loading
  const isLoading =
    isLoadingSupplier ||
    isLoadingProducts ||
    (activeTab === "transactions" && isLoadingHistory) ||
    (activeTab === "priceHistory" && isLoadingPriceHistory);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (supplierError || !supplier) {
    return (
      <div className="mx-6 mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span>{supplierError?.message || "Data supplier tidak ditemukan"}</span>
      </div>
    );
  }

  // Tab configuration
  const tabs = [
    { id: "info", label: "Informasi Supplier", icon: <User size={18} /> },
    {
      id: "products",
      label: "Produk",
      icon: <Package size={18} />,
      onClick: () =>
        navigate(
          `/suppliers/products?supplierId=${id}&supplierName=${supplier.namaSupplier}`
        ),
    },
    {
      id: "debt",
      label: "Hutang",
      icon: <DollarSign size={18} />,
      onClick: () =>
        navigate(
          `/suppliers/debt?supplierId=${id}&supplierName=${supplier.namaSupplier}`
        ),
    },
    { id: "transactions", label: "Transaksi", icon: <FileText size={18} /> },
    { id: "priceHistory", label: "Riwayat Harga", icon: <History size={18} /> },
  ];

  return (
    <div className="pb-6">
      {/* Header with navigation */}
      <div className="bg-indigo-600 text-white py-6">
        <div className="mx-6">
          <button
            onClick={() => navigate("/suppliers")}
            className="flex items-center text-indigo-100 hover:text-white mb-4"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span>Kembali ke Daftar Supplier</span>
          </button>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{supplier.namaSupplier}</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate(`/suppliers/${id}/edit`)}
                className="px-3 py-1 bg-white text-indigo-700 rounded-md flex items-center text-sm"
              >
                <Edit size={14} className="mr-1" />
                Edit
              </button>

              <button
                onClick={() =>
                  navigate(
                    `/suppliers/products?supplierId=${id}&supplierName=${supplier.namaSupplier}`
                  )
                }
                className="px-3 py-1 bg-blue-500 text-white rounded-md flex items-center text-sm"
              >
                <Package size={14} className="mr-1" />
                Produk
              </button>

              <button
                onClick={() =>
                  navigate(
                    `/suppliers/debt?supplierId=${id}&supplierName=${supplier.namaSupplier}`
                  )
                }
                className="px-3 py-1 bg-orange-500 text-white rounded-md flex items-center text-sm"
              >
                <DollarSign size={14} className="mr-1" />
                Hutang
              </button>

              {supplier.status === "aktif" ? (
                <button
                  onClick={() => openStatusChangeModal("nonaktif")}
                  className="px-3 py-1 bg-orange-500 text-white rounded-md flex items-center text-sm"
                >
                  <UserX size={14} className="mr-1" />
                  Nonaktifkan
                </button>
              ) : (
                <button
                  onClick={() => openStatusChangeModal("aktif")}
                  className="px-3 py-1 bg-green-500 text-white rounded-md flex items-center text-sm"
                >
                  <UserCheck size={14} className="mr-1" />
                  Aktifkan
                </button>
              )}

              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3 py-1 bg-red-500 text-white rounded-md flex items-center text-sm"
              >
                <Trash2 size={14} className="mr-1" />
                Hapus
              </button>
            </div>
          </div>
          <div className="flex items-center mt-2">
            <Truck size={18} className="mr-2" />
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                supplier.status === "aktif"
                  ? "bg-green-200 text-green-800"
                  : "bg-red-200 text-red-800"
              }`}
            >
              {supplier.status === "aktif" ? "Aktif" : "Nonaktif"}
            </span>
            {supplier.npwp && (
              <span className="ml-2 text-indigo-200">
                NPWP: {supplier.npwp}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mx-6 mt-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab Content */}
      <div className="mx-6 mt-4 bg-white rounded-xl shadow-sm p-6">
        {activeTab === "info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-800">
                Informasi Kontak
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-start">
                    <Phone className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <span className="block text-sm font-medium text-gray-500">
                        Telepon
                      </span>
                      <span className="block mt-1">
                        {supplier.telepon || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-start">
                    <AtSign className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <span className="block text-sm font-medium text-gray-500">
                        Email
                      </span>
                      <span className="block mt-1">
                        {supplier.email || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <span className="block text-sm font-medium text-gray-500">
                        Alamat
                      </span>
                      <span className="block mt-1">
                        {supplier.alamat || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-medium mb-4 mt-8 text-gray-800">
                Person In Charge (PIC)
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-start">
                    <User className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <span className="block text-sm font-medium text-gray-500">
                        Nama PIC
                      </span>
                      <span className="block mt-1">
                        {supplier.picNama || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-start">
                    <Phone className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <span className="block text-sm font-medium text-gray-500">
                        Kontak PIC
                      </span>
                      <span className="block mt-1">
                        {supplier.picKontak || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-800">
                Informasi Supplier
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-500">
                      Total Produk
                    </span>
                    <span className="block mt-1 text-xl font-semibold">
                      {supplier?.stats.totalProduk || 0}
                    </span>
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-500">
                      Total Transaksi
                    </span>
                    <span className="block mt-1 text-xl font-semibold">
                      {supplier?.stats.totalTransaksi || 0}
                    </span>
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-500">
                      Nilai Transaksi
                    </span>
                    <span className="block mt-1 text-xl font-semibold text-indigo-600">
                      {formatCurrency(supplier.stats?.nilaiTransaksi || 0)}
                    </span>
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-500">
                      Tanggal Daftar
                    </span>
                    <span className="block mt-1">
                      {supplier.createdAt
                        ? new Date(supplier.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4 text-gray-800">
                  Cabang Terkait
                </h3>
                {branches && branches.length > 0 ? (
                  <div className="space-y-2">
                    {branches.map((branch) => (
                      <div
                        key={branch.id}
                        className="bg-indigo-50 p-4 rounded-lg"
                      >
                        <span className="font-medium">
                          {branch.namaCabang || "Cabang"}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          {branch.alamat || "Alamat cabang"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : supplier.cabang_id ? (
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <span className="font-medium">
                      {supplier.cabang?.namaCabang || "Cabang"}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      Supplier ini terkait dengan cabang spesifik
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <span className="font-medium">Semua Cabang</span>
                    <p className="text-sm text-gray-600 mt-1">
                      Supplier ini tersedia untuk semua cabang
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {(activeTab === "products" || activeTab === "transactions") && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Cabang
            </label>
            <select
              value={selectedBranchId || ""}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {branches && branches.length > 0 ? (
                <>
                  <option value="" disabled>
                    Pilih Cabang
                  </option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.namaCabang}
                    </option>
                  ))}
                </>
              ) : (
                <option value="">Semua Cabang</option>
              )}
            </select>
          </div>
        )}

        {activeTab === "products" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                Produk dari Supplier: {products?.length || 0} produk
              </h3>
              <button
                onClick={() =>
                  navigate(
                    `/suppliers/${id}/products/create${
                      selectedBranchId ? `?cabangId=${selectedBranchId}` : ""
                    }`
                  )
                }
                className="px-3 py-1 bg-indigo-600 text-white rounded-md flex items-center text-sm"
              >
                <Package size={14} className="mr-1" />
                Tambah Produk
              </button>
            </div>

            {isLoadingProducts ? (
              <div className="flex justify-center items-center h-32">
                <Spinner size="md" />
              </div>
            ) : !products || products.length === 0 ? (
              <div className="bg-gray-50 p-8 text-center rounded-lg">
                <Package size={40} className="mx-auto text-gray-400 mb-2" />
                <h4 className="text-gray-500 font-medium">Belum ada produk</h4>
                <p className="text-gray-400 mt-1">
                  Supplier ini belum memiliki produk yang terhubung{" "}
                  {selectedBranchId ? "di cabang ini" : ""}
                </p>
              </div>
            ) : (
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
                        Kode Produk
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Harga Beli
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
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
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md"></div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.produkMaster?.namaProduk || "Produk"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {product.produkMaster?.kategori?.namaKategori ||
                                  "Kategori"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.kodeProdukSupplier || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(product.hargaBeli)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.status === "aktif"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.status === "aktif" ? "Aktif" : "Nonaktif"}
                          </span>
                          {product.isPrimary && (
                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                              Utama
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            className="text-indigo-600 hover:text-indigo-900 mr-2"
                            onClick={() =>
                              navigate(
                                `/products/${product.produkMasterId}`
                              )
                            }
                          >
                            Lihat
                          </button>
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() =>
                              navigate(
                                `/suppliers/${id}/products/${product.id}/edit`
                              )
                            }
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "transactions" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                Transaksi dengan Supplier: {transactions?.length || 0} transaksi
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    navigate(
                      `/suppliers/${id}/purchase/create?preselect=true${
                        selectedBranchId ? `&cabangId=${selectedBranchId}` : ""
                      }`
                    );
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded-md flex items-center text-sm"
                >
                  <ShoppingBag size={14} className="mr-1" />
                  Buat Pembelian dengan Produk
                </button>
                <button
                  onClick={() => {
                    navigate(
                      `/purchases/create/${id}${
                        selectedBranchId ? `?cabangId=${selectedBranchId}` : ""
                      }`
                    );
                  }}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-md flex items-center text-sm"
                >
                  <Plus size={14} className="mr-1" />
                  Buat Pembelian
                </button>
              </div>
            </div>

            {isLoadingHistory ? (
              <div className="flex justify-center items-center h-32">
                <Spinner size="md" />
              </div>
            ) : !transactions || transactions.length === 0 ? (
              <div className="bg-gray-50 p-8 text-center rounded-lg">
                <FileText size={40} className="mx-auto text-gray-400 mb-2" />
                <h4 className="text-gray-500 font-medium">
                  Belum ada transaksi
                </h4>
                <p className="text-gray-400 mt-1">
                  Belum ada transaksi yang tercatat dengan supplier ini{" "}
                  {selectedBranchId ? "di cabang ini" : ""}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        No. Transaksi
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Tanggal
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Jenis
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Total
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
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
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-indigo-600">
                            {transaction.noTransaksi || "TRX-2023080001"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.tanggal
                            ? new Date(transaction.tanggal).toLocaleDateString(
                                "id-ID"
                              )
                            : "01 Aug 2023"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.jenisTransaksi || "PEMBELIAN"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(transaction.total || 5750000)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {transaction.status || "LUNAS"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            className="text-indigo-600 hover:text-indigo-900"
                            onClick={() =>
                              navigate(
                                `/transactions/${transaction.id}`
                              )
                            }
                          >
                            Lihat
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination controls */}
                {transactions.length > 0 && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500">
                      Menampilkan {transactions.length} dari{" "}
                      {purchaseHistoryPagination?.total || transactions.length}{" "}
                      transaksi
                    </div>
                    <div className="flex space-x-2">
                      <button
                        disabled={!purchaseHistoryPagination?.prev_page}
                        onClick={() => {
                          // This would need to be implemented in the useSupplierPurchase hook
                          // For now it's a placeholder
                          console.log("Go to previous page");
                        }}
                        className={`px-3 py-1 rounded-md text-sm ${
                          purchaseHistoryPagination?.prev_page
                            ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        disabled={!purchaseHistoryPagination?.next_page}
                        onClick={() => {
                          // This would need to be implemented in the useSupplierPurchase hook
                          // For now it's a placeholder
                          console.log("Go to next page");
                        }}
                        className={`px-3 py-1 rounded-md text-sm ${
                          purchaseHistoryPagination?.next_page
                            ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "priceHistory" && (
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-800">
              Riwayat Perubahan Harga: {priceHistory.length} perubahan
            </h3>

            {isLoadingPriceHistory ? (
              <div className="flex justify-center items-center h-32">
                <Spinner size="md" />
              </div>
            ) : priceHistory.length === 0 ? (
              <div className="bg-gray-50 p-8 text-center rounded-lg">
                <History size={40} className="mx-auto text-gray-400 mb-2" />
                <h4 className="text-gray-500 font-medium">
                  Belum ada riwayat perubahan harga
                </h4>
                <p className="text-gray-400 mt-1">
                  Belum ada perubahan harga yang tercatat dari supplier ini
                </p>
              </div>
            ) : (
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
                        Tanggal Perubahan
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Harga Lama
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Harga Baru
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Perubahan
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Oleh
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {priceHistory.map((history, index) => (
                      <tr
                        key={history.id || index}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {history.produkNama || "Produk A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {history.tanggalPerubahan
                            ? new Date(
                                history.tanggalPerubahan
                              ).toLocaleDateString("id-ID")
                            : "01 Aug 2023"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {history.hargaLama
                            ? new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: "IDR",
                                minimumFractionDigits: 0,
                              }).format(history.hargaLama)
                            : "Rp 95.000"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {history.hargaBaru
                            ? new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: "IDR",
                                minimumFractionDigits: 0,
                              }).format(history.hargaBaru)
                            : "Rp 105.000"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            {history.persentasePerubahan || "+10.5%"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {history.userNama || "Admin"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showDeleteModal}
        title="Hapus Supplier"
        message={`Apakah Anda yakin ingin menghapus supplier "${supplier.namaSupplier}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        isLoading={deleteSupplierMutation.isPending}
        onConfirm={handleDeleteSupplier}
        onCancel={() => setShowDeleteModal(false)}
        confirmButtonClassName="bg-red-600 hover:bg-red-700"
      />

      <ConfirmationDialog
        isOpen={showStatusModal}
        title={`${newStatus === "aktif" ? "Aktifkan" : "Nonaktifkan"} Supplier`}
        message={`Apakah Anda yakin ingin ${
          newStatus === "aktif" ? "mengaktifkan" : "menonaktifkan"
        } supplier "${supplier.namaSupplier}"?`}
        confirmLabel={newStatus === "aktif" ? "Aktifkan" : "Nonaktifkan"}
        cancelLabel="Batal"
        isLoading={changeStatusMutation.isPending}
        onConfirm={handleChangeStatus}
        onCancel={() => setShowStatusModal(false)}
        confirmButtonClassName={
          newStatus === "aktif"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-orange-600 hover:bg-orange-700"
        }
      />
    </div>
  );
};

export default SupplierDetail;
