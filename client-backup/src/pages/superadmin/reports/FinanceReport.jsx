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
} from "recharts";
import {
  Download,
  RefreshCcw,
  ListFilter,
  CreditCard,
  DollarSign,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart2,
} from "lucide-react";
import id from "date-fns/locale/id";
import { useCabang } from "../../../features/cabang/hooks/useCabang";
import formatCurrency from "../../../utils/formatCurrency";
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
} from "../../../components/reports/ReportComponents";

// Mock data - replace with actual API calls
const generateMockRevenueData = (days = 30) => {
  const data = [];
  const date = new Date();
  date.setDate(date.getDate() - days);

  for (let i = 0; i < days; i++) {
    date.setDate(date.getDate() + 1);
    const revenue = Math.floor(Math.random() * 10000000) + 1000000;
    const expenses = Math.floor(Math.random() * 5000000) + 500000;

    data.push({
      date: new Date(date),
      revenue: revenue,
      expenses: expenses,
      profit: revenue - expenses,
    });
  }
  return data;
};

const generateMockPaymentMethodData = () => {
  return [
    { name: "TUNAI", value: Math.floor(Math.random() * 5000000) + 3000000 },
    {
      name: "KARTU_DEBIT",
      value: Math.floor(Math.random() * 4000000) + 2000000,
    },
    {
      name: "KARTU_KREDIT",
      value: Math.floor(Math.random() * 3000000) + 1000000,
    },
    { name: "TRANSFER", value: Math.floor(Math.random() * 2000000) + 1000000 },
    { name: "QRIS", value: Math.floor(Math.random() * 3000000) + 1500000 },
    { name: "E_WALLET", value: Math.floor(Math.random() * 2500000) + 1200000 },
  ];
};

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const FinanceReport = () => {
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [viewType, setViewType] = useState("daily");
  const [cabangFilter, setCabangFilter] = useState("all");
  const [financeData, setFinanceData] = useState([]);
  const [paymentMethodData, setPaymentMethodData] = useState([]);
  const [reportMetrics, setReportMetrics] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
  });
  const { allCabang } = useCabang();

  // Fetch data effect
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Replace with actual API calls
        setTimeout(() => {
          const mockFinanceData = generateMockRevenueData(30);
          setFinanceData(mockFinanceData);

          const mockPaymentData = generateMockPaymentMethodData();
          setPaymentMethodData(mockPaymentData);

          // Calculate summary metrics
          const totalRevenue = mockFinanceData.reduce(
            (sum, item) => sum + item.revenue,
            0
          );
          const totalExpenses = mockFinanceData.reduce(
            (sum, item) => sum + item.expenses,
            0
          );
          const netProfit = totalRevenue - totalExpenses;

          setReportMetrics({
            totalRevenue,
            totalExpenses,
            netProfit,
            profitMargin: (netProfit / totalRevenue) * 100,
          });

          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, viewType, cabangFilter]);

  const handleChangeTab = (newValue) => {
    setTabValue(newValue);
  };

  const handleExportReport = () => {
    // Implementation for exporting report
    alert("Export functionality will be implemented here");
  };

  const handleRefreshData = () => {
    // Refresh data
    setFinanceData([]);
    setPaymentMethodData([]);
    setReportMetrics({
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
    });

    // Re-fetch data
    const mockFinanceData = generateMockRevenueData(30);
    setFinanceData(mockFinanceData);

    const mockPaymentData = generateMockPaymentMethodData();
    setPaymentMethodData(mockPaymentData);

    // Calculate summary metrics
    const totalRevenue = mockFinanceData.reduce(
      (sum, item) => sum + item.revenue,
      0
    );
    const totalExpenses = mockFinanceData.reduce(
      (sum, item) => sum + item.expenses,
      0
    );
    const netProfit = totalRevenue - totalExpenses;

    setReportMetrics({
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: (netProfit / totalRevenue) * 100,
    });
  };

  // Format date for display in charts
  const formatDateForChart = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
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

  // Format payment method name
  const formatPaymentMethod = (method) => {
    switch (method) {
      case "TUNAI":
        return "Tunai";
      case "KARTU_DEBIT":
        return "Kartu Debit";
      case "KARTU_KREDIT":
        return "Kartu Kredit";
      case "TRANSFER":
        return "Transfer Bank";
      case "QRIS":
        return "QRIS";
      case "E_WALLET":
        return "E-Wallet";
      default:
        return method;
    }
  };

  const tabs = [
    {
      value: 0,
      label: "Trend Pendapatan & Pengeluaran",
      icon: <TrendingUp size={16} />,
    },
    { value: 1, label: "Metode Pembayaran", icon: <CreditCard size={16} /> },
    { value: 2, label: "Analisis Pengeluaran", icon: <BarChart2 size={16} /> },
    { value: 3, label: "Pajak & Biaya", icon: <PieChartIcon size={16} /> },
  ];

  const viewTypeOptions = [
    { value: "daily", label: "Harian" },
    { value: "weekly", label: "Mingguan" },
    { value: "monthly", label: "Bulanan" },
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Laporan Keuangan Global</h1>

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
              id="view-type"
              label="Tampilan"
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
              options={viewTypeOptions}
            />

            <FormSelect
              id="cabang"
              label="Cabang"
              value={cabangFilter}
              onChange={(e) => setCabangFilter(e.target.value)}
              options={cabangOptions}
            />
          </div>
        </CardContent>
      </Card>

      {/* Report Time Range Information */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-600">
          Periode: {formatDateFull(startDate)} - {formatDateFull(endDate)}
        </p>
        <StatusChip
          label={
            cabangFilter === "all" ? "Tampilan Global" : "Tampilan Per Cabang"
          }
          color={cabangFilter === "all" ? "primary" : "secondary"}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard
          title="Total Pendapatan"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              formatCurrency(reportMetrics.totalRevenue)
            )
          }
        />

        <MetricCard
          title="Total Pengeluaran"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              formatCurrency(reportMetrics.totalExpenses)
            )
          }
        />

        <MetricCard
          title="Keuntungan Bersih"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              formatCurrency(reportMetrics.netProfit)
            )
          }
          trend={
            reportMetrics.netProfit >= 0
              ? { positive: true, value: "" }
              : { positive: false, value: "" }
          }
        />

        <MetricCard
          title="Margin Keuntungan"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              `${reportMetrics.profitMargin.toFixed(2)}%`
            )
          }
          trend={
            reportMetrics.profitMargin >= 0
              ? { positive: true, value: "" }
              : { positive: false, value: "" }
          }
        />
      </div>

      {/* Tab Navigation */}
      <ReportTabs tabs={tabs} activeTab={tabValue} onChange={handleChangeTab} />

      {/* Revenue & Expense Trend Chart */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">
              Trend Pendapatan & Pengeluaran
            </h3>
            {loading ? (
              <LoadingIndicator />
            ) : (
              <>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={financeData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDateForChart}
                      />
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
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Pendapatan"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        name="Pengeluaran"
                        stroke="#ff7300"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        name="Keuntungan"
                        stroke="#28a745"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <Divider />

                <h3 className="text-lg font-medium mb-4">
                  Detail Pendapatan & Pengeluaran
                </h3>
                <DataTable
                  columns={[
                    {
                      header: "Tanggal",
                      cell: (row) => formatDateFull(row.date),
                    },
                    {
                      header: "Pendapatan",
                      cell: (row) => formatCurrency(row.revenue),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Pengeluaran",
                      cell: (row) => formatCurrency(row.expenses),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Keuntungan",
                      cell: (row) => (
                        <span
                          className={
                            row.profit >= 0 ? "text-green-600" : "text-red-600"
                          }
                        >
                          {formatCurrency(row.profit)}
                        </span>
                      ),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Margin (%)",
                      cell: (row) => (
                        <span
                          className={
                            (row.profit / row.revenue) * 100 >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {((row.profit / row.revenue) * 100).toFixed(2)}%
                        </span>
                      ),
                      cellClassName: "text-right",
                    },
                  ]}
                  data={financeData}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Methods Chart */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Metode Pembayaran</h3>
            {loading ? (
              <LoadingIndicator />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${formatPaymentMethod(name)}: ${(
                            percent * 100
                          ).toFixed(0)}%`
                        }
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <DataTable
                    columns={[
                      {
                        header: "Metode Pembayaran",
                        cell: (row, index) => (
                          <div className="flex items-center">
                            <div
                              className="w-4 h-4 rounded-full mr-2"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            ></div>
                            {formatPaymentMethod(row.name)}
                          </div>
                        ),
                      },
                      {
                        header: "Total",
                        cell: (row) => formatCurrency(row.value),
                        cellClassName: "text-right",
                      },
                      {
                        header: "Persentase",
                        cell: (row) => {
                          const totalValue = paymentMethodData.reduce(
                            (sum, method) => sum + method.value,
                            0
                          );
                          return `${((row.value / totalValue) * 100).toFixed(
                            2
                          )}%`;
                        },
                        cellClassName: "text-right",
                      },
                    ]}
                    data={paymentMethodData}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Expense Analysis */}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Analisis Pengeluaran</h3>
            {loading ? (
              <LoadingIndicator />
            ) : (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "Pembelian Stok",
                        value: Math.floor(Math.random() * 3000000) + 2000000,
                      },
                      {
                        name: "Gaji Karyawan",
                        value: Math.floor(Math.random() * 2000000) + 1500000,
                      },
                      {
                        name: "Sewa",
                        value: Math.floor(Math.random() * 1500000) + 1000000,
                      },
                      {
                        name: "Utilitas",
                        value: Math.floor(Math.random() * 800000) + 500000,
                      },
                      {
                        name: "Pemasaran",
                        value: Math.floor(Math.random() * 600000) + 300000,
                      },
                      {
                        name: "Lainnya",
                        value: Math.floor(Math.random() * 400000) + 200000,
                      },
                    ]}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickFormatter={(value) =>
                        `${(value / 1000000).toFixed(1)}jt`
                      }
                    />
                    <YAxis type="category" dataKey="name" />
                    <RechartsTooltip
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="value" name="Pengeluaran" fill="#ff7300" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tax & Fees Chart */}
      {tabValue === 3 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Pajak & Biaya Tambahan</h3>
            {loading ? (
              <LoadingIndicator />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="text-base font-medium mb-2">Total Pajak</h4>
                  <p className="text-2xl font-bold mb-1">
                    {formatCurrency(
                      Math.floor(Math.random() * 2000000) + 1000000
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {(Math.random() * 10 + 2).toFixed(1)}% dari total pendapatan
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="text-base font-medium mb-2">Biaya Layanan</h4>
                  <p className="text-2xl font-bold mb-1">
                    {formatCurrency(
                      Math.floor(Math.random() * 1000000) + 500000
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {(Math.random() * 5 + 1).toFixed(1)}% dari total pendapatan
                  </p>
                </div>

                <div className="col-span-1 md:col-span-2 mt-4">
                  <h4 className="text-base font-medium mb-4">
                    Biaya Transaksi per Metode Pembayaran
                  </h4>
                  <DataTable
                    columns={[
                      {
                        header: "Metode Pembayaran",
                        cell: (row) => formatPaymentMethod(row.name),
                      },
                      {
                        header: "Total Transaksi",
                        cell: (row) => formatCurrency(row.value),
                        cellClassName: "text-right",
                      },
                      {
                        header: "Biaya Layanan",
                        cell: (row) => {
                          const serviceFee =
                            row.value * (Math.random() * 0.03 + 0.01);
                          return formatCurrency(serviceFee);
                        },
                        cellClassName: "text-right",
                      },
                      {
                        header: "Persentase Biaya",
                        cell: (row) => {
                          const serviceFee =
                            row.value * (Math.random() * 0.03 + 0.01);
                          return `${((serviceFee / row.value) * 100).toFixed(
                            2
                          )}%`;
                        },
                        cellClassName: "text-right",
                      },
                    ]}
                    data={paymentMethodData}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinanceReport;
