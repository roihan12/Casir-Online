import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import whatsappService from '../services/whatsappService';
import { FaRobot, FaQrcode, FaPlug, FaSave, FaSync, FaCheckDouble } from 'react-icons/fa';

const schema = z.object({
  botName: z.string().min(1, 'Nama bot wajib diisi'),
  phoneNumber: z.string().min(10, 'Nomor telepon tidak valid'),
  webhookUrl: z.string().url('URL Webhook tidak valid').optional().or(z.literal('')),
  autoReply: z.boolean().default(false),
});

const BotConfigPage = () => {
  const queryClient = useQueryClient();
  
  // Fetch Bot Status & QR
  const { data: status, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: whatsappService.getBotStatus,
    refetchInterval: (data) => {
      // Stop polling if connected or logged in
      console.log("status", data);
      if (data?.state?.data?.state === 'connected' || data?.state?.data?.state === 'logged_in') {
        return false;
      }
      return 30000; // Poll every 30 seconds to match QR expiry
    },
  });

  console.log("status", status);

  // Fetch Bot Config for form defaults
  const { data: config } = useQuery({
    queryKey: ['whatsapp-config'],
    queryFn: whatsappService.getBotConfig,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      botName: 'My Business Bot',
      phoneNumber: '',
      webhookUrl: '',
      autoReply: true,
    }
  });

  // Update form when config is loaded
  React.useEffect(() => {
    if (config) {
      reset({
        botName: config.name || 'My Business Bot',
        phoneNumber: config.phoneNumber || '',
        webhookUrl: config.apiUrl || '',
        autoReply: config.autoReply || false, // Assuming schema has this
      });
    }
  }, [config, reset]);

  // Update Config Mutation
  const updateConfigMutation = useMutation({
    mutationFn: whatsappService.updateBotConfig,
    onSuccess: () => {
      queryClient.invalidateQueries(['whatsapp-config']);
      // Ideally show a toast here
      alert('Konfigurasi berhasil disimpan!');
    },
    onError: (error) => {
        alert(`Gagal menyimpan: ${error.message}`);
    }
  });

  const onSubmit = (data) => {
    updateConfigMutation.mutate(data);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaRobot className="text-blue-600" />
          Konfigurasi Bot WhatsApp
        </h1>
        <div className="flex items-center gap-2">
            {status?.state === 'connected' || status?.state === 'logged_in' ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Connected: {status.phoneNumber}
                </span>
            ) : (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Disconnected
                </span>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Status & QR */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaQrcode className="text-gray-500" />
              Koneksi Perangkat
            </h2>
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              {status?.state === 'connected' || status?.state === 'logged_in' ? (
                  <div className="text-center">
                      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaCheckDouble size={32} />
                      </div>
                      <p className="font-medium text-gray-900">WhatsApp Terhubung</p>
                      <p className="text-sm text-gray-500 mt-1">{status.phoneNumber}</p>
                      <button 
                        onClick={() => {/* Implement Logout */}}
                        className="mt-4 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition"
                      >
                        Putus Koneksi
                      </button>
                  </div>
              ) : (
                  <>
                    <div className="w-48 h-48 bg-white p-2 rounded-lg shadow-sm mb-4">
                        {status?.qrCode ? (
                            <img 
                                src={status.qrCode} 
                                alt="Scan QR" 
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                                {isLoadingStatus ? 'Loading...' : 'Waiting for QR...'}
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 text-center mb-4">
                        QR akan berakhir dalam {status?.qrDuration} detik auto refresh
                    </p>
                    <p className="text-sm text-gray-500 text-center mb-4">
                        Scan QR code ini dengan aplikasi WhatsApp Anda untuk menghubungkan bot.
                    </p>
                    <button 
                        onClick={() => queryClient.invalidateQueries(['whatsapp-status'])}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
                    >
                        <FaSync /> Refresh QR
                    </button>
                  </>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <FaPlug className="text-gray-500" />
              Pengaturan Umum
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bot</label>
                  <input
                    {...register('botName')}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Contoh: CS Toko Online"
                  />
                  {errors.botName && <p className="text-red-500 text-xs mt-1">{errors.botName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
                  <input
                    {...register('phoneNumber')}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="628123456789"
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL (Opsional)</label>
                <input
                  {...register('webhookUrl')}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="https://your-domain.com/api/webhook"
                />
                {errors.webhookUrl && <p className="text-red-500 text-xs mt-1">{errors.webhookUrl.message}</p>}
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="autoReply"
                  {...register('autoReply')}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="autoReply" className="text-sm text-gray-700 font-medium cursor-pointer">
                  Aktifkan Auto-Reply Standar
                </label>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <FaSave /> Simpan Konfigurasi
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotConfigPage;
