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
  Clock,
  ListFilter,
  Calendar,
} from "lucide-react";
import { useCabang } from "@features/cabang/hooks/useCabang";
import { useExpiringProductsReport, useExpiringByCategory } from "../hooks/useReports";
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

const ExpiringProductsReport = () => {
  const [tabValue, setTabValue] = useState(0);
  const [cabangFilter, setCabangFilter] = useState("all");
  const [kategoriFilter, setKategoriFilter] = useState("all");
  const [daysThreshold, setDaysThreshold] = useState(90);
  const [statusKadaluarsaFilter, setStatusKadaluarsaFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { allCabang, allKategori } = useCabang();

  const apiParams = {
    cabangId: cabangFilter === "all" ? undefined : cabangFilter,
    kategoriId: kategoriFilter === "all" ? undefined : kategoriFilter,
    daysThreshold,
    statusKadaluarsa: statusKadaluarsaFilter === "all" ? undefined : statusKadaluarsaFilter,
    page,
    limit,
  };

  const categoryParams = {
    cabangId: cabangFilter === "all" ? undefined : cabangFilter,
    daysThreshold,
  };

  const { data: reportData, isLoading: loadingReport, refetch: refetchReport } = useExpiringProductsReport(apiParams);
  const { data: categoryData, isLoading: loadingCategory } = useExpiringByCategory(categoryParams);

  const loading = loadingReport || loadingCategory;

  const products = reportData?.data?.products || [];
  const summary = reportData?.data?.summary || {
    totalProducts: 0,
    expired: 0,
    expiringSoon: 0,
    expiringLater: 0,
    totalValueAtRisk: 0,
  };

  const categorySummary = categoryData?.data || [];

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
    { value: 0, label: "Daftar Produk", icon: <Calendar size={16} /> },
    { value: 1, label: "Ringkasan Kategori", icon: <Clock size={16} /> },
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

  const kategoriOptions = [
    { value: "all", label: "Semua Kategori" },
    ...(allKategori
      ? allKategori.map((kategori) => ({
          value: kategori.id,
          label: kategori.namaKategori,
        }))
      : []),
  ];

  const statusKadaluarsaOptions = [
    { value: "all", label: "Semua Status" },
    { value: "Sudah Kadaluarsa", label: "Sudah Kadaluarsa" },
    { value: "Akan Kadaluarsa < 30 Hari", label: "Kurang dari 30 Hari" },
    { value: "Akan Kadaluarsa 30-60 Hari", label: "30-60 Hari" },
    { value: "Akan Kadaluarsa 60-90 Hari", label: "60-90 Hari" },
  ];

  const thresholdOptions = [
    { value: 30, label: "30 Hari" },
    { value: 60, label: "60 Hari" },
    { value: 90, label: "90 Hari" },
    { value: 180, label: "180 Hari" },
    { value: 365, label: "1 Tahun" },
  ];

  const chartData = categorySummary.map((cat) => ({
    name: cat.namaKategori || cat.kategori_id,
    expired: cat.expired || 0,
    expiringSoon: cat.expiringSoon || 0,
    expiringLater: cat.expiringLater || 0,
  }));

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getDaysUntilExpiration = (dateString) => {
    if (!dateString) return 0;
    const expDate = new Date(dateString);
    const today = new Date();
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusKadaluarsa = (dateString) => {
    const days = getDaysUntilExpiration(dateString);
    if (days < 0) return { label: "Sudah Kadaluarsa", color: "danger" };
    if (days <= 30) return { label: "Akan Kadaluarsa < 30 Hari", color: "danger" };
    if (days <= 60) return { label: "Akan Kadaluarsa 30-60 Hari", color: "warning" };
    if (days <= 90) return { label: "Akan Kadaluarsa 60-90 Hari", color: "warning" };
    return { label: "Akan Kadaluarsa > 90 Hari", color: "info" };
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Laporan Produk Kadaluarsa</h1>

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
                reportType="expiring"
                params={apiParams}
                disabled={loading}
                requireDate={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <FormSelect
              id="cabang"
              label="Cabang"
              value={cabangFilter}
              onChange={(e) => setCabangFilter(e.target.value)}
              options={cabangOptions}
            />

            <FormSelect
              id="kategori"
              label="Kategori"
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
              options={kategoriOptions}
            />

            <FormSelect
              id="threshold"
              label="Batas Hari"
              value={daysThreshold}
              onChange={(e) => setDaysThreshold(Number(e.target.value))}
              options={thresholdOptions}
            />

            <FormSelect
              id="status"
              label="Status Kadaluarsa"
              value={statusKadaluarsaFilter}
              onChange={(e) => setStatusKadaluarsaFilter(e.target.value)}
              options={statusKadaluarsaOptions}
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
          title="Total Produk Kadaluarsa"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              summary.totalProducts.toLocaleString()
            )
          }
          icon={<Clock size={20} className="text-red-600" />}
        />

        <MetricCard
          title="Sudah Kadaluarsa"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              summary.expired.toLocaleString()
            )
          }
          icon={<Clock size={20} className="text-red-600" />}
        />

        <MetricCard
          title="Akan Kadaluarsa < 30 Hari"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              summary.expiringSoon.toLocaleString()
            )
          }
          icon={<Clock size={20} className="text-orange-600" />}
        />

        <MetricCard
          title="Nilai Berisiko"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              formatCurrency(summary.totalValueAtRisk)
            )
          }
        />
      </div>

      <ReportTabs tabs={tabs} activeTab={tabValue} onChange={handleChangeTab} />

      {tabValue === 0 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Daftar Produk yang Akan/Sudah Kadaluarsa</h3>
            {loading ? (
              <LoadingIndicator />
            ) : products.length > 0 ? (
              <>
                <DataTable
                  columns={[
                    {
                      header: "Nama Produk",
                      cell: (row) => (
                        <div>
                          <div className="font-medium">{row.namaProduk}</div>
                          <div className="text-xs text-gray-500">SKU: {row.sku}</div>
                        </div>
                      ),
                    },
                    {
                      header: "Kategori",
                      cell: (row) => row.namaKategori || "-",
                    },
                    {
                      header: "Cabang",
                      cell: (row) => row.namaCabang || "-",
                    },
                    {
                      header: "Stok",
                      cell: (row) => row.stok?.toLocaleString() || "0",
                      cellClassName: "text-right",
                    },
                    {
                      header: "Tanggal Kadaluarsa",
                      cell: (row) => formatDate(row.tanggalKadaluarsa),
                    },
                    {
                      header: "Sisa Hari",
                      cell: (row) => {
                        const days = getDaysUntilExpiration(row.tanggalKadaluarsa);
                        const isExpired = days < 0;
                        return (
                          <span className={isExpired ? "text-red-600 font-medium" : ""}>
                            {isExpired ? `${Math.abs(days)} hari lalu` : `${days} hari`}
                          </span>
                        );
                      },
                      cellClassName: "text-right",
                    },
                    {
                      header: "Status",
                      cell: (row) => {
                        const status = getStatusKadaluarsa(row.tanggalKadaluarsa);
                        return <StatusChip label={status.label} color={status.color} />;
                      },
                    },
                    {
                      header: "Harga Jual",
                      cell: (row) => formatCurrency(row.hargaJual),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Nilai Stok",
                      cell: (row) => formatCurrency(row.hargaJual * (row.stok || 0)),
                      cellClassName: "text-right",
                    },
                  ]}
                  data={products}
                />

                {reportData?.data?.pagination && (
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-600">
                      Menampilkan {(page - 1) * limit + 1} -{" "}
                      {Math.min(page * limit, summary.totalProducts)} dari{" "}
                      {summary.totalProducts} produk
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
                        disabled={page * limit >= summary.totalProducts}
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
                <Clock size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Tidak ada produk yang akan/sudah kadaluarsa</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Ringkasan Produk Kadaluarsa per Kategori</h3>
            {loading ? (
              <LoadingIndicator />
            ) : categorySummary.length > 0 ? (
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
                      <Bar dataKey="expired" name="Sudah Kadaluarsa" fill="#ef4444" />
                      <Bar dataKey="expiringSoon" name="< 30 Hari" fill="#f97316" />
                      <Bar dataKey="expiringLater" name="30-90 Hari" fill="#eab308" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <DataTable
                    columns={[
                      {
                        header: "Kategori",
                        cell: (row) => row.namaKategori || row.kategori_id || "-",
                      },
                      {
                        header: "Sudah Kadaluarsa",
                        cell: (row) => row.expired?.toLocaleString() || "0",
                        cellClassName: "text-right text-red-600",
                      },
                      {
                        header: "< 30 Hari",
                        cell: (row) => row.expiringSoon?.toLocaleString() || "0",
                        cellClassName: "text-right text-orange-600",
                      },
                      {
                        header: "30-90 Hari",
                        cell: (row) => row.expiringLater?.toLocaleString() || "0",
                        cellClassName: "text-right text-yellow-600",
                      },
                      {
                        header: "Total",
                        cell: (row) =>
                          ((row.expired || 0) + (row.expiringSoon || 0) + (row.expiringLater || 0)).toLocaleString(),
                        cellClassName: "text-right font-medium",
                      },
                    ]}
                    data={categorySummary}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <Clock size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Tidak ada data kategori</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExpiringProductsReport;
