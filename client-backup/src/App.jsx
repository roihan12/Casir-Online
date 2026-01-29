import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Providers
import { CabangProvider } from "./features/cabang/context/CabangContext";
import { POSProvider } from "./features/pos";

// Auth Pages
import LoginPage from "./features/auth/pages/LoginPage";
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/pages/ResetPasswordPage";

// Dynamic Layout
import DynamicLayout from "./common/components/layout/DynamicLayout";

import DashboardPage from "./features/dashboard/pages/DashboardPage";
import CabangManagement from "./features/cabang/pages/CabangManagementPage";
import CabangDetail from "./features/cabang/components/CabangDetail";
import SupplierManagement from "./features/suppliers/pages/SupplierManagementPage";
import SupplierDetail from "./features/suppliers/pages/SupplierDetail";
import SupplierForm from "./features/suppliers/components/SupplierForm";
import SupplierProducts from "./features/suppliers/pages/SupplierProducts";
import SupplierDebt from "./features/suppliers/pages/SupplierDebt";
import InventoryManagement from "./features/inventory/pages/InventoryManagementPage";
import InventoryTransfer from "./features/inventory/components/InventoryTransfer";
import InventoryNotifications from "./features/inventory/components/InventoryNotifications";
// import GlobalPOS from "./features/transactions/pages/GlobalPOSPage";
import GlobalTransactions from "./features/transactions/pages/GlobalTransactionsPage";
import GlobalTransactionDetail from "./features/transactions/pages/GlobalTransactionDetailPage";
import GlobalReturns from "./features/transactions/pages/GlobalReturnsPage";
import GlobalReturnDetail from "./features/transactions/pages/GlobalReturnDetailPage";
import GlobalReturnCreate from "./features/transactions/pages/GlobalReturnCreatePage";
import InvoiceManagement from "./features/invoices/pages/InvoiceManagementPage";
import InvoiceDetail from "./features/invoices/pages/InvoiceDetailPage";
import InvoiceCreate from "./features/invoices/pages/InvoiceCreatePage";
import KreditNotifikasiPage from "@features/credit/pages/KreditNotifikasiPage";
import KreditNotifikasiDetailPage from "@features/credit/pages/KreditNotifikasiDetailPage";
import ReportIndex from "@features/reports/pages/index";
import SalesReport from "@features/reports/pages/SalesReport";
import FinanceReport from "@features/reports/pages/FinanceReport";
import InventoryReport from "@features/reports/pages/InventoryReport";
import BranchReport from "@features/reports/pages/BranchReport";
import PromoManagement from "./features/promos/pages/PromoManagementPage";
import DiscountManagement from "./features/discounts/pages/DiscountManagementPage";
import PromoForm from "./features/promos/components/PromoForm";
import DiscountForm from "./features/discounts/components/DiscountForm";
import TaxSettings from "./features/settings/pages/TaxSettingsPage";
import ReceiptSettings from "./features/settings/pages/ReceiptSettingsPage";
import NotificationSettings from "./features/settings/pages/NotificationSettingsPage";
import MenuManagementPage from "./features/settings/pages/MenuManagementPage";
import AuditLog from "./features/audit/pages/AuditLogPage";
import CustomerManagement from "./features/customers/pages/CustomerManagementPage";
import CustomerDetail from "./features/customers/pages/CustomerDetail";
import CustomerForm from "./features/customers/components/CustomerForm";
import CustomerSegmentation from "./features/customers/pages/CustomerSegmentation";
import LoyaltyProgram from "./features/loyalty/pages/LoyaltyProgramPage";
import HutangManagementPage from "./features/hutang/pages/HutangManagementPage";
import HutangDetailPage from "./features/hutang/pages/HutangDetailPage";

// Other Components
import NotFoundPage from "./features/common/pages/NotFoundPage";
import SearchResults from "./features/common/pages/SearchResults";
import NoAccessPage from "./features/auth/pages/NoAccessPage";

// Route Protection Components
import ProtectedRoute from "./app/router/ProtectedRoute";
import WithoutAuth from "./app/router/WithoutAuth";
import { UserManagementPage as UserManagement } from "./features/users";
import UserDetail from "./features/users/pages/UserDetailPage";
import RoleManagement from "./features/users/pages/RoleManagementPage";
import PermissionsPage from "./features/users/pages/PermissionsPage";
import { ProductManagementPage as ProductManagement } from "./features/products";
import { CategoryManagementPage as CategoryManagement } from "./features/categories";
import ProductRequestManagement from "./features/products/pages/ProductRequestManagementPage";

import ShiftManagement from "./features/shifts/pages/ShiftManagement";
import ShiftReports from "./features/shifts/components/ShiftReports";
import ShiftDetail from "./features/shifts/components/ShiftDetail";
import ShiftForm from "./features/shifts/components/ShiftForm";

// Profile and Settings Pages
import ProfilePage from "./features/settings/pages/ProfilePage";
import SettingsPage from "./features/settings/pages/SettingsPage";

// Add new imports for ProductMaster components
import ProductMasterList from "./features/products/pages/ProductMasterListPage";
import ProductMasterCreateEdit from "./features/products/pages/ProductMasterCreateEditPage";
import ProductMasterDetail from "./features/products/pages/ProductMasterDetailPage";
import ProductCreate from "./features/products/pages/ProductCreatePage";
import ProductDetail from "./features/products/pages/ProductDetailPage";
import ProductEdit from "./features/products/pages/ProductEditPage";

