import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Box,
  Calendar,
  Store,
  Activity,
} from "lucide-react";

// Movement Trends Component
export const MovementTrends = ({ data = [], isLoading }) => {
  // Group data by date
  const groupedByDate = data.reduce((acc, item) => {
    const date = item.periode;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Tren Pergerakan Stok</h3>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="space-y-2">
                {[...Array(2)].map((_, idx) => (
                  <div key={idx} className="flex items-center p-3 border border-gray-100 rounded-lg">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <div className="h-5 w-5 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Tren Pergerakan Stok</h3>
        </div>
        <div className="py-8 text-center">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Tidak ada data pergerakan stok</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Tren Pergerakan Stok</h3>
        <Link to="/inventory/movements" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
          Lihat Semua
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="space-y-6">
        {sortedDates.slice(0, 5).map((date) => (
          <div key={date} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <div className="flex items-center mb-3">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <h4 className="text-sm font-medium text-gray-700">{formatDate(date)}</h4>
            </div>
            
            <div className="space-y-3">
              {groupedByDate[date].slice(0, 5).map((item) => {
                const isIncoming = item.stok_masuk > 0;
                const movement = isIncoming ? item.stok_masuk : item.stok_keluar;
                
                return (
                  <div key={`${item.periode}-${item.produk_id}-${item.cabang_id}`} 
                       className="flex items-center p-3 border border-gray-100 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`${isIncoming ? 'bg-green-100' : 'bg-red-100'} p-2 rounded-lg mr-3`}>
                      {isIncoming ? 
                        <ArrowUp className="h-5 w-5 text-green-600" /> : 
                        <ArrowDown className="h-5 w-5 text-red-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{item.nama_produk}</span>
                        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{item.sku}</span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Store className="h-3 w-3 mr-1" />
                        <span>{item.nama_cabang}</span>
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
                      {isIncoming ? `+${movement}` : `-${movement}`}
                    </div>
                  </div>
                );
              })}
              
              {groupedByDate[date].length > 5 && (
                <div className="text-center pt-2">
                  <button className="text-xs text-indigo-600 hover:text-indigo-800">
                    +{groupedByDate[date].length - 5} transaksi lainnya
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Top Products Component
export const TopProducts = ({ data = [], isLoading }) => {
  // Sort products by total movement (absolute value of incoming + outgoing)
  const sortedProducts = [...data].sort((a, b) => b.total_pergerakan - a.total_pergerakan);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Produk dengan Pergerakan Tertinggi</h3>
        </div>
        <div className="animate-pulse">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cabang</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Masuk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keluar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Produk dengan Pergerakan Tertinggi</h3>
        </div>
        <div className="py-8 text-center">
          <Box className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Tidak ada data produk dengan pergerakan tinggi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Produk dengan Pergerakan Tertinggi</h3>
        <Link to="/inventory/movements" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
          Lihat Semua
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cabang</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Masuk</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keluar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProducts.slice(0, 10).map((product) => (
              <tr key={product.produk_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{product.nama_produk}</div>
                    <div className="text-xs text-gray-500">{product.sku}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{product.nama_cabang}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-green-600 font-medium">{product.total_stok_masuk > 0 ? `+${product.total_stok_masuk}` : '0'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-red-600 font-medium">{product.total_stok_keluar > 0 ? `-${product.total_stok_keluar}` : '0'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium">{product.total_pergerakan}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium">{product.stok_saat_ini}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
