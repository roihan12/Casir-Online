import React, { useState, useEffect } from "react";
import {
  Save,
  Info,
  AlertTriangle,
  Bell,
  Mail,
  Plus,
  Trash2,
  Check,
  X,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useCabang } from "../../../features/cabang/hooks/useCabang";

const NotificationSettings = () => {
  const { selectedCabang } = useCabang();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notificationConfig, setNotificationConfig] = useState({
    lowStockThresholdDays: 7,
    expiryThresholdDays: 30,
    enableEmailNotification: true,
    enableAppNotification: true,
    emailRecipients: "",
  });
  const [emailList, setEmailList] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // Fetch notification configuration for the selected branch
  useEffect(() => {
    if (selectedCabang?.id) {
      fetchNotificationConfig();
    }
  }, [selectedCabang]);

  // Parse email recipients when config is loaded
  useEffect(() => {
    if (notificationConfig.emailRecipients) {
      setEmailList(
        notificationConfig.emailRecipients
          .split(",")
          .map((email) => email.trim())
      );
    }
  }, [notificationConfig.emailRecipients]);

  const fetchNotificationConfig = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/notification-settings/${selectedCabang.id}`
      );
      if (response.data.success) {
        setNotificationConfig(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      toast.error("Gagal mengambil pengaturan notifikasi");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotificationConfig((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10) || 0;
    setNotificationConfig((prev) => ({
      ...prev,
      [name]: numValue,
    }));
  };

  const validateEmail = (email) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleAddEmail = () => {
    if (!newEmail) {
      setEmailError("Email tidak boleh kosong");
      return;
    }

    if (!validateEmail(newEmail)) {
      setEmailError("Format email tidak valid");
      return;
    }

    if (emailList.includes(newEmail)) {
      setEmailError("Email sudah ada dalam daftar");
      return;
    }

    setEmailList([...emailList, newEmail]);
    setNewEmail("");
    setEmailError("");
  };

  const handleRemoveEmail = (email) => {
    setEmailList(emailList.filter((e) => e !== email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update email recipients from email list
      const updatedConfig = {
        ...notificationConfig,
        emailRecipients: emailList.join(","),
      };

      const response = await axios.post(
        `/api/notification-settings/${selectedCabang.id}`,
        updatedConfig
      );

      if (response.data.success) {
        toast.success("Pengaturan notifikasi berhasil disimpan");
        setNotificationConfig(updatedConfig);
      } else {
        toast.error("Gagal menyimpan pengaturan notifikasi");
      }
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Gagal menyimpan pengaturan notifikasi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Pengaturan Notifikasi
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
            <Info
              className="text-blue-500 mr-3 mt-0.5 flex-shrink-0"
              size={20}
            />
            <div>
              <h3 className="font-semibold text-blue-700">
                Informasi Pengaturan Notifikasi
              </h3>
              <p className="text-blue-600 text-sm mt-1">
                Pengaturan ini akan mengontrol bagaimana notifikasi stok dan
                kadaluarsa dikirimkan ke pengguna di cabang{" "}
                {selectedCabang?.namaCabang || "ini"}.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Threshold Settings */}
            <div className="mb-6">
              <h3 className="text-gray-800 font-medium mb-4">
                Pengaturan Ambang Batas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="lowStockThresholdDays"
                    className="block text-gray-700 mb-2"
                  >
                    Peringatan Stok Menipis (hari)
                  </label>
                  <input
                    type="number"
                    name="lowStockThresholdDays"
                    id="lowStockThresholdDays"
                    min="1"
                    max="30"
                    value={notificationConfig.lowStockThresholdDays}
                    onChange={handleNumberChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    Kirim notifikasi saat stok akan habis dalam x hari
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="expiryThresholdDays"
                    className="block text-gray-700 mb-2"
                  >
                    Peringatan Kadaluarsa (hari)
                  </label>
                  <input
                    type="number"
                    name="expiryThresholdDays"
                    id="expiryThresholdDays"
                    min="1"
                    max="90"
                    value={notificationConfig.expiryThresholdDays}
                    onChange={handleNumberChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    Kirim notifikasi saat produk akan kadaluarsa dalam x hari
                  </p>
                </div>
              </div>
            </div>

            {/* Notification Channels */}
            <div className="mb-6">
              <h3 className="text-gray-800 font-medium mb-4">
                Saluran Notifikasi
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <Bell className="text-gray-600 mr-3" size={20} />
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Notifikasi Aplikasi
                      </h4>
                      <p className="text-gray-500 text-sm">
                        Tampilkan notifikasi di dalam aplikasi
                      </p>
                    </div>
                  </div>
                  <div className="relative inline-block w-12 align-middle select-none">
                    <input
                      type="checkbox"
                      name="enableAppNotification"
                      id="enableAppNotification"
                      checked={notificationConfig.enableAppNotification}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="enableAppNotification"
                      className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                        notificationConfig.enableAppNotification
                          ? "bg-indigo-500"
                          : ""
                      }`}
                    >
                      <span
                        className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ease-in ${
                          notificationConfig.enableAppNotification
                            ? "translate-x-6"
                            : "translate-x-0"
                        }`}
                      ></span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <Mail className="text-gray-600 mr-3" size={20} />
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Notifikasi Email
                      </h4>
                      <p className="text-gray-500 text-sm">
                        Kirim notifikasi melalui email
                      </p>
                    </div>
                  </div>
                  <div className="relative inline-block w-12 align-middle select-none">
                    <input
                      type="checkbox"
                      name="enableEmailNotification"
                      id="enableEmailNotification"
                      checked={notificationConfig.enableEmailNotification}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="enableEmailNotification"
                      className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                        notificationConfig.enableEmailNotification
                          ? "bg-indigo-500"
                          : ""
                      }`}
                    >
                      <span
                        className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ease-in ${
                          notificationConfig.enableEmailNotification
                            ? "translate-x-6"
                            : "translate-x-0"
                        }`}
                      ></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Recipients */}
            <div
              className={`mb-6 ${
                !notificationConfig.enableEmailNotification ? "opacity-50" : ""
              }`}
            >
              <h3 className="text-gray-800 font-medium mb-4">Penerima Email</h3>

              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="email"
                    placeholder="Masukkan alamat email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    disabled={!notificationConfig.enableEmailNotification}
                    className={`flex-1 border ${
                      emailError ? "border-red-500" : "border-gray-300"
                    } rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400`}
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    disabled={!notificationConfig.enableEmailNotification}
                    className={`bg-indigo-600 text-white px-4 py-2 rounded-r-lg font-medium ${
                      !notificationConfig.enableEmailNotification
                        ? "bg-indigo-300 cursor-not-allowed"
                        : "hover:bg-indigo-700"
                    }`}
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {emailError && (
                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-2">
                {emailList.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto">
                    {emailList.map((email, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-2 rounded-lg mb-2"
                      >
                        <span className="text-gray-700">{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          disabled={!notificationConfig.enableEmailNotification}
                          className={`text-red-500 hover:text-red-700 p-1 rounded-full ${
                            !notificationConfig.enableEmailNotification
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Belum ada penerima email
                  </div>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-2">
                Notifikasi akan dikirim ke email-email yang terdaftar
              </p>
            </div>

            {/* Notification Types */}
            <div className="mb-6">
              <h3 className="text-gray-800 font-medium mb-4">
                Jenis Notifikasi
              </h3>

              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span className="text-gray-700">Stok menipis</span>
                </div>
                <div className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span className="text-gray-700">Produk kadaluarsa</span>
                </div>
                <div className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span className="text-gray-700">Stok habis</span>
                </div>
                <div className="flex items-center">
                  <Check className="text-green-500 mr-2" size={18} />
                  <span className="text-gray-700">Kelebihan stok</span>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
              <AlertTriangle
                className="text-yellow-500 mr-3 mt-0.5 flex-shrink-0"
                size={20}
              />
              <div>
                <h3 className="font-semibold text-yellow-700">Perhatian</h3>
                <p className="text-yellow-600 text-sm mt-1">
                  Pastikan bahwa alamat email yang digunakan valid dan dapat
                  menerima email. Notifikasi penting mungkin tidak tersampaikan
                  jika pengaturan tidak benar.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  saving ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
                } text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={18} />
                    <span>Simpan Pengaturan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
