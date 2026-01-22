/**
 * Mock data for inventory dashboard
 * This file contains dummy data for testing the inventory dashboard
 */

// Mock data for main dashboard
export const mockInventoryDashboard = {
  totalProducts: 1250,
  totalCategories: 48,
  totalSuppliers: 32,
  lowStockCount: 23,
  expiringCount: 15,
  totalValue: 458750000, // In IDR
  stockMovement: {
    incoming: 345,
    outgoing: 289,
    returned: 12,
    damaged: 8
  },
  topSellingProducts: [
    { id: 1, name: "Beras Premium 5kg", stock: 120, sold: 87, value: 2175000 },
    { id: 2, name: "Minyak Goreng 2L", stock: 85, sold: 65, value: 1625000 },
    { id: 3, name: "Gula Pasir 1kg", stock: 150, sold: 62, value: 930000 },
    { id: 4, name: "Tepung Terigu 1kg", stock: 95, sold: 45, value: 540000 },
    { id: 5, name: "Telur Ayam 1kg", stock: 80, sold: 43, value: 645000 }
  ],
  recentActivity: [
    { id: 1, type: "incoming", product: "Beras Premium 5kg", quantity: 50, date: "2025-05-18T10:30:00Z", user: "Admin" },
    { id: 2, type: "outgoing", product: "Minyak Goreng 2L", quantity: 25, date: "2025-05-19T09:15:00Z", user: "Kasir01" },
    { id: 3, type: "damaged", product: "Telur Ayam 1kg", quantity: 3, date: "2025-05-19T14:45:00Z", user: "Admin" },
    { id: 4, type: "returned", product: "Tepung Terigu 1kg", quantity: 5, date: "2025-05-20T11:20:00Z", user: "Supervisor" },
    { id: 5, type: "incoming", product: "Gula Pasir 1kg", quantity: 100, date: "2025-05-20T16:00:00Z", user: "Admin" }
  ],
  healthScore: 85
};

// Mock data for low stock products
export const mockLowStockProducts = {
  products: [
    { id: 1, name: "Kopi Instant 200g", stock: 5, minStock: 15, category: "Minuman", supplier: "PT Supplier A", lastRestocked: "2025-05-01T10:30:00Z" },
    { id: 2, name: "Sabun Mandi 250ml", stock: 8, minStock: 20, category: "Perlengkapan Mandi", supplier: "PT Supplier B", lastRestocked: "2025-05-05T14:15:00Z" },
    { id: 3, name: "Teh Celup (25 bags)", stock: 7, minStock: 25, category: "Minuman", supplier: "PT Supplier C", lastRestocked: "2025-05-03T09:45:00Z" },
    { id: 4, name: "Pasta Gigi 120g", stock: 10, minStock: 30, category: "Perlengkapan Mandi", supplier: "PT Supplier D", lastRestocked: "2025-05-08T11:20:00Z" },
    { id: 5, name: "Mie Instan Ayam", stock: 12, minStock: 50, category: "Makanan Instan", supplier: "PT Supplier E", lastRestocked: "2025-05-10T16:30:00Z" },
    { id: 6, name: "Susu UHT 1L", stock: 9, minStock: 25, category: "Minuman", supplier: "PT Supplier F", lastRestocked: "2025-05-12T08:45:00Z" },
    { id: 7, name: "Deterjen Bubuk 1kg", stock: 6, minStock: 20, category: "Pembersih", supplier: "PT Supplier G", lastRestocked: "2025-05-07T13:15:00Z" },
    { id: 8, name: "Sambal Botol 250ml", stock: 4, minStock: 15, category: "Bumbu Dapur", supplier: "PT Supplier H", lastRestocked: "2025-05-09T10:00:00Z" }
  ],
  totalCount: 23
};

// Mock data for stock movement
export const mockStockMovement = {
  daily: [
    { date: "2025-05-14", incoming: 45, outgoing: 38 },
    { date: "2025-05-15", incoming: 52, outgoing: 41 },
    { date: "2025-05-16", incoming: 38, outgoing: 35 },
    { date: "2025-05-17", incoming: 65, outgoing: 48 },
    { date: "2025-05-18", incoming: 42, outgoing: 39 },
    { date: "2025-05-19", incoming: 58, outgoing: 45 },
    { date: "2025-05-20", incoming: 45, outgoing: 43 }
  ],
  categories: [
    { name: "Makanan", incoming: 120, outgoing: 95 },
    { name: "Minuman", incoming: 85, outgoing: 72 },
    { name: "Perlengkapan Mandi", incoming: 65, outgoing: 58 },
    { name: "Pembersih", incoming: 45, outgoing: 38 },
    { name: "Bumbu Dapur", incoming: 30, outgoing: 26 }
  ],
  summary: {
    totalIncoming: 345,
    totalOutgoing: 289,
    netChange: 56
  }
};

// Mock data for stock value
export const mockStockValue = {
  totalValue: 458750000, // In IDR
  valueByCategory: [
    { category: "Makanan", value: 185000000 },
    { category: "Minuman", value: 95000000 },
    { category: "Perlengkapan Mandi", value: 75000000 },
    { category: "Pembersih", value: 65000000 },
    { category: "Bumbu Dapur", value: 38750000 }
  ],
  valueByBranch: [
    { branch: "Cabang Pusat", value: 185000000 },
    { branch: "Cabang Utara", value: 125000000 },
    { branch: "Cabang Selatan", value: 95000000 },
    { branch: "Cabang Timur", value: 53750000 }
  ],
  highValueProducts: [
    { id: 1, name: "Beras Premium 25kg", stock: 85, value: 21250000, unitPrice: 250000 },
    { id: 2, name: "Minyak Goreng 5L", stock: 65, value: 8125000, unitPrice: 125000 },
    { id: 3, name: "Gula Pasir 25kg", stock: 45, value: 6750000, unitPrice: 150000 },
    { id: 4, name: "Tepung Terigu 25kg", stock: 38, value: 4750000, unitPrice: 125000 },
    { id: 5, name: "Susu Formula 1kg", stock: 25, value: 3750000, unitPrice: 150000 }
  ]
};

