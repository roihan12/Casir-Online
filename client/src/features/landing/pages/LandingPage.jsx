import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import TechStack from '../components/TechStack';
import Features from '../components/Features';
import ScreenshotShowcase from '../components/ScreenshotShowcase';
import OpenSourceAdvantage from '../components/OpenSourceAdvantage';
import ReleaseNotes from '../components/ReleaseNotes';
import Community from '../components/Community';
import { FiHeart } from 'react-icons/fi';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header />
      
      <main>
        <Hero />
        <TechStack />
        <Features />
        
        <ScreenshotShowcase />
        
        {/* Replace WhyCasirOnline and QuickStart with OpenSourceAdvantage */}
        <OpenSourceAdvantage />

        <ReleaseNotes />
        
        <Community />
      </main>
      
      {/* Modern Cleaner Footer */}
      <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
               <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  C
                </div>
                <span className="font-bold text-xl text-gray-900">Casir-Online</span>
              </div>
              <p className="text-gray-500 max-w-sm leading-relaxed mb-6">
                Memberdayakan pemilik usaha ritel kecil dan menengah dengan teknologi Point of Sale tanpa batas, transparan, dan dapat dikustomisasi.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Aplikasi</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-500 hover:text-indigo-600 transition-colors">Fitur POS</a></li>
                <li><a href="#features" className="text-gray-500 hover:text-indigo-600 transition-colors">Integrasi Inventaris</a></li>
                <li><a href="#features" className="text-gray-500 hover:text-indigo-600 transition-colors">Modul Absensi</a></li>
                <li><a href="#updates" className="text-gray-500 hover:text-indigo-600 transition-colors">Changelog & Update</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Sistem Terbuka</h4>
              <ul className="space-y-3">
                 <li><a href="https://github.com/ABSUKANGHUROYKI/Casir-Online" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-indigo-600 transition-colors">Kode Sumber (GitHub)</a></li>
                 <li><a href="https://github.com/ABSUKANGHUROYKI/Casir-Online/issues" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-indigo-600 transition-colors">Laporkan Masalah</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Casir-Online. Dibuka untuk umum dengan dedikasi tinggi.
            </p>
            <p className="text-gray-400 text-sm flex items-center gap-1">
              Dibuat dengan <FiHeart className="text-red-500" /> oleh Komunitas Pengembang
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
