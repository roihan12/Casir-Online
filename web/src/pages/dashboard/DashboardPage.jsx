import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, AlertTriangle, DollarSign, Clock, RefreshCw, ShoppingCart, Package,
  ChevronRight, X, AlertCircle, Building2, BarChart3
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { Card, Button, Modal } from '@shared/ui';
import { useBranch } from '@shared/hooks';
import { StatsCard } from '@widgets/stats-card';
import MainLayout from '@widgets/layout/MainLayout';
import { useDashboard, useActiveShift } from '@entities/dashboard';
import { formatRupiah, formatNumber, formatPercent, formatTime } from '@shared/lib';

// Period options for stats
const PERIODS = [
  { key: 'daily', label: 'Hari Ini' },
  { key: 'weekly', label: 'Minggu Ini' },
  { key: 'monthly', label: 'Bulan Ini' },
  { key: 'yearly', label: 'Tahun Ini' },
];

// Severity color mapping
const SEVERITY_CONFIG = {
  critical: { 
    bg: 'bg-red-50', 
    border: 'border-red-400', 
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    icon: 'text-red-500'
  },
  high: { 
    bg: 'bg-orange-50', 
    border: 'border-orange-400', 
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700',
    icon: 'text-orange-500'
  },
  medium: { 
    bg: 'bg-yellow-50', 
    border: 'border-yellow-400', 
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-700',
    icon: 'text-yellow-500'
  },
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { activeBranchId, activeBranchName, hasMultipleBranches, isViewingAllBranches, isSuperAdmin } = useBranch();
  
  // State
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showExpiringModal, setShowExpiringModal] = useState(false);
  const [alertFilter, setAlertFilter] = useState('all'); // all, critical, high, medium

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
  const branchPerformance = dashboardData?.data?.branchPerformance || {};
  const shift = shiftData?.data;

  // Get current period sales data
  const currentPeriodData = salesSummary[selectedPeriod] || {};
  
  // Process low stock products by severity
  const lowStockProducts = criticalAlerts?.lowStockProducts?.details || [];
  
  const { severityCounts, filteredProducts } = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0 };
    lowStockProducts.forEach(p => {
      if (counts[p.severity] !== undefined) counts[p.severity]++;
    });
    
    const filtered = alertFilter === 'all' 
      ? lowStockProducts 
      : lowStockProducts.filter(p => p.severity === alertFilter);
    
    return { severityCounts: counts, filteredProducts: filtered };
  }, [lowStockProducts, alertFilter]);

  // Pie chart colors
  const COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#a78bfa'];
  
  // Branch comparison chart data
  const branchChartData = branchPerformance?.topBranches?.map(b => ({
    name: b.name?.substring(0, 15) || 'Unknown',
    revenue: b.revenue || 0,
  })) || [];

  return (
    <MainLayout 
      title={`Halo, ${activeBranchName || 'User'}`}
      subtitle="Selamat datang kembali!"
    >
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        {/* Period Toggle */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {PERIODS.map(period => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                selectedPeriod === period.key
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
        
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

      {/* Stats Grid - Dynamic based on period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title={`Penjualan ${PERIODS.find(p => p.key === selectedPeriod)?.label}`}
          value={currentPeriodData._sum?.total || 0}
          icon={DollarSign}
          change={currentPeriodData.percentageChange}
          format="currency"
          loading={dashboardLoading}
          color="text-emerald-500"
        />
        <StatsCard
          title="Transaksi"
          value={selectedPeriod === 'daily' ? transactionCounts.today : currentPeriodData._count?.transaksi_id || 0}
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
          value={transactionCounts.itemsSold || currentPeriodData._count?.transaksi_id || 0}
          icon={Package}
          format="number"
          loading={dashboardLoading}
          color="text-pink-500"
        />
      </div>

      {/* Alert Summary with Severity Colors */}
      {(criticalAlerts?.lowStockProducts?.count > 0 || criticalAlerts?.expiringStock?.count > 0) && (
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {/* Critical Count */}
          <button
            onClick={() => { setAlertFilter('critical'); setShowLowStockModal(true); }}
            className="glass-surface p-4 rounded-xl border-l-4 border-red-500 hover:bg-red-50/50 transition-colors text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{severityCounts.critical}</p>
                <p className="text-sm text-gray-600">Stok Kritis</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </button>
          
          {/* High Count */}
          <button
            onClick={() => { setAlertFilter('high'); setShowLowStockModal(true); }}
            className="glass-surface p-4 rounded-xl border-l-4 border-orange-500 hover:bg-orange-50/50 transition-colors text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{severityCounts.high}</p>
                <p className="text-sm text-gray-600">Stok Rendah</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
          </button>
          
          {/* Medium Count */}
          <button
            onClick={() => { setAlertFilter('medium'); setShowLowStockModal(true); }}
            className="glass-surface p-4 rounded-xl border-l-4 border-yellow-500 hover:bg-yellow-50/50 transition-colors text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{severityCounts.medium}</p>
                <p className="text-sm text-gray-600">Perlu Perhatian</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </button>
        </div>
      )}

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

      {/* Branch Comparison Chart (Super Admin only) */}
      {branchChartData.length > 1 && (
        <Card className="mb-6">
          <Card.Header>
            <Card.Title className="text-gray-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              Perbandingan Cabang (30 Hari Terakhir)
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    type="number" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip 
                    formatter={(value) => [formatRupiah(value), 'Revenue']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="#818cf8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>
      )}

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

        {/* Critical Alerts with Quick Actions */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title className="text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Peringatan
              </Card.Title>
              {criticalAlerts?.lowStockProducts?.count > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setAlertFilter('all'); setShowLowStockModal(true); }}
                  className="text-indigo-600"
                >
                  Lihat Semua
                </Button>
              )}
            </div>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              {criticalAlerts?.lowStockProducts?.count > 0 && (
                <button
                  onClick={() => { setAlertFilter('all'); setShowLowStockModal(true); }}
                  className="w-full glass-surface p-3 rounded-xl border-l-4 border-amber-400 hover:bg-amber-50/50 transition-colors text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Stok Rendah</p>
                      <p className="text-xs text-gray-500">
                        {criticalAlerts.lowStockProducts.count} produk perlu restock
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </button>
              )}
              {criticalAlerts?.expiringStock?.count > 0 && (
                <button
                  onClick={() => setShowExpiringModal(true)}
                  className="w-full glass-surface p-3 rounded-xl border-l-4 border-red-400 hover:bg-red-50/50 transition-colors text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Hampir Kadaluarsa</p>
                      <p className="text-xs text-gray-500">
                        {criticalAlerts.expiringStock.count} produk segera kadaluarsa
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </button>
              )}
              {criticalAlerts?.pendingApprovals > 0 && (
                <button
                  onClick={() => navigate('/inventory/requests')}
                  className="w-full glass-surface p-3 rounded-xl border-l-4 border-blue-400 hover:bg-blue-50/50 transition-colors text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Persetujuan Pending</p>
                      <p className="text-xs text-gray-500">
                        {criticalAlerts.pendingApprovals} permintaan menunggu
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </button>
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

      {/* Low Stock Modal */}
      <Modal
        isOpen={showLowStockModal}
        onClose={() => setShowLowStockModal(false)}
        title="Produk Stok Rendah"
        size="lg"
      >
        <div className="space-y-4">
          {/* Filter Tabs */}
          <div className="flex gap-2 border-b pb-3">
            <button
              onClick={() => setAlertFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                alertFilter === 'all' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Semua ({lowStockProducts.length})
            </button>
            <button
              onClick={() => setAlertFilter('critical')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                alertFilter === 'critical' ? 'bg-red-500 text-white' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              Kritis ({severityCounts.critical})
            </button>
            <button
              onClick={() => setAlertFilter('high')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                alertFilter === 'high' ? 'bg-orange-500 text-white' : 'text-orange-600 hover:bg-orange-50'
              }`}
            >
              Tinggi ({severityCounts.high})
            </button>
            <button
              onClick={() => setAlertFilter('medium')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                alertFilter === 'medium' ? 'bg-yellow-500 text-white' : 'text-yellow-600 hover:bg-yellow-50'
              }`}
            >
              Sedang ({severityCounts.medium})
            </button>
          </div>

          {/* Product List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredProducts.length > 0 ? (
              filteredProducts.slice(0, 50).map((product, idx) => {
                const config = SEVERITY_CONFIG[product.severity] || SEVERITY_CONFIG.medium;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-l-4 ${config.border} ${config.bg}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {product.produkMaster?.namaProduk || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.cabang?.namaCabang || 'Unknown Branch'}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`text-sm font-semibold ${config.text}`}>
                          {product.stok} / {product.minStok}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.badge}`}>
                          {product.severity === 'critical' ? 'Kritis' : product.severity === 'high' ? 'Tinggi' : 'Sedang'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-400 py-8">Tidak ada produk dalam kategori ini</p>
            )}
            {filteredProducts.length > 50 && (
              <p className="text-center text-gray-500 text-sm py-2">
                Menampilkan 50 dari {filteredProducts.length} produk
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowLowStockModal(false)}>
              Tutup
            </Button>
            <Button onClick={() => { setShowLowStockModal(false); navigate('/inventory/products'); }}>
              Kelola Stok
            </Button>
          </div>
        </div>
      </Modal>

      {/* Expiring Stock Modal */}
      <Modal
        isOpen={showExpiringModal}
        onClose={() => setShowExpiringModal(false)}
        title="Produk Hampir Kadaluarsa"
        size="lg"
      >
        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto space-y-2">
            {criticalAlerts?.expiringStock?.details?.length > 0 ? (
              criticalAlerts.expiringStock.details.slice(0, 50).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border-l-4 border-red-400 bg-red-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {item.produk?.produkMaster?.namaProduk || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Batch: {item.batchNumber} • Qty: {formatNumber(item.quantity)}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-red-600">
                        {new Date(item.expiredDate).toLocaleDateString('id-ID')}
                      </p>
                      <span className="text-xs text-gray-500">
                        {Math.ceil((new Date(item.expiredDate) - new Date()) / (1000 * 60 * 60 * 24))} hari lagi
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-8">Tidak ada produk hampir kadaluarsa</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowExpiringModal(false)}>
              Tutup
            </Button>
            <Button onClick={() => { setShowExpiringModal(false); navigate('/inventory/batches'); }}>
              Kelola Batch
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default DashboardPage;
