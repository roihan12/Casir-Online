import { ChevronDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import formatCurrency from "../../utils/formatCurrency";

const SalesTrendChart = ({ isGlobalView, cabang, revenueTimeSeries }) => {
  const salesData = revenueTimeSeries || [];

  // Calculate max revenue for chart scaling
  const maxRevenue = Math.max(...salesData.map((item) => item.revenue), 0);

  // Calculate total and average revenue
  const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
  const averageRevenue = salesData.length ? totalRevenue / salesData.length : 0;

  // Calculate percent change from first to last day
  const percentChange =
    salesData.length >= 2
      ? (
          ((salesData[salesData.length - 1].revenue - salesData[0].revenue) /
            salesData[0].revenue) *
          100
        ).toFixed(1)
      : 0;

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  return (
    <div className="mx-6 bg-white rounded-xl shadow-sm mb-6">
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-medium">
            {isGlobalView
              ? "Trend Penjualan (Semua Cabang)"
              : `Trend Penjualan (${cabang})`}
          </h3>
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs py-1 px-2 rounded-full ${
                parseFloat(percentChange) >= 0
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {parseFloat(percentChange) >= 0 ? "+" : ""}
              {percentChange}%
            </span>
            <button className="flex items-center text-xs text-gray-500">
              <span>30 Hari</span>
              <ChevronDown size={14} className="ml-1" />
            </button>
          </div>
        </div>

        {/* Line Chart */}
        <div className="h-56 w-full bg-white rounded-lg overflow-hidden">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={salesData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                formatter={(value, name, props) => [
                  formatCurrency(value),
                  `Pendapatan ${props.payload.branchName} (${props.payload.branchId}`,
                ]}
                labelFormatter={formatDate}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Total Penjualan</div>
            <div className="text-lg font-semibold">
              {formatCurrency(totalRevenue)}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Rata-rata Harian</div>
            <div className="text-lg font-semibold">
              {formatCurrency(averageRevenue)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesTrendChart;
