// src/services/authService.js
import axios from 'axios';

const API = axios.create({
  // 👇 use env var so switching to production is just an .env change
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://lifestyle-backend-lime.vercel.app/api',
});

// ----------------------------------------------------------------------
// REQUEST INTERCEPTOR (Attach token)
// ----------------------------------------------------------------------
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------------------------------------------------------------
// RESPONSE INTERCEPTOR (Handle 401 globally)
// ----------------------------------------------------------------------
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — kick back to login
      localStorage.removeItem('adminToken');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------------
// AUTH APIs
// ----------------------------------------------------------------------
export const adminLogin = async (email, password) => {
  const res = await API.post('/admin/login', { email, password });
  // res.data = { success, message, token, data: { _id, name, email, role } }
  return res.data;
};

export const getAdminProfile = async () => {
  const res = await API.get('/admin/profile');
  return res.data;
};

// ----------------------------------------------------------------------
// DASHBOARD APIs
// ----------------------------------------------------------------------
export const getDashboard = async () => {
  const res = await API.get('/dashboard');
  return res.data;
};

// ----------------------------------------------------------------------
// USERS APIs
// ----------------------------------------------------------------------
export const getAllUsers = async () => {
  const res = await API.get('/admin/users');
  return res.data;
};

export default API;
