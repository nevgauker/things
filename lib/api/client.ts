import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export const api = axios.create({ baseURL, withCredentials: true });

// Attach token if stored (legacy). Now we rely on HttpOnly cookie; this remains for fallbacks.
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('auth_token');
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    // No auto-redirects
    return Promise.reject(error);
  }
);
