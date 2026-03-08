import React from "react";
import AuthHeader from "../components/AuthHeader";
import AuthFooter from "../components/AuthFooter";
import LoginForm from "../components/LoginForm";
import LoginHelp from "../components/LoginHelp";
import { FaBoxes } from "react-icons/fa";
import { MdOutlinePointOfSale } from "react-icons/md";
import { TbReportAnalytics } from "react-icons/tb";

const LoginPage = () => {
  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-900 flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Decorative subtle circles - solid color, low opacity, NO gradients */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-800 opacity-50 blur-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-indigo-950 opacity-40 blur-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-white text-indigo-900 p-2 rounded-lg">
              <MdOutlinePointOfSale className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Casir Online</span>
          </div>

          <h1 className="text-5xl font-extrabold leading-tight mb-6 mt-16">
            Kelola Bisnis Anda<br />
            Lebih <span className="text-indigo-300">Mudah</span> & <span className="text-indigo-300">Efisien</span>
          </h1>
          <p className="text-indigo-100 text-lg max-w-md mb-12 leading-relaxed">
            Sistem Point of Sale multi-cabang terpadu untuk mengelola penjualan, inventaris, dan laporan bisnis Anda dalam satu platform.
          </p>

          <div className="grid grid-cols-1 gap-6 max-w-md">
            <div className="flex items-center gap-4 bg-indigo-800/40 p-4 rounded-xl border border-indigo-700/50 backdrop-blur-sm">
              <div className="bg-indigo-700 p-3 rounded-lg text-indigo-100">
                 <FaBoxes className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Manajemen Stok</h3>
                <p className="text-indigo-200 text-sm">Pantau inventaris real-time di semua cabang</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-indigo-300 text-sm font-medium">
          &copy; {new Date().getFullYear()} Casir Online. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 bg-gray-50 lg:bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 text-white p-2 rounded-lg">
                <MdOutlinePointOfSale className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-gray-900">Casir Online</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl lg:shadow-none lg:bg-transparent lg:border-none p-8 lg:p-0 border border-gray-100">
            <AuthHeader
              title="Selamat Datang"
              subtitle="Silakan masuk ke akun Anda untuk melanjutkan"
              showLogo={false} 
            />
            
            <div className="mt-8">
              <LoginForm />
            </div>

            <LoginHelp />
          </div>
          
          <div className="mt-8 lg:hidden text-center">
            <AuthFooter />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;