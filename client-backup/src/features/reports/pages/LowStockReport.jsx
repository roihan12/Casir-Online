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
  AlertTriangle,
  ListFilter,
  Box,
} from "lucide-react";
import { useCabang } from "@features/cabang/hooks/useCabang";
import { useLowStockReport, useLowStockByCategory } from "../hooks/useReports";
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

const LowStockReport = () => {
  const [tabValue, setTabValue] = useState(0);
  const [cabangFilter, setCabangFilter] = useState("all");
  const [kategoriFilter, setKategoriFilter] = useState("all");
  const [stokStatusFilter, setStokStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { allCabang, allKategori } = useCabang();

  const apiParams = {
    cabangId: cabangFilter === "all" ? undefined : cabangFilter,
    kategoriId: kategoriFilter === "all" ? undefined : kategoriFilter,
    stokStatus: stokStatusFilter === "all" ? undefined : stokStatusFilter,
    page,
    limit,
  };

  const categoryParams = {
    cabangId: cabangFilter === "all" ? undefined : cabangFilter,
  };

  const { data: reportData, isLoading: loadingReport, refetch: refetchReport } = useLowStockReport(apiParams);
  const { data: categoryData, isLoading: loadingCategory } = useLowStockByCategory(categoryParams);

  const loading = loadingReport || loadingCategory;

  console.log("reportData", reportData);
  console.log("categoryData", categoryData);

  const products = reportData?.products || [];
  const summary = reportData?.summary || {
    totalProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    totalItemsBelowMin: 0,
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
    { value: 0, label: "Daftar Produk", icon: <Box size={16} /> },
    { value: 1, label: "Ringkasan Kategori", icon: <AlertTriangle size={16} /> },
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

  const stokStatusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "Habis", label: "Habis" },
    { value: "Menipis", label: "Menipis" },
  ];

  // Transform category data for chart - backend doesn't split out_of_stock and low_stock
  const chartData = categorySummary.map((cat) => ({
    name: cat.nama_kategori || cat.kategori_id,
    totalProducts: cat.total_products || 0,
    outOfStockCount: cat.out_of_stock_count || 0,
  }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Laporan Stok Menipis</h1>

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
              id="stok-status"
              label="Status Stok"
              value={stokStatusFilter}
              onChange={(e) => setStokStatusFilter(e.target.value)}
              options={stokStatusOptions}
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
          title="Total Produk Menipis"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              summary.totalProducts.toLocaleString()
            )
          }
          icon={<AlertTriangle size={20} className="text-yellow-600" />}
        />

        <MetricCard
          title="Stok Habis"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              summary.outOfStock.toLocaleString()
            )
          }
          icon={<AlertTriangle size={20} className="text-red-600" />}
        />

        <MetricCard
          title="Stok Menipis"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              summary.lowStock.toLocaleString()
            )
          }
          icon={<AlertTriangle size={20} className="text-orange-600" />}
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
            <h3 className="text-lg font-medium mb-4">Daftar Produk dengan Stok Menipis</h3>
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
                          <div className="font-medium">{row.nama_produk}</div>
                          <div className="text-xs text-gray-500">SKU: {row.sku}</div>
                        </div>
                      ),
                    },
                    {
                      header: "Cabang",
                      cell: (row) => row.nama_cabang || "-",
                    },
                    {
                      header: "Stok Saat Ini",
                      cell: (row) => Number(row.stok).toLocaleString(),
                      cellClassName: "text-right font-medium",
                    },
                    {
                      header: "Min Stok",
                      cell: (row) => row.min_stok ? Number(row.min_stok).toLocaleString() : "-",
                      cellClassName: "text-right",
                    },
                    {
                      header: "Persentase Stok",
                      cell: (row) => `${parseFloat(row.stok_percentage || 0).toFixed(1)}%`,
                      cellClassName: "text-right",
                    },
                    {
                      header: "Status Stok",
                      cell: (row) => (
                        <StatusChip
                          label={row.stok_status}
                          color={row.stok_status === "Habis" ? "danger" : "warning"}
                        />
                      ),
                    },
                    {
                      header: "Harga Jual",
                      cell: (row) => formatCurrency(parseFloat(row.harga_jual)),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Nilai Stok",
                      cell: (row) => formatCurrency(parseFloat(row.harga_jual) * Number(row.stok)),
                      cellClassName: "text-right",
                    },
                  ]}
                  data={products}
                />

                {reportData?.data?.pagination && (
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-600">
                      Menampilkan {(page - 1) * limit + 1} -{" "}
                      {Math.min(page * limit, reportData.data.pagination.total)} dari{" "}
                      {reportData.data.pagination.total} produk
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
                        disabled={page >= reportData.data.pagination.totalPages}
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
                <AlertTriangle size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Tidak ada produk dengan stok menipis</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Ringkasan Stok Menipis per Kategori</h3>
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
                      <Bar dataKey="totalProducts" name="Total Produk" fill="#3b82f6" />
                      <Bar dataKey="outOfStockCount" name="Stok Habis" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <DataTable
                    columns={[
                      {
                        header: "Kategori",
                        cell: (row) => row.nama_kategori || row.kategori_id || "-",
                      },
                      {
                        header: "Total Produk",
                        cell: (row) => Number(row.total_products || 0).toLocaleString(),
                        cellClassName: "text-right",
                      },
                      {
                        header: "Out of Stock",
                        cell: (row) => Number(row.out_of_stock_count || 0).toLocaleString(),
                        cellClassName: "text-right text-red-600",
                      },
                      {
                        header: "Total Stok",
                        cell: (row) => Number(row.total_stock || 0).toLocaleString(),
                        cellClassName: "text-right",
                      },
                      {
                        header: "Nilai Total",
                        cell: (row) => formatCurrency(parseFloat(row.total_value || 0)),
                        cellClassName: "text-right font-medium",
                      },
                    ]}
                    data={categorySummary}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <AlertTriangle size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Tidak ada data kategori</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LowStockReport;
