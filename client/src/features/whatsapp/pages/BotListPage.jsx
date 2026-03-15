import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FaRobot, FaPlus, FaEdit, FaTrash, FaQrcode,
  FaCheckCircle, FaTimesCircle, FaSpinner, FaChevronRight,
  FaWhatsapp, FaPhoneAlt, FaGlobe, FaSave
} from 'react-icons/fa';
import { useBotConfigs, useDeleteBotConfig, useCreateBotConfig } from '../hooks/useWhatsapp';
import toast from 'react-hot-toast';
import useAuth from '../../../common/hooks/useAuth';

// Validation schema for creating bot config
const createBotSchema = z.object({
  name: z.string().min(1, 'Nama bot wajib diisi'),
  cabangId: z.string().min(1, 'Cabang wajib dipilih'),
  platformType: z.enum(['whatsapp', 'telegram', 'messenger']).default('whatsapp'),
  phoneNumber: z.string().optional(),
  apiUrl: z.string().url('URL API tidak valid').optional().or(z.literal('')),
  webhookUrl: z.string().url('URL Webhook tidak valid').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ onCreate }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
      <FaRobot className="text-4xl text-indigo-500" />
    </div>
    <h3 className="text-2xl font-bold text-gray-800 mb-2">No WhatsApp Bots Found</h3>
    <p className="text-gray-500 text-center mb-8 max-w-md">
      You haven't configured any WhatsApp bots yet. Create a new bot to start automating your customer conversations.
    </p>
    <button
      onClick={onCreate}
      className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2"
    >
      <FaPlus /> Create Your First Bot
    </button>
  </div>
);

