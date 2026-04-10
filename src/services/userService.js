import api from './api';

/**
 * User Service — Domain: Kelola Pengguna (Admin)
 * Endpoints: /api/users/*
 */

/** GET /api/users/ — Daftar seluruh user dalam organisasi */
export const getUsers = async () => {
  const response = await api.get('/api/users/');
  return response.data;
};

/** GET /api/users/stats — Statistik ringkasan pengguna */
export const getUserStats = async () => {
  const response = await api.get('/api/users/stats');
  return response.data;
};

/** PUT /api/users/{userId}/role — Ubah role pengguna */
export const updateUserRole = async (userId, roleData) => {
  const response = await api.put(`/api/users/${userId}/role`, roleData);
  return response.data;
};

/** PUT /api/users/{userId}/organization — Pindahkan pengguna ke organisasi lain */
export const updateUserOrganization = async (userId, orgData) => {
  const response = await api.put(`/api/users/${userId}/organization`, orgData);
  return response.data;
};

/** DELETE /api/users/{userId} — Hapus akun pengguna */
export const deleteUser = async (userId) => {
  const response = await api.delete(`/api/users/${userId}`);
  return response.data;
};
