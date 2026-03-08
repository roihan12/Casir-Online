import React from 'react';
import { FiCheckCircle, FiCode } from 'react-icons/fi';

const WhyCasirOnline = () => {
  return (
    <div className="py-24 bg-white/[0.02] border-y border-white/5 relative overflow-hidden" id="why">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-teal-500/10 blur-[100px] rounded-full -translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Didesain Untuk Semua</h2>
          <p className="text-lg text-gray-400">
            Arsitektur yang menguntungkan baik untuk merchant (pemilik toko) maupun untuk developer yang ingin berinovasi.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Untuk Merchant */}
          <div className="bg-indigo-900 border border-indigo-500/20 p-8 md:p-12 rounded-3xl relative">
            <div className="absolute top-0 right-0 p-8 opacity-20 text-6xl pointer-events-none">🏪</div>
            <h3 className="text-2xl font-semibold mb-6 text-indigo-300">Bagi Pemilik Bisnis</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <FiCheckCircle className="text-indigo-400 mt-1 flex-shrink-0" />
                <p className="text-gray-300 leading-relaxed">
                  <strong className="text-white block">Hemat Biaya Software</strong>
                  Tidak ada lagi biaya langganan bulanan atau biaya per outlet. Satu sistem untuk semua.
                </p>
              </li>
              <li className="flex items-start gap-4">
                <FiCheckCircle className="text-indigo-400 mt-1 flex-shrink-0" />
                <p className="text-gray-300 leading-relaxed">
                  <strong className="text-white block">Data Aman Sepenuhnya</strong>
                  Data transaksi dan pelanggan tidak tersimpan di server pihak ketiga, 100% kontrol di tangan Anda.
                </p>
              </li>
              <li className="flex items-start gap-4">
                <FiCheckCircle className="text-indigo-400 mt-1 flex-shrink-0" />
                <p className="text-gray-300 leading-relaxed">
                  <strong className="text-white block">Tumbuh Bersama Bisnis Anda</strong>
                  Dari satu toko lokal hingga rantai ritel besar cabang, sistem ini siap menskala.
                </p>
              </li>
            </ul>
          </div>

          {/* Untuk Developer */}
          <div className="bg-teal-900 border border-teal-500/20 p-8 md:p-12 rounded-3xl relative">
            <div className="absolute top-0 right-0 p-8 opacity-20 text-6xl pointer-events-none">💻</div>
            <h3 className="text-2xl font-semibold mb-6 text-teal-300">Bagi Developer</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <FiCode className="text-teal-400 mt-1 flex-shrink-0" />
                <p className="text-gray-300 leading-relaxed">
                  <strong className="text-white block">Arsitektur Service Layer</strong>
                  Codebase yang sangat rapi. Mudah bagi tim engineer untuk menambahkan inovasi dan mengaudit sistem.
                </p>
              </li>
              <li className="flex items-start gap-4">
                <FiCode className="text-teal-400 mt-1 flex-shrink-0" />
                <p className="text-gray-300 leading-relaxed">
                  <strong className="text-white block">Tech Stack Canggih</strong>
                  Mengejar tren industri dengan standar seperti React Router v7, React Query v5, Zod, Tailwind, dan Prisma.
                </p>
              </li>
              <li className="flex items-start gap-4">
                <FiCode className="text-teal-400 mt-1 flex-shrink-0" />
                <p className="text-gray-300 leading-relaxed">
                  <strong className="text-white block">Siap Modifikasi & Integrasi</strong>
                  REST API lengkap. Mudah diitegrasikan dengan ERP, sistem akuntansi eksternal, dan WhatsApp gateway.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhyCasirOnline;
