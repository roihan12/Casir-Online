import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppProviders from './app/providers';
import AuthProvider from './app/providers/AuthProvider';
import { ProtectedRoute } from '@features/auth';

// Pages
import LoginPage from '@pages/login/LoginPage';
import DashboardPage from '@pages/dashboard/DashboardPage';
import ProductsListPage from '@pages/products/ProductsListPage';
import TransactionsListPage from '@pages/transactions/TransactionsListPage';
import { KasirPosPage } from '@pages/kasir';
import { RolesListPage, RoleFormPage, UsersListPage, UserFormPage } from '@pages/settings';

function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Dashboard */}
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            
            {/* Kasir / POS */}
            <Route path="/kasir/pos" element={
              <ProtectedRoute permissions={['transaksi:create']}><KasirPosPage /></ProtectedRoute>
            } />
            
            {/* Products */}
            <Route path="/produk" element={
              <ProtectedRoute permissions={['produk:read']}><ProductsListPage /></ProtectedRoute>
            } />
            
            {/* Transactions */}
            <Route path="/transaksi" element={
              <ProtectedRoute permissions={['transaksi:read']}><TransactionsListPage /></ProtectedRoute>
            } />
            
            {/* Settings - Pengguna (Users) */}
            <Route path="/settings/pengguna" element={
              <ProtectedRoute permissions={['user:read']}><UsersListPage /></ProtectedRoute>
            } />
            <Route path="/settings/pengguna/tambah" element={
              <ProtectedRoute permissions={['user:create']}><UserFormPage /></ProtectedRoute>
            } />
            <Route path="/settings/pengguna/:id/edit" element={
              <ProtectedRoute permissions={['user:update']}><UserFormPage /></ProtectedRoute>
            } />
            
            {/* Settings - Role & Permissions */}
            <Route path="/settings/role" element={
              <ProtectedRoute permissions={['role:read']}><RolesListPage /></ProtectedRoute>
            } />
            <Route path="/settings/role/tambah" element={
              <ProtectedRoute permissions={['role:create']}><RoleFormPage /></ProtectedRoute>
            } />
            <Route path="/settings/role/:id/edit" element={
              <ProtectedRoute permissions={['role:update']}><RoleFormPage /></ProtectedRoute>
            } />
            
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </AppProviders>
    </BrowserRouter>
  );
}

export default App;
