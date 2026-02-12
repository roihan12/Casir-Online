import { useMemo } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { getAuthorizedWidgets, groupWidgetsByType } from '../config/WidgetRegistry';

/**
 * Hook to get authorized dashboard widgets for the current user.
 * Filters the WidgetRegistry based on user's permissions.
 *
 * @returns {Object} - Contains `widgets` (flat list), `groupedWidgets` (by type), and `isLoading`.
 */
export const useDashboardWidgets = () => {
  const { user, isLoading } = useAuth();

  const authorizedWidgets = useMemo(() => {
    if (!user || !user.permissions) {
      return [];
    }
    return getAuthorizedWidgets(user.permissions);
  }, [user]);

  const groupedWidgets = useMemo(() => {
    return groupWidgetsByType(authorizedWidgets);
  }, [authorizedWidgets]);

  return {
    widgets: authorizedWidgets,
    groupedWidgets,
    isLoading,
    totalWidgets: authorizedWidgets.length,
  };
};

export default useDashboardWidgets;
