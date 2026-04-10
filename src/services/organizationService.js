import api from './api';

export const getOrganizations = async () => {
  const response = await api.get('/api/organizations/');
  return response.data;
};

export const createOrganization = async (payload) => {
  const response = await api.post('/api/organizations/', payload);
  return response.data;
};

export const deleteOrganization = async (orgId) => {
  const response = await api.delete(`/api/organizations/${orgId}`);
  return response.data;
};

export const getOrganizationUsers = async (orgId) => {
  // Assuming the structure is /api/organizations/{orgId}/users based on the handover
  const response = await api.get(`/api/organizations/${orgId}/users`);
  return response.data;
};
