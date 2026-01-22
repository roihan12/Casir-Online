import React, { useState } from "react";
import { useAuth } from "../features/auth/hooks/useAuth.js";
import {
  User,
  Shield,
  Bell,
  Eye,
  Monitor,
  Lock,
  Moon,
  Sun,
  Save,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(false);

  // Account Settings Form
  const [accountSettings, setAccountSettings] = useState({
    language: "id",
    timeZone: "Asia/Jakarta",
  });

  // Security Settings Form
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    enableTwoFactor: false,
  });

  // Notification Settings Form
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    appNotifications: true,
    stockAlerts: true,
    promotionAlerts: false,
    transactionNotifications: true,
  });

  // Appearance Settings Form
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "light",
    fontSize: "medium",
    compactMode: false,
  });

  const handleAccountSettingsChange = (e) => {
    const { name, value } = e.target;
    setAccountSettings({
      ...accountSettings,
      [name]: value,
    });
  };

  const handleSecuritySettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setSecuritySettings({
      ...securitySettings,
      [name]: newValue,
    });
  };

  const handleNotificationSettingsChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: checked,
    });
  };

  const handleAppearanceSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setAppearanceSettings({
      ...appearanceSettings,
      [name]: newValue,
    });
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // This would call an API to update settings
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API call
      toast.success("Pengaturan akun berhasil disimpan");
    } catch (error) {
      toast.error("Gagal menyimpan pengaturan akun");
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate passwords
      if (securitySettings.newPassword !== securitySettings.confirmPassword) {
        throw new Error("Password baru dan konfirmasi password tidak sama");
      }

      // This would call an API to update password
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API call

      setSecuritySettings({
        ...securitySettings,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("Password berhasil diperbarui");
    } catch (error) {
      toast.error(error.message || "Gagal memperbarui password");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // This would call an API to update notification settings
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API call
      toast.success("Pengaturan notifikasi berhasil disimpan");
    } catch (error) {
      toast.error("Gagal menyimpan pengaturan notifikasi");
    } finally {
      setLoading(false);
    }
  };

  const handleAppearanceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // This would call an API to update appearance settings
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API call
      toast.success("Pengaturan tampilan berhasil disimpan");
    } catch (error) {
      toast.error("Gagal menyimpan pengaturan tampilan");
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      id: "account",
      label: "Akun",
      icon: <User size={18} />,
    },
    {
      id: "security",
      label: "Keamanan",
      icon: <Shield size={18} />,
    },
    {
      id: "notifications",
      label: "Notifikasi",
      icon: <Bell size={18} />,
    },
    {
      id: "appearance",
      label: "Tampilan",
      icon: <Eye size={18} />,
    },
  ];

  return (
    <div className="py-6 px-4 sm:px-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">Pengaturan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola pengaturan untuk akun dan aplikasi Anda
          </p>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="w-full md:w-64 p-4 border-b md:border-b-0 md:border-r border-gray-200">
            <nav className="space-y-1">
              {tabItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === item.id
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span
                    className={`mr-3 ${
                      activeTab === item.id
                        ? "text-indigo-500"
                        : "text-gray-400"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {/* Account Settings */}
            {activeTab === "account" && (
              <div>
                <h2 className="text-lg font-medium text-gray-800 mb-4">
                  Pengaturan Akun
                </h2>
                <form onSubmit={handleAccountSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bahasa
                      </label>
                      <select
                        name="language"
                        value={accountSettings.language}
                        onChange={handleAccountSettingsChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Zona Waktu
                      </label>
                      <select
                        name="timeZone"
                        value={accountSettings.timeZone}
                        onChange={handleAccountSettingsChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                        <option value="Asia/Makassar">
                          Asia/Makassar (WITA)
                        </option>
                        <option value="Asia/Jayapura">
                          Asia/Jayapura (WIT)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Simpan Pengaturan
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div>
                <h2 className="text-lg font-medium text-gray-800 mb-4">
                  Pengaturan Keamanan
                </h2>
                <form onSubmit={handleSecuritySubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password Saat Ini
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={securitySettings.currentPassword}
                        onChange={handleSecuritySettingsChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password Baru
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={securitySettings.newPassword}
                        onChange={handleSecuritySettingsChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Konfirmasi Password Baru
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={securitySettings.confirmPassword}
                        onChange={handleSecuritySettingsChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableTwoFactor"
                        name="enableTwoFactor"
                        checked={securitySettings.enableTwoFactor}
                        onChange={handleSecuritySettingsChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="enableTwoFactor"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Aktifkan autentikasi dua faktor
                      </label>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Lock size={16} className="mr-2" />
                          Perbarui Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <div>
                <h2 className="text-lg font-medium text-gray-800 mb-4">
                  Pengaturan Notifikasi
                </h2>
                <form onSubmit={handleNotificationSubmit}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <label
                          htmlFor="emailNotifications"
                          className="font-medium text-gray-700"
                        >
                          Notifikasi Email
                        </label>
                        <p className="text-sm text-gray-500">
                          Terima pemberitahuan melalui email
                        </p>
                      </div>
                      <div className="ml-4">
                        <input
                          type="checkbox"
                          id="emailNotifications"
                          name="emailNotifications"
                          checked={notificationSettings.emailNotifications}
                          onChange={handleNotificationSettingsChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <label
                          htmlFor="appNotifications"
                          className="font-medium text-gray-700"
                        >
                          Notifikasi Aplikasi
                        </label>
                        <p className="text-sm text-gray-500">
                          Terima pemberitahuan di dalam aplikasi
                        </p>
                      </div>
                      <div className="ml-4">
                        <input
                          type="checkbox"
                          id="appNotifications"
                          name="appNotifications"
                          checked={notificationSettings.appNotifications}
                          onChange={handleNotificationSettingsChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <label
                          htmlFor="stockAlerts"
                          className="font-medium text-gray-700"
                        >
                          Notifikasi Stok
                        </label>
                        <p className="text-sm text-gray-500">
                          Menerima peringatan saat stok produk menipis
                        </p>
                      </div>
                      <div className="ml-4">
                        <input
                          type="checkbox"
                          id="stockAlerts"
                          name="stockAlerts"
                          checked={notificationSettings.stockAlerts}
                          onChange={handleNotificationSettingsChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <label
                          htmlFor="promotionAlerts"
                          className="font-medium text-gray-700"
                        >
                          Notifikasi Promosi
                        </label>
                        <p className="text-sm text-gray-500">
                          Menerima informasi tentang promosi dan diskon
                        </p>
                      </div>
                      <div className="ml-4">
                        <input
                          type="checkbox"
                          id="promotionAlerts"
                          name="promotionAlerts"
                          checked={notificationSettings.promotionAlerts}
                          onChange={handleNotificationSettingsChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <label
                          htmlFor="transactionNotifications"
                          className="font-medium text-gray-700"
                        >
                          Notifikasi Transaksi
                        </label>
                        <p className="text-sm text-gray-500">
                          Menerima pemberitahuan tentang transaksi baru
                        </p>
                      </div>
                      <div className="ml-4">
                        <input
                          type="checkbox"
                          id="transactionNotifications"
                          name="transactionNotifications"
                          checked={
                            notificationSettings.transactionNotifications
                          }
                          onChange={handleNotificationSettingsChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Simpan Preferensi
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === "appearance" && (
              <div>
                <h2 className="text-lg font-medium text-gray-800 mb-4">
                  Pengaturan Tampilan
                </h2>
                <form onSubmit={handleAppearanceSubmit}>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tema
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        <div
                          className={`border rounded-md p-4 cursor-pointer ${
                            appearanceSettings.theme === "light"
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() =>
                            setAppearanceSettings({
                              ...appearanceSettings,
                              theme: "light",
                            })
                          }
                        >
                          <div className="flex justify-center mb-2">
                            <Sun size={24} className="text-gray-500" />
                          </div>
                          <div className="text-center text-sm">Terang</div>
                        </div>

                        <div
                          className={`border rounded-md p-4 cursor-pointer ${
                            appearanceSettings.theme === "dark"
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() =>
                            setAppearanceSettings({
                              ...appearanceSettings,
                              theme: "dark",
                            })
                          }
                        >
                          <div className="flex justify-center mb-2">
                            <Moon size={24} className="text-gray-500" />
                          </div>
                          <div className="text-center text-sm">Gelap</div>
                        </div>

                        <div
                          className={`border rounded-md p-4 cursor-pointer ${
                            appearanceSettings.theme === "system"
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() =>
                            setAppearanceSettings({
                              ...appearanceSettings,
                              theme: "system",
                            })
                          }
                        >
                          <div className="flex justify-center mb-2">
                            <Monitor size={24} className="text-gray-500" />
                          </div>
                          <div className="text-center text-sm">Sistem</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ukuran Font
                      </label>
                      <select
                        name="fontSize"
                        value={appearanceSettings.fontSize}
                        onChange={handleAppearanceSettingsChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="small">Kecil</option>
                        <option value="medium">Sedang</option>
                        <option value="large">Besar</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="compactMode"
                        name="compactMode"
                        checked={appearanceSettings.compactMode}
                        onChange={handleAppearanceSettingsChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="compactMode"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Mode Kompak (Mengurangi padding dan jarak antar elemen)
                      </label>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Simpan Pengaturan
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
