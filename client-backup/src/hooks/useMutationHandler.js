import { useState } from "react";
import { toast } from "react-hot-toast";

export const useMutationHandler = (mutation, options = {}) => {
  const {
    successMessage = "Operasi berhasil",
    errorMessage = "Terjadi kesalahan. Silakan coba lagi.",
    onSuccess,
    onError,
  } = options;

  const [isLoading, setIsLoading] = useState(false);

  const execute = async (...args) => {
    setIsLoading(true);
    let loadingToastId = toast.loading("Memproses...");

    try {
      const result = await mutation.mutateAsync(...args);
      toast.success(successMessage);
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (error) {
      toast.error(errorMessage);
      if (onError) {
        onError(error);
      }
      throw error;
    } finally {
      setIsLoading(false);
      toast.dismiss(loadingToastId);
    }
  };

  return {
    execute,
    isLoading,
    isError: mutation.isError,
    error: mutation.error,
  };
};
