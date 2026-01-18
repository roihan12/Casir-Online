import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Branch Store - Manages active branch selection for multi-cabang
 */
const useBranchStore = create(
  persist(
    (set, get) => ({
      // State
      activeBranch: null,      // Currently selected branch
      availableBranches: [],   // Branches user can access

      // Actions
      setActiveBranch: (branch) => {
        set({ activeBranch: branch });
      },

      setAvailableBranches: (branches) => {
        set({ availableBranches: branches });
        
        // Auto-select primary branch if no active branch
        const { activeBranch } = get();
        if (!activeBranch && branches.length > 0) {
          const primaryBranch = branches.find(b => b.isPrimary) || branches[0];
          set({ activeBranch: primaryBranch });
        }
      },

      switchBranch: (cabangId) => {
        const { availableBranches } = get();
        const branch = availableBranches.find(b => b.cabangId === cabangId);
        if (branch) {
          set({ activeBranch: branch });
          return true;
        }
        return false;
      },

      canAccessBranch: (cabangId) => {
        const { availableBranches } = get();
        return availableBranches.some(b => b.cabangId === cabangId);
      },

      clearBranch: () => {
        set({ activeBranch: null, availableBranches: [] });
      },

      // Sync with user data (called after login)
      syncWithUser: (user) => {
        if (user?.cabang) {
          set({ availableBranches: user.cabang });
          
          // Set primary or first branch as active if not set
          const { activeBranch } = get();
          if (!activeBranch) {
            const primaryBranch = user.cabang.find(b => b.isPrimary) || user.cabang[0];
            if (primaryBranch) {
              set({ activeBranch: primaryBranch });
            }
          }
        }
      },
    }),
    {
      name: 'branch-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        activeBranch: state.activeBranch,
      }),
    }
  )
);

export default useBranchStore;
