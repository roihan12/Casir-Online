import React from 'react';
import AuthHeader from '../components/AuthHeader';
import AuthFooter from '../components/AuthFooter';
import ResetPasswordForm from '../components/ResetPasswordForm';

const ResetPasswordPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-100 p-4">
      <div className="max-w-md w-full">
        <AuthHeader
          title="Reset Password"
          subtitle="Buat password baru untuk akun Anda"
        />
        
        <ResetPasswordForm />

        <AuthFooter />
      </div>
    </div>
  );
};

export default ResetPasswordPage;