import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package,
  FileText,
  User,
  DollarSign,
  AlertTriangle,
  History,
} from "lucide-react";
import ConfirmationDialog from "@features/common/ConfirmationDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@common/components/ui/tabs";
import Spinner from "@features/common/Spinner";
import {
  useDeleteSupplier,
  useChangeSupplierStatus,
} from "../hooks/useSupplierQueries";
import { useSupplierPurchase } from "../hooks/useSupplierPurchase";
import SupplierHeader from "../components/SupplierDetail/SupplierHeader";
import SupplierInfoTab from "../components/SupplierDetail/SupplierInfoTab";
import SupplierProductsTab from "../components/SupplierDetail/SupplierProductsTab";
import SupplierTransactionsTab from "../components/SupplierDetail/SupplierTransactionsTab";
import SupplierPriceHistoryTab from "../components/SupplierDetail/SupplierPriceHistoryTab";

const SupplierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Setup query hooks using the integrated useSupplierPurchase hook
  const {
    supplier,
    products,
    purchaseHistory,
    selectedBranchId,
    priceHistory,
    setSelectedBranchId,
    branches,
    isLoadingSupplier,
    isLoadingPriceHistory,
    priceHistoryPagination,
    goToNextPriceHistoryPage,
    goToPreviousPriceHistoryPage,
    isLoadingProducts,
    isLoadingHistory,
    supplierError,
    productsError,
  } = useSupplierPurchase(id);


  // Mutations for actions
  const deleteSupplierMutation = useDeleteSupplier();
  const changeStatusMutation = useChangeSupplierStatus();

  // States for modals and actions
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  // Search and filter states for products
  const [productSearch, setProductSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    field: "namaProduk",
    order: "asc",
  });

  // Auto-select branch when branches load
  useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranchId) {
      // Auto-select first branch
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId, setSelectedBranchId]);

  // Handle delete supplier
  const handleDeleteSupplier = async () => {
    deleteSupplierMutation.mutate(id, {
      onSuccess: () => {
        navigate("/suppliers");
      },
    });
    setShowDeleteModal(false);
  };

  // Handle change supplier status
  const handleChangeStatus = async () => {
    changeStatusMutation.mutate({ id, status: newStatus });
    setShowStatusModal(false);
  };

  // Open status change modal
  const openStatusChangeModal = (status) => {
    setNewStatus(status);
    setShowStatusModal(true);
  };

  // Navigation helpers
  const navigateToProducts = () =>
    navigate(
      `/suppliers/products?supplierId=${id}&supplierName=${supplier?.namaSupplier}`
    );
  const navigateToDebt = () =>
    navigate(
      `/suppliers/debt?supplierId=${id}&supplierName=${supplier?.namaSupplier}&cabangId=${supplier?.cabang_id || ""}`
    );

  // Handle product sort
  const handleSort = (field) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  // Only show loading for initial supplier data
  if (isLoadingSupplier) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (supplierError || !supplier) {
    return (
      <div className="mx-6 mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center border border-red-200">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span>{supplierError?.message || "Data supplier tidak ditemukan"}</span>
        <button 
          onClick={() => navigate("/suppliers")}
          className="ml-auto underline text-sm hover:text-red-900"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Header with navigation */}
      <SupplierHeader
        supplier={supplier}
        onNavigateToProducts={navigateToProducts}
        onNavigateToDebt={navigateToDebt}
        onStatusChange={openStatusChangeModal}
        onDelete={() => setShowDeleteModal(true)}
        onEdit={() => navigate(`/suppliers/${id}/edit`)}
      />

      <div className="mx-6 mt-6">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="bg-white p-1 rounded-lg border border-gray-200 mb-6 flex-wrap h-auto">
            <TabsTrigger value="info" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200">
              <User size={16} className="mr-2" />
              Informasi Supplier
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200">
              <Package size={16} className="mr-2" />
              Produk
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200">
              <FileText size={16} className="mr-2" />
              Transaksi
            </TabsTrigger>
            <TabsTrigger value="debt" onClick={navigateToDebt} className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200">
              <DollarSign size={16} className="mr-2" />
              Hutang
            </TabsTrigger>
             <TabsTrigger value="history" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200">
              <History size={16} className="mr-2" />
              Riwayat Harga
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-0">
            <SupplierInfoTab supplier={supplier} branches={branches} />
          </TabsContent>

          <TabsContent value="products" className="mt-0">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <SupplierProductsTab
                products={products}
                isLoading={isLoadingProducts}
                error={productsError}
                selectedBranchId={selectedBranchId}
                branches={branches}
                onBranchChange={setSelectedBranchId}
                productSearch={productSearch}
                onSearchChange={setProductSearch}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortConfig={sortConfig}
                onSort={handleSort}
                supplierId={id}
                supplierName={supplier?.namaSupplier}
                />
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="mt-0">
             <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <SupplierTransactionsTab
                transactions={purchaseHistory}
                isLoading={isLoadingHistory}
                selectedBranchId={selectedBranchId}
                branches={branches}
                onBranchChange={setSelectedBranchId}
                supplierId={id}
                />
             </div>
          </TabsContent>
          
           <TabsContent value="history" className="mt-0">
             <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <SupplierPriceHistoryTab 
                  priceHistory={priceHistory}
                  isLoading={isLoadingPriceHistory}
                  selectedBranchId={selectedBranchId}
                  branches={branches}
                  onBranchChange={setSelectedBranchId}
                  pagination={priceHistoryPagination}
                  onNextPage={goToNextPriceHistoryPage}
                  onPrevPage={goToPreviousPriceHistoryPage}
                />
             </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteSupplier}
        title="Hapus Supplier"
        message={`Apakah Anda yakin ingin menghapus supplier "${supplier.namaSupplier}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />

      {/* Status Change Confirmation Modal */}
      <ConfirmationDialog
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleChangeStatus}
        title={
          newStatus === "aktif" ? "Aktifkan Supplier" : "Nonaktifkan Supplier"
        }
        message={`Apakah Anda yakin ingin ${
          newStatus === "aktif" ? "mengaktifkan" : "menonaktifkan"
        } supplier "${supplier.namaSupplier}"?`}
        confirmText={newStatus === "aktif" ? "Aktifkan" : "Nonaktifkan"}
        cancelText="Batal"
        variant={newStatus === "aktif" ? "primary" : "warning"}
      />
    </div>
  );
};

export default SupplierDetail;
