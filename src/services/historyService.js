import api from './api';

/**
 * History Service — Domain: Riwayat Data Satelit & Analisis
 * Endpoints: /api/history/*
 */

/** GET /api/history/ — Daftar riwayat pemrosesan data lahan */
export const getHistory = async () => {
  const response = await api.get('/api/history/');
  return response.data;
};
