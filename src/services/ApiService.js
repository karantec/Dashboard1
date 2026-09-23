// services/analyticsService.js
import API from './authService'; // reuses axios instance + token interceptor

export const analyticsService = {
  // ─── Full dashboard (everything in one call) ─────────────────
  getDashboard: async () => {
    const res = await API.get('/dashboard');
    return res.data.data;
  },

  // ─── Individual sections (for lazy loading) ──────────────────
  getOverview: async () => {
    const res = await API.get('/dashboard/overview');
    return res.data.data;
  },

  getRecentUsers: async (limit = 10) => {
    const res = await API.get('/dashboard/recent-users', { params: { limit } });
    return res.data.data;
  },

  getRecentProducts: async (limit = 10) => {
    const res = await API.get('/dashboard/recent-products', { params: { limit } });
    return res.data.data;
  },

  getLowStock: async (threshold = 5, limit = 20) => {
    const res = await API.get('/dashboard/low-stock', {
      params: { threshold, limit },
    });
    return res.data.data;
  },

  getCategoryBreakdown: async () => {
    const res = await API.get('/dashboard/category-breakdown');
    return res.data.data;
  },

  getTrends: async (days = 30) => {
    const res = await API.get('/dashboard/trends', { params: { days } });
    return res.data.data;
  },

  getRecentCartActivity: async (limit = 10) => {
    const res = await API.get('/dashboard/recent-cart-activity', {
      params: { limit },
    });
    return res.data.data;
  },
};

export default analyticsService;
