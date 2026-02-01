import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FaRobot, FaQrcode, FaPlug, FaSave, FaSync } from 'react-icons/fa';

const schema = z.object({
  botName: z.string().min(1, 'Nama bot wajib diisi'),
  phoneNumber: z.string().min(10, 'Nomor telepon tidak valid'),
  webhookUrl: z.string().url('URL Webhook tidak valid').optional().or(z.literal('')),
  autoReply: z.boolean().default(false),
});

const BotConfigPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      botName: 'My Business Bot',
      phoneNumber: '',
      webhookUrl: '',
      autoReply: true,
    }
  });

  const onSubmit = (data) => {
    console.log('Bot Config Data:', data);
    // TODO: Connect to API
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaRobot className="text-blue-600" />
          Konfigurasi Bot WhatsApp
        </h1>
        <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Connected
            </span>
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
              <div className="w-48 h-48 bg-white p-2 rounded-lg shadow-sm mb-4">
                 {/* Placeholder for QR Code */}
                 <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ExampleData" 
                    alt="Scan QR" 
                    className="w-full h-full object-contain opacity-50"
                 />
              </div>
              <p className="text-sm text-gray-500 text-center mb-4">
                Scan QR code ini dengan aplikasi WhatsApp Anda untuk menghubungkan bot.
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md">
                <FaSync /> Generate QR Baru
              </button>
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
