import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Package, AlertTriangle, Edit, Eye } from 'lucide-react';
import { Card, Button, Input, DataTable, Modal } from '@shared/ui';
import { useProducts, useLowStockProducts } from '@entities/product';
import { formatRupiah, formatNumber } from '@shared/lib';
import { Can } from '@features/auth';
import MainLayout from '@widgets/layout/MainLayout';

const ProductsListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  const { data: productsData, isLoading } = useProducts({ 
    page, 
    limit: 10, 
    search: search || undefined 
  });
  const { data: lowStockData } = useLowStockProducts();

  const products = productsData?.data?.products || [];
  const pagination = productsData?.data?.pagination;
  const lowStockProducts = lowStockData?.data || [];

  const columns = [
    {
      key: 'namaProduk',
      header: 'Produk',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-800">{value}</p>
            <p className="text-xs text-gray-500">{row.barcode || '-'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'kategori',
      header: 'Kategori',
      render: (_, row) => row.kategori?.namaKategori || '-',
    },
    {
      key: 'stok',
      header: 'Stok',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className={value <= (row.minStok || 10) ? 'text-red-500 font-medium' : ''}>
            {formatNumber(value)}
          </span>
          {value <= (row.minStok || 10) && (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          )}
        </div>
      ),
    },
    {
      key: 'hargaJual',
      header: 'Harga Jual',
      sortable: true,
      render: (value) => formatRupiah(value),
    },
    {
      key: 'hargaBeli',
      header: 'Harga Beli',
      render: (value) => formatRupiah(value),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <span className={`badge ${value === 'aktif' ? 'badge-success' : 'badge-danger'}`}>
          {value === 'aktif' ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/produk/${row.id}`); }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4 text-gray-500" />
          </button>
          <Can permission="produk:update">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/produk/${row.id}/edit`); }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4 text-gray-500" />
            </button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Produk" subtitle="Kelola daftar produk">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white/70">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl glass-surface text-indigo-500">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{formatNumber(pagination?.total || 0)}</p>
              <p className="text-sm text-gray-500">Total Produk</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white/70">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl glass-surface text-emerald-500">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {formatNumber(products.filter(p => p.status === 'aktif').length)}
              </p>
              <p className="text-sm text-gray-500">Produk Aktif</p>
            </div>
          </div>
        </Card>
        <Card 
          className="bg-white/70 cursor-pointer hover:bg-white/80 transition-colors"
          onClick={() => setShowLowStock(true)}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl glass-surface text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{formatNumber(lowStockProducts.length)}</p>
              <p className="text-sm text-gray-500">Stok Rendah</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>
          <Can permission="produk:create">
            <Button leftIcon={<Plus className="w-5 h-5" />} onClick={() => navigate('/produk/tambah')}>
              Tambah Produk
            </Button>
          </Can>
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        <DataTable
          columns={columns}
          data={products}
          loading={isLoading}
          pagination={pagination ? {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: pagination.totalPages,
          } : null}
          onPageChange={setPage}
          onRowClick={(row) => navigate(`/produk/${row.id}`)}
          emptyMessage="Belum ada produk"
        />
      </Card>

      {/* Low Stock Modal */}
      <Modal isOpen={showLowStock} onClose={() => setShowLowStock(false)} title="Produk Stok Rendah" size="lg">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {lowStockProducts.length > 0 ? (
            lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 glass-surface rounded-xl">
                <div>
                  <p className="font-medium text-gray-800">{product.namaProduk}</p>
                  <p className="text-sm text-gray-500">{product.barcode || '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-500 font-bold">{formatNumber(product.stok)}</p>
                  <p className="text-xs text-gray-500">Min: {product.minStok || 10}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">Tidak ada produk dengan stok rendah</p>
          )}
        </div>
      </Modal>
    </MainLayout>
  );
};

export default ProductsListPage;
