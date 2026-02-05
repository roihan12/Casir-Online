import React, { useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  RefreshCcw,
  ArrowRightLeft,
  ListFilter,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useCabang } from "@features/cabang/hooks/useCabang";
import { useStockTransferReport, useStockTransferByBranch } from "../hooks/useReports";
import formatCurrency from "@common/utils/formatCurrency";
import {
  Card,
  CardContent,
  ReportTabs,
  DataTable,
  StatusChip,
  LoadingIndicator,
  MetricCard,
  FormSelect,
  Button,
  Divider,
} from "../components/ReportComponents";
import ExportDropdown from "../components/ExportDropdown";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#8dd1e1",
];

const StockTransferReport = () => {
  const [tabValue, setTabValue] = useState(0);
  const [cabangFilter, setCabangFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("30days");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { allCabang } = useCabang();

  const apiParams = {
    cabangId: cabangFilter === "all" ? undefined : cabangFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    dateRange: dateRangeFilter,
    page,
    limit,
  };

  const branchParams = {
    cabangId: cabangFilter === "all" ? undefined : cabangFilter,
  };

  const { data: reportData, isLoading: loadingReport, refetch: refetchReport } = useStockTransferReport(apiParams);
  const { data: branchData, isLoading: loadingBranch } = useStockTransferByBranch(branchParams);

  const loading = loadingReport || loadingBranch;

  const transfers = reportData?.data?.transfers || [];
  const summary = reportData?.data?.summary || {
    totalTransfers: 0,
    totalItemsTransferred: 0,
    totalValueTransferred: 0,
    pendingTransfers: 0,
    completedTransfers: 0,
    cancelledTransfers: 0,
  };

  const branchSummary = branchData?.data || [];

  const handleRefreshData = () => {
    refetchReport();
  };

  const handleChangeTab = (newValue) => {
    setTabValue(newValue);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const tabs = [
    { value: 0, label: "Daftar Transfer", icon: <ArrowRightLeft size={16} /> },
    { value: 1, label: "Ringkasan Cabang", icon: <CalendarIcon size={16} /> },
  ];

  const cabangOptions = [
    { value: "all", label: "Semua Cabang" },
    ...(allCabang
      ? allCabang.map((cabang) => ({
          value: cabang.id,
          label: cabang.namaCabang,
        }))
      : []),
  ];

  const statusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "pending_approval", label: "Menunggu Persetujuan" },
    { value: "approved", label: "Disetujui" },
    { value: "in_transit", label: "Dalam Pengiriman" },
    { value: "completed", label: "Selesai" },
    { value: "cancelled", label: "Dibatalkan" },
  ];

  const dateRangeOptions = [
    { value: "today", label: "Hari Ini" },
    { value: "7days", label: "7 Hari Terakhir" },
    { value: "30days", label: "30 Hari Terakhir" },
    { value: "90days", label: "90 Hari Terakhir" },
    { value: "6months", label: "6 Bulan Terakhir" },
    { value: "1year", label: "1 Tahun Terakhir" },
  ];

  const chartData = branchSummary.map((branch) => ({
    name: branch.namaCabang || branch.cabang_id,
    sent: branch.totalSent || 0,
    received: branch.totalReceived || 0,
    inProgress: branch.inProgress || 0,
  }));

  const getStatusColor = (status) => {
    const statusMap = {
      pending_approval: "warning",
      approved: "info",
      in_transit: "info",
      completed: "success",
      cancelled: "danger",
    };
    return statusMap[status] || "default";
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      pending_approval: "Menunggu Persetujuan",
      approved: "Disetujui",
      in_transit: "Dalam Pengiriman",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    };
    return labelMap[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Laporan Transfer Stok Antar Cabang</h1>

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
                reportType="inventory"
                params={apiParams}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormSelect
              id="cabang"
              label="Cabang"
              value={cabangFilter}
              onChange={(e) => setCabangFilter(e.target.value)}
              options={cabangOptions}
            />

            <FormSelect
              id="status"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
            />

            <FormSelect
              id="date-range"
              label="Rentang Waktu"
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              options={dateRangeOptions}
            />

            <FormSelect
              id="limit"
              label="Baris per Halaman"
              value={limit}
              onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
              options={[
                { value: 10, label: "10" },
                { value: 25, label: "25" },
                { value: 50, label: "50" },
                { value: 100, label: "100" },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard
          title="Total Transfer"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              summary.totalTransfers.toLocaleString()
            )
          }
          icon={<ArrowRightLeft size={20} className="text-blue-600" />}
        />

        <MetricCard
          title="Total Item Dipindah"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              summary.totalItemsTransferred.toLocaleString()
            )
          }
        />

        <MetricCard
          title="Nilai Transfer"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              formatCurrency(summary.totalValueTransferred)
            )
          }
        />

        <MetricCard
          title="Menunggu Persetujuan"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              summary.pendingTransfers.toLocaleString()
            )
          }
          icon={<CalendarIcon size={20} className="text-yellow-600" />}
        />
      </div>

      <ReportTabs tabs={tabs} activeTab={tabValue} onChange={handleChangeTab} />

      {tabValue === 0 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Daftar Transfer Stok</h3>
            {loading ? (
              <LoadingIndicator />
            ) : transfers.length > 0 ? (
              <>
                <DataTable
                  columns={[
                    {
                      header: "Nomor Transfer",
                      cell: (row) => (
                        <div>
                          <div className="font-medium">{row.nomorTransfer}</div>
                          <div className="text-xs text-gray-500">ID: {row.transferId}</div>
                        </div>
                      ),
                    },
                    {
                      header: "Dari Cabang",
                      cell: (row) => row.cabangAsalNama || "-",
                    },
                    {
                      header: "Ke Cabang",
                      cell: (row) => row.cabangTujuanNama || "-",
                    },
                    {
                      header: "Jumlah Item",
                      cell: (row) => row.jumlahItem?.toLocaleString() || "0",
                      cellClassName: "text-right",
                    },
                    {
                      header: "Nilai Transfer",
                      cell: (row) => formatCurrency(row.nilaiTransfer),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Tanggal Request",
                      cell: (row) => formatDate(row.tanggalRequest),
                    },
                    {
                      header: "Tanggal Kirim",
                      cell: (row) => formatDate(row.tanggalKirim) || "-",
                    },
                    {
                      header: "Tanggal Terima",
                      cell: (row) => formatDate(row.tanggalTerima) || "-",
                    },
                    {
                      header: "Status",
                      cell: (row) => (
                        <StatusChip
                          label={getStatusLabel(row.status)}
                          color={getStatusColor(row.status)}
                        />
                      ),
                    },
                  ]}
                  data={transfers}
                />

                {reportData?.data?.pagination && (
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-600">
                      Menampilkan {(page - 1) * limit + 1} -{" "}
                      {Math.min(page * limit, summary.totalTransfers)} dari{" "}
                      {summary.totalTransfers} transfer
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        variant="outline"
                      >
                        Sebelumnya
                      </Button>
                      <span className="px-4 py-2 bg-gray-100 rounded">
                        Halaman {page}
                      </span>
                      <Button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page * limit >= summary.totalTransfers}
                        variant="outline"
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <ArrowRightLeft size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Tidak ada data transfer stok</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Ringkasan Transfer per Cabang</h3>
            {loading ? (
              <LoadingIndicator />
            ) : branchSummary.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="sent" name="Dikirim" fill="#3b82f6" />
                      <Bar dataKey="received" name="Diterima" fill="#10b981" />
                      <Bar dataKey="inProgress" name="Dalam Proses" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <DataTable
                    columns={[
                      {
                        header: "Cabang",
                        cell: (row) => row.namaCabang || row.cabang_id || "-",
                      },
                      {
                        header: "Total Dikirim",
                        cell: (row) => row.totalSent?.toLocaleString() || "0",
                        cellClassName: "text-right text-blue-600",
                      },
                      {
                        header: "Total Diterima",
                        cell: (row) => row.totalReceived?.toLocaleString() || "0",
                        cellClassName: "text-right text-green-600",
                      },
                      {
                        header: "Dalam Proses",
                        cell: (row) => row.inProgress?.toLocaleString() || "0",
                        cellClassName: "text-right text-yellow-600",
                      },
                      {
                        header: "Nilai Total",
                        cell: (row) => formatCurrency(row.totalValue),
                        cellClassName: "text-right font-medium",
                      },
                    ]}
                    data={branchSummary}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <ArrowRightLeft size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Tidak ada data cabang</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StockTransferReport;
