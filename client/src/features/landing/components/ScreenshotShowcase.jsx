import React, { useState } from 'react';
import { FiMonitor, FiPieChart, FiBox, FiMessageSquare, FiUsers, FiShield, FiTruck, FiDollarSign } from 'react-icons/fi';

const ScreenshotShowcase = () => {
  const [activeTab, setActiveTab] = useState(0);

  const showcaseItems = [
    {
      id: 'pos',
      title: 'Kasir Pintar (POS)',
      icon: <FiMonitor />,
      subtitle: 'Transaksi secepat kilat',
      description: 'Layar kasir cerdas yang dirancang untuk kecepatan tinggi. Proses pelanggan dengan cepat tanpa jeda, pilih variasi produk, atur diskon instan, hingga pembayaran QRIS.',
      color: 'bg-indigo-50 text-indigo-600',
      activeColor: 'bg-indigo-600 text-white',
      // Since we don't have actual screenshots yet, we use generic placeholder layouts inside an elegant Macbook frame
      mockupBg: 'bg-indigo-50/50',
      mockupContent: 'POS_MOCKUP'
    },
    {
      id: 'analytics',
      title: 'Dashboard Analitik',
      icon: <FiPieChart />,
      subtitle: 'Helicopter view bisnis Anda',
      description: 'Pantau grafik penjualan real-time, produk terlaris, dan laba/rugi harian tanpa menunggu rekap kasir secara manual.',
      color: 'bg-blue-50 text-blue-600',
      activeColor: 'bg-blue-600 text-white',
      mockupBg: 'bg-blue-50/50',
      mockupContent: 'ANALYTICS_MOCKUP'
    },
    {
      id: 'inventory',
      title: 'Manajemen Stok',
      icon: <FiBox />,
      subtitle: 'Ketertelusuran akurat 100%',
      description: 'Cegah kehilangan barang. Sistem melacak stok keluar-masuk (mutasi) otomatis setiap ada transaksi, transfer antar cabang, atau saat Stock Opname.',
      color: 'bg-emerald-50 text-emerald-600',
      activeColor: 'bg-emerald-600 text-white',
      mockupBg: 'bg-emerald-50/50',
      mockupContent: 'INVENTORY_MOCKUP'
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Bot',
      icon: <FiMessageSquare />,
      subtitle: 'Order masuk saat Anda tidur',
      description: 'Pelanggan membalas chat "ORDER", bot cerdas Casir-Online mengambil alih percakapan dan keranjang belanja, hingga struk pembayaran tercetak di dapur otomatis.',
      color: 'bg-green-50 text-green-600',
      activeColor: 'bg-green-600 text-white',
      mockupBg: 'bg-green-50/50',
      mockupContent: 'WHATSAPP_MOCKUP'
    },
    {
      id: 'role',
      title: 'Akses & Role',
      icon: <FiShield />,
      subtitle: 'Sistem Hak Akses Super Aman',
      description: 'Batasi menu apa saja yang bisa dibuka oleh Super Admin, Admin Cabang, hingga Kasir Biasa. Sangat berguna untuk mengamankan data rahasia.',
      color: 'bg-rose-50 text-rose-600',
      activeColor: 'bg-rose-600 text-white',
      mockupBg: 'bg-rose-50/50',
      mockupContent: 'ROLE_MOCKUP'
    },
    {
      id: 'delivery',
      title: 'Kurir Delivery',
      icon: <FiTruck />,
      subtitle: 'Pantau posisi barang pesanan',
      description: 'Tugaskan pesanan online/offline ke driver internal Anda. Driver memiliki panel HP sendiri untuk mengonfirmasi titik rute pengiriman.',
      color: 'bg-orange-50 text-orange-600',
      activeColor: 'bg-orange-600 text-white',
      mockupBg: 'bg-orange-50/50',
      mockupContent: 'DELIVERY_MOCKUP'
    },
    {
      id: 'hr',
      title: 'Absensi Karyawan',
      icon: <FiUsers />,
      subtitle: 'Catat jam hadir akurat',
      description: 'Pantau jadwal shift kasir dan staf gudang. Karyawan hanya bisa menekan layar absensi jika sinyal GPS mendeteksi mereka berada di lokasi pabrik/cabang.',
      color: 'bg-violet-50 text-violet-600',
      activeColor: 'bg-violet-600 text-white',
      mockupBg: 'bg-violet-50/50',
      mockupContent: 'HR_MOCKUP'
    },
    {
      id: 'payroll',
      title: 'Sistem Payroll',
      icon: <FiDollarSign />,
      subtitle: 'Hitung gaji tanpa pusing',
      description: 'Sistem otomatis mengkalkulasikan gaji pokok, tunjangan kehadiran (dari modul absensi), bonus penjualan kasir, hingga pemotongan utang.',
      color: 'bg-teal-50 text-teal-600',
      activeColor: 'bg-teal-600 text-white',
      mockupBg: 'bg-teal-50/50',
      mockupContent: 'PAYROLL_MOCKUP'
    },
    {
      id: 'catalog',
      title: 'Katalog Produk',
      icon: <FiBox />,
      subtitle: 'Tampilkan produk Anda',
      description: 'Tampilkan produk Anda di katalog online',
      color: 'bg-teal-50 text-teal-600',
      activeColor: 'bg-teal-600 text-white',
      mockupBg: 'bg-teal-50/50',
      mockupContent: 'CATALOG_MOCKUP'
    },
    {
      id: 'report',
      title: 'Laporan',
      icon: <FiBox />,
      subtitle: 'Laporan',
      description: 'Laporan',
      color: 'bg-teal-50 text-teal-600',
      activeColor: 'bg-teal-600 text-white',
      mockupBg: 'bg-teal-50/50',
      mockupContent: 'REPORT_MOCKUP'
    },
    {
      id: 'ai-assistent',
      title: 'AI Assistent',
      icon: <FiBox />,
      subtitle: 'AI Assistent',
      description: 'AI Assistent',
      color: 'bg-teal-50 text-teal-600',
      activeColor: 'bg-teal-600 text-white',
      mockupBg: 'bg-teal-50/50',
      mockupContent: 'AI_MOCKUP'
    }
  ];

  // Helper function to render CSS Mockup based on type. 
  // In production, these should be replaced with an <img src="/images/screenshots/pos.webp" />
  const renderMockup = (type) => {
    const mockupToImage = {
      'POS_MOCKUP': '/images/screenshots/pos.png',
      'ANALYTICS_MOCKUP': '/images/screenshots/analytics.png',
      'INVENTORY_MOCKUP': '/images/screenshots/inventory-stock.png',
      'WHATSAPP_MOCKUP': '/images/screenshots/whatsapp.png',
      'ROLE_MOCKUP': '/images/screenshots/role-permissions.png',
      'DELIVERY_MOCKUP': '/images/screenshots/delivery.png',
      'HR_MOCKUP': '/images/screenshots/absensi.png',
      'PAYROLL_MOCKUP': '/images/screenshots/payroll.png',
      'CATALOG_MOCKUP': '/images/screenshots/catalog.png',
      'REPORT_MOCKUP': '/images/screenshots/report.png',
      'AI_MOCKUP': '/images/screenshots/ai-assistent.png',
    };

    const imageSrc = mockupToImage[type];

    if (imageSrc) {
      return (
        <img 
          src={imageSrc} 
          alt={`Screenshot ${type}`} 
          className="w-full h-full object-contain object-top bg-gray-50"
          loading="lazy"
        />
      );
    }

    return <div className="p-8 text-center text-gray-400 flex items-center justify-center h-full w-full">Menunggu Screenshot Valid...</div>;
  };

  const currentTab = showcaseItems[activeTab];

  return (
    <div className="relative py-24 bg-blue-50 border-y border-gray-100 overflow-hidden" id="modules">
      {/* Soft background decorative shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-200/20 blur-[100px]"></div>
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-cyan-200/20 blur-[100px]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 px-4">
          <p className="text-indigo-600 font-semibold mb-3 tracking-wide uppercase text-sm">Pratinjau Antarmuka</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 tracking-tight">Coba Intip Isi Sistem Kami</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Kami rancang UI yang bersih tanpa tombol yang membingungkan. 
            Modul lengkap yang biasanya berharga jutaan kini bisa Anda lihat cara kerjanya.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Navigation Tabs (Left side) */}
          <div className="lg:w-1/3 flex flex-col gap-2">
            {showcaseItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(index)}
                className={`text-left p-4 rounded-xl transition-all duration-300 border ${
                  activeTab === index 
                    ? `bg-white border-indigo-200 shadow-md transform scale-[1.02]` 
                    : `bg-transparent border-transparent hover:bg-white/60 hover:border-gray-200`
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors ${
                    activeTab === index ? item.activeColor : item.color
                  }`}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className={`font-bold transition-colors ${activeTab === index ? 'text-gray-900' : 'text-gray-700'}`}>
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">{item.subtitle}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Showcase Viewer (Right side) */}
          <div className="lg:w-2/3 relative min-h-[500px]">
            <div className="mt-8 lg:mt-0 sticky top-24">
              
              {/* Description Panel for Mobile & Extra Context */}
              <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up">
                 <h4 className="text-xl font-bold text-gray-900 mb-2">{currentTab.title}</h4>
                 <p className="text-gray-600 leading-relaxed">{currentTab.description}</p>
              </div>

              {/* Window Frame Mockup */}
              <div className={`relative w-full aspect-[16/10] sm:aspect-video rounded-2xl md:rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-500 ${currentTab.mockupBg} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>
                
                {/* Macbook Header Bar */}
                <div className="bg-white/80 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center gap-2 flex-none z-10">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="mx-auto bg-gray-100 px-32 py-1.5 rounded-md flex items-center gap-2 hidden sm:flex">
                    <div className="w-3 h-3 rounded bg-gray-300"></div>
                    <div className="text-[10px] text-gray-500 font-semibold tracking-wider">app.casir-online.com</div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-grow relative overflow-hidden">
                  <div className="absolute inset-0 transition-opacity duration-500">
                    {renderMockup(currentTab.mockupContent)}
                  </div>
                </div>
                
              </div>
              
              {/* Fake Stand Shadow for Macbook effect */}
              <div className="w-3/4 mx-auto h-6 bg-gray-300 blur-md opacity-20 mt-2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenshotShowcase;
