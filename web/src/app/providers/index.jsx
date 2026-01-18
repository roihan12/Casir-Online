import { Toaster } from 'react-hot-toast';

import QueryProvider from './QueryProvider';
import AuthProvider from './AuthProvider';

/**
 * AppProviders - Wraps app with all necessary providers
 */
const AppProviders = ({ children }) => {
  return (
    <QueryProvider>
      <AuthProvider>
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
      </AuthProvider>
    </QueryProvider>
  );
};

export default AppProviders;
