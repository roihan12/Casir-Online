import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import authApi from '@shared/api/authApi';

/**
 * Auth Store - Manages user authentication state
 * Uses Zustand with persistence to localStorage
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(username, password);
          
          if (response.success && response.data?.user) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { success: true };
          } else {
            throw new Error(response.message || 'Login gagal');
          }
        } catch (error) {
          const message = error.response?.data?.message || error.message || 'Login gagal';
          set({ 
            isLoading: false, 
            error: message,
            isAuthenticated: false,
            user: null,
          });
          return { success: false, error: message };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch (error) {
          // Continue with local logout even if API call fails
          console.error('Logout API error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const response = await authApi.getProfile();
          
          if (response.success && response.data?.user) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          } else {
            throw new Error('Not authenticated');
          }
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return false;
        }
      },

      clearError: () => set({ error: null }),

      // Permission Helpers
      hasPermission: (permission) => {
        const { user } = get();
        if (!user?.permissions) return false;
        return user.permissions.includes(permission);
      },

      hasAnyPermission: (permissions) => {
        const { user } = get();
        if (!user?.permissions) return false;
        return permissions.some(p => user.permissions.includes(p));
      },

      hasAllPermissions: (permissions) => {
        const { user } = get();
        if (!user?.permissions) return false;
        return permissions.every(p => user.permissions.includes(p));
      },

      isSuperAdmin: () => {
        const { user } = get();
        if (!user?.roles) return false;
        return user.roles.some(r => r.namaRole === 'super_admin');
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export default useAuthStore;
