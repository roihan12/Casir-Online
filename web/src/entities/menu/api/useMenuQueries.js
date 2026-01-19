import { useQuery } from '@tanstack/react-query';
import menuApi from '@shared/api/menuApi';

export const menuKeys = {
  all: ['menu'],
  sidebar: () => [...menuKeys.all, 'sidebar'],
  hierarchy: () => [...menuKeys.all, 'hierarchy'],
};

/**
 * Hook untuk mendapatkan sidebar menu berdasarkan role user
 */
export const useSidebarMenu = (options = {}) => {
  return useQuery({
    queryKey: menuKeys.sidebar(),
    queryFn: menuApi.getSidebar, // Function reference, NOT menuApi.getSidebar()
    // staleTime: 10 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook untuk mendapatkan menu hierarchy
 */
export const useMenuHierarchy = (options = {}) => {
  return useQuery({
    queryKey: menuKeys.hierarchy(),
    queryFn: menuApi.getHierarchy, // Function reference, NOT menuApi.getHierarchy()
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};
