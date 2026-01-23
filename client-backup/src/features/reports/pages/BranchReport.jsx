import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Download,
  RefreshCcw,
  ListFilter,
  BarChart2,
  TrendingUp,
  Target,
  GitBranch,
  MapPin,
} from "lucide-react";
import id from "date-fns/locale/id";
import { useCabang } from "../../../features/cabang/hooks/useCabang";
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
} from "../../../features/reports/components/ReportComponents";

// Colors
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

// Generate mock branch data
const generateBranchMetrics = (branchCount = 5) => {
  const branches = [];
  for (let i = 0; i < branchCount; i++) {
    const revenue = Math.floor(Math.random() * 100000000) + 20000000;
    const expenses = Math.floor(Math.random() * 50000000) + 10000000;
    const profit = revenue - expenses;

    branches.push({
      id: `branch-${i + 1}`,
      name: `Cabang ${i + 1}`,
      location: `Kota ${i + 1}`,
      revenue,
      expenses,
      profit,
      profitMargin: (profit / revenue) * 100,
      transactions: Math.floor(Math.random() * 2000) + 500,
      avgBasketSize: Math.floor(Math.random() * 200000) + 50000,
      employees: Math.floor(Math.random() * 20) + 5,
      customers: Math.floor(Math.random() * 1000) + 200,
      stockTurnover: Math.random() * 5 + 2,
      growth: Math.random() * 20 - 5,
      customerSatisfaction: Math.random() * 5,
    });
  }
  return branches;
};

// Generate performance data over time
const generatePerformanceData = (days = 30, branchCount = 5) => {
  const data = [];
  const date = new Date();
  date.setDate(date.getDate() - days);

  for (let i = 0; i < days; i++) {
    date.setDate(date.getDate() + 1);

    const dailyData = {
      date: new Date(date),
    };

    // Add data for each branch
    for (let j = 0; j < branchCount; j++) {
      dailyData[`branch${j + 1}`] =
        Math.floor(Math.random() * 5000000) + 1000000;
    }

    data.push(dailyData);
  }
  return data;
};

