import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.detail || error.message || 'Terjadi kesalahan jaringan';
    return Promise.reject(new Error(msg));
  }
);

export default api;

// ── Named helpers ────────────────────────────────────────────────────────────
export const predictPerformance = (payload) => api.post('/predict/', payload);
export const chatConsultation   = (payload) => api.post('/consultation/chat', payload);
export const getStats           = ()        => api.get('/stats/');
export const getOptimalSchedule = ()        => api.get('/management/schedule/optimal-hours');
export const suggestThumbnail   = (payload) => api.post('/management/thumbnail/suggest', payload);
export const getDrafts          = ()        => api.get('/management/drafts');
export const createDraft        = (payload) => api.post('/management/drafts', payload);
export const updateDraft        = (id, payload) => api.put(`/management/drafts/${id}`, payload);
export const deleteDraft        = (id)      => api.delete(`/management/drafts/${id}`);
export const getYoutubeVideos   = ()        => api.get('/stats/youtube-videos');
export const syncYoutubeVideo   = (idOrUrl) => api.get(`/stats/youtube-sync?video_id_or_url=${encodeURIComponent(idOrUrl)}`);

