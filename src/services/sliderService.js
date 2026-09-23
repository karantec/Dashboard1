// src/services/sliderService.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://lifestyle-backend-lime.vercel.app';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Attach admin token if present
api.interceptors.request.use((req) => {
  const token =
    localStorage.getItem('adminToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// GET /api/slider — public
export const getSlider = async () => {
  const res = await api.get('/api/slider');
  return res.data;
};

// PUT /api/slider — replace entire slider (bulk)
export const updateSlider = async (payload) => {
  const res = await api.put('/api/slider', payload);
  return res.data;
};

// PATCH /api/slider/toggle
export const toggleSliderActive = async () => {
  const res = await api.patch('/api/slider/toggle', {});
  return res.data;
};

// POST /api/slider/slides
export const addSlide = async (slide) => {
  const res = await api.post('/api/slider/slides', slide);
  return res.data;
};

// PUT /api/slider/slides/:slideId
export const updateSlide = async (slideId, updates) => {
  const res = await api.put(`/api/slider/slides/${slideId}`, updates);
  return res.data;
};

// DELETE /api/slider/slides/:slideId
export const deleteSlide = async (slideId) => {
  const res = await api.delete(`/api/slider/slides/${slideId}`);
  return res.data;
};
