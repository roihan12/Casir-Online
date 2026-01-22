import React from 'react';
import AuthHeader from '../components/AuthHeader';
import AuthFooter from '../components/AuthFooter';
import ForgotPasswordForm from '../components/ForgotPasswordForm';

const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-100 p-4">
      <div className="max-w-md w-full">
        <AuthHeader
          title="Lupa Password"
          subtitle="Masukkan email Anda untuk reset password"
        />
        
        <ForgotPasswordForm />

        <AuthFooter />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;