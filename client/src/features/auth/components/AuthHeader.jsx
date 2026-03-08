import React from 'react';
import { MdOutlinePointOfSale } from 'react-icons/md';

const AuthHeader = ({ title, subtitle, showLogo = true }) => {
  return (
    <div className="text-left">
      {showLogo && (
        <div className="inline-flex flex-col mb-6">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-sm">
                <MdOutlinePointOfSale className="w-7 h-7" />
             </div>
             <span className="text-2xl font-bold text-gray-900 tracking-tight">Casir Online</span>
          </div>
        </div>
      )}
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-gray-500 mt-2 text-sm md:text-base font-medium">{subtitle}</p>
      )}
    </div>
  );
};

export default AuthHeader;
