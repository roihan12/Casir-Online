// features/dashboard - Public API

// Components
export { default as DashboardWidgets } from './components/DashboardWidgets';
export { default as StatCard } from './components/StatCard';
export { default as RecentTransactions } from './components/RecentTransactions';
export { default as QuickActions } from './components/QuickActions';

// Hooks
export { default as useDashboardWidgets } from './hooks/useDashboardWidgets';

// Pages
export { default as DashboardPage } from './pages/DashboardPage';

// Config
export { widgetPermissions, allWidgets } from './config/widgetConfig';
