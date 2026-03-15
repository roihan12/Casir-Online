import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import whatsappService from '../services/whatsappService';
import {
  useBotStatus,
  useUpdateBotConfig,
  useRestartBot,
  useLogoutBot,
  useGetDevices,
  useCreateDevice,
  useRemoveDevice
} from '../hooks/useWhatsapp';
import {
  FaRobot, FaQrcode, FaPlug, FaSave, FaSync,
  FaCheckCircle, FaExclamationCircle, FaPhoneAlt, FaGlobe, FaCogs,
  FaMobileAlt, FaPlus, FaTrash, FaArrowLeft
} from 'react-icons/fa';

const schema = z.object({
  name: z.string().min(1, 'Nama bot wajib diisi'),
  phoneNumber: z.string().min(10, 'Nomor telepon tidak valid'),
  apiUrl: z.string().url('URL Webhook tidak valid').optional().or(z.literal('')),
  autoReply: z.boolean().default(false),
});

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 h-96 bg-gray-200 rounded-2xl"></div>
      <div className="lg:col-span-2 h-96 bg-gray-200 rounded-2xl"></div>
    </div>
  </div>
);

const BotConfigPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { botId } = useParams();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!botId) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <FaExclamationCircle className="text-5xl text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-800 mb-2">Bot ID Required</h3>
          <p className="text-red-600 mb-4">Please select a bot from the list to manage its configuration.</p>
          <button
            onClick={() => navigate('/whatsapp')}
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
          >
            Back to Bot List
          </button>
        </div>
      </div>
    );
  }

  // Fetch Bot Status & QR for specific bot
  const { data: status, isLoading: isLoadingStatus, refetch: refetchStatus } = useBotStatus(botId);

  // Show notification when device is auto-created
  useEffect(() => {
    if (status?.deviceAutoCreated) {
      toast.success('Device baru berhasil dibuat! Silakan scan QR code untuk menghubungkan.');
    }
  }, [status?.deviceAutoCreated]);

  // Fetch Bot Config for form defaults
  const { data: config, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['bot-config', botId],
    queryFn: async () => {
      const configs = await whatsappService.getBotConfigs();
      return Array.isArray(configs) ? configs.find(c => c.bot_config_id === botId) : null;
    },
    enabled: !!botId,
  });

  // Hooks for Devices & Auth
  const { data: devicesData, isLoading: isLoadingDevices } = useGetDevices();
  const createDeviceMutation = useCreateDevice();
  const removeDeviceMutation = useRemoveDevice();
  const restartBotMutation = useRestartBot();
  const logoutBotMutation = useLogoutBot();

  // Blend primary device state with fetched devices
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const rawDevices = Array.isArray(devicesData) ? devicesData : [];
    const mainDeviceId = status?.deviceId || config?.deviceId;
    
    // Construct mapped device list
    let mappedDevices = rawDevices.map((d) => ({
      id: d.device || d.id || d.device_id, // fallback based on API structure
      name: d.name || d.device || d.id || 'Perangkat',
      phone: d.phone || d.device || d.id || 'N/A',
      status: (d.status || d.state || 'disconnected').toLowerCase(),
      isPrimary: (d.device || d.id || d.device_id) === mainDeviceId
    }));

    // If API is empty or main device missing from APi due to some sync issue, mock the primary device
    if (!mappedDevices.find(d => d.isPrimary) && mainDeviceId) {
      mappedDevices = [
        { 
          id: mainDeviceId, 
          name: 'Primary Device', 
          phone: status?.phoneNumber || config?.phoneNumber || mainDeviceId, 
          status: status?.state === 'connected' || status?.state === 'logged_in' ? 'connected' : 'disconnected', 
          isPrimary: true 
        },
        ...mappedDevices
      ];
    } else if (mappedDevices.length === 0) {
       mappedDevices = [
        { 
          id: 'dev_1', 
          name: 'Primary Device', 
          phone: status?.phoneNumber || config?.phoneNumber, 
          status: status?.state === 'connected' || status?.state === 'logged_in' ? 'connected' : 'disconnected', 
          isPrimary: true 
        }
       ]
    }

    setDevices(mappedDevices);
  }, [devicesData, status, config]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: 'Bot WhatsApp Cerdas',
      phoneNumber: '',
      apiUrl: '',
      autoReply: true,
    }
  });

  // Update form when config is loaded
  useEffect(() => {
    if (config) {
      reset({
        name: config.name || 'Bot WhatsApp Cerdas',
        phoneNumber: config.phoneNumber || '',
        apiUrl: config.apiUrl || '',
        autoReply: config.isActive || false, 
      });
    }
  }, [config, reset]);

  // Update Config Mutation
  const updateConfigMutation = useUpdateBotConfig();

  const handleBack = () => {
    navigate('/whatsapp');
  };

  const handleRefreshQR = async () => {
    setIsRefreshing(true);
    await refetchStatus();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const onSubmit = (data) => {
    updateConfigMutation.mutate({
      id: botId,
      name: data.name,
      phoneNumber: data.phoneNumber,
      apiUrl: data.apiUrl,
      isActive: data.autoReply,
      cabangId: config?.cabangId
    });
  };

  const handleLogoutMain = () => {
    if (window.confirm('Yakin ingin memutuskan koneksi perangkat utama (Logout)?')) {
      logoutBotMutation.mutate(botId);
    }
  };

  const handleAddDevice = () => {
    const desc = window.prompt("Masukkan nama/deskripsi untuk perangkat baru:");
    if (desc) {
      createDeviceMutation.mutate(desc);
    }
  };

  const handleRemoveDevice = (id) => {
    if (window.confirm('Yakin ingin menghapus perangkat ini?')) {
      const device = devices.find(d => d.id === id);
      if (device?.isPrimary || id === 'dev_1' || id === status?.deviceId || id === config?.deviceId) {
        toast.error('Gunakan tombol "Putuskan Perangkat Utama" untuk memutuskan perangkat ini.');
        return;
      }
      removeDeviceMutation.mutate(id);
    }
  };

  const isConnected = status?.state === 'connected' || status?.state === 'logged_in';

  if (isLoadingConfig && !config) {
    return <div className="p-6 max-w-7xl mx-auto"><LoadingSkeleton /></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Bot List"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 flex items-center gap-3">
              <FaRobot className="text-blue-600" />
              {config?.name || 'Bot Configuration'}
            </h1>
            <p className="mt-2 text-gray-500 font-medium text-sm md:text-base">
              {config?.nama_cabang || 'Unknown Branch'} • Manage your WhatsApp bot connection and settings
            </p>
          </div>
        </div>

        <div className="mt-4 md:mt-0">
          <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-sm backdrop-blur-sm transition-all duration-300 ${
            isConnected
            ? 'bg-green-50/80 border-green-200 text-green-700'
            : 'bg-amber-50/80 border-amber-200 text-amber-700'
          }`}>
            <div className="relative flex h-3 w-3">
              {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-green-500' : 'bg-amber-500'}`}></span>
            </div>
            <span className="font-semibold text-sm">
              {isConnected ? `Online (${status?.phoneNumber || config?.phone_number})` : 'Menunggu Koneksi'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Connection Widget (Left Column) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] group">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaQrcode className="text-indigo-500" />
                Status Koneksi
              </h2>
              {isConnected && <FaCheckCircle className="text-green-500 text-xl" />}
            </div>
            
            <div className="p-6">
              {isConnected ? (
                <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in-up">
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20"></div>
                    <div className="absolute inset-2 bg-green-50 rounded-full"></div>
                    <FaCheckCircle className="absolute inset-0 m-auto text-green-500 text-5xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Perangkat Terhubung</h3>
                  <p className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full font-mono mt-2 mb-6 border border-gray-100">
                    {status.phoneNumber || 'Terdeteksi'}
                  </p>
                  
                  <button 
                    onClick={handleLogoutMain}
                    disabled={logoutBotMutation.isPending}
                    className="w-full py-2.5 px-4 text-red-600 bg-red-50 hover:bg-red-100 font-semibold rounded-xl transition-colors duration-200 border border-red-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <FaPlug /> {logoutBotMutation.isPending ? "Memutuskan..." : "Putuskan Perangkat Utama"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center animate-fade-in">
                  <div className="w-56 h-56 bg-white p-3 rounded-2xl shadow-inner border border-gray-100 mb-6 flex items-center justify-center relative overflow-hidden group-hover:border-indigo-200 transition-colors">
                    {status?.qrCode ? (
                      <img 
                        src={status.qrCode} 
                        alt="Scan QR" 
                        className="w-full h-full object-contain filter contrast-125"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-gray-400 gap-3">
                        <FaSync className="animate-spin text-3xl" />
                        <span className="text-sm font-medium">Melakukan generate QR...</span>
                      </div>
                    )}
                    
                    {/* Visual scanning line effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-400 opacity-50 shadow-[0_0_10px_2px_rgba(74,222,128,0.5)] animate-scan"></div>
                  </div>
                  
                  <div className="text-center w-full space-y-4">
                    <div className="bg-indigo-50 text-indigo-800 text-xs px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-2">
                       <FaExclamationCircle className="text-indigo-600" />
                       Buka WhatsApp di HP Anda, pilh Tautkan Perangkat.
                    </div>
                    
                    <button 
                      onClick={handleRefreshQR}
                      disabled={isRefreshing || isLoadingStatus}
                      className="w-full py-2.5 px-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      <FaSync className={`${isRefreshing ? 'animate-spin' : ''} text-gray-500`} /> 
                      {isRefreshing ? 'Memperbarui...' : 'Perbarui QR Code'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
             <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
             
             <div className="relative z-10">
               <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                 <FaRobot /> Engine Status
               </h3>
               <div className="space-y-3 mt-4 text-sm text-indigo-100">
                  <div className="flex justify-between items-center border-b border-indigo-500/30 pb-2">
                    <span>Service Engine</span>
                    <span className="bg-green-500/20 text-green-100 border border-green-500/30 px-2 py-0.5 rounded text-xs font-semibold">Aktif</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-indigo-500/30 pb-2">
                    <span>Auto Reply</span>
                    <span className="font-semibold">{config?.isActive ? 'Menyala' : 'Mati'}</span>
                  </div>
               </div>
             </div>
          </div>
        </div>

        {/* Configuration Form & Device Multi-Management (Right Column) */}
        <div className="lg:col-span-8 space-y-8">
          {/* General Settings */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden transform transition-all duration-300">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaCogs className="text-blue-500" />
                Pengaturan Umum
              </h2>
              <p className="text-sm text-gray-500 mt-1">Konfigurasikan identitas bot dan URL Webhook untuk menghubungkan sistem.</p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <FaRobot className="text-gray-400" /> Nama Bot Pendamping
                  </label>
                  <input
                    {...register('name')}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                    placeholder="Contoh: CS Toko Keren"
                  />
                  {errors.name && <p className="text-red-500 text-xs font-medium animate-fade-in">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <FaPhoneAlt className="text-gray-400" /> Nomor Bot Utama
                  </label>
                  <input
                    {...register('phoneNumber')}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 font-mono"
                    placeholder="Contoh: 62812345678"
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-xs font-medium animate-fade-in">{errors.phoneNumber.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <FaGlobe className="text-gray-400" /> Webhook URL <span className="text-xs font-normal text-gray-400">(Opsional)</span>
                </label>
                <input
                  {...register('apiUrl')}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 font-mono text-sm"
                  placeholder="https://domain-anda.com/api/webhook"
                />
                <p className="text-xs text-gray-500 mt-1">Gunakan ini jika Anda memiliki server eksternal untuk endpoint balasan kustom.</p>
                {errors.apiUrl && <p className="text-red-500 text-xs font-medium animate-fade-in">{errors.apiUrl.message}</p>}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="relative flex items-start py-4 px-5 bg-blue-50/50 rounded-xl border border-blue-100/50 cursor-pointer hover:bg-blue-50 transition-colors group">
                  <div className="flex items-center h-6">
                    <input
                      id="autoReply"
                      type="checkbox"
                      {...register('autoReply')}
                      disabled={isSubmitting}
                      className="w-5 h-5 text-blue-600 rounded bg-white border-gray-300 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer"
                    />
                  </div>
                  <div className="ml-3 text-sm flex-1">
                    <label htmlFor="autoReply" className="font-bold text-gray-800 cursor-pointer group-hover:text-blue-700 transition-colors">
                      Aktifkan Auto-Reply & Broadcast
                    </label>
                    <p className="text-gray-500 mt-1">Mengizinkan engine membaca pesan masuk dan mengirim balasan template secara otomatis, serta membuka gerbang sinkronasi data untuk broadcast list.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <><FaSync className="animate-spin" /> Menyimpan...</>
                  ) : (
                    <><FaSave className="text-lg" /> Simpan Perubahan</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Device Multi-Management */}
          {isLoadingDevices && !devices.length ? (
            <div className="py-8"><FaSync className="animate-spin text-3xl text-purple-500 mx-auto" /></div>
          ) : (
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden mt-8">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FaMobileAlt className="text-purple-500" />
                    Manajemen Perangkat
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Gunakan WhatsApp di berbagai perangkat tertaut.</p>
                </div>
                <button 
                  onClick={handleAddDevice}
                  disabled={createDeviceMutation.isPending}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-semibold transition-colors border border-purple-200 disabled:opacity-50"
                >
                  <FaPlus /> {createDeviceMutation.isPending ? "Menambahkan..." : "Tambah Perangkat"}
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {devices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${device.state === 'logged_in' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          <FaMobileAlt className="text-2xl" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <h4 className="font-bold text-gray-800">{device.display_name}</h4>

                          </div>
                          <p className="text-sm text-gray-500 font-mono mt-0.5">{device.jid?.replace('@s.whatsapp.net', '') || 'Nomor tidak diketahui'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 hidden md:flex">
                          <span className={`w-2 h-2 rounded-full ${device.state === 'logged_in' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          <span className="text-xs font-medium text-gray-600">{device.state === 'logged_in' ? 'Terhubung' : 'Terputus'}</span>
                        </div>
                        <button 
                           onClick={() => handleRemoveDevice(device.id)}
                           disabled={removeDeviceMutation.isPending && removeDeviceMutation.variables === device.id}
                           className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                           title="Hapus Perangkat"
                        >
                          {removeDeviceMutation.isPending && removeDeviceMutation.variables === device.id ? <FaSync className="animate-spin" /> : <FaTrash />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={handleAddDevice}
                  disabled={createDeviceMutation.isPending}
                  className="mt-6 w-full md:hidden flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold transition-colors border border-purple-200 disabled:opacity-50"
                >
                  <FaPlus /> {createDeviceMutation.isPending ? "Menambahkan..." : "Tambah Perangkat Lain"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Required CSS for custom animations inside tailwind layers (could be in index.css, placing here via inline style for safety since no access to index.css) */}
      <style>{`
        @keyframes scan {
          0% { top: -10%; }
          50% { top: 110%; }
          100% { top: -10%; }
        }
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
        .animate-fade-in {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default BotConfigPage;
