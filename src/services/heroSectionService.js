// src/services/heroSectionService.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://lifestyle-backend-lime.vercel.app';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach admin token if present (matches SliderPage's adminToken convention,
// falls back to other common keys).
api.interceptors.request.use((req) => {
  const token =
    localStorage.getItem('adminToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

const ROUTES = {
  root: '/api/hero-section/',
  toggle: '/api/hero-section/toggle',
};

export const heroSectionService = {
  /** GET /api/hero-section — public */
  getHero: async () => {
    const res = await api.get(ROUTES.root);
    return res.data;
  },

  /** PUT /api/hero-section — replace entire hero */
  updateHero: async (payload) => {
    const res = await api.put(ROUTES.root, payload);
    return res.data;
  },

  /** PATCH /api/hero-section — merge only the keys you send */
  patchHero: async (partial) => {
    const res = await api.patch(ROUTES.root, partial);
    return res.data;
  },

  /** PATCH /api/hero-section/toggle — flip is_active */
  toggleActive: async () => {
    const res = await api.patch(ROUTES.toggle, {});
    return res.data;
  },
};

export default api;
