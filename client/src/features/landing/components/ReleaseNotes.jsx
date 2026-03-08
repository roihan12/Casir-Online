import React from 'react';
import { FiClock, FiPlusCircle, FiTool, FiZap } from 'react-icons/fi';

const ReleaseNotes = () => {
  const updates = [
    {
      version: 'v1.2.0',
      date: 'Maret 2026',
      badge: 'Major Update',
      badgeColor: 'bg-indigo-100 text-indigo-700',
      changes: [
        { type: 'feature', text: 'Integrasi WhatsApp Bot untuk order otomatis.', icon: <FiZap className="text-yellow-500" /> },
        { type: 'feature', text: 'Modul Absensi & Payroll Karyawan.', icon: <FiPlusCircle className="text-green-500" /> },
        { type: 'fix', text: 'Perbaikan bug pada kalkulasi diskon bertingkat.', icon: <FiTool className="text-gray-400" /> },
      ]
    },
    {
      version: 'v1.1.5',
      date: 'Februari 2026',
      badge: 'Patch',
      badgeColor: 'bg-gray-100 text-gray-700',
      changes: [
        { type: 'feature', text: 'Penambahan Driver Dashboard untuk melacak pengiriman.', icon: <FiPlusCircle className="text-green-500" /> },
        { type: 'fix', text: 'Optimasi query laporan kas agar lebih cepat 3x lipat.', icon: <FiTool className="text-gray-400" /> },
        { type: 'fix', text: 'Perbaikan UI pada tabel mutasi stok di mobile.', icon: <FiTool className="text-gray-400" /> },
      ]
    },
    {
      version: 'v1.0.0',
      date: 'Januari 2026',
      badge: 'Initial Release',
      badgeColor: 'bg-teal-100 text-teal-700',
      changes: [
        { type: 'feature', text: 'Rilis fitur inti Point of Sale (POS).', icon: <FiZap className="text-yellow-500" /> },
        { type: 'feature', text: 'Manajemen hak akses pengguna dan cabang.', icon: <FiPlusCircle className="text-green-500" /> },
      ]
    }
  ];

  return (
    <div className="relative py-24 bg-white overflow-hidden" id="updates">
      {/* Decorative gradient glow */}
      <div className="absolute right-0 top-1/3 -mr-20 w-72 h-72 bg-blue-100/40 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 px-4">
          <p className="text-indigo-600 font-semibold mb-3 tracking-wide uppercase text-sm">Changelog</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 tracking-tight">Cepat Tumbuh, Terus Mulus</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Casir-Online dikembangkan secara aktif. Kami selalu merilis fitur baru dan memperbarui sistem berdasarkan masukan para pengusaha.
          </p>
        </div>

        <div className="relative border-l-2 border-indigo-100 ml-3 md:ml-6 space-y-12 pb-8">
          {updates.map((update, idx) => (
            <div key={idx} className="relative pl-8 md:pl-10">
              {/* Timeline Dot */}
              <div className="absolute w-6 h-6 bg-white border-4 border-indigo-500 rounded-full -left-[13px] top-1"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{update.version}</h3>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${update.badgeColor}`}>
                    {update.badge}
                  </span>
                  <span className="flex items-center text-sm text-gray-500">
                    <FiClock className="mr-1.5" /> {update.date}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 shadow-sm">
                <ul className="space-y-4">
                  {update.changes.map((change, cIdx) => (
                    <li key={cIdx} className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0">
                        {change.icon}
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {change.text}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
           <a href="https://github.com/roihan12/Casir-Online/releases" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold group">
             Lihat Semua Pembaruan di GitHub 
             <span className="group-hover:translate-x-1 transition-transform">→</span>
           </a>
        </div>
      </div>
    </div>
  );
};

export default ReleaseNotes;
