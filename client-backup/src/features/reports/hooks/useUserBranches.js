import { useState } from 'react';
import useAuthStore from '@app/store/useAuthStore';
import { useCabang } from '@features/cabang/hooks/useCabang';

const STORAGE_KEY_PREFIX = 'report_branch_filter_';

/**
 * Hook for managing branch selection in reports
 * Handles user permissions, localStorage preferences, and multi-select state
 * @param {string} reportType - Type of report for localStorage key uniqueness
 * @returns {Object} Branch selection state and helpers
 */
export const useUserBranches = (reportType) => {
  const getUserCabang = useAuthStore(state => state.getUserCabang);
  const isSuperAdmin = useAuthStore(state => state.isSuperAdmin);
  const { allCabang } = useCabang();

  console.log("allCabang", allCabang);
  
  const userCabang = getUserCabang();
  const hasSingleBranch = userCabang.length === 1;
  
  // Determine available branches based on role
  const availableBranches = userCabang;
  
  // Load saved preference from localStorage
  const getSavedPreference = () => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${reportType}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that saved branches are still accessible
        const validBranchIds = availableBranches.map(b => b.id);
        const validSavedBranches = parsed.filter(id => validBranchIds.includes(id));
        
        // Only return if we have valid saved branches
        if (validSavedBranches.length > 0) {
          return validSavedBranches;
        }
      }
    } catch (error) {
      console.error('Failed to load branch preference:', error);
    }
    return null;
  };
  
  // Default filter logic
  const getDefaultFilter = () => {
    // Check saved preference first
    const savedPref = getSavedPreference();
    if (savedPref && savedPref.length > 0) {
      return savedPref;
    }
    
    // Fallback to all user branches
    return availableBranches.map(c => c.id);
  };
  
  const [selectedBranches, setSelectedBranches] = useState(getDefaultFilter);
  
  // Save preference to localStorage when selection changes
  const savePreference = (branchIds) => {
    try {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${reportType}`, 
        JSON.stringify(branchIds)
      );
    } catch (error) {
      console.error('Failed to save branch preference:', error);
    }
  };
  
  const updateSelectedBranches = (branchIds) => {
    // Ensure at least one branch is selected
    if (branchIds.length === 0) {
      console.warn('At least one branch must be selected');
      return;
    }
    
    setSelectedBranches(branchIds);
    savePreference(branchIds);
  };
  
  // Format for API call (comma-separated string or 'all')
  const cabangFilterParam = selectedBranches.length === availableBranches.length && !hasSingleBranch
    ? 'all'
    : selectedBranches.join(',');
  
  return {
    availableBranches,
    selectedBranches,
    setSelectedBranches: updateSelectedBranches,
    cabangFilterParam,
    hasSingleBranch,
    isDisabled: hasSingleBranch,
  };
};
