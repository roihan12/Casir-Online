import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/hooks/useAuth";

/**
 * CabangContext - Context untuk manajemen cabang
 * 
 * Fitur:
 * 1. Mendukung multiple cabang per user (dari login response)
 * 2. Menggunakan localStorage untuk persistensi
 * 3. Integrasi dengan React Query untuk invalidasi cache
 * 4. Mendukung Global View untuk super_admin
 */

export const CabangContext = createContext();

// Konstanta untuk cabang global
export const GLOBAL_CABANG_ID = "global";

export const CabangProvider = ({ children }) => {
  const { user, isAuthenticated, getUserRole } = useAuth();
  const queryClient = useQueryClient();
  
  const [cabangList, setCabangList] = useState([]);
  const [selectedCabang, setSelectedCabang] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Derived state - isGlobalView berdasarkan selectedCabang
  const isGlobalView = selectedCabang?.id === GLOBAL_CABANG_ID;

  // Invalidate all cabang-dependent queries
  const invalidateCabangQueries = useCallback(() => {
    // Menu/Sidebar
    queryClient.invalidateQueries({ queryKey: ['menus'] });
    queryClient.invalidateQueries({ queryKey: ['sidebar'] });
    
    // Data queries
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
  }, [queryClient]);

  // Build cabang list from user data
  const buildCabangList = useCallback((userData) => {
    const userRole = getUserRole();
    
    // Super admin gets global view option + all cabang
    if (userRole === "super_admin") {
      const globalOption = {
        id: GLOBAL_CABANG_ID,
        namaCabang: "Semua Cabang",
        alamat: "Lihat data dari semua cabang",
        status: "aktif",
        isGlobalView: true,
      };

      // Get cabang from user.cabang array (from login response)
      const userCabang = userData.cabang?.map(c => ({
        id: c.cabangId,
        namaCabang: c.namaCabang,
        isPrimary: c.isPrimary,
        isGlobalView: false,
      })) || [];

      return [globalOption, ...userCabang];
    }

    // Other roles only see their assigned cabang
    return userData.cabang?.map(c => ({
      id: c.cabangId,
      namaCabang: c.namaCabang,
      isPrimary: c.isPrimary,
      isGlobalView: false,
    })) || [];
  }, [getUserRole]);

  // Initialize cabang from user data or localStorage
  const initializeCabang = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      const userRole = getUserRole();
      const list = buildCabangList(user);
      setCabangList(list);

      // Try to restore from localStorage
      const savedCabangId = localStorage.getItem('selectedCabangId');
      
      if (savedCabangId) {
        const savedCabang = list.find(c => c.id === savedCabangId);
        if (savedCabang) {
          setSelectedCabang(savedCabang);
          return;
        }
      }

      // Default selection
      if (userRole === "super_admin") {
        // Super admin defaults to global view
        const globalCabang = list.find(c => c.id === GLOBAL_CABANG_ID);
        if (globalCabang) {
          setSelectedCabang(globalCabang);
          localStorage.setItem('selectedCabangId', GLOBAL_CABANG_ID);
        }
      } else {
        // Other roles default to primary cabang or first cabang
        const primaryCabang = list.find(c => c.isPrimary) || list[0];
        if (primaryCabang) {
          setSelectedCabang(primaryCabang);
          localStorage.setItem('selectedCabangId', primaryCabang.id);
        }
      }
    } catch (err) {
      setError("Gagal memuat data cabang");
      console.error("Error initializing cabang:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, getUserRole, buildCabangList]);

  // Initialize on auth change
  useEffect(() => {
    initializeCabang();
  }, [initializeCabang]);

  // Switch cabang function
  const switchCabang = useCallback((cabangId) => {
    // Validate
    if (!cabangId) return;
    if (selectedCabang?.id === cabangId) return;

    const cabang = cabangList.find(c => c.id === cabangId);
    if (!cabang) {
      console.error("Cabang not found:", cabangId);
      return;
    }

    // Update state
    setSelectedCabang(cabang);
    
    // Persist to localStorage
    localStorage.setItem('selectedCabangId', cabangId);

    // Invalidate all cabang-dependent queries
    invalidateCabangQueries();
  }, [cabangList, selectedCabang, invalidateCabangQueries]);

  // Get cabang by ID
  const getCabangById = useCallback((cabangId) => {
    return cabangList.find(c => c.id === cabangId) || null;
  }, [cabangList]);

  // Check if user can switch cabang
  const canSwitchCabang = getUserRole() === "super_admin" || cabangList.length > 1;

  return (
    <CabangContext.Provider
      value={{
        // State
        cabangList,
        selectedCabang,
        isLoading,
        error,
        isGlobalView,
        
        // Actions
        switchCabang,
        getCabangById,
        setSelectedCabang,
        
        // Flags
        canSwitchCabang,
      }}
    >
      {children}
    </CabangContext.Provider>
  );
};

// Custom hook
export const useCabang = () => {
  const context = useContext(CabangContext);
  if (!context) {
    throw new Error("useCabang must be used within a CabangProvider");
  }
  return context;
};

export default CabangContext;
