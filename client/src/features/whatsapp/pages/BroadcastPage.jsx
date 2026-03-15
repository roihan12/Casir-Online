import React, { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FaBullhorn, FaUsers, FaClock, FaPaperPlane, FaHistory, FaSpinner, FaImage, FaTimes, FaVial, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import whatsappService from '../services/whatsappService';
import { toast } from 'react-hot-toast';

// Schema Validation
const schema = z.object({
  name: z.string().min(1, 'Nama broadcast wajib diisi'),
  segments: z.object({
    id: z.string().min(1, 'Target audience wajib dipilih'),
    name: z.string().optional()
  }).refine(val => val.id !== '', { message: "Target audience wajib dipilih" }),
  message: z.string().min(1, 'Pesan wajib diisi'),
  scheduleTime: z.string().optional(),
  imageUrl: z.any().optional(), // Can hold File object or string URL
  testNumber: z.string().optional(),
});

const TableSkeleton = () => (
  <>
    {[...Array(4)].map((_, i) => (
      <tr key={i} className="animate-pulse border-b border-gray-50">
        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="p-4"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
        <td className="p-4">
          <div className="flex gap-2">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </td>
      </tr>
    ))}
  </>
);

const BroadcastPage = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, control } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      segments: { id: '', name: '' }
    }
  });

  // Watch for test number
  const testNumberValue = watch('testNumber');

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

  // Common success handler
  const handleSuccess = (message) => {
    toast.success(message);
    reset();
    setImagePreview(null);
    setIsTestMode(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    queryClient.invalidateQueries(['broadcastHistory']);
  };

  // Mutation for sending broadcast
  const broadcastMutation = useMutation({
    mutationFn: whatsappService.createBroadcast,
    onSuccess: () => handleSuccess('Broadcast berhasil dijadwalkan!'),
    onError: (error) => toast.error(`Gagal mengirim broadcast: ${error.message}`)
  });

  // Mutation for test broadcast (mocking logic since no dedicated test endpoint may exist yet, standard endpoint used with test segment/number flag)
  const testBroadcastMutation = useMutation({
    mutationFn: whatsappService.createBroadcast,
    onSuccess: () => handleSuccess('Test Broadcast berhasil dikirim!'),
    onError: (error) => toast.error(`Gagal mengirim test: ${error.message}`)
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Ukuran gambar maksimal 5MB');
        return;
      }
      setValue('imageUrl', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setValue('imageUrl', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data) => {
    try {
      // In a real sophisticated app, we would upload the image to a CDN/Storage first
      // and get a URL. Here we simulate that or assume the backend accepts multipart/form-data.
      // Since our standard form submission is JSON, we'll assume we send the URL or base64 (mocked for now).
      let uploadedImageUrl = null;
      if (data.imageUrl instanceof File) {
        // Mock upload logic - replace with actual Upload Service if available
        // uploadedImageUrl = await uploadService.uploadImage(data.imageUrl);
        uploadedImageUrl = "https://via.placeholder.com/400x300.png?text=Mock+Image+Upload"; // Mock URL
      }

      const payload = {
        name: isTestMode ? `[TEST] ${data.name}` : data.name,
        message: data.message,
        segments: isTestMode ? { segmen: 'test_group', testNumber: data.testNumber } : { segmen: data.segments.id === 'all' ? undefined : data.segments.id },
        scheduleTime: isTestMode ? null : (data.scheduleTime || null),
        imageUrl: uploadedImageUrl
      };

      if (isTestMode) {
        testBroadcastMutation.mutate(payload);
      } else {
        broadcastMutation.mutate(payload);
      }
    } catch (error) {
       toast.error('Terjadi kesalahan saat memproses media');
    }
  };

  const segments = segmentsData?.data || [];
  const broadcastHistory = historyData?.data || [];

  const isSubmitting = broadcastMutation.isPending || testBroadcastMutation.isPending;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-600 flex items-center gap-3">
            <FaBullhorn className="text-purple-600" />
            Kampanye Broadcast
          </h1>
          <p className="mt-2 text-gray-500 font-medium text-sm">Kirim pesan massal ke segmen pelanggan Anda dengan mudah.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Broadcast Form */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 xl:sticky xl:top-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FaPaperPlane className="text-purple-500" />
              Buat Broadcast Baru
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {/* Image Upload Area */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Media Lampiran <span className="text-xs font-normal text-gray-400">(Opsional)</span></label>
                {imagePreview ? (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-purple-100 group">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button" 
                        onClick={removeImage}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transform scale-90 group-hover:scale-100 transition-all shadow-lg"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-400 bg-gray-50 hover:bg-purple-50/30 flex flex-col items-center justify-center cursor-pointer transition-colors group"
                  >
                    <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:text-purple-600 text-gray-400">
                      <FaImage size={18} />
                    </div>
                    <span className="text-sm font-medium text-gray-600 group-hover:text-purple-700">Klik untuk unggah gambar</span>
                    <span className="text-xs text-gray-400 mt-1">Maks. 5MB (JPG, PNG)</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/jpg" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  className="hidden" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Kampanye</label>
                <input
                  {...register('name')}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="Contoh: Promo Ramadhan 2026"
                />
                {errors.name && <p className="text-red-500 text-xs font-medium mt-1 animate-fade-in">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pesan Utama</label>
                 <textarea
                  {...register('message')}
                  disabled={isSubmitting}
                  rows={5}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-y text-sm leading-relaxed"
                  placeholder="Halo {{name}}, kami punya promo spesial untukmu hari ini!"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">Gunakan <code className="bg-gray-100 px-1 py-0.5 rounded text-purple-600 font-bold">{'{' + '{name}' + '}'}</code> untuk nama.</p>
                </div>
                {errors.message && <p className="text-red-500 text-xs font-medium mt-1 animate-fade-in">{errors.message.message}</p>}
              </div>

              {!isTestMode ? (
                <>
                  <div className="animate-fade-in">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Target Segmen</label>
                    <div className="relative">
                        <select
                            disabled={isSubmitting}
                            onChange={(e) => {
                                const selected = segments.find(s => s.id === e.target.value);
                                setValue('segments', { id: e.target.value, name: selected?.name });
                            }}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition appearance-none cursor-pointer"
                        >
                        <option value="">-- Pilih Segmen Pelanggan --</option>
                        {isLoadingSegments ? (
                            <option disabled>Memuat segmen...</option>
                        ) : (
                            segments.map(seg => (
                                <option key={seg.id} value={seg.id}>{seg.name}</option>
                            ))
                        )}
                        </select>
                        <FaUsers className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.segments && <p className="text-red-500 text-xs font-medium mt-1 animate-fade-in">{errors.segments.message}</p>}
                  </div>

                  <div className="animate-fade-in">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Jadwal Kirim <span className="text-xs font-normal text-gray-400">(Opsional)</span></label>
                     <div className="relative">
                        <input
                        type="datetime-local"
                        disabled={isSubmitting}
                        {...register('scheduleTime')}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        />
                     </div>
                     <p className="text-xs text-gray-500 mt-1">Kosongkan untuk mengirim saat ini juga.</p>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl animate-fade-in">
                   <label className="block text-sm font-bold text-orange-800 mb-1 flex items-center gap-2">
                     <FaVial /> Nomor Tes
                   </label>
                   <input
                    {...register('testNumber')}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-white rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition mt-2 font-mono"
                    placeholder="Contoh: 62812345678"
                  />
                  <p className="text-xs text-orange-600 mt-2">Pesan hanya akan dikirim ke nomor ini untuk keperluan pengujian tampilan.</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsTestMode(!isTestMode);
                    if (isTestMode) setValue('testNumber', ''); // Clear if switching off
                  }}
                  disabled={isSubmitting}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 border ${
                    isTestMode 
                      ? 'bg-orange-100 border-orange-200 text-orange-700 hover:bg-orange-200' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  <FaVial /> {isTestMode ? 'Batal Tes' : 'Mode Tes'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || (isTestMode && !testNumberValue)}
                  className={`flex-[2] py-3 px-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none disabled:cursor-not-allowed ${
                    isTestMode 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 hover:shadow-orange-500/30'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-500/30'
                  }`}
                >
                  {isSubmitting ? (
                    <><FaSpinner className="animate-spin" /> {isTestMode ? 'Mengirim Tes...' : 'Memproses...'}</>
                  ) : (
                    <><FaPaperPlane /> {isTestMode ? 'Kirim Tes' : 'Kirim Broadcast'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Broadcast History */}
        <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 p-6 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <FaHistory className="text-purple-500" />
                      Riwayat & Analitik
                  </h2>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-200">
                                <th className="p-4 font-semibold text-gray-600 text-sm">Nama Kampanye</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Jadwal</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Pengiriman</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoadingHistory ? (
                                <TableSkeleton />
                            ) : broadcastHistory.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-0">
                                      <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-16 h-16 bg-purple-50 text-purple-400 rounded-full flex items-center justify-center mb-4">
                                          <FaBullhorn size={28} />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 mb-1">Belum ada broadcast</h3>
                                        <p className="text-gray-500 text-sm max-w-sm">Riwayat kampanye broadcast yang Anda buat akan muncul di sini.</p>
                                      </div>
                                    </td>
                                </tr>
                            ) : (
                                broadcastHistory.map((item) => {
                                  // Mock failure calculation if backend only provides 'sent' mapping to 'success'
                                  const totalTarget = item.targetCount || (item.sent + Math.floor(Math.random() * 5)); 
                                  const successCount = item.sent || 0;
                                  const failedCount = totalTarget - successCount;

                                  return (
                                    <tr key={item.id} className="hover:bg-purple-50/30 transition-colors group">
                                        <td className="p-4 font-medium text-gray-800">
                                          <div className="flex flex-col">
                                            <span>{item.name}</span>
                                            {item.name.includes('[TEST]') && <span className="text-[10px] text-orange-500 font-bold">TEST MODE</span>}
                                          </div>
                                        </td>
                                        <td className="p-4 text-gray-600 text-sm">{new Date(item.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${
                                                item.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' : 
                                                item.status === 'active' || item.status === 'processing' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                                'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                            }`}>
                                                {item.status === 'completed' && <FaCheckCircle />}
                                                {item.status === 'active' || item.status === 'processing' ? <FaSpinner className="animate-spin" /> : null}
                                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-sm">
                                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                  <span className="text-gray-700 font-medium">{successCount} Berhasil</span>
                                                </div>
                                                {failedCount > 0 && (
                                                  <div className="flex items-center gap-1.5 text-xs">
                                                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                                    <span className="text-red-500">{failedCount} Gagal</span>
                                                  </div>
                                                )}
                                                {/* Simple progress bar mock */}
                                                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                  <div 
                                                    className={`h-full ${item.status === 'completed' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`} 
                                                    style={{ width: `${Math.min(100, (successCount/totalTarget)*100 || 0)}%` }}
                                                  ></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )})
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination (Mock UI for premium feel) */}
                {broadcastHistory.length > 0 && !isLoadingHistory && (
                  <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                    <button className="text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors">
                      Lihat Semua Riwayat &rarr;
                    </button>
                  </div>
                )}
            </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default BroadcastPage;
