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
  Tag,
  TrendingDown,
  Percent,
  ListFilter,
} from "lucide-react";
import { usePromoSummary, useDiscountBreakdown } from "../hooks/useReports";
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
  Button,
  Divider,
} from "../components/ReportComponents";
import ExportDropdown from "../components/ExportDropdown";
import BranchMultiSelect from "../components/BranchMultiSelect";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const PromoDiscountReport = () => {
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const {
    availableBranches,
    selectedBranches,
    setSelectedBranches,
    cabangFilterParam,
    isDisabled,
  } = useUserBranches("promo");

  const apiParams = useMemo(() => {
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

  const { data: promoData, isLoading: loadingPromo, refetch: refetchPromo } = usePromoSummary(apiParams);
  const { data: discountData, isLoading: loadingDiscount, refetch: refetchDiscount } = useDiscountBreakdown(apiParams);

  const loading = loadingPromo || loadingDiscount;

  const handleRefreshData = () => {
    refetchPromo();
    refetchDiscount();
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
    { value: 0, label: "Ringkasan Promo", icon: <Tag size={16} /> },
    { value: 1, label: "Breakdown Diskon", icon: <Percent size={16} /> },
    { value: 2, label: "ROI Analysis", icon: <TrendingDown size={16} /> },
  ];

  // Backend returns array of promos directly
  const promos = promoData?.data || [];
  
  // Calculate summary metrics from promos array
  const promoSummary = {
    totalPromoUsage: promos.reduce((sum, p) => sum + p.totalPenggunaan, 0),
    totalDiscount: promos.reduce((sum, p) => sum + p.totalDiskon, 0),
    totalSales: promos.reduce((sum, p) => sum + p.totalTransaksi, 0),
    roi: promos.length > 0 ? promos.reduce((sum, p) => sum + p.roi, 0) / promos.length : 0,
  };
  
  // Backend returns object with breakdown structure
  const discountBreakdown = discountData?.data || { total: 0, breakdown: {} };
  
  // Transform breakdown for charts and tables
  const breakdownData = discountBreakdown.breakdown ? [
    { tipeDiskon: "Promo", amount: discountBreakdown.breakdown.promo?.amount || 0, percentage: discountBreakdown.breakdown.promo?.percentage || 0 },
    { tipeDiskon: "Manual", amount: discountBreakdown.breakdown.manual?.amount || 0, percentage: discountBreakdown.breakdown.manual?.percentage || 0 },
    { tipeDiskon: "Member", amount: discountBreakdown.breakdown.member?.amount || 0, percentage: discountBreakdown.breakdown.member?.percentage || 0 },
  ].filter(item => item.amount > 0) : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Laporan Promo & Diskon</h1>

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
              <ExportDropdown reportType="promo" params={apiParams} disabled={loading} />
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
          title="Total Penggunaan"
          value={loadingPromo ? <LoadingIndicator size="sm" /> : promoSummary.totalPromoUsage}
        />
        <MetricCard
          title="Total Diskon"
          value={loadingPromo ? <LoadingIndicator size="sm" /> : formatCurrency(promoSummary.totalDiscount)}
        />
        <MetricCard
          title="Total Penjualan"
          value={loadingPromo ? <LoadingIndicator size="sm" /> : formatCurrency(promoSummary.totalSales)}
        />
        <MetricCard
          title="ROI"
          value={
            loadingPromo ? (
              <LoadingIndicator size="sm" />
            ) : (
              <span className={promoSummary.roi >= 1 ? "text-green-600" : "text-red-600"}>
                {promoSummary.roi?.toFixed(2)}x
              </span>
            )
          }
        />
      </div>

      <ReportTabs tabs={tabs} activeTab={tabValue} onChange={setTabValue} />

      {tabValue === 0 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Ringkasan Promo</h3>
            {loadingPromo ? (
              <LoadingIndicator />
            ) : promos.length > 0 ? (
              <>
                <div className="h-[400px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={promos}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="namaPromo" />
                      <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                      <RechartsTooltip formatter={(v) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="totalDiskon" name="Total Diskon" fill="#ff7300" />
                      <Bar dataKey="totalTransaksi" name="Total Transaksi" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <Divider />
                <DataTable
                  columns={[
                    { header: "Nama Promo", accessor: "namaPromo" },
                    { header: "Penggunaan", accessor: "totalPenggunaan", cellClassName: "text-right" },
                    {
                      header: "Total Diskon",
                      cell: (row) => formatCurrency(row.totalDiskon),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Total Transaksi",
                      cell: (row) => formatCurrency(row.totalTransaksi),
                      cellClassName: "text-right",
                    },
                    {
                      header: "ROI",
                      cell: (row) => (
                        <span className={row.roi >= 1 ? "text-green-600 font-semibold" : "text-red-600"}>
                          {row.roi?.toFixed(2)}x
                        </span>
                      ),
                      cellClassName: "text-right",
                    },
                  ]}
                  data={promos}
                />
              </>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data promo</p>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Breakdown Tipe Diskon</h3>
            {loadingDiscount ? (
              <LoadingIndicator />
            ) : breakdownData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdownData}
                        dataKey="amount"
                        nameKey="tipeDiskon"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={({ tipeDiskon, percentage }) => `${tipeDiskon}: ${percentage.toFixed(1)}%`}
                      >
                        {breakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(v) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <DataTable
                  columns={[
                    { header: "Tipe Diskon", accessor: "tipeDiskon" },
                    {
                      header: "Total Diskon",
                      cell: (row) => formatCurrency(row.amount),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Persentase",
                      cell: (row) => `${row.percentage?.toFixed(1)}%`,
                      cellClassName: "text-right",
                    },
                  ]}
                  data={breakdownData}
                />
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data breakdown</p>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">ROI Analysis</h3>
            {loadingPromo ? (
              <LoadingIndicator />
            ) : promos.length > 0 ? (
              <>
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>ROI (Return on Investment)</strong> mengukur efektivitas promo. ROI &gt; 1 berarti
                    penjualan yang dihasilkan lebih besar dari biaya diskon.
                  </p>
                </div>

                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={promos}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="namaPromo" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="roi" name="ROI" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data ROI</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PromoDiscountReport;
