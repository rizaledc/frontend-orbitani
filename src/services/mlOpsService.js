import api from './api';

/**
 * MLOps Service — Domain: Machine Learning Operations (Superadmin Only)
 * Endpoints: /api/admin/*
 */

/** GET /api/admin/feedback — Daftar seluruh ground-truth feedback */
export const getFeedbackList = async () => {
  const response = await api.get('/api/admin/feedback');
  return response.data;
};

/** POST /api/admin/feedback — Kirim feedback / ground-truth baru */
export const submitFeedback = async (feedbackData) => {
  const response = await api.post('/api/admin/feedback', feedbackData);
  return response.data;
};

/**
 * POST /api/admin/train-model — Trigger retraining model ML di background.
 * Timeout lebih panjang karena proses training bisa lama.
 */
export const triggerModelTraining = async () => {
  const response = await api.post('/api/admin/train-model', {}, { timeout: 120000 });
  return response.data;
};

/** GET /api/admin/llm-status — Status health-check seluruh LLM/AI engine */
export const getLLMStatus = async () => {
  const response = await api.get('/api/admin/llm-status');
  return response.data;
};
