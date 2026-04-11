import { create } from 'zustand';
import toast from 'react-hot-toast';
import axios from 'axios';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('orbitani_token') || null,
  isAuthenticated: !!localStorage.getItem('orbitani_token'),
  isLoading: true,
  error: null,

  login: (userData, token) => {
    localStorage.setItem('orbitani_token', token);
    set({ user: userData, token, isAuthenticated: true, error: null });
  },

  logout: () => {
    localStorage.removeItem('orbitani_token');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  initializeAuth: async () => {
    const token = localStorage.getItem('orbitani_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }
    
    try {
      const res = await api.get('/api/auth/me');
      set({ token, user: res.data, isAuthenticated: true, isLoading: false });
    } catch (err) {
      if (err.message === 'Network Error' || err.name === 'TypeError' || err.code === 'ERR_NETWORK') {
        toast.error('Koneksi otentikasi gagal. Jika Anda menggunakan Brave atau Adblocker, mohon matikan fitur Shields untuk domain ini agar fitur berjalan normal.', { duration: 8000 });
      }
      localStorage.removeItem('orbitani_token');
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export default useAuthStore;
