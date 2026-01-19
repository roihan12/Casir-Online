import { Toaster } from 'react-hot-toast';
import QueryProvider from './QueryProvider';

/**
 * AppProviders - Wraps app with all necessary providers
 * Note: AuthProvider moved to App.jsx since it needs Router context
 */
const AppProviders = ({ children }) => {
  return (
    <QueryProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            borderRadius: '12px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryProvider>
  );
};

export default AppProviders;
