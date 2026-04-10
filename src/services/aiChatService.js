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
