import React, { useState } from "react";
import { MapPin, AlertCircle, Map } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import cabangService from "../services/cabangService";
import Input from "../../common/Input";
import cabangSchema from "../validation/CabangValidation";
import LocationPickerMap from "./LocationPickerMap";

const CabangForm = ({ cabang, cabangList, onSubmitSuccess, onCancel }) => {
  const isEditMode = !!cabang;
  const queryClient = useQueryClient();
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Setup React Hook Form with Zod validation
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    setError,
    clearErrors,
  } = useForm({
    resolver: zodResolver(cabangSchema),
    defaultValues: {
      namaCabang: cabang?.namaCabang || "",
      alamat: cabang?.alamat || "",
      telepon: cabang?.telepon || "",
      latitude: cabang?.latitude ? String(cabang.latitude) : "",
      longitude: cabang?.longitude ? String(cabang.longitude) : "",
      radiusGeofence: cabang?.radiusGeofence
        ? String(cabang.radiusGeofence)
        : "",
      status: cabang?.status || "aktif",
    },
  });

  // Create mutation for adding a new cabang
  const createMutation = useMutation({
    mutationFn: cabangService.createCabang,
    onSuccess: (newCabang) => {
      queryClient.invalidateQueries({ queryKey: ["cabangList"] });
      onSubmitSuccess("create");
    },
  });

  // Update mutation for editing a cabang
  const updateMutation = useMutation({
    mutationFn: (data) => cabangService.updateCabang(cabang.id, data),
    onSuccess: (updatedCabang) => {
      queryClient.invalidateQueries({ queryKey: ["cabangList"] });
      onSubmitSuccess("update");
    },
  });

  // Handle form submission
  const onSubmit = async (data) => {
    // Check for duplicate cabang name
    if (
      !isEditMode &&
      cabangList.some(
        (c) => c.namaCabang.toLowerCase() === data.namaCabang.toLowerCase()
      )
    ) {
      setError("namaCabang", { message: "Nama cabang sudah digunakan" });
      return;
    }

    // Convert numeric strings to appropriate types
    const dataToSubmit = {
      ...data,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      radiusGeofence: data.radiusGeofence
        ? parseInt(data.radiusGeofence, 10)
        : null,
    };

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync(dataToSubmit);
      } else {
        await createMutation.mutateAsync(dataToSubmit);
      }
    } catch (error) {
      console.error("Error saving cabang:", error);
      // You could add error handling here, like displaying a toast
    }
  };

  // Handle getting current location
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue("latitude", position.coords.latitude.toFixed(8), {
            shouldValidate: true,
          });
          setValue("longitude", position.coords.longitude.toFixed(8), {
            shouldValidate: true,
          });
          clearErrors(["latitude", "longitude"]);
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("location", {
            message:
              "Tidak dapat mengakses lokasi. Pastikan izin lokasi diaktifkan.",
          });
        }
      );
    } else {
      setError("location", {
        message: "Geolocation tidak didukung oleh browser Anda.",
      });
    }
  };

  // Handle location picked from map
  const handleLocationFromMap = (position) => {
    setValue("latitude", position.lat.toFixed(8), { shouldValidate: true });
    setValue("longitude", position.lng.toFixed(8), { shouldValidate: true });
    clearErrors(["latitude", "longitude", "location"]);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 h-[calc(100vh-10rem)] overflow-y-auto">
      <div className="space-y-4">
        {/* Nama Cabang */}
        <Controller
          name="namaCabang"
          control={control}
          render={({ field }) => (
            <Input
              label="Nama Cabang"
              id="namaCabang"
              {...field}
              error={errors.namaCabang?.message}
              required
            />
          )}
        />

        {/* Alamat */}
        <div>
          <label
            htmlFor="alamat"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Alamat
          </label>
          <Controller
            name="alamat"
            control={control}
            render={({ field }) => (
              <textarea
                id="alamat"
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.alamat ? "border-red-500" : "border-gray-300"
                }`}
                {...field}
              />
            )}
          />
          {errors.alamat && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.alamat.message}
            </p>
          )}
        </div>

        {/* Telepon */}
        <Controller
          name="telepon"
          control={control}
          render={({ field }) => (
            <Input
              label="Telepon"
              id="telepon"
              {...field}
              error={errors.telepon?.message}
              placeholder="contoh: 081234567890"
            />
          )}
        />

        {/* Geolocation */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-700">Geolokasi</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded flex items-center hover:bg-indigo-200"
              >
                <MapPin className="h-3 w-3 mr-1" />
                Lokasi Saat Ini
              </button>
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center hover:bg-green-200"
              >
                <Map className="h-3 w-3 mr-1" />
                Pilih di Peta
              </button>
            </div>
          </div>

          {errors.location && (
            <div className="mb-2 text-sm text-red-600 bg-red-50 p-2 rounded flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.location.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="latitude"
              control={control}
              render={({ field }) => (
                <Input
                  label="Latitude"
                  id="latitude"
                  {...field}
                  error={errors.latitude?.message}
                  placeholder="-6.2088"
                />
              )}
            />

            <Controller
              name="longitude"
              control={control}
              render={({ field }) => (
                <Input
                  label="Longitude"
                  id="longitude"
                  {...field}
                  error={errors.longitude?.message}
                  placeholder="106.8456"
                />
              )}
            />
          </div>

          <Controller
            name="radiusGeofence"
            control={control}
            render={({ field }) => (
              <Input
                label="Radius Geofence (meter)"
                id="radiusGeofence"
                type="number"
                {...field}
                error={errors.radiusGeofence?.message}
                placeholder="100"
              />
            )}
          />
        </div>

        {/* Status */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <select
                id="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...field}
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Non-aktif</option>
              </select>
            )}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          disabled={
            isSubmitting || createMutation.isPending || updateMutation.isPending
          }
        >
          Batal
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
          disabled={
            isSubmitting || createMutation.isPending || updateMutation.isPending
          }
        >
          {isSubmitting ||
          createMutation.isPending ||
          updateMutation.isPending ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Menyimpan...
            </>
          ) : isEditMode ? (
            "Perbarui Cabang"
          ) : (
            "Tambah Cabang"
          )}
        </button>
      </div>

      {/* Location Picker Map Modal */}
      <LocationPickerMap
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onConfirm={handleLocationFromMap}
        initialLat={control._formValues.latitude}
        initialLng={control._formValues.longitude}
      />
    </form>
  );
};

export default CabangForm;
