import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { validatedInvoiceSchema } from "../invoices/validation/invoiceOcrSchema";
import {
  FileText,
  Calendar,
  Truck,
  DollarSign,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Info,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format, parse } from "date-fns";

const InvoiceOcrReview = ({
  ocrData,
  onSubmit,
  onCancel,
  suppliers = [],
  products = [],
}) => {
  // Format the OCR date string to a Date object
  const formatOcrDate = (dateString) => {
    try {
      // Try multiple date formats
      const formats = [
        "yyyy-MM-dd",
        "dd/MM/yyyy",
        "MM/dd/yyyy",
        "dd-MM-yyyy",
        "yyyy/MM/dd",
      ];
      for (const formatStr of formats) {
        try {
          return parse(dateString, formatStr, new Date());
        } catch (e) {
          // Continue trying other formats
        }
      }

      // If no format works, return today's date
      return new Date();
    } catch (error) {
      console.error("Error parsing date:", error);
      return new Date();
    }
  };

  // Map OCR data to form data format
  const mapOcrToFormData = () => {
    return {
      invoiceNumber: ocrData.invoiceNumber || "",
      invoiceDate: formatOcrDate(ocrData.invoiceDate),
      supplierId: "",
      items:
        ocrData.items?.map((item) => ({
          productId: "",
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal || item.quantity * item.unitPrice,
          notes: "",
        })) || [],
      totalAmount: ocrData.totalAmount || 0,
      tax: ocrData.tax || 0,
      discount: ocrData.discount || 0,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      paidAmount: ocrData.totalAmount || 0,
      notes: ocrData.notes || "",
    };
  };

  // Setup form with React Hook Form
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(validatedInvoiceSchema),
    defaultValues: mapOcrToFormData(),
  });

  // Setup fields array for dynamic item inputs
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Watch payment status to determine paid amount field behavior
  const paymentStatus = watch("paymentStatus");
  const totalAmount = watch("totalAmount");

  // Update paid amount when total or payment status changes
  useEffect(() => {
    if (paymentStatus === "PAID") {
      setValue("paidAmount", totalAmount);
    } else if (paymentStatus === "UNPAID") {
      setValue("paidAmount", 0);
    }
  }, [paymentStatus, totalAmount, setValue]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Handle product selection and auto-fill
  const handleProductSelect = (index, productId) => {
    const selectedProduct = products.find((p) => p.id === productId);
    if (selectedProduct) {
      setValue(`items.${index}.productId`, productId);
      // Auto-update price if it was empty or zero
      const currentPrice = watch(`items.${index}.unitPrice`);
      if (!currentPrice) {
        setValue(`items.${index}.unitPrice`, selectedProduct.hargaBeli || 0);
        // Recalculate subtotal
        const quantity = watch(`items.${index}.quantity`);
        setValue(
          `items.${index}.subtotal`,
          quantity * (selectedProduct.hargaBeli || 0)
        );
      }
    }
  };

  // Calculate subtotal for an item
  const calculateItemSubtotal = (index) => {
    const quantity = watch(`items.${index}.quantity`);
    const unitPrice = watch(`items.${index}.unitPrice`);
    const subtotal = quantity * unitPrice;
    setValue(`items.${index}.subtotal`, subtotal);

    // Recalculate total
    recalculateTotal();
  };

  // Recalculate invoice total
  const recalculateTotal = () => {
    const items = watch("items");
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const discount = watch("discount") || 0;
    const tax = watch("tax") || 0;

    const total = subtotal - discount + tax;
    setValue("totalAmount", total);

    // Update paid amount if status is PAID
    if (paymentStatus === "PAID") {
      setValue("paidAmount", total);
    }
  };

  // Add a new empty item
  const addItem = () => {
    append({
      productId: "",
      name: "",
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
      notes: "",
    });
  };

  // Handle form submission
  const onFormSubmit = (data) => {
    try {
      onSubmit(data);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to process invoice data");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <FileText className="w-6 h-6 mr-2 text-indigo-600" />
        Review Invoice Data
      </h2>

      {ocrData.confidence && ocrData.confidence < 0.7 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">
              Low Confidence OCR Results
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              The extracted data has low confidence (
              {Math.round(ocrData.confidence * 100)}%). Please review carefully
              and correct any errors.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Invoice Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register("invoiceNumber")}
                type="text"
                className={`pl-10 block w-full rounded-md border ${
                  errors.invoiceNumber ? "border-red-500" : "border-gray-300"
                } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
              />
            </div>
            {errors.invoiceNumber && (
              <p className="mt-1 text-sm text-red-600">
                {errors.invoiceNumber.message}
              </p>
            )}
          </div>

          {/* Invoice Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <Controller
                control={control}
                name="invoiceDate"
                render={({ field }) => (
                  <input
                    type="date"
                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : null
                      );
                    }}
                    className={`pl-10 block w-full rounded-md border ${
                      errors.invoiceDate ? "border-red-500" : "border-gray-300"
                    } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                  />
                )}
              />
            </div>
            {errors.invoiceDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.invoiceDate.message}
              </p>
            )}
          </div>

          {/* Supplier */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Truck className="h-5 w-5 text-gray-400" />
              </div>
              <select
                {...register("supplierId")}
                className={`pl-10 block w-full rounded-md border ${
                  errors.supplierId ? "border-red-500" : "border-gray-300"
                } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.supplierId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.supplierId.message}
              </p>
            )}
            {ocrData.supplierInfo && (
              <div className="mt-2 text-sm text-gray-500">
                <p>
                  OCR detected supplier:{" "}
                  <span className="font-medium">
                    {ocrData.supplierInfo.name}
                  </span>
                </p>
                {ocrData.supplierInfo.address && (
                  <p className="truncate">{ocrData.supplierInfo.address}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Items Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-800">Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 p-3 border-b border-gray-200 bg-gray-100 text-sm font-medium text-gray-700">
              <div className="col-span-5">Product</div>
              <div className="col-span-2 text-right">Quantity</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Subtotal</div>
              <div className="col-span-1"></div>
            </div>

            {/* Item Rows */}
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-2 p-3 border-b border-gray-200 items-center text-sm"
              >
                <div className="col-span-5">
                  <select
                    {...register(`items.${index}.productId`)}
                    onChange={(e) => handleProductSelect(index, e.target.value)}
                    className={`block w-full rounded-md border ${
                      errors.items?.[index]?.productId
                        ? "border-red-500"
                        : "border-gray-300"
                    } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  {watch(`items.${index}.name`) &&
                    !watch(`items.${index}.productId`) && (
                      <p className="mt-1 text-xs text-gray-500">
                        OCR detected: {watch(`items.${index}.name`)}
                      </p>
                    )}
                  {errors.items?.[index]?.productId && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.items?.[index]?.productId.message}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <input
                    {...register(`items.${index}.quantity`, {
                      valueAsNumber: true,
                      onChange: () => calculateItemSubtotal(index),
                    })}
                    type="number"
                    min="1"
                    step="1"
                    className={`block w-full rounded-md border ${
                      errors.items?.[index]?.quantity
                        ? "border-red-500"
                        : "border-gray-300"
                    } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-right`}
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.items?.[index]?.quantity.message}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-xs">Rp</span>
                    </div>
                    <input
                      {...register(`items.${index}.unitPrice`, {
                        valueAsNumber: true,
                        onChange: () => calculateItemSubtotal(index),
                      })}
                      type="number"
                      min="0"
                      step="100"
                      className={`pl-7 block w-full rounded-md border ${
                        errors.items?.[index]?.unitPrice
                          ? "border-red-500"
                          : "border-gray-300"
                      } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-right`}
                    />
                  </div>
                  {errors.items?.[index]?.unitPrice && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.items?.[index]?.unitPrice.message}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-xs">Rp</span>
                    </div>
                    <input
                      {...register(`items.${index}.subtotal`, {
                        valueAsNumber: true,
                      })}
                      type="number"
                      readOnly
                      className="pl-7 block w-full rounded-md border border-gray-300 bg-gray-50 shadow-sm sm:text-sm text-right"
                    />
                  </div>
                </div>

                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      remove(index);
                      recalculateTotal();
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}

            {fields.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No items added. Click the plus button to add an item.
              </div>
            )}
          </div>

          {errors.items && (
            <p className="mt-2 text-sm text-red-600">{errors.items.message}</p>
          )}
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              Payment Details
            </h3>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  {...register("paymentMethod")}
                  className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="CASH">Cash</option>
                  <option value="TRANSFER">Bank Transfer</option>
                  <option value="CREDIT">Credit</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Payment Status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                {...register("paymentStatus")}
                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partially Paid</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>

            {/* Paid Amount - shown if PAID or PARTIAL */}
            {paymentStatus !== "UNPAID" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register("paidAmount", { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="100"
                    readOnly={paymentStatus === "PAID"}
                    className={`pl-10 block w-full rounded-md border ${
                      errors.paidAmount ? "border-red-500" : "border-gray-300"
                    } ${
                      paymentStatus === "PAID" ? "bg-gray-50" : ""
                    } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                  />
                </div>
                {errors.paidAmount && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.paidAmount.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Invoice Summary */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              Invoice Summary
            </h3>

            {/* Discount */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register("discount", {
                    valueAsNumber: true,
                    onChange: recalculateTotal,
                  })}
                  type="number"
                  min="0"
                  step="100"
                  className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Tax */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register("tax", {
                    valueAsNumber: true,
                    onChange: recalculateTotal,
                  })}
                  type="number"
                  min="0"
                  step="100"
                  className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register("totalAmount", { valueAsNumber: true })}
                  type="number"
                  readOnly
                  className="pl-10 block w-full rounded-md border border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            {...register("notes")}
            rows={3}
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Additional notes about this purchase"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Confirm &amp; Create Purchase
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceOcrReview;
