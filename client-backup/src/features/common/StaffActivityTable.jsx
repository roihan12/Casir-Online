import { MapPin, RefreshCw, Users } from "lucide-react";

const StaffActivityTable = ({ isGlobalView, cabang, staffActivity }) => {
  // Default values if no activity data
  const {
    activeUsers = { total: 0, byBranch: [] },
    openShifts = { count: 0, details: [] },
    recentActivity = [],
  } = staffActivity || {};

  return (
    <div className="mx-6 grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Active Users Card */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-base font-medium">
            Pengguna Aktif {!isGlobalView ? `(${cabang})` : ""}
          </h3>
          <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
            {activeUsers.total} aktif
          </div>
        </div>

        {activeUsers.byBranch && activeUsers.byBranch.length > 0 ? (
          <div className="p-4">
            {activeUsers.byBranch.map((branch) => (
              <div key={branch.id} className="mb-4">
                <div className="flex items-center mb-2">
                  <MapPin size={16} className="text-indigo-500 mr-2" />
                  <span className="font-medium">{branch.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {branch.users.length} pengguna
                  </span>
                </div>
                <div className="pl-6">
                  {branch.users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between mb-1 text-sm"
                    >
                      <span>{user.name}</span>
                      <span className="text-xs text-gray-500">
                        {user.lastActivity
                          ? new Date(user.lastActivity).toLocaleTimeString()
                          : "N/A"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Users size={40} className="mx-auto mb-4 text-gray-300" />
            <p>Tidak ada pengguna aktif saat ini</p>
          </div>
        )}
      </div>

      {/* Recent Activity Card */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-base font-medium">
            Aktivitas Terbaru {!isGlobalView ? `(${cabang})` : ""}
          </h3>
          <div className="text-xs text-gray-500">
            {recentActivity.length} aktivitas
          </div>
        </div>

        {recentActivity && recentActivity.length > 0 ? (
          <div className="p-4">
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <RefreshCw size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {activity.action} {activity.tableName}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <span>{activity.user}</span>
                      <div className="mx-2 w-1 h-1 bg-gray-400 rounded-full"></div>
                      <span>
                        {activity.timestamp
                          ? new Date(activity.timestamp).toLocaleString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {recentActivity.length > 5 && (
              <div className="mt-4 text-center">
                <button className="text-sm text-indigo-600">
                  Lihat semua aktivitas
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw size={40} className="mx-auto mb-4 text-gray-300" />
            <p>Belum ada aktivitas terbaru</p>
          </div>
        )}
      </div>

      {/* Open Shifts Card */}
      {openShifts && openShifts.count > 0 && (
        <div className="bg-white rounded-xl shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-base font-medium">
              Shift Aktif {!isGlobalView ? `(${cabang})` : ""}
            </h3>
            <div className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">
              {openShifts.count} shift terbuka
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b">
                  <th className="px-4 py-3 font-medium">ID SHIFT</th>
                  <th className="px-4 py-3 font-medium">KASIR</th>
                  <th className="px-4 py-3 font-medium">CABANG</th>
                  <th className="px-4 py-3 font-medium">WAKTU MULAI</th>
                  <th className="px-4 py-3 font-medium">DURASI</th>
                </tr>
              </thead>
              <tbody>
                {openShifts.details.map((shift) => {
                  const startTime = shift.waktuMulai
                    ? new Date(shift.waktuMulai)
                    : null;
                  const now = new Date();
                  const durationMs = startTime ? now - startTime : 0;
                  const durationHours = Math.floor(
                    durationMs / (1000 * 60 * 60)
                  );
                  const durationMinutes = Math.floor(
                    (durationMs % (1000 * 60 * 60)) / (1000 * 60)
                  );

                  return (
                    <tr key={shift.id} className="border-b">
                      <td className="px-4 py-3 text-sm">
                        {shift.id.substring(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {shift.user?.namaLengkap || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {shift.cabang?.namaCabang || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {startTime ? startTime.toLocaleString() : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {startTime
                          ? `${durationHours}h ${durationMinutes}m`
                          : "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffActivityTable;