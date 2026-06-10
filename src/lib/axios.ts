import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación y rate limiting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (error.response?.status === 429) {
      // Demasiadas peticiones
      const msg = error.response?.data?.error || 'Demasiadas peticiones, espera un momento e intenta de nuevo';
      console.warn('⚠️ Rate limit alcanzado:', msg);
      // Notificar al usuario si existe toast global, si no con alert
      if (typeof window !== 'undefined' && (window as any).__notifyRateLimit) {
        (window as any).__notifyRateLimit(msg);
      }
    }
    return Promise.reject(error);
  }
);