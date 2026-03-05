import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  FiUserPlus,
  FiEdit2,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiPhone,
  FiMail,
  FiTruck,
  FiX,
  FiStar,
  FiUsers,
  FiLink,
  FiUnlock,
} from "react-icons/fi";
import {
  useDrivers,
  useCreateDriver,
  useUpdateDriver,
  useDeleteDriver,
  useToggleDriverStatus,
} from "../hooks/useDelivery";
import deliveryClientService from "../../../services/deliveryClientService";
import toast from "react-hot-toast";

const driverSchema = z.object({
  nama: z.string().min(1, "Nama harus diisi").max(100),
  no_hp: z
    .string()
    .min(1, "No HP harus diisi")
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, "Format nomor HP tidak valid"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  jenis_kendaraan: z.string().max(50).optional().or(z.literal("")),
  plat_kendaraan: z.string().max(20).optional().or(z.literal("")),
  user_id: z.string().optional().or(z.literal("")),
});

const DriverManagementPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [page, setPage] = useState(1);

  const { data: driversData, isLoading } = useDrivers({ page, limit: 20 });
  const drivers = driversData?.data || [];
  const pagination = driversData?.pagination || {};

  // Query available users for linking
  const { data: availableUsersData, refetch: refetchUsers } = useQuery({
    queryKey: ["available-users-for-driver"],
    queryFn: () => deliveryClientService.getAvailableUsers(),
    enabled: showForm,
  });
  const availableUsers = availableUsersData?.data || [];

  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const deleteDriver = useDeleteDriver();
  const toggleStatus = useToggleDriverStatus();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      nama: "",
      no_hp: "",
      email: "",
      jenis_kendaraan: "",
      plat_kendaraan: "",
      user_id: "",
    },
  });

  const openCreate = () => {
    setEditingDriver(null);
    reset({
      nama: "",
      no_hp: "",
      email: "",
      jenis_kendaraan: "",
      plat_kendaraan: "",
      user_id: "",
    });
    setShowForm(true);
  };

  const openEdit = (driver) => {
    setEditingDriver(driver);
    reset({
      nama: driver.nama,
      no_hp: driver.no_hp,
      email: driver.email || "",
      jenis_kendaraan: driver.jenis_kendaraan || "",
      plat_kendaraan: driver.plat_kendaraan || "",
      user_id: driver.linked_user_id || "",
    });
    setShowForm(true);
  };

  const onSubmit = async (data) => {
    try {
      // Convert empty user_id to null
      const payload = { ...data, user_id: data.user_id || null };
      if (editingDriver) {
        await updateDriver.mutateAsync({ id: editingDriver.id, data: payload });
        toast.success("Driver berhasil diupdate");
      } else {
        await createDriver.mutateAsync(payload);
        toast.success("Driver berhasil ditambahkan");
      }
      setShowForm(false);
      reset();
      refetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.errors || "Gagal menyimpan");
    }
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus driver ${nama}?`)) return;
    try {
      await deleteDriver.mutateAsync(id);
      toast.success("Driver berhasil dihapus");
    } catch (err) {
      toast.error(err.response?.data?.errors || "Gagal menghapus");
    }
  };

  const handleToggle = async (id) => {
    try {
      const result = await toggleStatus.mutateAsync(id);
      toast.success(`Status diubah ke ${result.data?.status || "berhasil"}`);
    } catch (err) {
      toast.error(err.response?.data?.errors || "Gagal toggle");
    }
  };

  // Build user options: available users + the currently linked user (if editing)
  const userOptions = [
    ...availableUsers,
    ...(editingDriver?.linked_user_id
      ? [{ id: editingDriver.linked_user_id, username: editingDriver.linked_username, namaLengkap: editingDriver.linked_user_name }]
      : []),
  ].filter((u, i, a) => a.findIndex(x => x.id === u.id) === i); // dedupe

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FiUsers className="text-indigo-500" />
            Manajemen Driver
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola driver kurir toko
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all text-sm font-medium"
        >
          <FiUserPlus className="w-4 h-4" />
          Tambah Driver
        </button>
      </div>

      {/* Drivers List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-24" />
                  <div className="h-3 bg-slate-200 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-16">
          <FiUsers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">Belum ada driver</p>
          <button
            onClick={openCreate}
            className="mt-3 text-indigo-600 font-medium hover:text-indigo-700"
          >
            + Tambah driver pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                      driver.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {driver.nama.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {driver.nama}
                    </h3>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        driver.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {driver.status === "ACTIVE" ? "Aktif" : "Offline"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(driver.id)}
                  className="text-slate-400 hover:text-indigo-500 transition-colors"
                >
                  {driver.status === "ACTIVE" ? (
                    <FiToggleRight className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <FiToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>

              <div className="space-y-1.5 mb-4">
                <p className="text-sm text-slate-600 flex items-center gap-2">
                  <FiPhone className="w-3.5 h-3.5 text-slate-400" />
                  {driver.no_hp}
                </p>
                {driver.email && (
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <FiMail className="w-3.5 h-3.5 text-slate-400" />
                    {driver.email}
                  </p>
                )}
                {driver.jenis_kendaraan && (
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <FiTruck className="w-3.5 h-3.5 text-slate-400" />
                    {driver.jenis_kendaraan}
                    {driver.plat_kendaraan && ` · ${driver.plat_kendaraan}`}
                  </p>
                )}
                {/* User Link Badge */}
                {driver.linked_user_id ? (
                  <p className="text-sm flex items-center gap-2">
                    <FiLink className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full text-xs">
                      🔗 {driver.linked_user_name || driver.linked_username}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm flex items-center gap-2">
                    <FiUnlock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-600 text-xs">Belum terhubung ke akun</span>
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
                <span>{driver.total_deliveries || 0} pengiriman</span>
                {driver.average_rating && (
                  <span className="flex items-center gap-0.5">
                    <FiStar className="w-3 h-3 text-amber-400" />
                    {driver.average_rating.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(driver)}
                  className="flex-1 py-2 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                >
                  <FiEdit2 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(driver.id, driver.nama)}
                  className="flex-1 py-2 text-xs font-medium bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors flex items-center justify-center gap-1"
                >
                  <FiTrash2 className="w-3 h-3" /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">
                {editingDriver ? "Edit Driver" : "Tambah Driver"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama *
                </label>
                <input
                  {...register("nama")}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
                />
                {errors.nama && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.nama.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  No. HP *
                </label>
                <input
                  {...register("no_hp")}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
                  placeholder="08xxxxxxxxxx"
                />
                {errors.no_hp && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.no_hp.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Kendaraan
                  </label>
                  <input
                    {...register("jenis_kendaraan")}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
                    placeholder="Motor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Plat
                  </label>
                  <input
                    {...register("plat_kendaraan")}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
                    placeholder="B 1234 XYZ"
                  />
                </div>
              </div>

              {/* Link to User Account */}
              <div className="border-t border-slate-200 pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                  <FiLink className="w-3.5 h-3.5 text-indigo-500" />
                  Hubungkan ke Akun User
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  Pilih akun user agar driver bisa login ke halaman tugas pengiriman
                </p>
                <select
                  {...register("user_id")}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
                >
                  <option value="">-- Tidak dihubungkan --</option>
                  {userOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.namaLengkap || u.username} (@{u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    createDriver.isPending || updateDriver.isPending
                  }
                  className="flex-1 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 font-medium text-sm disabled:opacity-50 transition-colors"
                >
                  {createDriver.isPending || updateDriver.isPending
                    ? "Menyimpan..."
                    : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverManagementPage;
