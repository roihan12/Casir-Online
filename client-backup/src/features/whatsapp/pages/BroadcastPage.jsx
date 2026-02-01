import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FaBullhorn, FaUsers, FaClock, FaPaperPlane, FaHistory } from 'react-icons/fa';

// Mock Data
const broadcastHistory = [
  { id: 1, name: 'Promo Akhir Tahun', audience: 'All Customers', sentAt: '2023-12-25 10:00', status: 'Sent', success: 150, failed: 5 },
  { id: 2, name: 'Info Maintenance', audience: 'Active Users', sentAt: '2024-01-10 08:00', status: 'Sent', success: 120, failed: 0 },
  { id: 3, name: 'Flash Sale Alert', audience: 'VIP Members', sentAt: '2024-02-01 12:00', status: 'Scheduled', success: 0, failed: 0 },
];

const schema = z.object({
  broadcastName: z.string().min(1, 'Nama broadcast wajib diisi'),
  audience: z.string().min(1, 'Target audience wajib dipilih'),
  template: z.string().min(1, 'Template pesan wajib dipilih'),
  scheduleTime: z.string().optional(),
});

const BroadcastPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    console.log('Broadcast Data:', data);
    alert('Broadcast berhasil dijadwalkan!');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaBullhorn className="text-purple-600" />
          Broadcast Pesan
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <FaPaperPlane className="text-gray-500" />
              Buat Broadcast Baru
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Broadcast</label>
                <input
                  {...register('broadcastName')}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="Contoh: Promo Februari"
                />
                {errors.broadcastName && <p className="text-red-500 text-xs mt-1">{errors.broadcastName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <div className="relative">
                    <select
                    {...register('audience')}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition appearance-none"
                    >
                    <option value="">Pilih Target</option>
                    <option value="all">Semua Kontak</option>
                    <option value="active">Pelanggan Aktif</option>
                    <option value="inactive">Pelanggan Tidak Aktif</option>
                    <option value="vip">VIP Members</option>
                    </select>
                    <FaUsers className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
                {errors.audience && <p className="text-red-500 text-xs mt-1">{errors.audience.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Template</label>
                <select
                  {...register('template')}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                >
                  <option value="">Pilih Template Pesan</option>
                  <option value="1">Promo Akhir Tahun</option>
                  <option value="2">Info Diskon</option>
                  <option value="3">Greeting Regular</option>
                </select>
                {errors.template && <p className="text-red-500 text-xs mt-1">{errors.template.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jadwal Kirim (Opsional)</label>
                 <div className="relative">
                    <input
                    type="datetime-local"
                    {...register('scheduleTime')}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    />
                    <FaClock className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                 </div>
                 <p className="text-xs text-gray-500 mt-1">Kosongkan untuk kirim sekarang.</p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <FaPaperPlane /> Kirim Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Broadcast History */}
        <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaHistory className="text-gray-500" />
                    Riwayat Broadcast
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-4 font-semibold text-gray-600 text-sm">Nama Broadcast</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Target</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Waktu Kirim</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Statistik</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {broadcastHistory.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-medium text-gray-800">{item.name}</td>
                                    <td className="p-4 text-gray-600 text-sm">{item.audience}</td>
                                    <td className="p-4 text-gray-600 text-sm">{item.sentAt}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            item.status === 'Sent' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm">
                                        <div className="flex gap-2">
                                            <span className="text-green-600 font-medium">{item.success} Sukses</span>
                                            <span className="text-gray-300">|</span>
                                            <span className="text-red-500 font-medium">{item.failed} Gagal</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastPage;
