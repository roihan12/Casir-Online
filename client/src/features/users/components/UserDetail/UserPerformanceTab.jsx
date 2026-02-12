import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Calendar,
  ArrowRight,
} from "lucide-react";
import userService from "../../services/userService"; 

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

const UserPerformanceTab = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch performance data
  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setIsLoading(true);
        // Using existing transaction list endpoint filtered by user_id
        // We fetch enough records to calculate some basic totals if backend doesn't provide agg
        // NOTE: Ideally backend should provide a dedicated stats endpoint.
        // For now we use the list and show recent activity + count.
        const response = await userService.getUserTransactions(user.id, { limit: 10 });
        
        setTransactions(response.data || []);
        
        // Use pagination data for total count
        setStats({
          totalTransactions: response.pagination?.totalItems || 0,
          // Since we can't calculate total sales from paginated list easily without backend agg,
          // we might only show transaction count or recent totals.
        });
      } catch (error) {
        console.error("Error fetching user performance:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user.id) {
      fetchPerformanceData();
    }
  }, [user.id]);

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <TrendingUp className="h-6 w-6 text-indigo-600 mr-3" />
        <div>
          <h3 className="text-lg font-bold text-gray-900">Performa User</h3>
          <p className="text-sm text-gray-500">
            Metrik kinerja berdasarkan aktivitas transaksi.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center">
          <div className="p-3 bg-indigo-50 rounded-lg mr-4 text-indigo-600">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Transaksi Ditangani</p>
            {isLoading ? (
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
            ) : (
              <h4 className="text-2xl font-bold text-gray-900">
                {stats?.totalTransactions || 0}
              </h4>
            )}
          </div>
        </div>
        
        {/* Placeholder for Sales Volume (requires backend aggregation) */}
        {/* <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center">
          <div className="p-3 bg-green-50 rounded-lg mr-4 text-green-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Nilai Penjualan</p>
             <h4 className="text-2xl font-bold text-gray-900">Rp ...</h4>
          </div>
        </div> */}
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h4 className="font-bold text-gray-900">Transaksi Terakhir</h4>
        </div>
        
        {isLoading ? (
          <div className="p-8 flex justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : transactions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {transactions.map((trx) => (
              <div key={trx.transaksi_id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                <div className="flex items-center">
                   <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mr-4 font-bold text-xs">
                      #{trx.nomor_transaksi.slice(-4)}
                   </div>
                   <div>
                      <p className="text-sm font-bold text-gray-900">{trx.nomor_transaksi}</p>
                      <p className="text-xs text-gray-500 flex items-center">
                         <Calendar className="h-3 w-3 mr-1" />
                         {new Date(trx.tanggal).toLocaleDateString("id-ID")}
                      </p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-sm font-bold text-indigo-600">{formatCurrency(trx.total)}</p>
                   <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide mt-1 ${
                      trx.status_pembayaran === 'LUNAS' ? 'bg-green-100 text-green-800' : 
                      trx.status_pembayaran === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                   }`}>
                      {trx.status_pembayaran}
                   </span>
                </div>
              </div>
            ))}
            <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
               <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center justify-center w-full">
                  Lihat Semua Transaksi <ArrowRight className="h-4 w-4 ml-1" />
               </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
             Belum ada data transaksi untuk user ini.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPerformanceTab;
