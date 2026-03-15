import React, { useState, useEffect } from 'react';
import { FaShoppingBag, FaSearch, FaEye, FaBoxOpen, FaExclamationTriangle } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import whatsappService from '../services/whatsappService';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const OrderPage = () => {
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStatus, debouncedSearch]);

  // Fetch orders from backend
  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: ['whatsapp-orders', filterStatus, debouncedSearch, page],
    queryFn: () => whatsappService.getBotOrders({
      status: filterStatus === 'All' ? undefined : filterStatus,
      search: debouncedSearch || undefined,
      page,
      limit
    }),
    keepPreviousData: true
  });

  const orders = responseData?.data || [];
  const meta = responseData?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Processing': return 'bg-blue-100 text-blue-700';
      case 'Shipped': return 'bg-purple-100 text-purple-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const TableSkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-gray-50">
          <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
          <td className="p-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
          <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
          <td className="p-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
          <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
          <td className="p-4"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
          <td className="p-4"><div className="h-5 bg-gray-200 rounded w-16"></div></td>
          <td className="p-4 flex justify-center"><div className="h-8 w-8 bg-gray-200 rounded-full"></div></td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaShoppingBag className="text-blue-600" />
          Pesanan WhatsApp
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters & Search */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
            <div className="relative w-full md:w-80">
                <input 
                    type="text" 
                    placeholder="Cari Pesanan ID atau Pelanggan..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {['All', 'Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                            filterStatus === status 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          {isError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FaExclamationTriangle className="text-4xl text-red-400 mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">Gagal Memuat Data</h3>
              <p className="text-gray-500 max-w-sm">Terjadi kesalahan saat mengambil data pesanan. Silakan periksa koneksi Anda dan coba lagi.</p>
            </div>
          ) : (
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600 text-sm">Order ID</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Pelanggan</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Tanggal</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Items</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Total</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Pembayaran</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <TableSkeleton />
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-0">
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                          <FaBoxOpen size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">Belum ada pesanan</h3>
                        <p className="text-gray-500 text-sm max-w-sm">Pesanan yang masuk melalui WhatsApp akan muncul di sini. Coba ubah filter pencarian jika Anda tidak menemukan yang dicari.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="p-4 font-medium text-blue-600 cursor-pointer hover:underline">{order.id.slice(0, 13)}...</td>
                      <td className="p-4 font-medium text-gray-800">{order.customer}</td>
                      <td className="p-4 text-gray-500 text-sm">{order.date}</td>
                      <td className="p-4 text-gray-600 text-sm bg-gray-50/30">{order.items} items</td>
                      <td className="p-4 font-semibold text-gray-900">Rp {order.total.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center justify-center min-w-[5rem] ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${order.paymentStatus === 'Paid' ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'}`}>
                            {order.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title="Lihat Detail">
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        {!isLoading && !isError && orders.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
              <span className="text-sm text-gray-500">
                Menampilkan <span className="font-semibold text-gray-900">{(page - 1) * limit + 1}</span> hingga <span className="font-semibold text-gray-900">{Math.min(page * limit, meta.total)}</span> dari <span className="font-semibold text-gray-900">{meta.totalRecords}</span> pesanan
              </span>
              <div className="flex gap-2">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  >
                    Sebelumnya
                  </button>
                  <button 
                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                    disabled={page >= meta.totalPages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  >
                    Selanjutnya
                  </button>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderPage;
