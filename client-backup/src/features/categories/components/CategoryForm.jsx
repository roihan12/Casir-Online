import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema } from "../validation/categoryValidation";

/**
 * CategoryForm - Reusable form for add/edit category
 * @param {Object} props
 * @param {Object} props.defaultValues - Default form values
 * @param {Function} props.onSubmit - Form submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.submitLabel - Submit button label
 */
const CategoryForm = ({
  defaultValues = {
    namaKategori: "",
    deskripsi: "",
    status: "aktif",
  },
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Simpan",
}) => {
  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues,
  });

  const handleSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6">
      <div className="mb-4">
        <label
          htmlFor="namaKategori"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nama Kategori <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="namaKategori"
          {...form.register("namaKategori")}
          className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            form.formState.errors.namaKategori
              ? "border-red-500"
              : "border-gray-300"
          }`}
          placeholder="Masukkan nama kategori"
        />
        {form.formState.errors.namaKategori && (
          <p className="mt-1 text-sm text-red-500">
            {form.formState.errors.namaKategori.message}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="deskripsi"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Deskripsi
        </label>
        <textarea
          id="deskripsi"
          {...form.register("deskripsi")}
          rows="3"
          className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            form.formState.errors.deskripsi
              ? "border-red-500"
              : "border-gray-300"
          }`}
          placeholder="Masukkan deskripsi kategori"
        ></textarea>
        {form.formState.errors.deskripsi && (
          <p className="mt-1 text-sm text-red-500">
            {form.formState.errors.deskripsi.message}
          </p>
        )}
      </div>

      <div className="mb-6">
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Status
        </label>
        <select
          id="status"
          {...form.register("status")}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
        >
          Batal
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          disabled={isLoading}
        >
          {isLoading ? "Menyimpan..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;
