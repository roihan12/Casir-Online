# Inventory Management Integration

This document explains the integration between the frontend and backend for the inventory management functionality.

## Architecture

The inventory management feature follows a clean architecture with separation of concerns:

1. **Service Layer**: Contains API call functions in `inventoryService.js`
2. **Hooks Layer**:
   - `useInventoryQueries.js` - Custom React Query hooks for data fetching
   - `useInventoryMutations.js` - Custom React Query hooks for data mutations
   - `useCabangQueries.js` - Custom React Query hooks for branch data
3. **UI Layer**: The `InventoryManagement.jsx` component

## API Services

The inventory service uses the central `api.js` for HTTP requests:

```javascript
// services/inventoryService.js
import api from "./api";

const inventoryService = {
  getDashboardData: async (cabangId, period = 30) => {
    // Make API call...
  },
  // other methods...
};
```

## React Query Hooks

### Query Hooks

Custom query hooks take care of data fetching, caching, and refetching:

```javascript
// hooks/useInventoryQueries.js
import { useQuery } from "@tanstack/react-query";
import inventoryService from "../services/inventoryService";

const useInventoryQueries = () => {
  const useDashboardData = (cabangId, period = 30) => {
    return useQuery({
      queryKey: ["inventoryDashboard", cabangId, period],
      queryFn: () => inventoryService.getDashboardData(cabangId, period),
    });
  };
  // other query hooks...

  return { useDashboardData, ... };
};
```

### Branch Selection

The branch selection uses the `useCabangList` hook from `useCabangQueries.js`:

```javascript
// Using the useCabangList hook
const { data: cabangListData, isLoading: isCabangLoading } = useCabangList();

// Processing the branch data
useEffect(() => {
  if (cabangListData?.data) {
    const branchesData = cabangListData.data.map((cabang) => ({
      id: cabang.id || cabang.cabang_id,
      namaCabang: cabang.namaCabang || cabang.nama_cabang,
    }));
    setBranches(branchesData);
  }
}, [cabangListData]);

// Refreshing data when branch changes
useEffect(() => {
  if (selectedBranchId) {
    refetchDashboard();
  }
}, [selectedBranchId]);
```

### Mutation Hooks

Custom mutation hooks handle data updates:

```javascript
// hooks/useInventoryMutations.js
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useInventoryMutations = () => {
  const queryClient = useQueryClient();

  const useStockAdjustment = () => {
    return useMutation({
      mutationFn: (data) => inventoryService.adjustStock(data),
      onSuccess: () => {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["inventoryDashboard"] });
        // ...
      },
    });
  };

  return { useStockAdjustment };
};
```

## Form Validation

Forms are validated using Zod schemas:

```javascript
// schemas/inventorySchemas.js
import { z } from "zod";

export const stockAdjustmentSchema = z.object({
  newStock: z
    .number({ required_error: "Stok baru harus diisi" })
    .int("Stok harus berupa bilangan bulat")
    .nonnegative("Stok tidak boleh negatif"),
  // other fields...
});
```

## Integration with UI Components

In the UI components, we use the hooks to fetch and update data:

```javascript
// pages/superadmin/InventoryManagement.jsx
const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardData(
  selectedBranchId,
  selectedPeriod
);

// For mutations:
const handleAdjustStock = async (formData) => {
  const { useStockAdjustment } = useInventoryMutations();
  const { mutateAsync } = useStockAdjustment();

  await mutateAsync({
    productId: selectedProduct.id,
    newStock: formData.newStock,
    // ...
  });
};
```

## Backend Routes

The backend routes for inventory management are defined in:

- `server/src/routes/inventoryDashboardRoutes.js`

Main endpoints:

- `GET /inventory-dashboard` - Get dashboard data
- `GET /inventory-dashboard/low-stock` - Get low stock products
- `GET /inventory-dashboard/stock-movement` - Get stock movement data
- `GET /inventory-dashboard/stock-value` - Get stock value data
- `GET /inventory-dashboard/branch-transfer` - Get branch transfer data
- `POST /inventory/adjust` - Adjust product stock

## Best Practices Implemented

1. **Separation of Concerns**: API calls, data fetching, and UI are separated
2. **Data Validation**: Using Zod for form validation
3. **Optimistic Updates**: Using React Query's mutation capabilities
4. **Error Handling**: Centralized error handling in mutation hooks
5. **Type Documentation**: JSDoc comments for better developer experience
6. **Dynamic Branch Selection**: Using the useCabangList hook for branch data
