// src/services/ProductService.js
import axios from 'axios';

// Reads from Vite env, falls back to local backend
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://lifestyle-backend-lime.vercel.app/api';

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Attach admin token if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─────────────────────────────────────────────
// PRODUCT CRUD
// Routes: GET/POST /api/product
//         GET/PUT/DELETE /api/product/:id
// ─────────────────────────────────────────────

/**
 * GET /api/product
 * Optional filters become query params (e.g. { category, wholesalerId })
 */
export const getProduct = async (filters = {}) => {
  const qs = new URLSearchParams(filters).toString();
  const url = qs ? `/product?${qs}` : '/product';
  const res = await API.get(url);
  return res.data; // { success, count, data: [...] }
};

/**
 * GET /api/product/:id
 */
export const getProductById = async (id) => {
  const res = await API.get(`/product/${id}`);
  return res.data; // { success, data: {...} }
};

/**
 * POST /api/product
 * @param {FormData} formData — text fields + JSON arrays + `images` files
 * Axios auto-sets multipart boundary; do NOT set Content-Type manually.
 */
export const createProduct = async (formData) => {
  const res = await API.post('/product', formData);
  return res.data; // { success, message, data: {...} }
};

/**
 * PUT /api/product/:id
 * @param {FormData} formData — same shape as create, files optional
 */
export const updateProduct = async (id, formData) => {
  const res = await API.put(`/product/${id}`, formData);
  return res.data; // { success, message, data: {...} }
};

/**
 * DELETE /api/product/:id
 * Also removes associated Supabase media files (server-side).
 */
export const deleteProduct = async (id) => {
  const res = await API.delete(`/product/${id}`);
  return res.data; // { success, message }
};

// ─────────────────────────────────────────────
// TOGGLE ACTIVE
// No dedicated route exists, so we compose:
//   GET /:id  → read current `active`
//   PUT /:id  → send only { active: !current } as FormData
// The controller preserves every other field from the DB row.
// ─────────────────────────────────────────────
export const toggleProductStatus = async (productId) => {
  const currentRes = await getProductById(productId);
  const current = currentRes?.data || currentRes;
  const newActive = !current.active;

  const fd = new FormData();
  fd.append('active', String(newActive));

  const res = await API.put(`/product/${productId}`, fd);
  return res.data?.data || res.data; // has `.active`
};

// ─────────────────────────────────────────────
// DEFAULT EXPORT
// ─────────────────────────────────────────────
export default {
  getProduct,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
};
