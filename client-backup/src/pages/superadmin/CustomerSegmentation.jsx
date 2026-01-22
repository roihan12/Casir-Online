import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Users,
  ShoppingBag,
  Heart,
  Filter,
  RefreshCw,
  Edit,
  Save,
  X,
  Plus,
  AlertTriangle,
  Check,
  Search,
  Trash,
  Play,
  UserPlus,
  Settings,
  Calendar,
  DollarSign,
} from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth.js";
import { toast } from "react-hot-toast";
import pelangganService from "../../services/pelangganService";
import loyaltyService from "../../services/loyaltyService";
import Modal from "../../features/common/Modal.jsx";
import Table from "../../features/common/Table.jsx";

const CustomerSegmentation = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole("super_admin");

  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [segmentRules, setSegmentRules] = useState([]);
  const [segmentStats, setSegmentStats] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Segment data
  const [segments, setSegments] = useState([
    {
      id: "retail",
      name: "Retail",
      description: "Pelanggan perorangan dengan volume pembelian rendah",
      color: "bg-gray-100 text-gray-800",
      icon: <ShoppingBag className="h-5 w-5 text-gray-600" />,
      count: 0,
      minPurchase: 0,
      maxPurchase: 1000000,
      rules: ["Pembelian di bawah Rp 1.000.000", "Tidak ada kriteria khusus"],
    },
    {
      id: "grosir",
      name: "Grosir",
      description: "Pelanggan dengan volume pembelian menengah",
      color: "bg-blue-100 text-blue-800",
      icon: <ShoppingBag className="h-5 w-5 text-blue-600" />,
      count: 0,
      minPurchase: 1000000,
      maxPurchase: 10000000,
      rules: [
        "Pembelian Rp 1.000.000 - Rp 10.000.000",
        "Frekuensi belanja minimal 2x dalam sebulan",
      ],
    },
    {
      id: "vip",
      name: "VIP",
      description: "Pelanggan premium dengan volume pembelian tinggi",
      color: "bg-purple-100 text-purple-800",
      icon: <Heart className="h-5 w-5 text-purple-600" />,
      count: 0,
      minPurchase: 10000000,
      maxPurchase: null,
      rules: [
        "Pembelian di atas Rp 10.000.000",
        "Pelanggan berlangganan minimal 6 bulan",
      ],
    },
  ]);

  // Form state for editing segment
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    description: "",
    minPurchase: 0,
    maxPurchase: 0,
    rules: [],
  });

  // New rule state
  const [newRule, setNewRule] = useState("");

  // Form state for segment rule
  const [formSegment, setFormSegment] = useState({
    name: "",
    description: "",
    criteria: "transaction_amount",
    value: "",
    segmentType: "retail", // Default segment type
    isActive: true,
  });

  // Load initial data
  useEffect(() => {
    loadSegmentRules();
    loadCustomerList();
  }, []);

  const loadSegmentRules = async () => {
    try {
      setIsLoading(true);
      const rulesData = await loyaltyService.getSegmentRules();
      setSegmentRules(rulesData || []);

      // Calculate segment statistics
      calculateSegmentStats();
    } catch (error) {
      console.error("Error loading segment rules:", error);
      toast.error("Gagal memuat aturan segmentasi");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadCustomerList = async () => {
    try {
      const response = await pelangganService.getAllPelanggan(
        searchQuery,
        currentPage,
        itemsPerPage
      );

      const customerData = Array.isArray(response.data) ? response.data : [];
      setCustomers(customerData);
      setTotalItems(response.total || customerData.length);

      // Apply segment filter if any
      if (selectedSegment) {
        filterCustomersBySegment(selectedSegment, customerData);
      }
    } catch (error) {
      console.error("Error loading customer list:", error);
      toast.error("Gagal memuat data pelanggan");
    }
  };

  const filterCustomersBySegment = (segment, customerList) => {
    const filtered = (customerList || customers).filter(
      (customer) => customer.segmen === segment.id
    );
    setCustomers(filtered);
  };

  const calculateSegmentStats = () => {
    if (!customers || customers.length === 0) return;

    const stats = {
      total: customers.length,
      retail: customers.filter((c) => c.segmen === "retail").length,
      grosir: customers.filter((c) => c.segmen === "grosir").length,
      vip: customers.filter((c) => c.segmen === "vip").length,
    };

    setSegmentStats(stats);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSegmentRules();
    loadCustomerList();
  };

  const runSegmentation = async () => {
    try {
      setIsRefreshing(true);
      await loyaltyService.runSegmentation();
      toast.success("Segmentasi pelanggan berhasil dijalankan");
      handleRefresh();
    } catch (error) {
      console.error("Error running segmentation:", error);
      toast.error("Gagal menjalankan segmentasi pelanggan");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditSegment = (segment) => {
    setSelectedSegment(segment);
    setFormSegment({
      name: segment.name,
      description: segment.description,
      criteria: segment.criteria,
      value: segment.value,
      segmentType: segment.segmentType,
      isActive: segment.isActive,
    });
    setShowEditModal(true);
  };

  const handleDeleteSegment = (segment) => {
    setSelectedSegment(segment);
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "minPurchase" || name === "maxPurchase") {
      setEditForm({
        ...editForm,
        [name]: parseInt(value) || 0,
      });
    } else {
      setEditForm({
        ...editForm,
        [name]: value,
      });
    }
  };

  const handleAddRule = () => {
    if (newRule.trim()) {
      setEditForm({
        ...editForm,
        rules: [...editForm.rules, newRule],
      });
      setNewRule("");
    }
  };

  const handleRemoveRule = (index) => {
    const updatedRules = [...editForm.rules];
    updatedRules.splice(index, 1);
    setEditForm({
      ...editForm,
      rules: updatedRules,
    });
  };

  const handleSaveSegment = () => {
    const updatedSegments = segments.map((segment) => {
      if (segment.id === editForm.id) {
        return {
          ...segment,
          name: editForm.name,
          description: editForm.description,
          minPurchase: editForm.minPurchase,
          maxPurchase: editForm.maxPurchase === 0 ? null : editForm.maxPurchase,
          rules: editForm.rules,
        };
      }
      return segment;
    });

    setSegments(updatedSegments);
    setShowEditModal(false);
    toast.success("Segmen berhasil diperbarui");

    // In a real application, you would save this to the backend
    // await pelangganService.updateSegment(editForm.id, editForm);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const getFilteredCustomers = () => {
    if (!searchQuery) return [];

    return customers
      .filter(
        (customer) =>
          customer.namaPelanggan
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.telepon?.includes(searchQuery)
      )
      .slice(0, 5); // Limiting to 5 results for simplicity
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSegmentTypeDisplay = (type) => {
    switch (type) {
      case "retail":
        return "Retail";
      case "grosir":
        return "Grosir";
      case "vip":
        return "VIP";
      default:
        return type;
    }
  };

  const getSegmentCriteriaDisplay = (criteria) => {
    switch (criteria) {
      case "transaction_amount":
        return "Total Transaksi";
      case "transaction_count":
        return "Jumlah Transaksi";
      case "last_transaction":
        return "Terakhir Transaksi";
      case "points":
        return "Poin Loyalitas";
      default:
        return criteria;
    }
  };

  const getSegmentBadgeClass = (type) => {
    switch (type) {
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

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Segmentasi Pelanggan
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Kelola aturan segmentasi pelanggan dan jalankan segmentasi otomatis
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Pelanggan
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {segmentStats.total || 0}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-indigo-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pelanggan VIP</p>
              <p className="text-2xl font-semibold text-purple-600">
                {segmentStats.vip || 0}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Heart className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Pelanggan Grosir
              </p>
              <p className="text-2xl font-semibold text-blue-600">
                {segmentStats.grosir || 0}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Pelanggan Retail
              </p>
              <p className="text-2xl font-semibold text-gray-600">
                {segmentStats.retail || 0}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Segmentation Rules */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Aturan Segmentasi
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Tentukan kriteria untuk masing-masing segmen pelanggan
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isRefreshing ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Muat Ulang
            </button>

            <button
              onClick={() => {
                setSelectedSegment(null);
                setFormSegment({
                  name: "",
                  description: "",
                  criteria: "transaction_amount",
                  value: "",
                  segmentType: "retail",
                  isActive: true,
                });
                setShowEditModal(true);
              }}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Aturan
            </button>

            <button
              onClick={runSegmentation}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                isRefreshing ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isRefreshing}
            >
              <Play
                className={`h-4 w-4 mr-2 ${
                  isRefreshing ? "animate-pulse" : ""
                }`}
              />
              Jalankan Segmentasi
            </button>
          </div>
        </div>

        {/* Segment Rules Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-500">Memuat data...</p>
            </div>
          ) : segmentRules.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-2 text-sm text-gray-500">
                Belum ada aturan segmentasi yang ditambahkan
              </p>
              <button
                onClick={() => {
                  setSelectedSegment(null);
                  setShowEditModal(true);
                }}
                className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Aturan Segmentasi
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Aturan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Segmen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kriteria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nilai
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {segmentRules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {rule.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {rule.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSegmentBadgeClass(
                          rule.segmentType
                        )}`}
                      >
                        {getSegmentTypeDisplay(rule.segmentType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getSegmentCriteriaDisplay(rule.criteria)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.criteria === "transaction_amount"
                        ? `Rp ${parseInt(rule.value).toLocaleString("id-ID")}`
                        : rule.criteria === "transaction_count"
                        ? `${rule.value} transaksi`
                        : rule.criteria === "last_transaction"
                        ? `${rule.value} hari terakhir`
                        : rule.criteria === "points"
                        ? `${rule.value} poin`
                        : rule.value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rule.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {rule.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditSegment(rule)}
                        className="text-amber-600 hover:text-amber-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSegment(rule)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Segment Rule Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={
          selectedSegment
            ? "Edit Aturan Segmentasi"
            : "Tambah Aturan Segmentasi"
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveSegmentRule(e);
          }}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Nama Aturan
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Nama aturan segmentasi"
                value={formSegment.name}
                onChange={(e) => {
                  setFormSegment({
                    ...formSegment,
                    name: e.target.value,
                  });
                }}
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Deskripsi
              </label>
              <textarea
                name="description"
                id="description"
                rows="2"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Deskripsi singkat tentang aturan segmentasi"
                value={formSegment.description}
                onChange={(e) => {
                  setFormSegment({
                    ...formSegment,
                    description: e.target.value,
                  });
                }}
              ></textarea>
            </div>

            <div>
              <label
                htmlFor="segmentType"
                className="block text-sm font-medium text-gray-700"
              >
                Tipe Segmen
              </label>
              <select
                name="segmentType"
                id="segmentType"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formSegment.segmentType}
                onChange={(e) => {
                  setFormSegment({
                    ...formSegment,
                    segmentType: e.target.value,
                  });
                }}
              >
                <option value="retail">Retail</option>
                <option value="grosir">Grosir</option>
                <option value="vip">VIP</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="criteria"
                className="block text-sm font-medium text-gray-700"
              >
                Kriteria
              </label>
              <select
                name="criteria"
                id="criteria"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formSegment.criteria}
                onChange={(e) => {
                  setFormSegment({
                    ...formSegment,
                    criteria: e.target.value,
                  });
                }}
              >
                <option value="transaction_amount">Total Transaksi</option>
                <option value="transaction_count">Jumlah Transaksi</option>
                <option value="last_transaction">Terakhir Transaksi</option>
                <option value="points">Poin Loyalitas</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="value"
                className="block text-sm font-medium text-gray-700"
              >
                Nilai
              </label>
              <input
                type="text"
                name="value"
                id="value"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={
                  formSegment.criteria === "transaction_amount"
                    ? "Jumlah transaksi dalam Rupiah"
                    : formSegment.criteria === "transaction_count"
                    ? "Jumlah transaksi"
                    : formSegment.criteria === "last_transaction"
                    ? "Jumlah hari"
                    : "Jumlah poin"
                }
                value={formSegment.value}
                onChange={(e) => {
                  setFormSegment({
                    ...formSegment,
                    value: e.target.value,
                  });
                }}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={formSegment.isActive}
                onChange={(e) => {
                  setFormSegment({
                    ...formSegment,
                    isActive: e.target.checked,
                  });
                }}
              />
              <label
                htmlFor="isActive"
                className="ml-2 block text-sm text-gray-900"
              >
                Aturan Aktif
              </label>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="submit"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
            >
              {selectedSegment ? "Perbarui" : "Simpan"}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              onClick={() => setShowEditModal(false)}
            >
              Batal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerSegmentation;
