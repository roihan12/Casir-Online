import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppProviders from './app/providers';
import { ProtectedRoute } from '@features/auth';

// Pages
import LoginPage from '@pages/login/LoginPage';
import DashboardPage from '@pages/dashboard/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          
          {/* Example: Route with permission requirement */}
          {/*
          <Route
            path="/transaksi"
            element={
              <ProtectedRoute 
                permissions={['transaksi:read']} 
                requireBranch={true}
              >
                <TransaksiPage />
              </ProtectedRoute>
            }
          />
          */}
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProviders>
    </BrowserRouter>
  );
}

export default App;
