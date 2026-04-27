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

/**
 * GET /api/history/?lahan_id={lahanId} — History rows for a specific lahan.
 * Falls back to fetching all and filtering client-side if the query param
 * isn't supported by the backend yet.
 *
 * Returns the raw array of history rows (already unwrapped).
 */
export const getHistoryByLahan = async (lahanId) => {
  try {
    // Try server-side filter first (most efficient)
    const response = await api.get('/api/history/', { params: { lahan_id: lahanId } });
    const data = response.data?.data ?? response.data ?? [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};
