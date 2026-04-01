import { create } from 'zustand';
import axios from 'axios';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('orbitani_token') || null,
  isAuthenticated: !!localStorage.getItem('orbitani_token'),
  isLoading: false,
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
    if (token) {
      try {
        const res = await api.get('/api/auth/me');
        set({ token, user: res.data, isAuthenticated: true });
      } catch (err) {
        localStorage.removeItem('orbitani_token');
        set({ token: null, user: null, isAuthenticated: false });
      }
    }
  },
}));

export default useAuthStore;
