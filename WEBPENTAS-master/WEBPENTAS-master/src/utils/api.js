import axios from 'axios';
import { clearSession, getToken } from './auth';

// Ubah lewat file .env frontend: VITE_API_URL=http://alamat-server:5000
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: API_URL });

// Sertakan token login di setiap request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Jika sesi habis/tidak valid, arahkan kembali ke halaman login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      clearSession();
      alert('Sesi Anda telah berakhir, silakan login kembali.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error, fallback = 'Terjadi kesalahan, silakan coba lagi') =>
  error.response?.data?.error || error.response?.data?.message || fallback;

export const PLACEHOLDER_IMAGE = '/placeholder.svg';

export const fasilitasImageUrl = (filename) =>
  filename ? `${API_URL}/uploads/fasilitas/${encodeURIComponent(filename)}` : PLACEHOLDER_IMAGE;

// Dokumen surat dilindungi, token dikirim lewat query karena dibuka di tab/iframe
export const dokumenUrl = (filename) =>
  `${API_URL}/uploads/${encodeURIComponent(filename)}?token=${encodeURIComponent(getToken() || '')}`;

export const handleImageError = (e) => {
  e.target.onerror = null;
  e.target.src = PLACEHOLDER_IMAGE;
};

export default api;
