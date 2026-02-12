import React from 'react';
import Input from "../../common/Input";
import Button from "../../common/Button";
import Alert from "../../common/Alert";
import { Link } from 'react-router-dom';
import { useForgotPassword } from "../hooks/useForgotPassword";

const ForgotPasswordForm = () => {
  const { form, handleForgotPassword, isLoading, isSuccess, isError, error } = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      {isSuccess && (
        <Alert
          type="success"
          message="Instruksi reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam Anda."
        />
      )}

      {isError && (
        <Alert
          type="error"
          message={error?.message || 'Terjadi kesalahan. Silakan coba lagi.'}
        />
      )}

      {!isSuccess && (
        <form onSubmit={handleSubmit(handleForgotPassword)}>
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="Masukkan email Anda"
            {...register('email')}
            disabled={isLoading}
            error={errors.email?.message}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            disabled={isLoading}
          >
            Kirim Instruksi Reset
          </Button>
        </form>
      )}

      <div className="mt-4 text-center">
        <Link
          to="/login"
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          Kembali ke halaman login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
