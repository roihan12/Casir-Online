import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMapPin, FiPhone, FiChevronRight, FiSearch } from "react-icons/fi";
import {LuStore} from "react-icons/lu";
import { useActiveBranches } from "../hooks/useCatalog";

const StoreFinderPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error } = useActiveBranches();

  const branches = data?.data || [];

  const filteredBranches = branches.filter((branch) =>
    branch.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.alamat?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white rounded-b-3xl shadow-sm pb-6 pt-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-700 opacity-20 transform -skew-y-12"></div>
        <div className="max-w-2xl mx-auto relative z-10 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <LuStore className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Pilih Cabang Toko</h1>
          <p className="text-indigo-100 text-sm">Temukan cabang terdekat dan mulai belanja online</p>
          
          {/* Search bar */}
          <div className="mt-8 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama toko atau kota..."
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all shadow-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800">Daftar Cabang</h2>
          <span className="text-sm font-medium text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
            {filteredBranches.length} Toko
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 flex gap-4 animate-pulse">
                <div className="w-16 h-16 bg-slate-200 rounded-xl flex-shrink-0"></div>
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-rose-100">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <LuStore className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Gagal Memuat Data</h3>
            <p className="text-slate-500">Silakan coba muat ulang halaman</p>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSearch className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Toko Tidak Ditemukan</h3>
            <p className="text-slate-500">Coba gunakan kata kunci pencarian yang lain.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBranches.map((branch) => (
              <Link
                key={branch.id}
                to={`/catalog/${branch.id}`}
                className="group block bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <LuStore className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {branch.nama}
                    </h3>
                    {branch.alamat && (
                      <p className="text-sm text-slate-500 mt-1 flex items-start gap-1">
                        <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{branch.alamat}</span>
                      </p>
                    )}
                    {branch.telepon && (
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                        <FiPhone className="w-3 h-3" />
                        {branch.telepon}
                      </p>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <FiChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer minimal */}
      <div className="text-center py-8 text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Casir-Online</p>
      </div>
    </div>
  );
};

export default StoreFinderPage;
