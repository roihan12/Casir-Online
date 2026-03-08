import React from 'react';
import { FiMonitor, FiBox, FiMessageSquare, FiUsers, FiClock, FiLock, FiPieChart, FiTruck } from 'react-icons/fi';

const Features = () => {
  const features = [
    {
      title: 'Point of Sale (Kasir)',
      description: 'Antarmuka kasir yang responsif dan cepat. Mendukung pembayaran tunai, QRIS, e-wallet, hingga sistem diskon & promo dinamis.',
      icon: <FiMonitor className="text-indigo-600" />,
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Manajemen Multi-Cabang',
      description: 'Pantau operasional ratusan toko dari satu dashboard. Atur harga produk dan promosi berbeda untuk setiap cabang dengan mudah.',
      icon: <FiPieChart className="text-blue-600" />,
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Manajemen Inventaris',
      description: 'Pelacakan stok instan, mutasi barang antar cabang, stock opname yang akurat, lengkap dengan notifikasi peringatan stok menipis.',
      icon: <FiBox className="text-emerald-600" />,
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Modul Absensi & Payroll',
      description: 'Catat jam hadir karyawan dengan geofencing GPS. Terintegrasi langsung dengan sistem penggajian shift dan tunjangan harian.',
      icon: <FiUsers className="text-violet-600" />,
      bgColor: 'bg-violet-50'
    },
    {
      title: 'WhatsApp Bot Order',
      description: 'Buat pelanggan memesan dari WhatsApp. Katalog produk dikirim otomatis, pesanan langsung masuk layar kasir toko.',
      icon: <FiMessageSquare className="text-green-600" />,
      bgColor: 'bg-green-50'
    },
    {
      title: 'Sistem Driver / Kurir',
      description: 'Berikan tugas pengiriman (delivery) pada kurir lokal toko Anda, lengkap dengan rute yang terhubung ke transaksi kasir.',
      icon: <FiTruck className="text-orange-600" />,
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Laporan Keuangan',
      description: 'Audit shift, rekap pendapatan harian, laba rugi, hingga analisis produk terlaris. Semua diekspor ke format PDF/Excel.',
      icon: <FiClock className="text-cyan-600" />,
      bgColor: 'bg-cyan-50'
    },
    {
      title: 'Keamanan Data Tersentralisasi',
      description: 'Kendali akses berbasis role (Role-Based Access Control) memastikan kasir dan admin cabang hanya melihat data hak mereka.',
      icon: <FiLock className="text-rose-600" />,
      bgColor: 'bg-rose-50'
    }
  ];

  return (
    <div className="relative py-24 bg-gradient-to-b from-white via-blue-50/30 to-white overflow-hidden" id="features">
      {/* Decorative blurred spots */}
      <div className="absolute left-0 top-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute right-0 bottom-1/4 w-96 h-96 bg-sky-200/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in-up">
          <p className="text-indigo-600 font-semibold mb-3 tracking-wide uppercase text-sm">Modul Terintegrasi</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 tracking-tight">
            Lebih Dari Sekadar Mesin Kasir
          </h2>
          <p className="text-lg text-gray-600">
            Casir-Online dirancang menggabungkan seluruh departemen operasional toko ke dalam satu ekosistem: dari gudang, kasir, kurir, hingga HRD.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 flex-wrap gap-8 items-stretch">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex gap-6 items-start">
                <div className={`shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${feature.bgColor} group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-indigo-700 transition-colors">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
