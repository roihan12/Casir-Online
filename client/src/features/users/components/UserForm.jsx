import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FiAlertCircle as AlertCircle,
  FiUser as User,
  FiLock as Lock,
  FiMail as Mail,
  FiPhone as Phone,
  FiEye as Eye,
  FiEyeOff as EyeOff,
  FiUpload as Upload,
  FiEdit as Edit,
  FiUserPlus as UserPlus,
} from "react-icons/fi";
import { HiOutlineOfficeBuilding as Building } from "react-icons/hi";
import { AiOutlineLoading3Quarters as Loader2 } from "react-icons/ai";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@common/components/ui/input";
import { Label } from "@common/components/ui/label";
import { Button } from "@common/components/ui/button";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@common/components/ui/select";
import { Badge } from "@common/components/ui/badge";
import { Card, CardContent } from "@common/components/ui/card";
import cabangService from "../../cabang/services/cabangService";
import roleService from "../services/roleService";


import { useRoles } from "../hooks/useRoles";
import { useCabangList } from "../../../features/cabang/hooks/useCabangQueries";

const UserForm = ({ user, onSubmit, onCancel, isLoading = false }) => {
  const isEditMode = !!user;
  const fileInputRef = useRef(null);

  // State for visibility and selection
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedCabang, setSelectedCabang] = useState("");
  const [isPrimaryCabang, setIsPrimaryCabang] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  // Role & Cabang list fetching using hooks
  const { data: roleList = [], isLoading: isLoadingRoles } = useRoles();
  const { data: cabangData = { data: [] }, isLoading: isLoadingCabang } = useCabangList(1, 100);
  const cabangList = cabangData.data || [];

  // Import validation schema based on mode
  const userSchema = useMemo(() => {
    return z
      .object({
        username: z.string().min(1, "Username wajib diisi").max(50, "Username maksimal 50 karakter"),
        password: isEditMode
          ? z.string().max(255).optional()
          : z.string().min(6, "Password minimal 6 karakter").max(255, "Password maksimal 255 karakter"),
        confirmPassword: z.string().optional(),
        namaLengkap: z.string().min(1, "Nama lengkap wajib diisi").max(100, "Nama lengkap maksimal 100 karakter"),
        email: z.string().email("Format email tidak valid").max(100, "Email maksimal 100 karakter"),
        telepon: z
          .string()
          .max(20, "Nomor telepon maksimal 20 karakter")
          .regex(/^\d{8,15}$/, "Format nomor telepon tidak valid (8-15 digit)")
          .optional()
          .or(z.literal("")),
        status: z.enum(["aktif", "nonaktif"]),
        userRoles: z.array(z.object({
          roleId: z.string().min(1),
          cabangId: z.string().min(1),
        })).min(1, "User harus memiliki minimal 1 role"),
        userCabang: z.array(z.object({
          cabangId: z.string().min(1),
          isPrimary: z.boolean().default(false),
        })).min(1, "User harus memiliki minimal 1 cabang"),
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
      userRoles: [],
      userCabang: [],
    },
  });

  const watchedUserRoles = watch("userRoles");
  const watchedUserCabang = watch("userCabang");

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
        userRoles: user.userRoles || [],
        userCabang: user.userCabang || [],
      });
      
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
    const roleExists = watchedUserRoles.some(
      (r) => r.roleId === selectedRole && r.cabangId === selectedCabang
    );

    if (roleExists) {
      setRoleError("Kombinasi role dan cabang ini sudah ada");
      return;
    }

    const selectedRoleObj = roleList.find((r) => r.id === selectedRole);
    const selectedCabangObj = cabangList.find((c) => c.id === selectedCabang);

    const newRoles = [
      ...watchedUserRoles,
      {
        roleId: selectedRole,
        cabangId: selectedCabang,
        role: selectedRoleObj,
        cabang: selectedCabangObj,
      },
    ];
    
    setValue("userRoles", newRoles, { shouldValidate: true });

    // Reset selected values
    setSelectedRole("");
    setSelectedCabang("");
    setRoleError(null);
    setCabangError(null);
  };

  // Remove role from the user
  const handleRemoveRole = (index) => {
    const newRoles = watchedUserRoles.filter((_, i) => i !== index);
    setValue("userRoles", newRoles, { shouldValidate: true });
  };

  // Add cabang to the user
  const handleAddCabang = () => {
    if (!selectedCabang) {
      setCabangError("Cabang wajib dipilih");
      return;
    }

    // Check if cabang already exists
    const cabangExists = watchedUserCabang.some((c) => c.cabangId === selectedCabang);

    if (cabangExists) {
      setCabangError("Cabang ini sudah dipilih");
      return;
    }

    // If this is the first cabang, make it primary by default
    const shouldBePrimary = watchedUserCabang.length === 0 ? true : isPrimaryCabang;

    // If marking as primary, unmark other cabang as primary
    let updatedCabangs = [...watchedUserCabang];
    if (shouldBePrimary) {
      updatedCabangs = updatedCabangs.map((c) => ({
        ...c,
        isPrimary: false,
      }));
    }

    const selectedCabangObj = cabangList.find((c) => c.id === selectedCabang);

    const newCabangs = [
      ...updatedCabangs,
      {
        cabangId: selectedCabang,
        isPrimary: shouldBePrimary,
        cabang: selectedCabangObj,
      },
    ];
    
    setValue("userCabang", newCabangs, { shouldValidate: true });

    setCabangError(null);

    // Reset selected values
    setSelectedCabang("");
    setIsPrimaryCabang(false);
  };

  // Remove cabang from the user
  const handleRemoveCabang = (index) => {
    const cabangToRemove = watchedUserCabang[index];
    const newCabangs = watchedUserCabang.filter((_, i) => i !== index);

    // If the removed cabang was primary and we have other cabangs, make the first one primary
    if (cabangToRemove.isPrimary && newCabangs.length > 0) {
      newCabangs[0].isPrimary = true;
    }

    setValue("userCabang", newCabangs, { shouldValidate: true });
  };

  // Set a cabang as primary
  const handleSetPrimaryCabang = (index) => {
    const newCabangs = watchedUserCabang.map((c, i) => ({
        ...c,
        isPrimary: i === index,
      }));
    setValue("userCabang", newCabangs, { shouldValidate: true });
  };

  // Handle form submission
  const onFormSubmit = async (formData) => {
    // Validate that user has at least one cabang
    
    
    if (watchedUserCabang.length === 0) {
      setUserCabangError("User harus memiliki minimal 1 cabang");
      return;
    }

    try {
      // Prepare the arrays with correct format
      const userRolesArray = formData.userRoles.map((r) => ({
        roleId: r.roleId,
        cabangId: r.cabangId,
      }));

      const userCabangArray = formData.userCabang.map((c) => ({
        cabangId: c.cabangId,
        isPrimary: !!c.isPrimary, // Explicitly boolean
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

      await onSubmit(formDataToSubmit, true);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="bg-white">
      <form onSubmit={hookFormSubmit(onFormSubmit)} className="flex flex-col h-full overflow-hidden">
        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh] sm:max-h-[65vh]">
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
            <div className="space-y-1">
              <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="username"
                  {...register("username")}
                  placeholder="Username"
                  className="pl-9"
                  disabled={isLoading}
                />
              </div>
              {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
            </div>

            {/* Name */}
            <div className="space-y-1">
              <Label htmlFor="namaLengkap">Nama Lengkap <span className="text-red-500">*</span></Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="namaLengkap"
                  {...register("namaLengkap")}
                  placeholder="Nama Lengkap"
                  className="pl-9"
                  disabled={isLoading}
                />
              </div>
              {errors.namaLengkap && <p className="text-xs text-red-500">{errors.namaLengkap.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="Email"
                  className="pl-9"
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <Label htmlFor="telepon">Nomor Telepon</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="telepon"
                  {...register("telepon")}
                  placeholder="contoh: 081234567890"
                  className="pl-9"
                  disabled={isLoading}
                />
              </div>
              {errors.telepon && <p className="text-xs text-red-500">{errors.telepon.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password">
                Password {!isEditMode && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className="pl-9 pr-9"
                  placeholder={isEditMode ? "Biarkan kosong jika tidak diubah" : "Password"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute inset-y-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">
                Konfirmasi Password {!isEditMode && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  className="pl-9"
                  placeholder="Konfirmasi Password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="nonaktif">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Right Column - Cabang & Roles */}
          <div className="w-full md:w-1/2 space-y-4">
            {/* Cabang Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2 flex items-center">
                <Building className="h-5 w-5 mr-2 text-indigo-500" /> Cabang Penugasan
              </h3>

              {errors.userCabang && (
                <div className="p-3 bg-red-50 rounded-md border border-red-200">
                  <p className="text-xs text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" /> {errors.userCabang.message}
                  </p>
                </div>
              )}

              {/* Current Cabangs */}
              {watchedUserCabang.length > 0 && (
                <div className="space-y-2">
                  {watchedUserCabang.map((cabang, index) => (
                    <Card key={index} className="overflow-hidden border-indigo-50">
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Building className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">
                              {cabang.cabang?.namaCabang || "Cabang"}
                            </p>
                            {cabang.isPrimary && (
                              <Badge variant="success" className="mt-0.5">Utama</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!cabang.isPrimary && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleSetPrimaryCabang(index)}
                            >
                              Set Utama
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveCabang(index)}
                          >
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Add Cabang Form */}
              <Card className="bg-gray-50/50 border-dashed">
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Pilih Cabang</Label>
                    <Select
                      value={selectedCabang}
                      onValueChange={(val) => {
                        setSelectedCabang(val);
                        setCabangError(null);
                      }}
                      className="bg-white"
                      disabled={isLoadingCabang}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Cabang" />
                      </SelectTrigger>
                      <SelectContent>
                        {cabangList.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.namaCabang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPrimaryCabang"
                      checked={isPrimaryCabang}
                      onChange={(e) => setIsPrimaryCabang(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <Label htmlFor="isPrimaryCabang" className="text-xs cursor-pointer">
                      Jadikan sebagai cabang utama
                    </Label>
                  </div>

                  {cabangError && <p className="text-[10px] text-red-500">{cabangError}</p>}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-8 text-xs"
                    onClick={handleAddCabang}
                    disabled={isLoadingCabang}
                  >
                    Tambah Cabang
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Role Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-indigo-500" /> Role & Akses
              </h3>

              {errors.userRoles && (
                <div className="p-3 bg-red-50 rounded-md border border-red-200">
                  <p className="text-xs text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" /> {errors.userRoles.message}
                  </p>
                </div>
              )}

              {/* Current Roles */}
              {watchedUserRoles.length > 0 && (
                <div className="space-y-2">
                  {watchedUserRoles.map((role, index) => (
                    <Card key={index} className="overflow-hidden border-indigo-50">
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">
                              {role.role?.namaRole || "Role"}
                            </p>
                            <p className="text-[10px] text-gray-500 flex items-center">
                              <Building className="h-3 w-3 mr-1" /> {role.cabang?.namaCabang || "Cabang"}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveRole(index)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Add Role Form */}
              <Card className="bg-gray-50/50 border-dashed">
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Pilih Role</Label>
                       <Select
                        value={selectedRole}
                        onValueChange={(val) => {
                          setSelectedRole(val);
                          setRoleError(null);
                        }}
                        className="bg-white"
                        disabled={isLoadingRoles}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleList.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.namaRole}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Cabang</Label>
                      <Select
                        value={selectedCabang}
                        onValueChange={(val) => {
                          setSelectedCabang(val);
                          setCabangError(null);
                        }}
                        className="bg-white"
                        disabled={isLoadingCabang}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Cabang" />
                        </SelectTrigger>
                        <SelectContent>
                          {cabangList.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.namaCabang}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {(roleError || cabangError) && (
                    <p className="text-[10px] text-red-500">
                      {roleError || cabangError}
                    </p>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-8 text-xs"
                    onClick={handleAddRole}
                    disabled={isLoadingRoles || isLoadingCabang}
                  >
                    Tambah Role
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

        {/* Form Actions - Fixed at bottom */}
        <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-lg">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Kembali
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
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
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
