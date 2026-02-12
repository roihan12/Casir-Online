import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Truck,
  File,
  CheckCircle,
  ArrowLeft,
  FileText,
  ShoppingBag,
  Loader,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useCabang } from "../../../features/cabang/hooks/useCabang";
import InvoiceScanner from "../../common/InvoiceScanner";
import InvoiceOcrReview from "../../common/InvoiceOcrReview";
import {
  useExtractInvoiceData,
  useSubmitInvoicePurchase,
} from "@common/hooks/useInvoiceOcr";
import { useQuery } from "@tanstack/react-query";
import supplierService from "../../../services/supplierService";
import productService from "../../../services/productService";

const InvoicePurchase = () => {
  const navigate = useNavigate();
  const { selectedCabang } = useCabang();

  // State management
  const [showScanner, setShowScanner] = useState(false);
  const [processingStep, setProcessingStep] = useState("initial"); // initial, scanning, processing, review, submitting, complete
  const [scannedImage, setScannedImage] = useState(null);
  const [ocrData, setOcrData] = useState(null);

  // Fetch suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () =>
      supplierService.getSuppliers({ cabangId: selectedCabang?.id }),
    enabled: !!selectedCabang?.id,
  });

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ["products", selectedCabang?.id],
    queryFn: () => productService.getProducts({ cabangId: selectedCabang?.id }),
    enabled: !!selectedCabang?.id,
  });

  const suppliers = suppliersData?.data || [];
  const products = productsData?.data || [];

  // OCR extraction mutation
  const { mutate: extractInvoiceData, isLoading: isExtracting } =
    useExtractInvoiceData();

  // Submit purchase mutation
  const { mutate: submitPurchase, isLoading: isSubmitting } =
    useSubmitInvoicePurchase();

  // Handle opening the scanner
  const handleOpenScanner = () => {
    setShowScanner(true);
    setProcessingStep("scanning");
  };

  // Handle when an image is captured
  const handleImageCapture = (imageData) => {
    setScannedImage(imageData);
    setShowScanner(false);
    setProcessingStep("processing");

    // Process the image with OCR
    extractInvoiceData(imageData, {
      onSuccess: (data) => {
        setOcrData(data.data);
        setProcessingStep("review");
      },
      onError: (error) => {
        toast.error("Failed to extract invoice data. Please try again.");
        setProcessingStep("initial");
      },
    });
  };

  // Handle cancellation of scanner
  const handleScannerClose = () => {
    setShowScanner(false);
    setProcessingStep("initial");
  };

  // Handle review cancellation
  const handleReviewCancel = () => {
    setOcrData(null);
    setScannedImage(null);
    setProcessingStep("initial");
  };

  // Handle form submission after review
  const handleReviewSubmit = (data) => {
    setProcessingStep("submitting");

    // Format data for the backend
    const purchaseData = {
      ...data,
      cabangId: selectedCabang?.id,
      jenis_transaksi: "PEMBELIAN",
      details: data.items.map((item) => ({
        produk_id: item.productId,
        jumlah: item.quantity,
        harga_satuan: item.unitPrice,
        subtotal: item.subtotal,
        keterangan: item.notes || null,
      })),
      scannedInvoiceImage: scannedImage,
    };

    // Submit purchase
    submitPurchase(purchaseData, {
      onSuccess: (response) => {
        toast.success("Purchase transaction created successfully!");
        setProcessingStep("complete");

        // Navigate to purchase details after a brief delay
        setTimeout(() => {
          if (response?.data?.id) {
            navigate(`/purchases/${response.data.id}`);
          } else {
            navigate("/purchases");
          }
        }, 1500);
      },
      onError: (error) => {
        toast.error("Failed to create purchase transaction.");
        setProcessingStep("review");
      },
    });
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 rounded-full bg-white shadow-sm hover:bg-gray-50"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Invoice OCR Purchase
            </h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Scan supplier invoices, verify OCR results, and create purchase
          transactions
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto">
        {processingStep === "initial" && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center py-8">
              <div className="mx-auto w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                <Camera className="h-12 w-12 text-indigo-600" />
              </div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">
                Scan Supplier Invoice
              </h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Capture or upload a clear image of the supplier invoice to
                extract data using OCR
              </p>
              <button
                onClick={handleOpenScanner}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Camera className="h-5 w-5 mr-2" />
                Scan Invoice
              </button>
            </div>
          </div>
        )}

        {processingStep === "processing" && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center py-8">
              <div className="mx-auto rounded-md overflow-hidden mb-6 max-w-sm">
                <img
                  src={scannedImage}
                  alt="Scanned invoice"
                  className="w-full h-auto object-contain max-h-60"
                />
              </div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">
                Processing Invoice...
              </h2>
              <div className="flex items-center justify-center mb-4">
                <div className="w-10 h-10 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-500 mb-2 max-w-md mx-auto">
                Extracting invoice data using OCR. This may take a few moments.
              </p>
            </div>
          </div>
        )}

        {processingStep === "review" && ocrData && (
          <InvoiceOcrReview
            ocrData={ocrData}
            onSubmit={handleReviewSubmit}
            onCancel={handleReviewCancel}
            suppliers={suppliers}
            products={products}
          />
        )}

        {processingStep === "submitting" && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center py-8">
              <div className="mx-auto w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                <Loader className="h-12 w-12 text-indigo-600 animate-spin" />
              </div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">
                Creating Purchase Transaction
              </h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Please wait while we process your purchase transaction...
              </p>
            </div>
          </div>
        )}

        {processingStep === "complete" && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center py-8">
              <div className="mx-auto w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">
                Purchase Complete!
              </h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Your purchase transaction has been successfully created.
                Redirecting to purchase details...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Scanner Modal */}
      {showScanner && (
        <InvoiceScanner
          onCapture={handleImageCapture}
          onClose={handleScannerClose}
        />
      )}
    </div>
  );
};

export default InvoicePurchase;
