import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FaGem, FaCoins, FaGift, FaSave, FaToggleOn, FaToggleOff } from 'react-icons/fa';

const schema = z.object({
  isActive: z.boolean(),
  earnRateAmount: z.number().min(1, 'Jumlah belanja minimal harus 1'),
  earnRatePoints: z.number().min(1, 'Poin minimal harus 1'),
  redeemRatePoints: z.number().min(1, 'Poin redeem minimal harus 1'),
  redeemRateAmount: z.number().min(1, 'Nilai tukar minimal Rp 1'),
  minTransaction: z.number().min(0),
  expiryDays: z.number().min(0, 'Isi 0 jika tidak ada kadaluarsa'),
});

const LoyaltyConfigPage = () => {
  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      isActive: true,
      earnRateAmount: 10000,
      earnRatePoints: 1,
      redeemRatePoints: 100,
      redeemRateAmount: 1000,
      minTransaction: 0,
      expiryDays: 365,
    }
  });

  const isActive = watch('isActive');

  const onSubmit = (data) => {
    console.log('Loyalty Config:', data);
    alert('Konfigurasi Loyalty Program berhasil disimpan!');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaGem className="text-purple-600" />
            Konfigurasi Loyalty Program
           </h1>
           <p className="text-sm text-gray-500 mt-1">Atur perolehan dan penukaran poin member</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
           <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
             {isActive ? 'Program Aktif' : 'Program Nonaktif'}
           </span>
           <button 
             type="button"
             onClick={() => setValue('isActive', !isActive, { shouldDirty: true })}
             className={`text-2xl transition-colors ${isActive ? 'text-green-500' : 'text-gray-300'}`}
           >
             {isActive ? <FaToggleOn /> : <FaToggleOff />}
           </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Earning Rules */}
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-opacity ${!isActive ? 'opacity-60 pointer-events-none' : ''}`}>
           <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
             <FaCoins className="text-yellow-500" />
             Aturan Perolehan Poin
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
             <div className="space-y-4">
                <p className="text-sm text-gray-600">Pelanggan akan mendapatkan poin setiap melakukan transaksi dengan kelipatan tertentu.</p>
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Setiap Belanja (Rp)</label>
                        <input 
                           type="number" 
                           {...register('earnRateAmount', { valueAsNumber: true })}
                           className="w-full px-3 py-2 bg-white border border-gray-300 rounded font-semibold text-gray-800 focus:ring-purple-500"
                        />
                         {errors.earnRateAmount && <p className="text-red-500 text-xs mt-1">{errors.earnRateAmount.message}</p>}
                    </div>
                    <span className="text-gray-400 font-bold">=</span>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Dapat Poin</label>
                        <input 
                           type="number" 
                           {...register('earnRatePoints', { valueAsNumber: true })}
                           className="w-full px-3 py-2 bg-white border border-gray-300 rounded font-semibold text-purple-600 focus:ring-purple-500"
                        />
                         {errors.earnRatePoints && <p className="text-red-500 text-xs mt-1">{errors.earnRatePoints.message}</p>}
                    </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Minimal Transaksi untuk Dapat Poin</label>
                   <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">Rp</span>
                      <input 
                         type="number" 
                         {...register('minTransaction', { valueAsNumber: true })}
                         className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500"
                      />
                   </div>
                </div>
             </div>
             
             {/* Preview Card */}
             <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-xl text-white shadow-lg">
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <p className="text-purple-200 text-sm">Contoh Simulasi</p>
                      <h3 className="text-xl font-bold">Transaksi Rp 100.000</h3>
                   </div>
                   <FaGem className="text-3xl text-purple-300 opacity-50" />
                </div>
                <div className="text-center bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
                   <p className="text-sm text-purple-100 mb-1">Pelanggan akan mendapatkan</p>
                   <p className="text-4xl font-extrabold text-yellow-300 drop-shadow-md">
                     {watch('earnRateAmount') > 0 ? Math.floor(100000 / watch('earnRateAmount')) * watch('earnRatePoints') : 0} 
                     <span className="text-lg ml-1">Poin</span>
                   </p>
                </div>
             </div>
           </div>
        </div>

        {/* Redemption Rules */}
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-opacity ${!isActive ? 'opacity-60 pointer-events-none' : ''}`}>
           <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
             <FaGift className="text-red-500" />
             Aturan Penukaran Poin
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div>
                <p className="text-sm text-gray-600 mb-4">Tentukan nilai tukar poin menjadi diskon saat checkout.</p>
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Tukas Poin</label>
                        <input 
                           type="number" 
                           {...register('redeemRatePoints', { valueAsNumber: true })}
                           className="w-full px-3 py-2 bg-white border border-gray-300 rounded font-semibold text-purple-600 focus:ring-purple-500"
                        />
                        {errors.redeemRatePoints && <p className="text-red-500 text-xs mt-1">{errors.redeemRatePoints.message}</p>}
                    </div>
                    <span className="text-gray-400 font-bold">=</span>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Dapat Potongan (Rp)</label>
                        <input 
                           type="number" 
                           {...register('redeemRateAmount', { valueAsNumber: true })}
                           className="w-full px-3 py-2 bg-white border border-gray-300 rounded font-semibold text-gray-800 focus:ring-purple-500"
                        />
                        {errors.redeemRateAmount && <p className="text-red-500 text-xs mt-1">{errors.redeemRateAmount.message}</p>}
                    </div>
                </div>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Masa Berlaku Poin</label>
                <div className="flex items-center gap-3">
                   <input 
                      type="number" 
                      {...register('expiryDays', { valueAsNumber: true })}
                      className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500"
                   />
                   <span className="text-gray-600">Hari sejak poin didapatkan</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Isi 0 jika poin berlaku selamanya.</p>
             </div>
           </div>
        </div>

        <div className="flex justify-end pt-4">
            <button
                type="submit"
                disabled={!isDirty}
                className={`px-8 py-3 rounded-lg text-white font-medium flex items-center gap-2 shadow-lg transition transform hover:-translate-y-0.5 ${
                  isDirty ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
            >
                <FaSave /> Simpan Perubahan
            </button>
        </div>

      </form>
    </div>
  );
};

export default LoyaltyConfigPage;
