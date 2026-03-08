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
    }
  ];

  // Helper function to render CSS Mockup based on type. 
  // In production, these should be replaced with an <img src="/images/screenshots/pos.webp" />
  const renderMockup = (type) => {
    switch(type) {
      case 'POS_MOCKUP':
        return (
          <div className="flex h-full w-full">
            <div className="w-2/3 p-4 grid grid-cols-3 gap-3 bg-gray-50/80">
               {[...Array(9)].map((_, i) => (
                 <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex flex-col justify-between h-32 hover:border-indigo-300 transition-colors cursor-pointer">
                    <div className="w-full h-16 bg-gray-100 rounded-lg mb-2"></div>
                    <div>
                      <div className="h-3 w-3/4 bg-gray-300 rounded mb-1"></div>
                      <div className="text-sm font-bold text-indigo-600">Rp 15.000</div>
                    </div>
                 </div>
               ))}
            </div>
            <div className="w-1/3 bg-white border-l border-gray-200 shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.05)] flex flex-col">
               <div className="p-4 border-b border-gray-100 flex-none h-16 flex items-center bg-gray-50/50">
                 <div className="text-gray-500 font-semibold flex items-center gap-2"><FiUsers/> Tamu Baru</div>
               </div>
               <div className="flex-grow p-4 space-y-4">
                 <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                   <div className="flex flex-col"><span className="text-sm font-semibold">Kopi Susu</span><span className="text-xs text-gray-400">1x Rp15rb</span></div>
                   <div className="font-semibold text-sm">Rp15.000</div>
                 </div>
                 <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                   <div className="flex flex-col"><span className="text-sm font-semibold">Roti Bakar</span><span className="text-xs text-gray-400">2x Rp12rb</span></div>
                   <div className="font-semibold text-sm">Rp24.000</div>
                 </div>
               </div>
               <div className="p-4 bg-gray-50/80 border-t border-gray-200 h-40 flex flex-col justify-between">
                 <div className="flex justify-between items-center">
                   <span className="text-gray-500">Total</span>
                   <span className="font-bold text-xl text-gray-900">Rp 39.000</span>
                 </div>
                 <button className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-4 shadow-md">Bayar Pesanan</button>
               </div>
            </div>
          </div>
        );
      case 'ANALYTICS_MOCKUP':
        return (
          <div className="p-6 h-full w-full bg-gray-50/80">
            <h4 className="text-lg font-bold mb-4">Ringkasan Omzet Cabang Pusat</h4>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-24 flex flex-col justify-center">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-gray-500 text-xs font-semibold">METRIK {i+1}</span>
                     <span className="text-green-500 text-xs bg-green-50 px-2 py-1 rounded-full">+12%</span>
                   </div>
                   <div className="text-xl font-bold bg-gray-200 text-transparent bg-clip-text h-6 w-2/3 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm h-64 flex flex-col">
               <span className="text-sm font-semibold text-gray-500 mb-4">Grafik Penjualan 7 Hari Terakhir</span>
               <div className="flex-grow flex items-end justify-between px-8 gap-4">
                 {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                   <div key={i} className="w-full bg-blue-100 rounded-t-md hover:bg-blue-200 transition-colors relative group" style={{height: `${h}%`}}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Rp xx.xxx</div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        );
        case 'INVENTORY_MOCKUP':
          return (
            <div className="h-full w-full bg-gray-50/80 flex">
              <div className="w-48 bg-white border-r border-gray-100 p-4 space-y-2 flex-shrink-0">
                <div className="h-8 bg-gray-100 rounded-lg mb-4"></div>
                <div className="h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center px-3 text-xs font-semibold">Produk Master</div>
                <div className="h-8 hover:bg-gray-50 text-gray-600 rounded-lg flex items-center px-3 text-xs">Stok Cabang</div>
                <div className="h-8 hover:bg-gray-50 text-gray-600 rounded-lg flex items-center px-3 text-xs">Mutasi Barang</div>
                <div className="h-8 hover:bg-gray-50 text-gray-600 rounded-lg flex items-center px-3 text-xs">Stock Opname</div>
              </div>
               <div className="flex-grow p-6">
                 <div className="flex justify-between items-center mb-6">
                   <h4 className="font-bold">Daftar Inventaris</h4>
                   <div className="flex gap-2">
                     <div className="h-8 w-48 border border-gray-200 bg-white rounded-lg flex items-center px-3 text-xs text-gray-400">Cari SKU...</div>
                     <button className="h-8 px-4 bg-emerald-600 text-white text-xs font-semibold rounded-lg">Tambah Stok</button>
                   </div>
                 </div>
                 <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                   <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-6 p-3 text-xs font-semibold text-gray-500">
                     <div className="col-span-2">Nama Barang</div><div>Cabang</div><div>Harga Beli</div><div>Stok Tersedia</div><div>Status</div>
                   </div>
                   {[
                     {n: 'Kopi Biji 1Kg', c: 'Pusat', s: 45, st:'Aman', color:'bg-green-100 text-green-700'},
                     {n: 'Susu UHT 1L', c: 'Cabang A', s: 5, st:'Menipis', color:'bg-yellow-100 text-yellow-700'},
                     {n: 'Gula Aren 500g', c: 'Pusat', s: 0, st:'Kosong', color:'bg-red-100 text-red-700'},
                     {n: 'Roti Tawar Box', c: 'Cabang A', s: 12, st:'Aman', color:'bg-green-100 text-green-700'}
                    ].map((row, i) => (
                     <div key={i} className="grid grid-cols-6 p-3 border-b border-gray-100 items-center text-sm hover:bg-gray-50">
                       <div className="col-span-2 font-medium">{row.n}</div>
                       <div className="text-gray-500">{row.c}</div>
                       <div className="text-gray-500">Rp...</div>
                       <div className="font-semibold">{row.s} item</div>
                       <div><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${row.color}`}>{row.st}</span></div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          );
      case 'WHATSAPP_MOCKUP':
        return (
          <div className="h-full flex bg-gray-50/80">
             <div className="w-1/3 bg-white border-r border-gray-100 flex flex-col h-full">
               <div className="p-4 bg-green-600 text-white font-bold h-16 flex items-center">WA Bot Server <span className="ml-2 w-2 h-2 rounded-full bg-green-300 animate-pulse"></span></div>
               <div className="flex-grow p-4 space-y-4 overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white pointer-events-none"></div>
                 <div className="bg-gray-100 p-3 rounded-tr-xl rounded-b-xl max-w-[85%] text-sm">Hi, mau pesan Kopi Susu 2 ke alamat Jl. Mawar No 10.</div>
                 <div className="bg-green-100 p-3 rounded-tl-xl rounded-b-xl max-w-[85%] text-sm ml-auto border border-green-200">
                   <strong>Bot:</strong> Baik Pesanan Kopi Susu x2 sudah kami buatkan. Total Rp 30.000. Invoice ID: INV-9988. Silakan bayar via QRIS berikut...
                 </div>
               </div>
             </div>
             <div className="w-2/3 p-6 flex flex-col">
               <h4 className="font-bold mb-4 text-gray-800">Pesanan Online Baru (Masuk)</h4>
               <div className="bg-white border-l-4 border-green-500 shadow-sm rounded-lg p-4 flex justify-between items-center bg-green-50/30">
                 <div>
                   <div className="font-bold text-lg">INV-9988 (WhatsApp)</div>
                   <div className="text-gray-500 text-sm">Kopi Susu x2 • Alamat: Jl. Mawar No 10</div>
                 </div>
                 <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold">Proses Pesanan</button>
               </div>
             </div>
          </div>
        );
      case 'ROLE_MOCKUP':
        return (
          <div className="h-full w-full bg-gray-50/80 p-6">
             <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold">Manajemen Role & Hak Akses</h4>
             </div>
             <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex h-64 overflow-hidden">
                <div className="w-1/3 border-r border-gray-100 bg-gray-50 p-2">
                   <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-lg mb-2">Super Admin</div>
                   <div className="p-3 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg mb-2 cursor-pointer">Admin Cabang</div>
                   <div className="p-3 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg mb-2 cursor-pointer">Kasir Senior</div>
                   <div className="p-3 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg cursor-pointer">Kurir (Driver)</div>
                </div>
                <div className="w-2/3 p-4 space-y-4">
                  <h5 className="font-semibold text-gray-800 mb-2">Akses untuk: Super Admin</h5>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between"><div className="flex gap-2 items-center"><FiMonitor className="text-gray-400" />Menu POS</div>  <div className="w-8 h-4 bg-rose-500 rounded-full flex items-center px-[2px] justify-end"><div className="w-3 h-3 bg-white rounded-full"></div></div></div>
                    <div className="flex items-center justify-between"><div className="flex gap-2 items-center"><FiPieChart className="text-gray-400" />Menu Laporan Global</div>  <div className="w-8 h-4 bg-rose-500 rounded-full flex items-center px-[2px] justify-end"><div className="w-3 h-3 bg-white rounded-full"></div></div></div>
                    <div className="flex items-center justify-between"><div className="flex gap-2 items-center"><FiUsers className="text-gray-400" />Manajemen Pengguna</div>  <div className="w-8 h-4 bg-rose-500 rounded-full flex items-center px-[2px] justify-end"><div className="w-3 h-3 bg-white rounded-full"></div></div></div>
                    <div className="flex items-center justify-between"><div className="flex gap-2 items-center"><FiLock className="text-gray-400" />Hapus Transaksi (Void)</div>  <div className="w-8 h-4 bg-rose-500 rounded-full flex items-center px-[2px] justify-end"><div className="w-3 h-3 bg-white rounded-full"></div></div></div>
                  </div>
                </div>
             </div>
          </div>
        );
      case 'DELIVERY_MOCKUP':
        return (
           <div className="h-full w-full bg-gray-50/80 p-6 flex gap-6">
             <div className="w-1/3 mx-auto mt-4 w-[180px] h-[340px] bg-gray-900 rounded-[2rem] border-4 border-gray-800 p-2 relative shadow-2xl flex-shrink-0">
               {/* Mobile phone mockup for driver app */}
               <div className="bg-gray-50 h-full w-full rounded-[1.5rem] overflow-hidden flex flex-col">
                 <div className="h-12 bg-orange-600 px-3 flex items-end pb-2">
                   <h6 className="text-white font-bold text-xs uppercase tracking-wider">Driver App Aktif</h6>
                 </div>
                 <div className="flex-grow p-3">
                   <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">Tugas Berjalan:</div>
                   <div className="bg-white border-l-4 border-orange-500 rounded-lg p-2 shadow-sm relative">
                     <div className="text-[11px] font-bold">Kirim INV-9988</div>
                     <div className="text-[9px] text-gray-500 line-clamp-2 mt-1">Jl. Soekarno Hatta No 123, Blok C</div>
                     <button className="w-full bg-orange-100 text-orange-700 text-[10px] font-bold mt-2 py-1 rounded">Update Selesai</button>
                   </div>
                 </div>
               </div>
             </div>
             <div className="w-2/3 pt-4">
                <h4 className="font-bold mb-4">Live Tracking Dashboard</h4>
                <div className="w-full h-48 bg-blue-50 border border-blue-100 rounded-xl relative overflow-hidden flex items-center justify-center">
                  <div className="text-blue-300 font-bold opacity-50 flex items-center gap-2"><FiTruck/> Peta Rute Pengiriman</div>
                  <div className="absolute top-1/2 left-1/3 w-4 h-4 rounded-full bg-white border-2 border-orange-500 flex items-center justify-center shadow-lg animate-bounce"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div></div>
                  <div className="absolute top-1/4 right-1/4 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow-lg"></div>
                  {/* Fake routing line */}
                  <div className="absolute top-[35%] right-[32%] w-32 h-1 bg-gray-400 rotate-[20deg] opacity-40"></div>
                </div>
             </div>
           </div>
        );
      case 'PAYROLL_MOCKUP':
      case 'HR_MOCKUP':
         return (
          <div className="h-full w-full bg-gray-50/80 p-6 flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold">Laporan {type === 'HR_MOCKUP' ? 'Kehadiran Karyawan' : 'Gaji Karyawan'}</h4>
                <div className="bg-white px-3 py-1 rounded-lg border border-gray-200 text-sm">Bulan: <strong>Okt 2023</strong></div>
             </div>
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-grow">
               <div className="bg-gray-50 grid grid-cols-4 p-3 border-b border-gray-200 text-sm font-semibold text-gray-700">
                 <div className="col-span-1">Nama Staff</div>
                 <div>Jabatan</div>
                 <div>{type === 'HR_MOCKUP' ? 'Total Hadir' : 'Gaji Pokok'}</div>
                 <div>{type === 'HR_MOCKUP' ? 'Status' : 'Total Terima (Take-Home)'}</div>
               </div>
               {[
                 {n:'Ahmad Kasir', j:'Kasir Cab 1', v1: type === 'HR_MOCKUP' ? '28 Hari' : 'Rp 2.500.000', v2: type === 'HR_MOCKUP' ? 'Disiplin' : 'Rp 2.850.000', st: 'good'},
                 {n:'Budi Yanto', j:'Driver', v1: type === 'HR_MOCKUP' ? '24 Hari' : 'Rp 2.000.000', v2: type === 'HR_MOCKUP' ? 'Ada Alpa' : 'Rp 1.900.000', st: 'warn'},
                 {n:'Citra A', j:'Admin Pusat', v1: type === 'HR_MOCKUP' ? '30 Hari' : 'Rp 4.000.000', v2: type === 'HR_MOCKUP' ? 'Sempurna' : 'Rp 4.500.000', st: 'good'}
               ].map((hr, idx) => (
                 <div key={idx} className="grid grid-cols-4 p-4 border-b border-gray-100 text-sm hover:bg-gray-50">
                   <div className="font-semibold text-gray-900">{hr.n}</div>
                   <div className="text-gray-500">{hr.j}</div>
                   <div className="text-gray-700">{hr.v1}</div>
                   <div className={`font-bold ${hr.st === 'good' ? 'text-green-600' : 'text-orange-600'}`}>
                     {hr.v2}
                   </div>
                 </div>
               ))}
             </div>
          </div>
         );
      default:
        return <div className="p-8 text-center text-gray-400 flex items-center justify-center h-full w-full">Menunggu Screenshot Valid...</div>;
    }
  };

  const currentTab = showcaseItems[activeTab];

  return (
    <div className="relative py-24 bg-gradient-to-br from-blue-50/50 via-white to-cyan-50/50 border-y border-gray-100 overflow-hidden" id="modules">
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
              <div className="w-3/4 mx-auto h-6 bg-gradient-to-r from-transparent via-gray-300 to-transparent blur-md opacity-50 mt-2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenshotShowcase;
