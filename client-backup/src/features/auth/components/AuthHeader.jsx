import React from 'react';

const AuthHeader = ({ title, subtitle, showLogo = true }) => {
  return (
    <div className="text-center mb-8">
      {showLogo && (
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-500 text-white text-2xl font-bold mb-4">
          K
        </div>
      )}
      <h1 className="text-2xl font-bold text-gray-800">
        {title}
      </h1>
      {subtitle && (
        <p className="text-gray-600 mt-1">{subtitle}</p>
      )}
    </div>
  );
};

export default AuthHeader;
