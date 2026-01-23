import { useEffect } from "react";
import { toast } from "react-hot-toast";

export const useQueryErrorHandler = (error, isLoading, options = {}) => {
  const {
    showLoadingToast = false,
    showErrorToast = true,
    errorMessage = "Terjadi kesalahan. Silakan coba lagi.",
    loadingMessage = "Memuat data...",
  } = options;

  useEffect(() => {
    let loadingToastId;

    if (isLoading && showLoadingToast) {
      loadingToastId = toast.loading(loadingMessage);
    }

    if (error && showErrorToast) {
      toast.error(errorMessage);
    }

    return () => {
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
    };
  }, [
    error,
    isLoading,
    showLoadingToast,
    showErrorToast,
    errorMessage,
    loadingMessage,
  ]);

  return {
    isError: !!error,
    error,
    isLoading,
  };
};
