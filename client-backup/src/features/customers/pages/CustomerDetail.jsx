import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Heart,
  Tag,
  ShoppingCart,
  Package,
  Clock,
  DollarSign,
  RefreshCw,
  Gift,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { toast } from "react-hot-toast";
import pelangganService from "../services/pelangganService";
import Modal from "../../common/Modal.jsx";
import Table from "../../common/Table.jsx";

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole("super_admin");

  const [customer, setCustomer] = useState(null);
  const [loyaltyHistory, setLoyaltyHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load customer data from API
  useEffect(() => {
    loadCustomerData();
  }, [id]);

  const loadCustomerData = async () => {
    try {
      setIsLoading(true);
      // Get customer details
      const customerData = await pelangganService.getPelangganById(id);
      setCustomer(customerData);

      // Get loyalty history
      try {
        const loyaltyData = await pelangganService.getLoyaltyPointHistory(id);
        setLoyaltyHistory(loyaltyData);
      } catch (error) {
        console.error("Error loading loyalty history:", error);
        setLoyaltyHistory([]);
      }

      // In a real application, get transaction history
      // This would be a separate API call to get transactions for this customer
      setTransactions([]);
    } catch (error) {
      console.error("Error loading customer details:", error);
      toast.error("Gagal memuat data pelanggan");
      navigate("/customers");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCustomerData();
  };

  // Handle edit customer
  const handleEditCustomer = () => {
    navigate(`/customers/edit/${id}`);
  };

  // Handle delete customer
  const handleDeleteCustomer = () => {
    setShowDeleteModal(true);
  };

  // Confirm delete customer
  const confirmDeleteCustomer = async () => {
    try {
      await pelangganService.deletePelanggan(id);
      setShowDeleteModal(false);
      toast.success("Pelanggan berhasil dihapus");
      navigate("/customers");
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Gagal menghapus pelanggan");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  // Get gender display
  const getGenderDisplay = (gender) => {
    switch (gender) {
      case "pria":
        return "Pria";
      case "wanita":
        return "Wanita";
      case "lainnya":
        return "Lainnya";
      default:
        return "-";
    }
  };

  // Get segment display
  const getSegmentDisplay = (segment) => {
    switch (segment) {
      case "retail":
        return "Retail";
      case "grosir":
        return "Grosir";
      case "vip":
        return "VIP";
      default:
        return "-";
    }
  };

  // Get segment badge class
  const getSegmentBadgeClass = (segment) => {
    switch (segment) {
      case "retail":
        return "bg-gray-100 text-gray-800";
      case "grosir":
        return "bg-blue-100 text-blue-800";
      case "vip":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Loyalty history table columns
  const loyaltyColumns = [
    {
      header: "Tanggal",
      accessor: "createdAt",
      cell: (row) => formatDateTime(row.createdAt),
    },
    {
      header: "Transaksi",
      accessor: "transaksiId",
      cell: (row) => (
        <div className="flex items-center">
          {row.transaksiId ? (
            <Link
              to={`/superadmin/transactions/${row.transaksiId}`}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              <span>{row.transaksiId.substring(0, 8)}...</span>
            </Link>
          ) : (
            <span className="text-gray-500">-</span>
          )}
        </div>
      ),
    },
    {
      header: "Poin Sebelumnya",
      accessor: "pointSebelumnya",
      cell: (row) => (
        <div className="flex items-center">
          <Heart className="h-4 w-4 text-gray-400 mr-1" />
          <span>{row.pointSebelumnya}</span>
        </div>
      ),
    },
    {
      header: "Perubahan",
      accessor: "pointDidapatkan",
      cell: (row) => (
        <div className="flex items-center">
          <span
            className={
              row.pointDidapatkan > 0
                ? "text-green-600"
                : row.pointDidapatkan < 0
                ? "text-red-600"
                : "text-gray-600"
            }
          >
            {row.pointDidapatkan > 0
              ? `+${row.pointDidapatkan}`
              : row.pointDidapatkan}
          </span>
        </div>
      ),
    },
    {
      header: "Poin Akhir",
      accessor: "pointAkhir",
      cell: (row) => (
        <div className="flex items-center">
          <Heart className="h-4 w-4 text-red-400 mr-1" />
          <span>{row.pointAkhir}</span>
        </div>
      ),
    },
    {
      header: "Keterangan",
      accessor: "keterangan",
      cell: (row) => (
        <div className="text-sm text-gray-600">{row.keterangan || "-"}</div>
      ),
    },
  ];

  // Transactions table columns (would be populated from API in a real application)
  const transactionColumns = [
    {
      header: "Tanggal",
      accessor: "tanggal",
      cell: (row) => formatDateTime(row.tanggal),
    },
    {
      header: "No. Transaksi",
      accessor: "nomor_transaksi",
      cell: (row) => (
        <Link
          to={`/superadmin/transactions/${row.transaksi_id}`}
          className="text-blue-600 hover:text-blue-800"
        >
          {row.nomor_transaksi}
        </Link>
      ),
    },
    {
      header: "Produk",
      accessor: "jumlah_produk",
      cell: (row) => (
        <div className="flex items-center">
          <Package className="h-4 w-4 text-gray-400 mr-1" />
          <span>{row.jumlah_produk || 0} item</span>
        </div>
      ),
    },
    {
      header: "Total",
      accessor: "total",
      cell: (row) => (
        <div className="font-medium">{formatCurrency(row.total)}</div>
      ),
    },
    {
      header: "Status",
      accessor: "status_pembayaran",
      cell: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.status_pembayaran === "LUNAS"
              ? "bg-green-100 text-green-800"
              : row.status_pembayaran === "BELUM_LUNAS"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.status_pembayaran === "LUNAS"
            ? "Lunas"
            : row.status_pembayaran === "BELUM_LUNAS"
            ? "Belum Lunas"
            : "Dibatalkan"}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Data pelanggan tidak ditemukan
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/customers")}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Daftar Pelanggan
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/customers")}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Detail Pelanggan
          </h1>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-full hover:bg-gray-100 ${
              isRefreshing ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-5 w-5 text-gray-600 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
          </button>
          <button
            onClick={handleEditCustomer}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button
            onClick={handleDeleteCustomer}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Trash className="h-4 w-4 mr-2 text-red-500" />
            Hapus
          </button>
        </div>
      </div>

      {/* Customer header card */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex items-start">
            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <User className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-6">
              <h2 className="text-xl font-bold text-gray-900">
                {customer.namaPelanggan}
              </h2>
              <div className="mt-1 flex items-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${getSegmentBadgeClass(
                    customer.segmen
                  )}`}
                >
                  {getSegmentDisplay(customer.segmen)}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    customer.status === "aktif"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {customer.status === "aktif" ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap">
                {customer.cabang && (
                  <div className="flex items-center mr-6 mb-2">
                    <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600">
                      {customer.cabang.namaCabang}
                    </span>
                  </div>
                )}
                {customer.telepon && (
                  <div className="flex items-center mr-6 mb-2">
                    <Phone className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600">
                      {customer.telepon}
                    </span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center mr-6 mb-2">
                    <Mail className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600">
                      {customer.email}
                    </span>
                  </div>
                )}
                {customer.tanggalLahir && (
                  <div className="flex items-center mr-6 mb-2">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600">
                      {formatDate(customer.tanggalLahir)}
                    </span>
                  </div>
                )}
                <div className="flex items-center mb-2">
                  <Heart className="h-4 w-4 text-red-400 mr-1" />
                  <span className="text-sm text-gray-600">
                    {customer.poin || 0} poin
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "info"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("info")}
          >
            <User className="h-4 w-4 inline mr-2" />
            Informasi
          </button>
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "transactions"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("transactions")}
          >
            <ShoppingCart className="h-4 w-4 inline mr-2" />
            Riwayat Transaksi
          </button>
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "loyalty"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("loyalty")}
          >
            <Gift className="h-4 w-4 inline mr-2" />
            Riwayat Poin
          </button>
        </nav>
      </div>

      {/* Tab content */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {activeTab === "info" && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Informasi Pelanggan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Nama Lengkap
                  </h4>
                  <p className="text-base text-gray-900">
                    {customer.namaPelanggan}
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Jenis Kelamin
                  </h4>
                  <p className="text-base text-gray-900">
                    {getGenderDisplay(customer.gender)}
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Tanggal Lahir
                  </h4>
                  <p className="text-base text-gray-900">
                    {formatDate(customer.tanggalLahir)}
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Nomor Telepon
                  </h4>
                  <p className="text-base text-gray-900">
                    {customer.telepon || "-"}
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Email
                  </h4>
                  <p className="text-base text-gray-900">
                    {customer.email || "-"}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Cabang
                  </h4>
                  <p className="text-base text-gray-900">
                    {customer.cabang?.namaCabang || "Kantor Pusat"}
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Alamat
                  </h4>
                  <p className="text-base text-gray-900">
                    {customer.alamat || "-"}
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Segmen Pelanggan
                  </h4>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSegmentBadgeClass(
                      customer.segmen
                    )}`}
                  >
                    {getSegmentDisplay(customer.segmen)}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Poin Loyalitas
                  </h4>
                  <div className="flex items-center">
                    <Heart className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-base text-gray-900 font-medium">
                      {customer.poin || 0} poin
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Status
                  </h4>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      customer.status === "aktif"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {customer.status === "aktif" ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Riwayat Transaksi
              </h3>
            </div>

            {transactions.length > 0 ? (
              <Table
                columns={transactionColumns}
                data={transactions}
                isLoading={false}
              />
            ) : (
              <div className="bg-gray-50 py-8 px-4 rounded-lg">
                <div className="text-center">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Belum ada transaksi
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Pelanggan ini belum memiliki riwayat transaksi.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "loyalty" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Riwayat Poin Loyalitas
              </h3>
            </div>

            {loyaltyHistory.length > 0 ? (
              <Table
                columns={loyaltyColumns}
                data={loyaltyHistory}
                isLoading={false}
              />
            ) : (
              <div className="bg-gray-50 py-8 px-4 rounded-lg">
                <div className="text-center">
                  <Gift className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Belum ada riwayat poin
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Pelanggan ini belum memiliki riwayat poin loyalitas.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Hapus Pelanggan"
      >
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Apakah Anda yakin ingin menghapus pelanggan{" "}
            <span className="font-semibold">{customer.namaPelanggan}</span>?
            Semua data pelanggan termasuk riwayat transaksi dan poin akan tetap
            tersimpan, tetapi pelanggan tidak akan dapat melakukan transaksi
            baru.
          </p>
        </div>
        <div className="mt-4 flex justify-end space-x-3">
          <button
            type="button"
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => setShowDeleteModal(false)}
          >
            Batal
          </button>
          <button
            type="button"
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={confirmDeleteCustomer}
          >
            Hapus
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerDetail;
