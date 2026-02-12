import React from "react";
import {
  ShoppingCart,
  Package,
  Search,
  Users,
  XCircle,
  FileText,
} from "lucide-react";

const EmptyState = ({
  icon = "default",
  title,
  description,
  action,
  className = "",
}) => {
  const icons = {
    default: Package,
    cart: ShoppingCart,
    product: Package,
    search: Search,
    customer: Users,
    error: XCircle,
    document: FileText,
  };

  const Icon = icons[icon] || icons.default;

  const defaultMessages = {
    default: {
      title: "Tidak ada data",
      description: "Belum ada data yang tersedia saat ini",
    },
    cart: {
      title: "Keranjang kosong",
      description: "Tambahkan produk ke keranjang untuk memulai transaksi",
    },
    product: {
      title: "Tidak ada produk",
      description: "Tidak ada produk yang cocok dengan pencarian",
    },
    search: {
      title: "Tidak ada hasil",
      description: "Coba kata kunci pencarian lainnya",
    },
    customer: {
      title: "Tidak ada pelanggan",
      description: "Belum ada data pelanggan yang tersedia",
    },
    error: {
      title: "Terjadi kesalahan",
      description: "Gagal memuat data. Silakan coba lagi nanti",
    },
    document: {
      title: "Tidak ada dokumen",
      description: "Belum ada dokumen yang tersedia",
    },
  };

  const message = defaultMessages[icon] || defaultMessages.default;

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="mb-4">
        <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center">
          <Icon size={48} className="text-gray-400" />
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {title || message.title}
      </h3>
      
      <p className="text-gray-500 text-center max-w-sm mb-6">
        {description || message.description}
      </p>
      
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;