import api from './api';

// AI endpoints need longer timeout (Gemini responds in 15-30s)
const AI_TIMEOUT = 60000;

export const sendQuickChat = async (message) => {
  try {
    const response = await api.post('/api/chat/ask', { message }, { timeout: AI_TIMEOUT });
    return response.data;
  } catch (error) {
    console.error('Detail Error Chat:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
};

export const analyzeLahan = async (lahanId) => {
  try {
    const response = await api.post('/api/chat/analyze-lahan', { lahan_id: lahanId }, { timeout: AI_TIMEOUT });
    return response.data;
  } catch (error) {
    console.error('Detail Error Analisis:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
};
