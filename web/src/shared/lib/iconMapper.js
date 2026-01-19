import * as Icons from 'lucide-react';

/**
 * Map icon name string to Lucide React component
 * @param {string} iconName - Icon name from backend (e.g., "LayoutDashboard")
 * @returns {React.Component} - Lucide icon component
 */
export const getIcon = (iconName) => {
  if (!iconName) return Icons.Circle;
  
  // Direct match
  if (Icons[iconName]) return Icons[iconName];
  
  // Try with first letter capitalized
  const capitalized = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  if (Icons[capitalized]) return Icons[capitalized];
  
  // Fallback
  return Icons.Circle;
};

/**
 * Common icon names mapping
 */
export const iconMap = {
  // Dashboard
  dashboard: Icons.LayoutDashboard,
  home: Icons.Home,
  
  // Transactions
  transaksi: Icons.ShoppingCart,
  kasir: Icons.CreditCard,
  pos: Icons.Receipt,
  
  // Products
  produk: Icons.Package,
  inventory: Icons.Boxes,
  kategori: Icons.Tags,
  
  // Reports
  laporan: Icons.BarChart2,
  chart: Icons.LineChart,
  analytics: Icons.TrendingUp,
  
  // Users
  user: Icons.Users,
  pelanggan: Icons.UserCheck,
  
  // Settings
  settings: Icons.Settings,
  pengaturan: Icons.Cog,
  
  // Others
  cabang: Icons.Building2,
  shift: Icons.Clock,
  notification: Icons.Bell,
  logout: Icons.LogOut,
  menu: Icons.Menu,
};

export default getIcon;
