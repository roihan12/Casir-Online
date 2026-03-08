import React from 'react';
import { FiCheckCircle, FiShield, FiTrendingUp } from 'react-icons/fi';

const OpenSourceAdvantage = () => {
  return (
    <div className="relative py-24 bg-gradient-to-br from-blue-50/30 via-white to-sky-50/30 overflow-hidden" id="mengapa">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-100/30 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-sky-100/30 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
              Aman, Gratis, dan <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">Terbuka Untuk Semua</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Casir-Online bukan sekadar software langganan. Kami percaya infrastruktur kasir dan operasional toko harus menjadi milik pengusaha seutuhnya, tanpa biaya tak terduga setiap bulannya.
            </p>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl">
                  <FiTrendingUp />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Tanpa Biaya Lisensi</h4>
                  <p className="text-gray-600">Gunakan sistem POS premium ini sepenuhnya gratis. Tambah ribuan kasir, cabang, atau jutaan item tanpa biaya tambahan.</p>
                </div>
              </div>
              <div className="flex gap-4">
                 <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl">
                  <FiShield />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Privasi Super Ketat</h4>
                  <p className="text-gray-600">Karena ini sistem open-source (self-host), database transaksi dan pelanggan tidak mengalir ke server perusahaan asing. Anda adalah pemilik sah datanya.</p>
                </div>
              </div>
              <div className="flex gap-4">
                 <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl">
                  <FiCheckCircle />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Bebas Customisasi</h4>
                  <p className="text-gray-600">Tim programmer Anda bebas mengubah logo, fitur, hingga alur kasir sesuai dengan SOP (Standard Operating Procedure) bisnis ritel Anda sendiri.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 relative">
             <div className="absolute inset-0 bg-indigo-600 rounded-3xl transform rotate-3 scale-105 opacity-10"></div>
             <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative z-10">
               <h3 className="text-2xl font-bold text-gray-900 mb-6">Siap Menguasai Industri Ritel?</h3>
               <p className="text-gray-600 mb-8">
                 Kami ingin melihat lebih banyak bisnis kecil & menengah beralih dari buku catatan manual ke sistem manajemen digital tanpa harus bangkrut membayar lisensinya. 
               </p>
               <a href="https://github.com/ABSUKANGHUROYKI/Casir-Online" target="_blank" rel="noopener noreferrer" className="block w-full text-center px-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                 Kunjungi Repositori Kami
               </a>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OpenSourceAdvantage;
