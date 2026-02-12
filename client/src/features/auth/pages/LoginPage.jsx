import React from "react";
import AuthHeader from "../components/AuthHeader";
import AuthFooter from "../components/AuthFooter";
import LoginForm from "../components/LoginForm";
import LoginHelp from "../components/LoginHelp";

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-100 p-4">
      <div className="max-w-md w-full">
        <AuthHeader
          title="KasirKu Multi Cabang"
          subtitle="Masuk ke akun Anda"
        />
        
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <LoginForm />
          <LoginHelp />
        </div>

        <AuthFooter />
      </div>
    </div>
  );
};

export default LoginPage;