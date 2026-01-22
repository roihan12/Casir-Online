import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  Percent,
  Settings,
  User,
  Building,
  Save,
  X,
} from "lucide-react";
import cabangService from "../services/cabangService";
import {
  getOperationalHours,
  updateOperationalHours,
} from "../../../services/operationalHoursService";
import Input from "../../common/Input";
import Modal from "../../common/Modal";

const CabangDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cabang, setCabang] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general");
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Form state for different tabs
  const [generalInfo, setGeneralInfo] = useState({
    namaCabang: "",
    alamat: "",
    telepon: "",
    email: "",
    kodePos: "",
    kota: "",
    provinsi: "",
    latitude: "",
    longitude: "",
    radiusGeofence: "",
    status: "aktif",
  });

  const [jamOperasional, setJamOperasional] = useState({
    senin: { buka: true, jamBuka: "08:00", jamTutup: "21:00" },
    selasa: { buka: true, jamBuka: "08:00", jamTutup: "21:00" },
    rabu: { buka: true, jamBuka: "08:00", jamTutup: "21:00" },
    kamis: { buka: true, jamBuka: "08:00", jamTutup: "21:00" },
    jumat: { buka: true, jamBuka: "08:00", jamTutup: "21:00" },
    sabtu: { buka: true, jamBuka: "08:00", jamTutup: "21:00" },
    minggu: { buka: true, jamBuka: "08:00", jamTutup: "21:00" },
  });

  const [pengaturanPajak, setPengaturanPajak] = useState({
    pajakAktif: false,
    persentasePajak: 10,
    namaPajak: "PPN",
    includeServiceCharge: false,
    persentaseServiceCharge: 5,
  });

  // Load cabang data
  useEffect(() => {
    const loadCabangDetail = async () => {
      try {
        setIsLoading(true);
        const [cabangData, hoursData] = await Promise.all([
          cabangService.getCabangById(id),
          getOperationalHours(id),
        ]);

        setCabang(cabangData);
        setJamOperasional(hoursData);

        // Initialize form state with cabang data
        setGeneralInfo({
          namaCabang: cabangData.namaCabang || "",
          alamat: cabangData.alamat || "",
          telepon: cabangData.telepon || "",
          email: cabangData.email || "",
          kodePos: cabangData.kodePos || "",
          kota: cabangData.kota || "",
          provinsi: cabangData.provinsi || "",
          latitude: cabangData.latitude ? String(cabangData.latitude) : "",
          longitude: cabangData.longitude ? String(cabangData.longitude) : "",
          radiusGeofence: cabangData.radiusGeofence
            ? String(cabangData.radiusGeofence)
            : "",
          status: cabangData.status || "aktif",
        });

        // Initialize pengaturan pajak if exists
        if (cabangData.pengaturanPajak) {
          setPengaturanPajak(cabangData.pengaturanPajak);
        }
      } catch (error) {
        console.error("Error loading cabang detail:", error);
        // Show error message
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadCabangDetail();
    }
  }, [id]);

  // Handle general info changes
  const handleGeneralInfoChange = (e) => {
    const { name, value } = e.target;
    setGeneralInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
    setUnsavedChanges(true);
  };

  // Handle jam operasional changes
  const handleJamOperasionalChange = (hari, field, value) => {
    setJamOperasional((prev) => ({
      ...prev,
      [hari]: {
        ...prev[hari],
        [field]: value,
      },
    }));
    setUnsavedChanges(true);
  };

  // Handle pajak changes
  const handlePajakChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPengaturanPajak((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setUnsavedChanges(true);
  };

  // Handle save
  const handleSave = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        cabangService.updateCabang(id, generalInfo),
        updateOperationalHours(id, jamOperasional),
      ]);

      setUnsavedChanges(false);
      // Show success message
      setModalContent({
        title: "Sukses",
        message: "Data cabang berhasil disimpan",
        type: "success",
      });
      setShowModal(true);
    } catch (error) {
      console.error("Error saving cabang:", error);
      // Show error message
      setModalContent({
        title: "Error",
        message: "Gagal menyimpan data cabang",
        type: "error",
      });
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back navigation with unsaved changes check
  const handleBack = () => {
    if (unsavedChanges) {
      setModalContent({
        title: "Konfirmasi",
        message:
          "Ada perubahan yang belum disimpan. Apakah Anda yakin ingin kembali?",
        type: "confirm",
        onConfirm: () => navigate("/superadmin/cabang"),
      });
      setShowModal(true);
    } else {
      navigate("/superadmin/cabang");
    }
  };

  if (isLoading && !cabang) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Detail Cabang: {cabang?.namaCabang}
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            disabled={isLoading || !unsavedChanges}
            className={`px-4 py-2 rounded-lg flex items-center ${
              !unsavedChanges
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            <Save className="h-5 w-5 mr-2" />
            Simpan
          </button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="mb-6">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            generalInfo.status === "aktif"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          Status: {generalInfo.status === "aktif" ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("general")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "general"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Building className="inline-block h-5 w-5 mr-2" />
            Informasi Umum
          </button>
          <button
            onClick={() => setActiveTab("hours")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "hours"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Clock className="inline-block h-5 w-5 mr-2" />
            Jam Operasional
          </button>
          <button
            onClick={() => setActiveTab("tax")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "tax"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Percent className="inline-block h-5 w-5 mr-2" />
            Pengaturan Pajak
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "staff"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <User className="inline-block h-5 w-5 mr-2" />
            Staff & Perizinan
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "settings"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Settings className="inline-block h-5 w-5 mr-2" />
            Pengaturan Lainnya
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* General Information */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informasi Cabang
              </h3>
              <Input
                label="Nama Cabang"
                id="namaCabang"
                name="namaCabang"
                value={generalInfo.namaCabang}
                onChange={handleGeneralInfoChange}
                required
              />
              <div className="mb-5">
                <label
                  htmlFor="alamat"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Alamat
                </label>
                <textarea
                  id="alamat"
                  name="alamat"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={generalInfo.alamat}
                  onChange={handleGeneralInfoChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Kota"
                  id="kota"
                  name="kota"
                  value={generalInfo.kota}
                  onChange={handleGeneralInfoChange}
                />
                <Input
                  label="Provinsi"
                  id="provinsi"
                  name="provinsi"
                  value={generalInfo.provinsi}
                  onChange={handleGeneralInfoChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Kode Pos"
                  id="kodePos"
                  name="kodePos"
                  value={generalInfo.kodePos}
                  onChange={handleGeneralInfoChange}
                />
                <Input
                  label="Telepon"
                  id="telepon"
                  name="telepon"
                  value={generalInfo.telepon}
                  onChange={handleGeneralInfoChange}
                />
              </div>
              <Input
                label="Email"
                id="email"
                name="email"
                type="email"
                value={generalInfo.email}
                onChange={handleGeneralInfoChange}
              />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Lokasi & Status
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    Geolokasi
                  </h4>
                  <button
                    type="button"
                    className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded flex items-center"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    Pilih di Peta
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Latitude"
                    id="latitude"
                    name="latitude"
                    value={generalInfo.latitude}
                    onChange={handleGeneralInfoChange}
                  />
                  <Input
                    label="Longitude"
                    id="longitude"
                    name="longitude"
                    value={generalInfo.longitude}
                    onChange={handleGeneralInfoChange}
                  />
                </div>

                <Input
                  label="Radius Geofence (meter)"
                  id="radiusGeofence"
                  name="radiusGeofence"
                  type="number"
                  value={generalInfo.radiusGeofence}
                  onChange={handleGeneralInfoChange}
                />

                {/* Show mini map preview here */}
                <div className="h-40 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-gray-400" />
                  <span className="ml-2 text-gray-500">Peta Preview</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status Cabang
                </label>
                <select
                  id="status"
                  name="status"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={generalInfo.status}
                  onChange={handleGeneralInfoChange}
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Non-aktif</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Jam Operasional */}
        {activeTab === "hours" && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Jam Operasional
            </h3>
            <div className="grid gap-4">
              {Object.entries(jamOperasional).map(([hari, value]) => {
                const labelHari = {
                  senin: "Senin",
                  selasa: "Selasa",
                  rabu: "Rabu",
                  kamis: "Kamis",
                  jumat: "Jumat",
                  sabtu: "Sabtu",
                  minggu: "Minggu",
                }[hari];

                return (
                  <div
                    key={hari}
                    className="p-4 border rounded-lg flex items-center flex-wrap"
                  >
                    <div className="w-32">
                      <span className="font-medium">{labelHari}</span>
                    </div>
                    <div className="flex items-center ml-4">
                      <input
                        type="checkbox"
                        id={`${hari}-buka`}
                        checked={value.buka}
                        onChange={(e) =>
                          handleJamOperasionalChange(
                            hari,
                            "buka",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <label
                        htmlFor={`${hari}-buka`}
                        className="ml-2 text-sm text-gray-700"
                      >
                        Buka
                      </label>
                    </div>
                    <div
                      className={`flex items-center space-x-4 ml-8 ${
                        !value.buka ? "opacity-50" : ""
                      }`}
                    >
                      <div>
                        <label
                          htmlFor={`${hari}-jamBuka`}
                          className="block text-xs text-gray-500"
                        >
                          Jam Buka
                        </label>
                        <input
                          type="time"
                          id={`${hari}-jamBuka`}
                          value={value.jamBuka}
                          onChange={(e) =>
                            handleJamOperasionalChange(
                              hari,
                              "jamBuka",
                              e.target.value
                            )
                          }
                          disabled={!value.buka}
                          className="px-2 py-1 border rounded-md"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`${hari}-jamTutup`}
                          className="block text-xs text-gray-500"
                        >
                          Jam Tutup
                        </label>
                        <input
                          type="time"
                          id={`${hari}-jamTutup`}
                          value={value.jamTutup}
                          onChange={(e) =>
                            handleJamOperasionalChange(
                              hari,
                              "jamTutup",
                              e.target.value
                            )
                          }
                          disabled={!value.buka}
                          className="px-2 py-1 border rounded-md"
                        />
                      </div>
                    </div>
                    <div className="ml-auto">
                      <button
                        type="button"
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                        onClick={() => {
                          // Clone business hours from previous day
                          if (hari !== "senin") {
                            const prevHari = {
                              selasa: "senin",
                              rabu: "selasa",
                              kamis: "rabu",
                              jumat: "kamis",
                              sabtu: "jumat",
                              minggu: "sabtu",
                            }[hari];

                            if (prevHari) {
                              setJamOperasional((prev) => ({
                                ...prev,
                                [hari]: { ...prev[prevHari] },
                              }));
                              setUnsavedChanges(true);
                            }
                          }
                        }}
                      >
                        Salin dari hari sebelumnya
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-2">
                Pengaturan Hari Libur
              </h4>
              <button
                type="button"
                className="px-4 py-2 border border-indigo-500 text-indigo-600 rounded-lg hover:bg-indigo-50"
              >
                <Calendar className="h-4 w-4 inline-block mr-2" />
                Atur Hari Libur Khusus
              </button>
            </div>
          </div>
        )}

        {/* Pengaturan Pajak */}
        {activeTab === "tax" && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Pengaturan Pajak & Biaya
            </h3>

            <div className="bg-white rounded-lg border p-4 mb-4">
              <div className="flex items-start mb-4">
                <div className="flex items-center h-5">
                  <input
                    id="pajakAktif"
                    name="pajakAktif"
                    type="checkbox"
                    checked={pengaturanPajak.pajakAktif}
                    onChange={handlePajakChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="pajakAktif"
                    className="font-medium text-gray-700"
                  >
                    Aktifkan Pajak
                  </label>
                  <p className="text-gray-500">
                    Pajak akan ditambahkan otomatis ke semua transaksi
                  </p>
                </div>
              </div>

              <div
                className={`ml-7 space-y-4 ${
                  !pengaturanPajak.pajakAktif ? "opacity-50" : ""
                }`}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="namaPajak"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nama Pajak
                    </label>
                    <input
                      type="text"
                      id="namaPajak"
                      name="namaPajak"
                      value={pengaturanPajak.namaPajak}
                      onChange={handlePajakChange}
                      disabled={!pengaturanPajak.pajakAktif}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="PPN, Pajak Penjualan, dll"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="persentasePajak"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Persentase (%)
                    </label>
                    <input
                      type="number"
                      id="persentasePajak"
                      name="persentasePajak"
                      value={pengaturanPajak.persentasePajak}
                      onChange={handlePajakChange}
                      disabled={!pengaturanPajak.pajakAktif}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-start mb-4">
                <div className="flex items-center h-5">
                  <input
                    id="includeServiceCharge"
                    name="includeServiceCharge"
                    type="checkbox"
                    checked={pengaturanPajak.includeServiceCharge}
                    onChange={handlePajakChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="includeServiceCharge"
                    className="font-medium text-gray-700"
                  >
                    Aktifkan Service Charge
                  </label>
                  <p className="text-gray-500">
                    Service charge akan ditambahkan ke semua transaksi
                  </p>
                </div>
              </div>

              <div
                className={`ml-7 ${
                  !pengaturanPajak.includeServiceCharge ? "opacity-50" : ""
                }`}
              >
                <div>
                  <label
                    htmlFor="persentaseServiceCharge"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Persentase Service Charge (%)
                  </label>
                  <input
                    type="number"
                    id="persentaseServiceCharge"
                    name="persentaseServiceCharge"
                    value={pengaturanPajak.persentaseServiceCharge}
                    onChange={handlePajakChange}
                    disabled={!pengaturanPajak.includeServiceCharge}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 border rounded-lg bg-yellow-50">
              <h4 className="font-medium text-gray-800 mb-2">
                Catatan Penting
              </h4>
              <p className="text-sm text-gray-600">
                Konfigurasi pajak dan biaya akan memengaruhi semua transaksi di
                cabang ini. Pajak dan service charge akan ditambahkan secara
                otomatis ke subtotal pembelian.
              </p>
            </div>
          </div>
        )}

        {/* Placeholder untuk tab lainnya */}
        {activeTab === "staff" && (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-500">
              Pengaturan Staff & Perizinan
            </h3>
            <p className="text-gray-400 mt-2">Fitur ini akan segera tersedia</p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="text-center py-8">
            <Settings className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-500">
              Pengaturan Lainnya
            </h3>
            <p className="text-gray-400 mt-2">Fitur ini akan segera tersedia</p>
          </div>
        )}
      </div>

      {/* Confirmation/Alert Modal */}
      {showModal && modalContent && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalContent.title}
        >
          <div className="p-6">
            <p className="text-gray-700 mb-4">{modalContent.message}</p>
            <div className="flex justify-end space-x-3">
              {modalContent.type === "confirm" ? (
                <>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      modalContent.onConfirm && modalContent.onConfirm();
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Ya, Lanjutkan
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-lg ${
                    modalContent.type === "success"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  } text-white`}
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CabangDetail;
