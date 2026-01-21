import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft, Package, DollarSign, BarChart2 } from 'lucide-react';
import { Card, Button, Input } from '@shared/ui';
import { useProducts, useCreateProduct, useUpdateProduct, useProduct, useCategories } from '@entities/product';
import MainLayout from '@widgets/layout/MainLayout';

const productSchema = z.object({
  namaProduk: z.string().min(3, 'Nama produk minimal 3 karakter'),
  barcode: z.string().optional(),
  kategoriId: z.string().min(1, 'Pilih kategori'),
  satuan: z.string().min(1, 'Satuan harus diisi'),
  hargaBeli: z.preprocess((val) => Number(val), z.number().min(0, 'Harga beli tidak boleh negatif')),
  hargaJual: z.preprocess((val) => Number(val), z.number().min(0, 'Harga jual tidak boleh negatif')),
  stok: z.preprocess((val) => Number(val), z.number().min(0, 'Stok tidak boleh negatif')),
  minStok: z.preprocess((val) => Number(val), z.number().min(0, 'Min stok tidak boleh negatif')),
  status: z.enum(['aktif', 'nonaktif']),
});

const ProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: productData, isLoading: isLoadingProduct } = useProduct(id, { enabled: isEdit });
  const { data: categoriesData } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const categories = categoriesData?.data || [];
  const product = productData?.data;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      namaProduk: '',
      barcode: '',
      kategoriId: '',
      satuan: 'pcs',
      hargaBeli: 0,
      hargaJual: 0,
      stok: 0,
      minStok: 5,
      status: 'aktif',
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        ...product,
        kategoriId: product.kategori?.id || product.kategoriId || '',
      });
    }
  }, [product, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await updateProduct.mutateAsync({ id, data });
      } else {
        await createProduct.mutateAsync(data);
      }
      navigate('/produk');
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const isLoading = isEdit && isLoadingProduct;

  return (
    <MainLayout 
      title={isEdit ? 'Edit Produk' : 'Tambah Produk'} 
      subtitle={isEdit ? `Edit data produk: ${product?.namaProduk || '...'}` : 'Buat produk baru'}
    >
      <div className="max-w-4xl mx-auto">
        {/* Actions */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/produk')}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
            className="text-gray-600 pl-0 hover:bg-transparent hover:text-indigo-600"
          >
            Kembali ke Daftar
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold border-b pb-2">
                  <Package className="w-5 h-5 text-indigo-500" />
                  <h3>Informasi Dasar</h3>
                </div>
                
                <div className="space-y-4">
                  <Input
                    label="Nama Produk"
                    placeholder="Contoh: Kopi Susu Aren"
                    error={errors.namaProduk?.message}
                    {...register('namaProduk')}
                    disabled={isLoading}
                    required
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Barcode / SKU"
                      placeholder="Scan atau ketik kode"
                      error={errors.barcode?.message}
                      {...register('barcode')}
                      disabled={isLoading}
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kategori <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('kategoriId')}
                        className={`
                          w-full px-4 py-2 rounded-lg border bg-white/50 backdrop-blur-sm
                          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${errors.kategoriId ? 'border-red-300 focus:ring-red-200' : 'border-gray-200'}
                        `}
                        disabled={isLoading}
                      >
                        <option value="">Pilih Kategori</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.namaKategori}
                          </option>
                        ))}
                      </select>
                      {errors.kategoriId && (
                        <p className="mt-1 text-xs text-red-500">{errors.kategoriId.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Satuan"
                      placeholder="Contoh: pcs, kg, box"
                      error={errors.satuan?.message}
                      {...register('satuan')}
                      disabled={isLoading}
                    />
                     <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        {...register('status')}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        disabled={isLoading}
                      >
                        <option value="aktif">Aktif</option>
                        <option value="nonaktif">Nonaktif</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                 <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold border-b pb-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <h3>Harga & Keuntungan</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Harga Beli"
                    type="number"
                    placeholder="0"
                    leftIcon={<span className="text-gray-500 text-sm">Rp</span>}
                    error={errors.hargaBeli?.message}
                    {...register('hargaBeli')}
                    disabled={isLoading}
                  />
                  <Input
                    label="Harga Jual"
                    type="number"
                    placeholder="0"
                    leftIcon={<span className="text-gray-500 text-sm">Rp</span>}
                    error={errors.hargaJual?.message}
                    {...register('hargaJual')}
                    disabled={isLoading}
                  />
                </div>
              </Card>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              <Card>
                <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold border-b pb-2">
                  <BarChart2 className="w-5 h-5 text-amber-500" />
                  <h3>Inventaris</h3>
                </div>
                <div className="space-y-4">
                  <Input
                    label="Stok Saat Ini"
                    type="number"
                    placeholder="0"
                    error={errors.stok?.message}
                    {...register('stok')}
                    disabled={isLoading}
                  />
                  <Input
                    label="Stok Minimum"
                    type="number"
                    placeholder="5"
                    error={errors.minStok?.message}
                    {...register('minStok')}
                    disabled={isLoading}
                    helperText="Notifikasi akan muncul jika stok di bawah ini"
                  />
                </div>
              </Card>

              <div className="flex flex-col gap-3 sticky top-6">
                <Button
                  type="submit"
                  isLoading={isSubmitting || createProduct.isPending || updateProduct.isPending}
                  leftIcon={<Save className="w-5 h-5" />}
                  className="w-full"
                >
                  {isEdit ? 'Simpan Perubahan' : 'Simpan Produk'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/produk')}
                  disabled={isSubmitting}
                  className="w-full border border-gray-200"
                >
                  Batal
                </Button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default ProductFormPage;
