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
  Banknote,
  Users,
  TrendingUp,
  ListFilter,
  Clock,
} from "lucide-react";
import { useShiftSummary, useCashReport, useStaffPerformance } from "../hooks/useReports";
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

const ShiftPerformanceReport = () => {
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [shiftStatus, setShiftStatus] = useState("all");

  // Multi-branch selection
  const {
    availableBranches,
    selectedBranches,
    setSelectedBranches,
    cabangFilterParam,
    isDisabled,
  } = useUserBranches("shift");

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

    if (shiftStatus !== "all") {
      params.status = shiftStatus;
    }

    return params;
  }, [startDate, endDate, cabangFilterParam, shiftStatus]);

  // Fetch data
  const { data: shiftSummary, isLoading: loadingSummary, refetch: refetchSummary } = useShiftSummary(apiParams);
  const { data: cashData, isLoading: loadingCash, refetch: refetchCash } = useCashReport(apiParams);
  const { data: staffData, isLoading: loadingStaff, refetch: refetchStaff } = useStaffPerformance(apiParams);

  const loading = loadingSummary || loadingCash || loadingStaff;

  const handleRefreshData = () => {
    refetchSummary();
    refetchCash();
    refetchStaff();
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
    { value: 0, label: "Ringkasan Shift", icon: <Clock size={16} /> },
    { value: 1, label: "Laporan Kas", icon: <Banknote size={16} /> },
    { value: 2, label: "Kinerja Staff", icon: <Users size={16} /> },
  ];

  const statusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "AKTIF", label: "Aktif" },
    { value: "SELESAI", label: "Selesai" },
  ];

  // Extract data safely from backend response structure
  const summaryMetrics = shiftSummary?.data?.summary || {
    totalShifts: 0,
    completedShifts: 0,
    activeShifts: 0,
    totalTransaksi: 0,
    totalPendapatan: 0,
    avgTransaksiPerShift: 0,
    avgPendapatanPerShift: 0,
    totalKasAwal: 0,
    totalKasAkhir: 0,
    totalSelisihKas: 0,
  };

  // Cash report is array directly from backend
  const cashReport = cashData?.data || [];

  const staffPerformance = staffData?.data || [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Laporan Kinerja Shift & Staff</h1>

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
                reportType="shift"
                params={apiParams}
                disabled={loading}
              />
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
              id="shift-status"
              label="Status Shift"
              value={shiftStatus}
              onChange={(e) => setShiftStatus(e.target.value)}
              options={statusOptions}
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

      {/* Report Period Info */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-600">
          Periode: {formatDateFull(startDate)} - {formatDateFull(endDate)}
        </p>
        <StatusChip
          label={
            selectedBranches.length === availableBranches.length && !isDisabled
              ? "Semua Cabang"
              : selectedBranches.length === 1
              ? "1 Cabang"
              : `${selectedBranches.length} Cabang`
          }
          color={selectedBranches.length === availableBranches.length ? "primary" : "secondary"}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard
          title="Total Shift"
          value={loadingSummary ? <LoadingIndicator size="sm" /> : summaryMetrics.totalShifts}
        />
        <MetricCard
          title="Total Pendapatan"
          value={loadingSummary ? <LoadingIndicator size="sm" /> : formatCurrency(summaryMetrics.totalPendapatan)}
        />
        <MetricCard
          title="Rata-rata per Shift"
          value={loadingSummary ? <LoadingIndicator size="sm" /> : formatCurrency(summaryMetrics.avgPendapatanPerShift)}
        />
        <MetricCard
          title="Total Transaksi"
          value={loadingSummary ? <LoadingIndicator size="sm" /> : summaryMetrics.totalTransaksi?.toLocaleString()}
        />
      </div>

      {/* Tab Navigation */}
      <ReportTabs tabs={tabs} activeTab={tabValue} onChange={setTabValue} />

      {/* Tab Content */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Ringkasan Shift</h3>
            {loadingSummary ? (
              <LoadingIndicator />
            ) : shiftSummary?.data?.shifts?.length > 0 ? (
              <DataTable
                columns={[
                  {
                    header: "Tanggal",
                    cell: (row) => new Date(row.waktuMulai).toLocaleDateString("id-ID"),
                  },
                  { header: "Kasir", accessor: "kasir" },
                  { header: "Cabang", accessor: "cabang" },
                  {
                    header: "Jam Mulai",
                    cell: (row) => new Date(row.waktuMulai).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
                  },
                  {
                    header: "Jam Selesai",
                    cell: (row) => row.waktuSelesai ? new Date(row.waktuSelesai).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-",
                  },
                  {
                    header: "Kas Awal",
                    cell: (row) => formatCurrency(row.kasAwal),
                    cellClassName: "text-right",
                  },
                  {
                    header: "Pendapatan",
                    cell: (row) => formatCurrency(row.totalPendapatan),
                    cellClassName: "text-right",
                  },
                  {
                    header: "Transaksi",
                    accessor: "totalTransaksi",
                    cellClassName: "text-right",
                  },
                  {
                    header: "Selisih Kas",
                    cell: (row) => row.selisihKas !== null ? (
                      <span className={row.selisihKas < 0 ? "text-red-600" : row.selisihKas > 0 ? "text-green-600" : ""}>
                        {formatCurrency(row.selisihKas)}
                      </span>
                    ) : "-",
                    cellClassName: "text-right",
                  },
                  {
                    header: "Status",
                    cell: (row) => (
                      <StatusChip
                        label={row.status}
                        color={row.status === "aktif" ? "success" : "default"}
                      />
                    ),
                  },
                ]}
                data={shiftSummary.data.shifts}
              />
            ) : (
              <p className="text-gray-600 text-center py-8">
                Tidak ada data shift untuk ditampilkan
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Laporan Selisih Kas</h3>
            {loadingCash ? (
              <LoadingIndicator />
            ) : (
              <>
                {cashReport?.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card className="bg-blue-50 border border-blue-200">
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-1">Total Shift Selesai</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {cashReport.length}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 border border-green-200">
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-1">Kas Match</p>
                          <p className="text-2xl font-bold text-green-600">
                            {cashReport.filter(s => s.status === "match").length}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-orange-50 border border-orange-200">
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-1">Shift dengan Selisih</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {cashReport.filter(s => s.status !== "match").length}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <DataTable
                      columns={[
                        {
                          header: "Tanggal",
                          cell: (row) => new Date(row.waktuMulai).toLocaleDateString("id-ID"),
                        },
                        { header: "Kasir", accessor: "kasir" },
                        { header: "Cabang", accessor: "cabang" },
                        {
                          header: "Kas Awal",
                          cell: (row) => formatCurrency(row.kasAwal),
                          cellClassName: "text-right",
                        },
                        {
                          header: "Penjualan",
                          cell: (row) => formatCurrency(row.totalPenjualan),
                          cellClassName: "text-right",
                        },
                        {
                          header: "Kas Seharusnya",
                          cell: (row) => formatCurrency(row.kasSeharusnya),
                          cellClassName: "text-right",
                        },
                        {
                          header: "Kas Aktual",
                          cell: (row) => formatCurrency(row.kasAktual),
                          cellClassName: "text-right",
                        },
                        {
                          header: "Selisih",
                          cell: (row) => (
                            <span className={row.selisih < 0 ? "text-red-600 font-semibold" : row.selisih > 0 ? "text-green-600 font-semibold" : ""}>
                              {formatCurrency(row.selisih)}
                            </span>
                          ),
                          cellClassName: "text-right",
                        },
                        {
                          header: "Status",
                          cell: (row) => (
                            <StatusChip
                              label={row.status === "match" ? "Match" : row.status === "over" ? "Over" : "Short"}
                              color={row.status === "match" ? "success" : "warning"}
                            />
                          ),
                        },
                      ]}
                      data={cashReport}
                    />
                  </>
                ) : (
                  <p className="text-gray-600 text-center py-8">
                    Tidak ada selisih kas yang terdeteksi
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Kinerja Staff</h3>
            {loadingStaff ? (
              <LoadingIndicator />
            ) : staffPerformance.length > 0 ? (
              <>
                <div className="h-[400px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={staffPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="namaStaff" />
                      <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`} />
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="totalPendapatan" name="Pendapatan" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <Divider />

                <h3 className="text-lg font-medium mb-4 mt-6">Detail Kinerja Staff</h3>
                <DataTable
                  columns={[
                    { header: "Nama Staff", accessor: "namaStaff" },
                    {
                      header: "Total Shift",
                      accessor: "totalShift",
                      cellClassName: "text-right",
                    },
                    {
                      header: "Shift Selesai",
                      accessor: "completedShift",
                      cellClassName: "text-right",
                    },
                    {
                      header: "Total Pendapatan",
                      cell: (row) => formatCurrency(row.totalPendapatan),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Total Transaksi",
                      accessor: "totalTransaksi",
                      cellClassName: "text-right",
                    },
                    {
                      header: "Rata-rata per Shift",
                      cell: (row) => formatCurrency(row.avgPendapatanPerShift),
                      cellClassName: "text-right",
                    },
                  ]}
                  data={staffPerformance}
                />
              </>
            ) : (
              <p className="text-gray-600 text-center py-8">
                Tidak ada data kinerja staff
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShiftPerformanceReport;
