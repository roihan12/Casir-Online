import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import * as authService from "../features/auth/services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Use ref to store information about last auth check
  const lastCheckRef = useRef(0);
  const authCheckedRef = useRef(false);
  const CHECK_INTERVAL = 30000; // 30 seconds

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Function to check if user is authenticated
  const checkAuth = useCallback(async () => {
    // Only check auth if we're not already loading
    if (isLoading) return;

    // Check if we already tried recently
    const now = Date.now();
    if (authCheckedRef.current && now - lastCheckRef.current < CHECK_INTERVAL) {
      console.log("Auth checked recently, using cached result");
      return;
    }

    setIsLoading(true);

    try {
      const userData = await authService.checkAuth();

      if (userData && userData.id) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      lastCheckRef.current = now;
      authCheckedRef.current = true;
    }
  }, [isLoading]);

  // Login function
  const login = async (username, password) => {
    if (!username || !password) {
      setError("Username dan password harus diisi");
      return Promise.reject(new Error("Username dan password harus diisi"));
    }

    // setIsLoading(true);
    setError("");

    try {
      const userData = await authService.login(username, password);

      if (!userData || !userData.id) {
        throw new Error("Invalid user data received");
      }

      setUser(userData);
      setIsAuthenticated(true);
      lastCheckRef.current = Date.now();
      authCheckedRef.current = true;

      // Clear any auth-related queries
      queryClient.invalidateQueries("auth");

      // Make sure to set loading to false before redirecting
      setIsLoading(false);

      // Navigate based on role
      redirectBasedOnRole(userData);

      return userData;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Login gagal";

      // Set the error state
      setError(errorMessage);

      // Make sure loading is set to false
      setIsLoading(false);

      // Then throw the error to be caught in the component
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      lastCheckRef.current = 0;
      authCheckedRef.current = false;

      // Clear any auth-related queries
      queryClient.invalidateQueries("auth");

      toast.success("Anda telah berhasil logout");
      navigate("/login", { replace: true });
    }
  };

  // Helper function to redirect based on user role
  const redirectBasedOnRole = (userData) => {
    const userRole = getUserRole(userData);

    if (userRole === "super_admin") {
      navigate("/superadmin/dashboard", { replace: true });
    } else if (userRole === "admin_cabang") {
      navigate("/admincabang/dashboard", { replace: true });
    } else if (userRole === "kasir") {
      navigate("/kasir/dashboard", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  // Helper functions
  const getUserRole = (userData = user) => {
    return (
      userData?.userRoles?.[0]?.role?.namaRole ||
      userData?.roles?.[0]?.namaRole ||
      userData?.role ||
      null
    );
  };

  // Check if user has a specific permission
  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    
    // Super admin bypass
    const userRole = getUserRole();
    if (userRole === "super_admin") return true;
    
    if (!user.permissions) return false;
    return user.permissions.includes(permission);
  }, [user, getUserRole]);

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((permissions = []) => {
    if (!user) return false;
    
    // Super admin bypass
    const userRole = getUserRole();
    if (userRole === "super_admin") return true;
    
    if (!user.permissions) return false;
    return permissions.some(p => user.permissions.includes(p));
  }, [user, getUserRole]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        error,
        setError: clearError,
        login,
        logout,
        isAuthenticated,
        getUserRole,
        getPrimaryCabang,
        hasRole,
        hasPermission,
        hasAnyPermission,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
