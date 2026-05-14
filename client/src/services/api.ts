import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

/**
 * Cliente HTTP base do STARZ.
 * - baseURL '/api' usa o proxy do Vite em dev e o próprio servidor em prod.
 * - Adiciona automaticamente o JWT do authStore.
 * - Em 401, faz logout e redireciona para /login.
 */
export const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
