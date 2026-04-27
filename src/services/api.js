import axios from 'axios';
import toast from 'react-hot-toast';

// Saat localhost, gunakan baseURL kosong agar Vite Proxy yang meng-forward request.
// Saat production (Vercel/Netlify), VITE_API_BASE_URL berisi URL Azure lengkap.
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
let baseURL = isLocalhost ? '' : (import.meta.env.VITE_API_BASE_URL || '');
if (baseURL.startsWith('http://') && !baseURL.includes('localhost') && !baseURL.includes('127.0.0.1')) {
  baseURL = baseURL.replace('http://', 'https://');
}

const api = axios.create({
  baseURL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Routes that must NEVER carry an Authorization header
const PUBLIC_ROUTES = ['/api/auth/login', '/api/auth/register'];

// Request interceptor — attach token (skip public routes)
api.interceptors.request.use(
  (config) => {
    const isPublic = PUBLIC_ROUTES.some((route) => config.url?.includes(route));
    if (!isPublic) {
      const token = localStorage.getItem('orbitani_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      delete config.headers.Authorization;
    }

    // BYOK: Attach custom Gemini API key if user has set one
    const customKey = localStorage.getItem('custom_gemini_key');
    if (customKey) {
      config.headers['X-Custom-Gemini-Key'] = customKey;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 & global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // 401 Unauthorized — force logout
    if (status === 401) {
      localStorage.removeItem('orbitani_token');
      delete axios.defaults.headers.common['Authorization'];

      try {
        const { default: useAuthStore } = require('../store/authStore');
        useAuthStore.getState().logout();
      } catch (_) {}

      const originalRequest = error.config;
      if (!originalRequest.url?.includes('/api/auth/login')) {
        toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // 429 Rate Limit — Global Countdown Interceptor
    if (status === 429) {
      const detail = error.response?.data?.detail;
      let retryAfter = parseInt(error.response?.headers['retry-after'] || detail?.retry_after_seconds || 60, 10);
      
      const toastId = toast.error(`⏳ Memuat AI... Harap tunggu ${retryAfter} detik.`, { duration: 5000 });
      
      const interval = setInterval(() => {
        retryAfter -= 1;
        if (retryAfter <= 0) {
          clearInterval(interval);
          toast.success('Siap memproses pertanyaan Anda!', { id: toastId });
        } else {
          toast.error(`⏳ Limit AI (429). Coba lagi dalam ${retryAfter} detik.`, { id: toastId, duration: 2000 });
        }
      }, 1000);
      
      return Promise.reject(error);
    }

    // 422 Unprocessable Entity — payload format error
    if (status === 422) {
      const detail = error.response?.data?.detail;
      let msg = 'Format data tidak valid.';
      if (Array.isArray(detail)) {
        msg = detail.map((e) => e.msg || e.message || JSON.stringify(e)).join('; ');
      } else if (typeof detail === 'string') {
        msg = detail;
      }
      const requestUrl = error.config?.url || '';
      if (!requestUrl.includes('/api/auth/')) {
        toast.error(msg);
      }
      return Promise.reject(error);
    }

    // 503 Service Unavailable — AI servers exhausted
    if (status === 503 || status === 500) {
      const requestUrl = error.config?.url || '';
      if (requestUrl.includes('/api/chat/')) {
        toast.error('🔄 Server sedang sibuk. Silakan coba kembali beberapa saat lagi.', {
          duration: 6000,
          style: { background: '#1c4234', color: '#fff' },
        });
        return Promise.reject(error);
      }
      // GEE live-fetch failure — silent so handleLahanClick can retry without params
      if (requestUrl.includes('/data')) {
        return Promise.reject(error);
      }
    }

    // All other errors — global toast (skip auth routes)
    const requestUrl = error.config?.url || '';
    const isAuthRoute = requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/register');
    if (!isAuthRoute) {
      const detail = error.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((e) => e.msg || e.message || JSON.stringify(e)).join('; ')
        : (typeof detail === 'string' ? detail : 'Terjadi kendala pada server.');
      if (!msg.includes('berada di luar Lahan')) {
        toast.error(msg);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
