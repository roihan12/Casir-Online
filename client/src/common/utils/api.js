import axios from "axios";

// Dapatkan API URL dari environment variable
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

// Buat instance axios dengan konfigurasi dasar
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Penting: aktifkan withCredentials untuk mendukung cookies
  withCredentials: true,
});

// Interceptor untuk response
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.log("from api.js");

    // Pastikan error.response ada untuk menghindari error
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login")
    ) {
      // Hapus session/localStorage jika ada
      localStorage.clear();
      sessionStorage.clear();

      // Redirect ke halaman login
      window.location.href = "/login";
    }

    // Tangani error jaringan
    if (!error.response) {
      console.error("Network Error:", error.message);
      // Opsional: Tambahkan logika retry atau notifikasi
    }

    return Promise.reject(error);
  }
);

export default api;
