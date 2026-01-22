import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Providers
import { CabangProvider } from "./features/cabang/context/CabangContext";

// Auth Pages
import LoginPage from "./features/auth/pages/LoginPage";
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/pages/ResetPasswordPage";

// Dynamic Layout
import DynamicLayout from "./components/layout/DynamicLayout";

// SuperAdmin Pages
// Dynamic Dashboard (Permission-Based)
import DashboardPage from "./features/dashboard/pages/DashboardPage";
import CabangManagement from "./features/cabang/pages/CabangManagementPage";
import CabangDetail from "./features/cabang/components/CabangDetail";
// import CabangConfig from "./pages/superadmin/CabangConfig";
// import UserManagement from "./pages/superadmin/UserManagement";
// import UserRoles from "./pages/superadmin/UserRoles";
// import ProductMaster from "./pages/superadmin/ProductMaster";
// import ProductCategories from "./pages/superadmin/ProductCategories";
// import ProductRequests from "./pages/superadmin/ProductRequests";
import SupplierManagement from "./pages/superadmin/SupplierManagement";
import SupplierDetail from "./pages/superadmin/SupplierDetail";
import SupplierForm from "./pages/superadmin/SupplierForm";
// import SupplierProducts from "./pages/superadmin/SupplierProducts"; // Not migrating suppliers yet
import SupplierProducts from "./pages/superadmin/SupplierProducts";
import SupplierDebt from "./pages/superadmin/SupplierDebt";
import InventoryManagement from "./features/inventory/pages/InventoryManagementPage";
import InventoryTransfer from "./features/inventory/components/InventoryTransfer";
import InventoryNotifications from "./features/inventory/components/InventoryNotifications";
import GlobalPOS from "./features/transactions/pages/GlobalPOSPage";
import GlobalTransactions from "./features/transactions/pages/GlobalTransactionsPage";
import GlobalTransactionDetail from "./features/transactions/pages/GlobalTransactionDetailPage";
import GlobalReturns from "./features/transactions/pages/GlobalReturnsPage";
import GlobalReturnDetail from "./features/transactions/pages/GlobalReturnDetailPage";
import GlobalReturnCreate from "./features/transactions/pages/GlobalReturnCreatePage";
import InvoiceManagement from "./features/invoices/pages/InvoiceManagementPage";
import InvoiceDetail from "./features/invoices/pages/InvoiceDetailPage";
import InvoiceCreate from "./features/invoices/pages/InvoiceCreatePage";

// Kredit Notifikasi Pages
import KreditNotifikasiPage from "./pages/KreditNotifikasiPage";
import KreditNotifikasiDetailPage from "./pages/KreditNotifikasiDetailPage";
// import GlobalReturns from "./pages/superadmin/GlobalReturns";

// Report Pages
import ReportIndex from "./pages/superadmin/reports/index";
import SalesReport from "./pages/superadmin/reports/SalesReport";
import FinanceReport from "./pages/superadmin/reports/FinanceReport";
import InventoryReport from "./pages/superadmin/reports/InventoryReport";
import BranchReport from "./pages/superadmin/reports/BranchReport";

import PromoManagement from "./features/promos/pages/PromoManagementPage";
import DiscountManagement from "./features/discounts/pages/DiscountManagementPage";
import PromoForm from "./features/promos/components/PromoForm";
import DiscountForm from "./features/discounts/components/DiscountForm";
import TaxSettings from "./features/settings/pages/TaxSettingsPage";
import ReceiptSettings from "./features/settings/pages/ReceiptSettingsPage";
import NotificationSettings from "./features/settings/pages/NotificationSettingsPage";
import AuditLog from "./features/audit/pages/AuditLogPage";
import CustomerManagement from "./pages/superadmin/CustomerManagement";
import CustomerDetail from "./pages/superadmin/CustomerDetail";
import CustomerForm from "./pages/superadmin/CustomerForm";
import CustomerSegmentation from "./pages/superadmin/CustomerSegmentation";
import LoyaltyProgram from "./features/loyalty/pages/LoyaltyProgramPage";

// AdminCabang Pages
// import AdminCabangDashboard from "./pages/admincabang/AdminCabangDashboard";
// import BranchProducts from "./pages/admincabang/BranchProducts";
// import BranchProductRequests from "./pages/admincabang/BranchProductRequests";
// import CustomerManagement from "./pages/admincabang/CustomerManagement";
// import CustomerLoyalty from "./pages/admincabang/CustomerLoyalty";
// import ShiftManagement from "./pages/admincabang/ShiftManagement";
// import ShiftReports from "./pages/admincabang/ShiftReports";
// import BranchPOS from "./pages/admincabang/BranchPOS";
// import BranchTransactions from "./pages/admincabang/BranchTransactions";
// import BranchReturns from "./pages/admincabang/BranchReturns";
// import BranchSalesReports from "./pages/admincabang/BranchSalesReports";
// import BranchInventoryReports from "./pages/admincabang/BranchInventoryReports";
// import BranchPaymentReports from "./pages/admincabang/BranchPaymentReports";
// import BranchSuppliers from "./pages/admincabang/BranchSuppliers";
// import BranchSupplierOrders from "./pages/admincabang/BranchSupplierOrders";
// import BranchInventoryNotifications from "./pages/admincabang/BranchInventoryNotifications";
// import BranchInventoryAdjustment from "./pages/admincabang/BranchInventoryAdjustment";
// import BranchTaxSettings from "./pages/admincabang/BranchTaxSettings";
// import BranchReceiptSettings from "./pages/admincabang/BranchReceiptSettings";

