import React from "react";
import {
  Building,
  Check,
  Map,
  AlertTriangle,
  ArrowRight,
  Calendar,
} from "lucide-react";

const CabangDashboard = ({ totalCabang, cabangList = [], onViewCabang, className = "" }) => {
  // Calculate stats
  const activeCabang = cabangList.filter(
    (cabang) => cabang.status === "aktif"
  ).length;
  const inactiveCabang = totalCabang - activeCabang;
  const cabangWithGeofence = cabangList.filter(
    (cabang) => cabang.latitude && cabang.longitude && cabang.radiusGeofence
  ).length;

  // Get cabang with issues (missing important data)
  const cabangWithIssues = cabangList.filter(
    (cabang) =>
      !cabang.telepon ||
      !cabang.alamat ||
      (cabang.status === "aktif" && (!cabang.latitude || !cabang.longitude))
  );

  // Get most recent cabang (top 3)
  const sortedCabang = [...cabangList].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateB - dateA;
  });
  const recentCabang = sortedCabang.slice(0, 3);

  // Format date function
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className={`${className}`}>
      {/* Stat Cards - Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Total Cabang Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500">
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Cabang</p>
              <p className="text-2xl font-bold text-gray-900">{totalCabang}</p>
            </div>
            <div className="bg-indigo-100 p-2 rounded-lg h-fit">
              <Building className="h-5 w-5 text-indigo-500" />
            </div>
          </div>
          {totalCabang > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              <span className="font-medium">
                {Math.round((activeCabang / totalCabang) * 100)}%
              </span>{" "}
              aktif
            </div>
          )}
        </div>

        {/* Cabang Aktif Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Cabang Aktif</p>
              <p className="text-2xl font-bold text-gray-900">{activeCabang}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg h-fit">
              <Check className="h-5 w-5 text-green-500" />
            </div>
          </div>
          {inactiveCabang > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              <span className="font-medium text-red-500">{inactiveCabang}</span>{" "}
              nonaktif
            </div>
          )}
        </div>

        {/* Dengan Geofence Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Dengan Geofence</p>
              <p className="text-2xl font-bold text-gray-900">{cabangWithGeofence}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg h-fit">
              <Map className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          {totalCabang > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              <span className="font-medium">
                {Math.round((cabangWithGeofence / totalCabang) * 100)}%
              </span>{" "}
              total
            </div>
          )}
        </div>

        {/* Perlu Perhatian Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Perlu Perhatian</p>
              <p className="text-2xl font-bold text-gray-900">{cabangWithIssues.length}</p>
            </div>
            <div className="bg-yellow-100 p-2 rounded-lg h-fit">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Data tidak lengkap
          </div>
        </div>

        {/* Cabang Terbaru Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-purple-500" />
            <p className="text-xs text-gray-500 font-medium">Cabang Terbaru</p>
          </div>
          {recentCabang.length > 0 ? (
            <div className="space-y-1">
              {recentCabang.map((cabang) => (
                <div
                  key={cabang.id}
                  className="flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5"
                  onClick={() => onViewCabang && onViewCabang(cabang)}
                >
                  <span className="truncate max-w-[100px] text-gray-700 font-medium">
                    {cabang.namaCabang}
                  </span>
                  <span className="text-gray-400">
                    {formatDate(cabang.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Belum ada data</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CabangDashboard;
