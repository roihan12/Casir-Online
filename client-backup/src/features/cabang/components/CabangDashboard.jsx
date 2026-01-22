import React, { useState } from "react";
import {
  Building,
  TrendingUp,
  Users,
  AlertTriangle,
  Map,
  Check,
  XCircle,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ChevronDown,
  ChevronUp,
  PieChart,
  BarChart,
} from "lucide-react";

const CabangDashboard = ({ totalCabang, cabangList = [], onViewCabang, className = "" }) => {
  const [selectedMetric, setSelectedMetric] = useState("status");
  const [showDistribution, setShowDistribution] = useState(true);

  // Calculate stats
  // const totalCabang = cabangList.length;
  const activeCabang = cabangList.filter(
    (cabang) => cabang.status === "aktif"
  ).length;
  const inactiveCabang = totalCabang - activeCabang;
  const cabangWithGeofence = cabangList.filter(
    (cabang) => cabang.latitude && cabang.longitude && cabang.radiusGeofence
  ).length;

  // Get most recent cabang
  const sortedCabang = [...cabangList].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateB - dateA;
  });
  const recentCabang = sortedCabang.slice(0, 5);

  // Get cabang with issues (missing important data)
  const cabangWithIssues = cabangList.filter(
    (cabang) =>
      !cabang.telepon ||
      !cabang.alamat ||
      (cabang.status === "aktif" && (!cabang.latitude || !cabang.longitude))
  );

  // Group cabang by province
  const cabangByProvince = cabangList.reduce((acc, cabang) => {
    const province = cabang.provinsi || "Tidak Diketahui";
    if (!acc[province]) {
      acc[province] = [];
    }
    acc[province].push(cabang);
    return acc;
  }, {});

  // Group cabang by city
  const cabangByCity = cabangList.reduce((acc, cabang) => {
    const city = cabang.kota || "Tidak Diketahui";
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(cabang);
    return acc;
  }, {});

  // Sort cities and provinces by number of cabang
  const sortedCities = Object.entries(cabangByCity)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5);

  const sortedProvinces = Object.entries(cabangByProvince)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5);

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

  // Get data for distribution chart based on selected metric
  const getDistributionData = () => {
    switch (selectedMetric) {
      case "status":
        return [
          { label: "Aktif", value: activeCabang, color: "bg-green-500" },
          { label: "Nonaktif", value: inactiveCabang, color: "bg-red-500" },
        ];
      case "geofence":
        return [
          {
            label: "Dengan Geofence",
            value: cabangWithGeofence,
            color: "bg-blue-500",
          },
          {
            label: "Tanpa Geofence",
            value: totalCabang - cabangWithGeofence,
            color: "bg-gray-400",
          },
        ];
      case "issues":
        return [
          {
            label: "Data Lengkap",
            value: totalCabang - cabangWithIssues.length,
            color: "bg-green-500",
          },
          {
            label: "Data Tidak Lengkap",
            value: cabangWithIssues.length,
            color: "bg-yellow-500",
          },
        ];
      case "location":
        // Limit to top 4 provinces plus "Lainnya"
        const topProvinces = sortedProvinces.slice(0, 4);
        const otherProvincesCount =
          totalCabang -
          topProvinces.reduce(
            (sum, [_, cabangArr]) => sum + cabangArr.length,
            0
          );

        return [
          ...topProvinces.map(([province, cabangArr], index) => ({
            label: province,
            value: cabangArr.length,
            color: `bg-indigo-${(index + 3) * 100}`,
          })),
          {
            label: "Lainnya",
            value: otherProvincesCount,
            color: "bg-gray-400",
          },
        ];
      default:
        return [];
    }
  };

  const distributionData = getDistributionData();

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Cabang Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Cabang</p>
              <p className="text-2xl font-bold text-gray-900">{totalCabang}</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Building className="h-6 w-6 text-indigo-500" />
            </div>
          </div>
          {totalCabang > 0 && (
            <div className="mt-4 text-xs text-gray-500">
              <span className="font-medium">
                {Math.round((activeCabang / totalCabang) * 100)}%
              </span>{" "}
              cabang aktif
            </div>
          )}
        </div>

        {/* Aktif vs Nonaktif Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Cabang Aktif</p>
              <p className="text-2xl font-bold text-gray-900">{activeCabang}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Check className="h-6 w-6 text-green-500" />
            </div>
          </div>
          {inactiveCabang > 0 && (
            <div className="mt-4 text-xs text-gray-500">
              <span className="font-medium text-red-500">{inactiveCabang}</span>{" "}
              cabang nonaktif
            </div>
          )}
        </div>

        {/* Cabang with Geofence Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Dengan Geofence
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {cabangWithGeofence}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Map className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          {totalCabang > 0 && (
            <div className="mt-4 text-xs text-gray-500">
              <span className="font-medium">
                {Math.round((cabangWithGeofence / totalCabang) * 100)}%
              </span>{" "}
              dari total cabang
            </div>
          )}
        </div>

        {/* Cabang with Issues Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Perlu Perhatian
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {cabangWithIssues.length}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          {cabangWithIssues.length > 0 && (
            <div className="mt-4 text-xs text-gray-500">
              Cabang dengan data tidak lengkap
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Distribution Chart */}
        <div className="bg-white rounded-lg shadow-sm border lg:col-span-1">
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <h3 className="font-medium text-gray-700">Distribusi Cabang</h3>
            <div className="flex items-center">
              <button
                className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowDistribution(!showDistribution)}
              >
                {showDistribution ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            </div>
          </div>

          {showDistribution && (
            <div className="p-4">
              <div className="mb-4">
                <label
                  htmlFor="metric-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tampilkan berdasarkan
                </label>
                <select
                  id="metric-select"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  <option value="status">Status</option>
                  <option value="geofence">Geofence</option>
                  <option value="issues">Kelengkapan Data</option>
                  <option value="location">Provinsi</option>
                </select>
              </div>

              <div className="space-y-3">
                {distributionData.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">
                        {item.label}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {item.value} (
                        {Math.round((item.value / totalCabang) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full`}
                        style={{
                          width: `${(item.value / totalCabang) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {selectedMetric === "location" ? (
                      <BarChart className="h-4 w-4 text-gray-500 mr-1" />
                    ) : (
                      <PieChart className="h-4 w-4 text-gray-500 mr-1" />
                    )}
                    <span className="text-xs text-gray-500">
                      {totalCabang} total cabang
                    </span>
                  </div>
                  <button
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    onClick={() => onViewCabang && onViewCabang()}
                  >
                    Lihat Detail
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Cabang */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-4 py-3 border-b">
            <h3 className="font-medium text-gray-700">Cabang Terbaru</h3>
          </div>
          {recentCabang.length > 0 ? (
            <div className="divide-y">
              {recentCabang.map((cabang) => (
                <div
                  key={cabang.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onViewCabang && onViewCabang(cabang)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {cabang.namaCabang}
                      </h4>
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {cabang.alamat || "Alamat belum diisi"}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cabang.status === "aktif"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cabang.status === "aktif" ? "Aktif" : "Nonaktif"}
                      </span>
                      <button
                        className="ml-3 p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewCabang && onViewCabang(cabang);
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Dibuat: {formatDate(cabang.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Belum ada data cabang
            </div>
          )}
          {recentCabang.length > 0 && totalCabang > 5 && (
            <div className="px-4 py-3 border-t text-right">
              <button
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                onClick={() => onViewCabang && onViewCabang()}
              >
                Lihat Semua Cabang
              </button>
            </div>
          )}
        </div>

        {/* Cabang with Issues */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-4 py-3 border-b">
            <h3 className="font-medium text-gray-700">
              Cabang Perlu Perhatian
            </h3>
          </div>
          {cabangWithIssues.length > 0 ? (
            <div className="divide-y">
              {cabangWithIssues.slice(0, 5).map((cabang) => (
                <div
                  key={cabang.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onViewCabang && onViewCabang(cabang)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {cabang.namaCabang}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {!cabang.alamat && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-50 text-yellow-800 border border-yellow-200">
                            Alamat kosong
                          </span>
                        )}
                        {!cabang.telepon && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-50 text-yellow-800 border border-yellow-200">
                            Telepon kosong
                          </span>
                        )}
                        {cabang.status === "aktif" &&
                          (!cabang.latitude || !cabang.longitude) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-50 text-yellow-800 border border-yellow-200">
                              Geolokasi belum diatur
                            </span>
                          )}
                      </div>
                    </div>
                    <button
                      className="ml-3 p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewCabang && onViewCabang(cabang);
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-500">
                Semua cabang memiliki data lengkap
              </p>
            </div>
          )}
          {cabangWithIssues.length > 5 && (
            <div className="px-4 py-3 border-t text-right">
              <button
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                onClick={() => {
                  // Implementasi filter untuk menampilkan cabang dengan masalah
                }}
              >
                Lihat Semua Cabang Bermasalah
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cities/Provinces Distribution - Only show if there's data */}
      {(sortedCities.length > 0 || sortedProvinces.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution by City */}
          {sortedCities.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-4 py-3 border-b">
                <h3 className="font-medium text-gray-700">
                  Distribusi berdasarkan Kota
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {sortedCities.map(([city, cabangArr], index) => (
                    <div key={city}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">{city}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {cabangArr.length} cabang (
                          {Math.round((cabangArr.length / totalCabang) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`bg-indigo-${
                            (index + 3) * 100
                          } h-2 rounded-full`}
                          style={{
                            width: `${(cabangArr.length / totalCabang) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Distribution by Province */}
          {sortedProvinces.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-4 py-3 border-b">
                <h3 className="font-medium text-gray-700">
                  Distribusi berdasarkan Provinsi
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {sortedProvinces.map(([province, cabangArr], index) => (
                    <div key={province}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">
                          {province}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {cabangArr.length} cabang (
                          {Math.round((cabangArr.length / totalCabang) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`bg-blue-${
                            (index + 3) * 100
                          } h-2 rounded-full`}
                          style={{
                            width: `${(cabangArr.length / totalCabang) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CabangDashboard;
