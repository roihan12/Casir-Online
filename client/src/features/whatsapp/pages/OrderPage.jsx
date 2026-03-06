import React, { useState } from 'react';
import { FaShoppingBag, FaSearch, FaFilter, FaEye, FaCheckCircle, FaTimesCircle, FaTruck } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import whatsappService from '../services/whatsappService';

const OrderPage = () => {
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch orders from backend
  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: ['whatsapp-orders', filterStatus, searchQuery],
    queryFn: () => whatsappService.getBotOrders({
      status: filterStatus === 'All' ? undefined : filterStatus,
      search: searchQuery || undefined,
      limit: 50 // simplistic pagination matching UI mockup currently
    })
  });

  const orders = responseData?.data || [];
  const meta = responseData?.meta || {};

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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaShoppingBag className="text-blue-600" />
          Pesanan WhatsApp
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters & Search */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
            <div className="relative w-full md:w-64">
                <input 
                    type="text" 
                    placeholder="Cari Pesanan ID atau Pelanggan" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
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
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
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
                <tr>
                  <td colSpan="8" className="p-4 text-center text-gray-500">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-gray-500">No orders found.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition group">
                    <td className="p-4 font-medium text-blue-600">{order.id.slice(0, 13)}...</td>
                    <td className="p-4 font-medium text-gray-800">{order.customer}</td>
                    <td className="p-4 text-gray-500 text-sm">{order.date}</td>
                    <td className="p-4 text-gray-600 text-sm">{order.items} items</td>
                    <td className="p-4 font-semibold text-gray-900">Rp {order.total.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${order.paymentStatus === 'Paid' ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'}`}>
                          {order.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition">
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
            <span className="text-sm text-gray-500">Showing 1-5 of 5 orders</span>
            <div className="flex gap-2">
                <button className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>Prev</button>
                <button className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
