import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  RefreshCcw,
  ListFilter,
  BarChart2,
  Target,
} from "lucide-react";
import { useBranchReport } from "../hooks/useReports";
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
  "#a4de6c",
  "#d0ed57",
];

const BranchReport = () => {
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [comparisonType, setComparisonType] = useState("totalPenjualan");

  // Format dates for API
  const apiParams = useMemo(() => {
    const formatDate = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    };
  }, [startDate, endDate]);

  // Fetch data using real API
  const { data: branchReportData, isLoading, refetch } = useBranchReport(apiParams);

  const branchData = branchReportData?.data?.branches || [];
  const summaryData = branchReportData?.data?.summary || {};

  // Format dates for export params
  const exportParams = apiParams;

  const handleChangeTab = (newValue) => {
    setTabValue(newValue);
  };

  const handleRefreshData = () => {
    refetch();
  };

  // Format date full
  const formatDateFull = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Get the best and worst performing branches
  const getBestAndWorstBranches = () => {
    if (!branchData.length) return { best: null, worst: null };

    const sortedBranches = [...branchData].sort(
      (a, b) => b.totalPenjualan - a.totalPenjualan
    );
    return {
      best: sortedBranches[0],
      worst: sortedBranches[sortedBranches.length - 1],
    };
  };

  const { best, worst } = getBestAndWorstBranches();

  const comparisonOptions = [
    { value: "totalPenjualan", label: "Total Penjualan" },
    { value: "totalTransaksi", label: "Jumlah Transaksi" },
    { value: "rataRata", label: "Rata-rata Transaksi" },
    { value: "kontribusi", label: "Kontribusi" },
  ];

  const tabs = [
    { value: 0, label: "Perbandingan Cabang", icon: <BarChart2 size={16} /> },
    { value: 1, label: "Detail Cabang", icon: <Target size={16} /> },
  ];

  const getComparisonLabel = (value) => {
    const option = comparisonOptions.find((opt) => opt.value === value);
    return option?.label || value;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Laporan Performa Cabang</h1>

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
              <ExportDropdown reportType="branch" params={exportParams} disabled={isLoading} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DateInput
              id="start-date"
              label="Tanggal Mulai"
              value={startDate}
              onChange={(e) => setStartDate(new Date(e.target.value))}
            />

            <DateInput
              id="end-date"
              label="Tanggal Akhir"
              value={endDate}
              onChange={(e) => setEndDate(new Date(e.target.value))}
            />

            <select
              id="comparison"
              value={comparisonType}
              onChange={(e) => setComparisonType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {comparisonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Report Time Range Information */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-600">
          Periode: {formatDateFull(startDate)} - {formatDateFull(endDate)}
        </p>
      </div>

      {/* Top Performers Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-green-50 rounded-lg shadow-sm p-5">
          <p className="text-green-600 text-sm flex items-center mb-1">
            <Target size={16} className="mr-1" /> Cabang Terbaik
          </p>
          <h3 className="text-xl font-bold text-green-600 mb-2">
            {isLoading ? <LoadingIndicator size="sm" /> : best?.namaCabang || "-"}
          </h3>
          <Divider className="my-2" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-gray-600">Total Penjualan</p>
              <p className="font-semibold">{isLoading ? "-" : formatCurrency(best?.totalPenjualan || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Jumlah Transaksi</p>
              <p className="font-semibold">{isLoading ? "-" : (best?.totalTransaksi || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg shadow-sm p-5">
          <p className="text-blue-600 text-sm flex items-center mb-1">
            <Target size={16} className="mr-1" /> Total Penjualan Global
          </p>
          <h3 className="text-xl font-bold text-blue-600 mb-2">
            {isLoading ? <LoadingIndicator size="sm" /> : formatCurrency(summaryData.grandTotalPenjualan || 0)}
          </h3>
          <Divider className="my-2" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-gray-600">Total Transaksi</p>
              <p className="font-semibold">{isLoading ? "-" : (summaryData.totalTransaksi || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Jumlah Cabang</p>
              <p className="font-semibold">{isLoading ? "-" : (summaryData.totalBranches || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <ReportTabs tabs={tabs} activeTab={tabValue} onChange={handleChangeTab} />

      {/* Comparison Tab */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">
              Perbandingan Performa Antar Cabang
            </h3>
            {isLoading ? (
              <LoadingIndicator />
            ) : branchData.length > 0 ? (
              <>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={branchData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="namaCabang" />
                      <YAxis
                        tickFormatter={(value) =>
                          comparisonType === "totalPenjualan" || comparisonType === "rataRata"
                            ? `${(value / 1000000).toFixed(0)}jt`
                            : comparisonType === "kontribusi"
                            ? `${value.toFixed(1)}%`
                            : value
                        }
                      />
                      <RechartsTooltip
                        formatter={(value, name) => {
                          if (comparisonType === "totalPenjualan" || comparisonType === "rataRata") {
                            return [formatCurrency(value), getComparisonLabel(comparisonType)];
                          }
                          if (comparisonType === "kontribusi") {
                            return [`${value.toFixed(2)}%`, getComparisonLabel(comparisonType)];
                          }
                          return [value, getComparisonLabel(comparisonType)];
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey={comparisonType}
                        name={getComparisonLabel(comparisonType)}
                        fill="#8884d8"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <Divider />

                <DataTable
                  columns={[
                    { header: "Cabang", accessor: "namaCabang" },
                    {
                      header: "Alamat",
                      accessor: "alamat",
                      cell: (val) => val || "-",
                    },
                    {
                      header: "Total Penjualan",
                      cell: (row) => formatCurrency(row.totalPenjualan),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Total Transaksi",
                      accessor: "totalTransaksi",
                      cellClassName: "text-right",
                    },
                    {
                      header: "Rata-rata Transaksi",
                      cell: (row) => formatCurrency(row.rataRata),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Kontribusi",
                      cell: (row) => `${row.kontribusi.toFixed(2)}%`,
                      cellClassName: "text-right",
                    },
                  ]}
                  data={branchData}
                />
              </>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data untuk ditampilkan</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Branch Details Tab */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Detail Cabang</h3>
            {isLoading ? (
              <LoadingIndicator />
            ) : branchData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branchData.map((branch, index) => (
                  <div
                    key={branch.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-medium">{branch.namaCabang}</h4>
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                      </div>

                      <p className="text-gray-500 text-sm mb-4">
                        {branch.alamat || "-"}
                      </p>

                      <Divider className="my-3" />

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Total Penjualan:</span>
                          <span className="font-medium">{formatCurrency(branch.totalPenjualan)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Total Transaksi:</span>
                          <span className="font-medium">{branch.totalTransaksi.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Rata-rata Transaksi:</span>
                          <span className="font-medium">{formatCurrency(branch.rataRata)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Kontribusi:</span>
                          <span className="font-medium">{branch.kontribusi.toFixed(2)}%</span>
                        </div>
                      </div>

                      <Divider className="my-3" />

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Kontribusi:</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${Math.min(branch.kontribusi, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-right text-xs text-gray-500 mt-1">
                          {branch.kontribusi.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data untuk ditampilkan</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BranchReport;
