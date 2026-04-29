import api from './api';

/**
 * Lahan Service — Domain: Eksplorasi Lahan & Analitik
 * Endpoints: /api/lahan/*
 */

/**
 * GET /api/lahan/ — Daftar seluruh lahan milik tenant.
 *
 * Response unwrapping chain:
 *   axios:   response.data          → { status: "success", data: [...] }
 *   service: response.data.data     → [ ...array lahan... ]   ← this is what the store receives
 */
export const getAllLahan = async () => {
  const response = await api.get('/api/lahan/');
  // response.data      = the parsed JSON body   { status, data: [...] }
  // response.data.data = the actual lahan array  [...]
  return response.data.data || [];
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
  const response = await api.get(`/lahan/${lahanId}/data`, { params, timeout: 60000 });
  return response.data;
};

/** GET /api/lahan/analytics — Time-series data (Recharts-ready array) */
export const getLahanAnalytics = async () => {
  const response = await api.get('/api/lahan/analytics');
  return response.data;
};

/** DELETE /api/lahan/{lahanId} — Hapus lahan */
export const deleteLahan = async (lahanId) => {
  const response = await api.delete(`/api/lahan/${lahanId}`);
  return response.data;
};

/** PUT /api/lahan/{lahanId} — Update nama, keterangan lahan */
export const updateLahan = async (lahanId, lahanData) => {
  const response = await api.put(`/api/lahan/${lahanId}`, lahanData);
  return response.data;
};

/**
 * POST /api/lahan/{lahanId}/analyze — Trigger spatial AI analysis (polygon-based).
 * Generates 10 random points inside the polygon, runs the ML recommendation model,
 * and returns the updated LahanOut with `hasil_rekomendasi` and `terakhir_dianalisis`.
 * Timeout set to 90s — ML + Gemini pipeline can be slow.
 */
export const analyzeLahanSpatial = async (lahanId) => {
  const response = await api.post(`/api/lahan/${lahanId}/analyze`, {}, { timeout: 90000 });
  // Unwrap backend envelope if it exists: { status: "success", data: {...lahan} }
  return response.data?.data || response.data;
};

