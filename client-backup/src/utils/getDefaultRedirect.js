/**
 * Get the default redirect path based on user permissions
 * Used after login to redirect user to the first accessible page
 * 
 * @param {string[]} permissions - Array of permission strings
 * @returns {string} - The default redirect path
 */
export const getDefaultRedirect = (permissions = []) => {
  const routes = [
    { permission: 'dashboard:read', path: '/dashboard' },
    { permission: 'pos:access', path: '/pos' },
    { permission: 'produk:read', path: '/products' },
    { permission: 'transaksi:read', path: '/transactions' },
    { permission: 'shift:read', path: '/shifts/active' },
    { permission: 'pelanggan:read', path: '/customers' },
    { permission: 'inventory:read', path: '/inventory' },
    { permission: 'supplier:read', path: '/suppliers' },
  ];

  for (const route of routes) {
    if (permissions.includes(route.permission)) {
      return route.path;
    }
  }

  // Fallback to profile if no permission matches
  return '/profile';
};

export default getDefaultRedirect;
