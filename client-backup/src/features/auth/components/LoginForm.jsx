import React from 'react';
import Input from "../../common/Input";
import PasswordInput from "../../common/PasswordInput";
import Button from "../../common/Button";
import Alert from "../../common/Alert";
import { useLogin } from "../hooks/useLogin";

const LoginForm = () => {
  const { form, login, isLoading, authError } = useLogin();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;

  const usernameValue = watch("username");
  const passwordValue = watch("password");
  const isFormValid = usernameValue && passwordValue;

  return (
    <>
      {(authError || errors.root?.serverError) && (
        <Alert
          type="error"
          message={authError || errors.root?.serverError?.message}
        />
      )}

      <form onSubmit={handleSubmit(login)}>
        <Input
          id="username"
          label="Username"
          placeholder="Masukkan username"
          {...register("username")}
          disabled={isLoading}
          error={errors.username?.message}
        />

        <PasswordInput
          id="password"
          label="Password"
          placeholder="Masukkan password"
          {...register("password")}
          disabled={isLoading}
          forgotPasswordLink="/forgot-password"
          error={errors.password?.message}
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
          disabled={isLoading || !isFormValid}
          className={
            !isFormValid
              ? "cursor-not-allowed opacity-70"
              : ""
          }
        >
          Masuk
        </Button>
      </form>
    </>
  );
};

export default LoginForm;
