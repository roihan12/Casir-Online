import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  RefreshCcw,
  Users,
  TrendingUp,
  Award,
  ListFilter,
} from "lucide-react";
import {
  useCustomerSummary,
  useTopCustomers,
  useLoyaltyMetrics,
  useCustomerAcquisition,
} from "../hooks/useReports";
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

const CustomerLoyaltyReport = () => {
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [segment, setSegment] = useState("all");
  const [topLimit, setTopLimit] = useState(10);

  const {
    availableBranches,
    selectedBranches,
    setSelectedBranches,
    cabangFilterParam,
    isDisabled,
  } = useUserBranches("customer");

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

    if (segment !== "all") params.segmen = segment;

    return params;
  }, [startDate, endDate, cabangFilterParam, segment]);

  const topParams = { ...apiParams, limit: topLimit };

  const { data: summaryData, isLoading: loadingSummary, refetch: refetchSummary } = useCustomerSummary(apiParams);
  const { data: topData, isLoading: loadingTop, refetch: refetchTop } = useTopCustomers(topParams);
  const { data: loyaltyData, isLoading: loadingLoyalty, refetch: refetchLoyalty } = useLoyaltyMetrics(apiParams);
  const { data: acquisitionData, isLoading: loadingAcquisition, refetch: refetchAcquisition } = useCustomerAcquisition(apiParams);

  const loading = loadingSummary || loadingTop || loadingLoyalty || loadingAcquisition;

  const handleRefreshData = () => {
    refetchSummary();
    refetchTop();
    refetchLoyalty();
    refetchAcquisition();
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
    { value: 0, label: "Ringkasan Customer", icon: <Users size={16} /> },
    { value: 1, label: "Top Customer", icon: <Award size={16} /> },
    { value: 2, label: "Loyalty Program", icon: <TrendingUp size={16} /> },
    { value: 3, label: "Akuisisi", icon: <Users size={16} /> },
  ];

  const segmentOptions = [
    { value: "all", label: "Semua Segmen" },
    { value: "VIP", label: "VIP" },
    { value: "Retail", label: "Retail" },
    { value: "Grosir", label: "Grosir" },
  ];

  const summaryMetrics = summaryData?.data || {
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomers: 0,
    avgSpending: 0,
  };

  const topCustomers = topData?.data || [];
  const loyalty = loyaltyData?.data || {
    members: 0,
    activeMembers: 0,
    pointsIssued: 0,
    pointsRedeemed: 0,
  };
  const acquisitionTrend = acquisitionData?.data || [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Laporan Customer & Loyalty</h1>

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
              <ExportDropdown reportType="loyalty" params={apiParams} disabled={loading} />
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
              id="segment"
              label="Segmen Customer"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              options={segmentOptions}
            />
            <BranchMultiSelect
              availableBranches={availableBranches}
              selectedBranches={selectedBranches}
              onChange={setSelectedBranches}
              isDisabled={isDisabled}
            />
          </div>
        </CardContent>
      </Card>

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

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-6">
        <MetricCard
          title="Total Customer"
          value={loadingSummary ? <LoadingIndicator size="sm" /> : summaryMetrics.totalCustomers}
        />
        <MetricCard
          title="Total Poin"
          value={loadingSummary ? <LoadingIndicator size="sm" /> : summaryMetrics.totalPoints}
        />
        <MetricCard
          title="Customer Baru"
          value={loadingSummary ? <LoadingIndicator size="sm" /> : summaryMetrics.newCustomers}
        />
        <MetricCard
          title="Rata-rata Pembelian"
          value={loadingSummary ? <LoadingIndicator size="sm" /> : formatCurrency(summaryMetrics.avgRevenuePerCustomer)}
        />
      </div>

      <ReportTabs tabs={tabs} activeTab={tabValue} onChange={setTabValue} />

      {tabValue === 0 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Ringkasan Customer</h3>
            {loadingSummary ? (
              <LoadingIndicator />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-purple-50 border border-purple-200">
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-1">Retention Rate</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {summaryMetrics.retentionRate?.toFixed(1) || 0}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border border-green-200">
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-1">Customer Lifetime Value</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(summaryMetrics.customerLifetimeValue || 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border border-blue-200">
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-1">Repeat Purchase Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {summaryMetrics.repeatPurchaseRate?.toFixed(1) || 0}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Top Customer</h3>
              <FormSelect
                id="top-limit"
                label=""
                value={topLimit}
                onChange={(e) => setTopLimit(Number(e.target.value))}
                options={[
                  { value: 10, label: "Top 10" },
                  { value: 20, label: "Top 20" },
                  { value: 50, label: "Top 50" },
                ]}
              />
            </div>
            {loadingTop ? (
              <LoadingIndicator />
            ) : topCustomers.length > 0 ? (
              <>
                <div className="h-[400px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCustomers} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
                      <YAxis type="category" dataKey="namaPelanggan" width={150} />
                      <RechartsTooltip formatter={(v) => formatCurrency(v)} />
                      <Bar dataKey="totalBelanja" name="Total Belanja" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <Divider />
                <DataTable
                  columns={[
                    { header: "Rank", cell: (row, rowIndex) => (rowIndex ?? 0) + 1, cellClassName: "text-center" },
                    { header: "Nama Customer", accessor: "namaPelanggan" },
                    { header: "Segmen", accessor: "segmen" },
                    {
                      header: "Total Belanja",
                      cell: (row) => formatCurrency(row.totalBelanja),
                      cellClassName: "text-right",
                    },
                    { header: "Jumlah Transaksi", accessor: "totalTransaksi", cellClassName: "text-right" },
                    {
                      header: "Rata-rata",
                      cell: (row) => formatCurrency(row.avgTransaksi),
                      cellClassName: "text-right",
                    },
                  ]}
                  data={topCustomers}
                />
              </>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data customer</p>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Loyalty Program Metrics</h3>
            {loadingLoyalty ? (
              <LoadingIndicator />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-indigo-50 border border-indigo-200">
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-1">Redemption Rate</p>
                    <p className="text-2xl font-bold text-indigo-600">{loyalty.redemptionRate.toFixed(2)}%</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border border-green-200">
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-1">Net Poin</p>
                    <p className="text-2xl font-bold text-green-600">{loyalty.netPoints}</p>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50 border border-yellow-200">
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-1">Poin Diterbitkan</p>
                    <p className="text-2xl font-bold text-yellow-600">{loyalty.totalPointsEarned?.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border border-red-200">
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-1">Poin Ditukar</p>
                    <p className="text-2xl font-bold text-red-600">{loyalty.totalPointsRedeemed?.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 3 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Trend Akuisisi Customer</h3>
            {loadingAcquisition ? (
              <LoadingIndicator />
            ) : acquisitionTrend.length > 0 ? (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={acquisitionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => new Date(v).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    />
                    <YAxis />
                    <RechartsTooltip labelFormatter={(v) => new Date(v).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} />
                    <Legend />
                    <Line type="monotone" dataKey="count" name="Customer Baru" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data trend</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerLoyaltyReport;
