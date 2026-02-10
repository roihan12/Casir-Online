import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FaBullhorn, FaUsers, FaClock, FaPaperPlane, FaHistory, FaSpinner } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import whatsappService from '../services/whatsappService';
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast is used, or alert

// Schema Validation
const schema = z.object({
  name: z.string().min(1, 'Nama broadcast wajib diisi'),
  segments: z.object({
    id: z.string().min(1, 'Target audience wajib dipilih'),
    name: z.string().optional()
  }).refine(val => val.id !== '', { message: "Target audience wajib dipilih" }),
  message: z.string().min(1, 'Pesan wajib diisi'),
  scheduleTime: z.string().optional(),
});

const BroadcastPage = () => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: zodResolver(schema),
  });

  // Fetch Segments
  const { data: segmentsData, isLoading: isLoadingSegments } = useQuery({
    queryKey: ['broadcastSegments'],
    queryFn: whatsappService.getBroadcastSegments
  });

  // Fetch History
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['broadcastHistory'],
    queryFn: whatsappService.getBroadcastHistory
  });

  // Mutation for sending broadcast
  const broadcastMutation = useMutation({
    mutationFn: whatsappService.createBroadcast,
    onSuccess: () => {
      toast.success('Broadcast berhasil dijadwalkan!');
      reset();
      queryClient.invalidateQueries(['broadcastHistory']);
    },
    onError: (error) => {
      toast.error(`Gagal mengirim broadcast: ${error.message}`);
    }
  });

  const onSubmit = (data) => {
    // Format payload
    const payload = {
      name: data.name,
      message: data.message,
      segments: { segmen: data.segments.id === 'all' ? undefined : data.segments.id }, // Simple logic for now
      scheduleTime: data.scheduleTime || null
    };
    broadcastMutation.mutate(payload);
  };

  const segments = segmentsData?.data || [];
  const broadcastHistory = historyData?.data || [];

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
                  {...register('name')}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="Contoh: Promo Februari"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <div className="relative">
                    <select
                        onChange={(e) => {
                            const selected = segments.find(s => s.id === e.target.value);
                            setValue('segments', { id: e.target.value, name: selected?.name });
                        }}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition appearance-none"
                    >
                    <option value="">Pilih Target</option>
                    {isLoadingSegments ? (
                        <option disabled>Loading...</option>
                    ) : (
                        segments.map(seg => (
                            <option key={seg.id} value={seg.id}>{seg.name}</option>
                        ))
                    )}
                    </select>
                    <FaUsers className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
                {errors.segments && <p className="text-red-500 text-xs mt-1">{errors.segments.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pesa Broadcast</label>
                 <textarea
                  {...register('message')}
                  rows={5}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="Halo {{name}}, kami ada promo spesial untukmu!"
                />
                <p className="text-xs text-gray-500 mt-1">Gunakan {'{{name}}'} untuk nama pelanggan.</p>
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
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
                  disabled={broadcastMutation.isPending}
                  className="w-full px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:bg-purple-300 disabled:cursor-not-allowed"
                >
                  {broadcastMutation.isPending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />} 
                  {broadcastMutation.isPending ? 'Mengirim...' : 'Kirim Broadcast'}
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
                                <th className="p-4 font-semibold text-gray-600 text-sm">Waktu Dibuat</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Statistik</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoadingHistory ? (
                                <tr>
                                    <td colSpan="5" className="p-4 text-center text-gray-500">Loading history...</td>
                                </tr>
                            ) : broadcastHistory.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-4 text-center text-gray-500">Belum ada riwayat broadcast.</td>
                                </tr>
                            ) : (
                                broadcastHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 font-medium text-gray-800">{item.name}</td>
                                        <td className="p-4 text-gray-600 text-sm">{new Date(item.createdAt).toLocaleString()}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                item.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                                item.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="flex gap-2">
                                                <span className="text-green-600 font-medium">{item.sent} Terkirim</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
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
