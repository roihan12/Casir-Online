import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Bell, Menu, X, ChevronDown, ChevronRight, Circle } from 'lucide-react';
import { useAuth, useBranch } from '@shared/hooks';
import { useSidebarMenu } from '@entities/menu';
import { BranchSelector } from '@widgets/branch-selector';
import { getIcon } from '@shared/lib';

/**
 * MainLayout - Layout utama dengan sidebar dinamis dari API
 * Sidebar menu diambil dari /api/menu-view/sidebar berdasarkan role user
 */
const MainLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { activeBranchName } = useBranch();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState({});

  // Fetch dynamic menu from API
  const { data: menuData, isLoading: menuLoading } = useSidebarMenu();
  const menuItems = menuData?.data || [];

  const toggleSubmenu = (menuId) => {
    setExpandedMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const isMenuActive = (path) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    if (path) navigate(path);
  };

  const renderMenuItem = (item) => {
    const IconComponent = getIcon(item.icon) || Circle;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.id];
    const isActive = isMenuActive(item.path) || item.children?.some(c => isMenuActive(c.path));

    return (
      <div key={item.id}>
        <button
          onClick={() => hasChildren ? toggleSubmenu(item.id) : handleNavigate(item.path)}
          className={`menu-item w-full ${isActive ? 'active' : ''}`}
        >
          <IconComponent className="w-5 h-5" />
          <span className="font-medium flex-1 text-left">{item.name}</span>
          {hasChildren && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
        </button>
        
        {hasChildren && isExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {item.children.map((child) => {
              const ChildIcon = getIcon(child.icon) || Circle;
              return (
                <button
                  key={child.id}
                  onClick={() => handleNavigate(child.path)}
                  className={`menu-item w-full text-sm ${isMenuActive(child.path) ? 'active' : ''}`}
                >
                  <ChildIcon className="w-4 h-4" />
                  <span className="font-medium">{child.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-main">
      {/* Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 flex h-screen p-4 gap-4 overflow-hidden">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-6 left-6 z-50 glass-surface p-2 rounded-lg"
        >
          {sidebarOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
        </button>

        {/* Sidebar - Sticky, tidak ikut scroll */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed lg:sticky lg:top-4 w-64 glass-sidebar p-6 flex flex-col h-[calc(100vh-2rem)] z-40 flex-shrink-0"
            >
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
                  <p className="text-xs text-gray-500 truncate">{user?.roles?.[0]?.namaRole || '-'}</p>
                </div>
              </div>

              {/* Dynamic Menu from API */}
              <nav className="flex-1 space-y-2 overflow-y-auto">
                {menuLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 bg-gray-200/50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : menuItems.length > 0 ? (
                  menuItems.map(renderMenuItem)
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Menu tidak tersedia</p>
                )}
              </nav>

              {/* Logout */}
              <div className="mt-4 pt-4 border-t border-gray-200/50">
                <button onClick={handleLogout} className="menu-item w-full text-red-500 hover:bg-red-50">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Keluar</span>
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content - Area yang bisa di-scroll */}
        <main className="flex-1 space-y-6 overflow-y-auto">
          <div className="glass p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-50">
            <div className="ml-12 lg:ml-0">
              <h2 className="text-2xl font-bold text-gray-800">{title || 'Dashboard'}</h2>
              <p className="text-gray-500">{subtitle || activeBranchName}</p>
            </div>
            <div className="flex items-center gap-4">
              <BranchSelector />
              <button className="glass-surface p-3 rounded-xl text-gray-500 hover:text-pink-500 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
