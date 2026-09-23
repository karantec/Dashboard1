/* eslint-disable no-useless-concat */
// src/services/categoryService.js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://lifestyle-backend-lime.vercel.app/api' + '/category';

// 🔥 Category API
export const categoryApi = {
  // GET all categories
  getAll: async () => {
    const res = await fetch(API_BASE_URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    // Backend returns: { success, count, data: [...] }
    if (data.success && Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  },

  // GET by ID
  getById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/${id}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    return data.data || data;
  },

  // GET by name
  getByName: async (name) => {
    const res = await fetch(`${API_BASE_URL}/name/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    return data.data || data;
  },

  // POST — create (multipart/form-data with image)
  create: async (formData) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        // ⚠️ Do NOT set Content-Type — browser sets multipart boundary automatically
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },

  // PUT — update (multipart/form-data)
  update: async (id, formData) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },

  // DELETE
  delete: async (id) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },
};

// ─────────────────────────────────────────────
// Named exports (so existing imports keep working)
// ─────────────────────────────────────────────
export const getCategories = categoryApi.getAll;
export const getCategoryById = categoryApi.getById;
export const getCategoryByName = categoryApi.getByName;
export const createCategory = categoryApi.create;
export const updateCategory = categoryApi.update;
export const deleteCategory = categoryApi.delete;

export default {
  getCategories,
  getCategoryById,
  getCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
};
