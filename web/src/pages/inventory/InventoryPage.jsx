import { useState } from 'react';
import { Package, ArrowUpRight, ArrowDownLeft, AlertTriangle, History } from 'lucide-react';
import { Card, Button, DataTable } from '@shared/ui';
import { useProducts, useLowStockProducts } from '@entities/product';
import MainLayout from '@widgets/layout/MainLayout';
import { formatNumber, formatDateTime } from '@shared/lib';

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Reuse products hook for inventory list
  const { data: productsData, isLoading } = useProducts({ limit: 50 });
  const { data: lowStockData } = useLowStockProducts();
  
  const products = productsData?.data?.products || [];
  const lowStockProducts = lowStockData?.data || [];

  const columns = [
    { key: 'namaProduk', header: 'Produk', sortable: true },
    { key: 'sku', header: 'SKU', render: (_, r) => r.barcode || '-' },
    { key: 'kategori', header: 'Kategori', render: (_, r) => r.kategori?.namaKategori || '-' },
    { 
      key: 'stok', 
      header: 'Stok Fisik', 
      sortable: true,
      render: (val, row) => (
        <span className={`font-medium ${val <= row.minStok ? 'text-red-500' : 'text-gray-800'}`}>
          {formatNumber(val)} {row.satuan}
        </span>
      )
    },
    { key: 'minStok', header: 'Min. Stok', render: (val) => formatNumber(val) },
    { 
      key: 'status', 
      header: 'Status',
      render: (_, row) => {
        if (row.stok <= 0) return <span className="badge badge-danger">Habis</span>;
        if (row.stok <= row.minStok) return <span className="badge badge-warning">Menipis</span>;
        return <span className="badge badge-success">Aman</span>;
      }
    }
  ];

  return (
    <MainLayout title="Manajemen Inventaris" subtitle="Monitor stok dan pergerakan barang">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white/70">
           <div className="flex items-center gap-3">
             <div className="p-3 rounded-xl glass-surface text-blue-500">
               <Package className="w-6 h-6" />
             </div>
             <div>
               <p className="text-2xl font-bold text-gray-800">{formatNumber(productsData?.data?.pagination?.total || 0)}</p>
               <p className="text-sm text-gray-500">Total SKU</p>
             </div>
           </div>
        </Card>
        <Card className="bg-white/70">
           <div className="flex items-center gap-3">
             <div className="p-3 rounded-xl glass-surface text-amber-500">
               <AlertTriangle className="w-6 h-6" />
             </div>
             <div>
               <p className="text-2xl font-bold text-gray-800">{formatNumber(lowStockProducts.length)}</p>
               <p className="text-sm text-gray-500">Stok Menipis</p>
             </div>
           </div>
        </Card>
        <Card className="bg-white/70">
           <div className="flex items-center gap-3">
             <div className="p-3 rounded-xl glass-surface text-emerald-500">
               <ArrowDownLeft className="w-6 h-6" />
             </div>
             <div>
               <p className="text-2xl font-bold text-gray-800">12</p>
               <p className="text-sm text-gray-500">Masuk (Hari Ini)</p>
             </div>
           </div>
        </Card>
        <Card className="bg-white/70">
           <div className="flex items-center gap-3">
             <div className="p-3 rounded-xl glass-surface text-red-500">
               <ArrowUpRight className="w-6 h-6" />
             </div>
             <div>
               <p className="text-2xl font-bold text-gray-800">45</p>
               <p className="text-sm text-gray-500">Keluar (Hari Ini)</p>
             </div>
           </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Overview Stok
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'movements' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Riwayat Pergerakan
        </button>
      </div>

      {/* Content */}
      <Card>
        {activeTab === 'overview' ? (
          <DataTable
            columns={columns}
            data={products}
            loading={isLoading}
            emptyMessage="Data stok tidak tersedia"
          />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Riwayat pergerakan stok akan ditampilkan di sini</p>
          </div>
        )}
      </Card>
    </MainLayout>
  );
};

export default InventoryPage;
