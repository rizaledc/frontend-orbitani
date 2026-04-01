import api from './api';

export const getAllLahan = async () => {
  const response = await api.get('/api/lahan/');
  return response.data;
};

export const createLahan = async (lahanData) => {
  const response = await api.post('/api/lahan/', lahanData);
  return response.data;
};

export const getLahanData = async (lahanId) => {
  const response = await api.get(`/api/lahan/${lahanId}/data`);
  return response.data;
};
