import { useQuery } from "@tanstack/react-query";
import menuService from "../services/menuService";
import { useCabang } from "../features/cabang/hooks/useCabang";

// Query keys
export const menuKeys = {
  all: ["menus"],
  sidebar: () => [...menuKeys.all, "sidebar"],
  lists: () => [...menuKeys.all, "list"],
  list: (filters) => [...menuKeys.lists(), { ...filters }],
  details: () => [...menuKeys.all, "detail"],
  detail: (id) => [...menuKeys.details(), id],
  user: () => [...menuKeys.all, "user"],
  userMenus: (cabangId) => [...menuKeys.user(), cabangId],
  role: () => [...menuKeys.all, "role"],
  roleMenus: (roleId) => [...menuKeys.role(), roleId],
};

/**
 * Hook utama untuk sidebar - menggunakan permission-based API
 * @returns {Object} Query result with sidebar menus
 */
export const useSidebarMenu = (options = {}) => {
  return useQuery({
    queryKey: menuKeys.sidebar(),
    queryFn: menuService.getSidebarNavigation,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to fetch menus for the current user in the selected branch
 * @returns {Object} Query result with menus data
 */
export const useUserMenus = () => {
  const { selectedCabang } = useCabang();
  
  return useQuery({
    queryKey: menuKeys.userMenus(selectedCabang?.id),
    queryFn: () => menuService.getUserMenus(selectedCabang?.id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch all menus (for admin purposes)
 * @returns {Object} Query result with all menus
 */
export const useAllMenus = () => {
  return useQuery({
    queryKey: menuKeys.lists(),
    queryFn: () => menuService.getAllMenus(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch menus for a specific role
 * @param {string} roleId - Role ID
 * @returns {Object} Query result with role menus
 */
export const useRoleMenus = (roleId) => {
  return useQuery({
    queryKey: menuKeys.roleMenus(roleId),
    queryFn: () => menuService.getRoleMenus(roleId),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};