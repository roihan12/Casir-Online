import { LayoutDashboard, ShoppingCart, ClipboardList, Users, CreditCard, BarChart } from 'lucide-react';

/**
 * Get menu items for Kasir role
 * @param {string} basePath - Base path for all routes
 * @returns {Array} Menu items for Kasir
 */
export const getKasirMenu = (basePath = '/') => {
  return [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      link: `${basePath}dashboard`,
      permission: "dashboard:read",
    },
    {
      key: "pos",
      label: "Point of Sale",
      icon: <ShoppingCart size={18} />,
      link: `${basePath}pos`,
      permission: "transaksi:create",
    },
    {
      key: "transactions",
      label: "Transaksi",
      icon: <ClipboardList size={18} />,
      link: `${basePath}transactions`,
      permission: "transaksi:read",
    },
    {
      key: "customers",
      label: "Pelanggan",
      icon: <Users size={18} />,
      link: `${basePath}customers`,
      permission: "pelanggan:read",
    },
    {
      key: "payments",
      label: "Pembayaran",
      icon: <CreditCard size={18} />,
      link: `${basePath}payments`,
      permission: "transaksi:read",
    },
    {
      key: "reports",
      label: "Laporan",
      icon: <BarChart size={18} />,
      link: `${basePath}reports`,
      permission: "report:read",
    },
  ];
};