// Kasir Pages
// import KasirDashboard from "./pages/kasir/KasirDashboard";
import PointOfSale from "./pages/kasir/PointOfSale";
// import KasirCustomers from "./pages/kasir/KasirCustomers";
// import AddCustomer from "./pages/kasir/AddCustomer";
// import OpenShift from "./pages/kasir/OpenShift";
// import CloseShift from "./pages/kasir/CloseShift";
// import KasirTransactions from "./pages/kasir/KasirTransactions";
// import KasirPromos from "./pages/kasir/KasirPromos";
// import KasirReturns from "./pages/kasir/KasirReturns";
// import KasirStock from "./pages/kasir/KasirStock";

// Other Components
import NotFoundPage from "./pages/notfound/NotFoundPage";
import SearchResults from "./pages/SearchResults";
import NoAccessPage from "./pages/NoAccessPage";

// Route Protection Components
import ProtectedRoute from "./routes/ProtectedRoute";
import WithoutAuth from "./routes/WithoutAuth";
import { UserManagementPage as UserManagement } from "./features/users";
import UserDetail from "./features/users/pages/UserDetailPage";
import UserRoles from "./features/users/pages/UserRolesPage";
import { ProductManagementPage as ProductManagement } from "./features/products";
import { CategoryManagementPage as CategoryManagement } from "./features/categories";
import ProductRequestManagement from "./features/products/pages/ProductRequestManagementPage";

// Admin Cabang Shift Management Pages
import ShiftManagement from "./pages/admincabang/ShiftManagement";
import ShiftReports from "./pages/admincabang/ShiftReports";
import ShiftDetail from "./pages/admincabang/ShiftDetail";
import ShiftForm from "./pages/admincabang/ShiftForm";

// Profile and Settings Pages
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";

// Add new imports for ProductMaster components
import ProductMasterList from "./features/products/pages/ProductMasterListPage";
import ProductMasterCreateEdit from "./features/products/pages/ProductMasterCreateEditPage";
import ProductMasterDetail from "./features/products/pages/ProductMasterDetailPage";
import ProductCreate from "./features/products/pages/ProductCreatePage";

// Add the import at the top of the file
import StockTransferApprovalList from "./features/stock-transfers/components/StockTransferApprovalList";

import InventoryMovements from "./features/inventory/components/InventoryMovements";
import InventoryDashboard from "./features/inventory/pages/InventoryDashboardPage";
import BatchManagement from "./features/inventory/pages/BatchManagementPage";
import StockOpname from "./features/inventory/components/StockOpname";
import PriceManagement from "./features/products/pages/PriceManagementPage";
import PurchaseCreate from "./features/purchases/pages/PurchaseCreatePage";
import PurchaseDetail from "./features/purchases/pages/PurchaseDetailPage";

