import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as authApi from '@features/auth/services/authService';
import { getDefaultRedirect } from '@common/utils/getDefaultRedirect';

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
            return { 
              success: true, 
              redirectTo: getDefaultRedirect(response.data.user.permissions || [])
            };
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
          const response = await authApi.checkAuth();

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

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      clearError: () => set({ error: null }),

      // Permission Helpers
      hasPermission: (permission) => {
        const { user } = get();
        if (!user?.permissions) return false;
        // Super admin bypass
        const isSuperAdmin = user.roles?.some(r => r.namaRole === 'super_admin');
        if (isSuperAdmin) return true;
        return user.permissions.includes(permission);
      },

      hasAnyPermission: (permissions) => {
        const { user } = get();
        if (!user?.permissions) return false;
        // Super admin bypass
        const isSuperAdmin = user.roles?.some(r => r.namaRole === 'super_admin');
        if (isSuperAdmin) return true;
        return permissions.some(p => user.permissions.includes(p));
      },

      hasAllPermissions: (permissions) => {
        const { user } = get();
        if (!user?.permissions) return false;
        // Super admin bypass
        const isSuperAdmin = user.roles?.some(r => r.namaRole === 'super_admin');
        if (isSuperAdmin) return true;
        return permissions.every(p => user.permissions.includes(p));
      },

      isSuperAdmin: () => {
        const { user } = get();
        if (!user?.roles) return false;
        return user.roles.some(r => r.namaRole === 'super_admin');
      },

      getUserRole: () => {
        const { user } = get();
        return (
          user?.userRoles?.[0]?.role?.namaRole ||
          user?.roles?.[0]?.namaRole ||
          user?.role ||
          null
        );
      },

      getPrimaryCabang: () => {
        const { user } = get();
        if (!user?.cabang?.length) return null;
        const primaryCabang = user.cabang.find((c) => c.isPrimary);
        return primaryCabang || user.cabang[0];
      },

      getUserCabang: () => {
        const { user } = get();
        return user?.cabang || [];
      },

      getDefaultRedirect: () => {
        const { user } = get();
        return getDefaultRedirect(user?.permissions || []);
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
