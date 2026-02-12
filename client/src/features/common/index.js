// features/common - Public API
// Re-export all common/shared components

// Permission Components
export { 
  default as PermissionGate,
  Can, 
  CanAny, 
  CanAll 
} from './PermissionGate';

// Other common components - add more as needed
// export { default as LoadingSpinner } from './LoadingSpinner';
// export { default as ErrorBoundary } from './ErrorBoundary';
