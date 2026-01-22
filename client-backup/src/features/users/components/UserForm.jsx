import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  AlertCircle,
  User,
  Lock,
  Mail,
  Phone,
  Building,
  Eye,
  EyeOff,
  Upload,
  Loader2,
  Edit,
  UserPlus,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../../common/Input";
import userService from "../services/userService";
import cabangService from "../../cabang/services/cabangService";
import roleService from "../../../services/roleService";


const UserForm = ({ user, onSubmit, onCancel, isLoading = false }) => {
  const isEditMode = !!user;
  const fileInputRef = useRef(null);

  // State for visibility and selection
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedCabang, setSelectedCabang] = useState("");
  const [isPrimaryCabang, setIsPrimaryCabang] = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const [userCabang, setUserCabang] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  // Import validation schema based on mode
  const userSchema = useMemo(() => {
    return z
      .object({
        username: z.string().min(1, "Username wajib diisi"),
        password: isEditMode
          ? z.string().optional()
          : z.string().min(6, "Password minimal 6 karakter"),
        confirmPassword: z.string().optional(),
        namaLengkap: z.string().min(1, "Nama lengkap wajib diisi"),
        email: z.string().email("Format email tidak valid"),
        telepon: z
          .string()
          .regex(/^\d{8,15}$/, "Format nomor telepon tidak valid (8-15 digit)")
          .optional()
          .or(z.literal("")),
        status: z.enum(["aktif", "nonaktif"]),
      })
      .refine(
        (data) => !data.password || data.password === data.confirmPassword,
        {
          message: "Konfirmasi password tidak cocok",
          path: ["confirmPassword"],
        }
      );
  }, [isEditMode]);

  // Set up React Hook Form
  const {
    register,
    handleSubmit: hookFormSubmit,
    formState: { errors },
    setValue,
    control,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      namaLengkap: "",
      email: "",
      telepon: "",
      status: "aktif",
    },
  });

  // Fetch cabang list
  const { data: cabangList = [], isLoading: isLoadingCabang } = useQuery({
    queryKey: ["user-management-cabang"],
    queryFn: async () => {
      try {
        const response = await cabangService.getCabangList();
        return response.data || [];
      } catch (error) {
        console.error("Error fetching cabang list:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch role list
  const { data: roleList = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ["user-management-roles"],
    queryFn: async () => {
      try {
        const response = await roleService.getRoleList();
        return response.data || [];
      } catch (error) {
        console.error("Error fetching role list:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Populate form data when editing
  useEffect(() => {
    if (isEditMode && user) {
      reset({
        username: user.username || "",
        password: "",
        confirmPassword: "",
        namaLengkap: user.namaLengkap || "",
        email: user.email || "",
        telepon: user.telepon || "",
        status: user.status || "aktif",
      });

      setUserRoles(user.userRoles || []);
      setUserCabang(user.userCabang || []);

      // Set avatar preview if user has one
      if (user.avatarUrl) {
        setAvatarPreview(user.avatarUrl);
      }
    }
  }, [user, isEditMode, reset]);

  // Handle avatar file change
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  // Click avatar upload button
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  // Form validation error for cabang
  const [cabangError, setCabangError] = useState(null);
  const [roleError, setRoleError] = useState(null);
  const [userCabangError, setUserCabangError] = useState(null);

  // Add role to the user
  const handleAddRole = () => {
    if (!selectedRole) {
      setRoleError("Role wajib dipilih");
      return;
    }

    if (!selectedCabang) {
      setCabangError("Cabang wajib dipilih");
      return;
    }

    // Check if role already exists
    const roleExists = userRoles.some(
      (r) => r.roleId === selectedRole && r.cabangId === selectedCabang
    );

    if (roleExists) {
      setRoleError("Kombinasi role dan cabang ini sudah ada");
      return;
    }

    const selectedRoleObj = roleList.find((r) => r.id === selectedRole);
    const selectedCabangObj = cabangList.find((c) => c.id === selectedCabang);

    setUserRoles((prev) => [
      ...prev,
      {
        roleId: selectedRole,
        cabangId: selectedCabang,
        role: selectedRoleObj,
        cabang: selectedCabangObj,
      },
    ]);

    // Reset selected values
    setSelectedRole("");
    setSelectedCabang("");
    setRoleError(null);
    setCabangError(null);
  };

  // Remove role from the user
  const handleRemoveRole = (index) => {
    setUserRoles((prev) => prev.filter((_, i) => i !== index));
  };

  // Add cabang to the user
  const handleAddCabang = () => {
    if (!selectedCabang) {
      setCabangError("Cabang wajib dipilih");
      return;
    }

    // Check if cabang already exists
    const cabangExists = userCabang.some((c) => c.cabangId === selectedCabang);

    if (cabangExists) {
      setCabangError("Cabang ini sudah dipilih");
      return;
    }

    // If this is the first cabang, make it primary by default
    const shouldBePrimary = userCabang.length === 0 ? true : isPrimaryCabang;

    // If marking as primary, unmark other cabang as primary
    let updatedCabangs = [...userCabang];
    if (shouldBePrimary) {
      updatedCabangs = updatedCabangs.map((c) => ({
        ...c,
        isPrimary: false,
      }));
    }

    const selectedCabangObj = cabangList.find((c) => c.id === selectedCabang);

    setUserCabang([
      ...updatedCabangs,
      {
        cabangId: selectedCabang,
        isPrimary: shouldBePrimary,
        cabang: selectedCabangObj,
      },
    ]);

    setUserCabangError(null);
    setCabangError(null);

    // Reset selected values
    setSelectedCabang("");
    setIsPrimaryCabang(false);
  };

  // Remove cabang from the user
  const handleRemoveCabang = (index) => {
    const cabangToRemove = userCabang[index];

    setUserCabang((prev) => {
      const newCabangs = prev.filter((_, i) => i !== index);

      // If the removed cabang was primary and we have other cabangs, make the first one primary
      if (cabangToRemove.isPrimary && newCabangs.length > 0) {
        newCabangs[0].isPrimary = true;
      }

      return newCabangs;
    });
  };

  // Set a cabang as primary
  const handleSetPrimaryCabang = (index) => {
    setUserCabang((prev) =>
      prev.map((c, i) => ({
        ...c,
        isPrimary: i === index,
      }))
    );
  };

  // Handle form submission
  const onFormSubmit = async (formData) => {
    // Validate that user has at least one cabang
    if (userCabang.length === 0) {
      setUserCabangError("User harus memiliki minimal 1 cabang");
      return;
    }

    try {
      // Prepare the arrays with correct format
      const userRolesArray = userRoles.map((r) => ({
        roleId: r.roleId,
        cabangId: r.cabangId,
      }));

      const userCabangArray = userCabang.map((c) => ({
        cabangId: c.cabangId,
        isPrimary: String(c.isPrimary), // Ensure isPrimary is sent as a string
      }));

      // Create FormData for submission
      const formDataToSubmit = new FormData();

      // Add regular fields one by one
      formDataToSubmit.append("username", formData.username);
      formDataToSubmit.append("namaLengkap", formData.namaLengkap);
      formDataToSubmit.append("email", formData.email);
      formDataToSubmit.append("status", formData.status);

      // Add optional fields
      if (formData.telepon) {
        formDataToSubmit.append("telepon", formData.telepon);
      }

      // Add password only if it exists and not empty
      if (formData.password && formData.password.trim() !== "") {
        formDataToSubmit.append("password", formData.password);
      }

      // Add userRoles and userCabang as arrays
      userRolesArray.forEach((role, index) => {
        formDataToSubmit.append(`userRoles[${index}][roleId]`, role.roleId);
        formDataToSubmit.append(`userRoles[${index}][cabangId]`, role.cabangId);
      });

      userCabangArray.forEach((cabang, index) => {
        formDataToSubmit.append(
          `userCabang[${index}][cabangId]`,
          cabang.cabangId
        );
        formDataToSubmit.append(
          `userCabang[${index}][isPrimary]`,
          cabang.isPrimary
        );
      });

      // Add avatar file if it exists
      if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
        formDataToSubmit.append("avatar", avatarFile, avatarFile.name);
      }

      console.log("isLoading", isLoading);

      await onSubmit(formDataToSubmit, true);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="border-b px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {isEditMode ? "Edit User" : "Tambah User Baru"}
        </h2>
      </div>

      <form onSubmit={hookFormSubmit(onFormSubmit)} className="p-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column - User Info */}
          <div className="w-full md:w-1/2 space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Informasi User
            </h3>

            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-6">
              <div
                onClick={handleAvatarClick}
                className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 cursor-pointer border-2 border-dashed border-gray-300 flex items-center justify-center mb-2"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload className="h-8 w-8 text-gray-400" />
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <span className="text-sm text-gray-500">
                Klik untuk upload foto profil
              </span>
            </div>

            {/* Username */}
            <Input
              label="Username"
              id="username"
              {...register("username")}
              error={errors.username?.message}
              icon={<User className="h-5 w-5 text-gray-400" />}
              required
              disabled={isLoading}
            />

            {/* Name */}
            <Input
              label="Nama Lengkap"
              id="namaLengkap"
              {...register("namaLengkap")}
              error={errors.namaLengkap?.message}
              icon={<User className="h-5 w-5 text-gray-400" />}
              required
              disabled={isLoading}
            />

            {/* Email */}
            <Input
              label="Email"
              id="email"
              type="email"
              {...register("email")}
              error={errors.email?.message}
              icon={<Mail className="h-5 w-5 text-gray-400" />}
              required
              disabled={isLoading}
            />

            {/* Phone Number */}
            <Input
              label="Nomor Telepon"
              id="telepon"
              {...register("telepon")}
              error={errors.telepon?.message}
              icon={<Phone className="h-5 w-5 text-gray-400" />}
              placeholder="contoh: 081234567890"
              disabled={isLoading}
            />

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password{" "}
                {!isEditMode && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  {...register("password")}
                  className={`w-full px-4 py-3 pl-10 pr-10 rounded-lg border ${
                    errors.password
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-indigo-400"
                  } focus:outline-none focus:ring-2`}
                  placeholder={
                    isEditMode ? "Biarkan kosong jika tidak diubah" : ""
                  }
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Konfirmasi Password{" "}
                {!isEditMode && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  {...register("confirmPassword")}
                  className={`w-full px-4 py-3 pl-10 rounded-lg border ${
                    errors.confirmPassword
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-indigo-400"
                  } focus:outline-none focus:ring-2`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <div className="relative">
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="status"
                      {...field}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Cabang & Roles */}
          <div className="w-full md:w-1/2 space-y-4">
            {/* Cabang Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Cabang
              </h3>

              {userCabangError && (
                <div className="mt-1 p-2 bg-red-50 rounded border border-red-200">
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {userCabangError}
                  </p>
                </div>
              )}

              {/* Current Cabangs */}
              {userCabang.length > 0 && (
                <div className="mt-3 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Cabang yang ditugaskan:
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {userCabang.map((cabang, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center">
                          <Building className="h-5 w-5 text-gray-500 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {cabang.cabang?.namaCabang || "Cabang"}
                              {cabang.isPrimary && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                                  Utama
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {!cabang.isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryCabang(index)}
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Set Utama
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveCabang(index)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Cabang */}
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Tambahkan Cabang
                </h4>
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="cabang"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Cabang
                    </label>
                    <div className="relative">
                      <select
                        id="cabang"
                        value={selectedCabang}
                        onChange={(e) => {
                          setSelectedCabang(e.target.value);
                          setCabangError(null);
                        }}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          cabangError
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-indigo-400"
                        } focus:outline-none focus:ring-2`}
                        disabled={isLoadingCabang}
                      >
                        <option value="">-- Pilih Cabang --</option>
                        {cabangList.map((cabang) => (
                          <option key={cabang.id} value={cabang.id}>
                            {cabang.namaCabang}
                          </option>
                        ))}
                      </select>
                    </div>
                    {cabangError && (
                      <p className="mt-1 text-sm text-red-600">{cabangError}</p>
                    )}
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPrimaryCabang"
                      checked={isPrimaryCabang}
                      onChange={(e) => setIsPrimaryCabang(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isPrimaryCabang"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Set sebagai cabang utama
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCabang}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    disabled={isLoadingCabang}
                  >
                    {isLoadingCabang ? "Memuat..." : "Tambah Cabang"}
                  </button>
                </div>
              </div>
            </div>

            {/* Role Section */}
            <div className="pt-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Role & Akses
              </h3>

              {/* Current Roles */}
              {userRoles.length > 0 && (
                <div className="mt-3 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Role yang ditetapkan:
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {userRoles.map((role, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-500 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {role.role?.namaRole || "Role"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {role.cabang?.namaCabang || "Cabang"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRole(index)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Role */}
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Tambahkan Role
                </h4>
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Role
                    </label>
                    <div className="relative">
                      <select
                        id="role"
                        value={selectedRole}
                        onChange={(e) => {
                          setSelectedRole(e.target.value);
                          setRoleError(null);
                        }}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          roleError
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-indigo-400"
                        } focus:outline-none focus:ring-2`}
                        disabled={isLoadingRoles}
                      >
                        <option value="">-- Pilih Role --</option>
                        {roleList.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.namaRole}
                          </option>
                        ))}
                      </select>
                    </div>
                    {roleError && (
                      <p className="mt-1 text-sm text-red-600">{roleError}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="roleCabang"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Cabang untuk Role
                    </label>
                    <div className="relative">
                      <select
                        id="roleCabang"
                        value={selectedCabang}
                        onChange={(e) => {
                          setSelectedCabang(e.target.value);
                          setCabangError(null);
                        }}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          cabangError
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-indigo-400"
                        } focus:outline-none focus:ring-2`}
                        disabled={isLoadingCabang}
                      >
                        <option value="">-- Pilih Cabang --</option>
                        {cabangList.map((cabang) => (
                          <option key={cabang.id} value={cabang.id}>
                            {cabang.namaCabang}
                          </option>
                        ))}
                      </select>
                    </div>
                    {cabangError && (
                      <p className="mt-1 text-sm text-red-600">{cabangError}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRole}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    disabled={isLoadingRoles || isLoadingCabang}
                  >
                    {isLoadingRoles || isLoadingCabang
                      ? "Memuat..."
                      : "Tambah Role"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-6 border-t mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
            disabled={isLoading}
          >
            Kembali
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : isEditMode ? (
              "Simpan Perubahan"
            ) : (
              "Simpan"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