function App() {
  return (
      <CabangProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#333",
              color: "#fff",
            },
            success: {
              style: {
                background: "#22c55e",
              },
            },
            error: {
              style: {
                background: "#ef4444",
              },
              duration: 4000,
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <WithoutAuth>
                <LoginPage />
              </WithoutAuth>
            }
          />
          <Route
            path="/forgot-password"
            element={<WithoutAuth>{/* <ForgotPasswordPage /> */}</WithoutAuth>}
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Search Results - accessible to all logged in users */}
          <Route
            path="/search"
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin_cabang", "kasir"]}
              >
                <SearchResults />
              </ProtectedRoute>
            }
          />

          {/* Profile and Settings Pages - accessible to all logged in users */}
          {/* <Route
            path="/profile"
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin_cabang", "kasir"]}
              >
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin_cabang", "kasir"]}
              >
                <SettingsPage />
              </ProtectedRoute>
            }
          /> */}

          {/* No Access Page - for users without required permissions */}
          <Route
            path="/no-access"
            element={
              <ProtectedRoute>
                <NoAccessPage />
              </ProtectedRoute>
            }
          />

          {/* Main Application Routes with Dynamic Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredPermission="dashboard:read" redirectPath="/no-access">
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
          </Route>

          {/* Profile and Settings */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "admin_cabang", "kasir", "manajer", "gudang", "staff"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProfilePage />} />
          </Route>

          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "admin_cabang", "kasir", "manajer", "gudang"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route path="account" element={<SettingsPage />} />
            <Route path="tax" element={<TaxSettings />} />
            <Route path="receipt" element={<ReceiptSettings />} />
            <Route path="notifications" element={<NotificationSettings />} />
            <Route path="audit" element={<AuditLog />} />
            <Route index element={<Navigate to="/settings/account" replace />} />
          </Route>

          {/* Cabang Management */}
          <Route
            path="/cabang"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CabangManagement />} />
            <Route path=":id" element={<CabangDetail />} />
          </Route>

          {/* User Management */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<UserManagement />} />
            <Route path=":id" element={<UserDetail />} />
            <Route path="roles" element={<UserRoles />} />
          </Route>

          {/* Product Management */}
          <Route
            path="/produk"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "admin_cabang", "manajer", "gudang"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProductManagement />} />
            <Route path="create" element={<ProductCreate />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="requests" element={<ProductRequestManagement />} />
          </Route>

          {/* Product Master Management */}
          <Route
            path="/product-master"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProductMasterList />} />
            <Route path="create" element={<ProductMasterCreateEdit />} />
            <Route path="edit/:id" element={<ProductMasterCreateEdit />} />
            <Route path="view/:id" element={<ProductMasterDetail />} />
          </Route>

          {/* Supplier Management */}
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "admin_cabang", "manajer", "gudang"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SupplierManagement />} />
            <Route path="create" element={<SupplierForm />} />
            <Route path="products" element={<SupplierProducts />} />
            <Route path="debt" element={<SupplierDebt />} />
            <Route path=":id" element={<SupplierDetail />} />
            <Route path=":id/edit" element={<SupplierForm />} />
            <Route path=":id/purchase/create" element={<PurchaseCreate />} />
          </Route>

          {/* Purchase Routes */}
          <Route
            path="/purchases"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "admin_cabang", "manajer"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route path="create" element={<PurchaseCreate />} />
            <Route path=":id" element={<PurchaseDetail />} />
          </Route>

          {/* Customer Management */}
          <Route
            path="/customers"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "admin_cabang", "kasir", "manajer"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CustomerManagement />} />
            <Route path="create" element={<CustomerForm />} />
            <Route path=":id" element={<CustomerDetail />} />
            <Route path="edit/:id" element={<CustomerForm />} />
            <Route path="segments" element={<CustomerSegmentation />} />
            <Route path="loyalty" element={<LoyaltyProgram />} />
          </Route>

          {/* Inventory Management */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "admin_cabang", "gudang"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<InventoryManagement />} />
            <Route path="transfer" element={<InventoryTransfer />} />
            <Route path="notifications" element={<InventoryNotifications />} />
            <Route path="movements" element={<InventoryMovements />} />
            <Route path="opname" element={<StockOpname />} />
            <Route path="batch" element={<BatchManagement />} />
            <Route path="dashboard" element={<InventoryDashboard />} />
            <Route path="price" element={<PriceManagement />} />
          </Route>

          {/* Point of Sale */}
          <Route
            path="/pos"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "admin_cabang", "kasir"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PointOfSale />} />
          </Route>

          {/* Transactions */}
          <Route
            path="/transactions"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "admin_cabang", "kasir"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<GlobalTransactions />} />
            <Route path=":id" element={<GlobalTransactionDetail />} />
            <Route path="returns" element={<GlobalReturns />} />
            <Route path="returns/:id" element={<GlobalReturnDetail />} />
          </Route>

          {/* Invoices */}
          <Route
            path="/invoices"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "admin_cabang"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<InvoiceManagement />} />
            <Route path="create" element={<InvoiceCreate />} />
            <Route path=":id" element={<InvoiceDetail />} />
          </Route>

          {/* Kredit Notifikasi */}
          <Route
            path="/kredit-notifikasi"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "admin_cabang"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<KreditNotifikasiPage />} />
            <Route path=":id" element={<KreditNotifikasiDetailPage />} />
          </Route>

          {/* Reports */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "admin_cabang", "manajer"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ReportIndex />} />
            <Route path="sales" element={<SalesReport />} />
            <Route path="finance" element={<FinanceReport />} />
            <Route path="inventory" element={<InventoryReport />} />
            <Route path="branch" element={<BranchReport />} />
          </Route>

          {/* Promo & Diskon */}
          <Route
            path="/promos"
            element={
              <ProtectedRoute allowedRoles={["super_admin", "admin_cabang", "manajer"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PromoManagement />} />
            <Route path="create" element={<PromoForm />} />
            <Route path="edit/:id" element={<PromoForm />} />
            <Route path="discounts" element={<DiscountManagement />} />
            <Route path="discounts/create" element={<DiscountForm />} />
            <Route path="discounts/edit/:id" element={<DiscountForm />} />
          </Route>

          {/* Stock Transfer Approval */}
          <Route
            path="/stock-transfer-approval"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StockTransferApprovalList />} />
          </Route>

          {/* Shift Management */}
          <Route
            path="/shifts"
            element={
              <ProtectedRoute allowedRoles={["admin_cabang", "kasir"]}>
                <DynamicLayout />
              </ProtectedRoute>
            }
          >
            <Route path="active" element={<ShiftManagement />} />
            <Route path="reports" element={<ShiftReports />} />
            <Route path="detail/:id" element={<ShiftDetail />} />
            <Route path="open" element={<ShiftForm />} />
            <Route path="close/:id" element={<ShiftForm />} />
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </CabangProvider>
  );
}

export default App;
