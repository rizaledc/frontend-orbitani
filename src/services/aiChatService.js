import api from './api';

/**
 * AI Chat Service — Domain: Pakar AI Agronomist
 * Endpoints: /api/chat/*
 * Note: Timeout diperbesar karena pipeline AI (GEE + ML + Gemini) bisa 10-30 detik.
 */
const AI_TIMEOUT = 60000;

/** POST /api/chat/ask — Tanya jawab umum ke AI */
export const sendQuickChat = async (message) => {
  const response = await api.post('/api/chat/ask', { message }, { timeout: AI_TIMEOUT });
  return response.data;
};

/** POST /api/chat/analyze-lahan — Analisis lahan spesifik (pipeline penuh: GEE → ML → Gemini) */
export const analyzeLahan = async (message, lahanId) => {
  const response = await api.post('/api/chat/analyze-lahan', { message, lahan_id: lahanId }, { timeout: AI_TIMEOUT });
  return response.data;
};

/** GET /api/chat/sessions — List all user multi-sessions */
export const fetchChatSessions = async () => {
  const response = await api.get('/api/chat/sessions');
  return response.data.data;
};

/** GET /api/chat/history — Fetch specific session history */
export const fetchChatHistory = async (sessionId) => {
  const url = sessionId ? `/api/chat/history?session_id=${sessionId}` : '/api/chat/history';
  const response = await api.get(url);
  return response.data.data;
};

/** POST /api/chat/history — Simpan satu pesan obrolan ke session */
export const saveChatMessage = async (role, content, sessionId = null, sessionTitle = null) => {
  const payload = { role, content };
  if (sessionId) payload.session_id = sessionId;
  if (sessionTitle) payload.session_title = sessionTitle;
  
  const response = await api.post('/api/chat/history', payload);
  return response.data;
};

/** PATCH /api/chat/sessions/{id} — Rename a session */
export const updateSessionTitle = async (sessionId, newTitle) => {
  const response = await api.patch(`/api/chat/sessions/${sessionId}`, { session_title: newTitle });
  return response.data;
};

/** DELETE /api/chat/sessions/{id} — Delete an entire session */
export const deleteChatSession = async (sessionId) => {
  const response = await api.delete(`/api/chat/sessions/${sessionId}`);
  return response.data;
};
