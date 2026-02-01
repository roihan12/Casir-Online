import React from 'react';
import { FaChartLine, FaCommentDots, FaUserCheck, FaShoppingCart, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const StatCard = ({ title, value, change, changeType, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      <div className={`flex items-center gap-1 mt-2 text-sm ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
        {changeType === 'increase' ? <FaArrowUp /> : <FaArrowDown />}
        <span className="font-medium">{change}</span>
        <span className="text-gray-400 font-normal ml-1">vs last month</span>
      </div>
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="text-white text-xl" />
    </div>
  </div>
);

const AnalysisPage = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaChartLine className="text-blue-600" />
          Analisis Performa
        </h1>
        <div className="flex bg-white rounded-lg shadow-sm border border-gray-200">
           <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-l-lg">7 Hari</button>
           <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 border-l border-gray-200">30 Hari</button>
           <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 border-l border-gray-200 rounded-r-lg">3 Bulan</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Pesan Masuk" 
          value="1,250" 
          change="12%" 
          changeType="increase" 
          icon={FaCommentDots} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Respon Rate" 
          value="95%" 
          change="2%" 
          changeType="increase" 
          icon={FaUserCheck} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Pesanan via WA" 
          value="85" 
          change="5%" 
          changeType="decrease" 
          icon={FaShoppingCart} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Total Penjualan" 
          value="Rp 12.5M" 
          change="15%" 
          changeType="increase" 
          icon={FaChartLine} 
          color="bg-orange-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mock Chart Area 1 - Volume Pesan */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Volume Pesan Harian</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
             {[30, 45, 25, 60, 75, 50, 80].map((h, i) => (
               <div key={i} className="flex flex-col items-center flex-1 group">
                 <div 
                    className="w-full bg-blue-500 rounded-t-sm opacity-80 group-hover:opacity-100 transition-all relative" 
                    style={{ height: `${h}%` }}
                 >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition">
                        {h * 10} Msg
                    </div>
                 </div>
                 <span className="text-xs text-gray-500 mt-2">Day {i+1}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Mock Chart Area 2 - Sentiment Analysis (Placeholder) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="text-lg font-semibold text-gray-800 mb-6">Analisis Sentimen Pelanggan</h3>
           <div className="flex flex-col space-y-6">
              <div className="space-y-2">
                 <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Positif</span>
                    <span className="text-green-600 font-bold">75%</span>
                 </div>
                 <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                 </div>
              </div>
              
              <div className="space-y-2">
                 <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Netral</span>
                    <span className="text-gray-600 font-bold">20%</span>
                 </div>
                 <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-gray-400 h-2.5 rounded-full" style={{ width: '20%' }}></div>
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Negatif</span>
                    <span className="text-red-600 font-bold">5%</span>
                 </div>
                 <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '5%' }}></div>
                 </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                 <p className="font-semibold mb-1">💡 Insight AI</p>
                 <p>Mayoritas pelanggan merasa puas dengan respon cepat bot. Keluhan utama berkaitan dengan "Stok Habis".</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
