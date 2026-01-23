import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Package, ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useProdukMasterDetail,
  useCreateProdukMaster,
  useUpdateProdukMaster,
  useCategories,
} from "../hooks/useProdukMasterQueries";
// FIXME: Component doesn't exist - needs to be created
// import ProductMasterForm from "../../../components/superadmin/ProductMasterForm";
import Spinner from "../../../features/common/Spinner";
import Alert from "../../../features/common/Alert";

const ProductMasterCreateEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditMode = Boolean(id);
  const title = isEditMode ? "Edit Produk" : "Tambah Produk";

  // Fetch product data if in edit mode
  const {
    data: product,
    isLoading: isLoadingProduct,
    isError: isProductError,
    error: productError,
  } = useProdukMasterDetail(id, {
    enabled: isEditMode,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch categories
  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
    error: categoriesError,
  } = useCategories();

  // Make sure categories is an array
  const categoriesArray = Array.isArray(categories) ? categories : [];

  // Create and update mutations
  const createMutation = useCreateProdukMaster();
  const updateMutation = useUpdateProdukMaster();

  // Derived loading and error states
  const isLoading = (isEditMode && isLoadingProduct) || isLoadingCategories;
  const isError = isProductError || isCategoriesError;
  const error = productError || categoriesError;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({
          id,
          data: formData.data,
          images: formData.images,
          imagesToDelete: formData.imagesToDelete,
        });
        toast.success("Produk berhasil diperbarui");
      } else {
        await createMutation.mutateAsync({
          data: formData.data,
          images: formData.images,
        });
        toast.success("Produk berhasil ditambahkan");
      }

      // Navigate back to product list
      navigate("/superadmin/product-master");
    } catch (error) {
      console.error("Error saving product:", error);
      throw error;
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate("/superadmin/product-master");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-4">
        <Alert
          type="error"
          title="Error"
          message={`Gagal memuat data: ${error?.message || "Unknown error"}`}
        />
        <button
          onClick={() => navigate("/superadmin/product-master")}
          className="mt-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Daftar Produk
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={handleCancel}
          className="mr-4 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Package className="mr-2 h-6 w-6" />
          {title}
        </h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm">
        <ProductMasterForm
          product={isEditMode ? product : null}
          categories={categoriesArray}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default ProductMasterCreateEdit;
