import api from "./api";

const AuthService = {
  login: async (username, password) => {
    try {
      // Panggil API login
      const response = await api.post("/auth/login", { username, password });

      // Tidak perlu menyimpan token di localStorage karena
      // cookies akan dihandle otomatis oleh browser

      // Kembalikan data user
      return response.data.data.user;
    } catch (error) {
      // Improve error handling by checking for different error structures
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || "Login failed");
      }
      throw new Error(error.message || "Login failed - Network error");
    }
  },

  logout: async () => {
    try {
      // Panggil API logout untuk menghapus cookie di server
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    }
  },

  checkAuth: async () => {
    try {
      // Endpoint untuk mengecek status autentikasi
      const response = await api.get("/auth/profile");

      return response.data.data.user;
    } catch (error) {
      // This includes cases where the auth token is missing or invalid
      console.error("Auth check error:", error);
      return null;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put("/auth/profile", profileData);

      // Assume response structure with success flag and user data
      if (response.data.data && response.data.data.user) {
        return response.data.data.user;
      }

      throw new Error(response.data.message || "Gagal memperbarui profil");
    } catch (error) {
      throw error;
    }
  },

  // Update user profile with avatar
  updateProfileWithAvatar: async (formData) => {
    try {
      const response = await api.put("/auth/profile/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Assume response structure with success flag and user data
      if (response.data.data && response.data.data.user) {
        return response.data.data.user;
      }

      throw new Error(response.data.message || "Gagal memperbarui profil");
    } catch (error) {
      throw error;
    }
  },

  // Request password reset
  // ... existing code ...
};

export default AuthService;
