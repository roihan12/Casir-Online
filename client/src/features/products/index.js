// features/products - Public API

// Services
export { default as produkMasterService } from './services/produkMasterService';

// Hooks
export { default as useProdukQueries } from './hooks/useProdukQueries';
export {
  produkMasterKeys,
  useProdukMasterList,
  useProdukMasterDetail,
  useCategories,
  useCreateProdukMaster,
  useUpdateProdukMaster,
  useDeleteProdukMaster,
  useUploadProdukImages,
  useDeleteProdukImage,
  useProdukMasterDashboard,
} from './hooks/useProdukMasterQueries';

// Validation
export {
  ProdukFilterSchema,
  ProdukCreateSchema,
  ProdukUpdateSchema,
  StokUpdateSchema,
  PaginationSchema,
} from './validation/productValidation';

// Components
export { default as ProductDashboard } from './components/ProductDashboard';
export { default as ProductImportExport } from './components/ProductImportExport';

// Pages
export { default as ProductManagementPage } from './pages/ProductManagementPage';
