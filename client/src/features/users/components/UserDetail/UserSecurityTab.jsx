import React, { useState } from "react";
import { Lock, Shuffle, LogOut } from "lucide-react";

const UserSecurityTab = ({
  user,
  formatDate,
  formatTime,
  onResetPassword,
  onDeactivate,
  onForceLogout,
}) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
        <Lock className="h-5 w-5 mr-2 text-indigo-600" />
        Pengaturan Keamanan
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Password Settings */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-md font-semibold text-gray-900 flex items-center">
                <Shuffle className="h-4 w-4 mr-2 text-gray-400" />
                Password
              </h4>
              <p className="text-sm text-gray-500 mt-1 pr-4">
                {user.passwordLastChanged
                  ? `Terakhir diubah pada ${formatDate(
                      user.passwordLastChanged
                    )}`
                  : "Password belum pernah diubah sejak registrasi"}
              </p>
            </div>
            <button
              onClick={onResetPassword}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
              Reset
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              Reset password akan mengirimkan email instruksi ke user.
            </p>
          </div>
        </div>

        {/* Account Security */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-md font-semibold text-gray-900 flex items-center">
                <Lock className="h-4 w-4 mr-2 text-gray-400" />
                Status Akun
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                Status saat ini:{" "}
                <span
                  className={`font-semibold ${
                    user.status === "aktif" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {user.status === "aktif" ? "Aktif" : "Nonaktif"}
                </span>
              </p>
            </div>
            <button
              onClick={onDeactivate}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                user.status === "aktif"
                  ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              {user.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              {user.status === "aktif"
                ? "User dapat login dan mengakses sistem."
                : "User diblokir dari akses sistem."}
            </p>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-md font-semibold text-gray-900 flex items-center">
                <LogOut className="h-4 w-4 mr-2 text-gray-400" />
                Sesi Aktif
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                {user.activeSessions && user.activeSessions.length > 0
                  ? `${user.activeSessions.length} perangkat sedang login`
                  : "Tidak ada sesi aktif saat ini"}
              </p>
            </div>
            <button
              onClick={onForceLogout}
              className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                !user.activeSessions || user.activeSessions.length === 0
              }
            >
              Force Logout Semua
            </button>
          </div>

          {user.activeSessions && user.activeSessions.length > 0 ? (
            <div className="space-y-3">
              {user.activeSessions.map((session, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-gray-200 mr-3 text-gray-400 font-bold text-xs">
                      IP
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {session.device || "Unknown Device"}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <span className="font-mono">{session.ipAddress}</span>
                        {session.location && (
                          <>
                            <span className="mx-1">&bull;</span>
                            {session.location}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Aktif sejak: {formatDate(session.lastActivity)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTime(session.lastActivity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-sm text-gray-400">
                User ini tidak sedang login di perangkat manapun.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSecurityTab;
