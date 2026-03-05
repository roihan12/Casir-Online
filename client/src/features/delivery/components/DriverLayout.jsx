import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiList, FiClock, FiLogOut, FiArrowLeft } from "react-icons/fi";
import { useAuth } from "../../auth/hooks/useAuth";
import { useEffect } from "react";

const DriverLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If exact path is /delivery/driver, redirect to dashboard
    if (location.pathname === "/delivery/driver" || location.pathname === "/delivery/driver/") {
      navigate("/delivery/driver/dashboard", { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16 md:pt-0">
      {/* Mobile Header (Hidden on large screens because sidebar handles it) */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4 md:hidden">
        <h1 className="text-lg font-bold text-gray-800">Casir Online Driver</h1>
        <div className="flex items-center gap-2">
          {user?.role !== "DRIVER" && (
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
              title="Kembali ke Dashboard"
            >
              <FiArrowLeft size={20} />
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm("Apakah Anda yakin ingin keluar?")) {
                logout();
              }
            }}
            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Keluar / Logout"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 pb-20 md:pb-0 relative overflow-x-hidden w-full">
        <Outlet />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden pb-safe">
        <div className="flex justify-around items-center h-16">
          <NavLink
            to="/delivery/driver/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
              }`
            }
          >
            <FiHome className="w-6 h-6" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </NavLink>

          <NavLink
            to="/delivery/driver/tasks"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
              }`
            }
          >
            <FiList className="w-6 h-6" />
            <span className="text-[10px] font-medium">Tugas</span>
          </NavLink>

          <NavLink
            to="/delivery/driver/history"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
              }`
            }
          >
            <FiClock className="w-6 h-6" />
            <span className="text-[10px] font-medium">Riwayat</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default DriverLayout;
