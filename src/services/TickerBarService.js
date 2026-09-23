// src/services/TickerBarService.js
import axios from 'axios';

// ─────────────────────────────────────────────
// Backend base URL — reads from Vite env, falls back to localhost:8000
// Set VITE_API_URL in your .env when deploying.
// ─────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'https://lifestyle-backend-lime.vercel.app';

// ─────────────────────────────────────────────
// Paths must match routes/tickerBar.routes.js EXACTLY.
// Router is mounted at app.use("/api/ticker-bar", ...)
// ─────────────────────────────────────────────
const ROUTES = {
  root: '/api/ticker-bar/', // GET, PUT
  toggle: '/api/ticker-bar/toggle', // PATCH
  items: '/api/ticker-bar/items', // POST
  item: (id) => `/api/ticker-bar/items/${id}`, // PUT, DELETE
};

// ─────────────────────────────────────────────
// Shared axios instance
// ─────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send auth cookies cross-origin
  headers: { 'Content-Type': 'application/json' },
});

// ─────────────────────────────────────────────
// Attach Bearer token if present.
// Works alongside cookie auth — if your backend uses cookies only,
// the token lookup silently does nothing.
// ─────────────────────────────────────────────
api.interceptors.request.use((req) => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken');

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// ─────────────────────────────────────────────
// Optional: surface auth errors clearly.
// 401/403 responses bubble up with a helpful message so the
// component's snackbar shows something meaningful.
// ─────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[TickerBarService] 401 Unauthorized — check your admin token or login state.');
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
// Public
// ─────────────────────────────────────────────

/**
 * GET /api/ticker-bar
 * Fetch the ticker bar config (items + isActive).
 * No auth required — safe to call from the storefront.
 */
export const getTickerBar = async () => {
  const res = await api.get(ROUTES.root);
  return res.data; // { items, isActive } or { success, data: {...} }
};

// ─────────────────────────────────────────────
// Protected (Admin)
// ─────────────────────────────────────────────

/**
 * PUT /api/ticker-bar
 * Replace the whole ticker (items + isActive flag).
 * @param {{ items: Array, isActive: boolean }} payload
 */
export const updateTickerBar = async (payload) => {
  const res = await api.put(ROUTES.root, payload);
  return res.data;
};

/**
 * PATCH /api/ticker-bar/toggle
 * Flip the isActive flag on the server.
 * Sends an empty object body so some Express JSON parsers don't choke.
 */
export const toggleActive = async () => {
  const res = await api.patch(ROUTES.toggle, {});
  return res.data;
};

/**
 * POST /api/ticker-bar/items
 * Add a single ticker item.
 * @param {{ text: string, link?: string, order?: number, isActive?: boolean }} payload
 */
export const addItem = async (payload) => {
  const res = await api.post(ROUTES.items, payload);
  return res.data;
};

/**
 * PUT /api/ticker-bar/items/:itemId
 * Update a ticker item by ID.
 */
export const updateItem = async (itemId, payload) => {
  if (!itemId) throw new Error('updateItem: itemId is required');
  const res = await api.put(ROUTES.item(itemId), payload);
  return res.data;
};

/**
 * DELETE /api/ticker-bar/items/:itemId
 * Delete a ticker item by ID.
 */
export const deleteItem = async (itemId) => {
  if (!itemId) throw new Error('deleteItem: itemId is required');
  const res = await api.delete(ROUTES.item(itemId));
  return res.data;
};

export default api;
