import React, { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

const QuickStart = () => {
  const [copied, setCopied] = useState(false);
  const installCode = `git clone https://github.com/roihan12/Casir-Online.git
cd casir-online
# Install dependensi frontend dan backend
npm install
# Setup database
cp .env.example .env
npx prisma migrate dev
# Jalankan secara lokal
npm run dev`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(installCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-24" id="quick-start">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Mulai dalam 3 Menit</h2>
        <p className="text-lg text-gray-400 mb-12">
          Hanya butuh beberapa baris perintah. Anda siap memiliki sistem kasir tingkat enterprise berbasis lokal yang bisa langsung diakses cabang Anda.
        </p>
        
        <div className="text-left bg-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-b border-white/5">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-xs font-mono text-gray-400">Terminal - bash</div>
            <div className="opacity-0 w-8"></div> {/* Spacer balance */}
          </div>
          <div className="p-6 relative">
            <button 
              onClick={copyToClipboard}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-all"
              title="Copy code"
            >
              {copied ? <FiCheck className="text-green-500" /> : <FiCopy />}
            </button>
            <pre className="text-sm font-mono text-gray-300 overflow-x-auto select-all">
              <code>{installCode}</code>
            </pre>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center gap-4">
          <a href="https://github.com/roihan12/Casir-Online/blob/main/readme.md" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-2 hover:underline">
            Baca Dokumentasi Penuh →
          </a>
        </div>
      </div>
    </div>
  );
};

export default QuickStart;
