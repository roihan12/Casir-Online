import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
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
  Heart,
  ListFilter,
  Activity,
  TrendingUp,
} from "lucide-react";
import { useCabang } from "@features/cabang/hooks/useCabang";
import {
  useInventoryHealthReport,
  useBranchInventoryHealth,
  useHealthScoreDistribution,
  useHealthByDimension,
} from "../hooks/useReports";
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
  "#10b981",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

const HEALTH_STATUS_COLORS = {
  Excellent: "#10b981",
  Good: "#22c55e",
  Fair: "#eab308",
  Poor: "#ef4444",
};

const InventoryHealthReport = () => {
  const [tabValue, setTabValue] = useState(0);
  const [cabangFilter, setCabangFilter] = useState("all");
  const [kategoriFilter, setKategoriFilter] = useState("all");
  const [healthStatusFilter, setHealthStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { allCabang, allKategori } = useCabang();

  const apiParams = {
    cabangId: cabangFilter === "all" ? undefined : cabangFilter,
    kategoriId: kategoriFilter === "all" ? undefined : kategoriFilter,
    healthStatus: healthStatusFilter === "all" ? undefined : healthStatusFilter,
    page,
    limit,
  };

  const branchParams = {
    cabangId: cabangFilter === "all" ? undefined : cabangFilter,
  };

  const {
    data: reportData,
    isLoading: loadingReport,
    refetch: refetchReport,
  } = useInventoryHealthReport(apiParams);
  const { data: branchData, isLoading: loadingBranch } = useBranchInventoryHealth(branchParams);
  const { data: distributionData, isLoading: loadingDistribution } = useHealthScoreDistribution(branchParams);
  const { data: dimensionData, isLoading: loadingDimension } = useHealthByDimension(branchParams);

  const loading = loadingReport || loadingBranch || loadingDistribution || loadingDimension;

  const products = reportData?.data?.products || [];
  const summary = reportData?.data?.summary || {
    totalProducts: 0,
    avgHealthScore: 0,
    excellent: 0,
    good: 0,
    fair: 0,
    poor: 0,
  };

  const branchSummary = branchData?.data || [];
  const distribution = distributionData?.data || [];
  const dimensions = dimensionData?.data || [];

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
    { value: 0, label: "Daftar Produk", icon: <Heart size={16} /> },
    { value: 1, label: "Ringkasan Cabang", icon: <Activity size={16} /> },
    { value: 2, label: "Distribusi Skor", icon: <TrendingUp size={16} /> },
    { value: 3, label: "Analisis Dimensi", icon: <ListFilter size={16} /> },
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

  const healthStatusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "Excellent", label: "Excellent (90-100)" },
    { value: "Good", label: "Good (70-89)" },
    { value: "Fair", label: "Fair (50-69)" },
    { value: "Poor", label: "Poor (<50)" },
  ];

  const distributionChartData = distribution.map((item) => ({
    name: item.healthStatus || item.status,
    value: item.count || 0,
    percentage: item.percentage || 0,
  }));

  const dimensionChartData = dimensions.map((item) => ({
    name: item.dimension || item.dimensi,
    avgScore: item.avgScore || 0,
    maxScore: item.maxScore || 100,
  }));

  const getHealthColor = (score) => {
    if (score >= 90) return "#10b981";
    if (score >= 70) return "#22c55e";
    if (score >= 50) return "#eab308";
    return "#ef4444";
  };

  const getHealthStatus = (score) => {
    if (score >= 90) return { label: "Excellent", color: "success" };
    if (score >= 70) return { label: "Good", color: "success" };
    if (score >= 50) return { label: "Fair", color: "warning" };
    return { label: "Poor", color: "danger" };
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Laporan Kesehatan Inventori</h1>

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
              id="kategori"
              label="Kategori"
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
              options={kategoriOptions}
            />

            <FormSelect
              id="health-status"
              label="Status Kesehatan"
              value={healthStatusFilter}
              onChange={(e) => setHealthStatusFilter(e.target.value)}
              options={healthStatusOptions}
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
          title="Total Produk"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              summary.totalProducts.toLocaleString()
            )
          }
          icon={<Heart size={20} className="text-blue-600" />}
        />

        <MetricCard
          title="Rata-rata Skor Kesehatan"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              `${summary.avgHealthScore.toFixed(1)}/100`
            )
          }
          icon={<TrendingUp size={20} className="text-green-600" />}
        />

        <MetricCard
          title="Excellent & Good"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              (summary.excellent + summary.good).toLocaleString()
            )
          }
          icon={<Heart size={20} className="text-green-600" />}
        />

        <MetricCard
          title="Perlu Perhatian (Fair & Poor)"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              (summary.fair + summary.poor).toLocaleString()
            )
          }
          icon={<Activity size={20} className="text-red-600" />}
        />
      </div>

      <ReportTabs tabs={tabs} activeTab={tabValue} onChange={handleChangeTab} />

      {tabValue === 0 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Daftar Produk dengan Skor Kesehatan</h3>
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
                      header: "Skor Kesehatan",
                      cell: (row) => {
                        const status = getHealthStatus(row.overallHealthScore);
                        return (
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{
                                backgroundColor: getHealthColor(row.overallHealthScore),
                              }}
                            ></div>
                            <span className="font-medium">{row.overallHealthScore.toFixed(1)}</span>
                          </div>
                        );
                      },
                      cellClassName: "text-right",
                    },
                    {
                      header: "Status",
                      cell: (row) => {
                        const status = getHealthStatus(row.overallHealthScore);
                        return <StatusChip label={status.label} color={status.color} />;
                      },
                    },
                    {
                      header: "Stok Level",
                      cell: (row) => row.stockLevelScore?.toFixed(1) || "-",
                      cellClassName: "text-right",
                    },
                    {
                      header: "Expiration",
                      cell: (row) => row.expirationScore?.toFixed(1) || "-",
                      cellClassName: "text-right",
                    },
                    {
                      header: "Movement",
                      cell: (row) => row.movementScore?.toFixed(1) || "-",
                      cellClassName: "text-right",
                    },
                    {
                      header: "Financial",
                      cell: (row) => row.financialScore?.toFixed(1) || "-",
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
                <Heart size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Tidak ada data kesehatan inventori</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Ringkasan Kesehatan per Cabang</h3>
            {loading ? (
              <LoadingIndicator />
            ) : branchSummary.length > 0 ? (
              <DataTable
                columns={[
                  {
                    header: "Cabang",
                    cell: (row) => row.namaCabang || row.cabang_id || "-",
                  },
                  {
                    header: "Total Produk",
                    cell: (row) => row.totalProducts?.toLocaleString() || "0",
                    cellClassName: "text-right",
                  },
                  {
                    header: "Rata-rata Skor",
                    cell: (row) => {
                      const score = row.avgHealthScore || 0;
                      return (
                        <div className="flex items-center justify-end">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: getHealthColor(score) }}
                          ></div>
                          <span className="font-medium">{score.toFixed(1)}</span>
                        </div>
                      );
                    },
                    cellClassName: "text-right",
                  },
                  {
                    header: "Excellent",
                    cell: (row) => row.excellent?.toLocaleString() || "0",
                    cellClassName: "text-right text-green-600",
                  },
                  {
                    header: "Good",
                    cell: (row) => row.good?.toLocaleString() || "0",
                    cellClassName: "text-right text-green-600",
                  },
                  {
                    header: "Fair",
                    cell: (row) => row.fair?.toLocaleString() || "0",
                    cellClassName: "text-right text-yellow-600",
                  },
                  {
                    header: "Poor",
                    cell: (row) => row.poor?.toLocaleString() || "0",
                    cellClassName: "text-right text-red-600",
                  },
                ]}
                data={branchSummary}
              />
            ) : (
              <div className="text-center py-8 text-gray-600">
                <Activity size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Tidak ada data cabang</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Distribusi Skor Kesehatan</h3>
            {loading ? (
              <LoadingIndicator />
            ) : distributionChartData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {distributionChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={HEALTH_STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <DataTable
                    columns={[
                      {
                        header: "Status Kesehatan",
                        cell: (row) => {
                          const color = HEALTH_STATUS_COLORS[row.name] || "#8884d8";
                          return (
                            <div className="flex items-center">
                              <div
                                className="w-4 h-4 rounded-full mr-2"
                                style={{ backgroundColor: color }}
                              ></div>
                              {row.name}
                            </div>
                          );
                        },
                      },
                      {
                        header: "Jumlah Produk",
                        cell: (row) => row.value.toLocaleString(),
                        cellClassName: "text-right",
                      },
                      {
                        header: "Persentase",
                        cell: (row) => `${row.percentage.toFixed(1)}%`,
                        cellClassName: "text-right",
                      },
                    ]}
                    data={distributionChartData}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <TrendingUp size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Tidak ada data distribusi</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 3 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Analisis Kesehatan per Dimensi</h3>
            {loading ? (
              <LoadingIndicator />
            ) : dimensionChartData.length > 0 ? (
              <>
                <div className="h-[400px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dimensionChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="avgScore" name="Rata-rata Skor" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <Divider />

                <DataTable
                  columns={[
                    {
                      header: "Dimensi",
                      cell: (row) => row.name,
                    },
                    {
                      header: "Rata-rata Skor",
                      cell: (row) => {
                        const score = row.avgScore || 0;
                        return (
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: getHealthColor(score) }}
                            ></div>
                            <span className="font-medium">{score.toFixed(1)}/100</span>
                          </div>
                        );
                      },
                      cellClassName: "text-right",
                    },
                    {
                      header: "Skor Maksimum",
                      cell: (row) => `${row.maxScore || 100}/100`,
                      cellClassName: "text-right",
                    },
                    {
                      header: "Persentase",
                      cell: (row) => {
                        const percentage = ((row.avgScore || 0) / (row.maxScore || 100)) * 100;
                        return `${percentage.toFixed(1)}%`;
                      },
                      cellClassName: "text-right",
                    },
                  ]}
                  data={dimensionChartData}
                />
              </>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <Activity size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Tidak ada data dimensi</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InventoryHealthReport;
