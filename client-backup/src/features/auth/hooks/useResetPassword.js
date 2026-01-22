import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import resetPasswordSchema from '../validation/ResetPasswordValidation';
import { resetPassword } from '../services/authService';

export const useResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenParam = queryParams.get('token');
    
    if (!tokenParam) {
      setTokenError('Token reset password tidak valid atau telah kadaluarsa');
    } else {
      setToken(tokenParam);
    }
  }, [location]);

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      form.reset();
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    },
  });

  const handleResetPassword = (data) => {
    if (!token) {
      setTokenError('Token reset password tidak valid atau telah kadaluarsa');
      return;
    }
    
    mutation.mutate({
      token,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
  };

  return {
    form,
    handleResetPassword,
    tokenError,
    isLoading: mutation.isLoading,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
};