// Add the import at the top of the file
import StockTransferApprovalList from "./features/stock-transfers/components/StockTransferApprovalList";

import InventoryMovements from "./features/inventory/components/InventoryMovements";
import InventoryDashboard from "./features/inventory/pages/InventoryDashboardPage";
import BatchManagement from "./features/inventory/pages/BatchManagementPage";
import StockOpname from "./features/inventory/components/StockOpname";
import PriceManagement from "./features/products/pages/PriceManagementPage";
import PurchaseCreate from "./features/purchases/pages/PurchaseCreatePage";
import PurchaseDetail from "./features/purchases/pages/PurchaseDetailPage";

import { ToastProvider } from "./app/providers/ToastContext";
import POSPage from "./features/pos/pages/POSPage";

function App() {
  return (
    <CabangProvider>
      <POSProvider>
        <ToastProvider>
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
              element={
                <WithoutAuth>{/* <ForgotPasswordPage /> */}</WithoutAuth>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Search Results - accessible to all logged in users */}
            <Route
              path="/search"
              element={
                <ProtectedRoute>
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
                <ProtectedRoute
                  requiredPermission="dashboard:read"
                  redirectPath="/no-access"
                >
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
                <ProtectedRoute>
                  <DynamicLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ProfilePage />} />
            </Route>

            <Route
              path="/settings"
              element={
                <ProtectedRoute requiredPermission="settings:read">
                  <DynamicLayout />
                </ProtectedRoute>
              }
            >
              <Route path="account" element={<SettingsPage />} />
              <Route path="tax" element={<TaxSettings />} />
              <Route path="receipt" element={<ReceiptSettings />} />
              <Route path="notifications" element={<NotificationSettings />} />
              <Route path="menus" element={<MenuManagementPage />} />
              <Route path="audit" element={<AuditLog />} />
              <Route
                index
                element={<Navigate to="/settings/account" replace />}
              />
            </Route>

            {/* Cabang Management */}
            <Route
              path="/cabang"
              element={
                <ProtectedRoute requiredPermission="cabang:read">
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
                <ProtectedRoute requiredPermission="user:read">
                  <DynamicLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<UserManagement />} />
              <Route path=":id" element={<UserDetail />} />
              <Route path="roles" element={<RoleManagement />} />
              <Route path="permissions" element={<PermissionsPage />} />
            </Route>

            {/* Product Management */}
            <Route
              path="/products"
              element={
                <ProtectedRoute requiredPermission="produk:read">
                  <DynamicLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ProductManagement />} />
              <Route path="create" element={<ProductCreate />} />
              <Route path="edit/:id" element={<ProductEdit />} />
              <Route path=":id" element={<ProductDetail />} />
              <Route path="categories" element={<CategoryManagement />} />
              <Route path="requests" element={<ProductRequestManagement />} />
            </Route>

            {/* Product Master Management */}
            <Route
              path="/product-master"
              element={
                <ProtectedRoute requiredPermission="produk:read">
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
                <ProtectedRoute requiredPermission="supplier:read">
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
                <ProtectedRoute requiredPermission="pembelian:read">
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
                <ProtectedRoute requiredPermission="pelanggan:read">
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
                <ProtectedRoute requiredPermission="inventory:read">
                  <DynamicLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<InventoryManagement />} />
              <Route path="transfer" element={<InventoryTransfer />} />
              <Route
                path="notifications"
                element={<InventoryNotifications />}
              />
              <Route path="movements" element={<InventoryMovements />} />
              <Route path="opname" element={<StockOpname />} />
              <Route path="batch" element={<BatchManagement />} />
              <Route path="dashboard" element={<InventoryDashboard />} />
              <Route path="price" element={<PriceManagement />} />
            </Route>

            {/* Point of Sale */}
            <Route
              path="/kasir/pos"
              element={
                <ProtectedRoute requiredPermission="pos:read">
                  <DynamicLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<POSPage />} />
            </Route>

            {/* Transactions */}
            <Route
              path="/transactions"
              element={
                <ProtectedRoute requiredPermission="transaksi:read">
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
                <ProtectedRoute requiredPermission="invoice:read">
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
                <ProtectedRoute requiredPermission="kredit_notification:read">
                  <DynamicLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<KreditNotifikasiPage />} />
              <Route path=":id" element={<KreditNotifikasiDetailPage />} />
            </Route>

            {/* Hutang Management */}
            <Route
              path="/hutang"
              element={
                <ProtectedRoute requiredPermission="hutang:read">
                  <DynamicLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HutangManagementPage />} />
              <Route path=":id" element={<HutangDetailPage />} />
            </Route>

            {/* Reports */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute requiredPermission="laporan:read">
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
                <ProtectedRoute requiredPermission="promo:read">
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
                <ProtectedRoute requiredPermission="stock_transfer:manage">
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
                <ProtectedRoute requiredPermission="shift:read">
                  <DynamicLayout />
                </ProtectedRoute>
              }
            >
              <Route path="active" element={<ShiftManagement />} />
              <Route path="reports" element={<ShiftReports />} />
              <Route path="detail/:id" element={<ShiftDetail />} />
              <Route path="open" element={<ShiftForm />} />
              <Route path="close/:id" element={<ShiftForm />} />
              <Route path="adjust/:id" element={<ShiftForm />} />
            </Route>

            {/* 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </POSProvider>
    </CabangProvider>
  );
}

export default App;
