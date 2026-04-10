import api from './api';

/**
 * Human Chat Service — Domain: Live Chat Antar Pengguna
 * Endpoints: /api/chat-live/*
 */

/** GET /api/chat-live/contacts — Daftar kontak yang bisa diajak chat */
export const getContacts = async () => {
  const response = await api.get('/api/chat-live/contacts');
  return response.data;
};

/** GET /api/chat-live/messages/{contactId} — Riwayat pesan dengan kontak tertentu */
export const getMessages = async (contactId) => {
  const response = await api.get(`/api/chat-live/messages/${contactId}`);
  return response.data;
};

/** POST /api/chat-live/messages — Kirim pesan baru */
export const sendMessage = async (payload) => {
  const response = await api.post('/api/chat-live/messages', payload);
  return response.data;
};
