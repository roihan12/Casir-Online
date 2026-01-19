import { 
  TrendingUp, AlertTriangle, DollarSign, Clock, RefreshCw, ShoppingCart, Package
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Card, Button } from '@shared/ui';
import { useBranch } from '@shared/hooks';
import { StatsCard } from '@widgets/stats-card';
import MainLayout from '@widgets/layout/MainLayout';
import { useDashboard, useActiveShift } from '@entities/dashboard';
import { formatRupiah, formatNumber, formatPercent, formatTime } from '@shared/lib';

const DashboardPage = () => {
  const { activeBranchId, activeBranchName } = useBranch();

  // Fetch dashboard data
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useDashboard();

  // Fetch active shift
  const { data: shiftData } = useActiveShift(activeBranchId);

  // Extract data from API response
  const salesSummary = dashboardData?.data?.salesSummary || {};
  const transactionCounts = dashboardData?.data?.transactionCounts || {};
  const criticalAlerts = dashboardData?.data?.criticalAlerts || {};
  const revenueTimeSeries = dashboardData?.data?.revenueTimeSeries || [];
  const topProducts = dashboardData?.data?.productPerformance || [];
  const categoryDistribution = dashboardData?.data?.categoryDistribution || [];
  const shift = shiftData?.data;

  // Pie chart colors
  const COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#a78bfa'];

  return (
    <MainLayout 
      title={`Halo, ${activeBranchName || 'User'}`}
      subtitle="Selamat datang kembali!"
    >
      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => refetchDashboard()}
          leftIcon={<RefreshCw className={`w-4 h-4 ${dashboardLoading ? 'animate-spin' : ''}`} />}
          className="text-gray-600"
        >
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {dashboardError && (
        <Card className="bg-red-50 border-red-200 mb-4">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <p>Gagal memuat data dashboard. Silakan coba lagi.</p>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Penjualan Hari Ini"
          value={salesSummary.daily?._sum?.total || 0}
          icon={DollarSign}
          change={salesSummary.daily?.percentageChange}
          format="currency"
          loading={dashboardLoading}
          color="text-emerald-500"
        />
        <StatsCard
          title="Transaksi"
          value={transactionCounts.today || 0}
          icon={ShoppingCart}
          change={transactionCounts.percentageChange}
          format="number"
          loading={dashboardLoading}
          color="text-blue-500"
        />
        <StatsCard
          title="Rata-rata Transaksi"
          value={dashboardData?.data?.averageTransactionValue?.average || 0}
          icon={TrendingUp}
          format="currency"
          loading={dashboardLoading}
          color="text-purple-500"
        />
        <StatsCard
          title="Item Terjual"
          value={transactionCounts.itemsSold || salesSummary.daily?._count?.transaksi_id || 0}
          icon={Package}
          format="number"
          loading={dashboardLoading}
          color="text-pink-500"
        />
      </div>

      {/* Shift Info */}
      {shift && (
        <Card className="mb-6 bg-indigo-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Shift Aktif</p>
              <p className="text-sm text-gray-500">Mulai: {formatTime(shift.startTime)} • Kasir: {shift.user?.namaLengkap}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title className="text-gray-800">Tren Penjualan (7 Hari)</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="h-64">
              {dashboardLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
                </div>
              ) : revenueTimeSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTimeSeries}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`}
                    />
                    <Tooltip 
                      formatter={(value) => [formatRupiah(value), 'Penjualan']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#818cf8" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">Tidak ada data</div>
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Category Distribution */}
        <Card>
          <Card.Header>
            <Card.Title className="text-gray-800">Kategori Penjualan</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="h-48">
              {dashboardLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
                </div>
              ) : categoryDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="category"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatNumber(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">Tidak ada data</div>
              )}
            </div>
            {/* Legend */}
            <div className="mt-4 space-y-2">
              {categoryDistribution.slice(0, 4).map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-gray-600 truncate">{cat.category}</span>
                  </div>
                  <span className="text-gray-800 font-medium">{formatPercent(cat.percentage, false)}</span>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <Card.Header>
            <Card.Title className="text-gray-800">Produk Terlaris</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              {dashboardLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : topProducts.length > 0 ? (
                topProducts.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center gap-4 glass-surface p-3 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{product.name}</p>
                      <p className="text-sm text-gray-500">{formatNumber(product.quantitySold)} terjual</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{formatRupiah(product.revenue)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">Belum ada data produk</p>
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Critical Alerts */}
        <Card>
          <Card.Header>
            <Card.Title className="text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Peringatan
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              {criticalAlerts?.lowStockProducts?.count > 0 && (
                <div className="glass-surface p-3 rounded-xl border-l-4 border-amber-400">
                  <p className="text-sm font-medium text-gray-800">Stok Rendah</p>
                  <p className="text-xs text-gray-500">
                    {criticalAlerts.lowStockProducts.count} produk perlu restock
                  </p>
                </div>
              )}
              {criticalAlerts?.expiringStock?.count > 0 && (
                <div className="glass-surface p-3 rounded-xl border-l-4 border-red-400">
                  <p className="text-sm font-medium text-gray-800">Hampir Kadaluarsa</p>
                  <p className="text-xs text-gray-500">
                    {criticalAlerts.expiringStock.count} produk segera kadaluarsa
                  </p>
                </div>
              )}
              {criticalAlerts?.pendingApprovals > 0 && (
                <div className="glass-surface p-3 rounded-xl border-l-4 border-blue-400">
                  <p className="text-sm font-medium text-gray-800">Persetujuan Pending</p>
                  <p className="text-xs text-gray-500">
                    {criticalAlerts.pendingApprovals} permintaan menunggu
                  </p>
                </div>
              )}
              {!criticalAlerts?.lowStockProducts?.count && !criticalAlerts?.expiringStock?.count && !criticalAlerts?.pendingApprovals && (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-gray-500 text-sm">Semua berjalan baik!</p>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
