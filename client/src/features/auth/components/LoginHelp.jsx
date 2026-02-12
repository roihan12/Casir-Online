import React from 'react';

const LoginHelp = () => {
  return (
    <div className="mt-6 text-center text-sm text-gray-600">
      <p>Untuk demo, gunakan:</p>
      <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-left">
        <div className="bg-gray-50 p-2 rounded">
          <p>
            <strong>Super Admin:</strong> superadmin / superadmin
          </p>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <p>
            <strong>Admin Cabang:</strong> admincabang / admincabang
          </p>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <p>
            <strong>Kasir:</strong> kasir / kasir
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginHelp;
