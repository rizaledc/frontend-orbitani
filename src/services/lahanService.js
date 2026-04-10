import api from './api';

/**
 * Lahan Service — Domain: Eksplorasi Lahan & Analitik
 * Endpoints: /api/lahan/*
 */

/** GET /api/lahan/ — Daftar seluruh lahan milik tenant */
export const getAllLahan = async () => {
  const response = await api.get('/api/lahan/');
  return response.data;
};

/** POST /api/lahan/ — Tambah lahan baru (GeoJSON Polygon) */
export const createLahan = async (lahanData) => {
  const response = await api.post('/api/lahan/', lahanData);
  return response.data;
};

/**
 * GET /api/lahan/{lahanId}/data — Data satelit/analisis per lahan.
 * Jika `lat` & `lon` disertakan, backend akan melakukan live fetch ke GEE (latensi tinggi).
 */
export const getLahanData = async (lahanId, params = {}) => {
  const response = await api.get(`/api/lahan/${lahanId}/data`, { params, timeout: 60000 });
  return response.data;
};

/** GET /api/lahan/analytics — Time-series data (Recharts-ready array) */
export const getLahanAnalytics = async () => {
  const response = await api.get('/api/lahan/analytics');
  return response.data;
};