const BranchReport = () => {
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [comparisonType, setComparisonType] = useState("revenue");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [branchData, setBranchData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const { allCabang } = useCabang();

  // Fetch data effect
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Replace with actual API calls
        setTimeout(() => {
          const mockBranchData = generateBranchMetrics(5);
          setBranchData(mockBranchData);

          const mockPerformanceData = generatePerformanceData(30, 5);
          setPerformanceData(mockPerformanceData);

          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, comparisonType, selectedBranch]);

  const handleChangeTab = (newValue) => {
    setTabValue(newValue);
  };

  const handleExportReport = () => {
    // Implementation for exporting report
    alert("Export functionality will be implemented here");
  };

  const handleRefreshData = () => {
    // Refresh data
    setBranchData([]);
    setPerformanceData([]);

    // Re-fetch data
    const mockBranchData = generateBranchMetrics(5);
    setBranchData(mockBranchData);

    const mockPerformanceData = generatePerformanceData(30, 5);
    setPerformanceData(mockPerformanceData);
  };

  // Format date for display
  const formatDateForChart = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
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

  // Get the best and worst performing branches
  const getBestAndWorstBranches = () => {
    if (!branchData.length) return { best: null, worst: null };

    const sortedBranches = [...branchData].sort(
      (a, b) => b.profitMargin - a.profitMargin
    );
    return {
      best: sortedBranches[0],
      worst: sortedBranches[sortedBranches.length - 1],
    };
  };

  const { best, worst } = getBestAndWorstBranches();

  const comparisonOptions = [
    { value: "revenue", label: "Pendapatan" },
    { value: "profit", label: "Keuntungan" },
    { value: "transactions", label: "Jumlah Transaksi" },
    { value: "growth", label: "Pertumbuhan" },
  ];

  const branchOptions = [
    { value: "all", label: "Semua Cabang" },
    ...branchData.map((branch) => ({
      value: branch.id,
      label: branch.name,
    })),
  ];

  const tabs = [
    { value: 0, label: "Perbandingan Cabang", icon: <BarChart2 size={16} /> },
    { value: 1, label: "Trend Performa", icon: <TrendingUp size={16} /> },
    { value: 2, label: "Matriks Performa", icon: <Target size={16} /> },
    { value: 3, label: "Detail Cabang", icon: <GitBranch size={16} /> },
  ];

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
              <Button
                onClick={handleRefreshData}
                icon={<RefreshCcw size={16} />}
              >
                Refresh
              </Button>
              <Button
                onClick={handleExportReport}
                variant="primary"
                icon={<Download size={16} />}
              >
                Export
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <FormSelect
              id="comparison"
              label="Perbandingan"
              value={comparisonType}
              onChange={(e) => setComparisonType(e.target.value)}
              options={comparisonOptions}
            />

            <FormSelect
              id="branch"
              label="Cabang"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              options={branchOptions}
            />
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
        {best && (
          <div className="bg-green-50 rounded-lg shadow-sm p-5">
            <p className="text-green-600 text-sm flex items-center mb-1">
              <Target size={16} className="mr-1" /> Cabang Terbaik
            </p>
            <h3 className="text-xl font-bold text-green-600 mb-2">
              {loading ? <LoadingIndicator size="sm" /> : best.name}
            </h3>
            <Divider className="my-2" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className="font-semibold">{best.profitMargin.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pendapatan</p>
                <p className="font-semibold">{formatCurrency(best.revenue)}</p>
              </div>
            </div>
          </div>
        )}

        {worst && (
          <div className="bg-red-50 rounded-lg shadow-sm p-5">
            <p className="text-red-600 text-sm flex items-center mb-1">
              <Target size={16} className="mr-1" /> Cabang Perlu Perhatian
            </p>
            <h3 className="text-xl font-bold text-red-600 mb-2">
              {loading ? <LoadingIndicator size="sm" /> : worst.name}
            </h3>
            <Divider className="my-2" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className="font-semibold">
                  {worst.profitMargin.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pendapatan</p>
                <p className="font-semibold">{formatCurrency(worst.revenue)}</p>
              </div>
            </div>
          </div>
        )}
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
            {loading ? (
              <LoadingIndicator />
            ) : (
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
                      <XAxis dataKey="name" />
                      <YAxis
                        tickFormatter={(value) =>
                          comparisonType === "revenue" ||
                          comparisonType === "profit"
                            ? `${(value / 1000000).toFixed(0)}jt`
                            : value
                        }
                      />
                      <RechartsTooltip
                        formatter={(value) =>
                          comparisonType === "revenue" ||
                          comparisonType === "profit"
                            ? formatCurrency(value)
                            : comparisonType === "growth"
                            ? `${value.toFixed(2)}%`
                            : value
                        }
                      />
                      <Legend />
                      <Bar
                        dataKey={comparisonType}
                        name={
                          comparisonType === "revenue"
                            ? "Pendapatan"
                            : comparisonType === "profit"
                            ? "Keuntungan"
                            : comparisonType === "transactions"
                            ? "Jumlah Transaksi"
                            : "Pertumbuhan"
                        }
                        fill="#8884d8"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <Divider />

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cabang
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pendapatan
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Keuntungan
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Profit Margin
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaksi
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nilai Transaksi Rata-rata
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pertumbuhan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {branchData.map((branch) => (
                        <tr key={branch.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {branch.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {formatCurrency(branch.revenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {formatCurrency(branch.profit)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {branch.profitMargin.toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {branch.transactions}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {formatCurrency(branch.avgBasketSize)}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-right ${
                              branch.growth >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {branch.growth >= 0 ? "+" : ""}
                            {branch.growth.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Trend Tab */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Trend Performa Cabang</h3>
            {loading ? (
              <LoadingIndicator />
            ) : (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={performanceData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDateForChart} />
                    <YAxis
                      tickFormatter={(value) =>
                        `${(value / 1000000).toFixed(0)}jt`
                      }
                    />
                    <RechartsTooltip
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => formatDateFull(label)}
                    />
                    <Legend />
                    {branchData.map((branch, index) => (
                      <Line
                        key={branch.id}
                        type="monotone"
                        dataKey={`branch${index + 1}`}
                        name={branch.name}
                        stroke={COLORS[index % COLORS.length]}
                        activeDot={{ r: 8 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Matrix Tab */}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">
              Matriks Performa Cabang
            </h3>
            {loading ? (
              <LoadingIndicator />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      outerRadius={150}
                      data={branchData.map((branch) => ({
                        subject: branch.name,
                        A: branch.profitMargin / 20, // scale to 0-5
                        B: branch.stockTurnover / 2, // scale to 0-5
                        C: branch.customerSatisfaction,
                        D: branch.growth / 5 + 2.5, // scale to 0-5
                        E: branch.transactions / 500, // scale to 0-5
                      }))}
                    >
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} />
                      <Radar
                        name="Profit Margin"
                        dataKey="A"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Stock Turnover"
                        dataKey="B"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Customer Satisfaction"
                        dataKey="C"
                        stroke="#ffc658"
                        fill="#ffc658"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Growth"
                        dataKey="D"
                        stroke="#ff8042"
                        fill="#ff8042"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Transaction Volume"
                        dataKey="E"
                        stroke="#0088FE"
                        fill="#0088FE"
                        fillOpacity={0.6}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cabang
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Profit Margin
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Turnover
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kepuasan Pelanggan
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pertumbuhan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {branchData.map((branch) => (
                        <tr key={branch.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {branch.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {branch.profitMargin.toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {branch.stockTurnover.toFixed(2)}x
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center">
                              {/* Replace Rating with stars visualization */}
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-lg ${
                                    i < Math.round(branch.customerSatisfaction)
                                      ? "text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-center ${
                              branch.growth >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {branch.growth >= 0 ? "+" : ""}
                            {branch.growth.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Branch Details Tab */}
      {tabValue === 3 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Detail Cabang</h3>
            {loading ? (
              <LoadingIndicator />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branchData.map((branch) => (
                  <div
                    key={branch.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex items-center mb-2">
                        <MapPin size={20} className="mr-2 text-gray-500" />
                        <h4 className="text-lg font-medium">{branch.name}</h4>
                      </div>

                      <p className="text-gray-500 text-sm mb-4">
                        {branch.location}
                      </p>

                      <Divider className="my-3" />

                      <div className="grid grid-cols-2 gap-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Pendapatan:</p>
                          <p className="font-medium">
                            {formatCurrency(branch.revenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Keuntungan:</p>
                          <p className="font-medium">
                            {formatCurrency(branch.profit)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Margin:</p>
                          <p className="font-medium">
                            {branch.profitMargin.toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Transaksi:</p>
                          <p className="font-medium">{branch.transactions}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            Rata-rata Transaksi:
                          </p>
                          <p className="font-medium">
                            {formatCurrency(branch.avgBasketSize)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Pertumbuhan:</p>
                          <p
                            className={`font-medium ${
                              branch.growth >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {branch.growth >= 0 ? "+" : ""}
                            {branch.growth.toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Karyawan:</p>
                          <p className="font-medium">{branch.employees}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Pelanggan:</p>
                          <p className="font-medium">{branch.customers}</p>
                        </div>
                      </div>

                      <Divider className="my-3" />

                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Kepuasan Pelanggan:
                        </p>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${
                                i < Math.round(branch.customerSatisfaction)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BranchReport;
