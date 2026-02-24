import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  RefreshCcw,
  Receipt,
  AlertTriangle,
  Search,
  ListFilter,
} from "lucide-react";
import { useTransactionDetail, useTransactionSummary, useAuditTrail } from "../hooks/useReports";
import { useUserBranches } from "../hooks/useUserBranches";
import formatCurrency from "@common/utils/formatCurrency";
import {
  Card,
  CardContent,
  ReportTabs,
  DataTable,
  StatusChip,
  LoadingIndicator,
  MetricCard,
  DateInput,
  FormSelect,
  Button,
  Divider,
} from "../components/ReportComponents";
import ExportDropdown from "../components/ExportDropdown";
import BranchMultiSelect from "../components/BranchMultiSelect";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const TransactionDetailReport = () => {
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [status, setStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Multi-branch selection
  const {
    availableBranches,
    selectedBranches,
    setSelectedBranches,
    cabangFilterParam,
    isDisabled,
  } = useUserBranches("transaction");

  // Format dates for API
  const apiParams = useMemo(() => {
    const formatDate = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const params = {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      cabangId: cabangFilterParam,
    };

    if (status !== "all") params.status = status;
    if (paymentMethod !== "all") params.metodePembayaran = paymentMethod;
    if (searchQuery) params.search = searchQuery;
    
    params.page = page;
    params.limit = limit;

    return params;
  }, [startDate, endDate, cabangFilterParam, status, paymentMethod, searchQuery, page, limit]);

  const summaryParams = useMemo(() => {
    const formatDate = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      cabangId: cabangFilterParam,
    };
  }, [startDate, endDate, cabangFilterParam]);

  // Fetch data
  const { data: detailData, isLoading: loadingDetail, refetch: refetchDetail } = useTransactionDetail(apiParams);
  const { data: summaryData, isLoading: loadingSummary, refetch: refetchSummary } = useTransactionSummary(summaryParams);
  const { data: auditData, isLoading: loadingAudit, refetch: refetchAudit } = useAuditTrail(summaryParams);

  const loading = loadingDetail || loadingSummary || loadingAudit;

  const handleRefreshData = () => {
    refetchDetail();
    refetchSummary();
    refetchAudit();
  };

  const formatDateFull = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const tabs = [
    { value: 0, label: "Detail Transaksi", icon: <Receipt size={16} /> },
    { value: 1, label: "Ringkasan", icon: <BarChart size={16} /> },
    { value: 2, label: "Audit Trail", icon: <AlertTriangle size={16} /> },
  ];

  const statusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "LUNAS", label: "Lunas" },
    { value: "BELUM_LUNAS", label: "Belum Lunas" },
    { value: "VOID", label: "Void" },
  ];

  const paymentOptions = [
    { value: "all", label: "Semua Metode" },
    { value: "TUNAI", label: "Tunai" },
    { value: "DEBIT", label: "Debit" },
    { value: "KREDIT", label: "Kredit" },
    { value: "TRANSFER", label: "Transfer" },
    { value: "QRIS", label: "QRIS" },
    { value: "E_WALLET", label: "E-Wallet" },
  ];

  // Extract data
  const transactions = detailData?.data || [];
  const pagination = detailData?.data?.pagination || { total: 0, pages: 1 };
  const summaryMetrics = summaryData?.data || {
    totalTransactions: 0,
    totalAmount: 0,
    avgTransaction: 0,
  };
  const byStatus = summaryData?.data?.byStatus || [];
  const auditTrail = auditData?.data || [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Laporan Detail Transaksi</h1>

      {/* Filter Section */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium flex items-center">
              <ListFilter className="mr-2" size={20} />
              Filter Laporan
            </h2>
            <div className="flex space-x-2">
              <Button onClick={handleRefreshData} icon={<RefreshCcw size={16} />}>
                Refresh
              </Button>
              <ExportDropdown
                reportType="transaction-detail"
                params={summaryParams}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <DateInput
              id="start-date"
              label="Tanggal Mulai"
              value={startDate}
              onChange={(e) => {
                setStartDate(new Date(e.target.value));
                setPage(1);
              }}
            />

            <DateInput
              id="end-date"
              label="Tanggal Akhir"
              value={endDate}
              onChange={(e) => {
                setEndDate(new Date(e.target.value));
                setPage(1);
              }}
            />

            <FormSelect
              id="status"
              label="Status Pembayaran"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              options={statusOptions}
            />

            <FormSelect
              id="payment"
              label="Metode Pembayaran"
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPage(1);
              }}
              options={paymentOptions}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pencarian (Invoice/Pelanggan)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari invoice atau nama pelanggan..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <BranchMultiSelect
              availableBranches={availableBranches}
              selectedBranches={selectedBranches}
              onChange={(branches) => {
                setSelectedBranches(branches);
                setPage(1);
              }}
              isDisabled={isDisabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Report Period Info */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-600">
          Periode: {formatDateFull(startDate)} - {formatDateFull(endDate)}
        </p>
        <StatusChip
          label={
            selectedBranches.length === availableBranches.length && !isDisabled
              ? "Semua Cabang"
              : `${selectedBranches.length} Cabang`
          }
          color={selectedBranches.length === availableBranches.length ? "primary" : "secondary"}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <MetricCard
          title="Total Transaksi"
          value={loadingSummary ? <LoadingIndicator size="sm" /> : summaryMetrics.total.count}
        />
        <MetricCard
          title="Total Nilai"
          value={loadingSummary ? <LoadingIndicator size="sm" /> : formatCurrency(summaryMetrics.total.amount)}
        />
        <MetricCard
          title="Rata-rata Transaksi"
          value={loadingSummary ? <LoadingIndicator size="sm" /> : formatCurrency(summaryMetrics.avgTransactionAmount)}
        />
      </div>

      {/* Tab Navigation */}
      <ReportTabs tabs={tabs} activeTab={tabValue} onChange={setTabValue} />

      {/* Tab Content */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Detail Transaksi</h3>
            {loadingDetail ? (
              <LoadingIndicator />
            ) : transactions.length > 0 ? (
              <>
                <DataTable
                  columns={[
                    {
                      header: "Tanggal",
                      cell: (row) => new Date(row.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
                    },
                    { header: "No. Invoice", accessor: "nomorTransaksi" },
                    { header: "Pelanggan", accessor: "pelanggan" },
                    { header: "Cabang", accessor: "cabang" },
                    {
                      header: "Total",
                      cell: (row) => formatCurrency(row.total),
                      cellClassName: "text-right font-semibold",
                    },
                    { header: "Metode", accessor: "metodePembayaran" },
                    {
                      header: "Status",
                      cell: (row) => (
                        <StatusChip
                          label={row.statusPembayaran}
                          color={
                            row.statusPembayaran === "LUNAS" ? "success" :
                            row.statusPembayaran === "VOID" ? "danger" : "warning"
                          }
                        />
                      ),
                    },
                  ]}
                  data={transactions}
                />

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-600">
                    Halaman {page} dari {pagination.pages} (Total: {pagination.total} transaksi)
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      variant="outline"
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages}
                      variant="outline"
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada transaksi yang cocok dengan filter</p>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Ringkasan Berdasarkan Status</h3>
            {loadingSummary ? (
              <LoadingIndicator />
            ) : byStatus.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byStatus}
                        dataKey="jumlah"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {byStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <DataTable
                  columns={[
                    { header: "Status", accessor: "status" },
                    {
                      header: "Jumlah",
                      accessor: "jumlah",
                      cellClassName: "text-right",
                    },
                    {
                      header: "Total Nilai",
                      cell: (row) => formatCurrency(row.totalNilai),
                      cellClassName: "text-right",
                    },
                  ]}
                  data={byStatus}
                />
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data ringkasan</p>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Audit Trail (Void & Refund)</h3>
            {loadingAudit ? (
              <LoadingIndicator />
            ) : auditTrail.length > 0 ? (
              <DataTable
                columns={[
                  {
                    header: "Tanggal",
                    cell: (row) => new Date(row.tanggal).toLocaleString("id-ID"),
                  },
                  { header: "No. Invoice", accessor: "nomorFaktur" },
                  { header: "Aksi", accessor: "aksi" },
                  {
                    header: "Nilai",
                    cell: (row) => formatCurrency(row.nilai),
                    cellClassName: "text-right",
                  },
                  { header: "Alasan", accessor: "alasan" },
                  { header: "Oleh", accessor: "oleh" },
                ]}
                data={auditTrail}
              />
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada riwayat void/refund</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TransactionDetailReport;
