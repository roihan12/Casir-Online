// features/auth - Public API
// Re-export all auth-related modules for clean imports

// Context & Provider
export { AuthProvider, useAuth } from './context/AuthContext';

// Hooks
export { useLogin } from './hooks/useLogin';

// Components
export { default as LoginForm } from './components/LoginForm';
export { default as AuthHeader } from './components/AuthHeader';
export { default as AuthFooter } from './components/AuthFooter';

// Pages
export { default as LoginPage } from './pages/LoginPage';
export { default as ForgotPasswordPage } from './pages/ForgotPasswordPage';
export { default as ResetPasswordPage } from './pages/ResetPasswordPage';
