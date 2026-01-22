import React, { useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Clock,
  Building,
  UserCog,
  PieChart,
  Award,
  BarChart4,
  TrendingUp,
  Timer,
} from "lucide-react";

const UserDashboard = ({
  onViewUser,
  className = "",
  data,
  isLoading,
  isError,
}) => {
  const [showDistribution, setShowDistribution] = useState(true);
  const [showPerformance, setShowPerformance] = useState(true);

  // Handle loading state
  if (isLoading) {
    return (
      <div className={`${className} flex justify-center items-center h-64`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <div className={`${className} flex justify-center items-center h-64`}>
        <div className="text-center">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg">
            <p className="font-medium">Gagal memuat data</p>
            <p className="text-sm mt-1">Silakan coba kembali nanti</p>
          </div>
        </div>
      </div>
    );
  }

  // Extract data from API response
  const {
    userStats = {},
    usersByRole = {},
    roleDistribution = [],
    usersPerCabang = [],
    breakdownUserPerCabang = [],
    recentLogins = [],
    activities = { recentActivities: [], statistics: {} },
    userPerformance = {},
    activeAdminCabang = [],
  } = data || {};

  // Extract values from nested objects
  const { totalUsers, activeUsers, inactiveUsers, activePercentage } =
    userStats;
  const { superAdminCount, adminCabangCount, kasirCount, adminCount } =
    usersByRole;

  // Get top kasirs from userPerformance
  const topKasirs =
    userPerformance &&
    userPerformance.kasirTopTransaksi &&
    userPerformance.kasirTopTransaksi.length > 0
      ? userPerformance.kasirTopTransaksi.slice(0, 3)
      : [];

  // Get top admins from activeAdminCabang
  const topAdmins =
    activeAdminCabang && activeAdminCabang.length > 0
      ? activeAdminCabang.slice(0, 3)
      : [];

  // Get top cabang by user count
  const sortedCabangs = usersPerCabang ? usersPerCabang.slice(0, 5) : [];

  // Format role for display
  const formatRole = (role) => {
    const roleMap = {
      super_admin: "Super Admin",
      admin_cabang: "Admin Cabang",
      kasir: "Kasir",
    };
    return roleMap[role] || role;
  };

  // Get role badge class
  const getRoleBadgeClass = (role) => {
    const badgeMap = {
      super_admin: "bg-purple-100 text-purple-800",
      admin_cabang: "bg-blue-100 text-blue-800",
      kasir: "bg-green-100 text-green-800",
    };
    return badgeMap[role] || "bg-gray-100 text-gray-800";
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Format time
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get performance rating (1-5)
  const getPerformanceRating = (count, benchmark) => {
    const rating = Math.ceil((count / benchmark) * 5);
    return Math.min(5, Math.max(1, rating));
  };

  // Render stars for rating
  const renderRatingStars = (rating) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <span
          key={i}
          className={`text-xs ${
            i < rating ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </span>
      ));
  };

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Users Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total User</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalUsers || 0}
              </p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-indigo-500" />
            </div>
          </div>
          {totalUsers > 0 && (
            <div className="mt-4 text-xs text-gray-500">
              <span className="font-medium">
                {activePercentage ||
                  Math.round((activeUsers / totalUsers) * 100)}
                %
              </span>{" "}
              user aktif
            </div>
          )}
        </div>

        {/* Active Users Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">User Aktif</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeUsers || 0}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-500" />
            </div>
          </div>
          {inactiveUsers > 0 && (
            <div className="mt-4 text-xs text-gray-500">
              <span className="font-medium text-red-500">{inactiveUsers}</span>{" "}
              user nonaktif
            </div>
          )}
        </div>

        {/* Admin Users Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Admin</p>
              <p className="text-2xl font-bold text-gray-900">
                {(superAdminCount || 0) + (adminCabangCount || 0)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <UserCog className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <span className="font-medium">{superAdminCount || 0}</span> super
            admin, <span className="font-medium">{adminCabangCount || 0}</span>{" "}
            admin cabang
          </div>
        </div>

        {/* Kasir Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Kasir</p>
              <p className="text-2xl font-bold text-gray-900">
                {kasirCount || 0}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Building className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          {totalUsers > 0 && kasirCount > 0 && (
            <div className="mt-4 text-xs text-gray-500">
              <span className="font-medium">
                {Math.round((kasirCount / totalUsers) * 100)}%
              </span>{" "}
              dari total user
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Role Distribution */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <h3 className="font-medium text-gray-700">Distribusi Role User</h3>
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

          {showDistribution &&
          roleDistribution &&
          roleDistribution.length > 0 ? (
            <div className="p-4">
              <div className="space-y-3">
                {roleDistribution.map((role, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">
                        {formatRole(role.role)}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {role.count} ({role.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`bg-${
                          role.role === "super_admin"
                            ? "purple"
                            : role.role === "admin_cabang"
                            ? "blue"
                            : "green"
                        }-500 h-2 rounded-full`}
                        style={{
                          width: `${role.percentage}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <PieChart className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-xs text-gray-500">
                      {totalUsers} total user
                    </span>
                  </div>
                  <button
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    onClick={() => onViewUser && onViewUser()}
                  >
                    Lihat Detail
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Tidak ada data user tersedia
            </div>
          )}
        </div>

        {/* Cabang Distribution */}
        {sortedCabangs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-4 py-3 border-b">
              <h3 className="font-medium text-gray-700">User per Cabang</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {sortedCabangs.map((cabang, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className="text-sm text-gray-600 truncate max-w-[200px]"
                        title={cabang.namaCabang}
                      >
                        {cabang.namaCabang}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {cabang.userCount} user
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`bg-indigo-${
                          (index + 3) * 100
                        } h-2 rounded-full`}
                        style={{
                          width: `${(cabang.userCount / totalUsers) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t text-center">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">
                    Breakdown User per Cabang
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {breakdownUserPerCabang &&
                      breakdownUserPerCabang.length > 0 &&
                      breakdownUserPerCabang
                        .filter((item) => item.total > 0)
                        .slice(0, 3)
                        .map((item, index) => (
                          <div
                            key={index}
                            className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                          >
                            <span className="font-medium">
                              {item.namaCabang}
                            </span>
                            :
                            <span className="ml-1 px-1 bg-purple-100 text-purple-800 rounded-sm">
                              SA: {item.superAdmin}
                            </span>
                            <span className="ml-1 px-1 bg-blue-100 text-blue-800 rounded-sm">
                              A: {item.admin}
                            </span>
                            <span className="ml-1 px-1 bg-green-100 text-green-800 rounded-sm">
                              K: {item.kasir}
                            </span>
                          </div>
                        ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Logins */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-4 py-3 border-b">
            <h3 className="font-medium text-gray-700">Login Terbaru</h3>
          </div>
          {recentLogins && recentLogins.length > 0 ? (
            <div className="divide-y">
              {recentLogins.map((user, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onViewUser && onViewUser(user)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.namaLengkap}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500 font-medium">
                            {user.namaLengkap?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {user.namaLengkap}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(
                          user.role
                        )}`}
                      >
                        {formatRole(user.role)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      {formatDate(user.loginTime)} {formatTime(user.loginTime)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Belum ada aktivitas login
            </div>
          )}
        </div>
      </div>

      {/* Status Distribution and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-4 py-3 border-b">
            <h3 className="font-medium text-gray-700">Status User</h3>
          </div>
          <div className="p-4 flex items-center justify-center">
            <div className="w-48 h-48 relative">
              {/* Circle chart for active/inactive */}
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="12"
                />

                {/* Active users segment */}
                {totalUsers > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeDasharray={`${
                      (activeUsers / totalUsers) * 251.2
                    } 251.2`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                )}

                {/* Inactive users segment */}
                {totalUsers > 0 && inactiveUsers > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="12"
                    strokeDasharray={`${
                      (inactiveUsers / totalUsers) * 251.2
                    } 251.2`}
                    strokeDashoffset={`${
                      ((totalUsers - inactiveUsers) / totalUsers) * -251.2
                    }`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                )}
              </svg>

              {/* Center text */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {activeUsers || 0}
                </div>
                <div className="text-xs text-gray-500">Active Users</div>
              </div>
            </div>

            <div className="ml-8">
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Aktif</span>
                  <span className="ml-auto text-sm font-medium text-gray-900">
                    {activeUsers || 0} (
                    {activePercentage ||
                      (totalUsers
                        ? Math.round((activeUsers / totalUsers) * 100)
                        : 0)}
                    %)
                  </span>
                </div>

                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Nonaktif</span>
                  <span className="ml-auto text-sm font-medium text-gray-900">
                    {inactiveUsers || 0} (
                    {totalUsers
                      ? Math.round((inactiveUsers / totalUsers) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity chart */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-4 py-3 border-b">
            <h3 className="font-medium text-gray-700">Aktivitas User</h3>
          </div>
          {activities &&
          activities.recentActivities &&
          activities.recentActivities.length > 0 ? (
            <div className="p-4 divide-y">
              {activities.recentActivities
                .slice(0, 5)
                .map((activity, index) => (
                  <div key={index} className="py-2">
                    <div className="flex items-center">
                      <div className="h-6 w-6 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-xs text-indigo-600">
                          {activity.userName?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-800">
                          <span className="font-medium">
                            {activity.userName}
                          </span>{" "}
                          <span
                            className={`px-1.5 py-0.5 text-xs rounded ${
                              activity.action === "CREATE"
                                ? "bg-green-100 text-green-800"
                                : activity.action === "UPDATE"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {activity.action === "CREATE"
                              ? "menambah"
                              : activity.action === "UPDATE"
                              ? "mengubah"
                              : "menghapus"}
                          </span>{" "}
                          data {activity.tableName}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(activity.timestamp)}{" "}
                          {formatTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-4 h-64 flex items-center justify-center">
              <div className="text-center">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Belum ada data aktivitas</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics - New Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Dashboard */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <h3 className="font-medium text-gray-700">Performa User</h3>
            <div className="flex items-center">
              <button
                className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowPerformance(!showPerformance)}
              >
                {showPerformance ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            </div>
          </div>
          {showPerformance && topKasirs && topKasirs.length > 0 ? (
            <div className="p-4">
              {/* Top Kasir Section */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Award className="h-4 w-4 mr-1 text-blue-500" />
                  Kasir dengan Transaksi Tertinggi
                </h4>

                <div className="space-y-3">
                  {topKasirs.map((kasir, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                      onClick={() => onViewUser && onViewUser(kasir)}
                    >
                      <div className="flex items-center">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                              ? "bg-gray-400"
                              : "bg-orange-700"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {kasir.namaKasir}
                          </p>
                          <div className="flex items-center">
                            {renderRatingStars(
                              getPerformanceRating(
                                kasir.jumlahTransaksi || 0,
                                150
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {kasir.jumlahTransaksi || 0}
                        </p>
                        <p className="text-xs text-gray-500">transaksi</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Average Performance Stats */}
              <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-blue-700">
                    Rata-rata Transaksi per Kasir
                  </p>
                  <p className="text-lg font-bold text-blue-900">
                    {topKasirs.length
                      ? Math.round(
                          topKasirs.reduce(
                            (sum, k) => sum + (k.jumlahTransaksi || 0),
                            0
                          ) / topKasirs.length
                        )
                      : 0}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-purple-700">
                    Rata-rata Waktu Transaksi
                  </p>
                  <p className="text-lg font-bold text-purple-900">
                    {topKasirs.length
                      ? Math.round(
                          topKasirs.reduce(
                            (sum, k) => sum + (k.avgWaktuTransaksi || 0),
                            0
                          ) /
                            topKasirs.length /
                            60 // Convert to minutes if in seconds
                        )
                      : 0}
                    m
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 h-64 flex items-center justify-center">
              <div className="text-center">
                <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {showPerformance
                    ? "Tidak ada data performa tersedia"
                    : "Klik untuk melihat performa user"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Admin Performance */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-4 py-3 border-b">
            <h3 className="font-medium text-gray-700">Admin Cabang Teraktif</h3>
          </div>
          <div className="p-4">
            {topAdmins && topAdmins.length > 0 ? (
              <div className="space-y-3">
                {topAdmins.map((admin, index) => (
                  <div
                    key={index}
                    className="p-2 rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => onViewUser && onViewUser(admin)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-800 text-xs">
                            {admin.namaAdmin?.charAt(0)?.toUpperCase() || "A"}
                          </span>
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {admin.namaAdmin}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Timer className="h-3 w-3 mr-1" />
                        {admin.lastActivityTime
                          ? new Date().getHours() -
                            new Date(admin.lastActivityTime).getHours()
                          : "N/A"}
                        h lalu
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            ((admin.jumlahAktivitas || 0) / 100) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">
                        {admin.namaCabang || "Cabang tidak tersedia"}
                      </span>
                      <span className="text-xs font-medium text-gray-700">
                        {admin.jumlahAktivitas || 0} aktivitas
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div className="text-xs text-gray-500 flex items-center">
                    <TrendingUp className="h-4 w-4 text-gray-400 mr-1" />
                    Berdasarkan data 30 hari terakhir
                  </div>
                  <button
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                    onClick={() => onViewUser && onViewUser()}
                  >
                    Lihat Laporan Lengkap
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  Tidak ada data admin cabang tersedia
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
