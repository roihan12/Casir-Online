import React from 'react';
import { Link } from 'react-router-dom';
import { FiPlayCircle, FiArrowRight } from 'react-icons/fi';

const Hero = () => {
  return (
    <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-gray-50/50">
      {/* Background Subtle Shapes */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
        <div className="w-[600px] h-[600px] rounded-full bg-blue-50/50 blur-3xl opacity-60" />
      </div>
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3">
        <div className="w-[500px] h-[500px] rounded-full bg-blue-50/50 blur-3xl opacity-60" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 shadow-sm text-sm font-medium text-indigo-700 mb-8 animate-fade-in-up">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Casir-Online POS System
        </div>
        
        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-gray-900 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Kelola Bisnis Ritel <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
            Lebih Modern & Cerdas
          </span>
        </h1>
        
        {/* Subtitle */}
        <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Sistem Point of Sale (POS) cerdas untuk manajemen kasir, pelacakan inventaris real-time, dan pemantauan multi-cabang. Tingkatkan omzet dari satu layar.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <a 
            href="https://github.com/ABSUKANGHUROYKI/Casir-Online" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 flex items-center justify-center gap-2 group hover:-translate-y-1"
          >
            Mulai Gunakan Gratis
            <FiArrowRight className="text-xl group-hover:translate-x-1 transition-transform" />
          </a>
          <Link 
            to="/login"
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-300 shadow-sm flex items-center justify-center gap-2 hover:-translate-y-1"
          >
            <FiPlayCircle className="text-xl text-indigo-600" />
            Lihat Demo Aplikasi
          </Link>
        </div>

        {/* Floating Mockup (Optional visualization) */}
        <div className="mt-20 mx-auto max-w-5xl relative animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="relative rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden aspect-[16/9]">
             {/* Fake UI Header */}
             <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="ml-4 h-4 w-32 bg-gray-200 rounded"></div>
             </div>
             {/* Fake Content Area */}
             <div className="p-8 grid grid-cols-4 gap-6 h-full bg-gray-50/50">
                <div className="col-span-1 border-r border-gray-100 pr-6 space-y-4">
                   <div className="h-8 w-full bg-gray-200 rounded-lg"></div>
                   <div className="h-8 w-2/3 bg-gray-200 rounded-lg"></div>
                   <div className="h-8 w-3/4 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="col-span-3 space-y-6">
                   <div className="flex gap-6">
                     <div className="h-32 w-1/3 bg-white shadow-sm border border-gray-100 rounded-xl"></div>
                     <div className="h-32 w-1/3 bg-indigo-50 shadow-sm border border-indigo-100 rounded-xl"></div>
                     <div className="h-32 w-1/3 bg-white shadow-sm border border-gray-100 rounded-xl"></div>
                   </div>
                   <div className="h-64 w-full bg-white shadow-sm border border-gray-100 rounded-xl"></div>
                </div>
             </div>
             
             {/* Gradient Overlay for polished look */}
             <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
