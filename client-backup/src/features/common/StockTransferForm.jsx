import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Save,
  Plus,
  Trash2,
  CheckCircle,
  ArrowRightCircle,
  Send,
  Clock,
  AlertTriangle,
  Search,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import stockTransferService from "../../services/stockTransferService";
import Spinner from "./Spinner";
import ConfirmationDialog from "./ConfirmationDialog";

// Define the form validation schema using zod
const stockTransferSchema = z.object({
  cabangAsalId: z.string().min(1, "Origin branch is required"),
  cabangTujuanId: z.string().min(1, "Destination branch is required"),
  keterangan: z.string().optional(),
  items: z
    .array(
      z.object({
        produkId: z.string().min(1, "Product is required"),
        jumlahKirim: z.number().min(1, "Quantity must be at least 1"),
        keterangan: z.string().optional(),
      })
    )
    .min(1, "At least one product must be added"),
});

const StockTransferForm = ({
  editMode = false,
  initialData = null,
  cabangList = [],
  onSuccess,
  currentUser,
}) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);

  // Initialize form with react-hook-form and zod validation
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid, isDirty },
  } = useForm({
    resolver: zodResolver(stockTransferSchema),
    defaultValues: initialData || {
      cabangAsalId: "",
      cabangTujuanId: "",
      keterangan: "",
      items: [{ produkId: "", jumlahKirim: 1, keterangan: "" }],
    },
    mode: "onChange",
  });

  const watchSourceBranch = watch("cabangAsalId");
  const watchItems = watch("items");

  // Get products for selected branch
  useEffect(() => {
    if (watchSourceBranch) {
      fetchProductsForBranch(watchSourceBranch);
    }
  }, [watchSourceBranch]);

  const fetchProductsForBranch = async (branchId) => {
    try {
      setLoadingProducts(true);
      // Replace with your actual API call to fetch products for a branch
      const response = await fetch(`/api/products/branch/${branchId}`);
      const data = await response.json();
      setProductOptions(data.products || []);
    } catch (error) {
      toast.error("Failed to load products for the selected branch");
      console.error(error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Filter products based on search term
  const filteredProducts = productOptions.filter(
    (product) =>
      product.namaProduk.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Add new item row
  const addItemRow = () => {
    const currentItems = getValues("items") || [];
    setValue("items", [
      ...currentItems,
      { produkId: "", jumlahKirim: 1, keterangan: "" },
    ]);
  };

  // Remove item row
  const removeItemRow = (index) => {
    const currentItems = getValues("items") || [];
    if (currentItems.length > 1) {
      setValue(
        "items",
        currentItems.filter((_, i) => i !== index)
      );
    } else {
      toast.error("At least one product is required");
    }
  };

  // Save as draft
  const saveAsDraft = async (data) => {
    try {
      setSubmitting(true);

      let response;
      if (editMode && initialData?.id) {
        response = await stockTransferService.updateStockTransfer(
          initialData.id,
          data
        );
        toast.success("Stock transfer updated successfully");
      } else {
        response = await stockTransferService.createStockTransfer(data);
        toast.success("Stock transfer created successfully");
      }

      if (onSuccess) {
        onSuccess(response.data);
      } else {
        navigate(`/stock-transfers/${response.data.id}`);
      }
    } catch (error) {
      toast.error(error.message || "Failed to save stock transfer");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit for approval
  const submitForApproval = async (data) => {
    try {
      setSubmitting(true);

      let transferId;

      // If it's a new transfer, create it first
      if (!editMode || !initialData?.id) {
        const createResponse = await stockTransferService.createStockTransfer(
          data
        );
        transferId = createResponse.data.id;
        toast.success("Stock transfer created successfully");
      } else {
        // If it's an existing transfer, update it first
        await stockTransferService.updateStockTransfer(initialData.id, data);
        transferId = initialData.id;
        toast.success("Stock transfer updated successfully");
      }

      // Now submit for approval
      const approvalResponse = await stockTransferService.submitForApproval(
        transferId,
        {
          keterangan: data.keterangan,
        }
      );

      toast.success("Stock transfer submitted for approval");

      if (onSuccess) {
        onSuccess(approvalResponse.data);
      } else {
        navigate(`/stock-transfers/${approvalResponse.data.id}`);
      }
    } catch (error) {
      toast.error(
        error.message || "Failed to submit stock transfer for approval"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form submission based on action
  const onSubmit = (data) => {
    // Validate that origin and destination branches are different
    if (data.cabangAsalId === data.cabangTujuanId) {
      toast.error("Origin and destination branches cannot be the same");
      return;
    }

    if (confirmationAction === "draft") {
      saveAsDraft(data);
    } else if (confirmationAction === "approval") {
      submitForApproval(data);
    }
  };

  // Show confirmation dialog
  const showConfirmation = (action) => {
    setConfirmationAction(action);
    setShowConfirmationDialog(true);
  };

  if (submitting) {
    return <Spinner />;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">
        {editMode ? "Edit Stock Transfer" : "Create New Stock Transfer"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Branch Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Origin Branch*
            </label>
            <Controller
              name="cabangAsalId"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`w-full p-2 border rounded-md ${
                    errors.cabangAsalId ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={editMode || submitting}
                >
                  <option value="">Select Origin Branch</option>
                  {cabangList.map((cabang) => (
                    <option key={cabang.id} value={cabang.id}>
                      {cabang.namaCabang}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.cabangAsalId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.cabangAsalId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination Branch*
            </label>
            <Controller
              name="cabangTujuanId"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`w-full p-2 border rounded-md ${
                    errors.cabangTujuanId ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={editMode || submitting}
                >
                  <option value="">Select Destination Branch</option>
                  {cabangList
                    .filter((cabang) => cabang.id !== watchSourceBranch)
                    .map((cabang) => (
                      <option key={cabang.id} value={cabang.id}>
                        {cabang.namaCabang}
                      </option>
                    ))}
                </select>
              )}
            />
            {errors.cabangTujuanId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.cabangTujuanId.message}
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <Controller
            name="keterangan"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Add any notes or comments about this transfer"
                disabled={submitting}
              />
            )}
          />
        </div>

        {/* Product Selection */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Products*</h3>
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center text-indigo-600 hover:text-indigo-800"
              disabled={submitting || !watchSourceBranch}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Product
            </button>
          </div>

          {!watchSourceBranch && (
            <div className="bg-yellow-50 p-4 rounded-md mb-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700">
                Please select an origin branch to add products
              </p>
            </div>
          )}

          {watchSourceBranch && loadingProducts && <Spinner small />}

          {watchItems && watchItems.length > 0 && (
            <div className="space-y-4">
              {watchItems.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-md p-4"
                >
                  <div className="flex justify-between">
                    <h4 className="font-medium">Product {index + 1}</h4>
                    {watchItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={submitting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product*
                      </label>
                      <div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Search for products..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="pl-10 w-full p-2 border border-gray-300 rounded-md"
                            disabled={submitting}
                          />
                        </div>
                        <div className="mt-2">
                          <Controller
                            name={`items.${index}.produkId`}
                            control={control}
                            render={({ field }) => (
                              <select
                                {...field}
                                className={`w-full p-2 border rounded-md ${
                                  errors.items?.[index]?.produkId
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                                disabled={submitting}
                              >
                                <option value="">Select Product</option>
                                {filteredProducts.map((product) => (
                                  <option key={product.id} value={product.id}>
                                    {product.namaProduk} - {product.sku} (Stock:{" "}
                                    {product.stok})
                                  </option>
                                ))}
                              </select>
                            )}
                          />
                          {errors.items?.[index]?.produkId && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.items[index].produkId.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity*
                      </label>
                      <Controller
                        name={`items.${index}.jumlahKirim`}
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            min="1"
                            className={`w-full p-2 border rounded-md ${
                              errors.items?.[index]?.jumlahKirim
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                            disabled={submitting}
                          />
                        )}
                      />
                      {errors.items?.[index]?.jumlahKirim && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.items[index].jumlahKirim.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Notes
                    </label>
                    <Controller
                      name={`items.${index}.keterangan`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="Optional notes for this item"
                          disabled={submitting}
                        />
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {errors.items && (
            <p className="mt-1 text-sm text-red-600">{errors.items.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => showConfirmation("draft")}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
            disabled={!isDirty || submitting}
          >
            <Save className="h-4 w-4 mr-2" /> Save as Draft
          </button>

          <button
            type="button"
            onClick={() => showConfirmation("approval")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
            disabled={!isValid || submitting}
          >
            <ArrowRightCircle className="h-4 w-4 mr-2" /> Submit for Approval
          </button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmationDialog}
        title={
          confirmationAction === "draft"
            ? "Save as Draft"
            : "Submit for Approval"
        }
        message={
          confirmationAction === "draft"
            ? "Are you sure you want to save this stock transfer as a draft?"
            : "Are you sure you want to submit this stock transfer for approval? You won't be able to edit it after submission."
        }
        confirmText={confirmationAction === "draft" ? "Save" : "Submit"}
        confirmButtonColor={confirmationAction === "draft" ? "gray" : "indigo"}
        cancelText="Cancel"
        onConfirm={() => {
          setShowConfirmationDialog(false);
          handleSubmit(onSubmit)();
        }}
        onCancel={() => setShowConfirmationDialog(false)}
      />
    </div>
  );
};

export default StockTransferForm;
