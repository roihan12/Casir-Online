import React, { useState } from 'react';
import { FaChartLine, FaCommentDots, FaUserCheck, FaShoppingCart, FaArrowUp, FaArrowDown, FaSpinner } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import whatsappService from '../services/whatsappService';

const StatCard = ({ title, value, change, changeType, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      <div className={`flex items-center gap-1 mt-2 text-sm ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
        {changeType === 'increase' ? <FaArrowUp /> : <FaArrowDown />}
        <span className="font-medium">{change}</span>
        <span className="text-gray-400 font-normal ml-1">vs last period</span>
      </div>
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="text-white text-xl" />
    </div>
  </div>
);

const AnalysisPage = () => {
  const [days, setDays] = useState(7);

  const { data: analysisData, isLoading, isError } = useQuery({
    queryKey: ['whatsapp-analysis', days],
    queryFn: () => whatsappService.getAnalysis({ days })
  });
  
  const metrics = analysisData?.metrics || {
      totalPesan: 0,
      sessionCount: 0,
      totalOrders: 0,
      totalPenjualan: 0
  };

  const charts = analysisData?.charts || {
      volumeHarian: [],
      orderStatuses: { pending: 0, processing: 0, completed: 0, cancelled: 0 }
  };

  // Helper to get max volume for chart scaling
  const maxVolume = charts.volumeHarian.length > 0 
    ? Math.max(...charts.volumeHarian.map(item => item.count)) 
    : 10;

  // Calculate percentages for order statuses
  const totalOrdersStatus = Object.values(charts.orderStatuses).reduce((a,b) => a+b, 0);
  const getPercent = (count) => totalOrdersStatus > 0 ? Math.round((count / totalOrdersStatus) * 100) : 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaChartLine className="text-blue-600" />
          Analisis Performa
        </h1>
        <div className="flex bg-white rounded-lg shadow-sm border border-gray-200">
           <button 
             onClick={() => setDays(7)}
             className={`px-4 py-2 text-sm font-medium rounded-l-lg ${days === 7 ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
           >
             7 Hari
           </button>
           <button 
             onClick={() => setDays(30)}
             className={`px-4 py-2 text-sm font-medium border-l border-gray-200 ${days === 30 ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
           >
             30 Hari
           </button>
           <button 
             onClick={() => setDays(90)}
             className={`px-4 py-2 text-sm font-medium border-l border-gray-200 rounded-r-lg ${days === 90 ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
           >
             3 Bulan
           </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
           <FaSpinner className="animate-spin text-blue-500 text-3xl" />
        </div>
      ) : isError ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">Gagal memuat data analisis.</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Pesan Masuk" 
              value={metrics.totalPesan.toLocaleString()} 
              change="0%" 
              changeType="increase" 
              icon={FaCommentDots} 
              color="bg-blue-500" 
            />
            <StatCard 
              title="Sesi Bot Aktif" 
              value={metrics.sessionCount.toLocaleString()} 
              change="0%" 
              changeType="increase" 
              icon={FaUserCheck} 
              color="bg-green-500" 
            />
            <StatCard 
              title="Pesanan via WA" 
              value={metrics.totalOrders.toLocaleString()} 
              change="0%" 
              changeType="increase" 
              icon={FaShoppingCart} 
              color="bg-purple-500" 
            />
            <StatCard 
              title="Total Penjualan" 
              value={`Rp ${metrics.totalPenjualan.toLocaleString()}`} 
              change="0%" 
              changeType="increase" 
              icon={FaChartLine} 
              color="bg-orange-500" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart Area 1 - Volume Pesan */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Volume Pesan Harian</h3>
              <div className="h-64 flex items-end justify-between space-x-2">
                 {charts.volumeHarian.length > 0 ? charts.volumeHarian.map((item, i) => (
                   <div key={i} className="flex flex-col items-center flex-1 group">
                     <div 
                        className="w-full bg-blue-500 rounded-t-sm opacity-80 group-hover:opacity-100 transition-all relative" 
                        style={{ height: `${Math.max((item.count / maxVolume) * 100, 5)}%` }}
                     >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition">
                            {item.count} Msg
                        </div>
                     </div>
                     <span className="text-xs text-gray-500 mt-2 rotate-45 origin-left truncate w-10 text-center">{item.date.slice(-5)}</span>
                   </div>
                 )) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Belum ada data pesan</div>
                 )}
              </div>
            </div>

            {/* Chart Area 2 - Status Pesanan */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <h3 className="text-lg font-semibold text-gray-800 mb-6">Rasio Status Pesanan (Bot)</h3>
               <div className="flex flex-col space-y-6">
                  
                  <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">Completed (Selesai)</span>
                        <span className="text-green-600 font-bold">{getPercent(charts.orderStatuses.completed)}% ({charts.orderStatuses.completed})</span>
                     </div>
                     <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${getPercent(charts.orderStatuses.completed)}%` }}></div>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">Processing (Diproses)</span>
                        <span className="text-blue-600 font-bold">{getPercent(charts.orderStatuses.processing)}% ({charts.orderStatuses.processing})</span>
                     </div>
                     <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${getPercent(charts.orderStatuses.processing)}%` }}></div>
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">Pending (Menunggu)</span>
                        <span className="text-orange-600 font-bold">{getPercent(charts.orderStatuses.pending)}% ({charts.orderStatuses.pending})</span>
                     </div>
                     <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="bg-orange-400 h-2.5 rounded-full" style={{ width: `${getPercent(charts.orderStatuses.pending)}%` }}></div>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">Cancelled (Batal)</span>
                        <span className="text-red-600 font-bold">{getPercent(charts.orderStatuses.cancelled)}% ({charts.orderStatuses.cancelled})</span>
                     </div>
                     <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${getPercent(charts.orderStatuses.cancelled)}%` }}></div>
                     </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                     <p className="font-semibold mb-1">💡 Ringkasan</p>
                     <p>Dari total {totalOrdersStatus} pesanan, {getPercent(charts.orderStatuses.completed)}% berhasil diselesaikan. Terdapat {charts.orderStatuses.pending} pesanan yang masih menunggu konfirmasi.</p>
                  </div>
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalysisPage;
