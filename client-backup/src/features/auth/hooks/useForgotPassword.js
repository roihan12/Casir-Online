import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import forgotPasswordSchema from '../validation/ForgotPasswordValidation';
import { forgotPassword } from '../services/authService';

export const useForgotPassword = () => {
  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      form.reset();
    },
  });

  const handleForgotPassword = (data) => {
    mutation.mutate(data.email);
  };

  return {
    form,
    handleForgotPassword,
    isLoading: mutation.isLoading,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
};
