import React from 'react';
import PasswordInput from "../../common/PasswordInput";
import Button from "../../common/Button";
import Alert from "../../common/Alert";
import { Link } from 'react-router-dom';
import { useResetPassword } from "../hooks/useResetPassword";

const ResetPasswordForm = () => {
  const { form, handleResetPassword, tokenError, isLoading, isSuccess, isError, error } = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      {tokenError && (
        <Alert
          type="error"
          message={tokenError}
        />
      )}

      {isSuccess && (
        <Alert
          type="success"
          message="Password berhasil direset. Anda akan dialihkan ke halaman login dalam beberapa detik."
        />
      )}

      {isError && (
        <Alert
          type="error"
          message={error?.message || 'Terjadi kesalahan. Silakan coba lagi.'}
        />
      )}

      {!isSuccess && !tokenError && (
        <form onSubmit={handleSubmit(handleResetPassword)}>
          <PasswordInput
            id="password"
            label="Password Baru"
            placeholder="Masukkan password baru"
            {...register('password')}
            disabled={isLoading}
            error={errors.password?.message}
          />

          <PasswordInput
            id="confirmPassword"
            label="Konfirmasi Password"
            placeholder="Konfirmasi password baru"
            {...register('confirmPassword')}
            disabled={isLoading}
            error={errors.confirmPassword?.message}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            disabled={isLoading}
          >
            Reset Password
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

export default ResetPasswordForm;
