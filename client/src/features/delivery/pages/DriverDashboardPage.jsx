import { FiTruck, FiCheckCircle, FiXCircle, FiTrendingUp } from "react-icons/fi";
import { useAuth } from "../../auth/hooks/useAuth";
import { useDriverDashboard, useDriverActiveDeliveries } from "../hooks/useDelivery";
import { Link } from "react-router-dom";

const DriverDashboardPage = () => {
  const { user } = useAuth();
  const driverId = user?.driverId;

  const { data: dashboardData, isLoading: isLoadingStats } = useDriverDashboard(driverId);
  const { data: activeData, isLoading: isLoadingActive } = useDriverActiveDeliveries(driverId);

  const stats = dashboardData?.data || { total: 0, success: 0, failed: 0, active: 0 };
  const activeTasks = activeData?.data || [];

  if (!driverId) {
    return (
      <div className="flex items-center justify-center p-8 h-[calc(100vh-64px)]">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center max-w-sm w-full font-medium shadow-sm border border-red-100">
          Akun Anda belum terhubung dengan data driver.
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "ASSIGNED": return "bg-amber-100 text-amber-700";
      case "PICKED_UP": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "ASSIGNED": return "Menunggu Pickup";
      case "PICKED_UP": return "Dalam Perjalanan";
      default: return status;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6 pb-24">
      {/* Header Profile Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full blur-xl -ml-12 -mb-12"></div>
        
        <div className="relative z-10">
          <p className="text-indigo-100 text-sm font-medium mb-1">Selamat Bertugas,</p>
          <h2 className="text-2xl font-bold">{user?.namaLengkap || user?.username}</h2>
          <div className="mt-4 flex items-center gap-2 bg-white/20 w-fit px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            Status: Aktif
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-3">
        <h3 className="text-gray-800 font-bold flex items-center gap-2 px-1">
          <FiTrendingUp className="text-indigo-500" /> Ringkasan Performa
        </h3>
        
        {isLoadingStats ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100 shadow-sm"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* Total */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <FiTruck className="text-indigo-500 w-4 h-4" />
                <span className="text-xs font-semibold">Total Tugas</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            
            {/* Active */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                </div>
                <span className="text-xs font-semibold">Aktif</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats.active}</p>
            </div>

            {/* Success */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <FiCheckCircle className="text-emerald-500 w-4 h-4" />
                <span className="text-xs font-semibold">Selesai</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats.success}</p>
            </div>

            {/* Failed */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <FiXCircle className="text-red-500 w-4 h-4" />
                <span className="text-xs font-semibold">Gagal</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats.failed}</p>
            </div>
          </div>
        )}
      </div>

      {/* Active Tasks Preview */}
      <div className="space-y-3 pt-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-gray-800 font-bold flex items-center gap-2">
            <FiTruck className="text-amber-500" /> Tugas Berjalan
          </h3>
          {activeTasks.length > 0 && (
            <Link to="/delivery/driver/tasks" className="text-indigo-600 text-xs font-semibold hover:underline">
              Lihat Semua
            </Link>
          )}
        </div>

        {isLoadingActive ? (
          <div className="bg-white rounded-2xl h-32 animate-pulse border border-gray-100 shadow-sm"></div>
        ) : activeTasks.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 border-dashed">
            <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiCheckCircle className="text-gray-400 w-6 h-6" />
            </div>
            <p className="text-gray-500 font-medium text-sm">Tidak ada tugas aktif saat ini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTasks.slice(0, 2).map((task) => (
              <Link 
                key={task.transaksi_id}
                to="/delivery/driver/tasks"
                className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`${getStatusColor(task.delivery_status)} text-[10px] font-bold px-2 py-0.5 rounded-md`}>
                    {getStatusLabel(task.delivery_status)}
                  </span>
                  <span className="text-gray-400 text-xs font-mono">#{task.nomor_transaksi?.slice(-6)}</span>
                </div>
                <h4 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-1">
                  {task.customer_name}
                </h4>
                <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                  {task.customer_address}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboardPage;
