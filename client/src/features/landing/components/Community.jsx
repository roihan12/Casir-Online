import React from 'react';
import { FiUsers, FiStar, FiHeart } from 'react-icons/fi';

const Community = () => {
  return (
    <div className="relative py-24 bg-gray-50 overflow-hidden" id="community">
      <div className="absolute left-0 bottom-0 -ml-20 -mb-20 w-80 h-80 bg-blue-200/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">Didukung Komunitas</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-16">
          Bergabunglah dengan pengembang dan pemilik bisnis kecil yang secara aktif ikut mereviu dan menyumbangkan kode agar Casir-Online menjadi ekosistem POS paling solid.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
            <FiStar className="text-4xl text-yellow-400 mx-auto mb-4 group-hover:scale-110 ease-out duration-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Beri Bintang di GitHub</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">Dukungan Anda menaikkan visibilitas project ini dan menarik lebih banyak kontributor ahli.</p>
            <a href="https://github.com/roihan12/Casir-Online" target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-sm font-semibold transition-all w-full md:w-auto">Beri Dukungan</a>
          </div>

          <div className="bg-white border border-indigo-100 p-8 rounded-3xl shadow-md hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group hover:-translate-y-1">
             <FiUsers className="text-4xl text-indigo-500 mx-auto mb-4 group-hover:scale-110 ease-out duration-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ikut Berkontribusi</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">Suka modifikasi sistem toko? Kami sangat terbuka untuk Pull Request fitur baru dan perbaikan bug.</p>
            <a href="https://github.com/roihan12/Casir-Online/pulls" target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm w-full md:w-auto">Upload Kode Anda</a>
          </div>

          <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
             <FiHeart className="text-4xl text-rose-500 mx-auto mb-4 group-hover:scale-110 ease-out duration-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Manfaatkan Gratis</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">Silakan download dan pakai untuk toko Anda. Bila butuh diskusi, laporkan melalui Forum/Issue.</p>
            <a href="https://github.com/roihan12/Casir-Online/issues" target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-sm font-semibold transition-all w-full md:w-auto">Laporkan Isu</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
