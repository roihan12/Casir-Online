# Branch Switching System Documentation

## Overview

The branch switching system allows super_admin users to switch between a global view of all branches and specific branch views. This document explains how the system works and the recent changes made to improve its functionality.

## Key Components

### 1. CabangContext

The `CabangContext` provides branch-related state and functions to the application:

- `selectedCabang`: The currently selected branch
- `isGlobalView`: Whether the user is in global view mode
- `switchCabang`: Function to change the selected branch
- `cabangList`: List of available branches

### 2. CabangSwitcher

The `CabangSwitcher` component allows super_admin users to select different branches from a dropdown menu. It appears in the header for super_admin users.

### 3. DynamicLayout

The `DynamicLayout` component determines which layout to render based on the user's role and selected branch:

- For super_admin users viewing a specific branch: `AdminCabangLayout`
- For super_admin users in global view: `SuperAdminLayout`
- For other roles: Their role-specific layouts

## Routing Structure

The application uses a flat routing structure where all authenticated routes are under the root path (`/`). This is different from the legacy routing structure that used role-based prefixes (`/superadmin/`, `/admincabang/`, etc.).

## Branch Switching Logic

1. When a super_admin selects a branch from the `CabangSwitcher`:
   - The `selectedCabang` state is updated
   - The `isGlobalView` state is updated based on whether the selected branch is the global view
   - If on a legacy route, the user is redirected to the equivalent new route
   - If already on a new route, the page refreshes to apply the layout change

2. The `DynamicLayout` component automatically renders the appropriate layout based on the updated `selectedCabang` and `isGlobalView` states.

## Recent Changes

### 1. Updated Route Handling

The branch switching logic was updated to work with the new flat routing structure instead of the legacy role-based prefixes.

### 2. Simplified Navigation

Navigation paths in `getProfilePath` and `getSettingsPath` were simplified to use the new routing structure.

### 3. Improved Layout Determination

The `DynamicLayout` component now more clearly determines which layout to show based on both user role and selected branch.

### 4. Removed Automatic Branch Switching

Removed the automatic branch switching based on URL paths, as this was causing navigation loops and conflicts with the new routing structure.

## Best Practices

1. Always use the `useCabang` hook to access branch-related state and functions.
2. Use the `DynamicLayout` component to handle layout switching based on branch selection.
3. For super_admin-specific features, check both the user role and `isGlobalView` state.

## Troubleshooting

If branch switching is not working correctly:

1. Check that `selectedCabang` and `isGlobalView` are being updated correctly
2. Verify that `DynamicLayout` is rendering the correct layout
3. Ensure that legacy routes are being properly redirected to the new routes