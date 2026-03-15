import React, { useState, useEffect, useRef } from 'react';
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
  useDeleteBotConfig,  // pastikan hook ini tersedia
} from '../hooks/useWhatsapp';
import {
  FaRobot, FaQrcode, FaPlug, FaSave, FaSync,
  FaCheckCircle, FaExclamationCircle, FaPhoneAlt,
  FaGlobe, FaCogs, FaArrowLeft, FaTrash, FaWifi,
  FaTimesCircle, FaShieldAlt, FaBell
} from 'react-icons/fa';

// ─── Validation Schema ────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(1, 'Nama bot wajib diisi'),
  phone_number: z.string().min(10, 'Nomor telepon tidak valid'),
  webhook_url: z.string().url('URL Webhook tidak valid').optional().or(z.literal('')),
  is_active: z.boolean().default(false),
});

// ─── QR Countdown Timer ───────────────────────────────────────────────────────
const QRCountdown = ({ duration = 30, onExpired }) => {
  const [seconds, setSeconds] = useState(duration);

  useEffect(() => {
    setSeconds(duration);
  }, [duration]);

  useEffect(() => {
    if (seconds <= 0) {
      onExpired?.();
      return;
    }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, onExpired]);

  const pct = (seconds / duration) * 100;
  const radius = 20;
  const circ = 2 * Math.PI * radius;
  const isUrgent = seconds <= 10;

  return (
    <div className="flex items-center gap-2">
      <svg width="48" height="48" viewBox="0 0 48 48" className="rotate-[-90deg]">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          stroke={isUrgent ? '#ef4444' : '#6366f1'}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <div>
        <p className={`text-xl font-bold font-mono leading-none ${isUrgent ? 'text-red-500' : 'text-gray-800'}`}>
          {String(seconds).padStart(2, '0')}s
        </p>
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">QR berlaku</p>
      </div>
    </div>
  );
};

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
const DeleteModal = ({ botName, onConfirm, onCancel, isLoading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-fade-in-up">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <FaTrash className="text-red-500 text-2xl" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Bot Ini?</h3>
        <p className="text-gray-500 text-sm mb-1">Anda akan menghapus bot:</p>
        <p className="font-bold text-gray-800 mb-4 bg-gray-50 px-4 py-2 rounded-lg w-full">
          "{botName}"
        </p>
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 w-full mb-6">
          Tindakan ini permanen dan tidak bisa dibatalkan.
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? <FaSync className="animate-spin text-sm" /> : <FaTrash className="text-sm" />}
            {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div className="animate-pulse">
    {/* Header */}
    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
      <div className="w-9 h-9 bg-gray-200 rounded-xl" />
      <div className="space-y-2 flex-1">
        <div className="h-7 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-1/4" />
      </div>
      <div className="h-10 w-32 bg-gray-200 rounded-xl" />
    </div>
    {/* Body */}
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-2 h-[480px] bg-gray-100 rounded-2xl" />
      <div className="lg:col-span-3 space-y-6">
        <div className="h-72 bg-gray-100 rounded-2xl" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const BotConfigPage = () => {
  const navigate = useNavigate();
  const { botId } = useParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [qrKey, setQrKey] = useState(0); // untuk reset countdown saat QR refresh

  // ── Guard: no botId ──
  if (!botId) {
    return (
      <div className="p-6 max-w-4xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center">
          <FaExclamationCircle className="text-5xl text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-800 mb-2">Bot ID tidak ditemukan</h3>
          <p className="text-red-600 text-sm mb-6">Silakan pilih bot dari daftar untuk melanjutkan.</p>
          <button
            onClick={() => navigate('/whatsapp')}
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
          >
            Kembali ke Daftar Bot
          </button>
        </div>
      </div>
    );
  }

  // ── Data Fetching ──
  const { data: status, isLoading: isLoadingStatus, refetch: refetchStatus } = useBotStatus(botId);



  const { data: config, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['bot-config', botId],
    queryFn: async () => {
      const configs = await whatsappService.getBotConfigs();
      return Array.isArray(configs) ? configs.find(c => c.bot_config_id === botId) : null;
    },
    enabled: !!botId,
  });

  // ── Mutations ──
  const updateConfigMutation = useUpdateBotConfig();
  const logoutBotMutation = useLogoutBot();
  const deleteConfigMutation = useDeleteBotConfig?.(); // opsional, sesuaikan hook

  // ── Form ──
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting, isDirty } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone_number: '',
      webhook_url: '',
      is_active: false,
    },
  });

  // FIX: gunakan snake_case sesuai API response
  useEffect(() => {
    if (config) {
      reset({
        name: config.name || '',
        phone_number: config.phone_number || '',
        webhook_url: config.webhook_url || '',
        is_active: config.is_active ?? false,
      });
    }
  }, [config, reset]);

  const watchedName = watch('name');
  const watchedIsActive = watch('is_active');

  // ── Derived state ──
  const isConnected = status?.state === 'connected' || status?.state === 'logged_in';

  // ── Handlers ──
  const handleRefreshQR = async () => {
    setIsRefreshing(true);
    setQrKey(k => k + 1);
    await refetchStatus();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const onSubmit = (data) => {
    updateConfigMutation.mutate(
      {
        id: botId,
        name: data.name,
        phone_number: data.phone_number,
        webhook_url: data.webhook_url,
        is_active: data.is_active,
        cabang_id: config?.cabang_id,
      },
      {
        onSuccess: () => toast.success('Konfigurasi berhasil disimpan!'),
        onError: () => toast.error('Gagal menyimpan konfigurasi.'),
      }
    );
  };

  const handleDelete = () => {
    deleteConfigMutation?.mutate(botId, {
      onSuccess: () => {
        toast.success('Bot berhasil dihapus.');
        navigate('/whatsapp');
      },
      onError: () => toast.error('Gagal menghapus bot.'),
    });
  };

  const handleLogout = () => {
    logoutBotMutation.mutate(botId, {
      onSuccess: () => {
        toast.success('Perangkat berhasil diputus.');
        refetchStatus();
      },
      onError: () => toast.error('Gagal memutus perangkat.'),
    });
  };

  // ── Loading state ──
  if (isLoadingConfig && !config) {
    return <div className="p-6 md:p-10 max-w-6xl mx-auto"><LoadingSkeleton /></div>;
  }

  return (
    <>
      {showDeleteModal && (
        <DeleteModal
          botName={config?.name || watchedName || 'Bot ini'}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          isLoading={deleteConfigMutation?.isPending}
        />
      )}

      <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-[calc(100vh-4rem)]">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-gray-100 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/whatsapp')}
              className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              title="Kembali"
            >
              <FaArrowLeft />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-gray-900 leading-none">
                  {watchedName || config?.name || 'Bot Configuration'}
                </h1>
                {/* Live auto-reply status badge */}
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  watchedIsActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}>
                  {watchedIsActive ? 'Auto-Reply ON' : 'Auto-Reply OFF'}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1 font-medium">
                {config?.nama_cabang || 'Unknown Branch'}
                {config?.cabang_id && <span className="ml-2 text-gray-300">· {config.cabang_id}</span>}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-sm transition-colors"
            >
              <FaTrash className="text-xs" />
              Hapus Bot
            </button>
            <button
              type="submit"
              form="bot-config-form"
              disabled={isSubmitting || !isDirty}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-sm transition-colors shadow-sm shadow-indigo-200 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <FaSync className="animate-spin text-xs" /> : <FaSave className="text-xs" />}
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>

        {/* ── Body Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ════ LEFT: WhatsApp Connection Panel ════ */}
          <div className="lg:col-span-2 space-y-5">

            {/* Connection Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                  <FaQrcode className="text-indigo-500" />
                  Koneksi WhatsApp
                </h2>
                {/* Connection status pill */}
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isConnected
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                  {isConnected ? 'Terhubung' : 'Belum Terhubung'}
                </span>
              </div>

              <div className="p-6">
                {isConnected ? (
                  /* ── Connected State ── */
                  <div className="flex flex-col items-center text-center animate-fade-in-up">
                    <div className="relative mb-5">
                      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                        <FaCheckCircle className="text-green-500 text-4xl" />
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-green-200 flex items-center justify-center">
                        <FaWifi className="text-green-500 text-[10px]" />
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-base mb-1">Perangkat Terhubung</h3>
                    <p className="text-xs text-gray-400 font-medium mb-1">Nomor aktif</p>
                    <p className="font-mono text-sm font-bold text-gray-700 bg-gray-50 border border-gray-100 px-4 py-1.5 rounded-lg mb-6">
                      {status?.phoneNumber || config?.phone_number || '—'}
                    </p>

                    <button
                      onClick={handleLogout}
                      disabled={logoutBotMutation.isPending}
                      className="w-full py-2.5 px-4 rounded-xl border border-red-100 text-red-600 bg-red-50 hover:bg-red-100 font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <FaPlug className="text-xs" />
                      {logoutBotMutation.isPending ? 'Memutuskan...' : 'Putuskan Koneksi'}
                    </button>
                  </div>
                ) : (
                  /* ── QR State ── */
                  <div className="flex flex-col items-center animate-fade-in">

                    {/* Steps */}
                    <ol className="w-full space-y-2 mb-5 text-xs">
                      {[
                        'Buka WhatsApp di HP Anda',
                        'Pilih menu ⋮ → Perangkat Tertaut',
                        'Tautkan Perangkat → Scan QR',
                      ].map((step, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-0.5 w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-gray-500 leading-tight">{step}</span>
                        </li>
                      ))}
                    </ol>

                    {/* QR Frame */}
                    <div className="relative w-52 h-52 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-center overflow-hidden mb-4 shadow-inner">
                      {status?.qr_link ? (
                        <img
                          src={status.qr_link}
                          alt="Scan QR Code"
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-300 gap-2">
                          <FaSync className="animate-spin text-3xl text-indigo-300" />
                          <span className="text-xs text-gray-400">Membuat QR...</span>
                        </div>
                      )}
                      {/* Scan line animation */}
                      <div className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-70 animate-scan pointer-events-none" />
                      {/* Corner decorators */}
                      {['top-2 left-2','top-2 right-2','bottom-2 left-2','bottom-2 right-2'].map((pos, i) => (
                        <div key={i} className={`absolute ${pos} w-3 h-3 border-indigo-400 ${
                          i === 0 ? 'border-t-2 border-l-2 rounded-tl' :
                          i === 1 ? 'border-t-2 border-r-2 rounded-tr' :
                          i === 2 ? 'border-b-2 border-l-2 rounded-bl' :
                                    'border-b-2 border-r-2 rounded-br'
                        }`} />
                      ))}
                    </div>

                    {/* Countdown + Refresh row */}
                    <div className="w-full flex items-center justify-between mb-1">
                      {status?.qr_link && (
                        <QRCountdown
                          key={qrKey}
                          duration={status?.qr_duration || 30}
                          onExpired={handleRefreshQR}
                        />
                      )}
                      <button
                        onClick={handleRefreshQR}
                        disabled={isRefreshing || isLoadingStatus}
                        className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-colors disabled:opacity-40"
                      >
                        <FaSync className={`${isRefreshing ? 'animate-spin' : ''} text-[10px]`} />
                        {isRefreshing ? 'Memperbarui...' : 'Perbarui QR'}
                      </button>
                    </div>

                  </div>
                )}
              </div>
            </div>

            {/* ── Engine Status Card ── */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
              {/* Decorative blobs */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />

              <div className="relative z-10">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <FaShieldAlt className="text-indigo-300" /> Status Engine
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      label: 'Service Engine',
                      value: 'Aktif',
                      valueClass: 'bg-green-500/20 text-green-200 border border-green-500/30',
                    },
                    {
                      label: 'Koneksi WA',
                      value: isConnected ? 'Online' : 'Offline',
                      valueClass: isConnected
                        ? 'bg-green-500/20 text-green-200 border border-green-500/30'
                        : 'bg-red-500/20 text-red-200 border border-red-500/30',
                    },
                    {
                      label: 'Auto Reply',
                      value: watchedIsActive ? 'Menyala' : 'Mati',
                      valueClass: watchedIsActive
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                        : 'bg-white/10 text-white/60 border border-white/20',
                    },
                  ].map(({ label, value, valueClass }) => (
                    <div key={label} className="flex items-center justify-between text-sm border-b border-white/10 pb-2.5 last:border-0 last:pb-0">
                      <span className="text-indigo-200 text-xs">{label}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${valueClass}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ════ RIGHT: Configuration Form ════ */}
          <div className="lg:col-span-3">
            <form id="bot-config-form" onSubmit={handleSubmit(onSubmit)}>

              {/* General Settings */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                    <FaCogs className="text-blue-500" />
                    Identitas Bot
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Nama dan nomor utama yang digunakan bot ini.</p>
                </div>

                <div className="p-6 space-y-5">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 flex items-center gap-1.5 uppercase tracking-wide">
                      <FaRobot className="text-gray-400" /> Nama Bot
                    </label>
                    <input
                      {...register('name')}
                      placeholder="Contoh: CS Toko Keren"
                      className={`w-full px-4 py-3 rounded-xl border text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 flex items-center gap-1 animate-fade-in">
                        <FaExclamationCircle className="text-[10px]" /> {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 flex items-center gap-1.5 uppercase tracking-wide">
                      <FaPhoneAlt className="text-gray-400" /> Nomor Utama
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono border-r border-gray-200 pr-3">+</span>
                      <input
                        {...register('phone_number')}
                        placeholder="62812345678"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-mono bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none ${
                          errors.phone_number ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                      />
                    </div>
                    {errors.phone_number && (
                      <p className="text-xs text-red-500 flex items-center gap-1 animate-fade-in">
                        <FaExclamationCircle className="text-[10px]" /> {errors.phone_number.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Webhook Settings */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                    <FaGlobe className="text-emerald-500" />
                    Webhook & Integrasi
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Opsional</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Hubungkan ke server eksternal untuk balasan kustom.</p>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Webhook URL</label>
                    <input
                      {...register('webhook_url')}
                      placeholder="https://domain-anda.com/api/webhook"
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-mono bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none ${
                        errors.webhook_url ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                    {errors.webhook_url && (
                      <p className="text-xs text-red-500 flex items-center gap-1 animate-fade-in">
                        <FaExclamationCircle className="text-[10px]" /> {errors.webhook_url.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">Kosongkan jika tidak menggunakan server eksternal.</p>
                  </div>
                </div>
              </div>

              {/* Auto-Reply Toggle */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                    <FaBell className="text-amber-500" />
                    Perilaku Bot
                  </h2>
                </div>

                <div className="p-6">
                  <label
                    htmlFor="is_active"
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      watchedIsActive
                        ? 'border-indigo-200 bg-indigo-50/50'
                        : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="pt-0.5">
                      <input
                        id="is_active"
                        type="checkbox"
                        {...register('is_active')}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm">Aktifkan Auto-Reply & Broadcast</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Engine akan membaca pesan masuk dan mengirim balasan template secara otomatis. Sinkronisasi data untuk broadcast list juga akan aktif.
                      </p>
                    </div>
                    {watchedIsActive && (
                      <span className="shrink-0 mt-0.5 text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                        ON
                      </span>
                    )}
                  </label>
                </div>
              </div>

              {/* Unsaved changes hint */}
              {isDirty && (
                <div className="mt-4 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl animate-fade-in">
                  <FaExclamationCircle className="shrink-0" />
                  Ada perubahan yang belum disimpan. Klik <strong>Simpan</strong> di pojok kanan atas.
                </div>
              )}

            </form>
          </div>

        </div>
      </div>

      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes scan {
          0%   { top: -4px; }
          50%  { top: calc(100% + 4px); }
          100% { top: -4px; }
        }
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
          position: absolute;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.35s ease-out forwards; }
        .animate-fade-in    { animation: fadeInUp 0.25s ease-out forwards; }
      `}</style>
    </>
  );
};

export default BotConfigPage;