import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  Percent,
  Settings,
  User,
  Building,
  Save,
  X,
  TrendingUp,
  AlertTriangle,
  Package,
  DollarSign,
  Users,
} from "lucide-react";
import cabangService from "../services/cabangService";
import dashboardService from "../../dashboard/services/dashboardService";
import userService from "../../users/services/userService";
import transaksiService from "../../transactions/services/transaksiService";
import produkService from "../../products/services/produkService";
import {
  getOperationalHours,
  updateOperationalHours,
} from "../../../services/operationalHoursService";
import Input from "../../common/Input";
import Modal from "../../common/Modal";
import formatCurrency from "../../../common/utils/formatCurrency";
import SalesTrendChart from "../../common/SalesTrendChart";
import ChartCategoryDistribution from "../../common/ChartCategoryDistribution";
import PaymentMethodChart from "../../common/PaymentMethodChart";

const CabangDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cabang, setCabang] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard"); // Changed default to dashboard
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // New Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [inventorySummary, setInventorySummary] = useState(null);

  // Form state for different tabs
  const [generalInfo, setGeneralInfo] = useState({
    namaCabang: "",
    alamat: "",
    telepon: "",
    email: "",
    kodePos: "",
    kota: "",
    provinsi: "",
    latitude: "",
    longitude: "",
    radiusGeofence: "",
    status: "aktif",
  });

  const [jamOperasional, setJamOperasional] = useState({
    senin: { buka: true, jamBuka: "08:00", jamTutup: "21:00" },
    selasa: { buka: true, jamBuka: "08:00", jamTutup: "21:00" },
    rabu: { buka: true, jamBuka: "08:00", jamTutup: "21:00" },
    kamis: { buka: true, jamBuka: "08:00", jamTutup: "21:00" },
    jumat: { buka: true, jamBuka: "08:00", jamTutup: "21:00" },
    sabtu: { buka: true, jamBuka: "08:00", jamTutup: "21:00" },
    minggu: { buka: true, jamBuka: "08:00", jamTutup: "21:00" },
  });

  const [pengaturanPajak, setPengaturanPajak] = useState({
    pajakAktif: false,
    persentasePajak: 10,
    namaPajak: "PPN",
    includeServiceCharge: false,
    persentaseServiceCharge: 5,
  });

  // Load cabang data
  useEffect(() => {
    const loadCabangDetail = async () => {
      try {
        setIsLoading(true);
        const [cabangData, hoursData] = await Promise.all([
          cabangService.getCabangById(id),
          getOperationalHours(id),
        ]);

        setCabang(cabangData);
        setJamOperasional(hoursData);

        // Initialize form state with cabang data
        setGeneralInfo({
          namaCabang: cabangData.namaCabang || "",
          alamat: cabangData.alamat || "",
          telepon: cabangData.telepon || "",
          email: cabangData.email || "",
          kodePos: cabangData.kodePos || "",
          kota: cabangData.kota || "",
          provinsi: cabangData.provinsi || "",
          latitude: cabangData.latitude ? String(cabangData.latitude) : "",
          longitude: cabangData.longitude ? String(cabangData.longitude) : "",
          radiusGeofence: cabangData.radiusGeofence
            ? String(cabangData.radiusGeofence)
            : "",
          status: cabangData.status || "aktif",
        });

        // Initialize pengaturan pajak if exists
        if (cabangData.pengaturanPajak) {
          setPengaturanPajak(cabangData.pengaturanPajak);
        }

        // Fetch comprehensive data
        try {
          const [dashData, transRes, usersRes] = await Promise.all([
            dashboardService.getDashboardData(id),
            transaksiService.getTransaksiList({ cabangId: id, limit: 10 }),
            userService.getUserList({ cabangId: id }),
          ]);

          setDashboardData(dashData);
          setTransactions(transRes.data?.data || transRes.data || []);
          setStaffList(usersRes.data || usersRes || []);
        } catch (error) {
          console.error("Error fetching comprehensive data:", error);
        }
      } catch (error) {
        console.error("Error loading cabang detail:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadCabangDetail();
    }
  }, [id]);


  // Handle general info changes
  const handleGeneralInfoChange = (e) => {
    const { name, value } = e.target;
    setGeneralInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
    setUnsavedChanges(true);
  };

  // Handle jam operasional changes
  const handleJamOperasionalChange = (hari, field, value) => {
    setJamOperasional((prev) => ({
      ...prev,
      [hari]: {
        ...prev[hari],
        [field]: value,
      },
    }));
    setUnsavedChanges(true);
  };

  // Handle pajak changes
  const handlePajakChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPengaturanPajak((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setUnsavedChanges(true);
  };

  // Handle save
  const handleSave = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        cabangService.updateCabang(id, generalInfo),
        updateOperationalHours(id, jamOperasional),
      ]);

      setUnsavedChanges(false);
      // Show success message
      setModalContent({
        title: "Sukses",
        message: "Data cabang berhasil disimpan",
        type: "success",
      });
      setShowModal(true);
    } catch (error) {
      console.error("Error saving cabang:", error);
      // Show error message
      setModalContent({
        title: "Error",
        message: "Gagal menyimpan data cabang",
        type: "error",
      });
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back navigation with unsaved changes check
  const handleBack = () => {
    if (unsavedChanges) {
      setModalContent({
        title: "Konfirmasi",
        message:
          "Ada perubahan yang belum disimpan. Apakah Anda yakin ingin kembali?",
        type: "confirm",
        onConfirm: () => navigate("/cabang"),
      });
      setShowModal(true);
    } else {
      navigate("/cabang");
    }
  };

  if (isLoading && !cabang) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Detail Cabang: {cabang?.namaCabang}
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            disabled={isLoading || !unsavedChanges}
            className={`px-4 py-2 rounded-lg flex items-center ${
              !unsavedChanges
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            <Save className="h-5 w-5 mr-2" />
            Simpan
          </button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="mb-6">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            generalInfo.status === "aktif"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          Status: {generalInfo.status === "aktif" ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === "dashboard"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <TrendingUp className="inline-block h-5 w-5 mr-2" />
            Ringkasan
          </button>
          <button
            onClick={() => setActiveTab("general")}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === "general"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Building className="inline-block h-5 w-5 mr-2" />
            Informasi Umum
          </button>
          <button
            onClick={() => setActiveTab("financial")}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === "financial"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <DollarSign className="inline-block h-5 w-5 mr-2" />
            Keuangan
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === "inventory"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Package className="inline-block h-5 w-5 mr-2" />
            Inventori
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === "staff"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Users className="inline-block h-5 w-5 mr-2" />
            Pegawai & Shift
          </button>
          <button
            onClick={() => setActiveTab("hours")}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === "hours"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Clock className="inline-block h-5 w-5 mr-2" />
            Jam Operasional
          </button>
          <button
            onClick={() => setActiveTab("tax")}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === "tax"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Percent className="inline-block h-5 w-5 mr-2" />
            Pajak & Biaya
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Omzet Card */}
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Omzet Hari Ini</p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-900">
                      {formatCurrency(
                        dashboardData?.salesSummary?.daily?._sum?.total || 0
                      )}
                    </h3>
                    <p
                      className={`text-xs mt-1 ${
                        (dashboardData?.salesSummary?.daily?.percentageChange ||
                          0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {(
                        dashboardData?.salesSummary?.daily?.percentageChange ||
                        0
                      ).toFixed(1)}
                      % dari kemarin
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <DollarSign size={20} />
                  </div>
                </div>
              </div>

              {/* Transaksi Card */}
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Total Transaksi</p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-900">
                      {dashboardData?.transactionCounts?.today || 0}
                    </h3>
                    <p className="text-xs mt-1 text-gray-500">
                      Hari ini, {dashboardData?.transactionCounts?.hourlyRate || 0}/jam
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <TrendingUp size={20} />
                  </div>
                </div>
              </div>

              {/* Stok Alert Card */}
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Perhatian Stok</p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-900">
                      {(dashboardData?.criticalAlerts?.lowStockProducts
                        ?.count || 0) +
                        (dashboardData?.criticalAlerts?.expiringStock?.count ||
                          0)}
                    </h3>
                    <p className="text-xs mt-1 text-red-600">
                      {dashboardData?.criticalAlerts?.lowStockProducts?.count ||
                        0}{" "}
                      Menipis
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                    <AlertTriangle size={20} />
                  </div>
                </div>
              </div>

              {/* Staff/Shift Card */}
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Shift Aktif</p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-900">
                      {dashboardData?.staffActivity?.openShifts?.count || 0}
                    </h3>
                    <p className="text-xs mt-1 text-gray-500">
                      {dashboardData?.staffActivity?.activeUsers?.total || 0}{" "}
                      User Online
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-50 text-green-600">
                    <Users size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SalesTrendChart
                  isGlobalView={false}
                  cabang={cabang?.namaCabang}
                  revenueTimeSeries={dashboardData?.revenueTimeSeries}
                />
              </div>
              <div>
                <PaymentMethodChart
                  isGlobalView={false}
                  cabang={cabang?.namaCabang}
                  paymentMethods={dashboardData?.paymentMethods}
                />
              </div>
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={() => setActiveTab('financial')}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    Lihat Laporan Lengkap &rarr;
                </button>
            </div>
          </div>
        )}

        {/* General Information */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informasi Cabang
              </h3>
              <Input
                label="Nama Cabang"
                id="namaCabang"
                name="namaCabang"
                value={generalInfo.namaCabang}
                onChange={handleGeneralInfoChange}
                required
              />
              <div className="mb-5">
                <label
                  htmlFor="alamat"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Alamat
                </label>
                <textarea
                  id="alamat"
                  name="alamat"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={generalInfo.alamat}
                  onChange={handleGeneralInfoChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Kota"
                  id="kota"
                  name="kota"
                  value={generalInfo.kota}
                  onChange={handleGeneralInfoChange}
                />
                <Input
                  label="Provinsi"
                  id="provinsi"
                  name="provinsi"
                  value={generalInfo.provinsi}
                  onChange={handleGeneralInfoChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Kode Pos"
                  id="kodePos"
                  name="kodePos"
                  value={generalInfo.kodePos}
                  onChange={handleGeneralInfoChange}
                />
                <Input
                  label="Telepon"
                  id="telepon"
                  name="telepon"
                  value={generalInfo.telepon}
                  onChange={handleGeneralInfoChange}
                />
              </div>
              <Input
                label="Email"
                id="email"
                name="email"
                type="email"
                value={generalInfo.email}
                onChange={handleGeneralInfoChange}
              />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Lokasi & Status
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    Geolokasi
                  </h4>
                  <button
                    type="button"
                    className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded flex items-center"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    Pilih di Peta
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Latitude"
                    id="latitude"
                    name="latitude"
                    value={generalInfo.latitude}
                    onChange={handleGeneralInfoChange}
                  />
                  <Input
                    label="Longitude"
                    id="longitude"
                    name="longitude"
                    value={generalInfo.longitude}
                    onChange={handleGeneralInfoChange}
                  />
                </div>

                <Input
                  label="Radius Geofence (meter)"
                  id="radiusGeofence"
                  name="radiusGeofence"
                  type="number"
                  value={generalInfo.radiusGeofence}
                  onChange={handleGeneralInfoChange}
                />

                {/* Show mini map preview here */}
                <div className="h-40 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-gray-400" />
                  <span className="ml-2 text-gray-500">Peta Preview</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status Cabang
                </label>
                <select
                  id="status"
                  name="status"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={generalInfo.status}
                  onChange={handleGeneralInfoChange}
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Non-aktif</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === "financial" && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Riwayat Transaksi Terakhir
            </h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waktu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.length > 0 ? (
                    transactions.map((trx) => (
                      <tr key={trx.transaksi_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {String(trx.nomor_transaksi)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(trx.created_at).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(trx.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              trx.status_pembayaran === "LUNAS"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {trx.status_pembayaran}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Belum ada data transaksi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Produk Terlaris
                </h3>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Produk
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Terjual
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Pendapatan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dashboardData?.productPerformance?.length > 0 ? (
                        dashboardData.productPerformance.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 text-right">
                              {item.quantitySold}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                              {formatCurrency(item.revenue)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="3"
                            className="px-4 py-6 text-center text-sm text-gray-500"
                          >
                            Belum ada data penjualan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  Peringatan Stok
                </h3>
                <div className="bg-white border rounded-lg overflow-hidden">
                  {dashboardData?.criticalAlerts?.lowStockProducts?.details
                    ?.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">
                            Produk
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-red-700 uppercase">
                            Sisa Stok
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {dashboardData.criticalAlerts.lowStockProducts.details.map(
                          (item, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {item.produkMaster?.namaProduk}
                              </td>
                              <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">
                                {item.stok} (Min: {item.minStok})
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                        <Package className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-gray-500">Stok aman terkendali</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
             <div className="bg-blue-50 p-4 rounded-lg flex items-start">
                  <div className="flex-shrink-0">
                    <Package className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Ringkasan Inventori</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Total Produk Sehat: <span className="font-bold">{dashboardData?.stockHealth?.healthy?.count || 0} SKU</span> • 
                        Overstock: <span className="font-bold">{dashboardData?.stockHealth?.overstock?.count || 0} SKU</span> • 
                        Out of Stock: <span className="font-bold">{dashboardData?.stockHealth?.outOfStock?.count || 0} SKU</span>
                      </p>
                    </div>
                  </div>
                </div>
          </div>
        )}

        {/* Staff Tab */}
        {activeTab === "staff" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Shifts */}
              <div className="lg:col-span-1">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Shift Aktif Saat Ini
                </h3>
                {dashboardData?.staffActivity?.openShifts?.details?.length >
                0 ? (
                  <div className="space-y-4">
                    {dashboardData.staffActivity.openShifts.details.map(
                      (shift) => (
                        <div
                          key={shift.id}
                          className="bg-green-50 border border-green-200 rounded-lg p-4"
                        >
                          <div className="flex items-center mb-2">
                            <div className="h-8 w-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold mr-3">
                              {shift.user?.namaLengkap?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {shift.user?.namaLengkap}
                              </p>
                              <p className="text-xs text-green-700">
                                Kasir / Staff
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            <p>
                              Mulai:{" "}
                              {new Date(shift.waktuMulai).toLocaleTimeString(
                                "id-ID",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border rounded-lg p-6 text-center">
                    <p className="text-gray-500">Tidak ada shift aktif</p>
                  </div>
                )}
              </div>

              {/* Staff List */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Daftar Pegawai
                </h3>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nama
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {staffList.length > 0 ? (
                        staffList.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium mr-3">
                                  {user.namaLengkap?.charAt(0)}
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.namaLengkap}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.role?.namaRole || "Staff"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.status === "aktif"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {user.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="3"
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            Belum ada pegawai ditugaskan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Jam Operasional */}
        {activeTab === "hours" && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Jam Operasional
            </h3>
            <div className="grid gap-4">
              {Object.entries(jamOperasional).map(([hari, value]) => {
                const labelHari = {
                  senin: "Senin",
                  selasa: "Selasa",
                  rabu: "Rabu",
                  kamis: "Kamis",
                  jumat: "Jumat",
                  sabtu: "Sabtu",
                  minggu: "Minggu",
                }[hari];

                return (
                  <div
                    key={hari}
                    className="p-4 border rounded-lg flex items-center flex-wrap"
                  >
                    <div className="w-32">
                      <span className="font-medium">{labelHari}</span>
                    </div>
                    <div className="flex items-center ml-4">
                      <input
                        type="checkbox"
                        id={`${hari}-buka`}
                        checked={value.buka}
                        onChange={(e) =>
                          handleJamOperasionalChange(
                            hari,
                            "buka",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <label
                        htmlFor={`${hari}-buka`}
                        className="ml-2 text-sm text-gray-700"
                      >
                        Buka
                      </label>
                    </div>
                    <div
                      className={`flex items-center space-x-4 ml-8 ${
                        !value.buka ? "opacity-50" : ""
                      }`}
                    >
                      <div>
                        <label
                          htmlFor={`${hari}-jamBuka`}
                          className="block text-xs text-gray-500"
                        >
                          Jam Buka
                        </label>
                        <input
                          type="time"
                          id={`${hari}-jamBuka`}
                          value={value.jamBuka}
                          onChange={(e) =>
                            handleJamOperasionalChange(
                              hari,
                              "jamBuka",
                              e.target.value
                            )
                          }
                          disabled={!value.buka}
                          className="px-2 py-1 border rounded-md"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`${hari}-jamTutup`}
                          className="block text-xs text-gray-500"
                        >
                          Jam Tutup
                        </label>
                        <input
                          type="time"
                          id={`${hari}-jamTutup`}
                          value={value.jamTutup}
                          onChange={(e) =>
                            handleJamOperasionalChange(
                              hari,
                              "jamTutup",
                              e.target.value
                            )
                          }
                          disabled={!value.buka}
                          className="px-2 py-1 border rounded-md"
                        />
                      </div>
                    </div>
                    <div className="ml-auto">
                      <button
                        type="button"
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                        onClick={() => {
                          // Clone business hours from previous day
                          if (hari !== "senin") {
                            const prevHari = {
                              selasa: "senin",
                              rabu: "selasa",
                              kamis: "rabu",
                              jumat: "kamis",
                              sabtu: "jumat",
                              minggu: "sabtu",
                            }[hari];

                            if (prevHari) {
                              setJamOperasional((prev) => ({
                                ...prev,
                                [hari]: { ...prev[prevHari] },
                              }));
                              setUnsavedChanges(true);
                            }
                          }
                        }}
                      >
                        Salin dari hari sebelumnya
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-2">
                Pengaturan Hari Libur
              </h4>
              <button
                type="button"
                className="px-4 py-2 border border-indigo-500 text-indigo-600 rounded-lg hover:bg-indigo-50"
              >
                <Calendar className="h-4 w-4 inline-block mr-2" />
                Atur Hari Libur Khusus
              </button>
            </div>
          </div>
        )}

        {/* Pengaturan Pajak */}
        {activeTab === "tax" && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Pengaturan Pajak & Biaya
            </h3>

            <div className="bg-white rounded-lg border p-4 mb-4">
              <div className="flex items-start mb-4">
                <div className="flex items-center h-5">
                  <input
                    id="pajakAktif"
                    name="pajakAktif"
                    type="checkbox"
                    checked={pengaturanPajak.pajakAktif}
                    onChange={handlePajakChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="pajakAktif"
                    className="font-medium text-gray-700"
                  >
                    Aktifkan Pajak
                  </label>
                  <p className="text-gray-500">
                    Pajak akan ditambahkan otomatis ke semua transaksi
                  </p>
                </div>
              </div>

              <div
                className={`ml-7 space-y-4 ${
                  !pengaturanPajak.pajakAktif ? "opacity-50" : ""
                }`}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="namaPajak"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nama Pajak
                    </label>
                    <input
                      type="text"
                      id="namaPajak"
                      name="namaPajak"
                      value={pengaturanPajak.namaPajak}
                      onChange={handlePajakChange}
                      disabled={!pengaturanPajak.pajakAktif}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="PPN, Pajak Penjualan, dll"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="persentasePajak"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Persentase (%)
                    </label>
                    <input
                      type="number"
                      id="persentasePajak"
                      name="persentasePajak"
                      value={pengaturanPajak.persentasePajak}
                      onChange={handlePajakChange}
                      disabled={!pengaturanPajak.pajakAktif}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-start mb-4">
                <div className="flex items-center h-5">
                  <input
                    id="includeServiceCharge"
                    name="includeServiceCharge"
                    type="checkbox"
                    checked={pengaturanPajak.includeServiceCharge}
                    onChange={handlePajakChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="includeServiceCharge"
                    className="font-medium text-gray-700"
                  >
                    Aktifkan Service Charge
                  </label>
                  <p className="text-gray-500">
                    Service charge akan ditambahkan ke semua transaksi
                  </p>
                </div>
              </div>

              <div
                className={`ml-7 ${
                  !pengaturanPajak.includeServiceCharge ? "opacity-50" : ""
                }`}
              >
                <div>
                  <label
                    htmlFor="persentaseServiceCharge"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Persentase Service Charge (%)
                  </label>
                  <input
                    type="number"
                    id="persentaseServiceCharge"
                    name="persentaseServiceCharge"
                    value={pengaturanPajak.persentaseServiceCharge}
                    onChange={handlePajakChange}
                    disabled={!pengaturanPajak.includeServiceCharge}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 border rounded-lg bg-yellow-50">
              <h4 className="font-medium text-gray-800 mb-2">
                Catatan Penting
              </h4>
              <p className="text-sm text-gray-600">
                Konfigurasi pajak dan biaya akan memengaruhi semua transaksi di
                cabang ini. Pajak dan service charge akan ditambahkan secara
                otomatis ke subtotal pembelian.
              </p>
            </div>
          </div>
        )}


      </div>

      {/* Confirmation/Alert Modal */}
      {showModal && modalContent && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalContent.title}
        >
          <div className="p-6">
            <p className="text-gray-700 mb-4">{modalContent.message}</p>
            <div className="flex justify-end space-x-3">
              {modalContent.type === "confirm" ? (
                <>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      modalContent.onConfirm && modalContent.onConfirm();
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Ya, Lanjutkan
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-lg ${
                    modalContent.type === "success"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  } text-white`}
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CabangDetail;
