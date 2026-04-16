import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  getUsers: () => api.get('/auth/users')
};

export const conversationsAPI = {
  getAll: (params) => api.get('/conversations', { params }),
  getOne: (id) => api.get(`/conversations/${id}`),
  getMessages: (id, params) => api.get(`/conversations/${id}/messages`, { params }),
  sendMessage: (id, data) => api.post(`/conversations/${id}/messages`, data),
  addNote: (id, data) => api.post(`/conversations/${id}/notes`, data),
  assign: (id, data) => api.put(`/conversations/${id}/assign`, data),
  updateStatus: (id, data) => api.put(`/conversations/${id}/status`, data),
  search: (params) => api.get('/conversations/search', { params }),
  getSuggestions: (id, data) => api.post(`/conversations/${id}/suggest`, data)
};

export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getOne: (id) => api.get(`/customers/${id}`),
  update: (id, data) => api.put(`/customers/${id}`, data),
  addTag: (id, data) => api.post(`/customers/${id}/tags`, data),
  removeTag: (id, tagId) => api.delete(`/customers/${id}/tags/${tagId}`)
};

export const phoneNumbersAPI = {
  getAll: () => api.get('/phone-numbers'),
  getOne: (id) => api.get(`/phone-numbers/${id}`),
  connect: (data) => api.post('/phone-numbers', data),
  getCertificate: (id) => api.get(`/phone-numbers/${id}/certificate`),
  register: (id, data) => api.post(`/phone-numbers/${id}/register`, data),
  requestCode: (id, data) => api.post(`/phone-numbers/${id}/request-code`, data),
  verifyCode: (id, data) => api.post(`/phone-numbers/${id}/verify-code`, data),
  remove: (id) => api.delete(`/phone-numbers/${id}`)
};

export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getMessagesPerDay: () => api.get('/analytics/messages-per-day'),
  getTopAgents: () => api.get('/analytics/top-agents'),
  getResponseTimes: () => api.get('/analytics/response-times')
};

export const templatesAPI = {
  getAll: (params) => api.get('/templates', { params }),
  create: (data) => api.post('/templates', data),
  remove: (id) => api.delete(`/templates/${id}`),
  send: (id, data) => api.post(`/templates/${id}/send`, data)
};

export const tagsAPI = {
  getAll: () => api.get('/messages/tags'),
  create: (data) => api.post('/messages/tags', data),
  remove: (id) => api.delete(`/messages/tags/${id}`)
};

export const aiAPI = {
  suggestReply: (data) => api.post('/messages/suggest-reply', data),
  detectIntent: (data) => api.post('/messages/detect-intent', data)
};

export default api;