// Mock data for branch transfers
export const mockBranchTransfers = {
  recentTransfers: [
    { id: 1, fromBranch: "Cabang Pusat", toBranch: "Cabang Utara", products: 15, totalItems: 150, date: "2025-05-18T10:30:00Z", status: "completed" },
    { id: 2, fromBranch: "Cabang Pusat", toBranch: "Cabang Selatan", products: 12, totalItems: 120, date: "2025-05-19T09:15:00Z", status: "completed" },
    { id: 3, fromBranch: "Cabang Utara", toBranch: "Cabang Timur", products: 8, totalItems: 80, date: "2025-05-19T14:45:00Z", status: "in-transit" },
    { id: 4, fromBranch: "Cabang Pusat", toBranch: "Cabang Timur", products: 10, totalItems: 100, date: "2025-05-20T11:20:00Z", status: "pending" },
    { id: 5, fromBranch: "Cabang Selatan", toBranch: "Cabang Utara", products: 5, totalItems: 50, date: "2025-05-20T16:00:00Z", status: "pending" }
  ],
  transfersByBranch: [
    { branch: "Cabang Pusat", sent: 37, received: 5 },
    { branch: "Cabang Utara", sent: 8, received: 20 },
    { branch: "Cabang Selatan", sent: 5, received: 12 },
    { branch: "Cabang Timur", sent: 0, received: 18 }
  ],
  summary: {
    totalTransfers: 50,
    pendingTransfers: 12,
    inTransitTransfers: 8,
    completedTransfers: 30
  }
};

// Mock data for expiring products
export const mockExpiringProducts = {
  products: [
    { id: 1, name: "Susu UHT 1L", stock: 25, expiryDate: "2025-06-01", category: "Minuman", daysRemaining: 12, supplier: "PT Supplier A" },
    { id: 2, name: "Roti Tawar", stock: 15, expiryDate: "2025-05-28", category: "Makanan", daysRemaining: 8, supplier: "PT Supplier B" },
    { id: 3, name: "Yogurt 250ml", stock: 20, expiryDate: "2025-05-30", category: "Minuman", daysRemaining: 10, supplier: "PT Supplier C" },
    { id: 4, name: "Daging Sapi 500g", stock: 10, expiryDate: "2025-05-25", category: "Daging", daysRemaining: 5, supplier: "PT Supplier D" },
    { id: 5, name: "Keju Cheddar 250g", stock: 12, expiryDate: "2025-06-05", category: "Dairy", daysRemaining: 16, supplier: "PT Supplier E" },
    { id: 6, name: "Sosis Ayam 500g", stock: 18, expiryDate: "2025-05-27", category: "Daging Olahan", daysRemaining: 7, supplier: "PT Supplier F" },
    { id: 7, name: "Telur Ayam 1kg", stock: 30, expiryDate: "2025-06-10", category: "Telur", daysRemaining: 21, supplier: "PT Supplier G" },
    { id: 8, name: "Mayones 250ml", stock: 8, expiryDate: "2025-06-15", category: "Bumbu Dapur", daysRemaining: 26, supplier: "PT Supplier H" }
  ],
  summary: {
    expiringSoon: 15, // Products expiring within 30 days
    criticalExpiry: 4, // Products expiring within 7 days
    expiryByCategory: [
      { category: "Minuman", count: 5 },
      { category: "Makanan", count: 3 },
      { category: "Daging", count: 2 },
      { category: "Dairy", count: 2 },
      { category: "Daging Olahan", count: 2 },
      { category: "Telur", count: 1 }
    ]
  }
};

// Mock data for cabang (branches)
export const mockCabangList = {
  data: [
    { id: 1, namaCabang: "Cabang Pusat", alamat: "Jl. Utama No. 1", kota: "Jakarta" },
    { id: 2, namaCabang: "Cabang Utara", alamat: "Jl. Utara No. 10", kota: "Jakarta" },
    { id: 3, namaCabang: "Cabang Selatan", alamat: "Jl. Selatan No. 15", kota: "Jakarta" },
    { id: 4, namaCabang: "Cabang Timur", alamat: "Jl. Timur No. 20", kota: "Jakarta" }
  ],
  total: 4
};

// Helper function to use the mock data
export const useMockInventoryDashboard = () => {
  return {
    useInventoryDashboard: () => ({
      data: mockInventoryDashboard,
      isLoading: false,
      error: null
    }),
    useLowStockProducts: () => ({
      data: mockLowStockProducts,
      isLoading: false,
      error: null
    }),
    useStockMovementData: () => ({
      data: mockStockMovement,
      isLoading: false,
      error: null
    }),
    useStockValue: () => ({
      data: mockStockValue,
      isLoading: false,
      error: null
    }),
    useBranchTransferData: () => ({
      data: mockBranchTransfers,
      isLoading: false,
      error: null
    }),
    useExpiringProducts: () => ({
      data: mockExpiringProducts,
      isLoading: false,
      error: null
    })
  };
};