// Create Bot Modal Component
const CreateBotModal = ({ isOpen, onClose, cabangList }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(createBotSchema),
    defaultValues: {
      name: '',
      cabangId: '',
      platformType: 'whatsapp',
      phoneNumber: '',
      webhookUrl: '',
      apiUrl: '',
      isActive: true,
    }
  });

  const createMutation = useCreateBotConfig();

  const onSubmit = (data) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FaRobot className="text-2xl text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Create New Bot</h2>
                <p className="text-indigo-100 text-sm">Add a WhatsApp bot for your branch</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <FaTimesCircle   className="text-xl" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          {/* Bot Name */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <FaRobot className="text-indigo-500" />
              Bot Name *
            </label>
            <input
              {...register('name')}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
              placeholder="e.g., Customer Service Bot"
            />
            {errors.name && <p className="text-red-500 text-xs font-medium">{errors.name.message}</p>}
          </div>

          {/* Platform Type */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Platform *</label>
            <select
              {...register('platformType')}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="messenger">Messenger</option>
            </select>
            {errors.platformType && <p className="text-red-500 text-xs font-medium">{errors.platformType.message}</p>}
          </div>

          {/* Branch Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Branch *</label>
            <select
              {...register('cabangId')}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
            >
              <option value="">Select a branch</option>
              {cabangList.map((cabang) => (
                <option key={cabang.id || cabang.cabangId} value={cabang.id || cabang.cabangId}>
                  {cabang.namaCabang}
                </option>
              ))}
            </select>
            {errors.cabangId && <p className="text-red-500 text-xs font-medium">{errors.cabangId.message}</p>}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <FaPhoneAlt className="text-indigo-500" />
              Phone Number
            </label>
            <input
              {...register('phoneNumber')}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 font-mono"
              placeholder="e.g., 62812345678"
            />
            {errors.phoneNumber && <p className="text-red-500 text-xs font-medium">{errors.phoneNumber.message}</p>}
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <FaGlobe className="text-indigo-500" />
                Webhook URL
              </label>
              <input
                {...register('webhookUrl')}
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 font-mono text-xs"
                placeholder="https://your-domain.com/api/webhook"
              />
              {errors.webhookUrl && <p className="text-red-500 text-xs font-medium">{errors.webhookUrl.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <FaGlobe className="text-indigo-500" />
                API URL
              </label>
              <input
                {...register('apiUrl')}
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 font-mono text-xs"
                placeholder="Internal/Other API URL"
              />
              {errors.apiUrl && <p className="text-red-500 text-xs font-medium">{errors.apiUrl.message}</p>}
            </div>
          </div>

          {/* Auto Reply Toggle */}
          <div className="relative flex items-start py-4 px-5 bg-indigo-50/50 rounded-xl border border-indigo-100/50 cursor-pointer hover:bg-indigo-50 transition-colors">
            <div className="flex items-center h-6">
              <input
                id="isActive"
                type="checkbox"
                {...register('isActive')}
                disabled={isSubmitting}
                className="w-5 h-5 text-indigo-600 rounded bg-white border-gray-300 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer"
              />
            </div>
            <div className="ml-3 text-sm flex-1">
              <label htmlFor="isActive" className="font-bold text-gray-800 cursor-pointer">
                Enable Auto-Reply
              </label>
              <p className="text-gray-500 mt-1">Automatically respond to incoming messages</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 mt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <FaSave /> Create Bot
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BotCard = ({ bot, onEdit, onDelete }) => {
  const isConnected = bot.device_id && bot.is_active;
  const statusColor = isConnected
    ? 'bg-green-100 text-green-700 border-green-200'
    : 'bg-amber-100 text-amber-700 border-amber-200';

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1">
      {/* Header with gradient background */}
      <div className={`bg-gradient-to-r ${isConnected ? 'from-green-500 to-emerald-600' : 'from-gray-400 to-gray-500'} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <FaWhatsapp className="text-2xl text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">BOT WA</h3>
              <p className="text-white/80 text-sm">{bot.nama_cabang || 'Unknown Branch'}</p>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${statusColor} backdrop-blur-sm bg-white/90`}>
            {isConnected ? 'Connected' : bot.device_id ? 'Disconnected' : 'Not Configured'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Phone Number</span>
            <span className="font-mono font-semibold text-gray-800">
              {bot.phone_number || bot.device_id || 'Not set'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Device ID</span>
            <span className="font-mono text-xs text-gray-600 truncate max-w-[200px]" title={bot.device_id}>
              {bot.device_id || 'Not configured'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Auto Reply</span>
            <span className={`font-semibold ${bot.is_active ? 'text-green-600' : 'text-gray-400'}`}>
              {bot.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(bot)}
            className="flex-1 px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <FaQrcode /> Manage
          </button>
          <button
            onClick={() => onDelete(bot)}
            className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200"
            title="Delete bot"
          >
            <FaTrash />
          </button>
        </div>
      </div>
    </div>
  );
};

const BotListPage = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch bot configurations
  const { data: bots, isLoading, error } = useBotConfigs();

  const { getUserCabang } = useAuth();
  

  // Get cabang list from user object
  const cabangList = getUserCabang();

  const deleteMutation = useDeleteBotConfig();

  const handleCreateBot = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleManageBot = (bot) => {
    navigate(`/whatsapp/${bot.bot_config_id}`);
  };

  const handleDeleteBot = (bot) => {
    if (window.confirm(`Are you sure you want to delete "${bot.name || 'this bot'}"?`)) {
      deleteMutation.mutate(bot.bot_config_id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <FaTimesCircle className="text-5xl text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-800 mb-2">Failed to Load Bots</h3>
          <p className="text-red-600">{error.message || 'An error occurred while fetching bot configurations'}</p>
        </div>
      </div>
    );
  }

  const botList = Array.isArray(bots) ? bots : [];

  return (
    <>
      <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-600 flex items-center gap-3">
              <FaRobot className="text-indigo-600" />
              WhatsApp Bot Management
            </h1>
            <p className="mt-2 text-gray-500 font-medium">
              Manage your WhatsApp bot configurations for each branch
            </p>
          </div>
          <button
            onClick={handleCreateBot}
            className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2"
          >
            <FaPlus /> New Bot
          </button>
        </div>

        {/* Bot List */}
        {botList.length === 0 ? (
          <EmptyState onCreate={handleCreateBot} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {botList.map((bot) => (
              <BotCard
                key={bot.bot_config_id}
                bot={bot}
                onEdit={handleManageBot}
                onDelete={handleDeleteBot}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Bot Modal */}
      <CreateBotModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        cabangList={cabangList}
      />
    </>
  );
}

export default BotListPage;
