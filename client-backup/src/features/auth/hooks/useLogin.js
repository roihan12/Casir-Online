import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import loginSchema from "../validation/LoginValidation";

/**
 * useLogin - Hook for handling login form and submission
 * 
 * Handles:
 * - Form state management with react-hook-form
 * - Login API call via AuthContext
 * - Navigation after successful login
 * - Error handling
 */
export const useLogin = () => {
  const { login, isLoading: authLoading, error: authError } = useAuth();
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const {
    setError,
    formState: { isSubmitting },
  } = form;

  /**
   * Handle login form submission
   */
  const handleLogin = async (data, event) => {
    try {
      event?.preventDefault?.();

      // Call login from useAuth - returns { success, redirectTo } or { success: false, error }
      const result = await login(data.username, data.password);

      if (result.success) {
        // Navigate to the smart redirect path based on user permissions
        navigate(result.redirectTo || '/dashboard', { replace: true });
      } else {
        // Handle login failure
        setError("root.serverError", {
          type: "manual",
          message: result.error || "Terjadi kesalahan saat login. Silakan coba lagi.",
        });
      }

    } catch (err) {
      console.error("Login failed:", err.message);
      
      setError("root.serverError", {
        type: "manual",
        message: err.message || "Terjadi kesalahan saat login. Silakan coba lagi.",
      });
      
      return false;
    }
  };

  return {
    form,
    login: handleLogin,
    isLoading: authLoading || isSubmitting,
    authError,
  };
};

export default useLogin;
