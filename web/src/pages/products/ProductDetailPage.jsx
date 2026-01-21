import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Package, DollarSign, BarChart2, Calendar, Tag, AlertTriangle } from 'lucide-react';
import { Card, Button } from '@shared/ui';
import { useProduct } from '@entities/product';
import MainLayout from '@widgets/layout/MainLayout';
import { formatRupiah, formatNumber, formatDateTime } from '@shared/lib';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: productData, isLoading } = useProduct(id);

  const product = productData?.data;

  if (isLoading) {
    return (
      <MainLayout title="Detail Produk" subtitle="Memuat data produk...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout title="Detail Produk">
        <div className="text-center py-12">
           <h2 className="text-xl font-semibold text-gray-800">Produk tidak ditemukan</h2>
           <Button variant="ghost" className="mt-4" onClick={() => navigate('/produk')}>
             Kembali ke Daftar
           </Button>
        </div>
      </MainLayout>
    );
  }

  const isLowStock = product.stok <= product.minStok;

  return (
    <MainLayout 
      title="Detail Produk" 
      subtitle={`Informasi lengkap produk: ${product.namaProduk}`}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/produk')}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
            className="text-gray-600 pl-0 hover:bg-transparent hover:text-indigo-600"
          >
            Kembali
          </Button>
          <Button 
            onClick={() => navigate(`/produk/${id}/edit`)}
            leftIcon={<Edit className="w-4 h-4" />}
          >
            Edit Produk
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className={`${isLowStock ? 'bg-amber-50 border-amber-200' : 'bg-white/70'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl glass-surface ${isLowStock ? 'text-amber-500' : 'text-indigo-500'}`}>
                {isLowStock ? <AlertTriangle className="w-6 h-6" /> : <Package className="w-6 h-6" />}
              </div>
              <div>
                <p className={`text-2xl font-bold ${isLowStock ? 'text-amber-700' : 'text-gray-800'}`}>
                  {formatNumber(product.stok)} {product.satuan}
                </p>
                <p className={`text-sm ${isLowStock ? 'text-amber-600' : 'text-gray-500'}`}>
                  Stok Tersedia
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-white/70">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl glass-surface text-emerald-500">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {formatRupiah(product.hargaJual)}
                </p>
                <p className="text-sm text-gray-500">Harga Jual</p>
              </div>
            </div>
          </Card>

           <Card className="bg-white/70">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl glass-surface text-blue-500">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {formatNumber(product.terjual || 0)}
                </p>
                <p className="text-sm text-gray-500">Total Terjual</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold border-b pb-2">
                <Tag className="w-5 h-5 text-indigo-500" />
                <h3>Informasi Dasar</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Barcode / SKU</label>
                  <p className="text-gray-800 font-medium">{product.barcode || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Kategori</label>
                  <span className="inline-flex mt-1 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {product.kategori?.namaKategori || '-'}
                  </span>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Status</label>
                  <span className={`inline-flex mt-1 items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Satuan</label>
                  <p className="text-gray-800 font-medium">{product.satuan}</p>
                </div>
              </div>
            </Card>

             <Card>
              <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold border-b pb-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <h3>Rincian Harga</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Harga Beli</label>
                  <p className="text-gray-800 font-medium">{formatRupiah(product.hargaBeli)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Harga Jual</label>
                  <p className="text-gray-800 font-medium">{formatRupiah(product.hargaJual)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Margin Profit</label>
                  <p className="text-emerald-600 font-medium">
                    {product.hargaBeli > 0 
                      ? `${(((product.hargaJual - product.hargaBeli) / product.hargaBeli) * 100).toFixed(1)}%` 
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Profit per Unit</label>
                  <p className="text-emerald-600 font-medium">
                    {formatRupiah(product.hargaJual - product.hargaBeli)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
             <Card>
              <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold border-b pb-2">
                <BarChart2 className="w-5 h-5 text-amber-500" />
                <h3>Status Inventaris</h3>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Stok Min.</span>
                    <span className="font-medium text-gray-800">{formatNumber(product.minStok)}</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Stok Max.</span>
                    <span className="font-medium text-gray-800">{formatNumber(product.maxStok || 0)}</span>
                 </div>
                 {isLowStock && (
                   <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100 text-sm text-red-600">
                     ⚠️ Stok produk ini di bawah batas minimum. Segera lakukan restock.
                   </div>
                 )}
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold border-b pb-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <h3>Info Lainnya</h3>
              </div>
              <div className="space-y-3">
                 <div>
                    <span className="text-xs text-gray-500 block">Dibuat pada</span>
                    <span className="text-sm font-medium text-gray-800">{formatDateTime(product.createdAt)}</span>
                 </div>
                 <div>
                    <span className="text-xs text-gray-500 block">Terakhir diupdate</span>
                    <span className="text-sm font-medium text-gray-800">{formatDateTime(product.updatedAt)}</span>
                 </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductDetailPage;
