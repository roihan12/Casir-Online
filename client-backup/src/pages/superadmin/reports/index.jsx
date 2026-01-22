import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart2,
  DollarSign,
  Database,
  GitBranch,
  ChevronRight,
} from "lucide-react";

const ReportIndex = () => {
  const navigate = useNavigate();

  const handleReportClick = (path) => {
    navigate(path);
  };

  const reportCards = [
    {
      title: "Laporan Penjualan",
      description:
        "Analisis penjualan, produk terlaris, dan kategori yang paling diminati",
      icon: <BarChart2 size={48} />,
      path: "/superadmin/reports/sales",
      color: "#8884d8",
    },
    {
      title: "Laporan Keuangan",
      description:
        "Analisis pendapatan, pengeluaran, keuntungan dan metode pembayaran",
      icon: <DollarSign size={48} />,
      path: "/superadmin/reports/finance",
      color: "#28a745",
    },
    {
      title: "Laporan Inventori",
      description:
        "Analisis stok, pergerakan stok, nilai inventori, dan produk dengan stok menipis",
      icon: <Database size={48} />,
      path: "/superadmin/reports/inventory",
      color: "#ffc658",
    },
    {
      title: "Performa Cabang",
      description:
        "Perbandingan performa antar cabang, analisis cabang terbaik dan terendah",
      icon: <GitBranch size={48} />,
      path: "/superadmin/reports/branch",
      color: "#0088FE",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Laporan Global</h1>

      <p className="text-gray-600 mb-6">
        Pilih laporan yang ingin Anda lihat untuk mendapatkan wawasan tentang
        bisnis Anda
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer overflow-hidden"
            style={{ borderTop: `4px solid ${card.color}` }}
            onClick={() => handleReportClick(card.path)}
          >
            <div className="p-6 flex flex-col h-full">
              <div className="mb-4" style={{ color: card.color }}>
                {card.icon}
              </div>
              <h2 className="text-lg font-semibold mb-2">{card.title}</h2>
              <p className="text-gray-600 text-sm mb-4 flex-grow">
                {card.description}
              </p>
              <button
                className="flex items-center text-sm font-medium mt-auto"
                style={{ color: card.color }}
              >
                Lihat Laporan
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportIndex;
