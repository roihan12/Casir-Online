import { useState } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, BarChart2, Users, Settings, 
  LogOut, Bell, Search, ChevronRight, TrendingUp, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button } from '@shared/ui';
import { useAuth, useBranch, usePermission } from '@shared/hooks';
import { Can } from '@features/auth';
import { BranchSelector } from '@widgets/branch-selector';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { activeBranchName } = useBranch();
  const { can } = usePermission();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null },
    { id: 'transaksi', label: 'Transaksi', icon: ShoppingCart, permission: 'transaksi:read' },
    { id: 'produk', label: 'Produk', icon: Package, permission: 'produk:read' },
    { id: 'laporan', label: 'Laporan', icon: BarChart2, permission: 'laporan:read' },
    { id: 'pelanggan', label: 'Pelanggan', icon: Users, permission: 'pelanggan:read' },
  ];

  // Filter menu based on permissions
  const visibleMenuItems = menuItems.filter(item => 
    !item.permission || can(item.permission)
  );

  const stats = [
    { label: 'Penjualan Hari Ini', value: 'Rp 2.450.000', icon: ShoppingCart, color: 'text-emerald-500', progress: 75 },
    { label: 'Produk Terjual', value: '156', icon: Package, color: 'text-blue-500', progress: 60 },
    { label: 'Pelanggan Baru', value: '23', icon: Users, color: 'text-purple-500', progress: 45 },
    { label: 'Pertumbuhan', value: '+12.5%', icon: TrendingUp, color: 'text-pink-500', progress: 85 },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-main">
      {/* Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex min-h-screen p-4 gap-4">
        
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-6 left-6 z-50 glass-surface p-2 rounded-lg"
        >
          {sidebarOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
        </button>

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed lg:relative w-64 glass-sidebar p-6 flex flex-col h-[calc(100vh-2rem)] z-40"
            >
              {/* Logo */}
              <h1 className="text-xl font-bold mb-8">
                <span className="text-gradient">Casir</span>
                <span className="text-gray-700">Online.</span>
              </h1>

              {/* User Profile */}
              <div className="glass-surface p-3 rounded-xl flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {user?.namaLengkap?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{user?.namaLengkap || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.roles?.[0]?.namaRole || 'Role'}</p>
                </div>
              </div>

              {/* Menu */}
              <nav className="flex-1 space-y-2">
                {visibleMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id)}
                    className={`menu-item w-full ${activeMenu === item.id ? 'active' : ''}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Upgrade Card */}
              <Can permission="admin:access">
                <div className="upgrade-card mt-6">
                  <div className="relative z-10">
                    <h3 className="font-semibold mb-1">Upgrade Pro</h3>
                    <p className="text-sm text-white/80 mb-4">Unlock semua fitur premium</p>
                    <button className="bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors">
                      Upgrade
                    </button>
                  </div>
                </div>
              </Can>

              {/* Settings & Logout */}
              <div className="mt-4 space-y-2">
                <button className="menu-item w-full">
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Pengaturan</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="menu-item w-full text-red-500 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Keluar</span>
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 space-y-6 lg:ml-0 ml-0">
          {/* Header */}
          <div className="glass p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="ml-12 lg:ml-0">
              <h2 className="text-2xl font-bold text-gray-800">Halo, {user?.namaLengkap?.split(' ')[0] || 'User'}</h2>
              <p className="text-gray-500">Selamat datang kembali!</p>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              {/* Branch Selector */}
              <BranchSelector />
              
              {/* Search */}
              <div className="glass-surface hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl">
                <Search className="w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Cari..." 
                  className="bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 w-36"
                />
              </div>
              
              {/* Notification */}
              <button className="glass-surface p-3 rounded-xl text-gray-500 hover:text-pink-500 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full" />
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} hover className="bg-white/70">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl glass-surface ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-500 mb-3">{stat.label}</p>
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${stat.progress}%` }}
                  />
                </div>
              </Card>
            ))}
          </div>

          {/* Info Cards */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Branch Info */}
            <Card>
              <Card.Header>
                <Card.Title className="text-gray-800">Informasi Cabang</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cabang Aktif</span>
                    <span className="font-medium text-gray-800">{activeBranchName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className="badge badge-success">Aktif</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shift</span>
                    <span className="font-medium text-gray-800">Pagi (07:00 - 15:00)</span>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* User Permissions */}
            <Card>
              <Card.Header>
                <Card.Title className="text-gray-800">Hak Akses</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="flex flex-wrap gap-2">
                  {user?.permissions?.slice(0, 8).map((perm, i) => (
                    <span key={i} className="badge badge-info">{perm}</span>
                  ))}
                  {user?.permissions?.length > 8 && (
                    <span className="badge bg-gray-100 text-gray-600">
                      +{user.permissions.length - 8} lainnya
                    </span>
                  )}
                </div>
              </Card.Content>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
